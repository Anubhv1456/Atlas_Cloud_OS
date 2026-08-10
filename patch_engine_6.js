const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `    const isPinned = set.focus === 'primary';
    if (isPinned) {
      // Pinned Intent Lifecycle handling - if stale, UI might downgrade, but here we just give it massive boost
      actionIndex += 1000; 
    }
    
    // Triage Mode Filter
    if (isTriageMode && !isPinned && actionIndex <= 80) {
      continue; // Skip blocks that don't meet critical triage threshold
    }
    
    // Build Rationale Badges
    const badges: RationaleBadge[] = [];
    
    if (isTriageMode && actionIndex > 80 && !isPinned) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: \`⚡ Overdue\`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    }
    
    if (yieldWeight >= 85) {
      badges.push({ label: \`🎯 High Yield (\${yieldInfo.tag.split('•')[0].trim()})\`, variant: 'primary', iconType: 'target' });
    }
    
    if (isPinned) {
      badges.push({ label: '⭐ Pinned', variant: 'primary', iconType: 'target' });
    }`;

const replacement = `    let isPinned = false;
    let isAgingPin = false;
    let wasPinned = false;
    
    if (set.focus === 'primary') {
      const pinDate = set.focusUpdatedAt ? new Date(set.focusUpdatedAt) : now;
      const hoursSincePin = (now.getTime() - pinDate.getTime()) / (1000 * 3600);
      
      if (hoursSincePin > 168) {
        // > 7 days (168 hours): Auto-Downgrade
        wasPinned = true;
      } else {
        isPinned = true;
        actionIndex += 1000; // Force position #1
        
        if (hoursSincePin >= 48) {
          // 48-168 hours: Aging Pin
          isAgingPin = true;
        }
      }
    }
    
    // Triage Mode Filter
    if (isTriageMode && !isPinned && actionIndex <= 80) {
      continue; // Skip blocks that don't meet critical triage threshold
    }
    
    // Build Rationale Badges
    const badges: RationaleBadge[] = [];
    
    if (isTriageMode && actionIndex > 80 && !isPinned) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: \`⚡ Overdue\`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    }
    
    if (yieldWeight >= 85) {
      badges.push({ label: \`🎯 High Yield (\${yieldInfo.tag.split('•')[0].trim()})\`, variant: 'primary', iconType: 'target' });
    }
    
    if (isPinned) {
      if (isAgingPin) {
        badges.push({ label: '⭐ Stale Pin', variant: 'amber', iconType: 'clock' });
      } else {
        badges.push({ label: '⭐ Pinned', variant: 'primary', iconType: 'target' });
      }
    } else if (wasPinned) {
      badges.push({ label: '⏳ Auto-Unpinned', variant: 'muted', iconType: 'clock' });
    }`;

code = code.replace(targetStr, replacement);
fs.writeFileSync(file, code);
