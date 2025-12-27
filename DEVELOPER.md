# Developer Guide

Complete guide for developers maintaining and extending the HR TaskDashboard application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Data Flow](#data-flow)
4. [Key Files Reference](#key-files-reference)
5. [How To: Common Tasks](#how-to-common-tasks)
6. [Patterns & Conventions](#patterns--conventions)
7. [Gotchas & Tips](#gotchas--tips)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development (opens Electron app with hot reload)
npm run dev

# Build portable Windows exe
npm run electron:build
# Output: release/HR TaskDashboard X.X.X.exe
```

---

## Architecture Overview

### Tech Stack Decisions

| Technology | Why We Use It |
|------------|---------------|
| **Zustand** | Simpler than Redux, no boilerplate, great TypeScript support |
| **Dexie.js** | Type-safe IndexedDB wrapper, supports complex queries |
| **@dnd-kit** | Modern drag-drop, better than react-beautiful-dnd (unmaintained) |
| **Tailwind CSS 4** | Utility-first, fast development, built-in dark mode |
| **React Hook Form + Zod** | Performant forms with schema validation |
| **Electron** | Desktop app with local storage, no server needed |

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                            │
│  (React components that render UI and handle user events)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Stores                           │
│  (State management - connects UI to services)               │
│  • useAppStore: Data (projects, stories, tasks)             │
│  • useUIStore: UI state (theme, selection, modals)          │
│  • useFilterStore: Search and filter state                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Services                                │
│  (Business logic - CRUD operations, data transformations)   │
│  • projectService, userStoryService, taskService            │
│  • reportService, exportImportService                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (Dexie)                        │
│  (IndexedDB tables: projects, userStories, tasks)           │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```
Project (1) ──────< UserStory (many)
                        │
                        └──────< Task (many)
                                   │
                                   └──────< ActivityLogEntry (many)
```

**Key Insight**: Projects and User Stories are containers - they never "complete". Only Tasks have status transitions.

---

## Data Flow

### Example: Creating a Task

```
1. User clicks "New Task" button
2. UI calls: useUIStore.openModal('task', 'create', { userStoryId })
3. TaskDialog opens, user fills form
4. Form submit calls: useAppStore.createTask(dto)
5. Store calls: taskService.create(dto)
6. Service calls: db.tasks.add(task)
7. Store refreshes: loadTasks(userStoryId), loadProjects()
8. UI re-renders with new data
```

### Example: Drag-Drop Status Change

```
1. User drags task to "Blocked" column
2. KanbanBoard.handleDragEnd() triggered
3. Validates drop target is a valid status
4. If Blocked: opens BlockedDialog for reason
5. Calls: useAppStore.updateTaskStatus(id, newStatus)
6. Store calls: taskService.updateStatus(id, status)
7. Store refreshes data
```

---

## Key Files Reference

### Where Things Live

| To Change... | Look In... |
|--------------|------------|
| App layout/structure | `src/App.tsx` |
| Header/navigation | `src/components/layout/Header.tsx` |
| Project sidebar | `src/components/layout/ProjectSidebar.tsx` |
| User story sidebar | `src/components/layout/UserStorySidebar.tsx` |
| Dashboard sections | `src/components/dashboard/Dashboard.tsx` |
| Kanban board | `src/components/kanban/KanbanBoard.tsx` |
| Task cards | `src/components/kanban/KanbanCard.tsx`, `dashboard/TaskCard.tsx` |
| Any dialog/modal | `src/components/dialogs/[Name]Dialog.tsx` |
| Database schema | `src/db/database.ts` |
| Type definitions | `src/types/` |
| API/data operations | `src/services/` |
| Global state | `src/stores/` |
| Reusable UI components | `src/components/common/` |
| Electron config | `electron/main.ts` |
| Build config | `electron-builder.json` |

### Store Responsibilities

| Store | Purpose | Persisted? |
|-------|---------|------------|
| `useAppStore` | Projects, user stories, tasks, CRUD operations | No (data in IndexedDB) |
| `useUIStore` | Theme, sidebar selection, modal state, view preferences | Yes (localStorage) |
| `useFilterStore` | Search term, status filter, quick filters | No |

---

## How To: Common Tasks

### Add a New Field to Task

1. **Update Type** (`src/types/models.ts`):
   ```typescript
   export interface Task {
     // ... existing fields
     priority?: 'low' | 'medium' | 'high';  // Add new field
   }
   ```

2. **Update ViewModel if needed** (`src/types/viewModels.ts`):
   ```typescript
   export interface TaskViewModel extends Task {
     // Add computed fields here
   }
   ```

3. **Update Service** (`src/services/task.service.ts`):
   - Add to `create()` method if needed
   - Add to `getTasksWithViewModels()` if it's a computed field

4. **Update Dialog** (`src/components/dialogs/TaskDialog.tsx`):
   - Add form field and validation schema

5. **Update Display** (TaskCard, KanbanCard, etc.):
   - Show the new field in UI

### Add a New Dialog

1. **Create Dialog Component** (`src/components/dialogs/MyDialog.tsx`):
   ```typescript
   import { DialogWrapper } from './DialogWrapper';
   import { useUIStore } from '@/stores';

   export function MyDialog() {
     const { modal, closeModal } = useUIStore();
     const isOpen = modal.type === 'myDialog';

     return (
       <DialogWrapper isOpen={isOpen} onClose={closeModal} title="My Dialog">
         {/* Content */}
       </DialogWrapper>
     );
   }
   ```

2. **Add Modal Type** (`src/stores/ui.store.ts`):
   ```typescript
   type ModalType = 'project' | 'userStory' | 'task' | ... | 'myDialog';
   ```

3. **Export from Index** (`src/components/dialogs/index.ts`):
   ```typescript
   export { MyDialog } from './MyDialog';
   ```

4. **Add to App.tsx**:
   ```typescript
   import { MyDialog } from '@/components/dialogs';
   // In render:
   <MyDialog />
   ```

5. **Open from anywhere**:
   ```typescript
   const { openModal } = useUIStore();
   openModal('myDialog', 'create', { someData });
   ```

### Add a New Dashboard Section

1. **Edit Dashboard.tsx** (`src/components/dashboard/Dashboard.tsx`):
   ```typescript
   // Add filter
   const urgentTasks = useMemo(() =>
     filteredTasks.filter(t => t.priority === 'high' && t.status !== TaskStatus.Completed),
     [filteredTasks]
   );

   // Add to hasTasks check
   const hasTasks = urgentTasks.length > 0 || blockedTasks.length > 0 || ...

   // Add section in render
   <DashboardSection
     title="Urgent"
     tasks={urgentTasks}
     accentColor="red"
     icon={<AlertTriangle className="w-4 h-4" />}
   />
   ```

2. **Add accent color if needed** (`src/components/dashboard/DashboardSection.tsx`):
   ```typescript
   const accentColors = {
     red: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
     // Add new color...
   };
   ```

### Add a New Service

1. **Create Service File** (`src/services/myFeature.service.ts`):
   ```typescript
   import { db } from '@/db';

   class MyFeatureService {
     async doSomething(): Promise<void> {
       // Implementation
     }
   }

   export const myFeatureService = new MyFeatureService();
   ```

2. **Export from Index** (`src/services/index.ts`):
   ```typescript
   export { myFeatureService } from './myFeature.service';
   ```

### Add Store Action

1. **Add to Interface** (`src/stores/app.store.ts`):
   ```typescript
   interface AppState {
     // ...
     myNewAction: (param: string) => Promise<void>;
   }
   ```

2. **Implement Action**:
   ```typescript
   export const useAppStore = create<AppState>((set, get) => ({
     // ...
     myNewAction: async (param) => {
       await someService.doThing(param);
       await get().refresh();  // Reload data
     },
   }));
   ```

---

## Patterns & Conventions

### Component Structure

```typescript
// 1. Imports (external first, then internal by category)
import { useState, useEffect } from 'react';
import { SomeIcon } from 'lucide-react';
import { useAppStore, useUIStore } from '@/stores';
import { Button } from '@/components/common';
import type { Task } from '@/types';

// 2. Types/Interfaces
interface Props {
  task: Task;
  onEdit?: () => void;
}

// 3. Component
export function TaskCard({ task, onEdit }: Props) {
  // Hooks first
  const { updateTask } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);

  // Handlers
  const handleClick = () => { ... };

  // Render
  return (
    <div>...</div>
  );
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with `use` | `useDebounce.ts` |
| Services | camelCase with `Service` | `task.service.ts` |
| Stores | camelCase with `Store` | `app.store.ts` |
| Types | PascalCase | `TaskViewModel` |
| Constants | UPPER_SNAKE | `STATUS_COLORS` |

### Form Pattern (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Required').max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Reset form when modal opens (important for edit mode!)
  useEffect(() => {
    if (isOpen) {
      reset(isEdit ? existingData : defaultValues);
    }
  }, [isOpen, isEdit, existingData, reset]);

  const onSubmit = async (data: FormData) => {
    // Handle submit
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Refresh Pattern

After any data mutation, call `refresh()` to reload affected data:

```typescript
updateTask: async (id, dto) => {
  await taskService.update(id, dto);
  await get().refresh();  // Reloads based on current view context
},
```

The `refresh()` function is smart - it reloads:
- Projects (always, for sidebar counts)
- Tasks (based on currentProjectId or currentUserStoryId)
- User Stories (if viewing a project)

---

## Gotchas & Tips

### TypeScript

1. **Enums don't work** - Use const objects instead:
   ```typescript
   // DON'T
   enum TaskStatus { New = 'new' }

   // DO
   export const TaskStatus = {
     New: 'new',
     Active: 'active',
   } as const;
   export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
   ```

2. **Import types with `type` keyword**:
   ```typescript
   import type { DragEndEvent } from '@dnd-kit/core';
   ```

### React Hook Form

**Form doesn't populate in edit mode?** The `defaultValues` only work on first render. Use `useEffect` + `reset()`:

```typescript
useEffect(() => {
  if (isOpen && isEdit && data) {
    reset({ title: data.title, description: data.description || '' });
  }
}, [isOpen, isEdit, data, reset]);
```

### Drag and Drop

**Tasks disappearing on drop?** Always validate the drop target is a valid column status:

```typescript
const validStatuses = [TaskStatus.New, TaskStatus.Active, TaskStatus.Blocked, TaskStatus.Completed];
if (!validStatuses.includes(overId as TaskStatus)) {
  return; // Invalid drop target, do nothing
}
```

### Zustand

1. **Get current state in action**: Use `get()`:
   ```typescript
   myAction: async () => {
     const { currentProjectId } = get();
     // ...
   }
   ```

2. **Access store outside React**:
   ```typescript
   useUIStore.getState().closeModal();
   ```

### Tailwind CSS

1. **Dark mode classes**: Always pair with `dark:` variant:
   ```typescript
   className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
   ```

2. **Hover states on parent**: Use `group` and `group-hover`:
   ```typescript
   <div className="group">
     <button className="opacity-0 group-hover:opacity-100">...</button>
   </div>
   ```

### IndexedDB (Dexie)

1. **Data persists between sessions** - Clear with Settings → Clear All Data
2. **Schema changes** require version bump in `db/database.ts`
3. **Query optimization**: Use indexed fields for filters

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| White screen on load | Check browser console for errors. Usually a TypeScript/import issue. |
| Tasks not refreshing | Make sure action calls `await get().refresh()` after mutation |
| Form not populating in edit mode | Add `useEffect` with `reset()` - see pattern above |
| Drag-drop task disappears | Validate drop target is a valid status before updating |
| Build fails with symlink error | Add `"signAndEditExecutable": false` to win config |
| Menu bar showing in Electron | Add `Menu.setApplicationMenu(null)` in main.ts |

### Debug Tips

1. **React DevTools**: Install browser extension
2. **Zustand DevTools**: Add middleware for state debugging
3. **IndexedDB Viewer**: Chrome DevTools → Application → IndexedDB
4. **Electron DevTools**: Press `Ctrl+Shift+I` in the app

### Reset Development State

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear build artifacts
rm -rf dist dist-electron release
```

---

## File Quick Reference

```
src/
├── components/
│   ├── common/           # Reusable: Button, Input, Select, TextArea, etc.
│   ├── completed/        # CompletedTab.tsx - quarterly view of done tasks
│   ├── dashboard/        # Dashboard.tsx, DashboardSection.tsx, TaskCard.tsx
│   ├── dialogs/          # All modals: Project, UserStory, Task, Blocked, etc.
│   ├── kanban/           # KanbanBoard.tsx, KanbanColumn.tsx, KanbanCard.tsx
│   └── layout/           # Header.tsx, MainLayout.tsx, *Sidebar.tsx
├── db/
│   └── database.ts       # Dexie database schema
├── services/
│   ├── project.service.ts
│   ├── userStory.service.ts
│   ├── task.service.ts
│   ├── report.service.ts
│   └── exportImport.service.ts
├── stores/
│   ├── app.store.ts      # Main data store
│   ├── ui.store.ts       # UI state (persisted)
│   ├── filter.store.ts   # Search/filter state
│   └── index.ts
├── types/
│   ├── models.ts         # Database models
│   ├── viewModels.ts     # Extended models for UI
│   ├── dtos.ts           # Create/Update DTOs
│   └── enums.ts          # Status constants
├── utils/
│   ├── cn.ts             # Tailwind class merger
│   ├── date.ts           # Date formatting helpers
│   └── search.ts         # Search matching
├── App.tsx               # Main app, renders layout + all dialogs
└── main.tsx              # React entry point
```

---

*Last updated: December 2024*
