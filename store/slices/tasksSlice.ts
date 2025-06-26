import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskPriority } from '../../types';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    category: string | 'all';
    dateFilter: 'today' | 'past' | 'all';
  };
  searchQuery: string;
  syncedWithDatabase: boolean;
}

const initialState: TasksState = {
  tasks: [
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Finalize the Q3 project proposal for client review',
      category: 'work',
      priority: 'high',
      status: 'pending',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Review team performance',
      description: 'Quarterly performance review for development team',
      category: 'work',
      priority: 'medium',
      status: 'pending',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '14:00:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Organize desk workspace',
      description: 'Clean and organize home office desk',
      category: 'personal',
      priority: 'low',
      status: 'pending',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '16:00:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Social media scrolling',
      description: 'Mindless browsing on social platforms',
      category: 'personal',
      priority: 'low',
      status: 'pending',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '20:00:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  loading: false,
  error: null,
  filter: {
    status: 'all',
    priority: 'all',
    category: 'all',
    dateFilter: 'today',
  },
  searchQuery: '',
  syncedWithDatabase: false,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      const newTask: Task = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        // Convert Date objects to ISO strings
        startDate: action.payload.startDate instanceof Date 
          ? action.payload.startDate.toISOString() 
          : action.payload.startDate,
        endDate: action.payload.endDate instanceof Date 
          ? action.payload.endDate.toISOString() 
          : action.payload.endDate,
        scheduledDate: action.payload.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: action.payload.scheduledTime || '09:00:00',
      };
      state.tasks.push(newTask);
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        const updatedTask = {
          ...state.tasks[index],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        
        // Convert Date objects to ISO strings if present
        if (action.payload.startDate instanceof Date) {
          updatedTask.startDate = action.payload.startDate.toISOString();
        }
        if (action.payload.endDate instanceof Date) {
          updatedTask.endDate = action.payload.endDate.toISOString();
        }
        
        state.tasks[index] = updatedTask;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
    toggleTaskStatus: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        task.updatedAt = new Date().toISOString();
      }
    },
    reorderTasks: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      const [movedTask] = state.tasks.splice(fromIndex, 1);
      state.tasks.splice(toIndex, 0, movedTask);
    },
    setFilter: (state, action: PayloadAction<Partial<TasksState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
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
    loadTasksFromDatabase: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.syncedWithDatabase = true;
    },
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  reorderTasks,
  setFilter,
  setSearchQuery,
  setLoading,
  setError,
  setSyncedWithDatabase,
  loadTasksFromDatabase,
} = tasksSlice.actions;

export default tasksSlice.reducer;