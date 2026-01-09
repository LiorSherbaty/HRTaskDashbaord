import type { TaskStatus } from './enums';

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  isArchived: boolean;
  sortOrder: number;
}

export interface UserStory {
  id: string;
  projectId: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  isArchived: boolean;
  sortOrder: number;
}

export interface ActivityLogEntry {
  id: string;
  date: Date;
  note: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  userStoryId: string;
  title: string;
  description: string;
  tags: string[];
  status: TaskStatus;
  createdAt: Date;
  startDate: Date | null;
  dueDate: Date | null;
  lastUpdatedAt: Date;
  completedAt: Date | null;
  isBlocked: boolean;
  blockedAt: Date | null;
  blockedBy: string;
  blockedReason: string;
  activityLog: ActivityLogEntry[];
  isArchived: boolean;
}
