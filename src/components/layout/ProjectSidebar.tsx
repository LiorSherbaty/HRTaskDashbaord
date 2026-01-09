import { useState } from 'react';
import { Plus, FolderOpen, Archive, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, ArchiveRestore, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/utils';
import { useAppStore, useUIStore } from '@/stores';
import { Button } from '@/components/common';
import type { ProjectWithCounts } from '@/types';

interface ProjectSidebarProps {
  width: number;
}

interface SortableProjectItemProps {
  project: ProjectWithCounts;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  menuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
}

function SortableProjectItem({
  project,
  isSelected,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
  menuOpen,
  onToggleMenu,
}: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'sidebar-item group relative',
        isSelected && 'active',
        isDragging && 'opacity-50 bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 rounded cursor-grab opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
          >
            <GripVertical className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <span className="truncate flex-1">{project.title}</span>
        </div>
        <div className="flex items-center gap-1">
          {project.blockedCount > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full px-1.5">
              {project.blockedCount}
            </span>
          )}
          <button
            onClick={onToggleMenu}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          <button
            onClick={onEdit}
            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={onArchive}
            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </button>
          <button
            onClick={onDelete}
            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar({ width }: ProjectSidebarProps) {
  const { projects, archiveProject, unarchiveProject, deleteProject, reorderProjects } = useAppStore();
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeProjects.findIndex(p => p.id === active.id);
    const newIndex = activeProjects.findIndex(p => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Create new order
      const newOrder = [...activeProjects];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      // Update database
      await reorderProjects(newOrder.map(p => p.id));
    }
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

        {/* Active Projects - Sortable */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeProjects.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {activeProjects.map(project => (
              <SortableProjectItem
                key={project.id}
                project={project}
                isSelected={selection.projectId === project.id}
                onSelect={() => selectProject(project.id)}
                onEdit={(e) => handleEdit(e, project)}
                onArchive={(e) => handleArchive(e, project.id)}
                onDelete={(e) => handleDelete(e, project.id)}
                menuOpen={menuOpen === project.id}
                onToggleMenu={(e) => toggleMenu(e, project.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

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
