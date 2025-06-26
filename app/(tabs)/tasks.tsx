import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Chip,
  FAB,
  Searchbar,
  Menu,
  Button,
  useTheme,
  Portal,
  Modal,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useUserData } from '../../hooks/useUserData';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import { 
  addTask, 
  updateTask, 
  deleteTask, 
  toggleTaskStatus, 
  setFilter, 
  setSearchQuery,
  loadTasksFromDatabase
} from '../../store/slices/tasksSlice';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import { taskCategoryColors, priorityColors, getTaskColor } from '../../constants/theme';
import { Plus, Search, Filter, CircleCheck as CheckCircle, Circle, Clock, Trash2, CreditCard as Edit3, MoveVertical as MoreVertical, X, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import DateTimePicker from '../../components/DateTimePicker';

const { width, height } = Dimensions.get('window');

export default function TasksScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAuthMessages();
  const params = useLocalSearchParams();
  
  const { tasks, filter, searchQuery } = useSelector((state: RootState) => state.tasks);
  const { 
    createTask: createTaskInDB, 
    updateTask: updateTaskInDB, 
    deleteTask: deleteTaskInDB,
    loading: dbLoading 
  } = useUserData();
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Form state without duration
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as TaskCategory,
    priority: 'medium' as TaskPriority,
    scheduledDate: new Date().toISOString().split('T')[0], // Today's date
    scheduledTime: '09:00', // Default 9 AM
  });

  // Handle navigation from Priority Matrix
  useEffect(() => {
    if (params.fromMatrix === 'true') {
      const newFilter = { ...filter };
      
      if (params.filterPriority) {
        newFilter.priority = params.filterPriority as TaskPriority;
      }
      if (params.filterCategory) {
        newFilter.category = params.filterCategory as string;
      }
      
      dispatch(setFilter(newFilter));
    }
  }, [params, dispatch]);

  // Get task status based on date and current status
  const getTaskDisplayStatus = (task: Task): { status: string; color: string } => {
    const today = new Date().toISOString().split('T')[0];
    const taskDate = task.scheduledDate;
    
    if (task.status === 'completed') {
      return { status: 'Completed', color: '#10B981' };
    }
    
    if (taskDate < today && task.status === 'pending') {
      return { status: 'Incomplete', color: '#EF4444' };
    }
    
    if (taskDate === today && task.status === 'pending') {
      return { status: 'Pending', color: '#F59E0B' };
    }
    
    if (taskDate > today && task.status === 'pending') {
      return { status: 'Scheduled', color: '#6B7280' };
    }
    
    return { status: task.status, color: '#6B7280' };
  };

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filter.status === 'all' || task.status === filter.status;
    const matchesPriority = filter.priority === 'all' || task.priority === filter.priority;
    const matchesCategory = filter.category === 'all' || task.category === filter.category;
    
    // Date filtering
    const today = new Date().toISOString().split('T')[0];
    const taskDate = task.scheduledDate;
    
    let matchesDate = true;
    if (filter.dateFilter === 'today') {
      matchesDate = taskDate === today;
    } else if (filter.dateFilter === 'past') {
      matchesDate = taskDate < today;
    }
    // 'all' shows everything
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDate;
  });

  const handleAddTask = () => {
    if (!formData.title.trim()) {
      showError('Please enter a task title');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'pending' as TaskStatus,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime + ':00', // Add seconds
    };

    // Create in database and update Redux store
    createTaskInDB(taskData)
      .then((newTask) => {
        dispatch(addTask(taskData));
        showSuccess('Task created successfully!');
        setFormData({ 
          title: '', 
          description: '', 
          category: 'personal', 
          priority: 'medium',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: '09:00'
        });
        setIsAddModalVisible(false);
      })
      .catch((error) => {
        console.error('Error creating task:', error);
        showError('Failed to create task. Please try again.');
      });
  };

  const handleUpdateTask = () => {
    if (!selectedTask || !formData.title.trim()) {
      showError('Please enter a task title');
      return;
    }

    const updates = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime + ':00',
    };

    // Update in database and Redux store
    updateTaskInDB(selectedTask.id, updates)
      .then((updatedTask) => {
        dispatch(updateTask({ id: selectedTask.id, ...updates }));
        showSuccess('Task updated successfully!');
        setSelectedTask(null);
        setIsEditModalVisible(false);
      })
      .catch((error) => {
        console.error('Error updating task:', error);
        showError('Failed to update task. Please try again.');
      });
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            // Delete from database and Redux store
            deleteTaskInDB(taskId)
              .then(() => {
                dispatch(deleteTask(taskId));
                showSuccess('Task deleted successfully!');
                setExpandedTaskId(null);
              })
              .catch((error) => {
                console.error('Error deleting task:', error);
                showError('Failed to delete task. Please try again.');
              });
          }
        },
      ]
    );
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      scheduledDate: task.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: task.scheduledTime ? task.scheduledTime.substring(0, 5) : '09:00',
    });
    setExpandedTaskId(null);
    setIsEditModalVisible(true);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    // Update in database and Redux store
    updateTaskInDB(taskId, { status: newStatus })
      .then(() => {
        dispatch(toggleTaskStatus(taskId));
        showSuccess(`Task marked as ${newStatus}!`);
      })
      .catch((error) => {
        console.error('Error updating task status:', error);
        showError('Failed to update task status. Please try again.');
      });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    dispatch(setFilter({ [filterType]: value }));
    setIsFilterMenuVisible(false);
  };

  const clearFilters = () => {
    dispatch(setFilter({
      status: 'all',
      priority: 'all',
      category: 'all',
      dateFilter: 'today',
    }));
    setIsFilterMenuVisible(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter.status !== 'all') count++;
    if (filter.priority !== 'all') count++;
    if (filter.category !== 'all') count++;
    if (filter.dateFilter !== 'today') count++;
    return count;
  };

  const getCompletionStats = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => task.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const time = timeString.substring(0, 5);
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const { total, completed, pending } = getCompletionStats();

  const renderTaskCard = ({ item: task }: { item: Task }) => {
    const taskColor = getTaskColor(task);
    const isExpanded = expandedTaskId === task.id;
    const displayStatus = getTaskDisplayStatus(task);

    return (
      <Card style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.taskColorBar, { backgroundColor: taskColor }]} />
        
        <TouchableOpacity
          style={styles.taskMainContent}
          onPress={() => setExpandedTaskId(isExpanded ? null : task.id)}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            <TouchableOpacity
              onPress={() => handleToggleTaskStatus(task.id)}
              style={styles.statusButton}
            >
              {task.status === 'completed' ? (
                <CheckCircle size={18} color={taskColor} />
              ) : (
                <Circle size={18} color={theme.colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>
            
            <View style={styles.taskContent}>
              <Text 
                style={[
                  styles.taskTitle, 
                  { 
                    color: theme.colors.onSurface,
                    textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
                    opacity: task.status === 'completed' ? 0.6 : 1,
                  }
                ]}
                numberOfLines={isExpanded ? undefined : 1}
              >
                {task.title}
              </Text>
              
              {task.description && (
                <Text 
                  style={[styles.taskDescription, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {task.description}
                </Text>
              )}

              {/* Time and Date Info */}
              <View style={styles.taskTimeInfo}>
                <View style={styles.timeChip}>
                  <Calendar size={10} color={theme.colors.primary} />
                  <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                    {formatDate(task.scheduledDate)}
                  </Text>
                </View>
                <View style={styles.timeChip}>
                  <Clock size={10} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
                    {formatTime(task.scheduledTime)}
                  </Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: displayStatus.color + '15' }]}>
                  <Text style={[styles.statusText, { color: displayStatus.color }]}>
                    {displayStatus.status}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setExpandedTaskId(isExpanded ? null : task.id)}
              style={styles.expandButton}
            >
              <MoreVertical size={14} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.taskFooter}>
            <View style={styles.taskChips}>
              <Chip 
                style={[styles.categoryChip, { backgroundColor: taskCategoryColors[task.category] + '15' }]}
                textStyle={{ color: taskCategoryColors[task.category], fontSize: 10 }}
                compact
              >
                {task.category}
              </Chip>
              <Chip 
                style={[styles.priorityChip, { backgroundColor: taskColor + '15' }]}
                textStyle={{ color: taskColor, fontSize: 10 }}
                compact
              >
                {task.priority}
              </Chip>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Actions */}
        {isExpanded && (
          <View style={[styles.expandedActions, { borderTopColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditTask(task)}
              activeOpacity={0.7}
            >
              <Edit3 size={12} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteTask(task.id, task.title)}
              activeOpacity={0.7}
            >
              <Trash2 size={12} color={theme.colors.error} />
              <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  const TaskModal = ({ visible, onDismiss, onSubmit, title }: any) => (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.modalScrollView}
        >
          <View style={styles.modalHeader}>
            <Title style={{ color: theme.colors.onSurface, fontSize: 18 }}>{title}</Title>
            <IconButton
              icon={() => <X size={20} color={theme.colors.onSurfaceVariant} />}
              onPress={onDismiss}
              style={styles.closeButton}
            />
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              label="Task Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
              mode="outlined"
              error={!formData.title.trim() && formData.title.length > 0}
              autoComplete="off"
              autoCorrect={false}
              blurOnSubmit={false}
              onSubmitEditing={() => {}}
            />
            
            <TextInput
              label="Description (optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              autoComplete="off"
              autoCorrect={false}
              blurOnSubmit={false}
            />

            {/* Date and Time Picker */}
            <DateTimePicker
              date={formData.scheduledDate}
              time={formData.scheduledTime}
              onDateChange={(date) => setFormData({ ...formData, scheduledDate: date })}
              onTimeChange={(time) => setFormData({ ...formData, scheduledTime: time })}
              label="Schedule"
            />
            
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.colors.onSurface }]}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.chipScrollView}
                contentContainerStyle={styles.chipContainer}
              >
                {(['work', 'personal', 'health', 'education'] as TaskCategory[]).map((category) => (
                  <Chip
                    key={category}
                    selected={formData.category === category}
                    onPress={() => setFormData({ ...formData, category })}
                    style={[
                      styles.formChip,
                      formData.category === category && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                    textStyle={{
                      color: formData.category === category ? theme.colors.primary : theme.colors.onSurface,
                      fontWeight: formData.category === category ? '600' : '400',
                      fontSize: 12
                    }}
                    compact
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.colors.onSurface }]}>Priority</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.chipScrollView}
                contentContainerStyle={styles.chipContainer}
              >
                {(['high', 'medium', 'low'] as TaskPriority[]).map((priority) => (
                  <Chip
                    key={priority}
                    selected={formData.priority === priority}
                    onPress={() => setFormData({ ...formData, priority })}
                    style={[
                      styles.formChip,
                      formData.priority === priority && { backgroundColor: priorityColors[priority] + '20' }
                    ]}
                    textStyle={{
                      color: formData.priority === priority ? priorityColors[priority] : theme.colors.onSurface,
                      fontWeight: formData.priority === priority ? '600' : '400',
                      fontSize: 12
                    }}
                    compact
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <Button 
                onPress={onDismiss} 
                style={styles.modalButton} 
                mode="outlined"
                buttonColor={theme.colors.surface}
                textColor={theme.colors.onSurface}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={onSubmit} 
                style={styles.modalButton}
                disabled={!formData.title.trim()}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
              >
                {title === 'Add Task' ? 'Add' : 'Update'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
              Tasks
            </Title>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {total} task{total !== 1 ? 's' : ''} • {completed} completed • {pending} pending
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Total</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Done</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{pending}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tasks..."
          onChangeText={(query) => dispatch(setSearchQuery(query))}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ fontSize: 14 }}
        />
        
        <Menu
          visible={isFilterMenuVisible}
          onDismiss={() => setIsFilterMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setIsFilterMenuVisible(true)}
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: getActiveFilterCount() > 0 ? theme.colors.primary : 'transparent',
                  borderWidth: getActiveFilterCount() > 0 ? 2 : 0,
                }
              ]}
            >
              <Filter size={16} color={getActiveFilterCount() > 0 ? theme.colors.primary : theme.colors.onSurface} />
              {getActiveFilterCount() > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.filterBadgeText, { color: theme.colors.onPrimary }]}>
                    {getActiveFilterCount()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            onPress={() => handleFilterChange('dateFilter', 'today')} 
            title="Today's Tasks" 
            leadingIcon={filter.dateFilter === 'today' ? 'check' : undefined}
          />
          <Menu.Item 
            onPress={() => handleFilterChange('dateFilter', 'past')} 
            title="Past Tasks" 
            leadingIcon={filter.dateFilter === 'past' ? 'check' : undefined}
          />
          <Menu.Item 
            onPress={() => handleFilterChange('dateFilter', 'all')} 
            title="All Tasks" 
            leadingIcon={filter.dateFilter === 'all' ? 'check' : undefined}
          />
          <Menu.Item 
            onPress={() => handleFilterChange('status', 'pending')} 
            title="Pending" 
            leadingIcon={filter.status === 'pending' ? 'check' : undefined}
          />
          <Menu.Item 
            onPress={() => handleFilterChange('status', 'completed')} 
            title="Completed" 
            leadingIcon={filter.status === 'completed' ? 'check' : undefined}
          />
          <Menu.Item 
            onPress={() => handleFilterChange('priority', 'high')} 
            title="High Priority" 
            leadingIcon={filter.priority === 'high' ? 'check' : undefined}
          />
          <Menu.Item onPress={clearFilters} title="Clear Filters" />
        </Menu>
      </View>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <View style={styles.activeFilters}>
          {filter.dateFilter !== 'today' && (
            <Chip 
              style={styles.activeFilterChip}
              onClose={() => handleFilterChange('dateFilter', 'today')}
              compact
            >
              Date: {filter.dateFilter}
            </Chip>
          )}
          {filter.status !== 'all' && (
            <Chip 
              style={styles.activeFilterChip}
              onClose={() => handleFilterChange('status', 'all')}
              compact
            >
              Status: {filter.status}
            </Chip>
          )}
          {filter.priority !== 'all' && (
            <Chip 
              style={styles.activeFilterChip}
              onClose={() => handleFilterChange('priority', 'all')}
              compact
            >
              Priority: {filter.priority}
            </Chip>
          )}
          {filter.category !== 'all' && (
            <Chip 
              style={styles.activeFilterChip}
              onClose={() => handleFilterChange('category', 'all')}
              compact
            >
              Category: {filter.category}
            </Chip>
          )}
        </View>
      )}

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      />

      <FAB
        icon={() => <Plus size={24} color={theme.colors.onPrimary} />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsAddModalVisible(true)}
        size="medium"
      />

      <TaskModal
        visible={isAddModalVisible}
        onDismiss={() => setIsAddModalVisible(false)}
        onSubmit={handleAddTask}
        title="Add Task"
      />

      <TaskModal
        visible={isEditModalVisible}
        onDismiss={() => setIsEditModalVisible(false)}
        onSubmit={handleUpdateTask}
        title="Edit Task"
      />
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
  },
  tasksList: {
    padding: 20,
    paddingTop: 0,
  },
  taskCard: {
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskColorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 1,
  },
  taskMainContent: {
    padding: 10,
    paddingTop: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  statusButton: {
    marginRight: 8,
    marginTop: 1,
  },
  taskContent: {
    flex: 1,
    marginRight: 6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  taskDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  taskTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  expandButton: {
    padding: 2,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  taskChips: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryChip: {
    height: 18,
  },
  priorityChip: {
    height: 20,
  },
  expandedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 3,
  },
  editButton: {
    backgroundColor: 'rgba(103, 80, 164, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(103, 80, 164, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    elevation: 8,
  },
  modalContainer: {
    margin: 16,
    borderRadius: 16,
    elevation: 8,
    maxHeight: height * 0.9,
  },
  modalScrollView: {
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  closeButton: {
    margin: 0,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipScrollView: {
    flexGrow: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 20,
  },
  formChip: {
    marginRight: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: 28,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
  },
  modalButton: {
    minWidth: 80,
  },
});