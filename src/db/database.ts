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

    // Version 2: Add tags field with multi-entry index
    this.version(2).stores({
      projects: 'id, title, createdAt, isArchived, *tags',
      userStories: 'id, projectId, title, createdAt, isArchived, *tags',
      tasks: 'id, userStoryId, status, createdAt, startDate, dueDate, lastUpdatedAt, isBlocked, isArchived, *tags',
    });

    // Version 3: Add sortOrder field for custom ordering
    this.version(3)
      .stores({
        projects: 'id, title, createdAt, isArchived, sortOrder, *tags',
        userStories: 'id, projectId, title, createdAt, isArchived, sortOrder, *tags',
        tasks: 'id, userStoryId, status, createdAt, startDate, dueDate, lastUpdatedAt, isBlocked, isArchived, *tags',
      })
      .upgrade(async (tx) => {
        // Migrate existing projects: set sortOrder based on createdAt order
        const projects = await tx.table('projects').toArray();
        const sortedProjects = projects.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        for (let i = 0; i < sortedProjects.length; i++) {
          await tx.table('projects').update(sortedProjects[i].id, { sortOrder: i });
        }

        // Migrate existing user stories: set sortOrder based on createdAt order within each project
        const userStories = await tx.table('userStories').toArray();
        const storiesByProject = new Map<string, typeof userStories>();
        for (const story of userStories) {
          const projectStories = storiesByProject.get(story.projectId) || [];
          projectStories.push(story);
          storiesByProject.set(story.projectId, projectStories);
        }
        for (const [, stories] of storiesByProject) {
          const sortedStories = stories.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          for (let i = 0; i < sortedStories.length; i++) {
            await tx.table('userStories').update(sortedStories[i].id, { sortOrder: i });
          }
        }
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

/**
 * Cleans up orphaned records in the database.
 * This removes:
 * - Tasks whose userStoryId doesn't exist
 * - User stories whose projectId doesn't exist
 */
export async function cleanupOrphanedRecords(): Promise<{ deletedTasks: number; deletedStories: number }> {
  let deletedTasks = 0;
  let deletedStories = 0;

  // Get all valid project IDs
  const projects = await db.projects.toArray();
  const projectIds = new Set(projects.map(p => p.id));

  // Get all valid user story IDs
  const userStories = await db.userStories.toArray();
  const storyIds = new Set(userStories.map(s => s.id));

  // Find and delete orphaned user stories (stories without valid project)
  const orphanedStories = userStories.filter(s => !projectIds.has(s.projectId));
  for (const story of orphanedStories) {
    await db.userStories.delete(story.id);
    deletedStories++;
    // Remove from valid storyIds since we deleted it
    storyIds.delete(story.id);
  }

  // Find and delete orphaned tasks (tasks without valid user story)
  const tasks = await db.tasks.toArray();
  const orphanedTasks = tasks.filter(t => !storyIds.has(t.userStoryId));
  for (const task of orphanedTasks) {
    await db.tasks.delete(task.id);
    deletedTasks++;
  }

  if (deletedTasks > 0 || deletedStories > 0) {
    console.log(`Cleaned up ${deletedTasks} orphaned tasks and ${deletedStories} orphaned user stories`);
  }

  return { deletedTasks, deletedStories };
}
