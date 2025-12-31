import { db } from '@/db';

class TagService {
  async getAllTags(): Promise<string[]> {
    const [projects, stories, tasks] = await Promise.all([
      db.projects.toArray(),
      db.userStories.toArray(),
      db.tasks.toArray(),
    ]);

    const allTags = new Set<string>();

    projects.forEach(p => p.tags?.forEach(t => allTags.add(t)));
    stories.forEach(s => s.tags?.forEach(t => allTags.add(t)));
    tasks.forEach(t => t.tags?.forEach(tag => allTags.add(tag)));

    return Array.from(allTags).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }
}

export const tagService = new TagService();
