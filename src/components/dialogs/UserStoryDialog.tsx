import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogWrapper } from './DialogWrapper';
import { Button, Input, TextArea } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';
import type { UserStory } from '@/types';

const userStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
});

type UserStoryFormData = z.infer<typeof userStorySchema>;

export function UserStoryDialog() {
  const { modal, closeModal, selection } = useUIStore();
  const { createUserStory, updateUserStory } = useAppStore();

  const isOpen = modal.type === 'userStory';
  const isEdit = modal.mode === 'edit';
  const modalData = modal.data as { projectId?: string; userStory?: UserStory } | undefined;
  const userStory = modalData?.userStory;
  const projectId = modalData?.projectId || selection.projectId;

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
      if (isEdit && userStory) {
        reset({
          title: userStory.title,
          description: userStory.description || '',
        });
      } else {
        reset({
          title: '',
          description: '',
        });
      }
    }
  }, [isOpen, isEdit, userStory, reset]);

  const onSubmit = async (data: UserStoryFormData) => {
    try {
      if (isEdit && userStory) {
        await updateUserStory(userStory.id, data);
      } else if (projectId) {
        await createUserStory({
          projectId,
          title: data.title,
          description: data.description,
        });
      }
      reset();
      closeModal();
    } catch (error) {
      console.error('Error saving user story:', error);
    }
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit User Story' : 'New User Story'}
    >
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User Story'}
          </Button>
        </div>
      </form>
    </DialogWrapper>
  );
}
