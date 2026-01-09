import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Dashboard } from '@/components/dashboard';
import { KanbanBoard } from '@/components/kanban';
import { CompletedTab } from '@/components/completed';
import {
  ProjectDialog,
  UserStoryDialog,
  TaskDialog,
  BlockedDialog,
  TaskDetailDialog,
  QuarterlyReportDialog,
  SettingsDialog,
  HelpDialog,
} from '@/components/dialogs';
import { useUIStore, useAppStore } from '@/stores';
import { cleanupOrphanedRecords } from '@/db';

function AppContent() {
  const { activeTab, selection } = useUIStore();
  const { loadTasks } = useAppStore();

  // Load tasks when user story is selected
  useEffect(() => {
    if (selection.userStoryId) {
      loadTasks(selection.userStoryId);
    }
  }, [selection.userStoryId, loadTasks]);

  // Render content based on active tab and selection
  const renderContent = () => {
    if (activeTab === 'completed') {
      return <CompletedTab />;
    }

    // If a user story is selected, show Kanban board
    if (selection.userStoryId) {
      return <KanbanBoard userStoryId={selection.userStoryId} />;
    }

    // Otherwise show the dashboard
    return <Dashboard />;
  };

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  );
}

function App() {
  const { isDarkMode } = useUIStore();
  const { loadProjects } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Cleanup orphaned records and initialize app on mount
  useEffect(() => {
    async function initialize() {
      // Clean up any orphaned tasks/stories from corrupted data
      await cleanupOrphanedRecords();
      // Load fresh data
      await loadProjects();
      setIsInitialized(true);
    }
    initialize();
  }, [loadProjects]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals
      if (e.key === 'Escape') {
        useUIStore.getState().closeModal();
      }

      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AppContent />

      {/* All Dialogs */}
      <ProjectDialog />
      <UserStoryDialog />
      <TaskDialog />
      <BlockedDialog />
      <TaskDetailDialog />
      <QuarterlyReportDialog />
      <SettingsDialog />
      <HelpDialog />
    </div>
  );
}

export default App;
