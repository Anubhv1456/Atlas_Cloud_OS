import { useState, useEffect, useCallback } from 'react';

export type CognitiveMode = 'atlas' | 'deep-space' | 'system-blue' | 'graphite' | 'amber';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);
  const [accent, setAccent] = useState<CognitiveMode>('atlas');

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    
    let savedMode = localStorage.getItem('atlas_theme_mode') as CognitiveMode;
    if (!savedMode) {
      // Migrate old data-accent if present
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
    setIsDark(val);
    if (val) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const changeAccent = useCallback((newMode: CognitiveMode) => {
    setAccent(newMode);
    document.documentElement.setAttribute('data-theme', newMode);
    localStorage.setItem('atlas_theme_mode', newMode);
  }, []);

  return { isDark, toggleTheme, accent, changeAccent };
}
