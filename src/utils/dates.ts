import {
  differenceInDays,
  format,
  formatDistanceToNow,
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

export function getQuarterRange(year: number, quarter: number): { start: Date; end: Date } {
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

export function isInQuarter(date: Date, year: number, quarter: number): boolean {
  const { start, end } = getQuarterRange(year, quarter);
  return isWithinInterval(date, { start, end });
}

export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return { year: now.getFullYear(), quarter };
}

export function formatQuarter(year: number, quarter: number): string {
  return `Q${quarter} ${year}`;
}
