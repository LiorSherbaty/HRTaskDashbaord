import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SelectionState } from '@/types';

type ModalType =
  | 'project'
  | 'userStory'
  | 'task'
  | 'taskDetail'
  | 'blocked'
  | 'confirm'
  | 'quarterlyReport'
  | 'settings'
  | 'help'
  | null;

interface ModalState {
  type: ModalType;
  mode: 'create' | 'edit' | 'view';
  data?: unknown;
}

interface UIState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Selection
  selection: SelectionState;
  selectProject: (projectId: string | null) => void;
  selectUserStory: (userStoryId: string | null) => void;
  clearSelection: () => void;

  // Modal
  modal: ModalState;
  openModal: (type: ModalType, mode?: 'create' | 'edit' | 'view', data?: unknown) => void;
  closeModal: () => void;

  // View
  activeTab: 'dashboard' | 'completed';
  setActiveTab: (tab: 'dashboard' | 'completed') => void;

  // Search
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Sidebar
  showArchivedProjects: boolean;
  toggleShowArchivedProjects: () => void;
  showArchivedStories: boolean;
  toggleShowArchivedStories: () => void;

  // Sidebar widths
  projectSidebarWidth: number;
  userStorySidebarWidth: number;
  setProjectSidebarWidth: (width: number) => void;
  setUserStorySidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      isDarkMode: false,
      toggleTheme: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
      }),

      // Selection
      selection: {
        projectId: null,
        userStoryId: null,
      },
      selectProject: (projectId) => set({
        selection: { projectId, userStoryId: null },
      }),
      selectUserStory: (userStoryId) => set((state) => ({
        selection: { ...state.selection, userStoryId },
      })),
      clearSelection: () => set({
        selection: { projectId: null, userStoryId: null },
      }),

      // Modal
      modal: { type: null, mode: 'create' },
      openModal: (type, mode = 'create', data) => set({
        modal: { type, mode, data },
      }),
      closeModal: () => set({
        modal: { type: null, mode: 'create', data: undefined },
      }),

      // View
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Search
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      // Sidebar
      showArchivedProjects: false,
      toggleShowArchivedProjects: () => set((state) => ({
        showArchivedProjects: !state.showArchivedProjects,
      })),
      showArchivedStories: false,
      toggleShowArchivedStories: () => set((state) => ({
        showArchivedStories: !state.showArchivedStories,
      })),

      // Sidebar widths
      projectSidebarWidth: 180,
      userStorySidebarWidth: 200,
      setProjectSidebarWidth: (width) => set({ projectSidebarWidth: width }),
      setUserStorySidebarWidth: (width) => set({ userStorySidebarWidth: width }),
    }),
    {
      name: 'hr-taskdashboard-ui',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        showArchivedProjects: state.showArchivedProjects,
        showArchivedStories: state.showArchivedStories,
        projectSidebarWidth: state.projectSidebarWidth,
        userStorySidebarWidth: state.userStorySidebarWidth,
      }),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('hr-taskdashboard-ui');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch {
      // Ignore parse errors
    }
  }
}
