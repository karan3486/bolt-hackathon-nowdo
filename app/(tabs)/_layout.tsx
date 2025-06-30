import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Modal, Dimensions, Image, Linking } from 'react-native';
import { Chrome as Home, SquareCheck as CheckSquare, Sparkles, Timer, Target, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import MoreMenu from '../../components/MoreMenu';

export default function TabsLayout() {
  const theme = useTheme();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleBoltBadgePress = () => {
    Linking.openURL('https://bolt.new/');
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            borderTopWidth: 1,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            paddingBottom: 20,
            paddingTop: 8,
            height: 82,
          },
          tabBarLabelStyle: {
            fontSize: 0, // Hide labels
            height: 0,
          },
          tabBarIconStyle: {
            marginTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <CheckSquare color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="motivation"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <Sparkles color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="pomodoro"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <Timer color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <Target color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <MoreHorizontal color={color} size={size} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowMoreMenu(true);
            },
          }}
        />
        
        {/* Hidden tabs that are accessible through More menu */}
        <Tabs.Screen
          name="matrix"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>

      <MoreMenu 
        visible={showMoreMenu} 
        onClose={() => setShowMoreMenu(false)} 
      />

      {/* Bolt.new Badge */}
      <TouchableOpacity
        style={styles.boltBadge}
        onPress={handleBoltBadgePress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: 'https://raw.githubusercontent.com/stackblitz/bolt.new/main/public/badge-white-circle.svg' }}
          style={styles.boltBadgeImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  boltBadge: {
    position: 'absolute',
    bottom: 100, // Above the tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  boltBadgeImage: {
    width: 40,
    height: 40,
  },
});