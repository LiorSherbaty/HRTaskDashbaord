import { Search, X } from 'lucide-react';
import { cn } from '@/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border pl-9 pr-9 py-2 text-sm',
          'bg-white dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          'text-gray-900 dark:text-gray-100',
          'placeholder-gray-500 dark:placeholder-gray-400',
          'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
