import { Sun, Moon, FileText, Settings, HelpCircle } from 'lucide-react';
import { Button, SearchInput } from '@/components/common';
import { useUIStore, useFilterStore } from '@/stores';

export function Header() {
  const { isDarkMode, toggleTheme, openModal, activeTab, setActiveTab } = useUIStore();
  const { searchTerm, setSearchTerm } = useFilterStore();

  return (
    <header className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-semibold text-lg">HR TaskDashboard</h1>
      </div>

      <div className="flex items-center gap-2 ml-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === 'completed'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search tasks, projects, stories..."
        />
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
          onClick={() => openModal('settings')}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openModal('help')}
          title="Help & Tips"
        >
          <HelpCircle className="w-4 h-4" />
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
