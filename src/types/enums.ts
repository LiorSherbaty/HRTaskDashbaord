export const TaskStatus = {
  New: 'new',
  Active: 'active',
  Blocked: 'blocked',
  Completed: 'completed',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.New]: 'New',
  [TaskStatus.Active]: 'Active',
  [TaskStatus.Blocked]: 'Blocked',
  [TaskStatus.Completed]: 'Completed',
};

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  [TaskStatus.New]: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  [TaskStatus.Active]: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  [TaskStatus.Blocked]: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
  },
  [TaskStatus.Completed]: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
};
