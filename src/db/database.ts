import Dexie, { type Table } from 'dexie';
import type { Project, UserStory, Task } from '@/types';

export class HRTaskDashboardDB extends Dexie {
  projects!: Table<Project, string>;
  userStories!: Table<UserStory, string>;
  tasks!: Table<Task, string>;

  constructor() {
    super('HRTaskDashboardDB');

    this.version(1).stores({
      projects: 'id, title, createdAt, isArchived',
      userStories: 'id, projectId, title, createdAt, isArchived',
      tasks: 'id, userStoryId, status, createdAt, startDate, dueDate, lastUpdatedAt, isBlocked, isArchived',
    });

    // Date conversion hooks
    this.projects.hook('reading', (obj) => {
      obj.createdAt = new Date(obj.createdAt);
      return obj;
    });

    this.userStories.hook('reading', (obj) => {
      obj.createdAt = new Date(obj.createdAt);
      return obj;
    });

    this.tasks.hook('reading', (obj) => {
      obj.createdAt = new Date(obj.createdAt);
      obj.lastUpdatedAt = new Date(obj.lastUpdatedAt);
      if (obj.startDate) obj.startDate = new Date(obj.startDate);
      if (obj.dueDate) obj.dueDate = new Date(obj.dueDate);
      if (obj.completedAt) obj.completedAt = new Date(obj.completedAt);
      if (obj.blockedAt) obj.blockedAt = new Date(obj.blockedAt);
      if (obj.activityLog) {
        obj.activityLog = obj.activityLog.map((entry: { id: string; date: string | Date; note: string; createdAt: string | Date }) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
        }));
      }
      return obj;
    });
  }
}

export const db = new HRTaskDashboardDB();
