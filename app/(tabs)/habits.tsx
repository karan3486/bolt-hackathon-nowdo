import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  FAB,
  useTheme,
  Portal,
  Modal,
  TextInput,
  Button,
  Chip,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useUserData } from '../../hooks/useUserData';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import { addHabit, toggleHabitCompletion } from '../../store/slices/habitsSlice';
import { Habit } from '../../types';
import { Plus, Check, Flame, Target, Calendar, TrendingUp, Award, Zap, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HabitsScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAuthMessages();
  
  const { habits, completions } = useSelector((state: RootState) => state.habits);
  const { 
    createHabit: createHabitInDB, 
    toggleHabitCompletion: toggleHabitCompletionInDB,
    loading: dbLoading 
  } = useUserData();
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Health',
    color: '#4FC3F7',
  });

  const colors = [
    '#4FC3F7', '#66BB6A', '#FF7043', '#AB47BC', 
    '#FFA726', '#26A69A', '#EF5350', '#42A5F5'
  ];

  const categories = ['Health', 'Personal', 'Work', 'Learning', 'Social'];

  const today = new Date();
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    return date;
  });

  const getHabitCompletion = (habitId: string, date: Date): boolean => {
    const dateString = date.toDateString();
    const completion = completions.find(
      c => c.habitId === habitId && new Date(c.date).toDateString() === dateString
    );
    return completion?.completed || false;
  };

  const getHabitStreak = (habitId: string): number => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      if (getHabitCompletion(habitId, checkDate)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getHabitCompletionRate = (habitId: string): number => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    });

    const completedDays = last30Days.filter(date => getHabitCompletion(habitId, date)).length;
    return Math.round((completedDays / 30) * 100);
  };

  const handleAddHabit = () => {
    if (!formData.title.trim()) return;

    const habitData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      color: formData.color,
      targetDays: [1, 2, 3, 4, 5, 6, 7], // All days by default
    };

    // Create in database and update Redux store
    createHabitInDB(habitData)
      .then((newHabit) => {
        dispatch(addHabit(habitData));
        showSuccess('Habit created successfully!');
        setFormData({ title: '', description: '', category: 'Health', color: '#4FC3F7' });
        setIsAddModalVisible(false);
      })
      .catch((error) => {
        console.error('Error creating habit:', error);
        showError('Failed to create habit. Please try again.');
      });
  };

  const handleToggleCompletion = (habitId: string, date: Date) => {
    // Toggle in database and Redux store
    toggleHabitCompletionInDB(habitId, date)
      .then(() => {
        dispatch(toggleHabitCompletion({ habitId, date }));
        showSuccess('Habit completion updated!');
      })
      .catch((error) => {
        console.error('Error toggling habit completion:', error);
        showError('Failed to update habit completion. Please try again.');
      });
  };

  const getTodayStats = () => {
    const todayCompletions = completions.filter(
      c => new Date(c.date).toDateString() === today.toDateString() && c.completed
    );
    const totalHabits = habits.length;
    const completedToday = todayCompletions.length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const bestStreak = Math.max(...habits.map(h => getHabitStreak(h.id)), 0);
    
    return { completedToday, totalHabits, completionRate, bestStreak };
  };

  const { completedToday, totalHabits, completionRate, bestStreak } = getTodayStats();

  const renderHabitCard = ({ item: habit }: { item: Habit }) => {
    const streak = getHabitStreak(habit.id);
    const habitCompletionRate = getHabitCompletionRate(habit.id);
    const isCompletedToday = getHabitCompletion(habit.id, today);

    return (
      <Card style={[styles.habitCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.habitContent}>
          {/* Header */}
          <View style={styles.habitHeader}>
            <View style={styles.habitInfo}>
              <View style={styles.habitTitleRow}>
                <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
                <View style={styles.habitTitleContainer}>
                  <Text style={[styles.habitTitle, { color: theme.colors.onSurface }]}>
                    {habit.title}
                  </Text>
                  <Text style={[styles.habitDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {habit.description}
                  </Text>
                </View>
              </View>
              <View style={styles.habitMeta}>
                <Chip 
                  style={[styles.categoryChip, { backgroundColor: habit.color + '20' }]}
                  textStyle={{ color: habit.color, fontSize: 12 }}
                  compact
                >
                  {habit.category}
                </Chip>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.completionButton,
                { 
                  backgroundColor: isCompletedToday ? habit.color : theme.colors.surface,
                  borderColor: habit.color,
                  borderWidth: 2,
                  shadowColor: habit.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isCompletedToday ? 0.3 : 0,
                  shadowRadius: 4,
                  elevation: isCompletedToday ? 4 : 2,
                }
              ]}
              onPress={() => handleToggleCompletion(habit.id, today)}
            >
              {isCompletedToday && (
                <Check size={20} color={theme.colors.onPrimary} strokeWidth={3} />
              )}
            </TouchableOpacity>
          </View>

          {/* Weekly Progress */}
          <View style={styles.weeklyProgress}>
            <Text style={[styles.weeklyTitle, { color: theme.colors.onSurface }]}>
              This Week
            </Text>
            <View style={styles.weekDots}>
              {currentWeek.map((date, index) => {
                const isCompleted = getHabitCompletion(habit.id, date);
                const isToday = date.toDateString() === today.toDateString();
                const dayName = date.toLocaleDateString('en', { weekday: 'short' }).charAt(0);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayDot,
                      {
                        backgroundColor: isCompleted ? habit.color : theme.colors.surfaceVariant,
                        borderColor: isToday ? theme.colors.primary : 'transparent',
                        borderWidth: isToday ? 2 : 0,
                        shadowColor: isCompleted ? habit.color : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isCompleted ? 0.3 : 0,
                        shadowRadius: 4,
                        elevation: isCompleted ? 2 : 0,
                      }
                    ]}
                    onPress={() => handleToggleCompletion(habit.id, date)}
                  >
                    <Text style={[styles.dayText, { 
                      color: isCompleted ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                      fontWeight: isCompleted ? 'bold' : 'normal',
                    }]}>
                      {dayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.habitStats, { borderTopColor: theme.colors.outlineVariant }]}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FF6B35' + '20' }]}>
                <Flame size={14} color="#FF6B35" />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {streak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Streak
              </Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                <TrendingUp size={14} color="#4CAF50" />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {habitCompletionRate}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Success
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
              Habits
            </Title>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Build consistent daily routines
            </Text>
          </View>
        </View>
      </View>

      {/* Hero Stats Card */}
      <Card style={[styles.heroStatsCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.heroStatsContent}>
          <View style={styles.heroStatsLeft}>
            <Text style={[styles.heroStatsTitle, { color: theme.colors.onSurface }]}>
              Today's Progress
            </Text>
            <Text style={[styles.heroStatsSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {completedToday} of {totalHabits} habits completed
            </Text>
            <View style={styles.heroStatsProgress}>
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${completionRate}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.primary }]}>
                {completionRate}%
              </Text>
            </View>
          </View>
          <View style={styles.heroStatsRight}>
            <View style={[styles.heroCircle, { borderColor: theme.colors.primary + '30' }]}>
              <Award size={32} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </Card>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Card style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.quickStatContent}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#4CAF50' + '20' }]}>
              <Target size={18} color="#4CAF50" />
            </View>
            <Text style={[styles.quickStatNumber, { color: theme.colors.onSurface }]}>
              {totalHabits}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total Habits
            </Text>
          </View>
        </Card>

        <Card style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.quickStatContent}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#FF6B35' + '20' }]}>
              <Flame size={18} color="#FF6B35" />
            </View>
            <Text style={[styles.quickStatNumber, { color: theme.colors.onSurface }]}>
              {bestStreak}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.onSurfaceVariant }]}>
              Best Streak
            </Text>
          </View>
        </Card>

        <Card style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.quickStatContent}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#2196F3' + '20' }]}>
              <Star size={18} color="#2196F3" />
            </View>
            <Text style={[styles.quickStatNumber, { color: theme.colors.onSurface }]}>
              {completedToday}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.onSurfaceVariant }]}>
              Today
            </Text>
          </View>
        </Card>
      </View>

      <FlatList
        data={habits}
        renderItem={renderHabitCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.habitsList}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon={() => <Plus size={24} color={theme.colors.onPrimary} />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsAddModalVisible(true)}
      />

      {/* Add Habit Modal */}
      <Portal>
        <Modal
          visible={isAddModalVisible}
          onDismiss={() => setIsAddModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Add New Habit
          </Title>
          
          <TextInput
            label="Habit Title"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            style={styles.input}
            mode="outlined"
            autoFocus={false}
            selectTextOnFocus={false}
          />
          
          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            style={styles.input}
            mode="outlined"
            autoFocus={false}
            selectTextOnFocus={false}
            multiline
            numberOfLines={2}
          />
          
          <Text style={[styles.formLabel, { color: theme.colors.onSurface }]}>
            Category
          </Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <Chip
                key={category}
                selected={formData.category === category}
                onPress={() => setFormData({ ...formData, category })}
                style={styles.categoryChip}
                compact
              >
                {category}
              </Chip>
            ))}
          </View>

          <Text style={[styles.formLabel, { color: theme.colors.onSurface }]}>
            Color
          </Text>
          <View style={styles.colorContainer}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { 
                    backgroundColor: color,
                    borderColor: formData.color === color ? theme.colors.primary : 'transparent',
                    borderWidth: formData.color === color ? 3 : 0,
                  }
                ]}
                onPress={() => setFormData({ ...formData, color })}
              />
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button onPress={() => setIsAddModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAddHabit} style={styles.modalButton}>
              Add Habit
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  heroStatsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 4,
    borderRadius: 16,
  },
  heroStatsContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  heroStatsLeft: {
    flex: 1,
  },
  heroStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroStatsSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  heroStatsProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  heroStatsRight: {
    marginLeft: 20,
  },
  heroCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  quickStatContent: {
    padding: 14,
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  habitsList: {
    padding: 20,
    paddingTop: 0,
  },
  habitCard: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 16,
  },
  habitContent: {
    padding: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  colorIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
    marginTop: 2,
  },
  habitTitleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  habitMeta: {
    marginLeft: 16,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  completionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  weeklyProgress: {
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
  },
  modalContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 8,
  },
  input: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 70,
  },
});