import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, isSignedIn, useAuth } from '../src/providers/AuthProvider';

SplashScreen.preventAutoHideAsync();

// Replaces SplashActivity's "is there a current user?" check and the per-screen redirects in
// OnboardingActivity / LoginActivity.
function AuthGate() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    const signedIn = isSignedIn(user);
    if (!signedIn && !inAuthGroup) router.replace('/onboarding');
    else if (signedIn && inAuthGroup) router.replace('/');
  }, [initializing, user, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AuthGate />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
