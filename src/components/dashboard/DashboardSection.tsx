import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import type { TaskViewModel } from '@/types';
import { TaskCard } from './TaskCard';

interface DashboardSectionProps {
  title: string;
  tasks: TaskViewModel[];
  accentColor: 'red' | 'blue' | 'yellow' | 'gray';
  icon?: React.ReactNode;
  defaultOpen?: boolean;
}

const accentColors = {
  red: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  yellow: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
  gray: 'border-l-gray-400 bg-gray-50 dark:bg-gray-800/50',
};

const headerColors = {
  red: 'text-red-700 dark:text-red-400',
  blue: 'text-blue-700 dark:text-blue-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  gray: 'text-gray-700 dark:text-gray-400',
};

export function DashboardSection({
  title,
  tasks,
  accentColor,
  icon,
  defaultOpen = true,
}: DashboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div className={cn('rounded-lg border-l-4 mb-4', accentColors[accentColor])}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2 p-3 text-left',
          headerColors[accentColor]
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {icon}
        <span className="font-medium">{title}</span>
        <span className="text-sm opacity-75">({tasks.length})</span>
      </button>

      {isOpen && (
        <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
