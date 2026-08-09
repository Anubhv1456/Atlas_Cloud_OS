const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/recommendation-engine.ts', 'utf8');

const newImports = `import { StudySubject, StudySystem } from '@/db';
import { ALL_SYSTEMS, OntologyTopic } from '@/data/ontology';
import { TopicProgress } from '@/db/types';`;

code = code.replace("import { StudySubject, StudySystem } from '@/db';", newImports);

// Let's modify the signature of computeIntelligentRecommendation to take topicProgresses
const originalSignature = `export function computeIntelligentRecommendation(
  subjects: StudySubject[],
  systems: StudySystem[],
  currentYear: string = 'Final MBBS',
  targetExam: string = 'NEET PG'
): RecommendationResult {`;

// Actually wait, let's just make it async and fetch topics from db inside? No, it's a sync function now.
// Let's fetch them in OnboardingModal, or just fetch them here if we change it to async.
// It's probably easier to change it to take `topicProgresses: TopicProgress[] = []`

const newSig = `export function computeIntelligentRecommendation(
  subjects: StudySubject[],
  systems: StudySystem[],
  currentYear: string = 'Final MBBS',
  targetExam: string = 'NEET PG',
  topicProgresses: TopicProgress[] = []
): RecommendationResult {
  if (systems.length === 0) {
    return {
      subjectName: 'Medicine',
      systemName: 'Gastroenterology',
      reasons: [
        '• #1 High-Yield Core Topic (~35 Qs in NEET PG / INI-CET)',
        '• Essential foundation for your study target',
        '• Recommended starting point for Atlas calibration'
      ],
      score: 100
    };
  }

  let bestSystem: StudySystem | null = null;
  let bestSubject: StudySubject | null = null;
  let bestTopic: OntologyTopic | null = null;
  let bestScore = -1;
  let bestReasons: string[] = [];

  for (const sys of systems) {
    const sub = subjects.find(s => s.id === sys.subjectId);
    const subName = sub?.name || 'General Topic';

    const weightage = getSubjectWeightageInfo(subName, targetExam);
    const yearMult = getYearMultiplier(weightage.phase, currentYear);

    const ontologySystem = ALL_SYSTEMS.find(s => s.name === sys.name);
    const topics = ontologySystem?.topics || [];

    if (topics.length > 0) {
      for (const topic of topics) {
        let score = weightage.weight * yearMult;
        const reasons: string[] = [];

        // 1. Year alignment note
        if (yearMult > 2.0) {
          reasons.push(\`• Essential \${currentYear} priority (\${subName})\`);
        } else {
          reasons.push(\`• High yield for \${targetExam}: \${weightage.tag}\`);
        }

        if (topic.highYield) {
          score += 20;
          reasons.push('• High-Yield Marker');
        }
        if (topic.pyqWeight > 0) {
          score += topic.pyqWeight * 5;
          reasons.push(\`• PYQ Weight: \${topic.pyqWeight}\`);
        }

        const tp = topicProgresses.find(p => p.topicId === topic.id);
        
        if (tp) {
          if (tp.confidence === 'low') {
            score += 45;
            reasons.push('• Weak confidence tag — needs immediate reinforcement');
          }
          if (tp.contentStatus !== 'completed') {
            score += 25;
            reasons.push('• Pending core content completion');
          } else if (tp.qbankStatus !== 'completed') {
            score += 20;
            reasons.push('• Pending QBank practice');
          }
          
          if (tp.contentStatus === 'completed' && tp.qbankStatus === 'completed') {
            // Memory decay logic could go here, for now basic boost if due
            if (tp.nextRevisionDate && tp.nextRevisionDate < new Date()) {
               score += 40;
               reasons.push('• Active revision due based on spaced repetition');
            } else {
               score -= 50; // Already mastered and not due
            }
          }
        } else {
          // Unstarted topic
          score += 15;
          reasons.push('• Unexplored topic in recommended subject');
        }

        if (score > bestScore) {
          bestScore = score;
          bestSystem = sys;
          bestSubject = sub || null;
          bestTopic = topic;
          bestReasons = reasons.slice(0, 3);
        }
      }
    } else {
      // Fallback if no topics mapped
      let score = weightage.weight * yearMult;
      const reasons: string[] = [];
      if (yearMult > 2.0) {
        reasons.push(\`• Essential \${currentYear} priority (\${subName})\`);
      }
      if (sys.status === 'Weak') {
        score += 45;
        reasons.push('• Weak confidence tag');
      } else if (!sys.contentCompleted) {
        score += 25;
      }

      if (score > bestScore) {
        bestScore = score;
        bestSystem = sys;
        bestSubject = sub || null;
        bestReasons = reasons.slice(0, 3);
      }
    }
  }

  // Update recommendation result to include topic name if available
  const sysName = bestTopic ? \`\${bestTopic.name}\` : (bestSystem?.name || 'Gastroenterology');

  return {
    subjectName: bestSubject?.name || 'General Medicine',
    systemName: sysName,
    subjectId: bestSystem?.subjectId,
    systemId: bestSystem?.id,
    reasons: bestReasons,
    score: Math.round(bestScore)
  };
}
`;

const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.startsWith('export function computeIntelligentRecommendation'));
code = lines.slice(0, startIdx).join('\n') + '\n' + newSig;

fs.writeFileSync('artifacts/study-tracker/src/lib/recommendation-engine.ts', code);
console.log('Recommendation engine updated.');
