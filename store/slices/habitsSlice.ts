import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Habit, HabitCompletion } from '../../types';

interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  loading: boolean;
  error: string | null;
  syncedWithDatabase: boolean;
}

const initialState: HabitsState = {
  habits: [
    {
      id: '1',
      title: 'Drink Water',
      description: 'Drink 8 glasses of water daily',
      category: 'Health',
      color: '#4FC3F7',
      targetDays: [1, 2, 3, 4, 5, 6, 7],
      createdAt: new Date().toISOString(),
      completions: [],
    },
    {
      id: '2',
      title: 'Exercise',
      description: '30 minutes of physical activity',
      category: 'Health',
      color: '#66BB6A',
      targetDays: [1, 3, 5],
      createdAt: new Date().toISOString(),
      completions: [],
    },
    {
      id: '3',
      title: 'Read',
      description: 'Read for 30 minutes',
      category: 'Personal',
      color: '#FF7043',
      targetDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      completions: [],
    },
  ],
  completions: [],
  loading: false,
  error: null,
  syncedWithDatabase: false,
};

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    addHabit: (state, action: PayloadAction<Omit<Habit, 'id' | 'createdAt' | 'completions'>>) => {
      const newHabit: Habit = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completions: [],
      };
      state.habits.push(newHabit);
    },
    updateHabit: (state, action: PayloadAction<Partial<Habit> & { id: string }>) => {
      const index = state.habits.findIndex(habit => habit.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = { ...state.habits[index], ...action.payload };
      }
    },
    deleteHabit: (state, action: PayloadAction<string>) => {
      state.habits = state.habits.filter(habit => habit.id !== action.payload);
      state.completions = state.completions.filter(completion => completion.habitId !== action.payload);
    },
    toggleHabitCompletion: (state, action: PayloadAction<{ habitId: string; date: Date | string }>) => {
      const { habitId, date } = action.payload;
      const dateString = date instanceof Date ? date.toISOString() : date;
      const dateForComparison = date instanceof Date ? date.toDateString() : new Date(date).toDateString();
      
      const existingCompletion = state.completions.find(
        completion => completion.habitId === habitId && 
        new Date(completion.date).toDateString() === dateForComparison
      );

      if (existingCompletion) {
        existingCompletion.completed = !existingCompletion.completed;
      } else {
        const newCompletion: HabitCompletion = {
          id: Date.now().toString(),
          habitId,
          date: dateString,
          completed: true,
        };
        state.completions.push(newCompletion);
      }
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
    loadHabitsFromDatabase: (state, action: PayloadAction<{ habits: Habit[]; completions: HabitCompletion[] }>) => {
      state.habits = action.payload.habits;
      state.completions = action.payload.completions;
      state.syncedWithDatabase = true;
    },
  },
});

export const {
  addHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  setLoading,
  setError,
  setSyncedWithDatabase,
  loadHabitsFromDatabase,
} = habitsSlice.actions;

export default habitsSlice.reducer;