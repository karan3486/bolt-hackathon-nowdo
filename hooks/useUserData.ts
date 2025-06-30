import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../lib/database';
import { useAuth } from './useAuth';
import { Task, Habit, HabitCompletion, PomodoroSession, UserPreferences, UserProfile } from '../types';

interface UseUserDataOptions {
  autoLoad?: boolean;
  refreshInterval?: number;
}

interface UserDataState {
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  pomodoroSessions: PomodoroSession[];
  preferences: UserPreferences | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useUserData(options: UseUserDataOptions = {}) {
  const { user } = useAuth();
  const { autoLoad = true, refreshInterval } = options;

  const [state, setState] = useState<UserDataState>({
    tasks: [],
    habits: [],
    habitCompletions: [],
    pomodoroSessions: [],
    preferences: null,
    profile: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Load all user data
  const loadUserData = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [tasks, habits, habitCompletions, pomodoroSessions, preferences, profile] = await Promise.all([
        DatabaseService.getTasks(user.id),
        DatabaseService.getHabits(user.id),
        DatabaseService.getHabitCompletions(user.id),
        DatabaseService.getPomodoroSessions(user.id, { limit: 100 }),
        DatabaseService.getUserPreferences(user.id),
        DatabaseService.getUserProfile(user.id),
      ]);

      setState(prev => ({
        ...prev,
        tasks: tasks.map(transformTaskFromDB),
        habits: habits.map(transformHabitFromDB),
        habitCompletions: habitCompletions.map(transformHabitCompletionFromDB),
        pomodoroSessions: pomodoroSessions.map(transformPomodoroSessionFromDB),
        preferences: transformPreferencesFromDB(preferences),
        profile: profile ? transformProfileFromDB(profile) : null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, setLoading, setError]);

  // Load profile data specifically
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await DatabaseService.getUserProfile(user.id);
      setState(prev => ({
        ...prev,
        profile: profile ? transformProfileFromDB(profile) : null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, setLoading, setError]);

  // Task operations
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const newTask = await DatabaseService.createTask(user.id, taskData);
      const transformedTask = transformTaskFromDB(newTask);
      
      setState(prev => ({
        ...prev,
        tasks: [transformedTask, ...prev.tasks],
        lastUpdated: new Date(),
      }));

      return transformedTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [user?.id]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const updatedTask = await DatabaseService.updateTask(user.id, taskId, updates);
      const transformedTask = transformTaskFromDB(updatedTask);
      
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === taskId ? transformedTask : task),
        lastUpdated: new Date(),
      }));

      return transformedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [user?.id]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      await DatabaseService.deleteTask(user.id, taskId);
      
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== taskId),
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [user?.id]);

  // Habit operations
  const createHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const newHabit = await DatabaseService.createHabit(user.id, habitData);
      const transformedHabit = transformHabitFromDB(newHabit);
      
      setState(prev => ({
        ...prev,
        habits: [transformedHabit, ...prev.habits],
        lastUpdated: new Date(),
      }));

      return transformedHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }, [user?.id]);

  const updateHabit = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const updatedHabit = await DatabaseService.updateHabit(user.id, habitId, updates);
      const transformedHabit = transformHabitFromDB(updatedHabit);
      
      setState(prev => ({
        ...prev,
        habits: prev.habits.map(habit => habit.id === habitId ? transformedHabit : habit),
        lastUpdated: new Date(),
      }));

      return transformedHabit;
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }, [user?.id]);

  const deleteHabit = useCallback(async (habitId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      await DatabaseService.deleteHabit(user.id, habitId);
      
      setState(prev => ({
        ...prev,
        habits: prev.habits.filter(habit => habit.id !== habitId),
        habitCompletions: prev.habitCompletions.filter(completion => completion.habitId !== habitId),
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }, [user?.id]);

  const toggleHabitCompletion = useCallback(async (habitId: string, date: Date) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const dateString = date.toISOString().split('T')[0];
      const completion = await DatabaseService.toggleHabitCompletion(user.id, habitId, dateString);
      const transformedCompletion = transformHabitCompletionFromDB(completion);
      
      setState(prev => {
        const existingIndex = prev.habitCompletions.findIndex(
          c => c.habitId === habitId && c.date === transformedCompletion.date
        );

        let newCompletions;
        if (existingIndex >= 0) {
          newCompletions = [...prev.habitCompletions];
          newCompletions[existingIndex] = transformedCompletion;
        } else {
          newCompletions = [transformedCompletion, ...prev.habitCompletions];
        }

        return {
          ...prev,
          habitCompletions: newCompletions,
          lastUpdated: new Date(),
        };
      });

      return transformedCompletion;
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      throw error;
    }
  }, [user?.id]);

  // Pomodoro session operations
  const createPomodoroSession = useCallback(async (sessionData: Omit<PomodoroSession, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const newSession = await DatabaseService.createPomodoroSession(user.id, sessionData);
      const transformedSession = transformPomodoroSessionFromDB(newSession);
      
      setState(prev => ({
        ...prev,
        pomodoroSessions: [transformedSession, ...prev.pomodoroSessions],
        lastUpdated: new Date(),
      }));

      return transformedSession;
    } catch (error) {
      console.error('Error creating pomodoro session:', error);
      throw error;
    }
  }, [user?.id]);

  const updatePomodoroSession = useCallback(async (sessionId: string, updates: Partial<PomodoroSession>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const updatedSession = await DatabaseService.updatePomodoroSession(user.id, sessionId, updates);
      const transformedSession = transformPomodoroSessionFromDB(updatedSession);
      
      setState(prev => ({
        ...prev,
        pomodoroSessions: prev.pomodoroSessions.map(session => 
          session.id === sessionId ? transformedSession : session
        ),
        lastUpdated: new Date(),
      }));

      return transformedSession;
    } catch (error) {
      console.error('Error updating pomodoro session:', error);
      throw error;
    }
  }, [user?.id]);

  // Preferences operations
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const updatedPreferences = await DatabaseService.updateUserPreferences(user.id, updates);
      const transformedPreferences = transformPreferencesFromDB(updatedPreferences);
      
      setState(prev => ({
        ...prev,
        preferences: transformedPreferences,
        lastUpdated: new Date(),
      }));

      return transformedPreferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }, [user?.id]);

  // Profile operations
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const updatedProfile = await DatabaseService.updateUserProfile(user.id, updates);
      const transformedProfile = transformProfileFromDB(updatedProfile);
      
      setState(prev => ({
        ...prev,
        profile: transformedProfile,
        lastUpdated: new Date(),
      }));

      return transformedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [user?.id]);
  
  const uploadProfilePicture = useCallback(async (file: File | any) => {
    if (!user?.id) throw new Error('User not authenticated');

    console.log('Upload profile picture - User ID:', user.id);
    console.log('Upload profile picture - File:', file.name, file.size);
    console.log('Upload profile picture - File type:', typeof file, file._blob ? 'Has blob data' : 'Standard file');
    
    setLoading(true);
    
    try {
      const pictureUrl = await DatabaseService.uploadProfilePicture(user.id, file);
      
      // Update profile with new picture URL
      const updatedProfile = await DatabaseService.updateUserProfile(user.id, { 
        profilePictureUrl: pictureUrl 
      });
      const transformedProfile = transformProfileFromDB(updatedProfile);
      
      setState(prev => ({
        ...prev,
        profile: transformedProfile,
        lastUpdated: new Date(),
      }));

      return pictureUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload profile picture');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const removeProfilePicture = useCallback(async () => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!state.profile?.profilePictureUrl) return;

    try {
      await DatabaseService.deleteProfilePicture(user.id, state.profile.profilePictureUrl);
      
      // Update profile to remove picture URL
      const updatedProfile = await DatabaseService.updateUserProfile(user.id, { 
        profilePictureUrl: null 
      });
      const transformedProfile = transformProfileFromDB(updatedProfile);
      
      setState(prev => ({
        ...prev,
        profile: transformedProfile,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error removing profile picture:', error);
      throw error;
    }
  }, [user?.id, state.profile?.profilePictureUrl]);

  // Data management operations
  const clearAllData = useCallback(async () => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const result = await DatabaseService.clearUserData(user.id);
      
      // Reset state to empty
      setState(prev => ({
        ...prev,
        tasks: [],
        habits: [],
        habitCompletions: [],
        pomodoroSessions: [],
        lastUpdated: new Date(),
      }));

      // Reload preferences (they get reset to defaults)
      const preferences = await DatabaseService.getUserPreferences(user.id);
      setState(prev => ({
        ...prev,
        preferences: transformPreferencesFromDB(preferences),
      }));

      return result;
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }, [user?.id]);

  const getDataSummary = useCallback(async () => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      return await DatabaseService.getUserDataSummary(user.id);
    } catch (error) {
      console.error('Error getting data summary:', error);
      throw error;
    }
  }, [user?.id]);

  // Search operations
  const searchTasks = useCallback(async (query: string, options?: any) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const results = await DatabaseService.searchTasks(user.id, query, options);
      return results.map(transformTaskFromDB);
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw error;
    }
  }, [user?.id]);

  const searchHabits = useCallback(async (query: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const results = await DatabaseService.searchHabits(user.id, query);
      return results.map(transformHabitFromDB);
    } catch (error) {
      console.error('Error searching habits:', error);
      throw error;
    }
  }, [user?.id]);

  // Auto-load data when user changes
  useEffect(() => {
    if (autoLoad && user?.id) {
      loadUserData();
    }
  }, [autoLoad, user?.id, loadUserData]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && user?.id) {
      const interval = setInterval(loadUserData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, user?.id, loadUserData]);

  return {
    ...state,
    // Data loading
    loadUserData,
    loadProfile,
    refresh: loadUserData,
    
    // Task operations
    createTask,
    updateTask,
    deleteTask,
    searchTasks,
    
    // Habit operations
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    searchHabits,
    
    // Pomodoro operations
    createPomodoroSession,
    updatePomodoroSession,
    
    // Preferences
    updatePreferences,
    
    // Profile operations
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    
    // Data management
    clearAllData,
    getDataSummary,
  };
}

// Transform functions to convert database format to app format
function transformTaskFromDB(dbTask: any): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    category: dbTask.category,
    priority: dbTask.priority,
    status: dbTask.status,
    startDate: dbTask.start_date,
    endDate: dbTask.end_date,
    scheduledDate: dbTask.scheduled_date,
    scheduledTime: dbTask.scheduled_time,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}

function transformHabitFromDB(dbHabit: any): Habit {
  return {
    id: dbHabit.id,
    title: dbHabit.title,
    description: dbHabit.description,
    category: dbHabit.category,
    color: dbHabit.color,
    targetDays: dbHabit.target_days,
    createdAt: dbHabit.created_at,
    completions: [], // Loaded separately
  };
}

function transformHabitCompletionFromDB(dbCompletion: any): HabitCompletion {
  return {
    id: dbCompletion.id,
    habitId: dbCompletion.habit_id,
    date: dbCompletion.completion_date,
    completed: dbCompletion.completed,
  };
}

function transformPomodoroSessionFromDB(dbSession: any): PomodoroSession {
  return {
    id: dbSession.id,
    taskId: dbSession.task_id,
    startTime: dbSession.start_time,
    endTime: dbSession.end_time,
    duration: dbSession.duration,
    completed: dbSession.completed,
    type: dbSession.session_type,
  };
}

function transformPreferencesFromDB(dbPreferences: any): UserPreferences {
  return {
    theme: dbPreferences.theme,
    notificationsEnabled: dbPreferences.notifications_enabled,
    pomodoroSettings: {
      workDuration: dbPreferences.work_duration,
      shortBreakDuration: dbPreferences.short_break_duration,
      longBreakDuration: dbPreferences.long_break_duration,
      sessionsUntilLongBreak: dbPreferences.sessions_until_long_break,
    },
    firstLaunch: dbPreferences.first_launch,
  };
}

function transformProfileFromDB(dbProfile: any): UserProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    email: dbProfile.email,
    profilePictureUrl: dbProfile.profile_picture_url,
    phoneNumber: dbProfile.phone_number,
    dateOfBirth: dbProfile.date_of_birth,
    location: dbProfile.location,
    profession: dbProfile.profession,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}