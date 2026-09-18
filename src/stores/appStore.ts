import { create } from 'zustand';
import { ActiveTab } from '../components/Sidebar.tsx';

interface AppState {
  activeTab: ActiveTab;
  currentProjectId: string;
  isSearchOpen: boolean;
  isMobileNavOpen: boolean;
  isManagementView: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentProjectId: (id: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsMobileNavOpen: (open: boolean) => void;
  setIsManagementView: (management: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'overview',
  currentProjectId: 'prj-1',
  isSearchOpen: false,
  isMobileNavOpen: false,
  isManagementView: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setIsMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
  setIsManagementView: (isManagementView) => set({ isManagementView }),
}));
