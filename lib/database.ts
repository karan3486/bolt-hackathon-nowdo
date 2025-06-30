import { supabase } from './supabase';
import { Task, Habit, HabitCompletion, PomodoroSession, UserPreferences, UserProfile } from '../types';

// Database service for user-specific data operations
export class DatabaseService {
  // Task operations
  static async getTasks(userId: string, options?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    scheduledDate?: string;
  }) {
    let query = supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options?.priority && options.priority !== 'all') {
      query = query.eq('priority', options.priority);
    }
    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }
    if (options?.scheduledDate) {
      query = query.eq('scheduled_date', options.scheduledDate);
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'scheduled_time';
    const sortOrder = options?.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }

  static async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('user_tasks')
      .insert({
        user_id: userId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        start_date: task.startDate,
        end_date: task.endDate,
        scheduled_date: task.scheduledDate,
        scheduled_time: task.scheduledTime,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data;
  }

  static async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('user_tasks')
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category && { category: updates.category }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.status && { status: updates.status }),
        ...(updates.startDate && { start_date: updates.startDate }),
        ...(updates.endDate && { end_date: updates.endDate }),
        ...(updates.scheduledDate && { scheduled_date: updates.scheduledDate }),
        ...(updates.scheduledTime && { scheduled_time: updates.scheduledTime }),
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return data;
  }

  static async deleteTask(userId: string, taskId: string) {
    const { error } = await supabase
      .from('user_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting task:', error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }

    return true;
  }

  // Habit operations
  static async getHabits(userId: string) {
    const { data, error } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      throw new Error(`Failed to fetch habits: ${error.message}`);
    }

    return data || [];
  }

  static async createHabit(userId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) {
    const { data, error } = await supabase
      .from('user_habits')
      .insert({
        user_id: userId,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        color: habit.color,
        target_days: habit.targetDays,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      throw new Error(`Failed to create habit: ${error.message}`);
    }

    return data;
  }

  static async updateHabit(userId: string, habitId: string, updates: Partial<Habit>) {
    const { data, error } = await supabase
      .from('user_habits')
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category && { category: updates.category }),
        ...(updates.color && { color: updates.color }),
        ...(updates.targetDays && { target_days: updates.targetDays }),
      })
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit:', error);
      throw new Error(`Failed to update habit: ${error.message}`);
    }

    return data;
  }

  static async deleteHabit(userId: string, habitId: string) {
    const { error } = await supabase
      .from('user_habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting habit:', error);
      throw new Error(`Failed to delete habit: ${error.message}`);
    }

    return true;
  }

  // Habit completion operations
  static async getHabitCompletions(userId: string, habitId?: string, dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('user_habit_completions')
      .select('*')
      .eq('user_id', userId);

    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    if (dateRange) {
      query = query
        .gte('completion_date', dateRange.start)
        .lte('completion_date', dateRange.end);
    }

    query = query.order('completion_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching habit completions:', error);
      throw new Error(`Failed to fetch habit completions: ${error.message}`);
    }

    return data || [];
  }

  static async toggleHabitCompletion(userId: string, habitId: string, date: string) {
    // First check if completion exists
    const { data: existing } = await supabase
      .from('user_habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('completion_date', date)
      .maybeSingle();

    if (existing) {
      // Update existing completion
      const { data, error } = await supabase
        .from('user_habit_completions')
        .update({ completed: !existing.completed })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating habit completion:', error);
        throw new Error(`Failed to update habit completion: ${error.message}`);
      }

      return data;
    } else {
      // Create new completion
      const { data, error } = await supabase
        .from('user_habit_completions')
        .insert({
          user_id: userId,
          habit_id: habitId,
          completion_date: date,
          completed: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating habit completion:', error);
        throw new Error(`Failed to create habit completion: ${error.message}`);
      }

      return data;
    }
  }

  // Pomodoro session operations
  static async getPomodoroSessions(userId: string, options?: {
    limit?: number;
    offset?: number;
    dateRange?: { start: string; end: string };
  }) {
    let query = supabase
      .from('user_pomodoro_sessions')
      .select('*')
      .eq('user_id', userId);

    if (options?.dateRange) {
      query = query
        .gte('start_time', options.dateRange.start)
        .lte('start_time', options.dateRange.end);
    }

    query = query.order('start_time', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pomodoro sessions:', error);
      throw new Error(`Failed to fetch pomodoro sessions: ${error.message}`);
    }

    return data || [];
  }

  static async createPomodoroSession(userId: string, session: Omit<PomodoroSession, 'id'>) {
    const { data, error } = await supabase
      .from('user_pomodoro_sessions')
      .insert({
        user_id: userId,
        task_id: session.taskId,
        session_type: session.type,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed: session.completed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pomodoro session:', error);
      throw new Error(`Failed to create pomodoro session: ${error.message}`);
    }

    return data;
  }

  static async updatePomodoroSession(userId: string, sessionId: string, updates: Partial<PomodoroSession>) {
    const { data, error } = await supabase
      .from('user_pomodoro_sessions')
      .update({
        ...(updates.endTime && { end_time: updates.endTime }),
        ...(updates.completed !== undefined && { completed: updates.completed }),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pomodoro session:', error);
      throw new Error(`Failed to update pomodoro session: ${error.message}`);
    }

    return data;
  }

  // User preferences operations
  static async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    // If no preferences exist, create default ones
    if (!data) {
      return await this.createUserPreferences(userId);
    }

    return data;
  }

  static async createUserPreferences(userId: string, preferences?: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        theme: preferences?.theme || 'system',
        notifications_enabled: preferences?.notificationsEnabled ?? true,
        work_duration: preferences?.pomodoroSettings?.workDuration || 25,
        short_break_duration: preferences?.pomodoroSettings?.shortBreakDuration || 5,
        long_break_duration: preferences?.pomodoroSettings?.longBreakDuration || 15,
        sessions_until_long_break: preferences?.pomodoroSettings?.sessionsUntilLongBreak || 4,
        first_launch: preferences?.firstLaunch ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user preferences:', error);
      throw new Error(`Failed to create user preferences: ${error.message}`);
    }

    return data;
  }

  static async updateUserPreferences(userId: string, updates: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...(updates.theme && { theme: updates.theme }),
        ...(updates.notificationsEnabled !== undefined && { notifications_enabled: updates.notificationsEnabled }),
        ...(updates.pomodoroSettings?.workDuration && { work_duration: updates.pomodoroSettings.workDuration }),
        ...(updates.pomodoroSettings?.shortBreakDuration && { short_break_duration: updates.pomodoroSettings.shortBreakDuration }),
        ...(updates.pomodoroSettings?.longBreakDuration && { long_break_duration: updates.pomodoroSettings.longBreakDuration }),
        ...(updates.pomodoroSettings?.sessionsUntilLongBreak && { sessions_until_long_break: updates.pomodoroSettings.sessionsUntilLongBreak }),
        ...(updates.firstLaunch !== undefined && { first_launch: updates.firstLaunch }),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return data;
  }

  // User profile operations
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    // Return the first profile if it exists, otherwise null
    return data && data.length > 0 ? data[0] : null;
  }

  static async createUserProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        profile_picture_url: profile.profilePictureUrl,
        phone_number: profile.phoneNumber,
        date_of_birth: profile.dateOfBirth,
        location: profile.location,
        profession: profile.profession,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...(updates.firstName !== undefined && { first_name: updates.firstName }),
        ...(updates.lastName !== undefined && { last_name: updates.lastName }),
        ...(updates.email !== undefined && { email: updates.email }),
        ...(updates.profilePictureUrl !== undefined && { profile_picture_url: updates.profilePictureUrl }),
        ...(updates.phoneNumber !== undefined && { phone_number: updates.phoneNumber }),
        ...(updates.dateOfBirth !== undefined && { date_of_birth: updates.dateOfBirth }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.profession !== undefined && { profession: updates.profession }),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
  }

  static async uploadProfilePicture(userId: string, file: File | any) {
    console.log('DatabaseService.uploadProfilePicture - User ID:', userId);
    console.log('DatabaseService.uploadProfilePicture - File:', file.name, file.size, file.type);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
  
    // Handle both regular File objects and custom file objects with blob data
    const fileData = file._blob ? file._blob : file;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, fileData);

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      console.error('Error uploading profile picture:', uploadError);
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    console.log('Upload successful - Public URL:', data.publicUrl);
    
    return data.publicUrl;
  }

  static async deleteProfilePicture(userId: string, pictureUrl: string) {
    // Extract file path from URL
    const urlParts = pictureUrl.split('/profile-pictures/');
    const filePath = urlParts[1]; // Get the full path after bucket name

    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting profile picture:', error);
      throw new Error(`Failed to delete profile picture: ${error.message}`);
    }

    return true;
  }

  // User settings operations
  static async getUserSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user settings:', error);
      throw new Error(`Failed to fetch user settings: ${error.message}`);
    }

    // If no settings exist, create default ones
    if (!data) {
      return await this.createUserSettings(userId);
    }

    return data;
  }

  static async createUserSettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          theme_preference: 'dark',
          notifications_enabled: true,
          email_notifications: true,
          push_notifications: true,
          language: 'en',
          privacy_analytics: true,
          privacy_crash_reports: true,
          auto_backup: true,
          sound_effects: true,
          haptic_feedback: true,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user settings:', error);
        throw new Error(`Failed to create user settings: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Database error in createUserSettings:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async updateUserSettings(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      throw new Error(`Failed to update user settings: ${error.message}`);
    }

    return data;
  }

  // Data management operations
  static async clearUserData(userId: string) {
    const { data, error } = await supabase.rpc('clear_user_data', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error clearing user data:', error);
      throw new Error(`Failed to clear user data: ${error.message}`);
    }

    return data;
  }

  static async getUserDataSummary(userId: string) {
    const { data, error } = await supabase.rpc('get_user_data_summary', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user data summary:', error);
      throw new Error(`Failed to fetch user data summary: ${error.message}`);
    }

    return data;
  }

  // Search operations
  static async searchTasks(userId: string, query: string, options?: {
    category?: string;
    priority?: string;
    status?: string;
    limit?: number;
  }) {
    let dbQuery = supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (options?.category && options.category !== 'all') {
      dbQuery = dbQuery.eq('category', options.category);
    }
    if (options?.priority && options.priority !== 'all') {
      dbQuery = dbQuery.eq('priority', options.priority);
    }
    if (options?.status && options.status !== 'all') {
      dbQuery = dbQuery.eq('status', options.status);
    }

    dbQuery = dbQuery
      .order('updated_at', { ascending: false })
      .limit(options?.limit || 20);

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error searching tasks:', error);
      throw new Error(`Failed to search tasks: ${error.message}`);
    }

    return data || [];
  }

  static async searchHabits(userId: string, query: string) {
    const { data, error } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching habits:', error);
      throw new Error(`Failed to search habits: ${error.message}`);
    }

    return data || [];
  }
}