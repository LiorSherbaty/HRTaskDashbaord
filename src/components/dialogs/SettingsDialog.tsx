import { useRef, useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { DialogWrapper } from './DialogWrapper';
import { Button } from '@/components/common';
import { useUIStore } from '@/stores';
import { exportImportService } from '@/services/exportImport.service';

export function SettingsDialog() {
  const { modal, closeModal } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isOpen = modal.type === 'settings';

  const handleExport = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      await exportImportService.exportData();
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
    setIsProcessing(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'This will replace all existing data with the imported data. Are you sure you want to continue?'
    );

    if (!confirmed) {
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      await exportImportService.importData(file);
      setMessage({ type: 'success', text: 'Data imported successfully! Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import data'
      });
    }
    setIsProcessing(false);
    e.target.value = '';
  };

  const handleClearData = async () => {
    const firstConfirm = window.confirm(
      'Are you sure you want to delete ALL data? This cannot be undone!'
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      'FINAL WARNING: This will permanently delete all projects, user stories, and tasks. Type OK to confirm.'
    );

    if (!secondConfirm) return;

    setIsProcessing(true);
    setMessage(null);
    try {
      await exportImportService.clearAllData();
      setMessage({ type: 'success', text: 'All data cleared! Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear data' });
    }
    setIsProcessing(false);
  };

  const handleClose = () => {
    setMessage(null);
    closeModal();
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Settings"
      size="md"
    >
      <div className="space-y-6">
        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Data Management Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Data Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Export your data to move between machines or create backups. Import data from a previous export.
          </p>

          <div className="space-y-3">
            {/* Export */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Export Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download all your data as a JSON backup file
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={isProcessing}
                variant="secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Import Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Restore data from a backup file (replaces current data)
                </p>
              </div>
              <Button
                onClick={handleImportClick}
                disabled={isProcessing}
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Clear Data */}
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Clear All Data
                </h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Permanently delete all data (cannot be undone)
                </p>
              </div>
              <Button
                onClick={handleClearData}
                disabled={isProcessing}
                variant="danger"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>

        {/* Version Info */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
          HR TaskDashboard v1.1.0
        </div>
      </div>
    </DialogWrapper>
  );
}
