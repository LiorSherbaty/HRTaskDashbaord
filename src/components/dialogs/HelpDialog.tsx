import { FolderOpen, FileText, CheckSquare, AlertTriangle, Lightbulb, Keyboard, Calendar, Activity } from 'lucide-react';
import { DialogWrapper } from './DialogWrapper';
import { Button } from '@/components/common';
import { useUIStore } from '@/stores';

export function HelpDialog() {
  const { modal, closeModal } = useUIStore();

  const isOpen = modal.type === 'help';

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={closeModal}
      title="Help & Tips"
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Overview */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Overview
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            HR TaskDashboard helps you manage ongoing HR responsibilities and tasks.
            It uses a three-level hierarchy:
          </p>
          <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside">
            <li><strong>Projects</strong> - Major responsibility areas (e.g., "Onboarding Team")</li>
            <li><strong>User Stories</strong> - Ongoing processes within projects (e.g., "Keeping manual updated")</li>
            <li><strong>Tasks</strong> - Individual work items that can be completed</li>
          </ul>
        </section>

        {/* Projects */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-500" />
            Projects
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Click <strong>"New Project"</strong> in the left sidebar to create a project</li>
            <li>• Click on a project to filter tasks and see its user stories</li>
            <li>• Click <strong>"All Tasks"</strong> to see tasks across all projects</li>
            <li>• Projects never "complete" - they represent ongoing responsibilities</li>
            <li>• Archive projects you no longer need (toggle "Archived" to see them)</li>
          </ul>
        </section>

        {/* User Stories */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" />
            User Stories
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Select a project to see its user stories in the second sidebar</li>
            <li>• Click <strong>"New Story"</strong> to add a user story</li>
            <li>• Click on a user story to see its Kanban board</li>
            <li>• User stories represent ongoing processes, not one-time tasks</li>
          </ul>
        </section>

        {/* Tasks */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            Tasks
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Create tasks within a user story using <strong>"New Task"</strong></li>
            <li>• <strong>Drag and drop</strong> tasks between columns on the Kanban board</li>
            <li>• Click on a task to see details, add notes, and change status</li>
            <li>• Set due dates to track deadlines</li>
            <li>• Use the Activity Log to record updates and notes on tasks</li>
          </ul>
        </section>

        {/* Status Meanings */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Task Statuses
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">New</span>
              <span className="text-gray-600 dark:text-gray-400">Task hasn't been started yet</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Active</span>
              <span className="text-gray-600 dark:text-gray-400">Currently being worked on (tracks days open)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Blocked</span>
              <span className="text-gray-600 dark:text-gray-400">Waiting on someone/something (specify who and why)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Completed</span>
              <span className="text-gray-600 dark:text-gray-400">Task is finished (appears in Completed tab)</span>
            </div>
          </div>
        </section>

        {/* Dashboard Sections */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Dashboard Sections
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• <strong className="text-red-600">Blocked</strong> - Tasks waiting on others (highest priority)</li>
            <li>• <strong className="text-blue-600">Active</strong> - Tasks currently in progress</li>
            <li>• <strong className="text-yellow-600">Due Soon</strong> - Tasks with due date within 7 days</li>
            <li>• <strong className="text-gray-500">Stale</strong> - Tasks not updated in 7+ days (needs attention)</li>
          </ul>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + K</kbd>
              <span className="text-gray-600 dark:text-gray-400">Focus search</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
              <span className="text-gray-600 dark:text-gray-400">Close dialogs</span>
            </div>
          </div>
        </section>

        {/* Pro Tips */}
        <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Pro Tips
          </h3>
          <ul className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
            <li>• <strong>Use Activity Logs</strong> - Record updates so you remember where you left off</li>
            <li>• <strong>Mark blocked tasks</strong> - Always specify who/what is blocking and follow up</li>
            <li>• <strong>Set due dates</strong> - Even rough dates help prioritize work</li>
            <li>• <strong>Check "Stale" section</strong> - Tasks here may need a status update or action</li>
            <li>• <strong>Export regularly</strong> - Use Settings → Export to backup your data</li>
            <li>• <strong>Quarterly Reports</strong> - Generate reports to summarize accomplishments</li>
            <li>• <strong>Use dark mode</strong> - Toggle in the header for comfortable viewing</li>
          </ul>
        </section>

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
