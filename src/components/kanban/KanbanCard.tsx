import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, AlertTriangle, MoreVertical } from 'lucide-react';
import { cn, formatShortDate } from '@/utils';
import type { TaskViewModel } from '@/types';
import { useUIStore, useAppStore } from '@/stores';
import { useState } from 'react';

interface KanbanCardProps {
  task: TaskViewModel;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { openModal } = useUIStore();
  const { deleteTask, archiveTask } = useAppStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.menu-trigger')) return;
    openModal('taskDetail', 'view', { task });
  };

  const handleEdit = () => {
    setShowMenu(false);
    openModal('task', 'edit', { task });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
    setShowMenu(false);
  };

  const handleArchive = async () => {
    await archiveTask(task.id);
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab',
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all',
        isDragging && 'opacity-50 shadow-lg',
        task.isOverdue && 'border-l-4 border-l-red-500',
        task.isDueSoon && !task.isOverdue && 'border-l-4 border-l-yellow-500'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
          {task.title}
        </h4>
        <div className="relative menu-trigger">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive();
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Archive
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{task.daysOpen} days open</span>
        </div>

        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1',
            task.isOverdue && 'text-red-600 dark:text-red-400',
            task.isDueSoon && !task.isOverdue && 'text-yellow-600 dark:text-yellow-400'
          )}>
            <Clock className="w-3 h-3" />
            <span>Due: {formatShortDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {task.isBlocked && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" />
          <span className="truncate">{task.blockedBy}</span>
        </div>
      )}
    </div>
  );
}
