import type { Task, Project, UserStory } from './entities';

export interface TaskViewModel extends Task {
  projectId: string;
  projectTitle: string;
  userStoryTitle: string;
  daysOpen: number;
  daysBlocked: number | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  isDueSoon: boolean;
  isStale: boolean;
  daysSinceUpdate: number;
}

export interface ProjectWithCounts extends Project {
  userStoryCount: number;
  taskCount: number;
  blockedCount: number;
  activeCount: number;
}

export interface UserStoryWithCounts extends UserStory {
  taskCount: number;
  completedCount: number;
  blockedCount: number;
}

export interface CompletedTaskInfo {
  id: string;
  title: string;
  userStoryTitle: string;
  completedAt: Date | null;
  daysOpen: number | null;
}

export interface ProjectCompletedTasks {
  projectId: string;
  projectTitle: string;
  count: number;
  tasks: CompletedTaskInfo[];
}

export interface BlockedTaskInfo {
  id: string;
  title: string;
  projectTitle: string;
  userStoryTitle: string;
  blockedBy: string;
  blockedReason: string;
  daysBlocked: number | null;
}

export interface QuarterlyReportSummary {
  totalCompleted: number;
  totalActive: number;
  totalBlocked: number;
  avgDaysToComplete: number;
}

export interface QuarterlyReportData {
  quarter: number;
  year: number;
  startDate: Date;
  endDate: Date;
  summary: QuarterlyReportSummary;
  completedByProject: ProjectCompletedTasks[];
  blockedTasks: BlockedTaskInfo[];
}
