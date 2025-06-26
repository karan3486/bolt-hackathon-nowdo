import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F0F7',
    background: '#FEFBFF',
    error: '#BA1A1A',
    success: '#4CAF50',
    warning: '#FF9800',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    onBackground: '#1C1B1F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onError: '#FFFFFF',
    elevation: {
      level0: 'transparent',
      level1: '#F7F2FA',
      level2: '#F1ECF4',
      level3: '#ECE6F0',
      level4: '#E9E3ED',
      level5: '#E6E0E9',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    tertiary: '#EFB8C8',
    surface: '#1C1B1F',
    surfaceVariant: '#49454F',
    background: '#141218',
    error: '#F2B8B5',
    success: '#81C784',
    warning: '#FFB74D',
    outline: '#938F99',
    outlineVariant: '#49454F',
    onSurface: '#E6E1E5',
    onSurfaceVariant: '#CAC4D0',
    onBackground: '#E6E1E5',
    onPrimary: '#371E73',
    onSecondary: '#332D41',
    onTertiary: '#492532',
    onError: '#601410',
    elevation: {
      level0: 'transparent',
      level1: '#22212A',
      level2: '#28272F',
      level3: '#2E2D36',
      level4: '#30303A',
      level5: '#33323C',
    },
  },
};

export const taskCategoryColors = {
  work: '#2196F3',
  personal: '#4CAF50',
  health: '#FF9800',
  education: '#9C27B0',
};

export const priorityColors = {
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50',
};

export const matrixQuadrantColors = {
  'high-priority': '#F44336',    // Red - Urgent & Important
  'medium-priority': '#FF9800',  // Orange - Important but Not Urgent
  'low-priority': '#4CAF50',     // Green - Urgent but Not Important
  'dont-do': '#9E9E9E',         // Gray - Neither Urgent nor Important
};

export const getTaskColor = (task: Task): string => {
  // Priority-based coloring for consistency across views
  if (task.priority === 'high' && (task.category === 'work' || task.category === 'education')) {
    return matrixQuadrantColors['high-priority'];
  }
  if (task.priority === 'medium' && (task.category === 'work' || task.category === 'education')) {
    return matrixQuadrantColors['medium-priority'];
  }
  if (task.priority === 'low' || (task.priority === 'high' && task.category === 'personal')) {
    return matrixQuadrantColors['low-priority'];
  }
  if (task.priority === 'low' && task.category === 'personal') {
    return matrixQuadrantColors['dont-do'];
  }
  return priorityColors[task.priority];
};