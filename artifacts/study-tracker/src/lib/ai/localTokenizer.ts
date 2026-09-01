import { CognitiveDelta, ParsedAtlasAction, MistakeTag, ConfidenceLevel } from './types';
import { STANDARD_MEDICAL_SUBJECTS } from './intentParser';
import { MEDICAL_SUBJECT_ALIASES } from './medicalSpeechGrammar';
import { userVoiceLexicon } from './userVoiceLexicon';

export interface TokenizerMatchResult {
  matched: boolean;
  latencyMs: number;
  confidence: number;
  source: 'LOCAL_TOKENIZER';
  isIncompletePrompt?: boolean;
  clarificationPrompt?: string;
  delta?: CognitiveDelta;
  action?: ParsedAtlasAction;
}

/**
 * Standard Levenshtein distance for fuzzy speech alignment
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 1; j <= an; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Fast zero-dependency medical subject lookup with phonetic and Levenshtein fallback
 */
export function fastLookupSubject(text: string): { id: string; name: string } {
  const clean = text.toLowerCase().trim();

  // 0. Learned Personal Lexicon Check (IndexedDB Cache)
  const learnedSubjectName = userVoiceLexicon.resolveAlias(clean);
  if (learnedSubjectName) {
    const found = STANDARD_MEDICAL_SUBJECTS.find(s => s.name === learnedSubjectName);
    if (found) return { id: found.id, name: found.name };
  }

  // 1. Direct exact & alias check
  for (const s of STANDARD_MEDICAL_SUBJECTS) {
    if (s.name.toLowerCase() === clean) {
      return { id: s.id, name: s.name };
    }
    for (const alias of s.aliases) {
      const regex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'i');
      if (regex.test(clean) || clean.includes(alias.toLowerCase())) {
        return { id: s.id, name: s.name };
      }
    }
  }

  // 2. Secondary medical speech grammar alias lookup
  for (const [subjectName, aliases] of Object.entries(MEDICAL_SUBJECT_ALIASES)) {
    for (const alias of aliases) {
      if (clean.includes(alias.toLowerCase())) {
        const found = STANDARD_MEDICAL_SUBJECTS.find(s => s.name === subjectName);
        return found ? { id: found.id, name: found.name } : { id: 'SUB_11', name: subjectName };
      }
    }
  }

  // 3. Fuzzy Levenshtein match for mangled speech transcript tokens
  const words = clean.split(/\s+/);
  let bestMatch = { id: 'SUB_11', name: 'General Medicine', minDistance: 999 };

  for (const word of words) {
    if (word.length < 3) continue;
    for (const [subjectName, aliases] of Object.entries(MEDICAL_SUBJECT_ALIASES)) {
      for (const alias of aliases) {
        const dist = calculateLevenshteinDistance(word, alias.toLowerCase());
        // Threshold: max 2 edits for words >= 4 chars, 1 edit for 3 chars
        const maxAllowed = alias.length > 5 ? 2 : 1;
        if (dist <= maxAllowed && dist < bestMatch.minDistance) {
          const found = STANDARD_MEDICAL_SUBJECTS.find(s => s.name === subjectName);
          bestMatch = {
            id: found ? found.id : 'SUB_11',
            name: subjectName,
            minDistance: dist
          };
        }
      }
    }
  }

  if (bestMatch.minDistance <= 2) {
    return { id: bestMatch.id, name: bestMatch.name };
  }

  return { id: 'SUB_11', name: 'General Medicine' };
}

/**
 * Lightweight, zero-dependency pattern matcher that evaluates in <5ms on the main thread.
 * Bypasses remote LLM latency for deterministic medical study logs, mock scores, and clinical pearls.
 */
export function tokenizeMedicalInput(rawInput: string): TokenizerMatchResult {
  const startTime = performance.now();
  const input = rawInput.trim();

  if (!input || input.length < 3) {
    return {
      matched: false,
      latencyMs: performance.now() - startTime,
      confidence: 0,
      source: 'LOCAL_TOKENIZER',
    };
  }

  // -------------------------------------------------------------
  // GUARD: Questions / Clinical Inquiries (e.g. "What is the doc for pneumonia", "which drug...", "how to treat...")
  // Interrogative questions must NEVER match action tokens and must route directly to Gemini AI for rich clinical explanations.
  // -------------------------------------------------------------
  const isInterrogativeQuery =
    /^(?:what(?:'s|\s+is|\s+are)?|which|how|why|who|when|where|can\s+you|could\s+you|tell\s+me|give\s+me|explain|differentiate|compare|define|is\s+there|are\s+there|does|do|is\s+[a-zA-Z0-9]+|are\s+[a-zA-Z0-9]+)\b|\?$/i.test(
      input
    );
  if (isInterrogativeQuery) {
    return {
      matched: false,
      latencyMs: performance.now() - startTime,
      confidence: 0,
      source: 'LOCAL_TOKENIZER',
    };
  }

  // -------------------------------------------------------------
  // GUARD: Incomplete Slot Detection (e.g. "Add this DOC:", "note:", "missed:", "DOC", "add pearl:")
  // Prevents empty payload cards or trailing punctuation from ever creating cards
  // -------------------------------------------------------------
  const incompleteTriggers = /^(?:add\s+this\s+|add\s+|create\s+|log\s+)?(?:doc|drug of choice|ioc|investigation of choice|note|pearl|rule|mistake|Mistakes Journal|trap):?\s*([.\s!?,;:-]*)$/i;
  const incompleteMatch = input.match(incompleteTriggers);
  if (incompleteMatch) {
    let topicName = 'Pharmacology';
    if (/ioc|investigation/i.test(input)) topicName = 'General Medicine / Diagnostics';
    else if (/triad|syndrome/i.test(input)) topicName = 'Pediatrics / Medicine';

    let clarification = `Which drug of choice and condition should I log to ${topicName}?`;
    if (/ioc|investigation/i.test(input)) clarification = `Which investigation of choice and condition should I log?`;
    else if (/note|pearl|rule|20th/i.test(input)) clarification = `What clinical pearl or rule would you like to log to your Mistakes Journal?`;

    return {
      matched: true,
      latencyMs: performance.now() - startTime,
      confidence: 1.0,
      source: 'LOCAL_TOKENIZER',
      isIncompletePrompt: true,
      clarificationPrompt: clarification,
      delta: {
        intent: 'CLINICAL_QUERY',
        confidence: 1.0,
        executiveSummary: clarification,
        latencyMs: performance.now() - startTime,
      }
    };
  }

  // -------------------------------------------------------------
  // PATTERN 1: Study Block Duration (English & Hinglish)
  // E.g. "45m pharma", "studied 1.5h biochem", "2 hrs micro", "pharmacology 45 min", "2 ghante pharma padha", "1.5 ghanta biochem revise kiya"
  // -------------------------------------------------------------
  const studyRegex = /(?:studied|study|revised|revise|did|read|logged|padha|padhi|padhai\s+ki|revise\s+kiya)?\s*(\d+(?:\.\d+)?)\s*(mins?|minutes?|m|hrs?|hours?|h|ghante?|ghanta|gante?|ganta)\s*(?:of|in|ki|ka)?\s*([a-zA-Z0-9\s,&/-]+)?/i;
  const studyMatch = input.match(studyRegex);

  // Secondary reverse pattern: "Pharma 45 mins", "Biochem 2 hrs", "Biochem 2 ghante"
  const reverseStudyRegex = /^([a-zA-Z\s,&/-]+?)\s+(\d+(?:\.\d+)?)\s*(mins?|minutes?|m|hrs?|hours?|h|ghante?|ghanta|gante?|ganta)\b/i;
  const reverseMatch = input.match(reverseStudyRegex);

  const matchedPattern = studyMatch && (studyMatch[2] || input.toLowerCase().includes('min') || input.toLowerCase().includes('hr') || input.toLowerCase().includes('ghant'))
    ? { rawVal: parseFloat(studyMatch[1]), unit: studyMatch[2]?.toLowerCase() || 'm', subjectCandidate: studyMatch[3] || input }
    : reverseMatch
    ? { rawVal: parseFloat(reverseMatch[2]), unit: reverseMatch[3]?.toLowerCase() || 'm', subjectCandidate: reverseMatch[1] }
    : null;

  if (matchedPattern) {
    const { rawVal, unit, subjectCandidate } = matchedPattern;
    const isHours = unit.startsWith('h') || unit.startsWith('gh') || unit.startsWith('ga');
    const durationMinutes = isHours ? Math.round(rawVal * 60) : Math.round(rawVal);

    if (durationMinutes > 0 && durationMinutes <= 900) {
      const resolved = fastLookupSubject(subjectCandidate);

      // Determine confidence level if mentioned
      let confidenceLevel: ConfidenceLevel = 'MEDIUM';
      if (/high|easy|confident|strong|solid|badhiya|aasan/i.test(input)) confidenceLevel = 'HIGH';
      if (/low|weak|struggled|difficult|poor|hard|mushkil/i.test(input)) confidenceLevel = 'LOW';

      // Clean topic extract
      const topicExtract = input
        .replace(studyRegex, '')
        .replace(reverseStudyRegex, '')
        .replace(/\b(padha|padhi|padhai\s+ki|revise\s+kiya|khatam\s+kiya|done|completed)\b/gi, '')
        .trim() || resolved.name;

      const delta: CognitiveDelta = {
        intent: 'ACTION_LOG_STUDY',
        targetSubjectId: resolved.id,
        targetSubjectName: resolved.name,
        confidence: 0.95,
        executiveSummary: `Logged ${durationMinutes} mins of ${resolved.name} study session.`,
        studyDelta: {
          durationMinutes,
          confidenceRating: confidenceLevel,
          topicExtracted: topicExtract,
        },
        latencyMs: performance.now() - startTime,
      };

      const action: ParsedAtlasAction = {
        action: 'ACTION_LOG_STUDY',
        subjectName: resolved.name,
        durationMinutes,
        confidence: confidenceLevel,
        topic: topicExtract,
      };

      return {
        matched: true,
        latencyMs: performance.now() - startTime,
        confidence: 0.95,
        source: 'LOCAL_TOKENIZER',
        delta,
        action,
      };
    }
  }

  // -------------------------------------------------------------
  // PATTERN 2: Grand Test / Mock Score Record (e.g. "GT 4 score 142/200", "mock 135 65 correct")
  // -------------------------------------------------------------
  const scoreRegex = /(?:gt|mock|test|exam|swt|nbme|uwsa|uworld|cms form|block)\s*(?:#|no\.?)?\s*(\d+)?\s*(?:score|marks|scored|got)?\s*:?\s*(\d+)(?:\s*\/\s*(\d+))?/i;
  const scoreMatch = input.match(scoreRegex);

  if (scoreMatch && (scoreMatch[1] || scoreMatch[2])) {
    const testNumber = scoreMatch[1] ? parseInt(scoreMatch[1], 10) : 1;
    const scoreVal = parseInt(scoreMatch[2], 10);
    const totalMarks = scoreMatch[3] ? parseInt(scoreMatch[3], 10) : (scoreMatch[2] ? parseInt(scoreMatch[2], 10) : 200);

    if (scoreVal <= totalMarks && totalMarks > 0) {
      const delta: CognitiveDelta = {
        intent: 'ACTION_RECORD_SCORE',
        confidence: 0.92,
        executiveSummary: `Recorded GT #${testNumber} score: ${scoreVal}/${totalMarks}.`,
        scoreDelta: {
          testName: `Grand Test #${testNumber}`,
          totalMarks: scoreVal,
          maxMarks: totalMarks,
          correctCount: Math.round(scoreVal * 0.9),
          incorrectCount: Math.round(totalMarks - scoreVal),
        },
        latencyMs: performance.now() - startTime,
      };

      const action: ParsedAtlasAction = {
        action: 'ACTION_RECORD_SCORE',
        testName: `Grand Test #${testNumber}`,
        score: scoreVal,
        totalMarks,
      };

      return {
        matched: true,
        latencyMs: performance.now() - startTime,
        confidence: 0.92,
        source: 'LOCAL_TOKENIZER',
        delta,
        action,
      };
    }
  }

  // -------------------------------------------------------------
  // PATTERN 3: Mistakes Journal Mistake / Clinical Pearl with Deterministic Keyword Deconstruction
  // E.g. "missed question on phentolamine in pharma", "DOC Trigeminal neuralgia carbamazepine", "IOC for aortic dissection CT angio"
  // -------------------------------------------------------------
  const mistakeKeywords = /^(?:add\s+|create\s+|log\s+)?(?:missed|wrong|mistake|note|pearl|rule|remember|trap|doc|drug of choice|ioc|investigation of choice)(?::|\s+)\s*(.+)/i;
  const mistakeMatch = input.match(mistakeKeywords);

  if (mistakeMatch) {
    let rawPayload = mistakeMatch[1].trim();

    // Clean trailing/leading non-alphanumeric punctuation e.g. ".", ":", "-"
    rawPayload = rawPayload.replace(/^[\s.:,-]+|[\s.:,-]+$/g, '').trim();

    // STRICT PAYLOAD VALIDATION: Must contain at least 2 meaningful words (>= 4 total alphanumeric characters)
    const meaningfulWords = rawPayload.split(/\s+/).filter(w => w.replace(/[^a-zA-Z0-9]/g, '').length >= 2);
    if (meaningfulWords.length < 2 || rawPayload.length < 4) {
      return {
        matched: false,
        latencyMs: performance.now() - startTime,
        confidence: 0,
        source: 'LOCAL_TOKENIZER',
      };
    }

    const resolved = fastLookupSubject(input);

    let tag: MistakeTag = 'General Pearl';
    if (/drug|doc|rx|treatment|dose/i.test(input)) tag = 'Drug of Choice';
    else if (/investigation|ioc|gold standard|biopsy|mri|ct/i.test(input)) tag = 'Investigation of Choice';
    else if (/triad|criteria|syndrome/i.test(input)) tag = 'Clinical Triad';
    else if (/volatile|number|year|schedule/i.test(input)) tag = 'Volatile Number';

    // Deterministic Deconstruction for Clinical Syntax
    // E.g., "DOC Trigeminal neuralgia carbamazepine" -> Disease: Trigeminal Neuralgia, Drug: Carbamazepine
    let formattedRule = rawPayload;
    let clinicalTrigger = '';

    if (tag === 'Drug of Choice') {
      const words = rawPayload.split(/\s+/);
      if (words.length >= 2 && !rawPayload.toLowerCase().includes('is') && !rawPayload.toLowerCase().includes('for') && !rawPayload.toLowerCase().includes('in')) {
        // Last word is usually the drug, preceding words are the disease
        const drug = words[words.length - 1];
        const disease = words.slice(0, -1).join(' ');
        formattedRule = `${disease}: Drug of choice is ${drug}`;
        clinicalTrigger = disease;
      }
    } else if (tag === 'Investigation of Choice') {
      const words = rawPayload.split(/\s+/);
      if (words.length >= 2 && !rawPayload.toLowerCase().includes('is') && !rawPayload.toLowerCase().includes('for')) {
        const ioc = words.slice(-2).join(' ');
        const disease = words.slice(0, -2).join(' ') || words[0];
        formattedRule = `${disease}: Investigation of choice is ${ioc}`;
        clinicalTrigger = disease;
      }
    }

    const delta: CognitiveDelta = {
      intent: 'ACTION_ADD_MISTAKE',
      targetSubjectId: resolved.id,
      targetSubjectName: resolved.name,
      confidence: 0.92,
      executiveSummary: `Captured Mistakes Journal pearl for ${resolved.name}.`,
      distillation: {
        twentyNotebookRule: formattedRule,
        tag,
        clinicalTrigger,
        keyInsight: formattedRule,
      },
      latencyMs: performance.now() - startTime,
    };

    const action: ParsedAtlasAction = {
      action: 'ACTION_ADD_MISTAKE',
      subjectName: resolved.name,
      ruleText: formattedRule,
      tag,
      errorType: 'concept',
      isUrgent: true,
      clinicalTrigger,
      keyTakeaway: formattedRule,
    };

    return {
      matched: true,
      latencyMs: performance.now() - startTime,
      confidence: 0.92,
      source: 'LOCAL_TOKENIZER',
      delta,
      action,
    };
  }

  return {
    matched: false,
    latencyMs: performance.now() - startTime,
    confidence: 0,
    source: 'LOCAL_TOKENIZER',
  };
}
