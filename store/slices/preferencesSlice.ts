import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences } from '../../types';

const initialState: UserPreferences = {
  theme: 'system',
  notificationsEnabled: true,
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  firstLaunch: true,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      return { ...state, ...action.payload };
    },
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.firstLaunch = action.payload;
    },
  },
});

export const { updatePreferences, setFirstLaunch } = preferencesSlice.actions;
export default preferencesSlice.reducer;