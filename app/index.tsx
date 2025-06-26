import { View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return <View style={{ flex: 1 }} />;
  }

  // Redirect based on authentication state
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/sign-in" />;
}