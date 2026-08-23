import { SupportedGeminiModel } from './aiSettingsStorage';
import { db } from '@/db';
import { ALL_SUBJECTS } from '@/data/ontology';
import {
  MistakeTag,
  MistakeErrorType,
  ConfidenceLevel,
  ActionAddMistake,
  ActionLogStudy,
  ActionRecordScore,
  ActionClinicalQuery,
  ParsedAtlasAction,
} from './types';
import { executeCognitiveCompiler } from './geminiClient';

// Re-export shared types for backward compatibility
export type {
  MistakeTag,
  MistakeErrorType,
  ConfidenceLevel,
  ActionAddMistake,
  ActionLogStudy,
  ActionRecordScore,
  ActionClinicalQuery,
  ParsedAtlasAction,
};

export interface IntentParserResult {
  success: boolean;
  action?: ParsedAtlasAction;
  rawResponse?: string;
  modelUsed?: SupportedGeminiModel | 'LOCAL_TOKENIZER';
  source?: 'LOCAL_TOKENIZER' | 'GEMINI_CLOUD' | 'HYBRID';
  latencyMs?: number;
  error?: string;
}

/**
 * Normalized 19 standard medical subjects for zero-shot matching
 */
export const STANDARD_MEDICAL_SUBJECTS = [
  { id: 'SUB_01', name: 'Anatomy', aliases: ['anat', 'gross anatomy', 'neuroanatomy', 'histology', 'embryology'] },
  { id: 'SUB_02', name: 'Physiology', aliases: ['physio', 'renal physiology', 'cvs physiology', 'neurophysiology'] },
  { id: 'SUB_03', name: 'Biochemistry', aliases: ['biochem', 'metabolism', 'enzymes', 'molecular biology', 'genetics'] },
  { id: 'SUB_04', name: 'Pharmacology', aliases: ['pharma', 'pharmac', 'drugs', 'chemotherapy', 'autonomic', 'antimicrobial'] },
  { id: 'SUB_05', name: 'Pathology', aliases: ['patho', 'general pathology', 'hematology', 'systemic pathology', 'neoplasia'] },
  { id: 'SUB_06', name: 'Microbiology', aliases: ['micro', 'bacteriology', 'virology', 'mycology', 'parasitology', 'immunology'] },
  { id: 'SUB_07', name: 'Forensic Medicine & Toxicology', aliases: ['fmt', 'forensic', 'toxicology', 'legal medicine', 'autopsy'] },
  { id: 'SUB_08', name: 'Community Medicine (PSM)', aliases: ['psm', 'spm', 'community medicine', 'epidemiology', 'biostatistics', 'public health', 'vaccines'] },
  { id: 'SUB_09', name: 'Ophthalmology', aliases: ['optha', 'eye', 'ophthal', 'cornea', 'retina', 'cataract', 'glaucoma'] },
  { id: 'SUB_10', name: 'Otorhinolaryngology (ENT)', aliases: ['ent', 'oto', 'larynx', 'pharynx', 'ear', 'nose'] },
  { id: 'SUB_11', name: 'General Medicine', aliases: ['medicine', 'med', 'internal medicine', 'cardiology', 'neurology', 'nephrology', 'pulmonology'] },
  { id: 'SUB_12', name: 'General Surgery', aliases: ['surgery', 'surg', 'general surg', 'trauma', 'gi surgery', 'breast surgery', 'urology'] },
  { id: 'SUB_13', name: 'Obstetrics & Gynecology', aliases: ['obg', 'gynae', 'gynecology', 'obstetrics', 'labor', 'antenatal', 'eclampsia'] },
  { id: 'SUB_14', name: 'Pediatrics', aliases: ['pedia', 'ped', 'paediatrics', 'neonatology', 'growth and development', 'milestones'] },
  { id: 'SUB_15', name: 'Orthopedics', aliases: ['ortho', 'fractures', 'bone tumors', 'joints', 'dislocations'] },
  { id: 'SUB_16', name: 'Dermatology', aliases: ['derma', 'skin', 'std', 'leprosy', 'psoriasis'] },
  { id: 'SUB_17', name: 'Psychiatry', aliases: ['psych', 'mental health', 'schizophrenia', 'depression', 'bipolar'] },
  { id: 'SUB_18', name: 'Radiology', aliases: ['radio', 'imaging', 'x-ray', 'ct', 'mri', 'radiotherapy'] },
  { id: 'SUB_19', name: 'Anesthesiology', aliases: ['anaesth', 'anesthesia', 'critical care', 'icu', 'cpr'] },
];

/**
 * Fuzzy matches a subject name from natural text against database subjects or standard ontology.
 */
export async function resolveSubject(subjectQuery: string): Promise<{ id: string | number; name: string }> {
  const clean = subjectQuery.trim().toLowerCase();

  try {
    const dbSubjects = await db.subjects.toArray().then((res) => res.filter((s) => !s.deletedAt));
    const exactDb = dbSubjects.find((s) => s.name.toLowerCase() === clean);
    if (exactDb && exactDb.id !== undefined) {
      return { id: exactDb.id, name: exactDb.name };
    }

    const partialDb = dbSubjects.find(
      (s) => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase())
    );
    if (partialDb && partialDb.id !== undefined) {
      return { id: partialDb.id, name: partialDb.name };
    }
  } catch (err) {
    // Continue to ontology fallback
  }

  // Ontology Alias Search
  for (const s of STANDARD_MEDICAL_SUBJECTS) {
    if (s.name.toLowerCase() === clean || s.aliases.some((a) => clean.includes(a) || a.includes(clean))) {
      return { id: s.id, name: s.name };
    }
  }

  const matchOnt = ALL_SUBJECTS.find(
    (s) => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase())
  );
  if (matchOnt) {
    return { id: matchOnt.id, name: matchOnt.name };
  }

  return { id: 'SUB_11', name: subjectQuery || 'General Medicine' };
}

/**
 * Parses natural spoken audio transcript or typed text into a verified Atlas Action via the Cognitive Compiler.
 */
export async function parseMedicalIntent(userInput: string): Promise<IntentParserResult> {
  const cleanInput = userInput.trim();
  if (!cleanInput) {
    return {
      success: false,
      error: 'Please provide speech or text input to analyze.',
    };
  }

  try {
    const result = await executeCognitiveCompiler(cleanInput, [], { cognitiveLoad: 'routine' });

    if (result.action) {
      return {
        success: true,
        action: result.action,
        rawResponse: result.delta.executiveSummary,
        modelUsed: result.modelUsed,
        source: result.source,
        latencyMs: result.latencyMs,
      };
    }

    return {
      success: true,
      action: {
        action: 'ACTION_CLINICAL_QUERY',
        reply: result.delta.executiveSummary,
        suggestedAction: result.delta.distillation?.twentyNotebookRule,
      },
      rawResponse: result.delta.executiveSummary,
      modelUsed: result.modelUsed,
      source: result.source,
      latencyMs: result.latencyMs,
    };
  } catch (err: any) {
    console.error('[IntentParser] Execution error:', err);
    return {
      success: false,
      error: err.message || 'Unable to compile clinical intent.',
    };
  }
}

/**
 * Legacy compatibility wrapper for parseIntentWithGemini
 */
export async function parseIntentWithGemini(
  userInput: string,
  _contextSnapshot?: any,
  _apiKey?: string,
  _modelOverride?: SupportedGeminiModel
): Promise<ParsedAtlasAction> {
  const result = await executeCognitiveCompiler(userInput, [], { cognitiveLoad: 'routine' });
  if (result.action) {
    return result.action;
  }
  return {
    action: 'ACTION_CLINICAL_QUERY',
    reply: result.delta.executiveSummary,
    suggestedAction: result.delta.distillation?.twentyNotebookRule,
  };
}

