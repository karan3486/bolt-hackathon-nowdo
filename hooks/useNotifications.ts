import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Task } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationSettings {
  enabled: boolean;
  reminderMinutes: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - could navigate to specific task
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web');
      return null;
    }

    let token = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      setPermissionStatus(finalStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        setPermissionStatus(finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo push token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6750A4',
        sound: 'default',
      });
    }

    return token;
  };

  const scheduleTaskNotification = async (
    task: Task, 
    settings: NotificationSettings = {
      enabled: true,
      reminderMinutes: 30,
      soundEnabled: true,
      vibrationEnabled: true
    }
  ) => {
    if (Platform.OS === 'web' || !settings.enabled) {
      return null;
    }

    try {
      // Parse the scheduled date and time
      const taskDateTime = new Date(`${task.scheduledDate}T${task.scheduledTime}`);
      const notificationTime = new Date(taskDateTime.getTime() - (settings.reminderMinutes * 60 * 1000));
      const now = new Date();

      // Don't schedule notifications for past times or completed tasks
      if (notificationTime <= now || task.status === 'completed') {
        return null;
      }

      // Calculate time remaining until task starts
      const timeUntilTask = Math.round((taskDateTime.getTime() - notificationTime.getTime()) / (1000 * 60));
      
      // Format the scheduled time for display
      const timeString = taskDateTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${priorityEmoji} Task Reminder`,
          body: `"${task.title}" starts at ${timeString} (${timeUntilTask} minutes)`,
          data: { 
            taskId: task.id,
            taskTitle: task.title,
            scheduledTime: timeString,
            priority: task.priority
          },
          sound: settings.soundEnabled ? 'default' : false,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : false,
        },
        trigger: {
          date: notificationTime,
        },
      });

      console.log(`Scheduled notification for task "${task.title}" at ${notificationTime.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const cancelTaskNotification = async (notificationId: string) => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Cancelled notification:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const cancelAllTaskNotifications = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  };

  const scheduleMultipleTaskNotifications = async (
    tasks: Task[], 
    settings: NotificationSettings
  ) => {
    if (Platform.OS === 'web' || !settings.enabled) {
      return [];
    }

    const notificationIds: string[] = [];
    
    for (const task of tasks) {
      if (task.status !== 'completed') {
        const notificationId = await scheduleTaskNotification(task, settings);
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }
    }

    return notificationIds;
  };

  const getScheduledNotifications = async () => {
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return scheduledNotifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  return {
    expoPushToken,
    notification,
    permissionStatus,
    scheduleTaskNotification,
    cancelTaskNotification,
    cancelAllTaskNotifications,
    scheduleMultipleTaskNotifications,
    getScheduledNotifications,
    registerForPushNotificationsAsync,
  };
}