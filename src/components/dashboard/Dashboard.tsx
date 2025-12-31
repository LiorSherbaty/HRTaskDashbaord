import { useEffect, useMemo } from 'react';
import { AlertTriangle, Zap, Clock, AlertCircle, Circle } from 'lucide-react';
import { useAppStore, useUIStore, useFilterStore } from '@/stores';
import { DashboardSection } from './DashboardSection';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { TaskStatus } from '@/types';
import { matchesSearch } from '@/utils';

export function Dashboard() {
  const { tasks, isLoading, loadAllTasks, loadTasksForProject } = useAppStore();
  const { selection } = useUIStore();
  const { searchTerm, showBlockedOnly, showDueSoonOnly, showStaleOnly, statusFilter } = useFilterStore();

  useEffect(() => {
    if (selection.projectId) {
      loadTasksForProject(selection.projectId);
    } else {
      loadAllTasks();
    }
  }, [selection.projectId, loadAllTasks, loadTasksForProject]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter (includes tags)
      if (searchTerm && !matchesSearch(task.title, searchTerm) &&
          !matchesSearch(task.description, searchTerm) &&
          !matchesSearch(task.projectTitle, searchTerm) &&
          !matchesSearch(task.userStoryTitle, searchTerm) &&
          !matchesSearch(task.tags?.join(' '), searchTerm)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Quick filters
      if (showBlockedOnly && !task.isBlocked) return false;
      if (showDueSoonOnly && !task.isDueSoon) return false;
      if (showStaleOnly && !task.isStale) return false;

      return true;
    });
  }, [tasks, searchTerm, statusFilter, showBlockedOnly, showDueSoonOnly, showStaleOnly]);

  // Categorize tasks into sections
  const newTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === TaskStatus.New),
    [filteredTasks]
  );

  const blockedTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === TaskStatus.Blocked),
    [filteredTasks]
  );

  const activeTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === TaskStatus.Active),
    [filteredTasks]
  );

  const dueSoonTasks = useMemo(() =>
    filteredTasks.filter(t => t.isDueSoon && t.status !== TaskStatus.Completed),
    [filteredTasks]
  );

  const staleTasks = useMemo(() =>
    filteredTasks.filter(t => t.isStale && t.status !== TaskStatus.Completed && t.status !== TaskStatus.Blocked),
    [filteredTasks]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasTasks = newTasks.length > 0 || blockedTasks.length > 0 || activeTasks.length > 0 ||
                   dueSoonTasks.length > 0 || staleTasks.length > 0;

  if (!hasTasks) {
    return (
      <EmptyState
        title="No tasks found"
        description={searchTerm
          ? "Try adjusting your search or filters"
          : "Create a project and add some tasks to get started"
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      <DashboardSection
        title="New"
        tasks={newTasks}
        accentColor="gray"
        icon={<Circle className="w-4 h-4" />}
      />

      <DashboardSection
        title="Blocked / Waiting"
        tasks={blockedTasks}
        accentColor="red"
        icon={<AlertTriangle className="w-4 h-4" />}
      />

      <DashboardSection
        title="Active"
        tasks={activeTasks}
        accentColor="blue"
        icon={<Zap className="w-4 h-4" />}
      />

      <DashboardSection
        title="Due Soon"
        tasks={dueSoonTasks}
        accentColor="yellow"
        icon={<Clock className="w-4 h-4" />}
      />

      <DashboardSection
        title="Stale (not updated in 7+ days)"
        tasks={staleTasks}
        accentColor="gray"
        icon={<AlertCircle className="w-4 h-4" />}
        defaultOpen={false}
      />
    </div>
  );
}
