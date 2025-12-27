import type { TaskStatus } from './enums';

export interface FilterState {
  searchTerm: string;
  showBlockedOnly: boolean;
  showDueSoonOnly: boolean;
  showStaleOnly: boolean;
  statusFilter: TaskStatus | 'all';
}

export interface SelectionState {
  projectId: string | null;
  userStoryId: string | null;
}
