import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { tagService } from '@/services';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function TagInput({
  value,
  onChange,
  label,
  placeholder = 'Add tags...',
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load all existing tags for autocomplete
  useEffect(() => {
    tagService.getAllTags().then(setAllTags);
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = allTags.filter(
        tag =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(tag)
      );
      setSuggestions(filtered);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, allTags, value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      // Add to allTags if it's new
      if (!allTags.includes(trimmedTag)) {
        setAllTags(prev => [...prev, trimmedTag].sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase())
        ));
      }
    }
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 p-2 min-h-[42px]',
          'rounded-md border bg-white dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          error && 'border-red-500',
          'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected Tags */}
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-sm rounded-full
                       bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-red-600 dark:hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent
                     text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="relative">
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800
                         border border-gray-300 dark:border-gray-600 rounded-md shadow-lg
                         max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer',
                  'text-gray-900 dark:text-gray-100',
                  index === selectedIndex
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create new tag hint */}
      {showSuggestions && inputValue.trim() && !suggestions.includes(inputValue.trim()) && !value.includes(inputValue.trim()) && (
        <div className="relative">
          <div
            onClick={() => addTag(inputValue)}
            className="absolute z-10 w-full mt-1 px-3 py-2 text-sm cursor-pointer
                       bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                       rounded-md shadow-lg text-gray-600 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Create tag "{inputValue.trim()}"
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
