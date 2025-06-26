import { configureStore } from '@reduxjs/toolkit';
import tasksSlice from './slices/tasksSlice';
import habitsSlice from './slices/habitsSlice';
import pomodoroSlice from './slices/pomodoroSlice';
import themeSlice from './slices/themeSlice';
import preferencesSlice from './slices/preferencesSlice';

export const store = configureStore({
  reducer: {
    tasks: tasksSlice,
    habits: habitsSlice,
    pomodoro: pomodoroSlice,
    theme: themeSlice,
    preferences: preferencesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'tasks/addTask',
          'tasks/updateTask',
          'habits/addHabit',
          'habits/toggleHabitCompletion',
          'pomodoro/startSession',
          'pomodoro/completeSession',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.startDate', 'payload.endDate', 'payload.date', 'payload.startTime', 'payload.endTime'],
        // Ignore these paths in the state
        ignoredPaths: [
          'tasks.tasks',
          'habits.habits',
          'habits.completions',
          'pomodoro.sessions',
          'pomodoro.currentSession',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;