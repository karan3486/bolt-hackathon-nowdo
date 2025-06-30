import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useColorScheme, Platform } from 'react-native';
import { store } from '../store';
import { lightTheme, darkTheme } from '../constants/theme';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { loadTasksFromDatabase } from '../store/slices/tasksSlice';
import { loadHabitsFromDatabase } from '../store/slices/habitsSlice';
import { loadSessionsFromDatabase } from '../store/slices/pomodoroSlice';
import { setThemeMode } from '../store/slices/themeSlice';
import { DatabaseService } from '../lib/database';
import Purchases from 'react-native-purchases';

// RevenueCat Configuration
const configureRevenueCat = async () => {
  try {
    if (Platform.OS === 'ios') {
      // Replace with your iOS API key from RevenueCat dashboard
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'sk_ZAaAuVngjbpbshRuJlHeXvvFTPqGG',
      });
    } else if (Platform.OS === 'android') {
      // Replace with your Android API key from RevenueCat dashboard
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'sk_ZAaAuVngjbpbshRuJlHeXvvFTPqGG',
      });
    } else {
      // Web platform - RevenueCat doesn't support web
      console.log('RevenueCat: Web platform detected, skipping configuration');
      return;
    }

    console.log('RevenueCat configured successfully for platform:', Platform.OS);
    
    // Verify configuration
    const isConfigured = await Purchases.isConfigured();
    console.log('RevenueCat configuration verified:', isConfigured);
    
    // Get initial customer info and offerings
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const offerings = await Purchases.getOfferings();
      console.log('RevenueCat: Initial customer info:', customerInfo);
      console.log('RevenueCat: Initial offerings:', offerings);
      
      // Log available offerings for debugging
      if (offerings.all) {
        Object.values(offerings.all).forEach(offering => {
          console.log(`Offering "${offering.identifier}" has ${offering.availablePackages.length} packages`);
          offering.availablePackages.forEach(pkg => {
            console.log(`  - Package: ${pkg.identifier}, Price: ${pkg.product.priceString}`);
          });
        });
      }
    } catch (error) {
      console.error('RevenueCat: Error fetching initial data:', error);
    }
    
  } catch (error) {
    console.error('RevenueCat configuration error:', error);
  }
};

function ThemedApp() {
  const colorScheme = useColorScheme();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const { user, loading, signOut } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Get current navigation state and segments for better navigation control
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  
  // Initialize user data when user is authenticated
  const { 
    tasks, 
    habits, 
    habitCompletions, 
    pomodoroSessions, 
    loading: dataLoading 
  } = useUserData({ autoLoad: true });

  // Configure RevenueCat on app start
  useEffect(() => {
    if (Platform.OS !== 'web') {
      configureRevenueCat();
    }
  }, []);

  // Load user settings and apply theme
  useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.id) {
        try {
          const settings = await DatabaseService.getUserSettings(user.id);
          if (settings?.theme_preference) {
            dispatch(setThemeMode(settings.theme_preference));
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
          // Use default dark theme if settings can't be loaded
          dispatch(setThemeMode('dark'));
        }
      } else {
        // Set dark theme as default for non-authenticated users
        dispatch(setThemeMode('dark'));
      }
    };

    loadUserSettings();
  }, [user?.id, dispatch]);

  // Sync database data with Redux store when data loads
  useEffect(() => {
    if (!dataLoading && user && tasks.length >= 0) {
      dispatch(loadTasksFromDatabase(tasks));
    }
  }, [tasks, dataLoading, user, dispatch]);

  useEffect(() => {
    if (!dataLoading && user && habits.length >= 0) {
      dispatch(loadHabitsFromDatabase({ habits, completions: habitCompletions }));
    }
  }, [habits, habitCompletions, dataLoading, user, dispatch]);

  useEffect(() => {
    if (!dataLoading && user && pomodoroSessions.length >= 0) {
      dispatch(loadSessionsFromDatabase(pomodoroSessions));
    }
  }, [pomodoroSessions, dataLoading, user, dispatch]);
  
  const [isDark, setIsDark] = useState(() => {
    if (themeMode === 'system') {
      return colorScheme === 'dark';
    }
    return themeMode === 'dark';
  });

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(colorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, colorScheme]);

  // Handle navigation only once when auth state is determined
  // This is a more robust approach that works with deep linking
  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key || loading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!hasNavigated) {
      if (!user) {
        // Handle web-specific redirects on web platform
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const currentHash = window.location.hash;
          
          // Check if we have an access token in the URL hash
          const hasAccessToken = currentHash.includes('access_token=');
          
          // Check if we're on an auth path
          const isAuthPath = 
            currentPath.includes('/sign-in') || 
        // If we're not in the auth group, redirect to sign-in
        if (!inAuthGroup) {
          // Clear any invalid tokens to prevent refresh token errors
          signOut();
          router.replace('/(auth)/sign-in');
        }
      } else {
        // If we're in the auth group but user is authenticated, redirect to main app
        if (inAuthGroup) {
          router.replace('/(tabs)');
        }
      }
      setHasNavigated(true);
    }
  }, [user, segments, navigationState?.key, loading, hasNavigated, signOut]);

  // Reset navigation flag when user changes (for logout scenarios)
  useEffect(() => {
    if (!loading) {
      setHasNavigated(false);
    }
  }, [user?.id, loading]);

  const theme = isDark ? darkTheme : lightTheme;

  // Show loading screen while checking auth state
  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}