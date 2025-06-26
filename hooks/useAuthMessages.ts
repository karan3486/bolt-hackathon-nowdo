import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageType = 'success' | 'error' | 'info';

interface AuthMessage {
  text: string;
  type: MessageType;
  timestamp: number;
}

const MESSAGE_STORAGE_KEY = '@auth_message';
const MESSAGE_DURATION = 5000; // 5 seconds

export function useAuthMessages() {
  const [message, setMessage] = useState<AuthMessage | null>(null);

  // Load persisted message on mount
  useEffect(() => {
    loadPersistedMessage();
  }, []);

  // Auto-dismiss message after duration
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        clearMessage();
      }, MESSAGE_DURATION);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadPersistedMessage = async () => {
    try {
      const storedMessage = await AsyncStorage.getItem(MESSAGE_STORAGE_KEY);
      if (storedMessage) {
        const parsedMessage: AuthMessage = JSON.parse(storedMessage);
        
        // Check if message is still valid (not older than 10 seconds)
        const now = Date.now();
        if (now - parsedMessage.timestamp < 10000) {
          setMessage(parsedMessage);
          // Clear from storage after loading
          await AsyncStorage.removeItem(MESSAGE_STORAGE_KEY);
        } else {
          // Message is too old, remove it
          await AsyncStorage.removeItem(MESSAGE_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading persisted message:', error);
    }
  };

  const showMessage = useCallback(async (text: string, type: MessageType) => {
    const newMessage: AuthMessage = {
      text,
      type,
      timestamp: Date.now(),
    };

    setMessage(newMessage);

    // Persist message for page transitions
    try {
      await AsyncStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(newMessage));
    } catch (error) {
      console.error('Error persisting message:', error);
    }
  }, []);

  const clearMessage = useCallback(async () => {
    setMessage(null);
    try {
      await AsyncStorage.removeItem(MESSAGE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing persisted message:', error);
    }
  }, []);

  const showSuccess = useCallback((text: string) => {
    showMessage(text, 'success');
  }, [showMessage]);

  const showError = useCallback((text: string) => {
    showMessage(text, 'error');
  }, [showMessage]);

  const showInfo = useCallback((text: string) => {
    showMessage(text, 'info');
  }, [showMessage]);

  return {
    message,
    showMessage,
    showSuccess,
    showError,
    showInfo,
    clearMessage,
  };
}