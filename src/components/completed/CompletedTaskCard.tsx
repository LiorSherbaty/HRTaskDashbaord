import { Calendar, FolderOpen, RotateCcw } from 'lucide-react';
import { Button, TagBadge } from '@/components/common';
import { useAppStore } from '@/stores';
import type { TaskViewModel } from '@/types';
import { TaskStatus } from '@/types';
import { formatDate } from '@/utils';

interface CompletedTaskCardProps {
  task: TaskViewModel;
}

export function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  const { updateTaskStatus, loadTasks } = useAppStore();

  const handleReopen = async () => {
    await updateTaskStatus(task.id, TaskStatus.Active);
    await loadTasks(task.userStoryId);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 line-through opacity-75">
            {task.title}
          </h4>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <FolderOpen className="w-3 h-3" />
            <span className="truncate">{task.projectTitle} &gt; {task.userStoryTitle}</span>
          </div>

          {task.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Completed: {formatDate(task.lastUpdatedAt)}</span>
            </div>
            {task.startDate && (
              <span>Duration: {task.daysOpen} days</span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReopen}
          title="Reopen task"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
