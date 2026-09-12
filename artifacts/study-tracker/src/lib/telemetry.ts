import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestoreDb, auth } from './firebase';
import { generateHLC } from './hlc';
import { qualifyReferral } from './referral';

export interface TelemetryEvent {
  type: 's10_decision' | 'recall_drill' | 'session_completion';
  timestamp: string;
  s10_decision_time_ms?: number;
  accepted_recommendation?: boolean;
  skip_reason?: string | null;
  target_title?: string;
  subject_name?: string;
  topic_title?: string;
  error_category?: string;
  resolved?: boolean;
  session_type?: string;
  duration_mins?: number;
  completed?: boolean;
}

export interface KnowledgeGapItem {
  subject: string;
  topic: string;
  errorPct: number;
  count: number;
}

const STORAGE_BUFFER_KEY = 'atlas_telemetry_event_buffer';
const STORAGE_S10_START = 'atlas_s10_mount_timestamp';
const STORAGE_LAST_FLUSH_KEY = 'atlas_telemetry_last_flush';
const MAX_S10_VALID_MS = 120000; // 2 minutes: decisions longer than this indicate background/idle tab
const FLUSH_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes minimum interval between periodic flushes
const FLUSH_BUFFER_THRESHOLD = 15; // Flush immediately if buffer reaches 15 events

// In-memory buffer
let eventBuffer: TelemetryEvent[] = [];

// Load persisted buffer from local storage on load
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_BUFFER_KEY);
    if (raw) {
      eventBuffer = JSON.parse(raw);
    }
  } catch (e) {
    eventBuffer = [];
  }

  // Register browser lifecycle singleton flush listeners (P1 Optimization)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushTelemetryBatch({ force: true }).catch(() => {});
    }
  });

  window.addEventListener('pagehide', () => {
    flushTelemetryBatch({ force: true }).catch(() => {});
  });
}

function persistBuffer() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_BUFFER_KEY, JSON.stringify(eventBuffer.slice(-100)));
    } catch (e) {
      // Ignore
    }
  }
}

/** Record S10 Mount / Render start timestamp */
export function startS10Timer() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_S10_START, String(Date.now()));
  }
}

/** Record S10 Decision (Recommendation accepted or skipped) with outlier defense */
export function recordS10Decision(
  accepted: boolean,
  skipReason: string | null = null,
  elapsedSecondsOverride?: number,
  targetTitle?: string
) {
  let decisionTimeMs = 5000;
  if (typeof elapsedSecondsOverride === 'number') {
    // Clamp to 500ms min and 120,000ms (2 min) max to defend against idle/abandoned tabs
    decisionTimeMs = Math.min(MAX_S10_VALID_MS, Math.max(500, Math.round(elapsedSecondsOverride * 1000)));
  } else if (typeof window !== 'undefined') {
    const startStr = localStorage.getItem(STORAGE_S10_START);
    if (startStr) {
      const startTime = parseInt(startStr, 10);
      const rawElapsed = Date.now() - startTime;
      decisionTimeMs = Math.min(MAX_S10_VALID_MS, Math.max(500, rawElapsed));
    }
  }

  const evt: TelemetryEvent = {
    type: 's10_decision',
    timestamp: new Date().toISOString(),
    s10_decision_time_ms: decisionTimeMs,
    accepted_recommendation: accepted,
    skip_reason: skipReason,
    target_title: targetTitle || 'Recommendation'
  };

  eventBuffer.push(evt);
  persistBuffer();

  // Reset timer for next cycle
  startS10Timer();
}

/** Record active recall mistake drill item result with topic context */
export function recordRecallDrill(
  category: string,
  resolved: boolean,
  topicTitle?: string,
  subjectName?: string
) {
  const evt: TelemetryEvent = {
    type: 'recall_drill',
    timestamp: new Date().toISOString(),
    error_category: category,
    resolved,
    topic_title: topicTitle,
    subject_name: subjectName
  };

  eventBuffer.push(evt);
  persistBuffer();
}

/** Record completed study session */
export function recordSessionCompletion(sessionType: string, durationMins: number, completed: boolean) {
  const evt: TelemetryEvent = {
    type: 'session_completion',
    timestamp: new Date().toISOString(),
    session_type: sessionType,
    duration_mins: durationMins,
    completed
  };

  eventBuffer.push(evt);
  persistBuffer();

  // Trigger qualification check if user was referred and session >= 10m
  if (completed && durationMins >= 10 && auth.currentUser) {
    qualifyReferral(auth.currentUser.uid, durationMins).catch((err) => {
      console.warn('[Referral Engine] Non-fatal qualification check error:', err);
    });
  }

  // Events remain buffered in localStorage and are flushed during periodic sync or logout
}

/** Flush buffered events to Firestore telemetry_logs collection (1 write per flush, debounced / throttled) */
export async function flushTelemetryBatch(options?: { force?: boolean }): Promise<boolean> {
  if (eventBuffer.length === 0) return true;

  // Unless forced (e.g. tab closing / visibility hide) or threshold reached, enforce cooldown
  if (!options?.force && eventBuffer.length < FLUSH_BUFFER_THRESHOLD) {
    if (typeof window !== 'undefined') {
      const lastFlush = localStorage.getItem(STORAGE_LAST_FLUSH_KEY);
      if (lastFlush && Date.now() - Number(lastFlush) < FLUSH_COOLDOWN_MS) {
        return true; // Still within cooldown, keep safely buffered in memory & localStorage
      }
    }
  }

  const eventsToFlush = [...eventBuffer];

  // Aggregate stats
  let totalS10Ms = 0;
  let s10Count = 0;
  let acceptedCount = 0;
  let skippedCount = 0;
  const skipReasons: Record<string, number> = {};
  let drillsCleared = 0;
  let totalDrills = 0;
  const errorCategories: Record<string, number> = {};
  let sessionsCompleted = 0;
  const knowledgeGapsMap: Record<string, { subject: string; topic: string; fails: number; total: number }> = {};

  for (const evt of eventsToFlush) {
    if (evt.type === 's10_decision') {
      if (evt.s10_decision_time_ms && evt.s10_decision_time_ms <= MAX_S10_VALID_MS) {
        totalS10Ms += evt.s10_decision_time_ms;
        s10Count++;
      }
      if (evt.accepted_recommendation) {
        acceptedCount++;
      } else {
        skippedCount++;
        const reason = evt.skip_reason || 'default';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    } else if (evt.type === 'recall_drill') {
      totalDrills++;
      if (evt.resolved) drillsCleared++;
      if (evt.error_category) {
        errorCategories[evt.error_category] = (errorCategories[evt.error_category] || 0) + 1;
      }
      if (evt.topic_title) {
        const key = `${evt.subject_name || 'General'}::${evt.topic_title}`;
        if (!knowledgeGapsMap[key]) {
          knowledgeGapsMap[key] = {
            subject: evt.subject_name || 'General',
            topic: evt.topic_title,
            fails: 0,
            total: 0
          };
        }
        knowledgeGapsMap[key].total++;
        if (!evt.resolved) {
          knowledgeGapsMap[key].fails++;
        }
      }
    } else if (evt.type === 'session_completion') {
      if (evt.completed) sessionsCompleted++;
    }
  }

  const knowledgeGaps = Object.values(knowledgeGapsMap);

  const payload = {
    timestamp: new Date().toISOString(),
    hlc: generateHLC(),
    events_count: eventsToFlush.length,
    s10_avg_decision_time_ms: s10Count > 0 ? Math.round(totalS10Ms / s10Count) : 0,
    accepted_recommendations_count: acceptedCount,
    skipped_recommendations_count: skippedCount,
    skip_reasons: skipReasons,
    drills_cleared_count: drillsCleared,
    drills_total_count: totalDrills,
    error_categories: errorCategories,
    knowledge_gaps: knowledgeGaps,
    sessions_completed_count: sessionsCompleted,
    cohort_id: 'beta_cohort_v1'
  };

  try {
    const colRef = collection(firestoreDb, 'telemetry_logs');
    await addDoc(colRef, payload);
    // Clear buffer on success and update last flush timestamp
    eventBuffer = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_BUFFER_KEY);
      localStorage.setItem(STORAGE_LAST_FLUSH_KEY, String(Date.now()));
    }
    return true;
  } catch (err) {
    console.warn('Could not flush telemetry to Firestore (cached locally):', err);
    return false;
  }
}

/** Summarize in-memory buffer into a doc shape for real-time live preview before flush */
function createLocalBufferDoc() {
  let totalS10Ms = 0;
  let s10Count = 0;
  let acceptedCount = 0;
  let skippedCount = 0;
  const skipReasons: Record<string, number> = {};
  let drillsCleared = 0;
  let totalDrills = 0;
  const errorCategories: Record<string, number> = {};
  let sessionsCompleted = 0;
  const knowledgeGapsMap: Record<string, { subject: string; topic: string; fails: number; total: number }> = {};

  for (const evt of eventBuffer) {
    if (evt.type === 's10_decision') {
      if (evt.s10_decision_time_ms && evt.s10_decision_time_ms <= MAX_S10_VALID_MS) {
        totalS10Ms += evt.s10_decision_time_ms;
        s10Count++;
      }
      if (evt.accepted_recommendation) {
        acceptedCount++;
      } else {
        skippedCount++;
        const reason = evt.skip_reason || 'default';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    } else if (evt.type === 'recall_drill') {
      totalDrills++;
      if (evt.resolved) drillsCleared++;
      if (evt.error_category) {
        errorCategories[evt.error_category] = (errorCategories[evt.error_category] || 0) + 1;
      }
      if (evt.topic_title) {
        const key = `${evt.subject_name || 'General'}::${evt.topic_title}`;
        if (!knowledgeGapsMap[key]) {
          knowledgeGapsMap[key] = {
            subject: evt.subject_name || 'General',
            topic: evt.topic_title,
            fails: 0,
            total: 0
          };
        }
        knowledgeGapsMap[key].total++;
        if (!evt.resolved) {
          knowledgeGapsMap[key].fails++;
        }
      }
    } else if (evt.type === 'session_completion') {
      if (evt.completed) sessionsCompleted++;
    }
  }

  return {
    id: 'local_buffer_live',
    timestamp: new Date().toISOString(),
    events_count: eventBuffer.length,
    s10_avg_decision_time_ms: s10Count > 0 ? Math.round(totalS10Ms / s10Count) : 0,
    accepted_recommendations_count: acceptedCount,
    skipped_recommendations_count: skippedCount,
    skip_reasons: skipReasons,
    drills_cleared_count: drillsCleared,
    drills_total_count: totalDrills,
    error_categories: errorCategories,
    knowledge_gaps: Object.values(knowledgeGapsMap),
    sessions_completed_count: sessionsCompleted,
    cohort_id: 'beta_cohort_v1',
    is_local_unflushed: true
  };
}

/** Fetch Cohort Telemetry logs for Admin Panel - Ground Truth Only */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function fetchCohortTelemetryLogs(forceRefresh = false) {
  try {
    const cacheKey = 'atlas_admin_telemetry_cache';
    const cachedDataStr = localStorage.getItem(cacheKey);

    if (!forceRefresh && cachedDataStr) {
      try {
        const cached = JSON.parse(cachedDataStr);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          console.log('[Telemetry] Serving from 12-hour cache.');
          return cached.data;
        }
      } catch (e) {
        console.warn('Failed to parse telemetry cache:', e);
      }
    }

    console.log('[Telemetry] Fetching fresh data from Firestore...');
    const colRef = collection(firestoreDb, 'telemetry_logs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    
    const localDoc = eventBuffer.length > 0 ? [createLocalBufferDoc()] : [];

    if (snap.empty) {
      if (localDoc.length > 0) {
        const processed = processTelemetryDocs(localDoc);
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: processed }));
        return processed;
      }
      return getEmptyTelemetryData();
    }

    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (localDoc.length > 0) {
      docs.unshift(...localDoc);
    }
    const processed = processTelemetryDocs(docs);
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: processed }));
    return processed;
  } catch (e) {
    console.warn('Failed to fetch telemetry from Firestore, checking local buffer or returning fresh state', e);
    if (eventBuffer.length > 0) {
      return processTelemetryDocs([createLocalBufferDoc()]);
    }
    return getEmptyTelemetryData();
  }
}

/** Pure unseeded aggregation over real Firestore documents */
function processTelemetryDocs(docs: any[]) {
  let totalS10 = 0;
  let s10Docs = 0;
  let totalAccepted = 0;
  let totalSkipped = 0;
  const skipReasons: Record<string, number> = {};
  let totalDrillsCleared = 0;
  let totalDrills = 0;
  const errorCategories: Record<string, number> = {};
  let totalSessionsCompleted = 0;
  const gapAggregate: Record<string, { subject: string; topic: string; fails: number; total: number }> = {};

  for (const d of docs) {
    if (d.s10_avg_decision_time_ms) {
      // Filter out any anomalous records > 120s
      const timeMs = Number(d.s10_avg_decision_time_ms);
      if (timeMs > 0 && timeMs <= MAX_S10_VALID_MS) {
        totalS10 += timeMs;
        s10Docs++;
      }
    }
    totalAccepted += d.accepted_recommendations_count || 0;
    totalSkipped += d.skipped_recommendations_count || 0;
    if (d.skip_reasons && typeof d.skip_reasons === 'object') {
      for (const [r, cnt] of Object.entries(d.skip_reasons)) {
        if (typeof cnt === 'number') {
          skipReasons[r] = (skipReasons[r] || 0) + cnt;
        }
      }
    }
    totalDrillsCleared += d.drills_cleared_count || 0;
    totalDrills += d.drills_total_count || 0;
    if (d.error_categories && typeof d.error_categories === 'object') {
      for (const [c, cnt] of Object.entries(d.error_categories)) {
        if (typeof cnt === 'number') {
          errorCategories[c] = (errorCategories[c] || 0) + cnt;
        }
      }
    }
    if (Array.isArray(d.knowledge_gaps)) {
      for (const item of d.knowledge_gaps) {
        if (item && item.topic) {
          const key = `${item.subject || 'General'}::${item.topic}`;
          if (!gapAggregate[key]) {
            gapAggregate[key] = {
              subject: item.subject || 'General',
              topic: item.topic,
              fails: 0,
              total: 0
            };
          }
          gapAggregate[key].fails += item.fails || 0;
          gapAggregate[key].total += item.total || 0;
        }
      }
    }
    totalSessionsCompleted += d.sessions_completed_count || 0;
  }

  const avgS10Sec = s10Docs > 0 ? (totalS10 / s10Docs / 1000).toFixed(1) : '0.0';
  const totalRecs = totalAccepted + totalSkipped;
  // Raw un-clamped rate to show ground truth
  const acceptanceRate = totalRecs > 0 ? Math.round((totalAccepted / totalRecs) * 100) : 0;

  // Process dynamic knowledge gaps from real user data only
  const dynamicGaps: KnowledgeGapItem[] = Object.values(gapAggregate)
    .filter(g => g.fails > 0 || g.total > 0)
    .map(g => ({
      subject: g.subject,
      topic: g.topic,
      errorPct: g.total > 0 ? Math.round((g.fails / g.total) * 100) : 100,
      count: g.fails
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    s10AvgSeconds: parseFloat(avgS10Sec),
    acceptanceRate,
    totalAccepted,
    totalSkipped,
    skipReasons,
    errorCategories,
    drillsCleared: totalDrillsCleared,
    drillsTotal: totalDrills,
    sessionsCompleted: totalSessionsCompleted,
    topKnowledgeGaps: dynamicGaps,
    isDynamicGaps: dynamicGaps.length > 0,
    rawLogs: docs
  };
}

/** Fresh empty ground-truth baseline when no logs exist yet */
function getEmptyTelemetryData() {
  return {
    s10AvgSeconds: 0,
    acceptanceRate: 0,
    totalAccepted: 0,
    totalSkipped: 0,
    skipReasons: {
      already_studied: 0,
      not_today: 0,
      too_difficult: 0,
      not_relevant: 0
    },
    errorCategories: {
      concept: 0,
      misread: 0,
      retrieval: 0,
      fomo: 0
    },
    drillsCleared: 0,
    drillsTotal: 0,
    sessionsCompleted: 0,
    topKnowledgeGaps: [],
    isDynamicGaps: false,
    rawLogs: []
  };
}
