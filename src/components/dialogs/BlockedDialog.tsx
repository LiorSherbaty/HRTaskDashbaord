import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogWrapper } from './DialogWrapper';
import { Button, Input, TextArea } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';

const blockedSchema = z.object({
  blockedBy: z.string().min(1, 'Please specify who/what is blocking this task'),
  blockedReason: z.string().min(1, 'Please provide a reason'),
});

type BlockedFormData = z.infer<typeof blockedSchema>;

export function BlockedDialog() {
  const { modal, closeModal, selection } = useUIStore();
  const { setTaskBlocked, loadTasks } = useAppStore();

  const isOpen = modal.type === 'blocked';
  const modalData = modal.data as { taskId: string } | undefined;
  const taskId = modalData?.taskId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlockedFormData>({
    resolver: zodResolver(blockedSchema),
    defaultValues: {
      blockedBy: '',
      blockedReason: '',
    },
  });

  const onSubmit = async (data: BlockedFormData) => {
    if (!taskId) return;

    try {
      await setTaskBlocked(taskId, data.blockedBy, data.blockedReason);
      if (selection.userStoryId) {
        await loadTasks(selection.userStoryId);
      }
      reset();
      closeModal();
    } catch (error) {
      console.error('Error setting blocked status:', error);
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
      title="Mark as Blocked"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Blocked By"
          placeholder="Who or what is blocking this task?"
          error={errors.blockedBy?.message}
          {...register('blockedBy')}
        />

        <TextArea
          label="Reason"
          placeholder="Why is this task blocked?"
          rows={3}
          error={errors.blockedReason?.message}
          {...register('blockedReason')}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Mark as Blocked'}
          </Button>
        </div>
      </form>
    </DialogWrapper>
  );
}
