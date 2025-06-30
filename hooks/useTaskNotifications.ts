import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNotifications } from './useNotifications';
import { Task } from '../types';
import { NotificationSettings } from '../components/NotificationSettings';

export function useTaskNotifications() {
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const { 
    scheduleTaskNotification, 
    cancelAllTaskNotifications, 
    scheduleMultipleTaskNotifications 
  } = useNotifications();

  const scheduleNotificationsForTasks = useCallback(async (
    tasksToSchedule: Task[], 
    settings: NotificationSettings
  ) => {
    if (!settings.enabled) {
      return;
    }

    // Cancel all existing notifications first to avoid duplicates
    await cancelAllTaskNotifications();

    // Filter tasks that need notifications (not completed, in the future)
    const now = new Date();
    const validTasks = tasksToSchedule.filter(task => {
      if (task.status === 'completed') return false;
      
      const taskDateTime = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
      const notificationTime = new Date(taskDateTime.getTime() - (settings.reminderMinutes * 60 * 1000));
      
      return notificationTime > now;
    });

    // Schedule notifications for valid tasks
    if (validTasks.length > 0) {
      await scheduleMultipleTaskNotifications(validTasks, settings);
      console.log(`Scheduled notifications for ${validTasks.length} tasks`);
    }
  }, [cancelAllTaskNotifications, scheduleMultipleTaskNotifications]);

  const scheduleNotificationForSingleTask = useCallback(async (
    task: Task, 
    settings: NotificationSettings
  ) => {
    if (!settings.enabled || task.status === 'completed') {
      return;
    }

    const notificationId = await scheduleTaskNotification(task, settings);
    if (notificationId) {
      console.log(`Scheduled notification for task: ${task.title}`);
    }
  }, [scheduleTaskNotification]);

  return {
    scheduleNotificationsForTasks,
    scheduleNotificationForSingleTask,
  };
}