import { FolderOpen } from 'lucide-react';
import { cn } from '@/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="text-gray-400 dark:text-gray-500 mb-4">
        {icon || <FolderOpen className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
