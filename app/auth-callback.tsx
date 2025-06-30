import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useAuthMessages } from '../hooks/useAuthMessages';
import AuthMessage from '../components/AuthMessage';

export default function AuthCallbackScreen() {
  const { user, loading } = useAuth();
  const { message, showSuccess, showError, clearMessage } = useAuthMessages();

  useEffect(() => {
    if (!loading) {
      if (user) {
        showSuccess('Authentication successful!');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        showError('Authentication failed. Please try again.');
        setTimeout(() => {
          router.replace('/(auth)/sign-in');
        }, 2000);
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0284C7" />
      <Text style={styles.message}>Completing authentication...</Text>
      {message && (
        <AuthMessage
          message={message.text}
          type={message.type}
          onDismiss={clearMessage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
});