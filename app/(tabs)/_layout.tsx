import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { renderAppHeader } from '../../src/components/AppHeader';
import { useTheme } from '../../src/constants/theme';

// Mirrors the bottom navigation in activity_main.xml: Home, Matches, Profile.
export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: renderAppHeader,
        tabBarActiveTintColor: t.primary,
        // Without this the inactive icons and labels use the navigation library's light-theme colour (dark grey),
        // which is nearly invisible on the dark tab bar.
        tabBarInactiveTintColor: t.textSecondary,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.outline },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}
