import { getAISettings, saveAISettings, SupportedGeminiModel } from './aiSettingsStorage';
import { getSerializedSystemPromptContext } from './contextPackager';
import {
  CognitiveDelta,
  CognitiveDeltaSchema,
  ParsedAtlasAction,
  GEMINI_COGNITIVE_DELTA_RESPONSE_SCHEMA,
  ROUTINE_COGNITIVE_DELTA_RESPONSE_SCHEMA,
} from './types';
import { tokenizeMedicalInput, TokenizerMatchResult } from './localTokenizer';
import { resolveSubject } from './intentParser';
import { rateLimiter } from './rateLimiter';
import { fastContentHash, normalizePromptForCache, getCachedAIResponse, setCachedAIResponse } from './aiCache';
import { executeLocalMedicalCognitiveEngine } from './atlasLocalCognitiveEngine';

export type CognitiveLoad = 'routine' | 'clinical' | 'analytical';

export interface GeminiClientOptions {
  bypassLocalTokenizer?: boolean;
  bypassCache?: boolean;
  cognitiveLoad?: CognitiveLoad;
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
 * Execute raw Gemini API call with rate limiter, token cap & tailored schema
 */
async function callGeminiApi(
  model: SupportedGeminiModel,
  apiKey: string,
  systemInstruction: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  schema: any = GEMINI_COGNITIVE_DELTA_RESPONSE_SCHEMA,
  maxOutputTokens = 800,
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
        maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: schema,
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
    const cleanRule = ruleCandidate.replace(/^\s.:,-+|\s.:,-+$/g, '').trim();
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
 * Tier A: Instant Local Tokenizer (<5ms, 0 Tokens)
 * Tier B: Resilient & Token-Optimized Gemini Cloud Compiler
 */
export async function executeCognitiveCompiler(
  userInput: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: GeminiClientOptions = {}
): Promise<CognitiveExecutionResult> {
  const startTime = performance.now();
  const input = userInput.trim();

  // -------------------------------------------------------------
  // TIER A: Instant Local Tokenizer Check (<5ms, 0 Tokens)
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
  const cognitiveLoad = options.cognitiveLoad || 'clinical';
  const isRoutine = cognitiveLoad === 'routine';
  const settings = getAISettings();
  if (!settings.preferredModel) {
    throw new Error("No AI model selected. Please visit Settings to select an active model.");
  }
  let activeModel: any = settings.preferredModel;

  // Normalized prompt hashing for superior cache reuse
  const normalizedPrompt = normalizePromptForCache(input);
  const cacheKey = fastContentHash(`${normalizedPrompt}_${activeModel}`);
  if (!options.bypassCache) {
    const cached = getCachedAIResponse<CognitiveDelta>(cacheKey);
    if (cached) {
      const action = await convertDeltaToAction(cached, input);
      return {
        delta: { ...cached, latencyMs: performance.now() - startTime },
        action,
        modelUsed: activeModel,
        latencyMs: performance.now() - startTime,
        source: 'HYBRID',
      };
    }
  }

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

  // If circuit breaker is tripped on primary model, fallback immediately
  if (isCircuitTripped()) {
    activeModel = 'gemini-3.1-flash-lite';
  }

  // Dynamic context packager: generates ultra-compact system instructions for routine load
  const systemInstruction = await getSerializedSystemPromptContext(isRoutine);

  // Response schema & output token limits tailored to workload
  const responseSchema = isRoutine
    ? ROUTINE_COGNITIVE_DELTA_RESPONSE_SCHEMA
    : GEMINI_COGNITIVE_DELTA_RESPONSE_SCHEMA;
  const maxOutputTokens = isRoutine ? 256 : 800;

  // Build message history: sliding window (2 turns for routine, 4 turns for clinical)
  // Strip large JSON / markdown code from prior assistant turns to prevent token bloat
  const historyTurns = isRoutine ? -2 : -4;
  const contents = conversationHistory.slice(historyTurns).map((msg) => {
    let cleanText = msg.content;
    if (msg.role === 'assistant') {
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.executiveSummary) cleanText = parsed.executiveSummary;
      } catch {
        cleanText = cleanText.replace(/```json\s\S*?```/g, '').trim() || msg.content;
      }
    }
    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: cleanText }],
    };
  });

  contents.push({
    role: 'user',
    parts: [{ text: input }],
  });

  let rawData: any;

  try {
    rawData = await callGeminiApi(
      activeModel,
      apiKey,
      systemInstruction,
      contents,
      responseSchema,
      maxOutputTokens,
      options.maxRetries ?? 2
    );
  } catch (err: any) {
    // If Model not found (404) or persistent rate limit, execute fallback switch
    if (err.message?.includes('403') || err.message?.includes('400') || err.message?.includes('API_KEY_INVALID')) { throw new Error('API Key invalid or quota exceeded. Please check your AI Studio settings.'); }
    if (err.message?.startsWith('MODEL_NOT_FOUND') || err.message?.includes('429') || err.message?.includes('503')) {
      try {
        const fallbackModel: any = 'gemini-flash';
        activeModel = fallbackModel;

        rawData = await callGeminiApi(
          fallbackModel,
          apiKey,
          systemInstruction,
          contents,
          responseSchema,
          maxOutputTokens,
          1
        );
      } catch (fallbackErr) {
        console.warn('GeminiClient Cloud fallback failed, executing local cognitive compiler:', fallbackErr);
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
      console.warn('GeminiClient Cloud API failed, executing local cognitive compiler:', err);
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

export async function generateClinicalSyllabus(
  targetExam: string,
  focusAreas: string,
  apiKey: string
): Promise<any> {
  const systemInstruction = `You are an expert medical curriculum designer. 
Generate a comprehensive but highly-curated syllabus for the ${targetExam} focusing on ${focusAreas}.

Each KnowledgeNode MUST map its 'subjectIds' to one or more of these 19 Anchor Hubs:
'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine', 'Preventive & Social Medicine', 'ENT', 'Ophthalmology', 'General Medicine', 'General Surgery', 'Obstetrics & Gynecology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Anesthesiology'



  { "id": "uuid-here", "name": "Topic Name", "type": "Concept", "subjectIds": "Pathology", "General Medicine", "tags": "#HighYield" }

`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: "Generate the syllabus now." }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid generation");
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to generate syllabus", err);
    throw err;
  }
}
