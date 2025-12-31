import { useState } from 'react';
import { Plus, FolderOpen, Archive, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, ArchiveRestore } from 'lucide-react';
import { cn } from '@/utils';
import { useAppStore, useUIStore } from '@/stores';
import { Button } from '@/components/common';
import type { ProjectWithCounts } from '@/types';

interface ProjectSidebarProps {
  width: number;
}

export function ProjectSidebar({ width }: ProjectSidebarProps) {
  const { projects, archiveProject, unarchiveProject, deleteProject } = useAppStore();
  const {
    selection,
    selectProject,
    clearSelection,
    openModal,
    showArchivedProjects,
    toggleShowArchivedProjects,
  } = useUIStore();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  const handleEdit = (e: React.MouseEvent, project: ProjectWithCounts) => {
    e.stopPropagation();
    setMenuOpen(null);
    openModal('project', 'edit', project);
  };

  const handleArchive = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    await archiveProject(projectId);
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This will also delete all user stories and tasks within it.')) {
      setMenuOpen(null);
      await deleteProject(projectId);
      if (selection.projectId === projectId) {
        clearSelection();
      }
    }
  };

  const handleUnarchive = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    await unarchiveProject(projectId);
  };

  const toggleMenu = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === projectId ? null : projectId);
  };

  return (
    <aside className="sidebar flex flex-col flex-shrink-0" style={{ width }}>
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => openModal('project', 'create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* All Tasks */}
        <div
          onClick={clearSelection}
          className={cn(
            'sidebar-item flex items-center gap-2',
            selection.projectId === null && 'active'
          )}
        >
          <FolderOpen className="w-4 h-4" />
          <span>All Tasks</span>
        </div>

        {/* Active Projects */}
        {activeProjects.map(project => (
          <div
            key={project.id}
            onClick={() => selectProject(project.id)}
            className={cn(
              'sidebar-item group relative',
              selection.projectId === project.id && 'active'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="truncate flex-1">{project.title}</span>
              <div className="flex items-center gap-1">
                {project.blockedCount > 0 && (
                  <span className="text-xs bg-red-500 text-white rounded-full px-1.5">
                    {project.blockedCount}
                  </span>
                )}
                <button
                  onClick={(e) => toggleMenu(e, project.id)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Dropdown Menu */}
            {menuOpen === project.id && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={(e) => handleEdit(e, project)}
                  className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={(e) => handleArchive(e, project.id)}
                  className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Archived Projects Toggle */}
        {archivedProjects.length > 0 && (
          <>
            <div
              onClick={toggleShowArchivedProjects}
              className="sidebar-item flex items-center gap-2 text-gray-500"
            >
              {showArchivedProjects ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Archive className="w-4 h-4" />
              <span>Archived ({archivedProjects.length})</span>
            </div>

            {showArchivedProjects && archivedProjects.map(project => (
              <div
                key={project.id}
                onClick={() => selectProject(project.id)}
                className={cn(
                  'sidebar-item ml-4 text-gray-500 group relative',
                  selection.projectId === project.id && 'active'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate flex-1">{project.title}</span>
                  <button
                    onClick={(e) => toggleMenu(e, project.id)}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                {/* Dropdown Menu for Archived */}
                {menuOpen === project.id && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={(e) => handleUnarchive(e, project.id)}
                      className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
