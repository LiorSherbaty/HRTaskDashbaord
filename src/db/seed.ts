import { db } from './database';
import { TaskStatus } from '@/types';
import { generateId } from '@/utils';

export async function seedDatabase() {
  const count = await db.projects.count();
  if (count > 0) return;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Project 1: Onboarding Team
  const proj1Id = generateId();
  await db.projects.add({
    id: proj1Id,
    title: 'Onboarding Team',
    description: 'Managing the onboarding process for new employees',
    tags: ['hr', 'onboarding'],
    createdAt: daysAgo(90),
    isArchived: false,
  });

  const story1Id = generateId();
  await db.userStories.add({
    id: story1Id,
    projectId: proj1Id,
    title: 'Keeping the onboarding manual updated',
    description: 'Ensure all onboarding documentation is current',
    tags: ['documentation'],
    createdAt: daysAgo(90),
    isArchived: false,
  });

  await db.tasks.add({
    id: generateId(),
    userStoryId: story1Id,
    title: 'Update benefits section with Finance team',
    description: 'Coordinate with Finance to update health insurance info',
    tags: ['benefits', 'urgent'],
    status: TaskStatus.Blocked,
    createdAt: daysAgo(14),
    startDate: daysAgo(12),
    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    lastUpdatedAt: daysAgo(5),
    completedAt: null,
    isBlocked: true,
    blockedAt: daysAgo(5),
    blockedBy: 'Finance Team',
    blockedReason: 'Waiting for updated premium rates',
    activityLog: [
      {
        id: generateId(),
        date: daysAgo(12),
        note: 'Started working on benefits section update',
        createdAt: daysAgo(12),
      },
      {
        id: generateId(),
        date: daysAgo(5),
        note: 'Sent email to Finance, waiting for response',
        createdAt: daysAgo(5),
      },
    ],
    isArchived: false,
  });

  await db.tasks.add({
    id: generateId(),
    userStoryId: story1Id,
    title: 'Review IT section',
    description: 'Check that IT onboarding steps are accurate',
    tags: ['it', 'review'],
    status: TaskStatus.Active,
    createdAt: daysAgo(10),
    startDate: daysAgo(8),
    dueDate: null,
    lastUpdatedAt: daysAgo(10),
    completedAt: null,
    isBlocked: false,
    blockedAt: null,
    blockedBy: '',
    blockedReason: '',
    activityLog: [],
    isArchived: false,
  });

  // Project 2: Mentoring
  const proj2Id = generateId();
  await db.projects.add({
    id: proj2Id,
    title: 'Mentoring',
    description: 'Mentoring program for HR team members',
    tags: ['mentoring', 'development'],
    createdAt: daysAgo(60),
    isArchived: false,
  });

  const story2Id = generateId();
  await db.userStories.add({
    id: story2Id,
    projectId: proj2Id,
    title: 'Mentoring HR Specialist',
    description: 'Weekly mentoring sessions with junior HR staff',
    tags: ['weekly'],
    createdAt: daysAgo(60),
    isArchived: false,
  });

  await db.tasks.add({
    id: generateId(),
    userStoryId: story2Id,
    title: 'Mentor Ortal - Q4 Goals',
    description: 'Help Ortal set and track Q4 goals',
    tags: ['goals', 'q4'],
    status: TaskStatus.Active,
    createdAt: daysAgo(30),
    startDate: daysAgo(28),
    dueDate: daysAgo(-7),
    lastUpdatedAt: daysAgo(3),
    completedAt: null,
    isBlocked: false,
    blockedAt: null,
    blockedBy: '',
    blockedReason: '',
    activityLog: [
      {
        id: generateId(),
        date: daysAgo(28),
        note: 'Initial goal-setting meeting scheduled',
        createdAt: daysAgo(28),
      },
    ],
    isArchived: false,
  });

  console.log('Database seeded with sample data');
}
