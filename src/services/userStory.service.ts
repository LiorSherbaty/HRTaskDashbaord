import { db } from '@/db';
import type { UserStory, CreateUserStoryDto, UpdateUserStoryDto, UserStoryWithCounts } from '@/types';
import { TaskStatus } from '@/types';
import { generateId } from '@/utils';

class UserStoryService {
  async getAll(includeArchived = false): Promise<UserStory[]> {
    const stories = await db.userStories.orderBy('sortOrder').toArray();
    if (!includeArchived) {
      return stories.filter(s => !s.isArchived);
    }
    return stories;
  }

  async getByProjectId(projectId: string, includeArchived = false): Promise<UserStory[]> {
    const stories = await db.userStories.where('projectId').equals(projectId).toArray();
    // Sort by sortOrder
    stories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    if (!includeArchived) {
      return stories.filter(s => !s.isArchived);
    }
    return stories;
  }

  async getByProjectIdWithCounts(projectId: string, includeArchived = false): Promise<UserStoryWithCounts[]> {
    const stories = await this.getByProjectId(projectId, includeArchived);
    const result: UserStoryWithCounts[] = [];

    for (const story of stories) {
      const tasks = await db.tasks
        .where('userStoryId')
        .equals(story.id)
        .filter(t => !t.isArchived)
        .toArray();

      result.push({
        ...story,
        taskCount: tasks.length,
        completedCount: tasks.filter(t => t.status === TaskStatus.Completed).length,
        blockedCount: tasks.filter(t => t.status === TaskStatus.Blocked).length,
      });
    }

    return result;
  }

  async getById(id: string): Promise<UserStory | undefined> {
    return db.userStories.get(id);
  }

  async create(dto: CreateUserStoryDto): Promise<UserStory> {
    // Get max sortOrder within the same project and add new story at the bottom
    const projectStories = await db.userStories.where('projectId').equals(dto.projectId).toArray();
    const maxSortOrder = projectStories.length > 0
      ? Math.max(...projectStories.map(s => s.sortOrder ?? 0))
      : -1;

    const story: UserStory = {
      id: generateId(),
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description || '',
      tags: dto.tags || [],
      createdAt: new Date(),
      isArchived: false,
      sortOrder: maxSortOrder + 1,
    };
    await db.userStories.add(story);
    return story;
  }

  async update(id: string, dto: UpdateUserStoryDto): Promise<UserStory | undefined> {
    const existingStory = await this.getById(id);
    if (!existingStory) return undefined;

    // If projectId is changing, set sortOrder to max+1 in the new project
    if (dto.projectId && dto.projectId !== existingStory.projectId) {
      const newProjectStories = await db.userStories.where('projectId').equals(dto.projectId).toArray();
      const maxSortOrder = newProjectStories.length > 0
        ? Math.max(...newProjectStories.map(s => s.sortOrder ?? 0))
        : -1;
      dto.sortOrder = maxSortOrder + 1;
    }

    await db.userStories.update(id, dto as Partial<UserStory>);
    return this.getById(id);
  }

  async reorder(userStoryIds: string[]): Promise<void> {
    // Update sortOrder for each user story based on array index
    await db.transaction('rw', db.userStories, async () => {
      for (let i = 0; i < userStoryIds.length; i++) {
        await db.userStories.update(userStoryIds[i], { sortOrder: i });
      }
    });
  }

  async archive(id: string): Promise<void> {
    await db.userStories.update(id, { isArchived: true });
  }

  async unarchive(id: string): Promise<void> {
    await db.userStories.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    await db.tasks.where('userStoryId').equals(id).delete();
    await db.userStories.delete(id);
  }
}

export const userStoryService = new UserStoryService();
