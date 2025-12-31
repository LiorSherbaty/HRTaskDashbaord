import { db } from '@/db';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  AddActivityLogDto,
  TaskViewModel,
  ActivityLogEntry,
} from '@/types';
import { TaskStatus } from '@/types';
import { generateId, getDaysOpen, getDaysBlocked, getDaysUntil, isOverdue, isDueSoon, isStale, getDaysAgo } from '@/utils';

class TaskService {
  async getByUserStoryId(userStoryId: string, includeArchived = false): Promise<Task[]> {
    const tasks = await db.tasks.where('userStoryId').equals(userStoryId).toArray();
    if (!includeArchived) {
      return tasks.filter(t => !t.isArchived);
    }
    return tasks;
  }

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async getAllActive(): Promise<Task[]> {
    return db.tasks
      .filter(t => !t.isArchived && t.status !== TaskStatus.Completed)
      .toArray();
  }

  async getAllBlocked(): Promise<Task[]> {
    return db.tasks
      .where('status')
      .equals(TaskStatus.Blocked)
      .filter(t => !t.isArchived)
      .toArray();
  }

  async getAllCompleted(): Promise<Task[]> {
    return db.tasks
      .filter(t => t.isArchived || t.status === TaskStatus.Completed)
      .toArray();
  }

  async getTasksWithViewModels(tasks: Task[]): Promise<TaskViewModel[]> {
    const result: TaskViewModel[] = [];

    for (const task of tasks) {
      const story = await db.userStories.get(task.userStoryId);
      if (!story) continue;

      const project = await db.projects.get(story.projectId);
      if (!project) continue;

      result.push({
        ...task,
        projectId: project.id,
        projectTitle: project.title,
        userStoryTitle: story.title,
        daysOpen: getDaysOpen(task.startDate, task.createdAt),
        daysBlocked: getDaysBlocked(task.blockedAt),
        daysUntilDue: task.dueDate ? getDaysUntil(task.dueDate) : null,
        isOverdue: isOverdue(task.dueDate),
        isDueSoon: isDueSoon(task.dueDate, 7),
        isStale: isStale(task.lastUpdatedAt, 7),
        daysSinceUpdate: getDaysAgo(task.lastUpdatedAt),
      });
    }

    return result;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: generateId(),
      userStoryId: dto.userStoryId,
      title: dto.title,
      description: dto.description || '',
      tags: dto.tags || [],
      status: TaskStatus.New,
      createdAt: now,
      startDate: dto.startDate || null,
      dueDate: dto.dueDate || null,
      lastUpdatedAt: dto.lastUpdatedAt || now,
      completedAt: null,
      isBlocked: false,
      blockedAt: null,
      blockedBy: '',
      blockedReason: '',
      activityLog: [],
      isArchived: false,
    };
    await db.tasks.add(task);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;

    const updates: Partial<Task> = {
      ...dto,
      lastUpdatedAt: dto.lastUpdatedAt || new Date(),
    };

    await db.tasks.update(id, updates);
    return this.getById(id);
  }

  async updateStatus(id: string, newStatus: TaskStatus): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;

    const now = new Date();
    const updates: Partial<Task> = {
      status: newStatus,
      lastUpdatedAt: now,
    };

    const oldStatus = task.status;

    // Moving to Active: set startDate if not set
    if (newStatus === TaskStatus.Active && !task.startDate) {
      updates.startDate = now;
    }

    // Moving to Blocked: set blockedAt and isBlocked
    if (newStatus === TaskStatus.Blocked) {
      updates.isBlocked = true;
      updates.blockedAt = now;
      if (!task.startDate) {
        updates.startDate = now;
      }
    }

    // Moving away from Blocked: clear blocked fields
    if (oldStatus === TaskStatus.Blocked && newStatus !== TaskStatus.Blocked) {
      updates.isBlocked = false;
      updates.blockedAt = null;
      updates.blockedBy = '';
      updates.blockedReason = '';
    }

    // Moving to Completed: set completedAt
    if (newStatus === TaskStatus.Completed) {
      updates.completedAt = now;
    }

    // Moving away from Completed: clear completedAt
    if (oldStatus === TaskStatus.Completed && newStatus !== TaskStatus.Completed) {
      updates.completedAt = null;
    }

    await db.tasks.update(id, updates);
    return this.getById(id);
  }

  async setBlocked(id: string, blockedBy: string, blockedReason: string): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;

    const now = new Date();
    await db.tasks.update(id, {
      status: TaskStatus.Blocked,
      isBlocked: true,
      blockedAt: now,
      blockedBy,
      blockedReason,
      lastUpdatedAt: now,
      startDate: task.startDate || now,
    });

    return this.getById(id);
  }

  async clearBlocked(id: string): Promise<Task | undefined> {
    return this.updateStatus(id, TaskStatus.Active);
  }

  async addActivityLog(dto: AddActivityLogDto): Promise<Task | undefined> {
    const task = await this.getById(dto.taskId);
    if (!task) return undefined;

    const entryDate = dto.date || new Date();
    const entry: ActivityLogEntry = {
      id: generateId(),
      date: entryDate,
      note: dto.note,
      createdAt: new Date(),
    };

    const updatedLog = [...task.activityLog, entry].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    await db.tasks.update(dto.taskId, {
      activityLog: updatedLog,
      lastUpdatedAt: entryDate,
    });

    return this.getById(dto.taskId);
  }

  async updateActivityLogEntry(
    taskId: string,
    entryId: string,
    updates: { note?: string; date?: Date }
  ): Promise<Task | undefined> {
    const task = await this.getById(taskId);
    if (!task) return undefined;

    const updatedLog = task.activityLog.map(entry =>
      entry.id === entryId
        ? { ...entry, ...updates }
        : entry
    ).sort((a, b) => b.date.getTime() - a.date.getTime());

    await db.tasks.update(taskId, {
      activityLog: updatedLog,
      lastUpdatedAt: new Date(),
    });

    return this.getById(taskId);
  }

  async deleteActivityLogEntry(taskId: string, entryId: string): Promise<Task | undefined> {
    const task = await this.getById(taskId);
    if (!task) return undefined;

    const updatedLog = task.activityLog.filter(entry => entry.id !== entryId);

    await db.tasks.update(taskId, {
      activityLog: updatedLog,
      lastUpdatedAt: new Date(),
    });

    return this.getById(taskId);
  }

  async archive(id: string): Promise<void> {
    await db.tasks.update(id, { isArchived: true });
  }

  async unarchive(id: string): Promise<void> {
    await db.tasks.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  }
}

export const taskService = new TaskService();
