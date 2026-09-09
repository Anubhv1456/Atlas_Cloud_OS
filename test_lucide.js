const lucide = require('./artifacts/study-tracker/node_modules/lucide-react');

const usedInOpsQueue = [
  'CreditCard', 'Check', 'X', 'Search', 'RefreshCw', 'Eye', 'Copy', 
  'Clock', 'CheckCircle2', 'XCircle', 'AlertCircle', 'Sparkles', 'ExternalLink', 'ShieldCheck',
  'Inbox', 'Mail', 'Trash2', 'Bug', 'Lightbulb', 'MessageSquare', 'Filter', 'Shield', 'AlertTriangle',
  'ChevronRight', 'ArrowRight', 'Activity', 'Users', 'User'
];

for (const icon of usedInOpsQueue) {
  if (!lucide[icon]) {
    console.log('Missing in lucide-react:', icon);
  }
}

const usedInAnalytics = [
  'BarChart3', 'Activity', 'Zap', 'ShieldCheck', 'TrendingUp',
  'Database', 'Flame', 'Layers', 'Clock', 'CheckCircle2', 'AlertTriangle', 'Users', 'Brain'
];

for (const icon of usedInAnalytics) {
  if (!lucide[icon]) {
    console.log('Missing in lucide-react:', icon);
  }
}
