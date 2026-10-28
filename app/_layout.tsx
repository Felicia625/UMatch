import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { renderAppHeader } from '../src/components/AppHeader';
import { useThemeSettings } from '../src/constants/theme';
import { AuthProvider, isSignedIn, useAuth } from '../src/providers/AuthProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider';

SplashScreen.preventAutoHideAsync();

// Replaces SplashActivity's "is there a current user?" check and the per-screen redirects in
// OnboardingActivity / LoginActivity.
function AuthGate() {
  const { user, initializing } = useAuth();
  const { theme, darkMode, ready } = useThemeSettings();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing || !ready) return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    const isPublic = inAuthGroup || segments[0] === 'terms'; // Terms are reachable signed in and signed out
    const signedIn = isSignedIn(user);
    if (!signedIn && !isPublic) router.replace('/onboarding');
    else if (signedIn && inAuthGroup) router.replace('/');
  }, [initializing, ready, user, segments, router]);

  return (
    <>
      {/* White icons on the pink title bar (and in dark mode); dark icons only on the light login screens. */}
      <StatusBar style={darkMode || segments[0] !== '(auth)' ? 'light' : 'dark'} />
      <Stack screenOptions={{ header: renderAppHeader, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ title: 'Terms and Conditions' }} />
        <Stack.Screen name="guide" options={{ title: 'Guide' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="profile/[uid]" options={{ title: 'Profile' }} />
        <Stack.Screen name="lists/[kind]" options={{ title: '' }} />
        <Stack.Screen name="chat/[matchId]" options={{ title: 'Chat' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
