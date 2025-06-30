import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import AuthMessage from '../../components/AuthMessage';

export default function OAuthCallbackScreen() {
  const { user, loading } = useAuth();
  const { message, showSuccess, showError, clearMessage } = useAuthMessages();
  const params = useLocalSearchParams();
  
  // Handle access token from URL if present
  useEffect(() => {
    if (params.access_token) {
      console.log('Access token detected in URL, handling auth callback');
      // The auth system will automatically handle this token
    }
  }, [params]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        showSuccess('Successfully authenticated!');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        showError('Authentication failed or was cancelled. Please try again.');
        setTimeout(() => {
          router.replace('/(auth)/sign-in');
        }, 2000);
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#0284C7" />}
      <Text style={styles.message}>
        {loading ? 'Completing authentication...' : 'Redirecting...'}
      </Text>
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