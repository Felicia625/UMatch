import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WIDE_SCREEN } from '../constants/layout';
import { useTheme } from '../constants/theme';
import { MAIN_TABS, NavRail, RailTab } from './SideNav';

/**
 * For screens outside the tabs that are reached from the navigation rail (Guide, Settings). On a wide screen the rail
 * stays on the left, with the page title bar next to it and no back button; on a phone nothing changes.
 */
export function DesktopFrame({ title, active, children }: { title: string; active: 'guide' | 'settings'; children: React.ReactNode }) {
  const t = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= WIDE_SCREEN;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !wide });
  }, [navigation, wide]);

  if (!wide) return <>{children}</>;

  const tabs: RailTab[] = MAIN_TABS.map((m) => ({
    key: m.key,
    label: m.label,
    icon: m.icon,
    active: false,
    onPress: () => router.navigate(m.path as never),
  }));
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.background }}>
      <NavRail tabs={tabs} shortcut={active} />
      <View style={{ flex: 1 }}>
        <View style={[styles.bar, { backgroundColor: t.primary, paddingTop: insets.top, height: 56 + insets.top }]}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { justifyContent: 'center', paddingHorizontal: 20 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
});
