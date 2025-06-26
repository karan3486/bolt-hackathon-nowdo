export type TaskCategory = 'work' | 'personal' | 'health' | 'education';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  startDate: string; // ISO string instead of Date
  endDate: string; // ISO string instead of Date
  scheduledDate: string; // Date string (YYYY-MM-DD)
  scheduledTime: string; // Time string (HH:MM:SS)
  status: TaskStatus;
  createdAt: string; // ISO string instead of Date
  updatedAt: string; // ISO string instead of Date
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  targetDays: number[];
  createdAt: string; // ISO string instead of Date
  completions: HabitCompletion[];
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // ISO string instead of Date
  completed: boolean;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startTime: string; // ISO string instead of Date
  endTime?: string; // ISO string instead of Date
  duration: number; // minutes
  completed: boolean;
  type: 'work' | 'break';
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
}

export interface Quote {
  text: string;
  author: string;
  category: string;
}

export interface SuggestionCard {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  estimatedTime: number; // minutes
}

export interface DashboardStats {
  tasksCompleted: number;
  totalTasks: number;
  pomodoroSessions: number;
  habitStreak: number;
  productivityScore: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  pomodoroSettings: PomodoroSettings;
  firstLaunch: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  location?: string;
  profession?: string;
  createdAt: string;
  updatedAt: string;
}

export type MatrixQuadrant = 'high-priority' | 'medium-priority' | 'low-priority' | 'dont-do';

export interface TaskSyncConfig {
  autoSync: boolean;
  syncInterval: number;
  lastSyncTime: string;
}