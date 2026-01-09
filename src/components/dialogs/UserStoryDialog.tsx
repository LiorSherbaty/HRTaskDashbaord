import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { DialogWrapper } from './DialogWrapper';
import { Button, Input, TextArea, TagInput, Select } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';
import type { UserStory } from '@/types';

const userStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
});

type UserStoryFormData = z.infer<typeof userStorySchema>;

export function UserStoryDialog() {
  const { modal, closeModal, selection } = useUIStore();
  const { projects, createUserStory, updateUserStory } = useAppStore();
  const [tags, setTags] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<UserStoryFormData | null>(null);

  const isOpen = modal.type === 'userStory';
  const isEdit = modal.mode === 'edit';
  const modalData = modal.data as { projectId?: string; userStory?: UserStory } | undefined;
  const userStory = modalData?.userStory;
  const projectId = modalData?.projectId || selection.projectId;

  // Get active projects for the dropdown
  const activeProjects = projects.filter(p => !p.isArchived);

  // Check if project is being changed
  const isProjectChanging = isEdit && userStory && selectedProjectId && selectedProjectId !== userStory.projectId;
  const newProjectName = isProjectChanging ? activeProjects.find(p => p.id === selectedProjectId)?.title : '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserStoryFormData>({
    resolver: zodResolver(userStorySchema),
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setShowMoveConfirmation(false);
      setPendingFormData(null);
      if (isEdit && userStory) {
        reset({
          title: userStory.title,
          description: userStory.description || '',
        });
        setTags(userStory.tags || []);
        setSelectedProjectId(userStory.projectId);
      } else {
        reset({
          title: '',
          description: '',
        });
        setTags([]);
        setSelectedProjectId(projectId || '');
      }
    }
  }, [isOpen, isEdit, userStory, projectId, reset]);

  const onSubmit = async (data: UserStoryFormData) => {
    try {
      if (isEdit && userStory) {
        // Check if project is changing - show confirmation
        if (isProjectChanging) {
          setPendingFormData(data);
          setShowMoveConfirmation(true);
          return;
        }
        await updateUserStory(userStory.id, { ...data, tags });
      } else if (selectedProjectId) {
        await createUserStory({
          projectId: selectedProjectId,
          title: data.title,
          description: data.description,
          tags,
        });
      }
      reset();
      setTags([]);
      setSelectedProjectId('');
      closeModal();
    } catch (error) {
      console.error('Error saving user story:', error);
    }
  };

  const handleConfirmMove = async () => {
    if (!pendingFormData || !userStory) return;

    try {
      await updateUserStory(userStory.id, {
        ...pendingFormData,
        tags,
        projectId: selectedProjectId,
      });
      reset();
      setTags([]);
      setSelectedProjectId('');
      setShowMoveConfirmation(false);
      setPendingFormData(null);
      closeModal();
    } catch (error) {
      console.error('Error moving user story:', error);
    }
  };

  const handleCancelMove = () => {
    setShowMoveConfirmation(false);
    setPendingFormData(null);
    // Reset to original project
    if (userStory) {
      setSelectedProjectId(userStory.projectId);
    }
  };

  const handleClose = () => {
    reset();
    setTags([]);
    setSelectedProjectId('');
    setShowMoveConfirmation(false);
    setPendingFormData(null);
    closeModal();
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit User Story' : 'New User Story'}
    >
      {showMoveConfirmation ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Move User Story?</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Move "{userStory?.title}" to project "{newProjectName}"?
                All tasks will move with it.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCancelMove}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmMove}>
              Confirm Move
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter user story title"
            error={errors.title?.message}
            {...register('title')}
          />

          <TextArea
            label="Description"
            placeholder="Describe this ongoing process..."
            rows={4}
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Project selector - only show in edit mode */}
          {isEdit && activeProjects.length > 1 && (
            <Select
              label="Project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {activeProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Select>
          )}

          <TagInput
            label="Tags"
            value={tags}
            onChange={setTags}
            placeholder="Add tags..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User Story'}
            </Button>
          </div>
        </form>
      )}
    </DialogWrapper>
  );
}
