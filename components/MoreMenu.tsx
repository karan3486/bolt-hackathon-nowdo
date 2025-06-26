import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { 
  Grid3x3,
  Calendar,
  X,
  ChevronRight,
  User,
  Settings,
  Database,
  LogOut,
  Sparkles
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface MoreMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function MoreMenu({ visible, onClose }: MoreMenuProps) {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { profile, loadProfile } = useUserData();

  // Load profile when menu becomes visible
  React.useEffect(() => {
    if (visible && !profile) {
      loadProfile();
    }
  }, [visible, profile, loadProfile]);

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    }
    if (profile?.firstName) {
      return profile.firstName.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'U';
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

  const moreMenuItems = [
    {
      id: 'matrix',
      title: 'Priority Matrix',
      icon: Grid3x3,
      route: '/(tabs)/matrix',
      description: 'Organize tasks using the Eisenhower Matrix',
      color: '#9C27B0'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      route: '/(tabs)/calendar',
      description: 'View tasks and habits in calendar format',
      color: '#2196F3'
    }
  ];

  const settingsItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      action: () => {
        onClose();
        setTimeout(() => {
          router.push('/(tabs)/settings');
        }, 100);
      },
      description: 'App preferences and configuration',
      color: '#6B7280'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: Database,
      action: () => {
        // TODO: Navigate to data management
        console.log('Navigate to data management');
      },
      description: 'Export, import, and manage your data',
      color: '#059669'
    }
  ];

  const handleMenuItemPress = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleProfilePress = () => {
    onClose();
    setTimeout(() => {
      router.push('/(tabs)/profile' as any);
    }, 100);
  };

  const handleSignOut = async () => {
    onClose();
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[styles.moreMenu, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.menuHeader}>
            <View style={styles.dragIndicator} />
            <View style={styles.headerContent}>
              <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                More Options
              </Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Section */}
          <TouchableOpacity
            style={[styles.profileSection, { backgroundColor: theme.colors.background }]}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.profileContent}>
              <View style={styles.profileImageContainer}>
                {profile?.profilePictureUrl ? (
                  <Image 
                    source={{ uri: profile.profilePictureUrl }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={[styles.profileInitials, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.initialsText, { color: theme.colors.onPrimary }]}>
                      {getInitials()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  {getDisplayName()}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}>
                  {profile?.email || 'View Profile'}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Features
            </Text>
            {moreMenuItems.map((item, index) => {
              const IconComponent = item.icon;
              const isLast = index === moreMenuItems.length - 1;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem, 
                    !isLast && { borderBottomColor: theme.colors.outlineVariant, borderBottomWidth: 1 }
                  ]}
                  onPress={() => handleMenuItemPress(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: item.color + '15' }]}>
                    <IconComponent size={24} color={item.color} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.onSurface }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuItemDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {item.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Settings Items */}
          <View style={styles.menuItems}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Settings
            </Text>
            {settingsItems.map((item, index) => {
              const IconComponent = item.icon;
              const isLast = index === settingsItems.length - 1;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem, 
                    !isLast && { borderBottomColor: theme.colors.outlineVariant, borderBottomWidth: 1 }
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: item.color + '15' }]}>
                    <IconComponent size={24} color={item.color} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.onSurface }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuItemDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {item.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: theme.colors.errorContainer }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={theme.colors.error} />
            <Text style={[styles.signOutText, { color: theme.colors.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.menuFooter}>
            <Text style={[styles.menuFooterText, { color: theme.colors.onSurfaceVariant }]}>
              NowDo - Your Productivity Companion
            </Text>
            <Text style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  moreMenu: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  menuHeader: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  profileSection: {
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInitials: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  menuItems: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuFooter: {
    padding: 24,
    paddingTop: 0,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
  },
  menuFooterText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
  },
});