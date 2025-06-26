import { useState, useEffect } from 'react';
import { Session, User, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's an error (like invalid refresh token), clear everything
        if (error) {
          console.warn('Session retrieval error:', error.message);
          
          // Clear any stored Supabase tokens only on web
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                localStorage.removeItem(key);
              }
            });
            
            const sessionKeys = Object.keys(sessionStorage);
            sessionKeys.forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                sessionStorage.removeItem(key);
              }
            });
          }
          
          // Set clean auth state
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              loading: false,
            });
          }
        } else {
          // If session exists but user is missing, try to get user directly
          let user = session?.user ?? null;
          
          if (session && !user) {
            try {
              const { data: { user: directUser } } = await supabase.auth.getUser();
              user = directUser;
            } catch (userError) {
              console.warn('Direct user retrieval error:', userError);
            }
          }
          
          // Normal session handling
          if (mounted) {
            setAuthState({
              user,
              session,
              loading: false,
            });
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
          });
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      let user = session?.user ?? null;
      
      // If session exists but user is missing, try to get user directly
      if (session && !user) {
        try {
          const { data: { user: directUser } } = await supabase.auth.getUser();
          user = directUser;
        } catch (userError) {
          console.warn('Direct user retrieval error in auth change:', userError);
        }
      }
      
      if (mounted) {
        setAuthState({
          user,
          session,
          loading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only attempt sign out if there's an active session
      let error = null;
      if (session) {
        const result = await supabase.auth.signOut({ scope: 'global' });
        error = result.error;
      }
      
      // Update auth state immediately to ensure UI reflects the change
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
      
      // Don't return session_not_found errors as they indicate successful cleanup
      const shouldIgnoreError = error && (
        error.message?.includes('session_not_found') ||
        error.message?.includes('Session from session_id claim in JWT does not exist')
      );
      
      return { error: shouldIgnoreError ? null : error };
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Force clear auth state even if sign out fails
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
      
      return { error: null }; // Return success since we've cleared everything
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/(tabs)`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        return { data, error };
      } else {
        // Mobile implementation would require expo-auth-session
        // For now, return an error indicating it's not implemented
        return { 
          data: null, 
          error: { message: 'Google sign-in is currently only available on web. Mobile support coming soon!' } 
        };
      }
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to initialize Google sign-in' } 
      };
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    if (provider === 'google') {
      return signInWithGoogle();
    }
    
    // For other providers, return not implemented error
    return { 
      data: null, 
      error: { message: `${provider} sign-in coming soon!` } 
    };
  };

  const resetPassword = async (email: string) => {
    const redirectTo = Platform.OS === 'web' 
      ? `${window.location.origin}/reset-password`
      : 'nowdo://reset-password';
      
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { data, error };
  };

  // Helper function to ensure user is loaded
  const ensureUser = async (): Promise<User | null> => {
    if (authState.loading) {
      // Wait for auth to finish loading
      return new Promise((resolve) => {
        const checkAuth = () => {
          if (!authState.loading) {
            resolve(authState.user);
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
    }
    
    if (authState.user) {
      return authState.user;
    }
    
    // Try to get user directly from Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.warn('Failed to get user directly:', error);
      return null;
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithProvider,
    resetPassword,
    ensureUser,
  };
}