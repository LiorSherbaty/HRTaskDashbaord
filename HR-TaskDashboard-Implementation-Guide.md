# HR TaskDashboard - Complete Implementation Guide

> A personal productivity desktop application for HR managers to track ongoing responsibilities, tasks, and blocked items.
> Built with React + Electron, runs locally with IndexedDB storage.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Application Layout](#application-layout)
4. [Data Model](#data-model)
5. [Features Specification](#features-specification)
6. [Project Structure](#project-structure)
7. [Implementation Plan](#implementation-plan)
8. [Implementation Order](#implementation-order)

---

## Project Overview

### Purpose

This application helps HR managers track ongoing responsibilities that don't have a clear "end date" — unlike software development projects. The hierarchy is:

- **Project** = Ongoing responsibility area (e.g., "Onboarding Team", "Mentoring")
- **User Story** = Specific ongoing process within that area (e.g., "Keeping onboarding manual updated")
- **Task** = Actual work items that get completed (e.g., "Update benefits section with Finance team")

### Key Concepts

| Concept | Description |
|---------|-------------|
| Ongoing Work | Projects and User Stories don't "complete" — only Tasks do |
| Blocked/Waiting | Critical visibility for tasks waiting on others |
| Date Tracking | Start date, due date, last updated, days open — NOT hours |
| Activity Log | Timestamped notes on task progress |
| Quarterly Review | See what was accomplished per project |

### Constraints

- Single user (no authentication)
- Local storage (IndexedDB via Dexie.js)
- Desktop app (Electron)
- Works offline

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Desktop | Electron + electron-builder |
| State | Zustand |
| Database | IndexedDB via Dexie.js |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Dates | date-fns |

---

## Application Layout

### Main Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header: [Logo] HR TaskDashboard    [Search Bar]    [Theme Toggle]      │
├────────────┬────────────────┬───────────────────────────────────────────┤
│  Projects  │  User Stories  │  Main Content                             │
│  Sidebar   │  Sidebar       │                                           │
│  (180px)   │  (200px)       │  ┌─────────────────────────────────────┐  │
│            │                │  │  [Dashboard] [Completed]  tabs      │  │
│  [+ New]   │  [+ New]       │  ├─────────────────────────────────────┤  │
│            │                │  │                                     │  │
│  ● All     │  (Shown when   │  │  Dashboard View:                    │  │
│    Tasks   │   project is   │  │  - Blocked/Waiting section          │  │
│            │   selected)    │  │  - Active section                   │  │
│  ○ Onboard │                │  │  - Due Soon section                 │  │
│  ○ Snow    │  ○ Story 1     │  │  - Stale section                    │  │
│  ○ Mentor  │  ○ Story 2     │  │                                     │  │
│            │  ○ Story 3     │  │  OR                                 │  │
│            │                │  │                                     │  │
│            │                │  │  Kanban View (when story selected): │  │
│            │                │  │  [New] [Active] [Blocked] [Done]    │  │
│            │                │  │                                     │  │
└────────────┴────────────────┴──┴─────────────────────────────────────┴──┘
```

### View States

| Selection | Main Content Shows |
|-----------|-------------------|
| "All Tasks" (default) | Dashboard with 4 sections across ALL projects |
| Project selected | Dashboard filtered to that project's tasks |
| User Story selected | Kanban board for that story's tasks |

### Dashboard Sections

| Section | Description | Visual |
|---------|-------------|--------|
| 🔴 Blocked/Waiting | Tasks with status = Blocked | Red accent |
| 🔵 Active | Tasks with status = Active | Blue accent |
| 🟡 Due Soon | Tasks with due date within 7 days | Yellow accent |
| ⚪ Stale | Tasks not updated in 7+ days | Gray accent |

*Note: A task can appear in multiple sections (e.g., Active AND Due Soon)*

### Task Card Design

```
┌─────────────────────────────────────────────┐
│ Update benefits section              🔴     │  ← Red dot if overdue
├─────────────────────────────────────────────┤
│ 📁 Onboarding > Manual updates              │  ← Breadcrumb
├─────────────────────────────────────────────┤
│ 📅 Started: Dec 15 (12 days open)           │
│ ⏰ Due: Dec 30 (4 days left)           🟡   │  ← Yellow if ≤3 days
│ 🔄 Updated: 2 days ago                      │
├─────────────────────────────────────────────┤
│ ⚠️ Blocked: Waiting for Finance response    │  ← Only if blocked
│    Blocked for 5 days                       │
└─────────────────────────────────────────────┘
```

---

## Data Model

### Enums

```typescript
// src/types/enums.ts

export enum TaskStatus {
  New = 'new',
  Active = 'active',
  Blocked = 'blocked',
  Completed = 'completed',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.New]: 'New',
  [TaskStatus.Active]: 'Active',
  [TaskStatus.Blocked]: 'Blocked',
  [TaskStatus.Completed]: 'Completed',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.New]: 'gray',
  [TaskStatus.Active]: 'blue',
  [TaskStatus.Blocked]: 'red',
  [TaskStatus.Completed]: 'green',
};
```

### Entity Types

```typescript
// src/types/entities.ts

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  isArchived: boolean;
}

export interface UserStory {
  id: string;
  projectId: string;
  title: string;
  description: string;
  createdAt: Date;
  isArchived: boolean;
}

export interface ActivityLogEntry {
  id: string;
  date: Date;          // The date this activity happened (can be manually set)
  note: string;
  createdAt: Date;     // When this entry was added to the system
}

export interface Task {
  id: string;
  userStoryId: string;
  title: string;
  description: string;
  status: TaskStatus;
  
  // Dates
  createdAt: Date;
  startDate: Date | null;       // When work started (set when moved to Active)
  dueDate: Date | null;         // Optional deadline
  lastUpdatedAt: Date;          // Auto-updated, can be manually overridden
  completedAt: Date | null;     // When marked complete
  
  // Blocking
  isBlocked: boolean;
  blockedAt: Date | null;       // When it became blocked
  blockedBy: string;            // Free text: who/what is blocking
  blockedReason: string;        // Free text: why
  
  // Activity
  activityLog: ActivityLogEntry[];
  
  // Archive
  isArchived: boolean;
}
```

### DTO Types

```typescript
// src/types/dto.ts

export interface CreateProjectDto {
  title: string;
  description?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateUserStoryDto {
  projectId: string;
  title: string;
  description?: string;
}

export interface UpdateUserStoryDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateTaskDto {
  userStoryId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
  blockedBy?: string;
  blockedReason?: string;
  lastUpdatedAt?: Date;    // For manual override
}

export interface AddActivityLogDto {
  taskId: string;
  note: string;
  date?: Date;             // Optional manual date, defaults to now
}
```

### View Models (Computed)

```typescript
// src/types/viewModels.ts

export interface TaskViewModel extends Task {
  // Computed fields
  projectId: string;
  projectTitle: string;
  userStoryTitle: string;
  daysOpen: number;              // Days since startDate or createdAt
  daysBlocked: number | null;    // Days since blockedAt
  daysUntilDue: number | null;   // Days until dueDate
  isOverdue: boolean;            // dueDate passed
  isDueSoon: boolean;            // dueDate within 3 days
  isStale: boolean;              // lastUpdatedAt > 7 days ago
}

export interface ProjectWithCounts extends Project {
  taskCount: number;
  blockedCount: number;
  activeCount: number;
}

export interface UserStoryWithCounts extends UserStory {
  taskCount: number;
  completedCount: number;
}

// For quarterly report
export interface QuarterlyReportData {
  quarter: string;           // "Q4 2024"
  projects: {
    project: Project;
    userStories: {
      userStory: UserStory;
      completedTasks: Task[];
    }[];
  }[];
}
```

### Filter Types

```typescript
// src/types/filters.ts

export interface FilterState {
  searchTerm: string;
  showBlocked: boolean;
  showDueSoon: boolean;
  showStale: boolean;
  statusFilter: TaskStatus | null;
  projectId: string | null;
  userStoryId: string | null;
}
```

### Index Export

```typescript
// src/types/index.ts

export * from './enums';
export * from './entities';
export * from './dto';
export * from './viewModels';
export * from './filters';
```

---

## Features Specification

### F1: Project Management

| Feature | Description |
|---------|-------------|
| Create Project | Title + optional description |
| Edit Project | Update title/description |
| Archive Project | Hide from sidebar (not delete) |
| View Archived | Toggle to show archived projects |

### F2: User Story Management

| Feature | Description |
|---------|-------------|
| Create User Story | Under selected project |
| Edit User Story | Update title/description |
| Archive User Story | Hide from sidebar |
| View Archived | Toggle to show archived |

### F3: Task Management

| Feature | Description |
|---------|-------------|
| Create Task | Under selected user story, status = New |
| Edit Task | Update any field via dialog |
| Change Status | Drag-drop or click (see status rules below) |
| Mark Blocked | Set blockedBy text + blockedReason |
| Clear Blocked | Remove blocked status, return to Active |
| Archive Task | Move to Completed tab |
| Delete Task | Permanent removal (with confirmation) |

### F4: Status Change Rules

| From | To | Side Effects |
|------|-----|-------------|
| New | Active | Set `startDate = now` |
| New | Blocked | Set `startDate = now`, `blockedAt = now` |
| Active | Blocked | Set `blockedAt = now` |
| Active | Completed | Set `completedAt = now` |
| Blocked | Active | Clear `blockedAt`, `blockedBy`, `blockedReason` |
| Blocked | Completed | Set `completedAt = now`, clear blocked fields |
| Completed | Active | Clear `completedAt` |
| Any | Any | Update `lastUpdatedAt = now` |

### F5: Activity Log

| Feature | Description |
|---------|-------------|
| Add Entry | Note + date (defaults to now, can be manual) |
| Auto-update | Adding entry sets `lastUpdatedAt` to entry date |
| View Log | Chronological list in task detail dialog |
| Edit Entry | Update note or date |
| Delete Entry | Remove entry |

### F6: Dashboard View

| Section | Filter Logic |
|---------|-------------|
| Blocked/Waiting | `status === 'blocked'` |
| Active | `status === 'active'` |
| Due Soon | `dueDate !== null && daysUntilDue <= 7 && daysUntilDue >= 0` |
| Stale | `daysSinceUpdate >= 7 && status !== 'completed'` |

### F7: Kanban View

| Column | Status |
|--------|--------|
| New | `status === 'new'` |
| Active | `status === 'active'` |
| Blocked | `status === 'blocked'` |
| Completed | `status === 'completed' && !isArchived` |

### F8: Search

- Search term matches against: Project titles, User Story titles, Task titles
- Results grouped by: Projects → User Stories → Tasks
- Clicking result navigates to that item

### F9: Completed Tab (Archive)

- Shows all tasks where `isArchived === true`
- Grouped by Project → User Story
- Can unarchive (move back to Kanban)
- Filterable by date range

### F10: Quarterly Report

- Select quarter (Q1-Q4) and year
- Shows all completed tasks in that period, grouped by Project → User Story
- Completions based on `completedAt` date
- Export to clipboard as formatted text

### F11: Quick Filters

| Filter | Effect |
|--------|--------|
| Show Blocked | Only blocked tasks |
| Due This Week | Only tasks due within 7 days |
| Stale | Only tasks not updated in 7+ days |
| Clear Filters | Reset all |

### F12: Theme

- Light / Dark mode toggle
- Persisted to localStorage
- System preference detection on first load

---

## Project Structure

```
hr-task-dashboard/
├── electron/
│   ├── main.ts                    # Electron main process
│   ├── preload.ts                 # Preload script
│   └── electron-env.d.ts          # Electron types
│
├── src/
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Root component
│   ├── index.css                  # Tailwind + global styles
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── enums.ts
│   │   ├── entities.ts
│   │   ├── dto.ts
│   │   ├── viewModels.ts
│   │   └── filters.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   ├── database.ts            # Dexie database class
│   │   └── seed.ts                # Sample data for dev
│   │
│   ├── services/
│   │   ├── index.ts
│   │   ├── project.service.ts
│   │   ├── userStory.service.ts
│   │   ├── task.service.ts
│   │   └── report.service.ts      # Quarterly report generation
│   │
│   ├── stores/
│   │   ├── index.ts
│   │   ├── app.store.ts           # Main data store
│   │   ├── ui.store.ts            # UI state (theme, modals, selection)
│   │   └── filter.store.ts        # Filter state
│   │
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useProjects.ts
│   │   ├── useUserStories.ts
│   │   ├── useTasks.ts
│   │   ├── useDashboardTasks.ts   # Computes dashboard sections
│   │   ├── useSearch.ts
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── ProjectSidebar.tsx
│   │   │   ├── UserStorySidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DashboardSection.tsx
│   │   │   └── TaskCard.tsx
│   │   │
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanCard.tsx
│   │   │
│   │   ├── completed/
│   │   │   ├── CompletedTab.tsx
│   │   │   └── CompletedGroup.tsx
│   │   │
│   │   ├── dialogs/
│   │   │   ├── DialogWrapper.tsx
│   │   │   ├── ProjectDialog.tsx
│   │   │   ├── UserStoryDialog.tsx
│   │   │   ├── TaskDialog.tsx
│   │   │   ├── TaskDetailDialog.tsx  # Full view with activity log
│   │   │   ├── BlockedDialog.tsx     # Set blocked reason
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── QuarterlyReportDialog.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchResults.tsx
│   │   │
│   │   ├── activity/
│   │   │   ├── ActivityLog.tsx
│   │   │   └── ActivityLogEntry.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── TextArea.tsx
│   │       ├── Select.tsx
│   │       ├── DatePicker.tsx
│   │       ├── Badge.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── DaysIndicator.tsx     # "12 days open" display
│   │       ├── DueDateIndicator.tsx  # With warning colors
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ContextMenu.tsx
│   │
│   ├── utils/
│   │   ├── index.ts
│   │   ├── cn.ts                  # Tailwind class merger
│   │   ├── id.ts                  # UUID generator
│   │   ├── dates.ts               # Date calculations
│   │   └── search.ts              # Search/filter logic
│   │
│   └── constants/
│       ├── index.ts
│       └── colors.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── electron-builder.json
└── CLAUDE.md
```

---

## Implementation Plan

---

# Phase 1: Project Setup & Foundation

## Task 1.1: Create Project with Vite + Electron

### Steps

1. **Create Vite project**
```bash
npm create vite@latest hr-task-dashboard -- --template react-ts
cd hr-task-dashboard
npm install
```

2. **Install core dependencies**
```bash
# React ecosystem
npm install react-router-dom zustand

# Database
npm install dexie dexie-react-hooks

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Forms
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install date-fns lucide-react clsx tailwind-merge uuid

# Dev dependencies
npm install -D @types/uuid
```

3. **Install Electron**
```bash
npm install -D electron electron-builder vite-plugin-electron vite-plugin-electron-renderer
```

4. **Initialize Tailwind**
```bash
npx tailwindcss init -p
```

5. **Configure tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'status-new': '#6B7280',
        'status-active': '#3B82F6',
        'status-blocked': '#EF4444',
        'status-completed': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      },
    },
  },
  plugins: [],
}
```

6. **Configure vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

7. **Create electron/main.ts**
```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    title: 'HR TaskDashboard',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

8. **Create electron/preload.ts**
```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
```

9. **Create electron/electron-env.d.ts**
```typescript
/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_DEV_SERVER_URL: string;
  }
}
```

10. **Update package.json scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "vite",
    "electron:build": "vite build && electron-builder"
  },
  "main": "dist-electron/main.js"
}
```

11. **Create electron-builder.json**
```json
{
  "appId": "com.hr-taskdashboard.app",
  "productName": "HR TaskDashboard",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  "win": {
    "target": ["portable"],
    "icon": "public/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "public/icon.icns"
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "public/icon.png"
  }
}
```

12. **Update tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

13. **Update src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --sidebar-width: 180px;
    --sidebar-story-width: 200px;
  }
  
  body {
    @apply bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-gray-200 dark:bg-gray-800;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-400 dark:bg-gray-600 rounded;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500 dark:bg-gray-500;
  }
}

@layer components {
  .sidebar {
    @apply h-full overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700;
  }
  
  .sidebar-item {
    @apply px-3 py-2 text-sm cursor-pointer rounded-md mx-2 my-1 transition-colors;
    @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  }
  
  .sidebar-item.active {
    @apply bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
  
  .card-hover {
    @apply hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer;
  }
}
```

14. **Create folder structure** as defined in Project Structure section

### Acceptance Criteria
- [ ] `npm run dev` starts Vite + Electron
- [ ] Window opens with correct size
- [ ] Tailwind classes work
- [ ] Path alias `@/` resolves

---

## Task 1.2: Type Definitions

Create all type files in `src/types/` as specified in the Data Model section.

**src/types/enums.ts**
```typescript
export enum TaskStatus {
  New = 'new',
  Active = 'active',
  Blocked = 'blocked',
  Completed = 'completed',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.New]: 'New',
  [TaskStatus.Active]: 'Active',
  [TaskStatus.Blocked]: 'Blocked',
  [TaskStatus.Completed]: 'Completed',
};

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  [TaskStatus.New]: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  [TaskStatus.Active]: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  [TaskStatus.Blocked]: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
  },
  [TaskStatus.Completed]: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
};
```

**src/types/entities.ts**
```typescript
import { TaskStatus } from './enums';

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  isArchived: boolean;
}

export interface UserStory {
  id: string;
  projectId: string;
  title: string;
  description: string;
  createdAt: Date;
  isArchived: boolean;
}

export interface ActivityLogEntry {
  id: string;
  date: Date;
  note: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  userStoryId: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  startDate: Date | null;
  dueDate: Date | null;
  lastUpdatedAt: Date;
  completedAt: Date | null;
  isBlocked: boolean;
  blockedAt: Date | null;
  blockedBy: string;
  blockedReason: string;
  activityLog: ActivityLogEntry[];
  isArchived: boolean;
}
```

**src/types/dto.ts**
```typescript
import { TaskStatus } from './enums';

export interface CreateProjectDto {
  title: string;
  description?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateUserStoryDto {
  projectId: string;
  title: string;
  description?: string;
}

export interface UpdateUserStoryDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateTaskDto {
  userStoryId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
  blockedBy?: string;
  blockedReason?: string;
  lastUpdatedAt?: Date;
}

export interface AddActivityLogDto {
  taskId: string;
  note: string;
  date?: Date;
}
```

**src/types/viewModels.ts**
```typescript
import { Task, Project, UserStory } from './entities';

export interface TaskViewModel extends Task {
  projectId: string;
  projectTitle: string;
  userStoryTitle: string;
  daysOpen: number;
  daysBlocked: number | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  isDueSoon: boolean;
  isStale: boolean;
  daysSinceUpdate: number;
}

export interface ProjectWithCounts extends Project {
  userStoryCount: number;
  taskCount: number;
  blockedCount: number;
  activeCount: number;
}

export interface UserStoryWithCounts extends UserStory {
  taskCount: number;
  completedCount: number;
  blockedCount: number;
}

export interface QuarterlyReportProject {
  project: Project;
  userStories: {
    userStory: UserStory;
    completedTasks: Task[];
  }[];
  totalCompleted: number;
}

export interface QuarterlyReportData {
  quarter: string;
  year: number;
  startDate: Date;
  endDate: Date;
  projects: QuarterlyReportProject[];
  totalTasks: number;
}
```

**src/types/filters.ts**
```typescript
import { TaskStatus } from './enums';

export interface FilterState {
  searchTerm: string;
  showBlockedOnly: boolean;
  showDueSoonOnly: boolean;
  showStaleOnly: boolean;
  statusFilter: TaskStatus | 'all';
}

export interface SelectionState {
  projectId: string | null;      // null = "All Tasks"
  userStoryId: string | null;    // null = show dashboard
}
```

**src/types/index.ts**
```typescript
export * from './enums';
export * from './entities';
export * from './dto';
export * from './viewModels';
export * from './filters';
```

### Acceptance Criteria
- [ ] All types compile without errors
- [ ] Enums have labels and color mappings

---

## Task 1.3: Database Setup

**src/db/database.ts**
```typescript
import Dexie, { Table } from 'dexie';
import { Project, UserStory, Task } from '@/types';

export class HRTaskDashboardDB extends Dexie {
  projects!: Table<Project, string>;
  userStories!: Table<UserStory, string>;
  tasks!: Table<Task, string>;

  constructor() {
    super('HRTaskDashboardDB');

    this.version(1).stores({
      projects: 'id, title, createdAt, isArchived',
      userStories: 'id, projectId, title, createdAt, isArchived',
      tasks: 'id, userStoryId, status, createdAt, startDate, dueDate, lastUpdatedAt, isBlocked, isArchived',
    });

    // Date conversion hooks
    this.projects.hook('reading', (obj) => {
      obj.createdAt = new Date(obj.createdAt);
      return obj;
    });

    this.userStories.hook('reading', (obj) => {
      obj.createdAt = new Date(obj.createdAt);
      return obj;
    });

    this.tasks.hook('reading', (obj) => {
      obj.createdAt = new Date(obj.createdAt);
      obj.lastUpdatedAt = new Date(obj.lastUpdatedAt);
      if (obj.startDate) obj.startDate = new Date(obj.startDate);
      if (obj.dueDate) obj.dueDate = new Date(obj.dueDate);
      if (obj.completedAt) obj.completedAt = new Date(obj.completedAt);
      if (obj.blockedAt) obj.blockedAt = new Date(obj.blockedAt);
      if (obj.activityLog) {
        obj.activityLog = obj.activityLog.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
        }));
      }
      return obj;
    });
  }
}

export const db = new HRTaskDashboardDB();
```

**src/db/index.ts**
```typescript
export { db, HRTaskDashboardDB } from './database';
```

**src/db/seed.ts**
```typescript
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
    createdAt: daysAgo(90),
    isArchived: false,
  });

  const story1Id = generateId();
  await db.userStories.add({
    id: story1Id,
    projectId: proj1Id,
    title: 'Keeping the onboarding manual updated',
    description: 'Ensure all onboarding documentation is current',
    createdAt: daysAgo(90),
    isArchived: false,
  });

  await db.tasks.add({
    id: generateId(),
    userStoryId: story1Id,
    title: 'Update benefits section with Finance team',
    description: 'Coordinate with Finance to update health insurance info',
    status: TaskStatus.Blocked,
    createdAt: daysAgo(14),
    startDate: daysAgo(12),
    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
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
    createdAt: daysAgo(60),
    isArchived: false,
  });

  const story2Id = generateId();
  await db.userStories.add({
    id: story2Id,
    projectId: proj2Id,
    title: 'Mentoring HR Specialist',
    description: 'Weekly mentoring sessions with junior HR staff',
    createdAt: daysAgo(60),
    isArchived: false,
  });

  await db.tasks.add({
    id: generateId(),
    userStoryId: story2Id,
    title: 'Mentor Ortal - Q4 Goals',
    description: 'Help Ortal set and track Q4 goals',
    status: TaskStatus.Active,
    createdAt: daysAgo(30),
    startDate: daysAgo(28),
    dueDate: daysAgo(-7), // 7 days ago - overdue
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
```

### Acceptance Criteria
- [ ] Database initializes without errors
- [ ] Seed data creates sample projects/stories/tasks
- [ ] Date hooks work correctly

---

## Task 1.4: Utility Functions

**src/utils/cn.ts**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**src/utils/id.ts**
```typescript
import { v4 as uuid } from 'uuid';

export function generateId(): string {
  return uuid();
}
```

**src/utils/dates.ts**
```typescript
import { 
  differenceInDays, 
  format, 
  formatDistanceToNow,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  isWithinInterval,
} from 'date-fns';

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatShortDate(date: Date): string {
  return format(date, 'MMM d');
}

export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getDaysAgo(date: Date): number {
  return differenceInDays(new Date(), date);
}

export function getDaysUntil(date: Date): number {
  return differenceInDays(date, new Date());
}

export function getDaysOpen(startDate: Date | null, createdAt: Date): number {
  const referenceDate = startDate || createdAt;
  return differenceInDays(new Date(), referenceDate);
}

export function getDaysBlocked(blockedAt: Date | null): number | null {
  if (!blockedAt) return null;
  return differenceInDays(new Date(), blockedAt);
}

export function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return getDaysUntil(dueDate) < 0;
}

export function isDueSoon(dueDate: Date | null, daysThreshold = 3): boolean {
  if (!dueDate) return false;
  const daysUntil = getDaysUntil(dueDate);
  return daysUntil >= 0 && daysUntil <= daysThreshold;
}

export function isStale(lastUpdatedAt: Date, daysThreshold = 7): boolean {
  return getDaysAgo(lastUpdatedAt) >= daysThreshold;
}

export function getQuarterRange(quarter: number, year: number): { start: Date; end: Date } {
  const quarterStartMonth = (quarter - 1) * 3;
  const start = new Date(year, quarterStartMonth, 1);
  const end = endOfQuarter(start);
  return { start, end };
}

export function getQuarterLabel(quarter: number, year: number): string {
  return `Q${quarter} ${year}`;
}

export function getAvailableQuarters(count = 8): { quarter: number; year: number; label: string }[] {
  const quarters: { quarter: number; year: number; label: string }[] = [];
  let date = new Date();
  
  for (let i = 0; i < count; i++) {
    const q = Math.floor(date.getMonth() / 3) + 1;
    const y = date.getFullYear();
    quarters.push({
      quarter: q,
      year: y,
      label: getQuarterLabel(q, y),
    });
    date = subQuarters(date, 1);
  }
  
  return quarters;
}

export function isInQuarter(date: Date, quarter: number, year: number): boolean {
  const { start, end } = getQuarterRange(quarter, year);
  return isWithinInterval(date, { start, end });
}
```

**src/utils/search.ts**
```typescript
export function matchesSearch(text: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

export function highlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**src/utils/index.ts**
```typescript
export * from './cn';
export * from './id';
export * from './dates';
export * from './search';
```

### Acceptance Criteria
- [ ] All utils compile
- [ ] Date calculations return correct values
- [ ] Quarter functions work correctly

---

## Task 1.5: Services Layer

**src/services/project.service.ts**
```typescript
import { db } from '@/db';
import { Project, CreateProjectDto, UpdateProjectDto, ProjectWithCounts, TaskStatus } from '@/types';
import { generateId } from '@/utils';

class ProjectService {
  async getAll(includeArchived = false): Promise<Project[]> {
    let query = db.projects.orderBy('createdAt');
    if (!includeArchived) {
      query = query.filter(p => !p.isArchived);
    }
    return query.toArray();
  }

  async getAllWithCounts(includeArchived = false): Promise<ProjectWithCounts[]> {
    const projects = await this.getAll(includeArchived);
    const result: ProjectWithCounts[] = [];

    for (const project of projects) {
      const stories = await db.userStories
        .where('projectId')
        .equals(project.id)
        .filter(s => !s.isArchived)
        .toArray();
      
      const storyIds = stories.map(s => s.id);
      
      const tasks = await db.tasks
        .where('userStoryId')
        .anyOf(storyIds)
        .filter(t => !t.isArchived)
        .toArray();

      result.push({
        ...project,
        userStoryCount: stories.length,
        taskCount: tasks.length,
        blockedCount: tasks.filter(t => t.status === TaskStatus.Blocked).length,
        activeCount: tasks.filter(t => t.status === TaskStatus.Active).length,
      });
    }

    return result;
  }

  async getById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project: Project = {
      id: generateId(),
      title: dto.title,
      description: dto.description || '',
      createdAt: new Date(),
      isArchived: false,
    };
    await db.projects.add(project);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project | undefined> {
    await db.projects.update(id, dto);
    return this.getById(id);
  }

  async archive(id: string): Promise<void> {
    await db.projects.update(id, { isArchived: true });
  }

  async unarchive(id: string): Promise<void> {
    await db.projects.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    // Delete all related user stories and tasks
    const stories = await db.userStories.where('projectId').equals(id).toArray();
    for (const story of stories) {
      await db.tasks.where('userStoryId').equals(story.id).delete();
    }
    await db.userStories.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  }
}

export const projectService = new ProjectService();
```

**src/services/userStory.service.ts**
```typescript
import { db } from '@/db';
import { UserStory, CreateUserStoryDto, UpdateUserStoryDto, UserStoryWithCounts, TaskStatus } from '@/types';
import { generateId } from '@/utils';

class UserStoryService {
  async getByProjectId(projectId: string, includeArchived = false): Promise<UserStory[]> {
    let query = db.userStories.where('projectId').equals(projectId);
    const stories = await query.toArray();
    if (!includeArchived) {
      return stories.filter(s => !s.isArchived);
    }
    return stories;
  }

  async getByProjectIdWithCounts(projectId: string, includeArchived = false): Promise<UserStoryWithCounts[]> {
    const stories = await this.getByProjectId(projectId, includeArchived);
    const result: UserStoryWithCounts[] = [];

    for (const story of stories) {
      const tasks = await db.tasks
        .where('userStoryId')
        .equals(story.id)
        .filter(t => !t.isArchived)
        .toArray();

      result.push({
        ...story,
        taskCount: tasks.length,
        completedCount: tasks.filter(t => t.status === TaskStatus.Completed).length,
        blockedCount: tasks.filter(t => t.status === TaskStatus.Blocked).length,
      });
    }

    return result;
  }

  async getById(id: string): Promise<UserStory | undefined> {
    return db.userStories.get(id);
  }

  async create(dto: CreateUserStoryDto): Promise<UserStory> {
    const story: UserStory = {
      id: generateId(),
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description || '',
      createdAt: new Date(),
      isArchived: false,
    };
    await db.userStories.add(story);
    return story;
  }

  async update(id: string, dto: UpdateUserStoryDto): Promise<UserStory | undefined> {
    await db.userStories.update(id, dto);
    return this.getById(id);
  }

  async archive(id: string): Promise<void> {
    await db.userStories.update(id, { isArchived: true });
  }

  async unarchive(id: string): Promise<void> {
    await db.userStories.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    await db.tasks.where('userStoryId').equals(id).delete();
    await db.userStories.delete(id);
  }
}

export const userStoryService = new UserStoryService();
```

**src/services/task.service.ts**
```typescript
import { db } from '@/db';
import { 
  Task, 
  CreateTaskDto, 
  UpdateTaskDto, 
  AddActivityLogDto,
  TaskStatus,
  TaskViewModel,
  ActivityLogEntry,
} from '@/types';
import { generateId, getDaysOpen, getDaysBlocked, getDaysUntil, isOverdue, isDueSoon, isStale, getDaysAgo } from '@/utils';

class TaskService {
  async getByUserStoryId(userStoryId: string, includeArchived = false): Promise<Task[]> {
    const tasks = await db.tasks.where('userStoryId').equals(userStoryId).toArray();
    if (!includeArchived) {
      return tasks.filter(t => !t.isArchived);
    }
    return tasks;
  }

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async getAllActive(): Promise<Task[]> {
    return db.tasks
      .filter(t => !t.isArchived && t.status !== TaskStatus.Completed)
      .toArray();
  }

  async getAllBlocked(): Promise<Task[]> {
    return db.tasks
      .where('status')
      .equals(TaskStatus.Blocked)
      .filter(t => !t.isArchived)
      .toArray();
  }

  async getAllCompleted(): Promise<Task[]> {
    return db.tasks
      .filter(t => t.isArchived || t.status === TaskStatus.Completed)
      .toArray();
  }

  async getTasksWithViewModels(tasks: Task[]): Promise<TaskViewModel[]> {
    const result: TaskViewModel[] = [];

    for (const task of tasks) {
      const story = await db.userStories.get(task.userStoryId);
      if (!story) continue;
      
      const project = await db.projects.get(story.projectId);
      if (!project) continue;

      result.push({
        ...task,
        projectId: project.id,
        projectTitle: project.title,
        userStoryTitle: story.title,
        daysOpen: getDaysOpen(task.startDate, task.createdAt),
        daysBlocked: getDaysBlocked(task.blockedAt),
        daysUntilDue: task.dueDate ? getDaysUntil(task.dueDate) : null,
        isOverdue: isOverdue(task.dueDate),
        isDueSoon: isDueSoon(task.dueDate, 7),
        isStale: isStale(task.lastUpdatedAt, 7),
        daysSinceUpdate: getDaysAgo(task.lastUpdatedAt),
      });
    }

    return result;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: generateId(),
      userStoryId: dto.userStoryId,
      title: dto.title,
      description: dto.description || '',
      status: TaskStatus.New,
      createdAt: now,
      startDate: null,
      dueDate: dto.dueDate || null,
      lastUpdatedAt: now,
      completedAt: null,
      isBlocked: false,
      blockedAt: null,
      blockedBy: '',
      blockedReason: '',
      activityLog: [],
      isArchived: false,
    };
    await db.tasks.add(task);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;

    const updates: Partial<Task> = {
      ...dto,
      lastUpdatedAt: dto.lastUpdatedAt || new Date(),
    };

    await db.tasks.update(id, updates);
    return this.getById(id);
  }

  async updateStatus(id: string, newStatus: TaskStatus): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;

    const now = new Date();
    const updates: Partial<Task> = {
      status: newStatus,
      lastUpdatedAt: now,
    };

    // Handle status-specific side effects
    const oldStatus = task.status;

    // Moving to Active: set startDate if not set
    if (newStatus === TaskStatus.Active && !task.startDate) {
      updates.startDate = now;
    }

    // Moving to Blocked: set blockedAt and isBlocked
    if (newStatus === TaskStatus.Blocked) {
      updates.isBlocked = true;
      updates.blockedAt = now;
      if (!task.startDate) {
        updates.startDate = now;
      }
    }

    // Moving away from Blocked: clear blocked fields
    if (oldStatus === TaskStatus.Blocked && newStatus !== TaskStatus.Blocked) {
      updates.isBlocked = false;
      updates.blockedAt = null;
      updates.blockedBy = '';
      updates.blockedReason = '';
    }

    // Moving to Completed: set completedAt
    if (newStatus === TaskStatus.Completed) {
      updates.completedAt = now;
    }

    // Moving away from Completed: clear completedAt
    if (oldStatus === TaskStatus.Completed && newStatus !== TaskStatus.Completed) {
      updates.completedAt = null;
    }

    await db.tasks.update(id, updates);
    return this.getById(id);
  }

  async setBlocked(id: string, blockedBy: string, blockedReason: string): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;

    const now = new Date();
    await db.tasks.update(id, {
      status: TaskStatus.Blocked,
      isBlocked: true,
      blockedAt: now,
      blockedBy,
      blockedReason,
      lastUpdatedAt: now,
      startDate: task.startDate || now,
    });

    return this.getById(id);
  }

  async clearBlocked(id: string): Promise<Task | undefined> {
    return this.updateStatus(id, TaskStatus.Active);
  }

  async addActivityLog(dto: AddActivityLogDto): Promise<Task | undefined> {
    const task = await this.getById(dto.taskId);
    if (!task) return undefined;

    const entryDate = dto.date || new Date();
    const entry: ActivityLogEntry = {
      id: generateId(),
      date: entryDate,
      note: dto.note,
      createdAt: new Date(),
    };

    const updatedLog = [...task.activityLog, entry].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    await db.tasks.update(dto.taskId, {
      activityLog: updatedLog,
      lastUpdatedAt: entryDate,
    });

    return this.getById(dto.taskId);
  }

  async updateActivityLogEntry(
    taskId: string, 
    entryId: string, 
    updates: { note?: string; date?: Date }
  ): Promise<Task | undefined> {
    const task = await this.getById(taskId);
    if (!task) return undefined;

    const updatedLog = task.activityLog.map(entry => 
      entry.id === entryId 
        ? { ...entry, ...updates }
        : entry
    ).sort((a, b) => b.date.getTime() - a.date.getTime());

    await db.tasks.update(taskId, {
      activityLog: updatedLog,
      lastUpdatedAt: new Date(),
    });

    return this.getById(taskId);
  }

  async deleteActivityLogEntry(taskId: string, entryId: string): Promise<Task | undefined> {
    const task = await this.getById(taskId);
    if (!task) return undefined;

    const updatedLog = task.activityLog.filter(entry => entry.id !== entryId);

    await db.tasks.update(taskId, {
      activityLog: updatedLog,
      lastUpdatedAt: new Date(),
    });

    return this.getById(taskId);
  }

  async archive(id: string): Promise<void> {
    await db.tasks.update(id, { isArchived: true });
  }

  async unarchive(id: string): Promise<void> {
    await db.tasks.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  }
}

export const taskService = new TaskService();
```

**src/services/report.service.ts**
```typescript
import { db } from '@/db';
import { QuarterlyReportData, QuarterlyReportProject, TaskStatus } from '@/types';
import { getQuarterRange, getQuarterLabel, isInQuarter } from '@/utils';

class ReportService {
  async generateQuarterlyReport(quarter: number, year: number): Promise<QuarterlyReportData> {
    const { start, end } = getQuarterRange(quarter, year);
    
    const projects = await db.projects.toArray();
    const reportProjects: QuarterlyReportProject[] = [];
    let totalTasks = 0;

    for (const project of projects) {
      const stories = await db.userStories
        .where('projectId')
        .equals(project.id)
        .toArray();

      const userStoriesWithTasks: QuarterlyReportProject['userStories'] = [];

      for (const story of stories) {
        const completedTasks = await db.tasks
          .where('userStoryId')
          .equals(story.id)
          .filter(t => 
            t.completedAt !== null && 
            isInQuarter(t.completedAt, quarter, year)
          )
          .toArray();

        if (completedTasks.length > 0) {
          userStoriesWithTasks.push({
            userStory: story,
            completedTasks,
          });
          totalTasks += completedTasks.length;
        }
      }

      if (userStoriesWithTasks.length > 0) {
        reportProjects.push({
          project,
          userStories: userStoriesWithTasks,
          totalCompleted: userStoriesWithTasks.reduce(
            (sum, s) => sum + s.completedTasks.length, 
            0
          ),
        });
      }
    }

    return {
      quarter,
      year,
      startDate: start,
      endDate: end,
      projects: reportProjects,
      totalTasks,
    };
  }

  formatReportAsText(report: QuarterlyReportData): string {
    let text = `${getQuarterLabel(report.quarter, report.year)} Summary\n`;
    text += `${'='.repeat(40)}\n\n`;
    text += `Total Completed Tasks: ${report.totalTasks}\n\n`;

    for (const proj of report.projects) {
      text += `📁 ${proj.project.title} (${proj.totalCompleted} tasks)\n`;
      
      for (const story of proj.userStories) {
        text += `  📋 ${story.userStory.title}\n`;
        
        for (const task of story.completedTasks) {
          const date = task.completedAt 
            ? new Date(task.completedAt).toLocaleDateString() 
            : 'N/A';
          text += `    ✓ ${task.title} (Completed: ${date})\n`;
        }
      }
      text += '\n';
    }

    return text;
  }
}

export const reportService = new ReportService();
```

**src/services/index.ts**
```typescript
export { projectService } from './project.service';
export { userStoryService } from './userStory.service';
export { taskService } from './task.service';
export { reportService } from './report.service';
```

### Acceptance Criteria
- [ ] All services compile
- [ ] CRUD operations work
- [ ] Status change side effects apply correctly
- [ ] Quarterly report generates correctly

---

## Task 1.6: Zustand Stores

**src/stores/app.store.ts**
```typescript
import { create } from 'zustand';
import { 
  Project, 
  ProjectWithCounts,
  UserStory, 
  UserStoryWithCounts,
  Task,
  TaskViewModel,
  TaskStatus,
  CreateProjectDto,
  CreateUserStoryDto,
  CreateTaskDto,
  UpdateTaskDto,
  AddActivityLogDto,
} from '@/types';
import { projectService, userStoryService, taskService } from '@/services';

interface AppState {
  // Data
  projects: ProjectWithCounts[];
  userStories: UserStoryWithCounts[];
  tasks: TaskViewModel[];
  
  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions - Projects
  loadProjects: () => Promise<void>;
  createProject: (dto: CreateProjectDto) => Promise<Project>;
  updateProject: (id: string, dto: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Actions - User Stories
  loadUserStories: (projectId: string) => Promise<void>;
  createUserStory: (dto: CreateUserStoryDto) => Promise<UserStory>;
  updateUserStory: (id: string, dto: Partial<UserStory>) => Promise<void>;
  archiveUserStory: (id: string) => Promise<void>;
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
  },

  archiveProject: async (id) => {
    await projectService.archive(id);
    await get().loadProjects();
  },

  deleteProject: async (id) => {
    await projectService.delete(id);
    await get().loadProjects();
  },

  // User Stories
  loadUserStories: async (projectId) => {
    set({ isLoading: true, error: null });
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
    set({ isLoading: true, error: null });
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
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getAllActive();
      const taskViewModels = await taskService.getTasksWithViewModels(tasks);
      set({ tasks: taskViewModels, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadTasksForProject: async (projectId) => {
    set({ isLoading: true, error: null });
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
    await get().loadTasks(dto.userStoryId);
    await get().loadProjects();
    return task;
  },

  updateTask: async (id, dto) => {
    const task = await taskService.getById(id);
    if (task) {
      await taskService.update(id, dto);
      await get().refresh();
    }
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
    await get().loadProjects();
    // Tasks will be reloaded based on current selection in UI
  },
}));
```

**src/stores/ui.store.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SelectionState } from '@/types';

type ModalType = 
  | 'project' 
  | 'userStory' 
  | 'task' 
  | 'taskDetail'
  | 'blocked'
  | 'confirm'
  | 'quarterlyReport'
  | null;

interface ModalState {
  type: ModalType;
  mode: 'create' | 'edit' | 'view';
  data?: unknown;
}

interface UIState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Selection
  selection: SelectionState;
  selectProject: (projectId: string | null) => void;
  selectUserStory: (userStoryId: string | null) => void;
  clearSelection: () => void;

  // Modal
  modal: ModalState;
  openModal: (type: ModalType, mode?: 'create' | 'edit' | 'view', data?: unknown) => void;
  closeModal: () => void;

  // View
  activeTab: 'dashboard' | 'completed';
  setActiveTab: (tab: 'dashboard' | 'completed') => void;

  // Search
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Sidebar
  showArchivedProjects: boolean;
  toggleShowArchivedProjects: () => void;
  showArchivedStories: boolean;
  toggleShowArchivedStories: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      isDarkMode: false,
      toggleTheme: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
      }),

      // Selection
      selection: {
        projectId: null,
        userStoryId: null,
      },
      selectProject: (projectId) => set({
        selection: { projectId, userStoryId: null },
      }),
      selectUserStory: (userStoryId) => set((state) => ({
        selection: { ...state.selection, userStoryId },
      })),
      clearSelection: () => set({
        selection: { projectId: null, userStoryId: null },
      }),

      // Modal
      modal: { type: null, mode: 'create' },
      openModal: (type, mode = 'create', data) => set({
        modal: { type, mode, data },
      }),
      closeModal: () => set({
        modal: { type: null, mode: 'create', data: undefined },
      }),

      // View
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Search
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      // Sidebar
      showArchivedProjects: false,
      toggleShowArchivedProjects: () => set((state) => ({
        showArchivedProjects: !state.showArchivedProjects,
      })),
      showArchivedStories: false,
      toggleShowArchivedStories: () => set((state) => ({
        showArchivedStories: !state.showArchivedStories,
      })),
    }),
    {
      name: 'hr-taskdashboard-ui',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        showArchivedProjects: state.showArchivedProjects,
        showArchivedStories: state.showArchivedStories,
      }),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('hr-taskdashboard-ui');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }
}
```

**src/stores/filter.store.ts**
```typescript
import { create } from 'zustand';
import { FilterState, TaskStatus } from '@/types';

interface FilterStore extends FilterState {
  setSearchTerm: (term: string) => void;
  setShowBlockedOnly: (show: boolean) => void;
  setShowDueSoonOnly: (show: boolean) => void;
  setShowStaleOnly: (show: boolean) => void;
  setStatusFilter: (status: TaskStatus | 'all') => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

const initialState: FilterState = {
  searchTerm: '',
  showBlockedOnly: false,
  showDueSoonOnly: false,
  showStaleOnly: false,
  statusFilter: 'all',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...initialState,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setShowBlockedOnly: (showBlockedOnly) => set({ showBlockedOnly }),
  setShowDueSoonOnly: (showDueSoonOnly) => set({ showDueSoonOnly }),
  setShowStaleOnly: (showStaleOnly) => set({ showStaleOnly }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  
  clearFilters: () => set(initialState),
  
  hasActiveFilters: () => {
    const state = get();
    return (
      state.searchTerm !== '' ||
      state.showBlockedOnly ||
      state.showDueSoonOnly ||
      state.showStaleOnly ||
      state.statusFilter !== 'all'
    );
  },
}));
```

**src/stores/index.ts**
```typescript
export { useAppStore } from './app.store';
export { useUIStore } from './ui.store';
export { useFilterStore } from './filter.store';
```

### Acceptance Criteria
- [ ] All stores compile
- [ ] UI store persists theme preference
- [ ] App store CRUD operations work
- [ ] Filter store manages all filters

---

# Phase 2: Layout & Navigation

## Task 2.1: Main Layout

**src/components/layout/MainLayout.tsx**
```typescript
import { useEffect } from 'react';
import { Header } from './Header';
import { ProjectSidebar } from './ProjectSidebar';
import { UserStorySidebar } from './UserStorySidebar';
import { useAppStore, useUIStore } from '@/stores';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { loadProjects } = useAppStore();
  const { selection } = useUIStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <ProjectSidebar />
        {selection.projectId && <UserStorySidebar />}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Task 2.2: Header

**src/components/layout/Header.tsx**
```typescript
import { Sun, Moon, Search, FileText } from 'lucide-react';
import { Button, SearchBar } from '@/components/common';
import { useUIStore } from '@/stores';

export function Header() {
  const { isDarkMode, toggleTheme, openModal, setSearchOpen } = useUIStore();

  return (
    <header className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-semibold text-lg">HR TaskDashboard</h1>
      </div>

      <div className="flex-1 max-w-xl mx-8">
        <SearchBar />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openModal('quarterlyReport')}
          title="Quarterly Report"
        >
          <FileText className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
```

## Task 2.3: Project Sidebar

**src/components/layout/ProjectSidebar.tsx**
```typescript
import { Plus, FolderOpen, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import { useAppStore, useUIStore } from '@/stores';
import { Button } from '@/components/common';

export function ProjectSidebar() {
  const { projects } = useAppStore();
  const { 
    selection, 
    selectProject, 
    clearSelection,
    openModal,
    showArchivedProjects,
    toggleShowArchivedProjects,
  } = useUIStore();

  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  return (
    <aside className="w-[180px] sidebar flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => openModal('project', 'create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* All Tasks */}
        <div
          onClick={clearSelection}
          className={cn(
            'sidebar-item flex items-center gap-2',
            selection.projectId === null && 'active'
          )}
        >
          <FolderOpen className="w-4 h-4" />
          <span>All Tasks</span>
        </div>

        {/* Active Projects */}
        {activeProjects.map(project => (
          <div
            key={project.id}
            onClick={() => selectProject(project.id)}
            className={cn(
              'sidebar-item',
              selection.projectId === project.id && 'active'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="truncate">{project.title}</span>
              {project.blockedCount > 0 && (
                <span className="text-xs bg-red-500 text-white rounded-full px-1.5">
                  {project.blockedCount}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Archived Projects Toggle */}
        {archivedProjects.length > 0 && (
          <>
            <div
              onClick={toggleShowArchivedProjects}
              className="sidebar-item flex items-center gap-2 text-gray-500"
            >
              {showArchivedProjects ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Archive className="w-4 h-4" />
              <span>Archived ({archivedProjects.length})</span>
            </div>

            {showArchivedProjects && archivedProjects.map(project => (
              <div
                key={project.id}
                onClick={() => selectProject(project.id)}
                className={cn(
                  'sidebar-item ml-4 text-gray-500',
                  selection.projectId === project.id && 'active'
                )}
              >
                {project.title}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
```

## Task 2.4: User Story Sidebar

**src/components/layout/UserStorySidebar.tsx**
```typescript
import { useEffect } from 'react';
import { Plus, FileText, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import { useAppStore, useUIStore } from '@/stores';
import { Button } from '@/components/common';

export function UserStorySidebar() {
  const { userStories, loadUserStories } = useAppStore();
  const { 
    selection, 
    selectUserStory,
    openModal,
    showArchivedStories,
    toggleShowArchivedStories,
  } = useUIStore();

  useEffect(() => {
    if (selection.projectId) {
      loadUserStories(selection.projectId);
    }
  }, [selection.projectId, loadUserStories]);

  const activeStories = userStories.filter(s => !s.isArchived);
  const archivedStories = userStories.filter(s => s.isArchived);

  return (
    <aside className="w-[200px] sidebar flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => openModal('userStory', 'create', { projectId: selection.projectId })}
        >
          <Plus className="w-4 h-4 mr-2" />
          New User Story
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* All Stories (Dashboard view) */}
        <div
          onClick={() => selectUserStory(null)}
          className={cn(
            'sidebar-item flex items-center gap-2',
            selection.userStoryId === null && 'active'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>All Stories</span>
        </div>

        {/* Active User Stories */}
        {activeStories.map(story => (
          <div
            key={story.id}
            onClick={() => selectUserStory(story.id)}
            className={cn(
              'sidebar-item',
              selection.userStoryId === story.id && 'active'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm">{story.title}</span>
              <span className="text-xs text-gray-500">
                {story.completedCount}/{story.taskCount}
              </span>
            </div>
            {story.blockedCount > 0 && (
              <div className="text-xs text-red-500 mt-0.5">
                {story.blockedCount} blocked
              </div>
            )}
          </div>
        ))}

        {/* Archived Stories Toggle */}
        {archivedStories.length > 0 && (
          <>
            <div
              onClick={toggleShowArchivedStories}
              className="sidebar-item flex items-center gap-2 text-gray-500"
            >
              {showArchivedStories ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Archive className="w-4 h-4" />
              <span>Archived ({archivedStories.length})</span>
            </div>

            {showArchivedStories && archivedStories.map(story => (
              <div
                key={story.id}
                onClick={() => selectUserStory(story.id)}
                className={cn(
                  'sidebar-item ml-4 text-gray-500 text-sm',
                  selection.userStoryId === story.id && 'active'
                )}
              >
                {story.title}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
```

---

# Phase 3: Dashboard View

## Task 3.1: Dashboard Component

Create `src/components/dashboard/Dashboard.tsx` with 4 sections:
- Blocked/Waiting (red accent)
- Active (blue accent)
- Due Soon (yellow accent)
- Stale (gray accent)

## Task 3.2: Dashboard Section

Create `src/components/dashboard/DashboardSection.tsx` - collapsible section with task cards.

## Task 3.3: Task Card

Create `src/components/dashboard/TaskCard.tsx` showing:
- Title
- Breadcrumb (Project > User Story)
- Days open
- Due date with warning colors
- Blocked indicator with days blocked

---

# Phase 4: Kanban Board

## Task 4.1: Kanban Board

Create `src/components/kanban/KanbanBoard.tsx` with 4 columns using @dnd-kit.

## Task 4.2: Kanban Column

Create `src/components/kanban/KanbanColumn.tsx` - droppable column.

## Task 4.3: Kanban Card

Create `src/components/kanban/KanbanCard.tsx` - draggable task card.

---

# Phase 5: Dialogs

## Task 5.1: Dialog Wrapper

Create reusable modal wrapper with backdrop and close handling.

## Task 5.2: Project Dialog

Create/edit project form.

## Task 5.3: User Story Dialog

Create/edit user story form.

## Task 5.4: Task Dialog

Create/edit task form with due date.

## Task 5.5: Task Detail Dialog

Full task view with:
- All fields
- Activity log
- Add log entry
- Status change

## Task 5.6: Blocked Dialog

Set blocked by and reason.

## Task 5.7: Quarterly Report Dialog

Select quarter/year, view report, copy to clipboard.

---

# Phase 6: Common Components

## Task 6.1: Button, Input, TextArea, Select, DatePicker

Form components with consistent styling.

## Task 6.2: Badge Components

StatusBadge, DaysIndicator, DueDateIndicator.

## Task 6.3: Search Bar

Global search with results dropdown.

## Task 6.4: Context Menu

Right-click menu for items.

---

# Phase 7: Completed Tab & Reports

## Task 7.1: Completed Tab

Archived tasks grouped by Project > User Story.

## Task 7.2: Quarterly Report

Generate and display report with copy functionality.

---

# Phase 8: Final Polish

## Task 8.1: Keyboard Shortcuts

- `Ctrl+N`: New task
- `Ctrl+F`: Focus search
- `Escape`: Close modal

## Task 8.2: Error Handling

Error boundaries and user feedback.

## Task 8.3: Loading States

Skeleton loaders and spinners.

## Task 8.4: Electron Build

Configure electron-builder for portable executable.

---

## Implementation Order

| Order | Task | Description |
|-------|------|-------------|
| 1 | 1.1 | Project setup with Vite + Electron |
| 2 | 1.2 | Type definitions |
| 3 | 1.3 | Database setup (Dexie) |
| 4 | 1.4 | Utility functions |
| 5 | 1.5 | Services layer |
| 6 | 1.6 | Zustand stores |
| 7 | 2.1 | Main layout |
| 8 | 2.2 | Header |
| 9 | 2.3 | Project sidebar |
| 10 | 2.4 | User story sidebar |
| 11 | 3.1 | Dashboard component |
| 12 | 3.2 | Dashboard section |
| 13 | 3.3 | Task card |
| 14 | 4.1 | Kanban board |
| 15 | 4.2 | Kanban column |
| 16 | 4.3 | Kanban card |
| 17 | 5.1 | Dialog wrapper |
| 18 | 5.2-5.7 | All dialogs |
| 19 | 6.1-6.4 | Common components |
| 20 | 7.1 | Completed tab |
| 21 | 7.2 | Quarterly report |
| 22 | 8.1-8.4 | Final polish |

---

## Quick Reference

| Component | File Path |
|-----------|-----------|
| Entry Point | `src/main.tsx` |
| App Root | `src/App.tsx` |
| Database | `src/db/database.ts` |
| Main Store | `src/stores/app.store.ts` |
| Task Service | `src/services/task.service.ts` |
| Main Layout | `src/components/layout/MainLayout.tsx` |
| Dashboard | `src/components/dashboard/Dashboard.tsx` |
| Kanban | `src/components/kanban/KanbanBoard.tsx` |
| Electron Main | `electron/main.ts` |

---

## Critical Implementation Notes

1. **Status Changes Have Side Effects**
   - New → Active: Sets `startDate`
   - Any → Blocked: Sets `blockedAt`, `isBlocked`
   - Blocked → Other: Clears blocked fields
   - Any → Completed: Sets `completedAt`

2. **Days Calculations**
   - `daysOpen` = days since `startDate` or `createdAt`
   - `daysBlocked` = days since `blockedAt`
   - `isStale` = `lastUpdatedAt` > 7 days ago
   - `isDueSoon` = `dueDate` within 7 days
   - `isOverdue` = `dueDate` in the past

3. **Activity Log Auto-Updates**
   - Adding entry updates `lastUpdatedAt` to entry date
   - Can manually set entry date (backdating)

4. **Archive vs Delete**
   - Archive: Hidden but searchable, can unarchive
   - Delete: Permanent removal

5. **Electron Build**
   - Run `npm run electron:build` for portable executable
   - Output in `/release` folder

Good luck! 🚀
