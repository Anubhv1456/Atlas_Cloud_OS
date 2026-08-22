let lastTimestamp = 0;
let counter = 0;
let nodeId = typeof window !== 'undefined' && window.sessionStorage
  ? window.sessionStorage.getItem('atlas_node_id') || (() => {
      const id = Math.random().toString(36).substring(2, 6);
      try { window.sessionStorage.setItem('atlas_node_id', id); } catch (_) {}
      return id;
    })()
  : Math.random().toString(36).substring(2, 6);

export function generateHLC(): string {
  let now = Date.now();
  if (now > lastTimestamp) {
    lastTimestamp = now;
    counter = 0;
  } else {
    counter++;
  }
  return `${lastTimestamp.toString().padStart(15, '0')}-${counter.toString().padStart(4, '0')}-${nodeId}`;
}

export function updateHLC(remoteHLC: string): void {
  if (!remoteHLC || typeof remoteHLC !== 'string') return;
  const parts = remoteHLC.split('-');
  if (parts.length >= 2) {
    const remoteTime = parseInt(parts[0], 10);
    const remoteCounter = parseInt(parts[1], 10) || 0;
    if (!isNaN(remoteTime)) {
      if (remoteTime > lastTimestamp) {
        lastTimestamp = remoteTime;
        counter = remoteCounter + 1;
      } else if (remoteTime === lastTimestamp && remoteCounter >= counter) {
        counter = remoteCounter + 1;
      }
    }
  }
}

/**
 * Compare two HLC strings.
 * Returns:
 *   1 if hlcA is strictly newer than hlcB (hlcA wins)
 *  -1 if hlcB is strictly newer than hlcA (hlcB wins)
 *   0 if both are equivalent or unparseable
 */
export function compareHLC(hlcA?: string | null, hlcB?: string | null): number {
  if (!hlcA && !hlcB) return 0;
  if (hlcA && !hlcB) return 1;
  if (!hlcA && hlcB) return -1;

  if (hlcA === hlcB) return 0;

  const partsA = (hlcA || '').split('-');
  const partsB = (hlcB || '').split('-');

  const timeA = parseInt(partsA[0] || '0', 10);
  const timeB = parseInt(partsB[0] || '0', 10);

  if (timeA !== timeB) {
    return timeA > timeB ? 1 : -1;
  }

  const countA = parseInt(partsA[1] || '0', 10);
  const countB = parseInt(partsB[1] || '0', 10);

  if (countA !== countB) {
    return countA > countB ? 1 : -1;
  }

  const nodeA = partsA[2] || '';
  const nodeB = partsB[2] || '';
  return nodeA.localeCompare(nodeB);
}

/**
 * Merges two entity records using property-level and HLC timestamp conflict resolution.
 * - Handles soft deletion tombstone precedence (`deletedAt`).
 * - Preserves progressive checkboxes (e.g. contentCompleted, qbankDone, pyqsDone if marked true).
 * - Maximizes revision count and latest revision timestamps.
 */
export function resolveEntityConflict<T extends Record<string, any>>(local: T, remote: T): T {
  // If either has a newer deletedAt tombstone, tombstone wins
  const localDel = local.deletedAt ? new Date(local.deletedAt).getTime() : 0;
  const remoteDel = remote.deletedAt ? new Date(remote.deletedAt).getTime() : 0;
  if (localDel || remoteDel) {
    if (localDel && (!remoteDel || localDel >= remoteDel)) {
      return { ...remote, ...local, deletedAt: local.deletedAt };
    } else if (remoteDel) {
      return { ...local, ...remote, deletedAt: remote.deletedAt };
    }
  }

  const hlcComparison = compareHLC(local.hlc, remote.hlc);

  // Base record chosen from winning HLC
  const base = hlcComparison >= 0 ? { ...remote, ...local } : { ...local, ...remote };

  // Domain-specific medical progress preservation
  // 1. Completion flags: true always supercedes false across concurrent devices
  if ('contentCompleted' in local || 'contentCompleted' in remote) {
    base.contentCompleted = Boolean(local.contentCompleted || remote.contentCompleted);
  }
  if ('qbankDone' in local || 'qbankDone' in remote) {
    base.qbankDone = Boolean(local.qbankDone || remote.qbankDone);
  }
  if ('qbankCompleted' in local || 'qbankCompleted' in remote) {
    base.qbankCompleted = Boolean(local.qbankCompleted || remote.qbankCompleted);
  }
  if ('completed' in local || 'completed' in remote) {
    base.completed = Boolean(local.completed || remote.completed);
  }

  // 2. Revision counts & intervals: always preserve maximum achieved revision depth
  if (typeof local.revisionCount === 'number' || typeof remote.revisionCount === 'number') {
    base.revisionCount = Math.max(local.revisionCount || 0, remote.revisionCount || 0);
  }

  // 3. Keep most recently updated HLC
  base.hlc = hlcComparison >= 0 ? local.hlc || generateHLC() : remote.hlc || generateHLC();
  base.updatedAt = new Date(Math.max(
    local.updatedAt ? new Date(local.updatedAt).getTime() : 0,
    remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0,
    Date.now()
  ));

  return base;
}

