import { User } from 'firebase/auth';

export interface VaultTelemetryMetrics {
  totalStudyMinutes: number;
  completedTopics: number;
  scoreLogsCount: number;
  mistakeLogsCount: number;
  subjectCount: number;
  systemCount: number;
  curriculumSetsCount?: number;
  historyCount: number;
}

export interface AtlasVaultEnvelope {
  _vault_schema_version: number;
  _origin_uid: string;
  _origin_email?: string;
  _origin_display_name?: string;
  _export_timestamp: number;
  _telemetry_signature: VaultTelemetryMetrics;
  _provenance_hash: string;
  _signature_type?: string;
  payload: {
    subjects?: any[];
    systems?: any[];
    curriculumSets?: any[];
    revisionSets?: any[];
    history?: any[];
    pyqYears?: any[];
    scoreLogs?: any[];
    uiPreferences?: any[];
    topicProgress?: any[];
    mistakeLogs?: any[];
    notebookMistakes?: any[];
    recommendationSkips?: any[];
    operationalModes?: any[];
    [key: string]: any;
  };
}

export interface ProvenanceVerificationResult {
  isValidEnvelope: boolean;
  isForeignUid: boolean;
  isHighHistoricalVolume: boolean;
  originUid: string | null;
  originEmail?: string;
  exportTimestamp: number | null;
  metrics: VaultTelemetryMetrics;
  payload: any;
  tamperWarning: boolean;
  isServerSigned?: boolean;
  signatureType?: string;
}

/**
 * Generates a SHA-256 hexadecimal hash using the browser's Web Crypto API
 */
async function generateSha256(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback simple checksum if subtle crypto is unavailable in test environment
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `hash_fallback_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Computes telemetry metrics from raw export data
 */
export function computeVaultMetrics(data: any): VaultTelemetryMetrics {
  const history = Array.isArray(data.history) ? data.history : [];
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const systems = Array.isArray(data.systems) ? data.systems : [];
  const curriculumSets = Array.isArray(data.curriculumSets) 
    ? data.curriculumSets 
    : Array.isArray(data.revisionSets) 
    ? data.revisionSets 
    : [];
  const scoreLogs = Array.isArray(data.scoreLogs) ? data.scoreLogs : [];
  const topicProgress = Array.isArray(data.topicProgress) ? data.topicProgress : [];
  const mistakeLogs = Array.isArray(data.mistakeLogs) ? data.mistakeLogs : [];
  const notebookMistakes = Array.isArray(data.notebookMistakes) ? data.notebookMistakes : [];

  // Calculate total study minutes from history
  let totalStudyMinutes = 0;
  for (const h of history) {
    if (typeof h.timeSpentMinutes === 'number') {
      totalStudyMinutes += h.timeSpentMinutes;
    } else if (typeof h.durationMinutes === 'number') {
      totalStudyMinutes += h.durationMinutes;
    } else if (typeof h.durationSeconds === 'number') {
      totalStudyMinutes += Math.round(h.durationSeconds / 60);
    } else {
      totalStudyMinutes += 15; // default conservative assumption per logged block
    }
  }

  // Count completed topic progress
  const completedTopics = topicProgress.filter((t: any) => 
    t.status === 'completed' || t.status === 'mastered' || t.progress >= 100 || (t.confidenceScore && t.confidenceScore >= 3)
  ).length;

  return {
    totalStudyMinutes,
    completedTopics: Math.max(completedTopics, topicProgress.length),
    scoreLogsCount: scoreLogs.length,
    mistakeLogsCount: mistakeLogs.length + notebookMistakes.length + history.filter((h: any) => h.wasIncorrect || h.isMistake).length,
    subjectCount: subjects.length,
    systemCount: systems.length,
    curriculumSetsCount: curriculumSets.length,
    historyCount: history.length,
  };
}

/**
 * Stretches a standard JSON export into a cryptographically signed Atlas Vault Envelope
 * Signs authoritatively via serverless HMAC when online, falling back gracefully to local digest when offline.
 */
export async function createSignedVaultBackup(
  rawData: any, 
  user: User | null
): Promise<AtlasVaultEnvelope> {
  const metrics = computeVaultMetrics(rawData);
  const originUid = user?.uid || 'anonymous_local_vault';
  const originEmail = user?.email || undefined;
  const originDisplayName = user?.displayName || undefined;
  const exportTimestamp = Date.now();

  let provenanceHash = '';
  let signatureType = 'client_sha256';

  // Attempt serverless HMAC signing if user is authenticated and online
  if (user && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/vault/sign-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          originUid,
          originEmail,
          exportTimestamp,
          metrics,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.provenanceHash) {
          provenanceHash = data.provenanceHash;
          signatureType = data.signatureType || 'server_hmac_sha256';
        }
      }
    } catch (e) {
      console.warn('[Vault Signer] Network signing unavailable, falling back to local digest', e);
    }
  }

  // Fallback to local SHA-256 for anonymous or offline users
  if (!provenanceHash) {
    const signatureSeed = `${originUid}:${originEmail || ''}:${exportTimestamp}:${metrics.totalStudyMinutes}:${metrics.completedTopics}:${metrics.scoreLogsCount}`;
    provenanceHash = await generateSha256(signatureSeed);
  }

  return {
    _vault_schema_version: 2,
    _origin_uid: originUid,
    _origin_email: originEmail,
    _origin_display_name: originDisplayName,
    _export_timestamp: exportTimestamp,
    _telemetry_signature: metrics,
    _provenance_hash: provenanceHash,
    _signature_type: signatureType,
    payload: rawData
  };
}

/**
 * Validates the provenance, cryptographic signature, and historical volume of an imported backup
 */
export async function verifyVaultBackupProvenance(
  fileContent: any, 
  currentUid: string | null
): Promise<ProvenanceVerificationResult> {
  // Check if file is wrapped in envelope
  const isEnvelope = Boolean(
    fileContent && 
    typeof fileContent === 'object' && 
    fileContent._vault_schema_version && 
    fileContent._origin_uid &&
    fileContent.payload
  );

  let payloadData = isEnvelope ? fileContent.payload : fileContent;
  let originUid = isEnvelope ? fileContent._origin_uid : null;
  let originEmail = isEnvelope ? fileContent._origin_email : undefined;
  let exportTimestamp = isEnvelope ? fileContent._export_timestamp : null;
  let metrics = isEnvelope && fileContent._telemetry_signature 
    ? fileContent._telemetry_signature 
    : computeVaultMetrics(payloadData);

  let tamperWarning = false;
  let isServerSigned = false;
  let signatureType = isEnvelope ? fileContent._signature_type : undefined;

  if (isEnvelope && fileContent._provenance_hash) {
    const isHmac = fileContent._provenance_hash.startsWith('hmac_') || signatureType === 'server_hmac_sha256';

    if (isHmac && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const res = await fetch('/api/vault/verify-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originUid,
            originEmail,
            exportTimestamp,
            metrics,
            provenanceHash: fileContent._provenance_hash,
            signatureType,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          tamperWarning = !data.valid;
          isServerSigned = Boolean(data.signedByServer);
        }
      } catch (e) {
        console.warn('[Vault Provenance] Server verification failed, performing structural checks', e);
      }
    } else {
      // Legacy checksum verification
      const signatureSeed = `${originUid}:${originEmail || ''}:${exportTimestamp}:${metrics.totalStudyMinutes}:${metrics.completedTopics}:${metrics.scoreLogsCount}`;
      const expectedHash = await generateSha256(signatureSeed);
      if (!isHmac && fileContent._provenance_hash !== expectedHash) {
        tamperWarning = true;
      }
    }
  }

  // Determine if origin UID belongs to another account
  const isForeignUid = Boolean(
    currentUid && 
    originUid && 
    originUid !== 'anonymous_local_vault' && 
    originUid !== currentUid
  );

  // High historical volume threshold: >180 minutes of logged study OR >15 completed topics OR >10 score logs
  const isHighHistoricalVolume = Boolean(
    metrics.totalStudyMinutes >= 180 || 
    metrics.completedTopics >= 15 || 
    metrics.scoreLogsCount >= 10 ||
    metrics.historyCount >= 20
  );

  return {
    isValidEnvelope: isEnvelope,
    isForeignUid,
    isHighHistoricalVolume,
    originUid,
    originEmail,
    exportTimestamp,
    metrics,
    payload: payloadData,
    tamperWarning,
    isServerSigned,
    signatureType,
  };
}
