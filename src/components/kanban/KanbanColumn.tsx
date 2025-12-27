import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/utils';
import type { TaskViewModel } from '@/types';
import { TaskStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskViewModel[];
}

export function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className={cn('p-3 rounded-t-lg border-b', colors.bg, colors.border)}>
        <div className="flex items-center justify-between">
          <h3 className={cn('font-medium text-sm', colors.text)}>{label}</h3>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', colors.bg, colors.text)}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto',
          isOver && 'bg-blue-50 dark:bg-blue-900/20'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
