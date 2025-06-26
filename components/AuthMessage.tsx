import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Check, X, CircleAlert as AlertCircle, Info } from 'lucide-react-native';
import { MessageType } from '../hooks/useAuthMessages';

const { width } = Dimensions.get('window');

interface AuthMessageProps {
  message: string;
  type: MessageType;
  onDismiss: () => void;
}

export default function AuthMessage({ message, type, onDismiss }: AuthMessageProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getMessageConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: <Check size={20} color="#FFFFFF" strokeWidth={2.5} />,
          textColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: <AlertCircle size={20} color="#FFFFFF" strokeWidth={2.5} />,
          textColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: <Info size={20} color="#FFFFFF" strokeWidth={2.5} />,
          textColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#6B7280',
          icon: <Info size={20} color="#FFFFFF" strokeWidth={2.5} />,
          textColor: '#FFFFFF',
        };
    }
  };

  const config = getMessageConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {config.icon}
        </View>
        <Text style={[styles.message, { color: config.textColor }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <X size={18} color={config.textColor} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },
});