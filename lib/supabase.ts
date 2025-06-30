import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""

// Determine the redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    // For web, use the current origin or a fixed production URL
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/oauth-callback`
      : 'https://nowdo-app.vercel.app/oauth-callback';
  } else {
    // For native platforms, use the app scheme
    return 'nowdo://oauth-callback';
  }
};

// Determine the redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    // For web, use the current origin
    return typeof window !== 'undefined' ? `${window.location.origin}/(auth)/oauth-callback` : '';
  } else {
    // For native, use deep linking scheme
    return 'nowdo://(auth)/oauth-callback';
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    onAuthStateChange: (event, session) => {
      console.log('Supabase auth event:', event);
    },
    url: supabaseUrl,
    cookieOptions: {
      name: 'sb-auth',
      lifetime: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      secure: true,
    },
    flowType: 'pkce',
    redirectTo: getRedirectUrl(),
  },
})