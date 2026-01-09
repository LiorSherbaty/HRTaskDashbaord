import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogWrapper } from './DialogWrapper';
import { Button, Input, TextArea, DatePicker, TagInput, Select } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';
import { userStoryService } from '@/services';
import type { Task, UserStory } from '@/types';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  lastUpdatedAt: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function TaskDialog() {
  const { modal, closeModal, selection } = useUIStore();
  const { projects, createTask, updateTask } = useAppStore();
  const [tags, setTags] = useState<string[]>([]);
  const [selectedUserStoryId, setSelectedUserStoryId] = useState<string>('');
  const [allUserStories, setAllUserStories] = useState<UserStory[]>([]);

  const isOpen = modal.type === 'task';
  const isEdit = modal.mode === 'edit';
  const modalData = modal.data as { userStoryId?: string; task?: Task } | undefined;
  const task = modalData?.task;
  const userStoryId = modalData?.userStoryId || selection.userStoryId;

  // Get active projects for grouping
  const activeProjects = projects.filter(p => !p.isArchived);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  // Load all user stories directly from service when dialog opens in edit mode
  useEffect(() => {
    if (isOpen && isEdit) {
      userStoryService.getAll().then((stories) => {
        setAllUserStories(stories);
      });
    }
  }, [isOpen, isEdit]);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
      if (isEdit && task) {
        reset({
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
          startDate: task.startDate ? format(task.startDate, 'yyyy-MM-dd') : '',
          lastUpdatedAt: task.lastUpdatedAt ? format(task.lastUpdatedAt, "yyyy-MM-dd'T'HH:mm") : now,
        });
        setTags(task.tags || []);
        setSelectedUserStoryId(task.userStoryId);
      } else {
        reset({
          title: '',
          description: '',
          dueDate: '',
          startDate: today,
          lastUpdatedAt: now,
        });
        setTags([]);
        setSelectedUserStoryId(userStoryId || '');
      }
    }
  }, [isOpen, isEdit, modal.data, userStoryId, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
      const startDate = data.startDate ? new Date(data.startDate) : undefined;
      const lastUpdatedAt = data.lastUpdatedAt ? new Date(data.lastUpdatedAt) : new Date();

      if (isEdit && task) {
        // Include userStoryId if it changed
        const updates: Parameters<typeof updateTask>[1] = {
          title: data.title,
          description: data.description,
          tags,
          dueDate: dueDate || null,
          startDate: startDate || null,
          lastUpdatedAt,
        };
        if (selectedUserStoryId && selectedUserStoryId !== task.userStoryId) {
          updates.userStoryId = selectedUserStoryId;
        }
        await updateTask(task.id, updates);
      } else if (selectedUserStoryId) {
        await createTask({
          userStoryId: selectedUserStoryId,
          title: data.title,
          description: data.description,
          tags,
          dueDate,
          startDate,
          lastUpdatedAt,
        });
      }
      reset();
      setTags([]);
      setSelectedUserStoryId('');
      setAllUserStories([]);
      closeModal();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleClose = () => {
    reset();
    setTags([]);
    setSelectedUserStoryId('');
    setAllUserStories([]);
    closeModal();
  };

  // Group user stories by project for the dropdown
  const userStoriesByProject = activeProjects.map(project => ({
    project,
    stories: allUserStories.filter(s => s.projectId === project.id && !s.isArchived),
  })).filter(group => group.stories.length > 0);

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Task' : 'New Task'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="Enter task title"
          error={errors.title?.message}
          {...register('title')}
        />

        <TextArea
          label="Description"
          placeholder="Describe this task..."
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />

        <TagInput
          label="Tags"
          value={tags}
          onChange={setTags}
          placeholder="Add tags..."
        />

        {/* User Story selector - only show in edit mode with multiple options */}
        {isEdit && userStoriesByProject.length > 0 && (
          <Select
            label="User Story"
            value={selectedUserStoryId}
            onChange={(e) => setSelectedUserStoryId(e.target.value)}
          >
            {userStoriesByProject.map(({ project, stories }) => (
              <optgroup key={project.id} label={project.title}>
                {stories.map(story => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        )}

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Start Date (optional)"
            error={errors.startDate?.message}
            {...register('startDate')}
          />

          <DatePicker
            label="Due Date (optional)"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Updated
          </label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('lastUpdatedAt')}
          />
          {errors.lastUpdatedAt?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.lastUpdatedAt.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </DialogWrapper>
  );
}
