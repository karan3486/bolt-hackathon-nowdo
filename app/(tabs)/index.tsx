import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, ProgressBar, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useUserData } from '../../hooks/useUserData';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import AuthMessage from '../../components/AuthMessage';
import { getRandomQuote } from '../../utils/quotes';
import { getRandomSuggestions } from '../../utils/suggestions';
import { Quote, SuggestionCard } from '../../types';
import { router } from 'expo-router';
import { 
  Clock, 
  CircleCheck as CheckCircle, 
  Target, 
  TrendingUp, 
  Zap, 
  Star, 
  Coffee, 
  BookOpen, 
  Heart, 
  MessageCircle, 
  Folder, 
  Calendar, 
  Droplets, 
  Play, 
  Plus, 
  ArrowRight, 
  Award, 
  Activity,
  ChevronDown,
  ChevronUp,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react-native';
import { startSession, pauseSession, resumeSession, resetSession, updateTimeRemaining } from '../../store/slices/pomodoroSlice';

const { width } = Dimensions.get('window');

const iconMap: { [key: string]: any } = {
  Coffee,
  Target,
  Folder,
  Heart,
  MessageCircle,
  BookOpen,
  Calendar,
  Droplets,
};

export default function DashboardScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { message, clearMessage } = useAuthMessages();
  const { tasks: dbTasks, habits: dbHabits, habitCompletions: dbCompletions, pomodoroSessions: dbSessions } = useUserData();
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<SuggestionCard[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [habitsExpanded, setHabitsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Animation values
  const suggestionsHeight = useState(new Animated.Value(0))[0];
  const habitsHeight = useState(new Animated.Value(0))[0];
  const habitsRotation = useState(new Animated.Value(0))[0];
  
  // Use database data if available, fallback to Redux store
  // Always call useSelector hooks unconditionally
  const reduxTasks = useSelector((state: RootState) => state.tasks.tasks);
  const reduxHabits = useSelector((state: RootState) => state.habits.habits);
  const reduxHabitCompletions = useSelector((state: RootState) => state.habits.completions);
  const reduxPomodoroSessions = useSelector((state: RootState) => state.pomodoro.sessions);
  const { isRunning, timeRemaining, currentSessionType, settings } = useSelector((state: RootState) => state.pomodoro);
  
  // Use database data if available, fallback to Redux store
  const tasks = dbTasks.length > 0 ? dbTasks : reduxTasks;
  const habits = dbHabits.length > 0 ? dbHabits : reduxHabits;
  const habitCompletions = dbCompletions.length > 0 ? dbCompletions : reduxHabitCompletions;
  const pomodoroSessions = dbSessions.length > 0 ? dbSessions : reduxPomodoroSessions;

  useEffect(() => {
    setCurrentQuote(getRandomQuote());
    const initialSuggestions = getRandomSuggestions(3);
    setSuggestions(initialSuggestions);
    setAllSuggestions(getRandomSuggestions(8));
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch(updateTimeRemaining(timeRemaining - 1));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, dispatch]);

  // Calculate dashboard stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  const todayCompletions = habitCompletions.filter(
    completion => new Date(completion.date).toDateString() === new Date().toDateString()
  );
  const todayHabitScore = habits.length > 0 ? todayCompletions.length / habits.length : 0;
  
  const todaySessions = pomodoroSessions.filter(
    session => new Date(session.startTime).toDateString() === new Date().toDateString()
  );

  const currentStreak = calculateLongestStreak();

  function calculateLongestStreak(): number {
    if (habits.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const dayCompletions = habitCompletions.filter(
        completion => new Date(completion.date).toDateString() === checkDate.toDateString()
      );
      
      if (dayCompletions.length > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    const completionPercentage = Math.round(completionRate * 100);
    if (completionPercentage >= 80) return "You're crushing it today! 🔥";
    if (completionPercentage >= 50) return "Great progress! Keep it up! 💪";
    if (completionPercentage >= 20) return "You're on the right track! 🎯";
    return "Ready to make today productive? ✨";
  };

  const toggleSuggestions = () => {
    const toValue = showAllSuggestions ? 0 : 1;
    setShowAllSuggestions(!showAllSuggestions);
    
    Animated.spring(suggestionsHeight, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const toggleHabits = () => {
    const toValue = habitsExpanded ? 0 : 1;
    setHabitsExpanded(!habitsExpanded);
    
    Animated.parallel([
      Animated.spring(habitsHeight, {
        toValue,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(habitsRotation, {
        toValue: habitsExpanded ? 0 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-task':
        router.push('/(tabs)/tasks');
        break;
      case 'start-focus':
        if (!isRunning) {
          dispatch(startSession({}));
        } else {
          router.push('/(tabs)/pomodoro');
        }
        break;
      case 'check-habits':
        router.push('/(tabs)/habits');
        break;
      case 'view-calendar':
        router.push('/(tabs)/calendar');
        break;
    }
  };

  const handlePomodoroControl = (action: string) => {
    switch (action) {
      case 'start':
        dispatch(startSession({}));
        break;
      case 'pause':
        dispatch(pauseSession());
        break;
      case 'resume':
        dispatch(resumeSession());
        break;
      case 'reset':
        dispatch(resetSession());
        break;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const totalTime = currentSessionType === 'work' 
      ? settings.workDuration * 60 
      : settings.shortBreakDuration * 60;
    return (totalTime - timeRemaining) / totalTime;
  };

  const renderSuggestionCard = (suggestion: SuggestionCard, index: number) => {
    const IconComponent = iconMap[suggestion.icon] || Star;
    
    return (
      <TouchableOpacity 
        key={suggestion.id} 
        style={[styles.suggestionCard, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={[styles.suggestionIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          <IconComponent size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={[styles.suggestionTitle, { color: theme.colors.onSurface }]}>
            {suggestion.title}
          </Text>
          <Text style={[styles.suggestionDescription, { color: theme.colors.onSurfaceVariant }]}>
            {suggestion.description}
          </Text>
          <View style={styles.suggestionFooter}>
            <Text style={[styles.suggestionTime, { color: theme.colors.primary }]}>
              {suggestion.estimatedTime}m
            </Text>
            <ArrowRight size={16} color={theme.colors.onSurfaceVariant} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHabitItem = (habit: any, index: number) => (
    <View key={habit.id} style={[styles.habitItem, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.habitColorIndicator, { backgroundColor: habit.color }]} />
      <View style={styles.habitContent}>
        <Text style={[styles.habitTitle, { color: theme.colors.onSurface }]}>
          {habit.title}
        </Text>
        <Text style={[styles.habitDescription, { color: theme.colors.onSurfaceVariant }]}>
          {habit.description}
        </Text>
      </View>
      <View style={[styles.habitStatus, { backgroundColor: habit.color + '20' }]}>
        <CheckCircle size={16} color={habit.color} />
      </View>
    </View>
  );

  const renderTaskItem = (task: any, index: number) => (
    <View key={task.id} style={[styles.taskItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.taskCategory, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.taskCategoryText, { color: theme.colors.primary }]}>
                {task.category}
              </Text>
            </View>
            <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
              <Text style={[styles.taskPriorityText, { color: getPriorityColor(task.priority) }]}>
                {task.priority}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.taskStatusIndicator, { backgroundColor: getStatusColor(task.status) }]} />
      </View>
    </View>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return theme.colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return theme.colors.primary;
    }
  };

  const rotateInterpolate = habitsRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: theme.colors.onBackground }]}>
                {getGreeting()}!
              </Text>
              <Text style={[styles.motivationalText, { color: theme.colors.primary }]}>
                {getMotivationalMessage()}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={[styles.timeText, { color: theme.colors.onBackground }]}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Stats Card */}
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
                Today's Progress
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatNumber, { color: theme.colors.primary }]}>
                    {Math.round(completionRate * 100)}%
                  </Text>
                  <Text style={[styles.heroStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Tasks Done
                  </Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatNumber, { color: theme.colors.primary }]}>
                    {currentStreak}
                  </Text>
                  <Text style={[styles.heroStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Day Streak
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.heroRight}>
              <View style={[styles.circularProgress, { borderColor: theme.colors.primary + '20' }]}>
                <View 
                  style={[
                    styles.circularProgressFill, 
                    { 
                      borderColor: theme.colors.primary,
                      transform: [{ rotate: `${completionRate * 360}deg` }]
                    }
                  ]} 
                />
                <View style={[styles.circularProgressInner, { backgroundColor: theme.colors.surface }]}>
                  <Award size={24} color={theme.colors.primary} />
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                <CheckCircle size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {completedTasks}/{totalTasks}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Tasks
              </Text>
            </View>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#FF9800' + '15' }]}>
                <Clock size={20} color="#FF9800" />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {todaySessions.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Sessions
              </Text>
            </View>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: '#2196F3' + '15' }]}>
                <Target size={20} color="#2196F3" />
              </View>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {Math.round(todayHabitScore * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Habits
              </Text>
            </View>
          </Card>
        </View>

        {/* Pomodoro Timer Section */}
        <Card style={[styles.pomodoroCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.pomodoroHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text style={[styles.pomodoroTitle, { color: theme.colors.onSurface }]}>
              Pomodoro Timer
            </Text>
          </View>
          
          <View style={styles.pomodoroContent}>
            <View style={styles.timerContainer}>
              <View style={[styles.timerCircle, { borderColor: theme.colors.primary + '30' }]}>
                <View 
                  style={[
                    styles.progressRing,
                    {
                      transform: [{ rotate: `${getProgress() * 360}deg` }],
                      borderTopColor: currentSessionType === 'work' ? theme.colors.primary : '#4CAF50',
                    }
                  ]} 
                />
                <View style={[styles.timerInner, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.timerText, { color: theme.colors.onSurface }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                  <Text style={[styles.timerLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {currentSessionType === 'work' ? 'Focus' : 'Break'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.timerControls}>
              {!isRunning ? (
                <TouchableOpacity
                  style={[styles.timerButton, styles.playButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handlePomodoroControl('start')}
                  activeOpacity={0.8}
                >
                  <Play size={20} color={theme.colors.onPrimary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.timerButton, styles.pauseButton, { backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={() => handlePomodoroControl('pause')}
                  activeOpacity={0.8}
                >
                  <Pause size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.timerButton, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => handlePomodoroControl('reset')}
                activeOpacity={0.8}
              >
                <RotateCcw size={18} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Progress Visualization */}
        <Card style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.progressHeader}>
            <Activity size={20} color={theme.colors.primary} />
            <Text style={[styles.progressTitle, { color: theme.colors.onSurface }]}>
              Weekly Overview
            </Text>
          </View>
          
          <View style={styles.progressBars}>
            <View style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Task Completion
                </Text>
                <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
                  {Math.round(completionRate * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={completionRate} 
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Habit Consistency
                </Text>
                <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
                  {Math.round(todayHabitScore * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={todayHabitScore} 
                color="#4CAF50"
                style={styles.progressBar}
              />
            </View>
          </View>
        </Card>

        {/* Habits Section */}
        <Card style={[styles.habitsCard, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={styles.habitsHeader} onPress={toggleHabits} activeOpacity={0.7}>
            <View style={styles.habitsHeaderLeft}>
              <Target size={20} color={theme.colors.primary} />
              <Text style={[styles.habitsTitle, { color: theme.colors.onSurface }]}>
                Today's Habits
              </Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
            </Animated.View>
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              styles.habitsContent,
              {
                maxHeight: habitsHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                opacity: habitsHeight,
              }
            ]}
          >
            <View style={styles.habitsList}>
              {habits.slice(0, 4).map(renderHabitItem)}
            </View>
            <TouchableOpacity 
              style={[styles.addHabitButton, { backgroundColor: theme.colors.primary + '15' }]}
              onPress={() => router.push('/(tabs)/habits')}
              activeOpacity={0.7}
            >
              <Plus size={16} color={theme.colors.primary} />
              <Text style={[styles.addHabitText, { color: theme.colors.primary }]}>
                Add New Habit
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Card>

        {/* Tasks Section */}
        <Card style={[styles.tasksCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.tasksHeader}>
            <View style={styles.tasksHeaderLeft}>
              <CheckCircle size={20} color={theme.colors.primary} />
              <Text style={[styles.tasksTitle, { color: theme.colors.onSurface }]}>
                Recent Tasks
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')} activeOpacity={0.7}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tasksList}>
            {tasks.slice(0, 3).map(renderTaskItem)}
          </View>
        </Card>

        {/* Inspirational Quote */}
        {currentQuote && (
          <Card style={[styles.quoteCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.quoteContent}>
              <View style={styles.quoteHeader}>
                <View style={[styles.quoteIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Zap size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.quoteLabel, { color: theme.colors.primary }]}>
                  Daily Inspiration
                </Text>
              </View>
              <Text style={[styles.quoteText, { color: theme.colors.onSurface }]}>
                "{currentQuote.text}"
              </Text>
              <Text style={[styles.quoteAuthor, { color: theme.colors.onSurfaceVariant }]}>
                — {currentQuote.author}
              </Text>
            </View>
          </Card>
        )}

        {/* Smart Suggestions */}
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Smart Suggestions
            </Text>
            <TouchableOpacity style={styles.seeAllButton} onPress={toggleSuggestions} activeOpacity={0.7}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                {showAllSuggestions ? 'Show Less' : 'See All'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}
          >
            {suggestions.map(renderSuggestionCard)}
          </ScrollView>

          <Animated.View 
            style={[
              styles.allSuggestionsContainer,
              {
                maxHeight: suggestionsHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400],
                }),
                opacity: suggestionsHeight,
              }
            ]}
          >
            <View style={styles.allSuggestionsGrid}>
              {allSuggestions.map((suggestion, index) => (
                <View key={suggestion.id} style={styles.suggestionGridItem}>
                  {renderSuggestionCard(suggestion, index)}
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleQuickAction('add-task')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                <Plus size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.onSurface }]}>
                Add Task
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleQuickAction('start-focus')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FF9800' + '15' }]}>
                <Play size={20} color="#FF9800" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.onSurface }]}>
                {isRunning ? 'Focus Active' : 'Start Focus'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleQuickAction('check-habits')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#2196F3' + '15' }]}>
                <Target size={20} color="#2196F3" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.onSurface }]}>
                Check Habits
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleQuickAction('view-calendar')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#9C27B0' + '15' }]}>
                <Calendar size={20} color="#9C27B0" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.onSurface }]}>
                View Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {message && (
        <AuthMessage
          message={message.text}
          type={message.type}
          onDismiss={clearMessage}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  motivationalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    borderRadius: 16,
  },
  heroContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 20,
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  heroStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
  },
  heroRight: {
    marginLeft: 20,
  },
  circularProgress: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularProgressFill: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#6750A4',
  },
  circularProgressInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  pomodoroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  pomodoroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  pomodoroTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pomodoroContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: 'transparent',
  },
  timerInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timerLabel: {
    fontSize: 12,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  timerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  pauseButton: {},
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  progressTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBars: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 4,
  },
  habitsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  habitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  habitsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitsTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  habitsContent: {
    overflow: 'hidden',
  },
  habitsList: {
    paddingHorizontal: 16,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  habitColorIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  habitStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  addHabitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tasksCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  tasksHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasksTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  taskCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskPriority: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskPriorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  quoteCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  quoteContent: {
    padding: 16,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  quoteLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 13,
    textAlign: 'right',
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  suggestionCard: {
    width: width * 0.75,
    borderRadius: 12,
    elevation: 2,
    padding: 14,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  allSuggestionsContainer: {
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  allSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionGridItem: {
    width: (width - 64) / 2,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});