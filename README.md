# HR TaskDashboard

A desktop task management application designed for HR teams to track ongoing responsibilities, processes, and recurring tasks. Built with React, TypeScript, and Electron.

## Features

- **Hierarchical Organization**: Projects > User Stories > Tasks
- **Drag-and-Drop Reordering**: Reorder projects and user stories in sidebars with persistent custom ordering
- **Move Items Between Parents**: Move user stories between projects, and tasks between user stories
- **Kanban Board**: Drag-and-drop task management with status columns (New, Active, Blocked, Completed)
- **Dashboard Views**: See all tasks organized by status across projects
- **Smart Tracking**:
  - Days Open/Blocked counters
  - Stale task detection (7+ days without updates)
  - Due Soon alerts (within 3 days)
- **Activity Logging**: Add timestamped notes to track task progress
- **Quarterly Reports**: Generate reports of completed work by quarter
- **Dark Mode**: Full dark/light theme support
- **Offline-First**: All data stored locally in IndexedDB
- **Import/Export**: Backup and restore your data easily
- **Portable**: Single .exe file, no installation required

## Screenshots

*Dashboard view with task sections*

*Kanban board for task management*

## Installation

### For Users (Windows)

1. Download the latest `HR TaskDashboard X.X.X.exe` from [Releases](../../releases)
2. Double-click to run (no installation needed)
3. If Windows SmartScreen appears, click "More info" → "Run anyway"

### For Developers

```bash
# Clone the repository
git clone https://github.com/yourusername/hr-task-dashboard.git
cd hr-task-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Build portable exe
npm run electron:build
```

## Usage

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Project** | Top-level container for related work (e.g., "Onboarding", "Benefits Administration") |
| **User Story** | Ongoing process or responsibility within a project (e.g., "New Hire Setup", "Benefits Enrollment") |
| **Task** | Individual work item that can be completed |

### Task Statuses

| Status | Color | Description |
|--------|-------|-------------|
| New | Gray | Task created but not started |
| Active | Blue | Work in progress |
| Blocked | Red | Waiting on someone/something |
| Completed | Green | Work finished |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search |
| `Escape` | Close dialogs |

### Tips

- **Dashboard View**: Click a project in the left sidebar to filter tasks
- **Kanban View**: Click a user story in the middle sidebar to see its tasks
- **Reorder Items**: Drag projects or user stories in sidebars to customize their order
- **Move User Story**: Edit a user story and select a different project to move it (with all its tasks)
- **Move Task**: Edit a task and select a different user story to move it
- **Edit/Delete**: Hover over projects or user stories to see the action menu (...)
- **Block a Task**: Drag to the Blocked column to add blocker details
- **Activity Log**: Click a task to open details and add progress notes

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Desktop**: Electron 39
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB)
- **Drag & Drop**: @dnd-kit
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Date Handling**: date-fns

## Project Structure

```
hr-task-dashboard/
├── electron/               # Electron main process
│   ├── main.ts            # App window, menu config
│   └── preload.ts         # Preload script
├── src/
│   ├── components/
│   │   ├── common/        # Button, Input, Select, etc.
│   │   ├── completed/     # Completed tasks tab
│   │   ├── dashboard/     # Dashboard sections
│   │   ├── dialogs/       # All modal dialogs
│   │   ├── kanban/        # Kanban board & cards
│   │   └── layout/        # Header, sidebars
│   ├── db/                # Dexie database setup
│   ├── services/          # Data access layer
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── DEVELOPER.md           # Developer documentation
└── README.md              # This file
```

## Commands

```bash
# Development
npm run dev              # Start dev server + Electron

# Production Build
npm run build            # Build web assets
npm run electron:build   # Build portable .exe

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript check
```

## Data Storage

All data is stored locally in IndexedDB:
- **Location**: Browser/Electron app data folder
- **Format**: Structured database tables (Projects, UserStories, Tasks)
- **Backup**: Use Settings → Export to create JSON backup
- **Restore**: Use Settings → Import to restore from backup

## Contributing

See [DEVELOPER.md](DEVELOPER.md) for architecture details, coding conventions, and how to add new features.

## License

MIT License - Feel free to use and modify for your needs.
