import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Task } from '../../types';
import { taskCategoryColors, getTaskColor } from '../../constants/theme';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 40;
const DAY_SIZE = CALENDAR_WIDTH / 7;

export default function CalendarScreen() {
  const theme = useTheme();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const today = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateString = date.toDateString();
    return tasks.filter(task => {
      const taskDate = new Date(task.startDate);
      return taskDate.toDateString() === dateString && task.status !== 'completed';
    });
  };

  const getTaskDensity = (date: Date): number => {
    const tasksForDate = getTasksForDate(date);
    return Math.min(tasksForDate.length, 5); // Max 5 for color intensity
  };

  const getDensityColor = (density: number): string => {
    if (density === 0) return 'transparent';
    const alpha = Math.min(density * 0.2, 1);
    return `${theme.colors.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - firstDayOfWeek + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const density = isCurrentMonth ? getTaskDensity(date) : 0;

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayCell,
            {
              backgroundColor: isSelected ? theme.colors.primary : getDensityColor(density),
              borderColor: isToday ? theme.colors.primary : 'transparent',
            }
          ]}
          onPress={() => isCurrentMonth && setSelectedDate(date)}
          disabled={!isCurrentMonth}
        >
          <Text
            style={[
              styles.dayText,
              {
                color: isCurrentMonth
                  ? isSelected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
                fontWeight: isToday ? 'bold' : 'normal',
                opacity: isCurrentMonth ? 1 : 0.3,
              }
            ]}
          >
            {isCurrentMonth ? dayNumber : ''}
          </Text>
          {isCurrentMonth && density > 0 && !isSelected && (
            <View style={[styles.densityIndicator, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.densityText, { color: theme.colors.onPrimary }]}>
                {density}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderSelectedDateTasks = () => {
    const tasksForDate = getTasksForDate(selectedDate);
    
    if (tasksForDate.length === 0) {
      return (
        <Text style={[styles.noTasksText, { color: theme.colors.onSurfaceVariant }]}>
          No tasks scheduled for this day
        </Text>
      );
    }

    return tasksForDate.map((task) => (
      <Card key={task.id} style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.taskContent}>
          <View style={[styles.taskColorIndicator, { backgroundColor: getTaskColor(task) }]} />
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTitle, { color: theme.colors.onSurface }]}>
              {task.title}
            </Text>
          </View>
          {task.description && (
            <Text style={[styles.taskDescription, { color: theme.colors.onSurfaceVariant }]}>
              {task.description}
            </Text>
          )}
          <View style={styles.taskMeta}>
            <Text style={[styles.taskDuration, { color: theme.colors.onSurfaceVariant }]}>
              {task.duration} minutes
            </Text>
            <Text style={[styles.taskPriority, { color: theme.colors.onSurfaceVariant }]}>
              {task.priority} priority
            </Text>
          </View>
        </Card.Content>
      </Card>
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <ChevronLeft size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={[styles.monthYear, { color: theme.colors.onBackground }]}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
            </View>
            
            <TouchableOpacity onPress={() => navigateMonth('next')}>
              <ChevronRight size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'month' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setViewMode('month')}
            >
              <Text
                style={[
                  styles.viewModeText,
                  {
                    color: viewMode === 'month' ? theme.colors.onPrimary : theme.colors.onSurface
                  }
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'week' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text
                style={[
                  styles.viewModeText,
                  {
                    color: viewMode === 'week' ? theme.colors.onPrimary : theme.colors.onSurface
                  }
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <Card style={[styles.calendarCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.calendarContent}>
            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {dayNames.map((day) => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={[styles.dayHeaderText, { color: theme.colors.onSurfaceVariant }]}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
            </View>
          </Card.Content>
        </Card>

        {/* Legend */}
        <Card style={[styles.legendCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.legendTitle, { color: theme.colors.onSurface }]}>
              Task Density Legend
            </Text>
            <View style={styles.legendItems}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View key={level} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: getDensityColor(level) }
                    ]}
                  />
                  <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                    {level}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Selected Date Tasks */}
        <View style={styles.selectedDateSection}>
          <Text style={[styles.selectedDateTitle, { color: theme.colors.onBackground }]}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          <View style={styles.tasksContainer}>
            {renderSelectedDateTasks()}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  calendarContent: {
    padding: 16,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    width: DAY_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  densityIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  densityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  legendCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
  },
  selectedDateSection: {
    padding: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tasksContainer: {
    gap: 12,
  },
  noTasksText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 32,
  },
  taskCard: {
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  taskContent: {
    padding: 16,
    position: 'relative',
  },
  taskColorIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  taskHeader: {
    marginBottom: 8,
    paddingLeft: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
  },
  taskDuration: {
    fontSize: 12,
  },
  taskPriority: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});