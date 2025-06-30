import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import AuthMessage from '../../components/AuthMessage';

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const { message, showSuccess, showError, clearMessage } = useAuthMessages();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  
  // Get token from URL params
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  useEffect(() => {
    // Check if we have a token
    if (!token) {
      showError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);
  
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Weak', color: '#EF4444' };
      case 2:
      case 3:
        return { text: 'Medium', color: '#F59E0B' };
      case 4:
      case 5:
        return { text: 'Strong', color: '#10B981' };
      default:
        return { text: '', color: '#6B7280' };
    }
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setError('');
    
    // Validate password
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // The token is automatically extracted from the URL by Supabase
      const { error } = await updatePassword(password);
      
      if (error) {
        showError(`Password reset failed: ${error.message}`);
      } else {
        showSuccess('Password has been reset successfully!');
        setResetComplete(true);
        
        // Redirect to sign in after a delay
        setTimeout(() => {
          router.replace('/(auth)/sign-in');
        }, 3000);
      }
    } catch (error) {
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBoltBadgePress = () => {
    Linking.openURL('https://bolt.new/');
  };
  
  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthInfo = getPasswordStrengthText(passwordStrength);

  if (resetComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <Shield size={32} color="#10B981" />
            </View>
            <Text style={styles.title}>Password Reset Complete</Text>
            <Text style={styles.subtitle}>
              Your password has been successfully reset. You can now sign in with your new password.
            </Text>
          </View>

          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity style={styles.signInButton}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
          
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity style={styles.backButtonTop}>
              <ArrowLeft size={24} color="#6B7280" />
            </TouchableOpacity>
          </Link>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock size={48} color="#6750A4" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below to reset your account password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={[styles.inputWrapper, error && styles.inputError]}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              
              {password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              level <= passwordStrength
                                ? passwordStrengthInfo.color
                                : '#E5E7EB',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrengthInfo.color }]}>
                    {passwordStrengthInfo.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputWrapper, error && styles.inputError]}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Remember your password? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
            
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
        </ScrollView>
      </KeyboardAvoidingView>
      
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  backButtonTop: {
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
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
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
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 12,
    gap: 2,
  },
  strengthSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#6750A4',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6750A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signInButton: {
    backgroundColor: '#6750A4',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6750A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '600',
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