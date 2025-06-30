import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import AuthMessage from '../../components/AuthMessage';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const { user, loading } = useAuth();
  const { message, showSuccess, showError, clearMessage } = useAuthMessages();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const params = useLocalSearchParams();
  
  // Extract token from URL if present
  const token = params.token as string;
  const type = params.type as string;
  
  useEffect(() => {
    // If we have a token, attempt to verify it
    if (token && type === 'email_verification') {
      verifyToken();
    } else {
      setVerifying(false);
    }
    
    // If user is already authenticated, redirect to home
    if (user) {
      showSuccess('Email verified successfully!');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    }
  }, [user, token]);
  
  const verifyToken = async () => {
    setVerifying(true);
    try {
      // The token is automatically processed by Supabase
      // We just need to wait for the auth state to update
      setTimeout(() => {
        if (user) {
          setVerified(true);
          showSuccess('Email verified successfully!');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 2000);
        } else {
          setVerified(false);
          setVerifying(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error verifying email:', error);
      showError('Failed to verify email. Please try again.');
      setVerifying(false);
    }
  };
  
  const handleBoltBadgePress = () => {
    Linking.openURL('https://bolt.new/');
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6750A4" />
          <Text style={styles.loadingText}>Verifying your email...</Text>
        </View>
        
        {message && (
          <AuthMessage
            message={message.text}
            type={message.type}
            onDismiss={clearMessage}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/sign-in')}
        >
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Mail size={48} color="#6750A4" />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </Text>
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            • Check your inbox and spam folder
          </Text>
          <Text style={styles.instructionText}>
            • Click the verification link in the email
          </Text>
          <Text style={styles.instructionText}>
            • You'll be redirected back to the app automatically
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => router.replace('/(auth)/sign-in')}
        >
          <RefreshCw size={20} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>Return to Sign In</Text>
        </TouchableOpacity>
        
        {/* Built with bolt caption */}
        <View style={styles.builtWithBoltContainer}>
          <Text style={styles.builtWithBoltText}>Built with Bolt.new</Text>
          <TouchableOpacity onPress={handleBoltBadgePress} style={styles.boltBadgeButton}>
            <Image
              source={{ uri: 'https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/refs/heads/main/src/public/bolt-badge/black_circle_360x360/black_circle_360x360.png' }}
              style={styles.inlineBoltImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {message && (
        <AuthMessage
          message={message.text}
          type={message.type}
          onDismiss={clearMessage}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#F3F0F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#6750A4',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6750A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  builtWithBoltContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 10,
  },
  builtWithBoltText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  boltBadgeButton: {
    padding: 4,
  },
  inlineBoltImage: {
    width: 40,
    height: 40,
  },
});