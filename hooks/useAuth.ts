import { useState, useEffect } from 'react';
import { Session, User, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform, Linking } from 'react-native';

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
          // Normal session handling
          if (mounted) {
            setAuthState({
              user: session?.user ?? null,
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
      
      if (mounted) {
        setAuthState({
          user: session?.user ?? null,
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
    // Determine the redirect URL based on platform
    const redirectTo = Platform.OS === 'web' 
      ? `${window.location.origin}/oauth-callback`
      : 'nowdo://oauth-callback';
      
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: Platform.OS === 'web' 
          ? `${window.location.origin}/(auth)/oauth-callback` 
          : 'nowdo://(auth)/oauth-callback',
        data: {
          full_name: fullName,
        },
        emailRedirectTo: redirectTo,
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
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/oauth-callback`
          : 'https://nowdo-app.vercel.app/oauth-callback';
          
        // Web implementation
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
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
        try {
          const redirectUrl = 'nowdo://oauth-callback';
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
            }
          });
          
          if (error) throw error;
          
          if (data?.url) {
            // Open the URL in the device browser
            await Linking.openURL(data.url);
          }
          
          return { data, error: null };
        } catch (error) {
          console.error('Mobile OAuth error:', error);
          return { 
            data: null, 
            error: { message: 'Google sign-in failed on mobile. Please try again.' } 
          };
        }
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
      ? `${window.location.origin}/oauth-callback`
      : 'nowdo://oauth-callback';
      
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { data, error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithProvider,
    resetPassword,
  };
}