import { TopicProgress, TopicLivingState } from '@/db/types';

export function calculateTopicStatus(progress: TopicProgress): TopicLivingState {
  // If not started content at all
  if (progress.contentStatus === 'not_started' && progress.qbankStatus === 'not_started') {
    return 'not_started';
  }

  // If content is in progress or completed but qbank isn't
  if (progress.contentStatus === 'in_progress' || (progress.contentStatus === 'completed' && progress.qbankStatus === 'not_started')) {
    return 'learning';
  }

  // If practicing questions
  if (progress.qbankStatus === 'in_progress') {
    return 'practicing';
  }

  // If both content and qbank completed, we enter the spaced repetition phase
  if (progress.contentStatus === 'completed' && progress.qbankStatus === 'completed') {
    const now = new Date();
    
    // Check if revision is due
    if (progress.nextRevisionDate && now >= progress.nextRevisionDate) {
      return 'revision_due';
    }

    // Check if mastered (e.g. lots of revisions, high confidence)
    if (progress.revisionCount > 4 && progress.confidence === 'high') {
      return 'mastered';
    }

    // Default to learning if not explicitly needing revision yet
    // Or maybe we need a 'completed' state, but 'learning'/'practicing' are for ongoing.
    // Actually, 'mastered' is the final state. If not mastered and not due, what is it?
    // Let's assume it stays in 'practicing' or maybe we can return 'practicing' when it's safe.
    // The prompt: (Not Started -> Learning -> Practicing -> Revision Due -> Mastered)
    if (progress.revisionCount > 0) {
      return 'practicing'; // between revisions
    }

    return 'practicing';
  }

  return 'not_started';
}

export function createDefaultTopicProgress(topicId: string): TopicProgress {
  return {
    topicId,
    contentStatus: 'not_started',
    contentUnitsTotal: 0,
    contentUnitsCompleted: 0,
    qbankStatus: 'not_started',
    weakAreas: '',
    confidence: 'average',
    completionDate: null,
    revisionCount: 0,
    lastRevisionDate: null,
    currentRevisionInterval: null,
    nextRevisionDate: null,
    decayFactor: 1.0,
    revisionHistory: [],
    updatedAt: new Date()
  };
}
