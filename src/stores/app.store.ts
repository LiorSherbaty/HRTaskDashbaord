import { create } from 'zustand';
import type {
  Project,
  ProjectWithCounts,
  UserStory,
  UserStoryWithCounts,
  Task,
  TaskViewModel,
  CreateProjectDto,
  CreateUserStoryDto,
  CreateTaskDto,
  UpdateTaskDto,
  AddActivityLogDto,
} from '@/types';
import { TaskStatus } from '@/types';
import { projectService, userStoryService, taskService } from '@/services';

interface AppState {
  // Data
  projects: ProjectWithCounts[];
  userStories: UserStoryWithCounts[];
  tasks: TaskViewModel[];

  // Current view context for refresh
  currentProjectId: string | null;
  currentUserStoryId: string | null;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions - Projects
  loadProjects: () => Promise<void>;
  createProject: (dto: CreateProjectDto) => Promise<Project>;
  updateProject: (id: string, dto: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Actions - User Stories
  loadUserStories: (projectId: string) => Promise<void>;
  createUserStory: (dto: CreateUserStoryDto) => Promise<UserStory>;
  updateUserStory: (id: string, dto: Partial<UserStory>) => Promise<void>;
  archiveUserStory: (id: string) => Promise<void>;
  unarchiveUserStory: (id: string) => Promise<void>;
  deleteUserStory: (id: string) => Promise<void>;

  // Actions - Tasks
  loadTasks: (userStoryId: string | null) => Promise<void>;
  loadAllTasks: () => Promise<void>;
  loadTasksForProject: (projectId: string) => Promise<void>;
  createTask: (dto: CreateTaskDto) => Promise<Task>;
  updateTask: (id: string, dto: UpdateTaskDto) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  setTaskBlocked: (id: string, blockedBy: string, blockedReason: string) => Promise<void>;
  clearTaskBlocked: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Actions - Activity Log
  addActivityLog: (dto: AddActivityLogDto) => Promise<void>;
  updateActivityLogEntry: (taskId: string, entryId: string, updates: { note?: string; date?: Date }) => Promise<void>;
  deleteActivityLogEntry: (taskId: string, entryId: string) => Promise<void>;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  userStories: [],
  tasks: [],
  currentProjectId: null,
  currentUserStoryId: null,
  isLoading: false,
  error: null,

  // Projects
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getAllWithCounts();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProject: async (dto) => {
    const project = await projectService.create(dto);
    await get().loadProjects();
    return project;
  },

  updateProject: async (id, dto) => {
    await projectService.update(id, dto);
    await get().loadProjects();
    await get().refresh();
  },

  archiveProject: async (id) => {
    await projectService.archive(id);
    await get().loadProjects();
  },

  unarchiveProject: async (id) => {
    await projectService.unarchive(id);
    await get().loadProjects();
  },

  deleteProject: async (id) => {
    await projectService.delete(id);
    await get().loadProjects();
  },

  // User Stories
  loadUserStories: async (projectId) => {
    set({ isLoading: true, error: null, currentProjectId: projectId });
    try {
      const userStories = await userStoryService.getByProjectIdWithCounts(projectId);
      set({ userStories, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createUserStory: async (dto) => {
    const story = await userStoryService.create(dto);
    await get().loadUserStories(dto.projectId);
    await get().loadProjects();
    return story;
  },

  updateUserStory: async (id, dto) => {
    const story = await userStoryService.getById(id);
    if (story) {
      await userStoryService.update(id, dto);
      await get().loadUserStories(story.projectId);
      await get().refresh();
    }
  },

  archiveUserStory: async (id) => {
    const story = await userStoryService.getById(id);
    if (story) {
      await userStoryService.archive(id);
      await get().loadUserStories(story.projectId);
      await get().loadProjects();
    }
  },

  unarchiveUserStory: async (id) => {
    const story = await userStoryService.getById(id);
    if (story) {
      await userStoryService.unarchive(id);
      await get().loadUserStories(story.projectId);
      await get().loadProjects();
    }
  },

  deleteUserStory: async (id) => {
    const story = await userStoryService.getById(id);
    if (story) {
      await userStoryService.delete(id);
      await get().loadUserStories(story.projectId);
      await get().loadProjects();
    }
  },

  // Tasks
  loadTasks: async (userStoryId) => {
    set({ isLoading: true, error: null, currentUserStoryId: userStoryId });
    try {
      if (!userStoryId) {
        await get().loadAllTasks();
        return;
      }
      const tasks = await taskService.getByUserStoryId(userStoryId);
      const taskViewModels = await taskService.getTasksWithViewModels(tasks);
      set({ tasks: taskViewModels, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadAllTasks: async () => {
    set({ isLoading: true, error: null, currentProjectId: null, currentUserStoryId: null });
    try {
      const tasks = await taskService.getAllActive();
      const taskViewModels = await taskService.getTasksWithViewModels(tasks);
      set({ tasks: taskViewModels, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadTasksForProject: async (projectId) => {
    set({ isLoading: true, error: null, currentProjectId: projectId, currentUserStoryId: null });
    try {
      const stories = await userStoryService.getByProjectId(projectId);
      const allTasks: Task[] = [];
      for (const story of stories) {
        const tasks = await taskService.getByUserStoryId(story.id);
        allTasks.push(...tasks);
      }
      const taskViewModels = await taskService.getTasksWithViewModels(allTasks);
      set({ tasks: taskViewModels, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTask: async (dto) => {
    const task = await taskService.create(dto);
    // Use refresh to ensure all views (tasks, projects, userStories) are updated
    await get().refresh();
    return task;
  },

  updateTask: async (id, dto) => {
    await taskService.update(id, dto);
    await get().refresh();
  },

  updateTaskStatus: async (id, status) => {
    await taskService.updateStatus(id, status);
    await get().refresh();
  },

  setTaskBlocked: async (id, blockedBy, blockedReason) => {
    await taskService.setBlocked(id, blockedBy, blockedReason);
    await get().refresh();
  },

  clearTaskBlocked: async (id) => {
    await taskService.clearBlocked(id);
    await get().refresh();
  },

  archiveTask: async (id) => {
    await taskService.archive(id);
    await get().refresh();
  },

  unarchiveTask: async (id) => {
    await taskService.unarchive(id);
    await get().refresh();
  },

  deleteTask: async (id) => {
    await taskService.delete(id);
    await get().refresh();
  },

  // Activity Log
  addActivityLog: async (dto) => {
    await taskService.addActivityLog(dto);
    await get().refresh();
  },

  updateActivityLogEntry: async (taskId, entryId, updates) => {
    await taskService.updateActivityLogEntry(taskId, entryId, updates);
    await get().refresh();
  },

  deleteActivityLogEntry: async (taskId, entryId) => {
    await taskService.deleteActivityLogEntry(taskId, entryId);
    await get().refresh();
  },

  clearError: () => set({ error: null }),

  refresh: async () => {
    const { currentProjectId, currentUserStoryId } = get();

    // Always reload projects for sidebar counts
    await get().loadProjects();

    // Reload tasks based on current view context
    if (currentUserStoryId) {
      await get().loadTasks(currentUserStoryId);
    } else if (currentProjectId) {
      await get().loadTasksForProject(currentProjectId);
    } else {
      await get().loadAllTasks();
    }

    // Reload user stories if viewing a project
    if (currentProjectId) {
      await get().loadUserStories(currentProjectId);
    }
  },
}));
