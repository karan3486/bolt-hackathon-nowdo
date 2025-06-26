import { View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  // Handle web-specific redirects
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, loading]);
  if (loading) {
    return <View style={{ flex: 1 }} />;
  }

  // Redirect based on authentication state
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/sign-in" />;
}