import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""

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
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
    redirectTo: getRedirectUrl(),
  },
})