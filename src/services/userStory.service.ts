import { db } from '@/db';
import type { UserStory, CreateUserStoryDto, UpdateUserStoryDto, UserStoryWithCounts } from '@/types';
import { TaskStatus } from '@/types';
import { generateId } from '@/utils';

class UserStoryService {
  async getByProjectId(projectId: string, includeArchived = false): Promise<UserStory[]> {
    const stories = await db.userStories.where('projectId').equals(projectId).toArray();
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
    const story: UserStory = {
      id: generateId(),
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description || '',
      tags: dto.tags || [],
      createdAt: new Date(),
      isArchived: false,
    };
    await db.userStories.add(story);
    return story;
  }

  async update(id: string, dto: UpdateUserStoryDto): Promise<UserStory | undefined> {
    await db.userStories.update(id, dto as Partial<UserStory>);
    return this.getById(id);
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
