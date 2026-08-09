import { computeIntelligentRecommendation } from './recommendation-engine';

self.onmessage = (e: MessageEvent) => {
  const { subjects, systems, currentYear, targetExam, topicProgresses, curriculumSets } = e.data;
  
  try {
    const result = computeIntelligentRecommendation(subjects, systems, currentYear, targetExam, topicProgresses, curriculumSets);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: String(error) });
  }
};
