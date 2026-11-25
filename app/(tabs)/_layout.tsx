import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { WIDE_SCREEN } from '../../src/constants/layout';
import { renderAppHeader } from '../../src/components/AppHeader';
import { SideNav } from '../../src/components/SideNav';
import { useTheme } from '../../src/constants/theme';

// Mirrors the bottom navigation in activity_main.xml: Home, Matches, Profile.
export default function TabsLayout() {
  const t = useTheme();
  const wide = useWindowDimensions().width >= WIDE_SCREEN;
  return (
    <Tabs
      // `tabBar` is a prop of the navigator, not a screen option. Wide screens: a custom icon-only rail (logo, tabs,
      // Guide, Settings). Phones keep the default bottom bar.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tabBar={wide ? (p: any) => <SideNav {...p} /> : undefined}
      screenOptions={{
        headerShown: true,
        // Wide screens: navigation on the left side instead of the bottom bar. Phones keep the bottom bar.
        tabBarPosition: wide ? 'left' : 'bottom',
        // On the rail Guide and Settings live in the navigation, so the title bar does not repeat them.
        header: (p: Parameters<typeof renderAppHeader>[0]) => renderAppHeader(p, wide),
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
