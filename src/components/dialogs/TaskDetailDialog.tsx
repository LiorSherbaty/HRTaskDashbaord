import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, FolderOpen, Plus, Trash2, Edit2 } from 'lucide-react';
import { DialogWrapper } from './DialogWrapper';
import { Button, Input, StatusBadge, TagBadge } from '@/components/common';
import { useAppStore, useUIStore } from '@/stores';
import type { TaskViewModel } from '@/types';
import { TaskStatus, STATUS_LABELS } from '@/types';
import { formatDate, formatRelativeDate } from '@/utils';

export function TaskDetailDialog() {
  const { modal, closeModal, openModal } = useUIStore();
  const { tasks, updateTaskStatus, addActivityLog, deleteActivityLogEntry, clearTaskBlocked, loadTasks } = useAppStore();

  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const isOpen = modal.type === 'taskDetail';
  const modalData = modal.data as { task: TaskViewModel } | undefined;
  const taskId = modalData?.task?.id;
  // Get the task from the store to ensure we have the latest data
  const task = tasks.find(t => t.id === taskId) || modalData?.task;

  if (!task) return null;

  const handleStatusChange = async (status: TaskStatus) => {
    if (status === TaskStatus.Blocked) {
      openModal('blocked', 'edit', { taskId: task.id });
      return;
    }
    await updateTaskStatus(task.id, status);
    await loadTasks(task.userStoryId);
    closeModal();
  };

  const handleClearBlocked = async () => {
    await clearTaskBlocked(task.id);
    await loadTasks(task.userStoryId);
    closeModal();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await addActivityLog({ taskId: task.id, note: newNote.trim() });
      setNewNote('');
      await loadTasks(task.userStoryId);
    } catch (error) {
      console.error('Error adding note:', error);
    }
    setIsAddingNote(false);
  };

  const handleDeleteNote = async (entryId: string) => {
    if (confirm('Delete this activity log entry?')) {
      await deleteActivityLogEntry(task.id, entryId);
      await loadTasks(task.userStoryId);
    }
  };

  const handleEdit = () => {
    openModal('task', 'edit', { task });
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={closeModal}
      title="Task Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <FolderOpen className="w-4 h-4" />
              <span>{task.projectTitle} &gt; {task.userStoryTitle}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Status and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</h4>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            {Object.values(TaskStatus).filter(s => s !== task.status).map(status => (
              <Button
                key={status}
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange(status)}
              >
                Move to {STATUS_LABELS[status]}
              </Button>
            ))}
            {task.isBlocked && (
              <Button variant="secondary" size="sm" onClick={handleClearBlocked}>
                Clear Blocked
              </Button>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDate(task.createdAt)}</span>
            </div>
            {task.startDate && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Started: {formatDate(task.startDate)} ({task.daysOpen} days open)</span>
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {task.dueDate && (
              <div className={`flex items-center gap-2 ${
                task.isOverdue ? 'text-red-600' : task.isDueSoon ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                <Clock className="w-4 h-4" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span>Last updated: {formatRelativeDate(task.lastUpdatedAt)}</span>
              {task.isStale && <span className="text-yellow-600">(Stale)</span>}
            </div>
          </div>
        </div>

        {/* Blocked Info */}
        {task.isBlocked && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Blocked by: {task.blockedBy}</span>
            </div>
            {task.blockedReason && (
              <p className="text-red-600 dark:text-red-400 text-sm">{task.blockedReason}</p>
            )}
            {task.daysBlocked !== null && (
              <p className="text-red-500 text-sm mt-2">Blocked for {task.daysBlocked} days</p>
            )}
          </div>
        )}

        {/* Activity Log */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Activity Log</h4>

          {/* Add Note */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isAddingNote}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Notes List */}
          {task.activityLog.length > 0 ? (
            <div className="space-y-3">
              {task.activityLog.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{entry.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(entry.date)} ({formatRelativeDate(entry.date)})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(entry.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No activity logged yet</p>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>
    </DialogWrapper>
  );
}
