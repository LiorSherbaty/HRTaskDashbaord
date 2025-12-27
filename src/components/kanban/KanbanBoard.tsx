import { useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore, useUIStore } from '@/stores';
import { TaskStatus } from '@/types';
import type { TaskViewModel } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button, LoadingSpinner, EmptyState } from '@/components/common';

interface KanbanBoardProps {
  userStoryId: string;
}

export function KanbanBoard({ userStoryId }: KanbanBoardProps) {
  const { tasks, isLoading, loadTasks, updateTaskStatus } = useAppStore();
  const { openModal } = useUIStore();
  const [activeTask, setActiveTask] = useState<TaskViewModel | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadTasks(userStoryId);
  }, [userStoryId, loadTasks]);

  const tasksByStatus = useMemo(() => {
    return {
      [TaskStatus.New]: tasks.filter(t => t.status === TaskStatus.New),
      [TaskStatus.Active]: tasks.filter(t => t.status === TaskStatus.Active),
      [TaskStatus.Blocked]: tasks.filter(t => t.status === TaskStatus.Blocked),
      [TaskStatus.Completed]: tasks.filter(t => t.status === TaskStatus.Completed && !t.isArchived),
    };
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Valid column statuses
    const validStatuses = [TaskStatus.New, TaskStatus.Active, TaskStatus.Blocked, TaskStatus.Completed];

    // Check if dropped on a valid column (not on another card or blank space)
    if (!validStatuses.includes(overId as TaskStatus)) {
      // Dropped on a card or invalid area - do nothing, task stays in place
      return;
    }

    const newStatus = overId as TaskStatus;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // If moving to blocked, open the blocked dialog
    if (newStatus === TaskStatus.Blocked) {
      openModal('blocked', 'edit', { taskId });
      return;
    }

    await updateTaskStatus(taskId, newStatus);
    loadTasks(userStoryId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasNoTasks = tasks.length === 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <Button
          size="sm"
          onClick={() => openModal('task', 'create', { userStoryId })}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>

      {hasNoTasks ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Button onClick={() => openModal('task', 'create', { userStoryId })}>
              <Plus className="w-4 h-4 mr-1" />
              Create Task
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn status={TaskStatus.New} tasks={tasksByStatus[TaskStatus.New]} />
            <KanbanColumn status={TaskStatus.Active} tasks={tasksByStatus[TaskStatus.Active]} />
            <KanbanColumn status={TaskStatus.Blocked} tasks={tasksByStatus[TaskStatus.Blocked]} />
            <KanbanColumn status={TaskStatus.Completed} tasks={tasksByStatus[TaskStatus.Completed]} />
          </div>

          <DragOverlay>
            {activeTask ? <KanbanCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
