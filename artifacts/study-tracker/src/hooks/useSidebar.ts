import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_STORAGE_KEY = 'atlas_sidebar_collapsed_v2';
const SIDEBAR_EVENT = 'atlas-sidebar-state-change';

export function useSidebar() {
  // Determine initial state: checks localStorage or screen width defaults
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
      // Apple default: On tablet widths (768px - 1180px), retract to icon rail by default
      const width = window.innerWidth;
      return width >= 768 && width < 1180;
    } catch {
      return false;
    }
  });

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
      window.dispatchEvent(
        new CustomEvent(SIDEBAR_EVENT, { detail: { isCollapsed: collapsed } })
      );
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  // Sync state across event listeners and window resize
  useEffect(() => {
    const handleStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isCollapsed: boolean }>;
      if (typeof customEvent.detail?.isCollapsed === 'boolean') {
        setIsCollapsed(customEvent.detail.isCollapsed);
      }
    };

    window.addEventListener(SIDEBAR_EVENT, handleStateChange);
    return () => window.removeEventListener(SIDEBAR_EVENT, handleStateChange);
  }, []);

  // Keyboard shortcut: ⌘+\ or ⌘+B or Ctrl+\ to toggle sidebar (Apple standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === '\\' || e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return {
    isCollapsed,
    setCollapsed,
    toggleSidebar,
  };
}
