import { db } from '@/db';
import type { Project, CreateProjectDto, UpdateProjectDto, ProjectWithCounts } from '@/types';
import { TaskStatus } from '@/types';
import { generateId } from '@/utils';

class ProjectService {
  async getAll(includeArchived = false): Promise<Project[]> {
    const query = db.projects.orderBy('createdAt');
    const projects = await query.toArray();
    if (!includeArchived) {
      return projects.filter(p => !p.isArchived);
    }
    return projects;
  }

  async getAllWithCounts(includeArchived = false): Promise<ProjectWithCounts[]> {
    const projects = await this.getAll(includeArchived);
    const result: ProjectWithCounts[] = [];

    for (const project of projects) {
      const stories = await db.userStories
        .where('projectId')
        .equals(project.id)
        .filter(s => !s.isArchived)
        .toArray();

      const storyIds = stories.map(s => s.id);

      let tasks: { status: TaskStatus }[] = [];
      if (storyIds.length > 0) {
        tasks = await db.tasks
          .where('userStoryId')
          .anyOf(storyIds)
          .filter(t => !t.isArchived)
          .toArray();
      }

      result.push({
        ...project,
        userStoryCount: stories.length,
        taskCount: tasks.length,
        blockedCount: tasks.filter(t => t.status === TaskStatus.Blocked).length,
        activeCount: tasks.filter(t => t.status === TaskStatus.Active).length,
      });
    }

    return result;
  }

  async getById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project: Project = {
      id: generateId(),
      title: dto.title,
      description: dto.description || '',
      createdAt: new Date(),
      isArchived: false,
    };
    await db.projects.add(project);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project | undefined> {
    await db.projects.update(id, dto);
    return this.getById(id);
  }

  async archive(id: string): Promise<void> {
    await db.projects.update(id, { isArchived: true });
  }

  async unarchive(id: string): Promise<void> {
    await db.projects.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    const stories = await db.userStories.where('projectId').equals(id).toArray();
    for (const story of stories) {
      await db.tasks.where('userStoryId').equals(story.id).delete();
    }
    await db.userStories.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  }
}

export const projectService = new ProjectService();
