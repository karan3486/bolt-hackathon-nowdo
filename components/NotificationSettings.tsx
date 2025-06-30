import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Bell, Clock, Volume2, Vibrate, X, Check } from 'lucide-react-native';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
  onSettingsChange: (settings: NotificationSettings) => void;
  currentSettings: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderMinutes: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const REMINDER_OPTIONS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
];

export default function NotificationSettings({
  visible,
  onClose,
  onSettingsChange,
  currentSettings,
}: NotificationSettingsProps) {
  const theme = useTheme();
  const { permissionStatus, registerForPushNotificationsAsync } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSettingsChange(settings);
    onClose();
  };

  const handleEnableNotifications = async (enabled: boolean) => {
    if (enabled && permissionStatus !== 'granted') {
      await registerForPushNotificationsAsync();
    }
    setSettings(prev => ({ ...prev, enabled }));
  };

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    rightElement 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    rightElement: React.ReactNode;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.outlineVariant }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
      </View>
    </View>
  );

  return (
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
                <Bell size={24} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Task Notifications
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Get reminded before your tasks start
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Permission Status */}
            {permissionStatus !== 'granted' && (
              <View style={[styles.permissionWarning, { backgroundColor: theme.colors.errorContainer }]}>
                <Text style={[styles.permissionWarningText, { color: theme.colors.error }]}>
                  Notification permissions are required to receive task reminders. 
                  Enable notifications below to grant permission.
                </Text>
              </View>
            )}

            {/* Enable Notifications */}
            <View style={[styles.section, { backgroundColor: theme.colors.background }]}>
              <SettingRow
                icon={Bell}
                title="Enable Notifications"
                subtitle="Receive reminders for upcoming tasks"
                rightElement={
                  <Switch
                    value={settings.enabled}
                    onValueChange={handleEnableNotifications}
                    trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                    thumbColor={settings.enabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                }
              />
            </View>

            {/* Reminder Timing */}
            <View style={[styles.section, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Reminder Timing
              </Text>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.reminderOption,
                    settings.reminderMinutes === option.value && { backgroundColor: theme.colors.primary + '15' },
                    { borderBottomColor: theme.colors.outlineVariant }
                  ]}
                  onPress={() => setSettings(prev => ({ ...prev, reminderMinutes: option.value }))}
                  disabled={!settings.enabled}
                >
                  <View style={styles.reminderOptionLeft}>
                    <Clock size={20} color={theme.colors.onSurfaceVariant} />
                    <Text style={[
                      styles.reminderOptionText,
                      { 
                        color: settings.enabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                        opacity: settings.enabled ? 1 : 0.5
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {settings.reminderMinutes === option.value && (
                    <Check size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Sound & Vibration */}
            <View style={[styles.section, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Alert Style
              </Text>
              
              <SettingRow
                icon={Volume2}
                title="Sound"
                subtitle="Play notification sound"
                rightElement={
                  <Switch
                    value={settings.soundEnabled}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, soundEnabled: value }))}
                    disabled={!settings.enabled}
                    trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                    thumbColor={settings.soundEnabled && settings.enabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                }
              />

              <SettingRow
                icon={Vibrate}
                title="Vibration"
                subtitle="Vibrate when notification arrives"
                rightElement={
                  <Switch
                    value={settings.vibrationEnabled}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, vibrationEnabled: value }))}
                    disabled={!settings.enabled}
                    trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                    thumbColor={settings.vibrationEnabled && settings.enabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                }
              />
            </View>

            {/* Preview */}
            <View style={[styles.section, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Preview
              </Text>
              <View style={[styles.previewContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.previewTitle, { color: theme.colors.onSurface }]}>
                  🔴 Task Reminder
                </Text>
                <Text style={[styles.previewBody, { color: theme.colors.onSurfaceVariant }]}>
                  "Complete project proposal" starts at 9:30 AM ({settings.reminderMinutes} minutes)
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>
                Save Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  },
  permissionWarning: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  permissionWarningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reminderOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    padding: 24,
    paddingTop: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export { NotificationSettings }