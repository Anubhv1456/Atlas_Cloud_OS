import { getAISettings, saveAISettings, SupportedGeminiModel } from './aiSettingsStorage';
import { getSerializedSystemPromptContext } from './contextPackager';
import {
  CognitiveDelta,
  CognitiveDeltaSchema,
  ParsedAtlasAction,
  GEMINI_COGNITIVE_DELTA_RESPONSE_SCHEMA,
} from './types';
import { tokenizeMedicalInput, TokenizerMatchResult } from './localTokenizer';
import { resolveSubject } from './intentParser';
import { rateLimiter } from './rateLimiter';
import { fastContentHash, getCachedAIResponse, setCachedAIResponse } from './aiCache';
import { executeLocalMedicalCognitiveEngine } from './atlasLocalCognitiveEngine';

export interface GeminiClientOptions {
  bypassLocalTokenizer?: boolean;
  bypassCache?: boolean;
  modelOverride?: SupportedGeminiModel;
  maxRetries?: number;
}

export interface CognitiveExecutionResult {
  delta: CognitiveDelta;
  action?: ParsedAtlasAction | null;
  modelUsed: SupportedGeminiModel | 'LOCAL_TOKENIZER';
  latencyMs: number;
  source: 'LOCAL_TOKENIZER' | 'GEMINI_CLOUD' | 'HYBRID';
}

// Circuit Breaker State (in-memory per session)
interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  cooldownPeriodMs: number;
  isTripped: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failureCount: 0,
  lastFailureTime: 0,
  cooldownPeriodMs: 30000, // 30s cooldown after repeated failures
  isTripped: false,
};

function recordCircuitFailure() {
  circuitBreaker.failureCount += 1;
  circuitBreaker.lastFailureTime = Date.now();
  if (circuitBreaker.failureCount >= 3) {
    circuitBreaker.isTripped = true;
  }
}

function recordCircuitSuccess() {
  circuitBreaker.failureCount = 0;
  circuitBreaker.isTripped = false;
}

function isCircuitTripped(): boolean {
  if (!circuitBreaker.isTripped) return false;
  // Check if cooldown expired
  if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.cooldownPeriodMs) {
    circuitBreaker.isTripped = false;
    circuitBreaker.failureCount = 0;
    return false;
  }
  return true;
}

/**
 * Sleep helper for exponential backoff with jitter
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));

/**
 * Execute raw Gemini API call with rate limiter & dual-auth header fallback
 */
async function callGeminiApi(
  model: SupportedGeminiModel,
  apiKey: string,
  systemInstruction: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  maxRetries = 3
): Promise<any> {
  const cleanKey = apiKey.trim();

  return rateLimiter.executeWithBackoff(async () => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    
    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_COGNITIVE_DELTA_RESPONSE_SCHEMA,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      recordCircuitSuccess();
      return await response.json();
    }

    if (response.status === 429 || response.status === 503) {
      recordCircuitFailure();
      const err: any = new Error(`HTTP ${response.status}: Rate limit / Overloaded`);
      err.status = response.status;
      throw err;
    }

    if (response.status === 404) {
      throw new Error(`MODEL_NOT_FOUND:${model}`);
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${response.status} ${response.statusText}`);
  }, maxRetries);
}

/**
 * Transforms a verified CognitiveDelta into a standard ParsedAtlasAction
 */
export async function convertDeltaToAction(
  delta: CognitiveDelta,
  fallbackInput: string
): Promise<ParsedAtlasAction | null> {
  if (delta.intent === 'ACTION_LOG_STUDY' && delta.studyDelta) {
    const s = delta.studyDelta;
    const resolved = await resolveSubject(s.subjectName || delta.targetSubjectName || 'General Medicine');
    return {
      action: 'ACTION_LOG_STUDY',
      subjectId: resolved.id,
      subjectName: resolved.name,
      systemName: s.systemName || 'Core Review',
      durationMinutes: s.durationMinutes > 0 ? s.durationMinutes : 45,
      confidenceLevel: s.confidenceLevel || 'MED',
      topicsStudied: s.topicsStudied || delta.subtopicTaxonomy || '',
    };
  }

  if (delta.intent === 'ACTION_ADD_MISTAKE' && (delta.distillation || delta.executiveSummary)) {
    const d = delta.distillation;
    const resolved = await resolveSubject(delta.targetSubjectName || 'General Medicine');
    const ruleCandidate = (d?.twentyNotebookRule || d?.hingeConcept || delta.executiveSummary || fallbackInput || '').trim();

    // Guard against empty strings, punctuation only, or single words compiled erroneously
    const cleanRule = ruleCandidate.replace(/^[\s.:,-]+|[\s.:,-]+$/g, '').trim();
    if (!cleanRule || cleanRule.length < 4 || cleanRule.split(/\s+/).length < 2) {
      return null;
    }

    return {
      action: 'ACTION_ADD_MISTAKE',
      subjectId: resolved.id,
      subjectName: resolved.name,
      systemName: delta.subtopicTaxonomy || d?.tag || '',
      tag: d?.tag || 'General Pearl',
      ruleText: cleanRule,
      isUrgent: !!d?.isUrgent,
      errorType: 'concept',
      keyTakeaway: cleanRule,
      clinicalTrigger: d?.clinicalTrigger || '',
      source: 'Custom',
    };
  }

  if (delta.intent === 'ACTION_RECORD_SCORE' && delta.scoreDelta) {
    const sc = delta.scoreDelta;
    const total = sc.totalMarks > 0 ? sc.totalMarks : 200;
    return {
      action: 'ACTION_RECORD_SCORE',
      testName: sc.testName || 'Practice Grand Test',
      score: sc.score,
      totalMarks: total,
      weakSubjects: sc.weakSubjects || [],
      notes: sc.notes || delta.executiveSummary || '',
    };
  }

  if (delta.intent === 'CLINICAL_QUERY' || delta.intent === 'KNOWLEDGE_DISTILLATION') {
    return null;
  }

  return null;
}

/**
 * Primary Unified Execution Function for Atlas Clinical AI
 * Tier A: Instant Local Tokenizer (<5ms)
 * Tier B: Resilient Gemini Cloud Compiler with fallback & backoff
 */
export async function executeCognitiveCompiler(
  userInput: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: GeminiClientOptions = {}
): Promise<CognitiveExecutionResult> {
  const startTime = performance.now();
  const input = userInput.trim();

  // -------------------------------------------------------------
  // TIER A: Instant Local Tokenizer Check (<5ms)
  // -------------------------------------------------------------
  if (!options.bypassLocalTokenizer) {
    const localMatch: TokenizerMatchResult = tokenizeMedicalInput(input);
    if (localMatch.matched && localMatch.delta && localMatch.action) {
      return {
        delta: localMatch.delta,
        action: localMatch.action,
        modelUsed: 'LOCAL_TOKENIZER',
        latencyMs: localMatch.latencyMs,
        source: 'LOCAL_TOKENIZER',
      };
    }
  }

  // -------------------------------------------------------------
  // TIER B: Resilient Cloud Gemini Compiler
  // -------------------------------------------------------------
  const cacheKey = fastContentHash(`${input}_${options.modelOverride || 'default'}`);
  if (!options.bypassCache) {
    const cached = getCachedAIResponse<CognitiveDelta>(cacheKey);
    if (cached) {
      const action = await convertDeltaToAction(cached, input);
      return {
        delta: { ...cached, latencyMs: performance.now() - startTime },
        action,
        modelUsed: (options.modelOverride || 'gemini-3.1-flash-lite') as SupportedGeminiModel,
        latencyMs: performance.now() - startTime,
        source: 'HYBRID',
      };
    }
  }

  const settings = getAISettings();
  const apiKey = settings.geminiApiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '';

  // If no cloud API key configured or AI turned off, seamlessly route to Atlas Local Cognitive Engine
  if (!apiKey || settings.isAiEnabled === false) {
    const localResult = await executeLocalMedicalCognitiveEngine(input, conversationHistory);
    return {
      delta: localResult.delta,
      action: localResult.action || null,
      modelUsed: 'LOCAL_TOKENIZER',
      latencyMs: performance.now() - startTime,
      source: 'LOCAL_TOKENIZER',
    };
  }

  let activeModel: SupportedGeminiModel = options.modelOverride || settings.selectedModel;

  // If circuit breaker is tripped on primary model, fallback immediately
  if (isCircuitTripped()) {
    activeModel = activeModel === 'gemini-3.1-flash-lite' ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite';
  }

  const systemInstruction = await getSerializedSystemPromptContext();

  // Build message history (sliding window capped at 4 turns to conserve tokens)
  const contents = conversationHistory.slice(-4).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: input }],
  });

  let rawData: any;

  try {
    rawData = await callGeminiApi(activeModel, apiKey, systemInstruction, contents, options.maxRetries ?? 2);
  } catch (err: any) {
    // If Model not found (404) or persistent rate limit, execute fallback switch
    if (err.message?.startsWith('MODEL_NOT_FOUND') || err.message?.includes('429')) {
      try {
        const fallbackModel: SupportedGeminiModel =
          activeModel === 'gemini-3.1-flash-lite' ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite';
        
        saveAISettings({ selectedModel: fallbackModel });
        activeModel = fallbackModel;

        rawData = await callGeminiApi(
          fallbackModel,
          apiKey,
          systemInstruction,
          contents,
          1
        );
      } catch (fallbackErr) {
        console.warn('[GeminiClient] Cloud fallback failed, executing local cognitive compiler:', fallbackErr);
        const localResult = await executeLocalMedicalCognitiveEngine(input, conversationHistory);
        return {
          delta: localResult.delta,
          action: localResult.action || null,
          modelUsed: 'LOCAL_TOKENIZER',
          latencyMs: performance.now() - startTime,
          source: 'LOCAL_TOKENIZER',
        };
      }
    } else {
      console.warn('[GeminiClient] Cloud API failed, executing local cognitive compiler:', err);
      const localResult = await executeLocalMedicalCognitiveEngine(input, conversationHistory);
      return {
        delta: localResult.delta,
        action: localResult.action || null,
        modelUsed: 'LOCAL_TOKENIZER',
        latencyMs: performance.now() - startTime,
        source: 'LOCAL_TOKENIZER',
      };
    }
  }

  const rawJsonText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJsonText) {
    const localResult = await executeLocalMedicalCognitiveEngine(input, conversationHistory);
    return {
      delta: localResult.delta,
      action: localResult.action || null,
      modelUsed: 'LOCAL_TOKENIZER',
      latencyMs: performance.now() - startTime,
      source: 'LOCAL_TOKENIZER',
    };
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawJsonText);
  } catch {
    const localResult = await executeLocalMedicalCognitiveEngine(input, conversationHistory);
    return {
      delta: localResult.delta,
      action: localResult.action || null,
      modelUsed: 'LOCAL_TOKENIZER',
      latencyMs: performance.now() - startTime,
      source: 'LOCAL_TOKENIZER',
    };
  }

  // Validate with Zod
  const zodResult = CognitiveDeltaSchema.safeParse({
    ...parsedJson,
    source: 'GEMINI_CLOUD',
    latencyMs: performance.now() - startTime,
  });

  const delta: CognitiveDelta = zodResult.success
    ? zodResult.data
    : {
        intent: parsedJson.intent || 'NONE',
        confidenceScore: 0.85,
        targetSubjectId: 'SUB_11',
        targetSubjectName: parsedJson.targetSubjectName || 'General Medicine',
        subtopicTaxonomy: parsedJson.subtopicTaxonomy || '',
        executiveSummary: parsedJson.executiveSummary || rawJsonText,
        distillation: parsedJson.distillation,
        studyDelta: parsedJson.studyDelta,
        scoreDelta: parsedJson.scoreDelta,
        source: 'GEMINI_CLOUD',
        latencyMs: performance.now() - startTime,
      };

  // Cache response for future instant retrieval
  setCachedAIResponse(cacheKey, delta, activeModel);

  const action = await convertDeltaToAction(delta, input);

  return {
    delta,
    action,
    modelUsed: activeModel,
    latencyMs: performance.now() - startTime,
    source: 'GEMINI_CLOUD',
  };
}
