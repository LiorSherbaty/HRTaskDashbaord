import { useState, useMemo } from 'react';
import { CheckCircle, FileText, Calendar } from 'lucide-react';
import { CompletedTaskCard } from './CompletedTaskCard';
import { Button, EmptyState, SearchInput, Select } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';
import { TaskStatus } from '@/types';
import { getQuarterRange, getCurrentQuarter, formatQuarter } from '@/utils';

type TimeFilter = 'all' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'lastQuarter';

const TIME_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
];

export function CompletedTab() {
  const { tasks } = useAppStore();
  const { openModal, selection, clearSelection } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('thisMonth');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      clearSelection();
    }
  };

  const completedTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.status === TaskStatus.Completed);

    // Apply project/user story selection filter
    if (selection.projectId) {
      filtered = filtered.filter(t => t.projectId === selection.projectId);
    }
    if (selection.userStoryId) {
      filtered = filtered.filter(t => t.userStoryId === selection.userStoryId);
    }

    // Apply time filter
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { year, quarter } = getCurrentQuarter();
    const thisQuarterRange = getQuarterRange(year, quarter);
    const lastQuarter = quarter === 1 ? 4 : quarter - 1;
    const lastQuarterYear = quarter === 1 ? year - 1 : year;
    const lastQuarterRange = getQuarterRange(lastQuarterYear, lastQuarter);

    switch (timeFilter) {
      case 'thisWeek':
        filtered = filtered.filter(t => new Date(t.lastUpdatedAt) >= startOfWeek);
        break;
      case 'thisMonth':
        filtered = filtered.filter(t => new Date(t.lastUpdatedAt) >= startOfMonth);
        break;
      case 'thisQuarter':
        filtered = filtered.filter(t => {
          const date = new Date(t.lastUpdatedAt);
          return date >= thisQuarterRange.start && date <= thisQuarterRange.end;
        });
        break;
      case 'lastQuarter':
        filtered = filtered.filter(t => {
          const date = new Date(t.lastUpdatedAt);
          return date >= lastQuarterRange.start && date <= lastQuarterRange.end;
        });
        break;
    }

    // Apply search filter (includes tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.projectTitle.toLowerCase().includes(query) ||
        t.userStoryTitle.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by completion date (most recent first)
    return filtered.sort((a, b) =>
      new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
    );
  }, [tasks, selection, timeFilter, searchQuery]);

  const handleOpenReport = () => {
    openModal('quarterlyReport', 'view');
  };

  const { year, quarter } = getCurrentQuarter();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Completed Tasks
          </h2>
          <span className="px-2.5 py-0.5 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
            {completedTasks.length}
          </span>
        </div>

        <Button onClick={handleOpenReport}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Quarterly Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search completed tasks..."
          className="w-64"
        />

        <Select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          className="w-40"
        >
          {TIME_FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Current: {formatQuarter(year, quarter)}</span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        {completedTasks.length > 0 ? (
          <div className="space-y-3">
            {completedTasks.map(task => (
              <CompletedTaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CheckCircle className="w-12 h-12" />}
            title="No completed tasks"
            description={
              searchQuery
                ? "No tasks match your search criteria"
                : "Tasks you complete will appear here"
            }
          />
        )}
      </div>
    </div>
  );
}
