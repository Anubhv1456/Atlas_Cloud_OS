const fs = require('fs');
let hook = fs.readFileSync('./artifacts/study-tracker/src/hooks/useTheme.ts', 'utf8');

// Replace the entire hook body
const newHook = `import { useState, useEffect, useCallback } from 'react';

export type CognitiveMode = 'atlas' | 'deep-space' | 'system-blue' | 'graphite' | 'amber';

export function useTheme() {
  const [accent, setAccent] = useState<CognitiveMode>('atlas');

  useEffect(() => {
    // Strictly enforce dark mode
    document.documentElement.classList.add('dark');
    
    let savedMode = localStorage.getItem('atlas_theme_mode') as CognitiveMode;
    if (!savedMode) {
      const oldAccent = localStorage.getItem('atlas_accent');
      if (oldAccent === 'amethyst') savedMode = 'deep-space';
      else if (oldAccent === 'sapphire') savedMode = 'system-blue';
      else if (oldAccent === 'emerald') savedMode = 'atlas';
      else if (oldAccent === 'crimson') savedMode = 'amber';
      else savedMode = 'atlas';
    }
    
    setAccent(savedMode);
    document.documentElement.setAttribute('data-theme', savedMode);
  }, []);

  const toggleTheme = useCallback((val: boolean) => {
    // No-op to prevent UI crashes if called, but we stay in dark mode
  }, []);

  const changeAccent = useCallback((newMode: CognitiveMode) => {
    setAccent(newMode);
    document.documentElement.setAttribute('data-theme', newMode);
    localStorage.setItem('atlas_theme_mode', newMode);
  }, []);

  return { isDark: true, toggleTheme, accent, changeAccent };
}
`;

fs.writeFileSync('./artifacts/study-tracker/src/hooks/useTheme.ts', newHook);
