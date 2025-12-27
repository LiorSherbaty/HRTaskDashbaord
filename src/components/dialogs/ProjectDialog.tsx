import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogWrapper } from './DialogWrapper';
import { Button, Input, TextArea } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';
import type { Project } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function ProjectDialog() {
  const { modal, closeModal } = useUIStore();
  const { createProject, updateProject } = useAppStore();

  const isOpen = modal.type === 'project';
  const isEdit = modal.mode === 'edit';
  const project = modal.data as Project | undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      if (isEdit && project) {
        reset({
          title: project.title,
          description: project.description || '',
        });
      } else {
        reset({
          title: '',
          description: '',
        });
      }
    }
  }, [isOpen, isEdit, project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEdit && project) {
        await updateProject(project.id, data);
      } else {
        await createProject(data);
      }
      reset();
      closeModal();
    } catch (error) {
      console.error('Error saving project:', error);
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
      title={isEdit ? 'Edit Project' : 'New Project'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="Enter project title"
          error={errors.title?.message}
          {...register('title')}
        />

        <TextArea
          label="Description"
          placeholder="Describe this ongoing responsibility area..."
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </DialogWrapper>
  );
}
