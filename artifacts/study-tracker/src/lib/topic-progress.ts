import { TopicProgress } from '@/db/types';

export function calculateTopicProgressValue(tp: TopicProgress | undefined): number {
  if (!tp) return 0;
  let val = 0;
  if (tp.contentStatus === 'completed') val += 0.5;
  if (tp.qbankStatus === 'completed') val += 0.5;
  return val;
}

export function calculateSystemProgressFromTopics(topicProgresses: TopicProgress[], totalTopics: number): number {
  if (totalTopics === 0) return 0;
  let sum = 0;
  for (const tp of topicProgresses) {
    sum += calculateTopicProgressValue(tp);
  }
  return (sum / totalTopics) * 100;
}
