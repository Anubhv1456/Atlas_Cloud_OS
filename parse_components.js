const fs = require('fs');

const files = [
  './artifacts/study-tracker/src/features/admin/AdminDashboard.tsx',
  './artifacts/study-tracker/src/features/admin/views/AnalyticsView.tsx',
  './artifacts/study-tracker/src/features/admin/views/DirectoryView.tsx',
  './artifacts/study-tracker/src/features/admin/views/OpsQueueView.tsx',
  './artifacts/study-tracker/src/features/admin/views/SettingsView.tsx'
];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf-8');
  
  // extract all imports
  const imports = new Set();
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[1] || n.trim());
    names.forEach(n => {
       if(n) imports.add(n);
    });
  }
  
  // also add default imports
  const defaultImportRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = defaultImportRegex.exec(code)) !== null) {
     imports.add(match[1]);
  }

  // Find all used components <Comp
  const compRegex = /<([A-Z][A-Za-z0-9_]*)/g;
  const used = new Set();
  while ((match = compRegex.exec(code)) !== null) {
    used.add(match[1]);
  }

  console.log('--- ' + file + ' ---');
  for (const u of used) {
    if (!imports.has(u)) {
      console.log('Potentially undefined component:', u);
    }
  }
}

