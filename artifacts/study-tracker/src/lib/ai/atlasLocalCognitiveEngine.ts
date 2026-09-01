import { getLiveAtlasContext, LiveAtlasContext } from './contextPackager';
import { CognitiveDelta, ParsedAtlasAction, ConfidenceLevel, MistakeTag } from './types';
import { fastLookupSubject } from './localTokenizer';
import { STANDARD_MEDICAL_SUBJECTS } from './intentParser';

// High-Yield Medical Knowledge Bank for Instant Offline Socratic Retrieval
interface HighYieldPearl {
  keywords: string[];
  subject: string;
  system: string;
  topic: string;
  pearl: string;
  trap: string;
  socraticQuestion: string;
  answer: string;
}

const HIGH_YIELD_CLINICAL_KNOWLEDGE: HighYieldPearl[] = [
  {
    keywords: ['gout', 'acute gout', 'colchicine', 'allopurinol', 'uric acid', 'indomethacin'],
    subject: 'Pharmacology',
    system: 'Autacoids & Musculoskeletal',
    topic: 'Gout Pharmacotherapy',
    pearl: 'Drug of Choice (DOC) for acute gout flare is NSAIDs (e.g. Indomethacin/Naproxen) or Colchicine (if NSAIDs contraindicated).',
    trap: 'Never initiate or discontinue Allopurinol during an acute attack (sudden uric acid flux worsens synovitis). Maintain existing dose if already on it.',
    socraticQuestion: 'A 54-year-old male with acute podagra has a history of peptic ulcer disease and eGFR 42. Which agent is the most appropriate first-line treatment for his acute flare?',
    answer: 'Colchicine (dose-adjusted) or intra-articular/systemic Corticosteroids (avoid NSAIDs due to PUD and renal impairment).'
  },
  {
    keywords: ['pneumonia', 'curb-65', 'atypical pneumonia', 'mycoplasma', 'strep pneumoniae', 'community acquired pneumonia', 'cap'],
    subject: 'General Medicine',
    system: 'Respiratory Medicine',
    topic: 'Community-Acquired Pneumonia (CAP)',
    pearl: 'Most common cause of CAP overall is Streptococcus pneumoniae (lancet-shaped gram-positive diplococci). Atypical pneumonia DOC is Azithromycin or Doxycycline.',
    trap: 'Do not confuse CURB-65 criteria (Confusion, Urea >7 mmol/L, RR ≥30, BP <90/60, Age ≥65). Score ≥2 requires hospitalization, ≥3 requires ICU/HDU admission consideration.',
    socraticQuestion: 'What is the empirical outpatient antibiotic regimen of choice for an otherwise healthy adult with suspected atypical pneumonia (cold agglutinins positive)?',
    answer: 'Macrolide (Azithromycin 500mg day 1, then 250mg qd for 4 days) or Doxycycline 100mg BID.'
  },
  {
    keywords: ['dka', 'diabetic ketoacidosis', 'potassium', 'insulin', 'anion gap', 'cerebral edema'],
    subject: 'General Medicine',
    system: 'Endocrinology',
    topic: 'Diabetic Ketoacidosis Management Protocol',
    pearl: 'Fluid resuscitation is Step 1 (0.9% Normal Saline). Check serum K+ BEFORE starting IV regular insulin infusion (0.1 U/kg/hr).',
    trap: 'If serum K+ < 3.3 mEq/L, HOLD insulin and replete potassium first to prevent fatal cardiac arrhythmias or respiratory arrest. Add Dextrose 5% when blood glucose drops below 200-250 mg/dL.',
    socraticQuestion: 'A 19-year-old with Type 1 DM arrives in DKA with BG 480 mg/dL, pH 7.15, and K+ 3.1 mEq/L. What is the immediate sequence of pharmacological intervention?',
    answer: 'Initiate aggressive IV fluid resuscitation (Normal Saline) and IV Potassium replacement. Hold insulin infusion until potassium is >3.3 mEq/L.'
  },
  {
    keywords: ['trigeminal neuralgia', 'tic douloureux', 'carbamazepine', 'facial pain'],
    subject: 'Pharmacology',
    system: 'Central Nervous System',
    topic: 'Neuropathic Pain Management',
    pearl: 'Drug of choice for Trigeminal Neuralgia is Carbamazepine (voltage-gated sodium channel blocker).',
    trap: 'Screen for HLA-B*1502 allele prior to starting Carbamazepine in patients of Asian ancestry due to high risk of Stevens-Johnson Syndrome (SJS/TEN).',
    socraticQuestion: 'Which first-line anticonvulsant is the drug of choice for paroxysmal lancinating electric-shock facial pain triggered by chewing, and what baseline lab test is essential?',
    answer: 'Carbamazepine; requires baseline CBC (risk of agranulocytosis/aplastic anemia), LFTs, and HLA-B*1502 screening.'
  },
  {
    keywords: ['myocardial infarction', 'stemi', 'nitroglycerin', 'right ventricular', 'inferior wall', 'rca'],
    subject: 'General Medicine',
    system: 'Cardiovascular System',
    topic: 'Inferior Wall MI & RV Infarction',
    pearl: 'Inferior wall STEMI (leads II, III, aVF) involves the Right Coronary Artery (RCA) in 85-90% of cases. Look for V4R ST elevation.',
    trap: 'Nitroglycerin and Morphine are CONTRAINDICATED in Right Ventricular Infarction because RV is preload-dependent; venodilation causes catastrophic hypotension. Treat with aggressive IV isotonic fluid boluses.',
    socraticQuestion: 'A patient with STEMI in leads II, III, and aVF develops severe hypotension and clear lung fields after receiving sublingual nitroglycerin. What is the diagnosis and next step?',
    answer: 'Right Ventricular Infarction. Immediately administer rapid IV Normal Saline bolus (avoid diuretics and nitrates).'
  },
  {
    keywords: ['crohn', 'ulcerative colitis', 'ibd', 'cobblestone', 'skip lesions', 'crypt abscess', 'lead pipe', 'string sign'],
    subject: 'Pathology',
    system: 'Gastrointestinal System',
    topic: 'Inflammatory Bowel Disease Differentiation',
    pearl: 'Crohn\'s Disease: Transmural inflammation, non-caseating granulomas, skip lesions, cobblestone mucosa, string sign of Kantor, smoking is a risk factor.',
    trap: 'Ulcerative Colitis: Mucosal/submucosal only, starts in rectum with continuous retrograde spread, crypt abscesses, pseudopolyps, lead pipe colon, smoking is protective, p-ANCA positive (60-80%).',
    socraticQuestion: 'Which histopathological finding is pathognomonic for Crohn disease and absent in pure Ulcerative Colitis?',
    answer: 'Non-caseating epithelioid granulomas and transmural inflammation with fissure ulcers and lymphoid aggregates.'
  },
  {
    keywords: ['nephrotic', 'minimal change', 'fsgs', 'membranous', 'spike and dome', 'effacement'],
    subject: 'Pathology',
    system: 'Renal & Urinary System',
    topic: 'Glomerulonephritis & Nephrotic Syndromes',
    pearl: 'Minimal Change Disease: Most common nephrotic syndrome in children, normal light microscopy, diffuse effacement of podocyte foot processes on electron microscopy, highly steroid-responsive.',
    trap: 'Membranous Nephropathy: Most common primary nephrotic syndrome in Caucasian adults, PLA2R antibodies positive in 70-80%, subepithelial deposits creating "spike and dome" pattern on silver stain.',
    socraticQuestion: 'A 6-year-old child presents with periorbital edema and heavy proteinuria (4+). Light microscopy of renal biopsy is completely normal. What is the ultrastructural finding and treatment of choice?',
    answer: 'Diffuse effacement of visceral epithelial cell foot processes (podocytes) on EM; Oral Prednisolone is first-line.'
  },
  {
    keywords: ['anaphylaxis', 'epinephrine', 'adrenaline', 'intramuscular', 'stridor'],
    subject: 'Pharmacology',
    system: 'Emergency Medicine & Autonomic',
    topic: 'Anaphylaxis Protocol',
    pearl: 'Drug of choice for anaphylaxis is Epinephrine (Adrenaline) given INTRAMUSCULARLY in the anterolateral aspect of the middle third of the thigh (1:1000 concentration, 0.3-0.5 mg in adults, 0.01 mg/kg in children).',
    trap: 'Never give IV Epinephrine 1:1000 push (risk of lethal ventricular tachycardia/MI); IV route is reserved for refractory shock using 1:10,000 or 1:100,000 dilute infusion with continuous ECG monitoring.',
    socraticQuestion: 'What is the precise dose, concentration, and route of administration for first-line emergency management of acute severe anaphylactic shock in a 70kg adult?',
    answer: '0.5 mg of 1:1000 (1 mg/mL) Epinephrine administered INTRAMUSCULARLY in the anterolateral thigh (vastus lateralis).'
  }
];

/**
 * Executes high-yield local medical cognitive synthesis and Socratic feedback
 * Grounded directly in live student data from Dexie IndexedDB
 */
export async function executeLocalMedicalCognitiveEngine(
  userInput: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ delta: CognitiveDelta; action?: ParsedAtlasAction | null }> {
  const startTime = performance.now();
  const input = userInput.trim();
  const lowerInput = input.toLowerCase();

  // Retrieve live context from database
  let liveContext: LiveAtlasContext | null = null;
  try {
    liveContext = await getLiveAtlasContext();
  } catch (err) {
    console.warn('[AtlasLocalEngine] Could not fetch live context:', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. INTENT: Study Progress / Memory Decay / Agenda Inquiries
  // ─────────────────────────────────────────────────────────────────────────────
  const isDecayQuery = /decay|memory|forgetting|retention|due|urgent|agenda|what\s+to\s+study|what\s+should\s+i\s+revise|weakest|priority/i.test(lowerInput);
  if (isDecayQuery && liveContext) {
    const dueQueue = liveContext.urgentDecayQueue || [];
    const urgentItems = dueQueue.slice(0, 4);
    const weakestSubject = liveContext.curriculum.subjectBreakdown
      .filter(s => s.retrievabilityScore < 80 || s.memoryLossPercent > 20)
      .sort((a, b) => b.memoryLossPercent - a.memoryLossPercent)[0];

    let summary = '';
    if (urgentItems.length > 0) {
      const itemsList = urgentItems
        .map((it, idx) => `${idx + 1}. **${it.subjectName}** (${it.systemName}) — *${it.retrievability}% retrievability* (${it.daysOverdue} days overdue)`)
        .join('\n');
      summary = `🩺 **Priority Memory Decay Radar**:\n\nYou have **${dueQueue.length} systems** currently experiencing cognitive decay:\n\n${itemsList}\n\n💡 **Prescription**: Start with a **45-minute active recall review** on **${urgentItems[0].subjectName} - ${urgentItems[0].systemName}** before watching any new lectures.`;
    } else if (weakestSubject) {
      summary = `🩺 **Curriculum Status**:\n\nYour current highest friction subject is **${weakestSubject.name}** with a memory loss factor of **${weakestSubject.memoryLossPercent}%** and ${weakestSubject.activeMistakesCount} unresolved Mistakes Journal errors.\n\n🎯 **Recommendation**: Allocate 1 hour today to high-yield Q-Bank questions in **${weakestSubject.name}**.`;
    } else {
      summary = `✨ **Cognitive Retention is Stable**!\n\nAll your scheduled system revisions are up to date with retrievability above baseline threshold. Would you like to do a **rapid 10-question Socratic drill** on your primary focus subject or log today's study block?`;
    }

    return {
      delta: {
        intent: 'CLINICAL_QUERY',
        confidence: 0.95,
        targetSubjectName: urgentItems[0]?.subjectName || weakestSubject?.name || 'General Medicine',
        executiveSummary: summary,
        latencyMs: performance.now() - startTime,
        source: 'LOCAL_TOKENIZER',
      },
      action: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INTENT: Socratic Recall / Active Diagnostic Drill Request
  // ─────────────────────────────────────────────────────────────────────────────
  const isDrillRequest = /drill|test\s+me|quiz\s+me|ask\s+me|socratic|question|vignette|practice/i.test(lowerInput);
  if (isDrillRequest) {
    const subjectCandidate = fastLookupSubject(input);
    const matchingPearls = HIGH_YIELD_CLINICAL_KNOWLEDGE.filter(
      p => p.subject.toLowerCase() === subjectCandidate.name.toLowerCase() ||
           lowerInput.includes(p.subject.toLowerCase()) ||
           lowerInput.includes(p.topic.toLowerCase())
    );

    const selectedPearl = matchingPearls.length > 0
      ? matchingPearls[Math.floor(Math.random() * matchingPearls.length)]
      : HIGH_YIELD_CLINICAL_KNOWLEDGE[Math.floor(Math.random() * HIGH_YIELD_CLINICAL_KNOWLEDGE.length)];

    const summary = `🧠 **High-Yield Socratic Diagnostic Drill** (${selectedPearl.subject} — ${selectedPearl.topic}):\n\n"${selectedPearl.socraticQuestion}"\n\n*Speak or type your diagnosis and reasoning, Doctor.*`;

    return {
      delta: {
        intent: 'CLINICAL_QUERY',
        confidence: 0.98,
        targetSubjectName: selectedPearl.subject,
        subtopicTaxonomy: selectedPearl.topic,
        executiveSummary: summary,
        latencyMs: performance.now() - startTime,
        source: 'LOCAL_TOKENIZER',
      },
      action: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. INTENT: Clinical Q&A / High-Yield Epistemology Check
  // ─────────────────────────────────────────────────────────────────────────────
  for (const pearl of HIGH_YIELD_CLINICAL_KNOWLEDGE) {
    const isMatch = pearl.keywords.some(kw => lowerInput.includes(kw));
    if (isMatch) {
      const summary = `📋 **Clinical Takeaway — ${pearl.topic}** (${pearl.subject}):\n\n• **Core Rule**: ${pearl.pearl}\n• ⚠️ **High-Yield Pitfall**: ${pearl.trap}\n\n*Would you like me to commit this rule to your Mistakes Journal error ledger?*`;
      
      const action: ParsedAtlasAction = {
        action: 'ACTION_ADD_MISTAKE',
        subjectName: pearl.subject,
        systemName: pearl.system,
        tag: 'Clinical Pearl',
        ruleText: pearl.pearl,
        isUrgent: true,
        errorType: 'concept',
        keyTakeaway: pearl.pearl,
        clinicalTrigger: pearl.topic,
        source: 'Atlas AI Knowledge Engine',
      };

      return {
        delta: {
          intent: 'ACTION_ADD_MISTAKE',
          confidence: 0.96,
          targetSubjectName: pearl.subject,
          subtopicTaxonomy: pearl.topic,
          executiveSummary: summary,
          distillation: {
            clinicalTrigger: pearl.topic,
            twentyNotebookRule: pearl.pearl,
            pitfallTrap: pearl.trap,
            isUrgent: true,
            tag: 'Clinical Pearl',
          },
          latencyMs: performance.now() - startTime,
          source: 'LOCAL_TOKENIZER',
        },
        action,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. INTENT: Mistakes Journal Mistake Addition (Natural Language Fallback)
  // ─────────────────────────────────────────────────────────────────────────────
  const isMistakeIntent = /pearl|mistake|note|trap|rule|doc\s+for|ioc\s+for|remember\s+that/i.test(lowerInput);
  if (isMistakeIntent) {
    const subjectResolved = fastLookupSubject(input);
    const cleanRule = input
      .replace(/^(?:add\s+pearl|add\s+mistake|log\s+note|remember\s+that|note:?)\s*:?/i, '')
      .trim();

    const summary = `💡 **Mistakes Journal Pearl Synthesized**:\n\n**Subject**: ${subjectResolved.name}\n**Rule**: "${cleanRule}"\n\nI have generated the interactive action card below. Click **Confirm** to lock this into your error ledger.`;

    const action: ParsedAtlasAction = {
      action: 'ACTION_ADD_MISTAKE',
      subjectName: subjectResolved.name,
      systemName: 'High-Yield Trap',
      tag: 'Clinical Pearl',
      ruleText: cleanRule || input,
      isUrgent: true,
      errorType: 'concept',
      keyTakeaway: cleanRule || input,
      clinicalTrigger: input,
      source: 'Custom Note',
    };

    return {
      delta: {
        intent: 'ACTION_ADD_MISTAKE',
        confidence: 0.9,
        targetSubjectName: subjectResolved.name,
        executiveSummary: summary,
        distillation: {
          clinicalTrigger: input,
          twentyNotebookRule: cleanRule || input,
          isUrgent: true,
          tag: 'Clinical Pearl',
        },
        latencyMs: performance.now() - startTime,
        source: 'LOCAL_TOKENIZER',
      },
      action,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. INTENT: Revision / Topic Discussion (Natural Language Feedback)
  // ─────────────────────────────────────────────────────────────────────────────
  const isStudyIntent = /studied|read|revised|completed|finished/i.test(lowerInput);
  if (isStudyIntent) {
    const subjectResolved = fastLookupSubject(input);

    const summary = `🩺 **${subjectResolved.name} Review Logged**:\n\nGreat work reviewing **${subjectResolved.name}**. Did you encounter any volatile traps, Drug of Choice (DOC), or high-yield rules to log in your **Mistakes Journal**? Or would you like a **rapid Socratic drill** on this topic?`;

    return {
      delta: {
        intent: 'CLINICAL_QUERY',
        confidence: 0.92,
        targetSubjectName: subjectResolved.name,
        executiveSummary: summary,
        latencyMs: performance.now() - startTime,
        source: 'LOCAL_TOKENIZER',
      },
      action: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5.5. INTENT: Hindi / Hinglish Communication Request
  // ─────────────────────────────────────────────────────────────────────────────
  const isHindiRequest = /hindi|हिंदी|हिंग्लिश|बात करो/i.test(lowerInput);
  if (isHindiRequest) {
    const hindiResponse = `नमस्ते डॉक्टर! बिल्कुल, अब हम हिंदी और हिंग्लिश में बात करेंगे। आपकी 19-subjects की मेडिकल तैयारी और Ebbinghaus decay curve को ट्रैक करने के लिए मैं तैयार हूँ। बताइए, आज कौन सा सब्जेक्ट रिवाइज करना है - Pharmacology, Pathology, या Medicine?`;
    return {
      delta: {
        intent: 'CLINICAL_QUERY',
        confidence: 0.95,
        targetSubjectName: 'General',
        executiveSummary: hindiResponse,
        latencyMs: performance.now() - startTime,
        source: 'LOCAL_TOKENIZER',
      },
      action: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. DEFAULT GENERAL MEDICAL ASSISTANT DIALOGUE
  // ─────────────────────────────────────────────────────────────────────────────
  const subjectFound = fastLookupSubject(input);
  const generalResponse = `👋 **Atlas Study Assistant**: I'm tracking your **19-subject preparation curriculum** and live Ebbinghaus decay curve.\n\nYou can:\n• Ask for a **Voice Recall Drill** (e.g. *"Drill me on ${subjectFound.name}"*)\n• Check **Memory Decay** (e.g. *"What are my priority decay topics?"*)\n• Dictate **Study Sessions** (e.g. *"Studied 45 mins ${subjectFound.name}"*)\n• Log **Mistakes Journal Mistakes** (e.g. *"Add pearl: DOC for Trigeminal Neuralgia is Carbamazepine"*)\n\nWhat would you like to focus on right now?`;

  return {
    delta: {
      intent: 'CLINICAL_QUERY',
      confidence: 0.88,
      targetSubjectName: subjectFound.name,
      executiveSummary: generalResponse,
      latencyMs: performance.now() - startTime,
      source: 'LOCAL_TOKENIZER',
    },
    action: null,
  };
}
