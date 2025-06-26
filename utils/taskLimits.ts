import { Task } from '../types';

export const TASK_LIMITS = {
  FREE_DAILY_LIMIT: 5,
  PREMIUM_DAILY_LIMIT: -1, // -1 means unlimited
};

export function getTodaysTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(task => task.scheduledDate === today);
}

export function canCreateTask(tasks: Task[], isPremium: boolean): {
  canCreate: boolean;
  currentCount: number;
  limit: number;
  message?: string;
} {
  const todaysTasks = getTodaysTasks(tasks);
  const currentCount = todaysTasks.length;

  if (isPremium) {
    return {
      canCreate: true,
      currentCount,
      limit: TASK_LIMITS.PREMIUM_DAILY_LIMIT,
    };
  }

  const limit = TASK_LIMITS.FREE_DAILY_LIMIT;
  const canCreate = currentCount < limit;

  return {
    canCreate,
    currentCount,
    limit,
    message: canCreate 
      ? undefined 
      : `You've reached your daily limit of ${limit} tasks. Upgrade to Premium for unlimited tasks.`,
  };
}

export function getTaskLimitMessage(currentCount: number, limit: number, isPremium: boolean): string {
  if (isPremium) {
    return `${currentCount} tasks today • Unlimited`;
  }

  const remaining = Math.max(0, limit - currentCount);
  if (remaining === 0) {
    return `${currentCount}/${limit} tasks today • Limit reached`;
  }

  return `${currentCount}/${limit} tasks today • ${remaining} remaining`;
}