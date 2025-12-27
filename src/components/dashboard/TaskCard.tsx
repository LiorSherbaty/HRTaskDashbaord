import { Calendar, Clock, AlertTriangle, FolderOpen } from 'lucide-react';
import { cn, formatShortDate } from '@/utils';
import type { TaskViewModel } from '@/types';
import { StatusBadge } from '@/components/common';
import { useUIStore } from '@/stores';

interface TaskCardProps {
  task: TaskViewModel;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { openModal } = useUIStore();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      openModal('taskDetail', 'view', { task });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'card card-hover p-3 cursor-pointer',
        task.isOverdue && 'border-l-4 border-l-red-500',
        task.isDueSoon && !task.isOverdue && 'border-l-4 border-l-yellow-500'
      )}
    >
      {/* Title and Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
          {task.title}
        </h4>
        {task.isOverdue && (
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" title="Overdue" />
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <FolderOpen className="w-3 h-3" />
        <span className="truncate">{task.projectTitle}</span>
        <span>&gt;</span>
        <span className="truncate">{task.userStoryTitle}</span>
      </div>

      {/* Dates */}
      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Started: {task.startDate ? formatShortDate(task.startDate) : 'Not started'}</span>
          <span className="text-gray-400">({task.daysOpen} days open)</span>
        </div>

        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1',
            task.isOverdue && 'text-red-600 dark:text-red-400',
            task.isDueSoon && !task.isOverdue && 'text-yellow-600 dark:text-yellow-400'
          )}>
            <Clock className="w-3 h-3" />
            <span>Due: {formatShortDate(task.dueDate)}</span>
            {task.daysUntilDue !== null && (
              <span>
                ({task.daysUntilDue < 0
                  ? `${Math.abs(task.daysUntilDue)} days overdue`
                  : `${task.daysUntilDue} days left`})
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 text-gray-400">
          <span>Updated: {task.daysSinceUpdate} days ago</span>
          {task.isStale && (
            <span className="text-yellow-600 dark:text-yellow-400">(Stale)</span>
          )}
        </div>
      </div>

      {/* Blocked Info */}
      {task.isBlocked && (
        <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-1 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">Blocked: {task.blockedBy}</span>
          </div>
          {task.blockedReason && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">
              {task.blockedReason}
            </p>
          )}
          {task.daysBlocked !== null && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Blocked for {task.daysBlocked} days
            </p>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="mt-2">
        <StatusBadge status={task.status} />
      </div>
    </div>
  );
}
