import { useEffect } from 'react';
import { Header } from './Header';
import { ProjectSidebar } from './ProjectSidebar';
import { UserStorySidebar } from './UserStorySidebar';
import { ResizeHandle } from './ResizeHandle';
import { useAppStore, useUIStore } from '@/stores';
import { seedDatabase } from '@/db';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { loadProjects } = useAppStore();
  const {
    selection,
    projectSidebarWidth,
    userStorySidebarWidth,
    setProjectSidebarWidth,
    setUserStorySidebarWidth,
  } = useUIStore();

  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      await loadProjects();
    };
    init();
  }, [loadProjects]);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <ProjectSidebar width={projectSidebarWidth} />
        <ResizeHandle
          onResize={setProjectSidebarWidth}
          minWidth={120}
          maxWidth={400}
        />
        {selection.projectId && (
          <>
            <UserStorySidebar width={userStorySidebarWidth} />
            <ResizeHandle
              onResize={setUserStorySidebarWidth}
              minWidth={120}
              maxWidth={400}
            />
          </>
        )}
        <main className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
