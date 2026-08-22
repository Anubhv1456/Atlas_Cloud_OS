/**
 * Atlas Clinical Speech Sanitization & Lexical Deduplication Pipeline
 * 
 * Eliminates Web Speech API interim accumulation artifacts, repetitive syllable loops
 * (e.g. "whatwhatwhat iswhat iswhat"), duplicate contiguous n-grams, and phonetic stutters.
 */

import { speechGrammarCorrector } from './medicalSpeechGrammar';

/**
 * Strips concatenated repeated tokens, phonetic stutters, and duplicate words from speech transcripts,
 * then applies clinical lexicon normalization to correct common medical phonetic misinterpretations.
 */
export function cleanSpeechTranscript(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw.trim();
  if (!text) return '';

  // 1. Fix immediate word-internal stutter repetitions like "whatwhatwhat" -> "what", "neuro1neuro1" -> "neuro 1"
  // Match repeated word roots of 2+ letters concatenated without spaces (e.g. "whatwhat", "medicinemedicine")
  text = text.replace(/([a-zA-Z]{2,})\1{1,}/gi, '$1');

  // 2. Fix spaced word stutters / duplicate adjacent tokens (e.g. "what what what" -> "what", "is what is what" -> "is what")
  // First, collapse repeated single words: "what what what is my name" -> "what is my name"
  text = text.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  // 3. Collapse repeated two-word phrases: "is what is what" -> "is what"
  text = text.replace(/\b(\w+\s+\w+)(?:\s+\1\b)+/gi, '$1');

  // 4. Collapse repeated three-word phrases: "add a rule add a rule" -> "add a rule"
  text = text.replace(/\b(\w+\s+\w+\s+\w+)(?:\s+\1\b)+/gi, '$1');

  // 5. Clean up weird concatenation artifacts like "iswhat" when preceded or followed by "is" or "what"
  text = text.replace(/([a-z])(is|what|how|why|when|where|quiz|log|show|mark|rule|test)([A-Z])/g, '$1 $2 $3');

  // 6. Medical terminology contextual homophone correction
  text = speechGrammarCorrector.correctMedicalTranscript(text);

  // 7. Normalize multiple spaces into single space
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

/**
 * Formats a clean live transcript by combining confirmed (final) tokens with the active interim hypothesis,
 * ensuring no duplicate stitching occurs between final and interim boundaries.
 */
export function combineConfirmedAndInterim(confirmed: string, interim: string): string {
  const cleanConfirmed = cleanSpeechTranscript(confirmed);
  const cleanInterim = cleanSpeechTranscript(interim);

  if (!cleanConfirmed && !cleanInterim) return '';
  if (!cleanConfirmed) return cleanInterim;
  if (!cleanInterim) return cleanConfirmed;

  // Check if the beginning of cleanInterim overlaps with the end of cleanConfirmed
  const confirmedWords = cleanConfirmed.split(/\s+/);
  const interimWords = cleanInterim.split(/\s+/);

  const lastConfirmedWord = confirmedWords[confirmedWords.length - 1]?.toLowerCase();
  const firstInterimWord = interimWords[0]?.toLowerCase();

  let combined = '';
  if (lastConfirmedWord && firstInterimWord && lastConfirmedWord === firstInterimWord) {
    combined = `${cleanConfirmed} ${interimWords.slice(1).join(' ')}`.trim();
  } else {
    combined = `${cleanConfirmed} ${cleanInterim}`.trim();
  }

  return cleanSpeechTranscript(combined);
}
