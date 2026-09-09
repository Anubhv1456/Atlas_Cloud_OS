const fs = require('fs');
const files = [
  './artifacts/study-tracker/src/components/ui/badge.tsx',
  './artifacts/study-tracker/src/components/ui/button.tsx',
  './artifacts/study-tracker/src/components/ui/input.tsx',
  './artifacts/study-tracker/src/components/ui/switch.tsx'
];
for (const file of files) {
   if(!fs.existsSync(file)) {
      console.log('File does not exist:', file);
   } else {
      const code = fs.readFileSync(file, 'utf8');
      console.log(file, 'exports:', code.match(/export\s+{([^}]+)}/g) || code.match(/export\s+function\s+([A-Za-z]+)/g) || 'no named exports');
   }
}
