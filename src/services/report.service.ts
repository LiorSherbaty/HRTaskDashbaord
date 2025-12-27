import { db } from '@/db';
import type { QuarterlyReportData, ProjectCompletedTasks, BlockedTaskInfo } from '@/types';
import { TaskStatus } from '@/types';
import { getQuarterRange, isInQuarter, getDaysOpen, getDaysBlocked } from '@/utils';

class ReportService {
  async generateQuarterlyReport(year: number, quarter: number): Promise<QuarterlyReportData> {
    const { start, end } = getQuarterRange(year, quarter);

    const projects = await db.projects.toArray();
    const completedByProject: ProjectCompletedTasks[] = [];
    const blockedTasks: BlockedTaskInfo[] = [];

    let totalCompleted = 0;
    let totalActive = 0;
    let totalBlocked = 0;
    let totalDaysToComplete = 0;
    let completedCount = 0;

    for (const project of projects) {
      const stories = await db.userStories
        .where('projectId')
        .equals(project.id)
        .toArray();

      const projectCompletedTasks: ProjectCompletedTasks['tasks'] = [];

      for (const story of stories) {
        const tasks = await db.tasks
          .where('userStoryId')
          .equals(story.id)
          .toArray();

        for (const task of tasks) {
          // Count active tasks
          if (task.status === TaskStatus.Active) {
            totalActive++;
          }

          // Collect blocked tasks
          if (task.status === TaskStatus.Blocked) {
            totalBlocked++;
            blockedTasks.push({
              id: task.id,
              title: task.title,
              projectTitle: project.title,
              userStoryTitle: story.title,
              blockedBy: task.blockedBy,
              blockedReason: task.blockedReason,
              daysBlocked: getDaysBlocked(task.blockedAt),
            });
          }

          // Collect completed tasks in quarter
          if (
            task.completedAt !== null &&
            isInQuarter(task.completedAt, year, quarter)
          ) {
            totalCompleted++;
            const daysOpen = getDaysOpen(task.startDate, task.createdAt);
            totalDaysToComplete += daysOpen;
            completedCount++;

            projectCompletedTasks.push({
              id: task.id,
              title: task.title,
              userStoryTitle: story.title,
              completedAt: task.completedAt,
              daysOpen,
            });
          }
        }
      }

      if (projectCompletedTasks.length > 0) {
        completedByProject.push({
          projectId: project.id,
          projectTitle: project.title,
          count: projectCompletedTasks.length,
          tasks: projectCompletedTasks,
        });
      }
    }

    const avgDaysToComplete = completedCount > 0 ? totalDaysToComplete / completedCount : 0;

    return {
      quarter,
      year,
      startDate: start,
      endDate: end,
      summary: {
        totalCompleted,
        totalActive,
        totalBlocked,
        avgDaysToComplete,
      },
      completedByProject,
      blockedTasks,
    };
  }
}

export const reportService = new ReportService();
