import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isChatDrawerOpen: boolean;
  toggleChatDrawer: () => void;
  setChatDrawerOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  isChatDrawerOpen: false,
  toggleChatDrawer: () => set((state) => ({ isChatDrawerOpen: !state.isChatDrawerOpen })),
  setChatDrawerOpen: (isOpen) => set({ isChatDrawerOpen: isOpen }),
}));
