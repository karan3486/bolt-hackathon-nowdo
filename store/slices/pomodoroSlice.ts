import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PomodoroSession, PomodoroSettings } from '../../types';

interface PomodoroState {
  sessions: PomodoroSession[];
  currentSession: PomodoroSession | null;
  settings: PomodoroSettings;
  isRunning: boolean;
  timeRemaining: number; // seconds
  currentSessionType: 'work' | 'break';
  sessionsCompleted: number;
  loading: boolean;
  error: string | null;
  syncedWithDatabase: boolean;
}

const initialState: PomodoroState = {
  sessions: [],
  currentSession: null,
  settings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  isRunning: false,
  timeRemaining: 25 * 60, // 25 minutes in seconds
  currentSessionType: 'work',
  sessionsCompleted: 0,
  loading: false,
  error: null,
  syncedWithDatabase: false,
};

const pomodoroSlice = createSlice({
  name: 'pomodoro',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<{ taskId?: string }>) => {
      const { taskId } = action.payload;
      const duration = state.currentSessionType === 'work' 
        ? state.settings.workDuration 
        : state.sessionsCompleted % state.settings.sessionsUntilLongBreak === 0
          ? state.settings.longBreakDuration
          : state.settings.shortBreakDuration;

      state.currentSession = {
        id: Date.now().toString(),
        taskId,
        startTime: new Date().toISOString(),
        duration,
        completed: false,
        type: state.currentSessionType,
      };
      state.isRunning = true;
      state.timeRemaining = duration * 60;
    },
    pauseSession: (state) => {
      state.isRunning = false;
    },
    resumeSession: (state) => {
      state.isRunning = true;
    },
    completeSession: (state) => {
      if (state.currentSession) {
        const completedSession = {
          ...state.currentSession,
          completed: true,
          endTime: new Date().toISOString(),
        };
        state.sessions.push(completedSession);
        
        if (state.currentSessionType === 'work') {
          state.sessionsCompleted += 1;
          state.currentSessionType = 'break';
        } else {
          state.currentSessionType = 'work';
        }
        
        state.currentSession = null;
        state.isRunning = false;
      }
    },
    resetSession: (state) => {
      state.currentSession = null;
      state.isRunning = false;
      state.timeRemaining = state.settings.workDuration * 60;
      state.currentSessionType = 'work';
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<PomodoroSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSyncedWithDatabase: (state, action: PayloadAction<boolean>) => {
      state.syncedWithDatabase = action.payload;
    },
    loadSessionsFromDatabase: (state, action: PayloadAction<PomodoroSession[]>) => {
      state.sessions = action.payload;
      state.syncedWithDatabase = true;
    },
  },
});

export const {
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  resetSession,
  updateTimeRemaining,
  updateSettings,
  setLoading,
  setError,
  setSyncedWithDatabase,
  loadSessionsFromDatabase,
} = pomodoroSlice.actions;

export default pomodoroSlice.reducer;