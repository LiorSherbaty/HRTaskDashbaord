import { useEffect, useState } from 'react';
import { Plus, FileText, Archive, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, ArchiveRestore } from 'lucide-react';
import { cn } from '@/utils';
import { useAppStore, useUIStore } from '@/stores';
import { Button } from '@/components/common';
import type { UserStoryWithCounts } from '@/types';

interface UserStorySidebarProps {
  width: number;
}

export function UserStorySidebar({ width }: UserStorySidebarProps) {
  const { userStories, loadUserStories, archiveUserStory, unarchiveUserStory, deleteUserStory } = useAppStore();
  const {
    selection,
    selectUserStory,
    openModal,
    showArchivedStories,
    toggleShowArchivedStories,
  } = useUIStore();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (selection.projectId) {
      loadUserStories(selection.projectId);
    }
  }, [selection.projectId, loadUserStories]);

  const activeStories = userStories.filter(s => !s.isArchived);
  const archivedStories = userStories.filter(s => s.isArchived);

  const handleEdit = (e: React.MouseEvent, story: UserStoryWithCounts) => {
    e.stopPropagation();
    setMenuOpen(null);
    openModal('userStory', 'edit', { userStory: story });
  };

  const handleArchive = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    await archiveUserStory(storyId);
  };

  const handleUnarchive = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    await unarchiveUserStory(storyId);
  };

  const handleDelete = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this user story? This will also delete all tasks within it.')) {
      setMenuOpen(null);
      await deleteUserStory(storyId);
      if (selection.userStoryId === storyId) {
        selectUserStory(null);
      }
    }
  };

  const toggleMenu = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === storyId ? null : storyId);
  };

  return (
    <aside className="sidebar flex flex-col flex-shrink-0" style={{ width }}>
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => openModal('userStory', 'create', { projectId: selection.projectId })}
        >
          <Plus className="w-4 h-4 mr-2" />
          New User Story
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* All Stories (Dashboard view) */}
        <div
          onClick={() => selectUserStory(null)}
          className={cn(
            'sidebar-item flex items-center gap-2',
            selection.userStoryId === null && 'active'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>All Stories</span>
        </div>

        {/* Active User Stories */}
        {activeStories.map(story => (
          <div
            key={story.id}
            onClick={() => selectUserStory(story.id)}
            className={cn(
              'sidebar-item group relative',
              selection.userStoryId === story.id && 'active'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm flex-1">{story.title}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  {story.completedCount}/{story.taskCount}
                </span>
                <button
                  onClick={(e) => toggleMenu(e, story.id)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            {story.blockedCount > 0 && (
              <div className="text-xs text-red-500 mt-0.5">
                {story.blockedCount} blocked
              </div>
            )}
            {/* Dropdown Menu */}
            {menuOpen === story.id && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={(e) => handleEdit(e, story)}
                  className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={(e) => handleArchive(e, story.id)}
                  className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
                <button
                  onClick={(e) => handleDelete(e, story.id)}
                  className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Archived Stories Toggle */}
        {archivedStories.length > 0 && (
          <>
            <div
              onClick={toggleShowArchivedStories}
              className="sidebar-item flex items-center gap-2 text-gray-500"
            >
              {showArchivedStories ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Archive className="w-4 h-4" />
              <span>Archived ({archivedStories.length})</span>
            </div>

            {showArchivedStories && archivedStories.map(story => (
              <div
                key={story.id}
                onClick={() => selectUserStory(story.id)}
                className={cn(
                  'sidebar-item ml-4 text-gray-500 text-sm group relative',
                  selection.userStoryId === story.id && 'active'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate flex-1">{story.title}</span>
                  <button
                    onClick={(e) => toggleMenu(e, story.id)}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                {/* Dropdown Menu for Archived */}
                {menuOpen === story.id && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={(e) => handleUnarchive(e, story.id)}
                      className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, story.id)}
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
