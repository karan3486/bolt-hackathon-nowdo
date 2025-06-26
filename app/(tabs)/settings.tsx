import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  Mail, 
  Smartphone, 
  Globe, 
  Shield, 
  Database, 
  Volume2, 
  Vibrate, 
  User, 
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  Palette,
  Languages,
  Lock,
  HardDrive,
  Speaker,
  ArrowLeft
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../hooks/useUserData';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import { setThemeMode } from '../../store/slices/themeSlice';
import { RootState } from '../../store';
import AuthMessage from '../../components/AuthMessage';
import LoadingOverlay from '../../components/LoadingOverlay';
import DataManagementModal from '../../components/DataManagementModal';

interface UserSettings {
  id?: string;
  userId: string;
  themePreference: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  privacyAnalytics: boolean;
  privacyCrashReports: boolean;
  autoBackup: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, signOut } = useAuth();
  const { profile, loadProfile } = useUserData();
  const { message, showSuccess, showError, clearMessage } = useAuthMessages();
  
  const [settings, setSettings] = useState<UserSettings>({
    userId: user?.id || '',
    themePreference: 'dark',
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    language: 'en',
    privacyAnalytics: true,
    privacyCrashReports: true,
    autoBackup: true,
    soundEffects: true,
    hapticFeedback: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const currentTheme = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    if (user?.id) {
      loadUserSettings();
      if (!profile) {
        loadProfile();
      }
    }
  }, [user?.id]);

  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          themePreference: data.theme_preference,
          notificationsEnabled: data.notifications_enabled,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          language: data.language,
          privacyAnalytics: data.privacy_analytics,
          privacyCrashReports: data.privacy_crash_reports,
          autoBackup: data.auto_backup,
          soundEffects: data.sound_effects,
          hapticFeedback: data.haptic_feedback,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
        
        // Update Redux theme state
        dispatch(setThemeMode(data.theme_preference));
      } else {
        // Create default settings if none exist
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          theme_preference: 'dark',
          notifications_enabled: true,
          email_notifications: true,
          push_notifications: true,
          language: 'en',
          privacy_analytics: true,
          privacy_crash_reports: true,
          auto_backup: true,
          sound_effects: true,
          haptic_feedback: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          themePreference: data.theme_preference,
          notificationsEnabled: data.notifications_enabled,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          language: data.language,
          privacyAnalytics: data.privacy_analytics,
          privacyCrashReports: data.privacy_crash_reports,
          autoBackup: data.auto_backup,
          soundEffects: data.sound_effects,
          hapticFeedback: data.haptic_feedback,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          theme_preference: updates.themePreference,
          notifications_enabled: updates.notificationsEnabled,
          email_notifications: updates.emailNotifications,
          push_notifications: updates.pushNotifications,
          language: updates.language,
          privacy_analytics: updates.privacyAnalytics,
          privacy_crash_reports: updates.privacyCrashReports,
          auto_backup: updates.autoBackup,
          sound_effects: updates.soundEffects,
          haptic_feedback: updates.hapticFeedback,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings(prev => ({ ...prev, ...updates }));
        showSuccess('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    const updates = { themePreference: newTheme };
    setSettings(prev => ({ ...prev, ...updates }));
    dispatch(setThemeMode(newTheme));
    updateSettings(updates);
  };

  const handleToggleSetting = (key: keyof UserSettings, value: boolean) => {
    const updates = { [key]: value };
    setSettings(prev => ({ ...prev, ...updates }));
    updateSettings(updates);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              showError('Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getDisplayName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile?.firstName) {
      return profile.firstName;
    }
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
    return 'User';
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
        {children}
      </View>
    </View>
  );

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    showChevron = false 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.outlineVariant }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
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
        {showChevron && (
          <ChevronRight size={16} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  const ThemeSelector = () => (
    <View style={styles.themeSelector}>
      {[
        { key: 'light', label: 'Light', icon: Sun },
        { key: 'dark', label: 'Dark', icon: Moon },
        { key: 'system', label: 'System', icon: Monitor },
      ].map(({ key, label, icon: Icon }) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.themeOption,
            {
              backgroundColor: settings.themePreference === key 
                ? theme.colors.primary + '15' 
                : theme.colors.surfaceVariant,
              borderColor: settings.themePreference === key 
                ? theme.colors.primary 
                : 'transparent',
            }
          ]}
          onPress={() => handleThemeChange(key as 'light' | 'dark' | 'system')}
          activeOpacity={0.7}
        >
          <Icon 
            size={20} 
            color={settings.themePreference === key ? theme.colors.primary : theme.colors.onSurfaceVariant} 
          />
          <Text style={[
            styles.themeOptionText,
            {
              color: settings.themePreference === key ? theme.colors.primary : theme.colors.onSurfaceVariant,
              fontWeight: settings.themePreference === key ? '600' : '400',
            }
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <SettingSection title="Profile">
          <SettingRow
            icon={User}
            title={getDisplayName()}
            subtitle={profile?.email || user?.email || 'Manage your profile'}
            onPress={() => router.push('/(tabs)/profile' as any)}
            showChevron
          />
        </SettingSection>

        {/* Appearance Section */}
        <SettingSection title="Appearance">
          <View style={styles.themeContainer}>
            <View style={styles.themeHeader}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Palette size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.onSurface }]}>
                  Theme
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Choose your preferred theme
                </Text>
              </View>
            </View>
            <ThemeSelector />
          </View>
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications">
          <SettingRow
            icon={Bell}
            title="Push Notifications"
            subtitle="Receive notifications on your device"
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => handleToggleSetting('notificationsEnabled', value)}
                trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                thumbColor={settings.notificationsEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            }
          />
          <SettingRow
            icon={Mail}
            title="Email Notifications"
            subtitle="Receive updates via email"
            rightElement={
              <Switch
                value={settings.emailNotifications}
                onValueChange={(value) => handleToggleSetting('emailNotifications', value)}
                trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                thumbColor={settings.emailNotifications ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            }
          />
          {Platform.OS !== 'web' && (
            <SettingRow
              icon={Smartphone}
              title="Mobile Notifications"
              subtitle="App notifications on mobile"
              rightElement={
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={(value) => handleToggleSetting('pushNotifications', value)}
                  trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                  thumbColor={settings.pushNotifications ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              }
            />
          )}
        </SettingSection>

        {/* Privacy & Security Section */}
        <SettingSection title="Privacy & Security">
          <SettingRow
            icon={Shield}
            title="Analytics"
            subtitle="Help improve the app with usage data"
            rightElement={
              <Switch
                value={settings.privacyAnalytics}
                onValueChange={(value) => handleToggleSetting('privacyAnalytics', value)}
                trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                thumbColor={settings.privacyAnalytics ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            }
          />
          <SettingRow
            icon={Lock}
            title="Crash Reports"
            subtitle="Send crash reports to help fix bugs"
            rightElement={
              <Switch
                value={settings.privacyCrashReports}
                onValueChange={(value) => handleToggleSetting('privacyCrashReports', value)}
                trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                thumbColor={settings.privacyCrashReports ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            }
          />
        </SettingSection>

        {/* Data & Storage Section */}
        <SettingSection title="Data & Storage">
          <SettingRow
            icon={HardDrive}
            title="Auto Backup"
            subtitle="Automatically backup your data"
            rightElement={
              <Switch
                value={settings.autoBackup}
                onValueChange={(value) => handleToggleSetting('autoBackup', value)}
                trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                thumbColor={settings.autoBackup ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            }
          />
          <SettingRow
            icon={Database}
            title="Data Management"
            subtitle="Export, import, and manage your data"
            onPress={() => setShowDataModal(true)}
            showChevron
          />
        </SettingSection>

        {/* Audio & Haptics Section */}
        {Platform.OS !== 'web' && (
          <SettingSection title="Audio & Haptics">
            <SettingRow
              icon={Speaker}
              title="Sound Effects"
              subtitle="Play sounds for interactions"
              rightElement={
                <Switch
                  value={settings.soundEffects}
                  onValueChange={(value) => handleToggleSetting('soundEffects', value)}
                  trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                  thumbColor={settings.soundEffects ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              }
            />
            <SettingRow
              icon={Vibrate}
              title="Haptic Feedback"
              subtitle="Feel vibrations for interactions"
              rightElement={
                <Switch
                  value={settings.hapticFeedback}
                  onValueChange={(value) => handleToggleSetting('hapticFeedback', value)}
                  trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '40' }}
                  thumbColor={settings.hapticFeedback ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              }
            />
          </SettingSection>
        )}

        {/* Account Section */}
        <SettingSection title="Account">
          <SettingRow
            icon={LogOut}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            rightElement={
              <ChevronRight size={16} color={theme.colors.error} />
            }
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.colors.onSurfaceVariant }]}>
            NowDo v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: theme.colors.onSurfaceVariant }]}>
            Made with ❤️ for productivity
          </Text>
        </View>
      </ScrollView>

      {/* Data Management Modal */}
      <DataManagementModal
        visible={showDataModal}
        onClose={() => setShowDataModal(false)}
      />

      {message && (
        <AuthMessage
          message={message.text}
          type={message.type}
          onDismiss={clearMessage}
        />
      )}

      <LoadingOverlay visible={loading} message="Updating settings..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  themeContainer: {
    padding: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});