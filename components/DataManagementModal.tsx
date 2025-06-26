import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useUserData } from '../hooks/useUserData';
import { useAuthMessages } from '../hooks/useAuthMessages';
import LoadingOverlay from './LoadingOverlay';
import ConfirmationDialog from './ConfirmationDialog';
import { Database, Trash2, Download, Upload, TriangleAlert as AlertTriangle, X, ChartBar as BarChart3, Calendar, Target, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';

interface DataManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DataManagementModal({ visible, onClose }: DataManagementModalProps) {
  const theme = useTheme();
  const { showSuccess, showError } = useAuthMessages();
  const { 
    tasks, 
    habits, 
    habitCompletions, 
    pomodoroSessions, 
    clearAllData, 
    getDataSummary,
    loading 
  } = useUserData();

  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);

  const handleClearData = async () => {
    setShowClearConfirmation(true);
  };

  const confirmClearData = async () => {
    setShowClearConfirmation(false);
    setIsClearing(true);

    try {
      const result = await clearAllData();
      showSuccess('All your data has been successfully cleared');
      console.log('Data cleared:', result);
      onClose();
    } catch (error) {
      console.error('Error clearing data:', error);
      showError('Failed to clear data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleShowSummary = async () => {
    try {
      const summary = await getDataSummary();
      setDataSummary(summary);
      setShowSummary(true);
    } catch (error) {
      console.error('Error fetching data summary:', error);
      showError('Failed to load data summary');
    }
  };

  const getDataStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalHabits = habits.length;
    const totalCompletions = habitCompletions.length;
    const totalSessions = pomodoroSessions.length;
    const completedSessions = pomodoroSessions.filter(session => session.completed).length;

    return {
      totalTasks,
      completedTasks,
      totalHabits,
      totalCompletions,
      totalSessions,
      completedSessions,
    };
  };

  const stats = getDataStats();

  const DataStatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
          {value}
        </Text>
        <Text style={[styles.statTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  const ActionButton = ({ icon: Icon, title, subtitle, onPress, color, variant = 'default' }: any) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { 
          backgroundColor: variant === 'danger' ? color + '10' : theme.colors.surface,
          borderColor: variant === 'danger' ? color + '30' : theme.colors.outlineVariant,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Database size={24} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                    Data Management
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Manage your productivity data
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Data Overview */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Data Overview
                </Text>
                <View style={styles.statsGrid}>
                  <DataStatCard
                    icon={CheckCircle}
                    title="Tasks"
                    value={stats.totalTasks}
                    subtitle={`${stats.completedTasks} completed`}
                    color="#4CAF50"
                  />
                  <DataStatCard
                    icon={Target}
                    title="Habits"
                    value={stats.totalHabits}
                    subtitle={`${stats.totalCompletions} completions`}
                    color="#2196F3"
                  />
                  <DataStatCard
                    icon={Clock}
                    title="Sessions"
                    value={stats.totalSessions}
                    subtitle={`${stats.completedSessions} completed`}
                    color="#FF9800"
                  />
                  <DataStatCard
                    icon={Calendar}
                    title="Active Days"
                    value={new Set(habitCompletions.map(c => c.date)).size}
                    subtitle="with habit activity"
                    color="#9C27B0"
                  />
                </View>
              </View>

              {/* Data Actions */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Data Actions
                </Text>
                <View style={styles.actionsContainer}>
                  <ActionButton
                    icon={BarChart3}
                    title="View Data Summary"
                    subtitle="Detailed breakdown of your data"
                    onPress={handleShowSummary}
                    color="#2196F3"
                  />
                  
                  <ActionButton
                    icon={Download}
                    title="Export Data"
                    subtitle="Download your data as JSON"
                    onPress={() => showError('Export feature coming soon!')}
                    color="#4CAF50"
                  />
                  
                  <ActionButton
                    icon={Upload}
                    title="Import Data"
                    subtitle="Restore data from backup"
                    onPress={() => showError('Import feature coming soon!')}
                    color="#FF9800"
                  />
                </View>
              </View>

              {/* Danger Zone */}
              <View style={styles.section}>
                <View style={styles.dangerZoneHeader}>
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text style={[styles.sectionTitle, { color: '#EF4444', marginLeft: 8 }]}>
                    Danger Zone
                  </Text>
                </View>
                <View style={styles.actionsContainer}>
                  <ActionButton
                    icon={Trash2}
                    title="Clear All Data"
                    subtitle="Permanently delete all your data"
                    onPress={handleClearData}
                    color="#EF4444"
                    variant="danger"
                  />
                </View>
                <View style={[styles.warningBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <AlertTriangle size={16} color="#EF4444" />
                  <Text style={[styles.warningText, { color: '#DC2626' }]}>
                    This action cannot be undone. All your tasks, habits, and session data will be permanently deleted.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Data Summary Modal */}
      <Modal
        visible={showSummary}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.summaryModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
                Data Summary
              </Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <X size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.summaryContent}>
              {dataSummary && (
                <View>
                  <Text style={[styles.summaryJson, { color: theme.colors.onSurface }]}>
                    {JSON.stringify(dataSummary, null, 2)}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={showClearConfirmation}
        title="Clear All Data"
        message="Are you absolutely sure you want to delete all your data? This action cannot be undone and will permanently remove all your tasks, habits, completions, and session history."
        confirmText="Yes, Clear All Data"
        cancelText="Cancel"
        onConfirm={confirmClearData}
        onCancel={() => setShowClearConfirmation(false)}
        type="danger"
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isClearing || loading}
        message={isClearing ? "Clearing your data..." : "Loading..."}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 8,
  },
  summaryModal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryContent: {
    padding: 20,
  },
  summaryJson: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});