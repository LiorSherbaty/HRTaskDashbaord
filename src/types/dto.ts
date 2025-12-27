import type { TaskStatus } from './enums';

export interface CreateProjectDto {
  title: string;
  description?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateUserStoryDto {
  projectId: string;
  title: string;
  description?: string;
}

export interface UpdateUserStoryDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateTaskDto {
  userStoryId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  startDate?: Date;
  lastUpdatedAt?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
  startDate?: Date | null;
  blockedBy?: string;
  blockedReason?: string;
  lastUpdatedAt?: Date;
}

export interface AddActivityLogDto {
  taskId: string;
  note: string;
  date?: Date;
}
