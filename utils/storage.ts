import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TASKS: '@nowdo/tasks',
  HABITS: '@nowdo/habits',
  HABIT_COMPLETIONS: '@nowdo/habit_completions',
  POMODORO_SESSIONS: '@nowdo/pomodoro_sessions',
  PREFERENCES: '@nowdo/preferences',
};

export const storage = {
  async save<T>(key: string, data: T): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      console.error('Storage save error:', error);
      throw error;
    }
  },

  async load<T>(key: string): Promise<T | null> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error('Storage load error:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },
};

export { STORAGE_KEYS };