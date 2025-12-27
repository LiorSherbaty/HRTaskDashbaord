# HR Task Dashboard - AI Context

Quick reference for AI assistants. See [DEVELOPER.md](DEVELOPER.md) for complete documentation.

## Project Overview

Desktop task management app for HR teams. React + TypeScript + Electron.

**Data Hierarchy**: Projects > User Stories > Tasks

## Key Commands

```bash
npm run dev              # Development with hot reload
npm run electron:build   # Build Windows portable exe
```

## Architecture

```
UI Components → Zustand Stores → Services → Dexie (IndexedDB)
```

### Stores
- `useAppStore` - Data: projects, userStories, tasks + CRUD actions
- `useUIStore` - UI: theme, selection, modals (persisted to localStorage)
- `useFilterStore` - Search and filter state

### Key Locations

| Change | File |
|--------|------|
| App structure | `src/App.tsx` |
| Header | `src/components/layout/Header.tsx` |
| Sidebars | `src/components/layout/*Sidebar.tsx` |
| Dashboard | `src/components/dashboard/Dashboard.tsx` |
| Kanban | `src/components/kanban/KanbanBoard.tsx` |
| Dialogs | `src/components/dialogs/` |
| Types | `src/types/` |
| Services | `src/services/` |
| Database | `src/db/database.ts` |
| Electron | `electron/main.ts` |

## Common Patterns

### After Data Mutation
Always call `refresh()` to reload UI:
```typescript
await taskService.update(id, dto);
await get().refresh();
```

### Form Reset for Edit Mode
```typescript
useEffect(() => {
  if (isOpen) {
    reset(isEdit ? existingData : defaultValues);
  }
}, [isOpen, isEdit, existingData, reset]);
```

### TypeScript Enums (Don't Use)
```typescript
// Use const objects instead
export const TaskStatus = { New: 'new', Active: 'active' } as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
```

## Task Statuses

- `new` (gray) - Not started
- `active` (blue) - In progress
- `blocked` (red) - Waiting
- `completed` (green) - Done

## Important Notes

1. Only Tasks have status - Projects/UserStories are containers
2. Drag to Blocked column opens dialog for blocker info
3. `signAndEditExecutable: false` in electron-builder.json avoids Windows symlink issues
4. Menu bar removed via `Menu.setApplicationMenu(null)`
5. DevTools disabled by default (open with Ctrl+Shift+I)
