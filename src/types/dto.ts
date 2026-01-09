import type { TaskStatus } from './enums';

export interface CreateProjectDto {
  title: string;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  tags?: string[];
  isArchived?: boolean;
}

export interface CreateUserStoryDto {
  projectId: string;
  title: string;
  description?: string;
  tags?: string[];
}

export interface UpdateUserStoryDto {
  title?: string;
  description?: string;
  tags?: string[];
  isArchived?: boolean;
  projectId?: string;
  sortOrder?: number;
}

export interface CreateTaskDto {
  userStoryId: string;
  title: string;
  description?: string;
  tags?: string[];
  dueDate?: Date;
  startDate?: Date;
  lastUpdatedAt?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  tags?: string[];
  status?: TaskStatus;
  dueDate?: Date | null;
  startDate?: Date | null;
  blockedBy?: string;
  blockedReason?: string;
  lastUpdatedAt?: Date;
  userStoryId?: string;
}

export interface AddActivityLogDto {
  taskId: string;
  note: string;
  date?: Date;
}
