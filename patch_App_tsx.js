const fs = require('fs');
let app = fs.readFileSync('./artifacts/study-tracker/src/App.tsx', 'utf8');

// Replace initTheme block
const newInit = `const initTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      document.documentElement.classList.add('dark');
      const savedMode = localStorage.getItem('atlas_theme_mode') || 'atlas';
      document.documentElement.setAttribute('data-theme', savedMode);
    } catch (e) {
      console.warn('localStorage access fallback', e);
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'atlas');
    }
  }
};
initTheme();`;

app = app.replace(/const initTheme = \(\) => \{[\s\S]*?initTheme\(\);/, newInit);
fs.writeFileSync('./artifacts/study-tracker/src/App.tsx', app);
