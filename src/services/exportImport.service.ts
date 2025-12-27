import { db } from '@/db';

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    projects: unknown[];
    userStories: unknown[];
    tasks: unknown[];
  };
}

class ExportImportService {
  async exportData(): Promise<void> {
    try {
      const projects = await db.projects.toArray();
      const userStories = await db.userStories.toArray();
      const tasks = await db.tasks.toArray();

      const backup: BackupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          projects,
          userStories,
          tasks,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr-taskdashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  async importData(file: File): Promise<void> {
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);

      // Validate structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      if (!backup.data.projects || !backup.data.userStories || !backup.data.tasks) {
        throw new Error('Backup file is missing required data');
      }

      // Clear existing data and import new data in a transaction
      await db.transaction('rw', [db.projects, db.userStories, db.tasks], async () => {
        await db.projects.clear();
        await db.userStories.clear();
        await db.tasks.clear();

        if (backup.data.projects.length > 0) {
          await db.projects.bulkAdd(backup.data.projects as never[]);
        }
        if (backup.data.userStories.length > 0) {
          await db.userStories.bulkAdd(backup.data.userStories as never[]);
        }
        if (backup.data.tasks.length > 0) {
          await db.tasks.bulkAdd(backup.data.tasks as never[]);
        }
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await db.transaction('rw', [db.projects, db.userStories, db.tasks], async () => {
        await db.projects.clear();
        await db.userStories.clear();
        await db.tasks.clear();
      });
    } catch (error) {
      console.error('Clear data failed:', error);
      throw new Error('Failed to clear data');
    }
  }
}

export const exportImportService = new ExportImportService();
