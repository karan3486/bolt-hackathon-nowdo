import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUserData } from '../../hooks/useUserData';
import { useAuthMessages } from '../../hooks/useAuthMessages';
import { useAuth } from '../../hooks/useAuth';
import AuthMessage from '../../components/AuthMessage';
import LoadingOverlay from '../../components/LoadingOverlay';
import DateOfBirthPicker from '../../components/DateOfBirthPicker';
import { ArrowLeft, Camera, CreditCard as Edit3, Save, X, User, Mail, Phone, MapPin, Briefcase, Calendar, Upload, Trash2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, uploadProfilePicture, removeProfilePicture, loading, loadProfile } = useUserData();
  const { message, showSuccess, showError, clearMessage } = useAuthMessages();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    location: '',
    profession: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized profile loading
  const memoizedLoadProfile = useCallback(() => {
    if (!profile) {
      loadProfile();
    }
  }, [profile, loadProfile]);

  // Update form data when profile loads - memoized to prevent unnecessary re-renders
  const updateFormData = useCallback(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth || '',
        location: profile.location || '',
        profession: profile.profession || '',
      });
    }
  }, [profile]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await updateProfile(formData);
      setIsEditing(false);
      showSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile. Please try again.');
    }
  }, [formData, validateForm, updateProfile, showSuccess, showError]);

  const handleCancel = useCallback(() => {
    updateFormData();
    setErrors({});
    setIsEditing(false);
  }, [updateFormData]);

  const handleImageUpload = useCallback(() => {
    // Check authentication state more thoroughly
    if (authLoading) {
      showError('Please wait while we verify your authentication.');
      return;
    }

    if (!user?.id) {
      showError('You must be logged in to upload a profile picture.');
      return;
    }

    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      handleMobileImageUpload();
    }
  }, [authLoading, user?.id, showError]);

  // Helper function to determine MIME type from file extension
  const getMimeTypeFromExtension = (uri: string): string => {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg'; // Default fallback
    }
  };

  const handleMobileImageUpload = useCallback(async () => {
    try {
      // Double-check authentication before proceeding
      if (authLoading) {
        showError('Please wait while we verify your authentication.');
        return;
      }

      if (!user?.id) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Create a File-like object for mobile
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        // Determine proper MIME type
        let mimeType = asset.type || getMimeTypeFromExtension(asset.uri);
        
        // Handle the case where iOS returns just "image"
        if (mimeType === 'image') {
          mimeType = getMimeTypeFromExtension(asset.uri);
        }
        
        // Validate MIME type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(mimeType)) {
          showError('Please select a JPG, PNG, WEBP, or GIF image');
          return;
        }
        
        // Create a file with proper extension and MIME type
        const fileExtension = asset.uri.split('.').pop() || 'jpg';
        const fileName = `profile-${Date.now()}.${fileExtension}`;
        
        // Create a proper File object with correct MIME type
        const file = new File([blob], fileName, {
          type: mimeType,
        });

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showError('Image size must be less than 5MB');
          return;
        }

        console.log('Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          originalType: asset.type,
          detectedType: mimeType,
          userId: user.id
        });

        setIsUploading(true);
        try {
          await uploadProfilePicture(file);
          showSuccess('Profile picture updated successfully!');
        } catch (error) {
          console.error('Error uploading image:', error);
          showError('Failed to upload image. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Failed to pick image. Please try again.');
    }
  }, [uploadProfilePicture, showSuccess, showError, user, authLoading]);

  const handleFileSelect = useCallback(async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check authentication state
    if (authLoading) {
      showError('Please wait while we verify your authentication.');
      return;
    }

    if (!user?.id) {
      showError('You must be logged in to upload a profile picture.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showError('Please select a JPG, PNG, WEBP, or GIF image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePicture(file);
      showSuccess('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [uploadProfilePicture, showSuccess, showError, user, authLoading]);

  const handleRemoveImage = useCallback(() => {
    if (authLoading) {
      showError('Please wait while we verify your authentication.');
      return;
    }

    if (!user?.id) {
      showError('You must be logged in to remove a profile picture.');
      return;
    }

    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProfilePicture();
              showSuccess('Profile picture removed successfully!');
            } catch (error) {
              console.error('Error removing image:', error);
              showError('Failed to remove profile picture. Please try again.');
            }
          },
        },
      ]
    );
  }, [removeProfilePicture, showSuccess, showError, user, authLoading]);

  const getInitials = useCallback(() => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
    }
    if (formData.firstName) {
      return formData.firstName.charAt(0).toUpperCase();
    }
    if (formData.email) {
      return formData.email.charAt(0).toUpperCase();
    }
    return 'U';
  }, [formData.firstName, formData.lastName, formData.email]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // Memoized form field update handlers to prevent re-renders
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Memoized input components to prevent unnecessary re-renders - MOVED TO TOP LEVEL
  const renderInputField = useCallback((
    field: string,
    label: string,
    icon: React.ReactNode,
    placeholder: string,
    keyboardType: any = 'default',
    autoCapitalize: any = 'words'
  ) => (
    <View style={styles.inputContainer} key={field}>
      <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      <View style={[
        styles.inputWrapper, 
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: errors[field] ? theme.colors.error : theme.colors.outline 
        }
      ]}>
        {icon}
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          value={formData[field as keyof typeof formData]}
          onChangeText={(text) => handleFieldChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          editable={isEditing}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete="off"
        />
      </View>
      {errors[field] && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors[field]}</Text>}
    </View>
  ), [formData, errors, isEditing, theme.colors, handleFieldChange]);

  // Load profile data when component mounts
  useEffect(() => {
    memoizedLoadProfile();
  }, [memoizedLoadProfile]);

  useEffect(() => {
    updateFormData();
  }, [updateFormData]);

  // Debug authentication state
  useEffect(() => {
    console.log('Profile screen - User authenticated:', !!user);
    console.log('Profile screen - User ID:', user?.id);
    console.log('Profile screen - Auth loading:', authLoading);
  }, [user, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <LoadingOverlay visible={true} message="Loading profile..." />
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            You must be logged in to view your profile.
          </Text>
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={[styles.signInButtonText, { color: theme.colors.onPrimary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Profile
        </Text>
        <TouchableOpacity
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          style={styles.actionButton}
          disabled={loading}
        >
          {isEditing ? (
            <Save size={24} color={theme.colors.primary} />
          ) : (
            <Edit3 size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.content}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              {profile?.profilePictureUrl ? (
                <Image 
                  source={{ uri: profile.profilePictureUrl }}
                  style={styles.profilePicture}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.profileInitials, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.initialsText, { color: theme.colors.onPrimary }]}>
                    {getInitials()}
                  </Text>
                </View>
              )}
              
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.profilePictureActions}>
              <TouchableOpacity
                style={[styles.pictureActionButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleImageUpload}
                disabled={isUploading || authLoading}
                activeOpacity={0.7}
              >
                <Upload size={16} color={theme.colors.onPrimary} />
                <Text style={[styles.pictureActionText, { color: theme.colors.onPrimary }]}>
                  Upload
                </Text>
              </TouchableOpacity>

              {profile?.profilePictureUrl && (
                <TouchableOpacity
                  style={[styles.pictureActionButton, { backgroundColor: theme.colors.errorContainer }]}
                  onPress={handleRemoveImage}
                  disabled={isUploading || authLoading}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color={theme.colors.error} />
                  <Text style={[styles.pictureActionText, { color: theme.colors.error }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                  First Name *
                </Text>
                <View style={[
                  styles.inputWrapper, 
                  { 
                    backgroundColor: theme.colors.surface, 
                    borderColor: errors.firstName ? theme.colors.error : theme.colors.outline 
                  }
                ]}>
                  <User size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.onSurface }]}
                    value={formData.firstName}
                    onChangeText={(text) => handleFieldChange('firstName', text)}
                    placeholder="First name"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    editable={isEditing}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="off"
                  />
                </View>
                {errors.firstName && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.firstName}</Text>}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                  Last Name *
                </Text>
                <View style={[
                  styles.inputWrapper, 
                  { 
                    backgroundColor: theme.colors.surface, 
                    borderColor: errors.lastName ? theme.colors.error : theme.colors.outline 
                  }
                ]}>
                  <User size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.onSurface }]}
                    value={formData.lastName}
                    onChangeText={(text) => handleFieldChange('lastName', text)}
                    placeholder="Last name"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    editable={isEditing}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="off"
                  />
                </View>
                {errors.lastName && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Other Fields */}
            {renderInputField(
              'email',
              'Email Address *',
              <Mail size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />,
              'Email address',
              'email-address',
              'none'
            )}

            {renderInputField(
              'phoneNumber',
              'Phone Number',
              <Phone size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />,
              'Phone number',
              'phone-pad',
              'none'
            )}

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              {isEditing ? (
                <DateOfBirthPicker
                  date={formData.dateOfBirth || ''}
                  onDateChange={(date) => handleFieldChange('dateOfBirth', date)}
                  label="Date of Birth"
                />
              ) : (
                <>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Date of Birth
                  </Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                    <Calendar size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: theme.colors.onSurface }]}>
                      {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Not set'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {renderInputField(
              'location',
              'Location',
              <MapPin size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />,
              'City, Country',
              'default',
              'words'
            )}

            {renderInputField(
              'profession',
              'Profession',
              <Briefcase size={20} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />,
              'Your profession',
              'default',
              'words'
            )}
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <X size={20} color={theme.colors.onSurface} />
                <Text style={[styles.cancelButtonText, { color: theme.colors.onSurface }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Save size={20} color={theme.colors.onPrimary} />
                <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      )}

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
  },
  keyboardView: {
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
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileInitials: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pictureActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pictureActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    gap: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  halfWidth: {
    flex: 0.5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});