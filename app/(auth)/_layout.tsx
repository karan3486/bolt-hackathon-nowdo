import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="oauth-callback" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}