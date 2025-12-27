import { useState, useEffect, useMemo } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { DialogWrapper } from './DialogWrapper';
import { Button, Select, LoadingSpinner } from '@/components/common';
import { useUIStore } from '@/stores';
import { reportService } from '@/services';
import type { QuarterlyReportData } from '@/types';
import { getCurrentQuarter, formatQuarter, formatDate } from '@/utils';

export function QuarterlyReportDialog() {
  const { modal, closeModal } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<QuarterlyReportData | null>(null);

  const { year: currentYear, quarter: currentQuarter } = getCurrentQuarter();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  const isOpen = modal.type === 'quarterlyReport';

  // Generate year options (last 3 years)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 2; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen, selectedYear, selectedQuarter]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.generateQuarterlyReport(selectedYear, selectedQuarter);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    }
    setIsLoading(false);
  };

  const handlePreviousQuarter = () => {
    if (selectedQuarter === 1) {
      setSelectedQuarter(4);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedQuarter(selectedQuarter - 1);
    }
  };

  const handleNextQuarter = () => {
    if (selectedQuarter === 4) {
      setSelectedQuarter(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedQuarter(selectedQuarter + 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!report) return;

    const content = generateTextReport(report);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quarterly-report-${report.year}-Q${report.quarter}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateTextReport = (data: QuarterlyReportData): string => {
    const lines: string[] = [
      `QUARTERLY REPORT - ${formatQuarter(data.year, data.quarter)}`,
      `Generated: ${formatDate(new Date())}`,
      `Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`,
      '',
      '═══════════════════════════════════════════════════════════════',
      'SUMMARY',
      '═══════════════════════════════════════════════════════════════',
      '',
      `Total Completed Tasks: ${data.summary.totalCompleted}`,
      `Total Active Tasks: ${data.summary.totalActive}`,
      `Total Blocked Tasks: ${data.summary.totalBlocked}`,
      `Average Days to Complete: ${data.summary.avgDaysToComplete.toFixed(1)}`,
      '',
    ];

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('COMPLETED TASKS BY PROJECT');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    for (const project of data.completedByProject) {
      lines.push(`${project.projectTitle} (${project.count} tasks)`);
      for (const task of project.tasks) {
        lines.push(`  • ${task.title}`);
        lines.push(`    User Story: ${task.userStoryTitle}`);
        lines.push(`    Completed: ${formatDate(task.completedAt!)}`);
        if (task.daysOpen) {
          lines.push(`    Duration: ${task.daysOpen} days`);
        }
      }
      lines.push('');
    }

    if (data.blockedTasks.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('CURRENTLY BLOCKED TASKS');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      for (const task of data.blockedTasks) {
        lines.push(`• ${task.title}`);
        lines.push(`  Project: ${task.projectTitle} > ${task.userStoryTitle}`);
        lines.push(`  Blocked By: ${task.blockedBy}`);
        if (task.blockedReason) {
          lines.push(`  Reason: ${task.blockedReason}`);
        }
        if (task.daysBlocked !== null) {
          lines.push(`  Days Blocked: ${task.daysBlocked}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  };

  const isCurrentOrFuture = selectedYear > currentYear ||
    (selectedYear === currentYear && selectedQuarter >= currentQuarter);

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={closeModal}
      title="Quarterly Report"
      size="xl"
    >
      <div className="space-y-6">
        {/* Quarter Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handlePreviousQuarter}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-24"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>

              <Select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="w-20"
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextQuarter}
              disabled={isCurrentOrFuture}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={!report}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : report ? (
          <div className="space-y-6 print:text-black">
            {/* Period Header */}
            <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatQuarter(report.year, report.quarter)}
              </h3>
              <p className="text-gray-500 mt-1">
                {formatDate(report.startDate)} - {formatDate(report.endDate)}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {report.summary.totalCompleted}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Completed
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {report.summary.totalActive}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Active
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {report.summary.totalBlocked}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Blocked
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {report.summary.avgDaysToComplete.toFixed(1)}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Avg Days
                </div>
              </div>
            </div>

            {/* Completed by Project */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Completed Tasks by Project
              </h4>

              {report.completedByProject.length > 0 ? (
                <div className="space-y-4">
                  {report.completedByProject.map(project => (
                    <div
                      key={project.projectId}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {project.projectTitle}
                        </h5>
                        <span className="px-2 py-0.5 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          {project.count} tasks
                        </span>
                      </div>

                      <ul className="space-y-2">
                        {project.tasks.map(task => (
                          <li
                            key={task.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              • {task.title}
                            </span>
                            <span className="text-gray-500">
                              {task.completedAt && formatDate(task.completedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No tasks completed this quarter</p>
              )}
            </div>

            {/* Blocked Tasks */}
            {report.blockedTasks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Currently Blocked Tasks
                </h4>

                <div className="space-y-3">
                  {report.blockedTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="font-medium text-red-800 dark:text-red-200">
                        {task.title}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {task.projectTitle} &gt; {task.userStoryTitle}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-400 mt-2">
                        Blocked by: {task.blockedBy}
                        {task.daysBlocked !== null && ` (${task.daysBlocked} days)`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mb-4" />
            <p>Select a quarter to generate report</p>
          </div>
        )}

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
