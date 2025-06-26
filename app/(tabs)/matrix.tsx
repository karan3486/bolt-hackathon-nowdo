import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  useTheme,
  Portal,
  Modal,
  TextInput,
  Button,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useUserData } from '../../hooks/useUserData';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import { addTask, updateTask } from '../../store/slices/tasksSlice';
import { Task, TaskCategory, TaskPriority } from '../../types';
import { matrixQuadrantColors, getTaskColor } from '../../constants/theme';
import { Plus, ArrowRight, Clock, CircleCheck as CheckCircle, Circle, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

type MatrixQuadrant = 'high-priority' | 'medium-priority' | 'low-priority' | 'dont-do';

export default function MatrixScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAuthMessages();
  
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const { 
    createTask: createTaskInDB, 
    loading: dbLoading 
  } = useUserData();
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<MatrixQuadrant>('high-priority');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
  });

  const getTasksByQuadrant = (quadrant: MatrixQuadrant): Task[] => {
    return tasks.filter(task => {
      switch (quadrant) {
        case 'high-priority':
          return task.priority === 'high' && (task.category === 'work' || task.category === 'education') && task.status !== 'completed';
        case 'medium-priority':
          return task.priority === 'medium' && (task.category === 'work' || task.category === 'education') && task.status !== 'completed';
        case 'low-priority':
          return task.priority === 'low' && (task.category === 'work' || task.category === 'education') && task.status !== 'completed';
        case 'dont-do':
          return task.priority === 'low' && task.category === 'personal' && task.status !== 'completed';
        default:
          return false;
      }
    });
  };

  const getQuadrantColor = (quadrant: MatrixQuadrant): string => {
    return matrixQuadrantColors[quadrant];
  };

  const getQuadrantTitle = (quadrant: MatrixQuadrant): string => {
    switch (quadrant) {
      case 'high-priority':
        return 'High Priority';
      case 'medium-priority':
        return 'Medium Priority';
      case 'low-priority':
        return 'Low Priority';
      case 'dont-do':
        return "Don't Do";
      default:
        return '';
    }
  };

  const getQuadrantDescription = (quadrant: MatrixQuadrant): string => {
    switch (quadrant) {
      case 'high-priority':
        return 'Urgent & Important';
      case 'medium-priority':
        return 'Important but Not Urgent';
      case 'low-priority':
        return 'Urgent but Not Important';
      case 'dont-do':
        return 'Not Urgent and Important';
      default:
        return '';
    }
  };

  const getTaskPropertiesForQuadrant = (quadrant: MatrixQuadrant) => {
    switch (quadrant) {
      case 'high-priority':
        return { priority: 'high' as TaskPriority, category: 'work' as TaskCategory };
      case 'medium-priority':
        return { priority: 'medium' as TaskPriority, category: 'work' as TaskCategory };
      case 'low-priority':
        return { priority: 'low' as TaskPriority, category: 'work' as TaskCategory };
      case 'dont-do':
        return { priority: 'low' as TaskPriority, category: 'personal' as TaskCategory };
      default:
        return { priority: 'medium' as TaskPriority, category: 'work' as TaskCategory };
    }
  };

  const handleAddTask = () => {
    if (!formData.title.trim()) {
      showError('Please enter a task title');
      return;
    }

    const quadrantProperties = getTaskPropertiesForQuadrant(selectedQuadrant);

    const taskData = {
      title: formData.title,
      description: formData.description,
      category: quadrantProperties.category,
      priority: quadrantProperties.priority,
      status: 'pending' as const,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: formData.duration,
    };

    // Create in database and update Redux store
    createTaskInDB(taskData)
      .then((newTask) => {
        dispatch(addTask(taskData));
        showSuccess('Task created successfully!');
        setFormData({ title: '', description: '', duration: 30 });
        setIsAddModalVisible(false);
      })
      .catch((error) => {
        console.error('Error creating task:', error);
        showError('Failed to create task. Please try again.');
      });
  };

  const handleQuadrantPress = (quadrant: MatrixQuadrant) => {
    setSelectedQuadrant(quadrant);
    setIsAddModalVisible(true);
  };

  const handleShowMore = (quadrant: MatrixQuadrant) => {
    // Navigate to tasks screen with pre-applied filter
    const quadrantProperties = getTaskPropertiesForQuadrant(quadrant);
    router.push({
      pathname: '/(tabs)/tasks',
      params: {
        filterPriority: quadrantProperties.priority,
        filterCategory: quadrantProperties.category,
        fromMatrix: 'true'
      }
    });
  };

  const renderTaskBullet = (task: Task, index: number) => {
    const taskColor = getTaskColor(task);
    
    return (
      <View key={task.id} style={styles.taskBullet}>
        <View style={[styles.bulletPoint, { backgroundColor: taskColor }]} />
        <Text 
          style={[styles.bulletText, { color: theme.colors.onSurface }]} 
          numberOfLines={1}
        >
          {task.title}
        </Text>
      </View>
    );
  };

  const renderQuadrant = (quadrant: MatrixQuadrant) => {
    const quadrantTasks = getTasksByQuadrant(quadrant);
    const color = getQuadrantColor(quadrant);
    const title = getQuadrantTitle(quadrant);
    const description = getQuadrantDescription(quadrant);
    const displayTasks = quadrantTasks.slice(0, 5);
    const remainingCount = quadrantTasks.length - 5;

    return (
      <View style={[styles.quadrant, { backgroundColor: theme.colors.surface }]}>
        {/* Quadrant Header */}
        <View style={[styles.quadrantHeader, { borderBottomColor: color }]}>
          <View style={styles.quadrantTitleRow}>
            <Text style={[styles.quadrantTitle, { color }]}>
              {title}
            </Text>
            <View style={[styles.taskCount, { backgroundColor: color }]}>
              <Text style={[styles.taskCountText, { color: theme.colors.onPrimary }]}>
                {quadrantTasks.length}
              </Text>
            </View>
          </View>
          <Text style={[styles.quadrantDescription, { color: theme.colors.onSurfaceVariant }]}>
            {description}
          </Text>
        </View>
        
        {/* Quadrant Content */}
        <View style={styles.quadrantContent}>
          {quadrantTasks.length > 0 ? (
            <>
              <View style={styles.tasksList}>
                {displayTasks.map(renderTaskBullet)}
              </View>
              
              {remainingCount > 0 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => handleShowMore(quadrant)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.showMoreText, { color }]}>
                    [+{remainingCount} more]
                  </Text>
                  <ChevronRight size={14} color={color} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyStateIcon, { backgroundColor: color + '15' }]}>
                <Plus size={24} color={color} />
              </View>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No tasks yet
              </Text>
            </View>
          )}
          
          {/* Add Task Button */}
          <TouchableOpacity
            style={[styles.addTaskButton, { backgroundColor: color + '15', borderColor: color }]}
            onPress={() => handleQuadrantPress(quadrant)}
            activeOpacity={0.7}
          >
            <Plus size={16} color={color} />
            <Text style={[styles.addTaskText, { color }]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Priority Matrix
        </Title>
        <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Organize tasks by priority and importance
        </Text>
      </View>

      {/* Legend */}
      <Card style={[styles.legendCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.legendContent}>
          <Text style={[styles.legendTitle, { color: theme.colors.onSurface }]}>
            Priority Matrix Guide
          </Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getQuadrantColor('high-priority') }]} />
              <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                High Priority - Do immediately
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getQuadrantColor('medium-priority') }]} />
              <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                Medium Priority - Schedule for later
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getQuadrantColor('low-priority') }]} />
              <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                Low Priority - Delegate if possible
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getQuadrantColor('dont-do') }]} />
              <Text style={[styles.legendText, { color: theme.colors.onSurface }]}>
                Don't Do - Eliminate or minimize
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Matrix Grid */}
      <View style={styles.matrixContainer}>
        <View style={styles.matrixRow}>
          {renderQuadrant('high-priority')}
          {renderQuadrant('medium-priority')}
        </View>
        <View style={styles.matrixRow}>
          {renderQuadrant('low-priority')}
          {renderQuadrant('dont-do')}
        </View>
      </View>

      {/* Add Task Modal */}
      <Portal>
        <Modal
          visible={isAddModalVisible}
          onDismiss={() => setIsAddModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Title style={{ color: theme.colors.onSurface }}>
              Add Task to {getQuadrantTitle(selectedQuadrant)}
            </Title>
            <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {getQuadrantDescription(selectedQuadrant)}
            </Text>
          </View>
          
          <TextInput
            label="Task Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            style={styles.input}
            mode="outlined"
            autoFocus={false}
            selectTextOnFocus={false}
            error={!formData.title.trim() && formData.title.length > 0}
          />
          
          <TextInput
            label="Description (optional)"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            style={styles.input}
            mode="outlined"
            autoFocus={false}
            selectTextOnFocus={false}
            multiline
            numberOfLines={3}
          />
          
          <TextInput
            label="Duration (minutes)"
            value={formData.duration.toString()}
            onChangeText={(text) => setFormData({ ...formData, duration: parseInt(text) || 30 })}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <Button 
              onPress={() => setIsAddModalVisible(false)} 
              style={styles.modalButton}
              mode="outlined"
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAddTask} 
              style={styles.modalButton}
              disabled={!formData.title.trim()}
            >
              Add Task
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
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  legendCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    elevation: 3,
    borderRadius: 16,
  },
  legendContent: {
    padding: 20,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  legendGrid: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  matrixContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  matrixRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quadrant: {
    flex: 1,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    minHeight: 240,
  },
  quadrantHeader: {
    padding: 16,
    borderBottomWidth: 3,
  },
  quadrantTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quadrantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quadrantDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  quadrantContent: {
    flex: 1,
    padding: 16,
    paddingTop: 12,
  },
  tasksList: {
    flex: 1,
    gap: 8,
  },
  taskBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyStateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  addTaskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    minWidth: 80,
  },
});