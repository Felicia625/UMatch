import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../constants/theme';
import { withLeaveGuard } from '../utils/leaveGuard';

export const SIDE_NAV_WIDTH = 64;

type IconProps = { color: string; size: number; focused: boolean };

export interface RailTab {
  key: string;
  label: string;
  icon: (p: IconProps) => React.ReactNode;
  active: boolean;
  onPress: () => void;
}

/** The three main tabs, for screens outside the tab navigator (Guide, Settings) that still show the rail. */
export const MAIN_TABS = [
  { key: 'index', label: 'Home', path: '/', icon: (p: IconProps) => <Ionicons name="home" color={p.color} size={p.size} /> },
  { key: 'matches', label: 'Matches', path: '/matches', icon: (p: IconProps) => <Ionicons name="chatbubbles" color={p.color} size={p.size} /> },
  { key: 'profile', label: 'Profile', path: '/profile', icon: (p: IconProps) => <Ionicons name="person" color={p.color} size={p.size} /> },
] as const;

/**
 * Desktop navigation rail: logo, the main tabs, a divider, then Guide and Settings. Icons only; the name appears next
 * to the icon while the cursor is over it. `shortcut` marks Guide or Settings as the current page.
 */
export function NavRail({ tabs, shortcut }: { tabs: RailTab[]; shortcut?: 'guide' | 'settings' }) {
  const t = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [hover, setHover] = useState<string | null>(null);

  const hoverProps = (id: string) =>
    Platform.OS === 'web' ? ({ onHoverIn: () => setHover(id), onHoverOut: () => setHover((h) => (h === id ? null : h)) } as object) : {};

  // Guide and Settings replace each other instead of piling up on the stack.
  const openShortcut = (path: '/guide' | '/settings') => {
    if (pathname === path) return;
    if (pathname === '/guide' || pathname === '/settings') router.replace(path);
    else router.push(path);
  };

  function item(id: string, label: string, icon: (color: string) => React.ReactNode, active: boolean, onPress: () => void) {
    return (
      <View key={id} style={[styles.itemWrap, { zIndex: hover === id ? 30 : 1 }]}>
        <Pressable
          onPress={() => withLeaveGuard(onPress)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: active }}
          style={[styles.item, active && { backgroundColor: t.tint }]}
          {...hoverProps(id)}
        >
          {icon(active ? t.primary : t.textSecondary)}
        </Pressable>
        {hover === id && (
          <View style={[styles.tip, { backgroundColor: t.text }]} pointerEvents="none">
            <Text style={{ color: t.background, fontSize: 12, fontWeight: '700' }}>{label}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.rail, { backgroundColor: t.surface, borderRightColor: t.outline, paddingTop: insets.top + 12 }]}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} contentFit="cover" accessibilityLabel="UMatch" />

      {tabs.map((tab) => item(tab.key, tab.label, (color) => tab.icon({ color, size: 24, focused: tab.active }), tab.active, tab.onPress))}

      <View style={[styles.divider, { backgroundColor: t.outline }]} />

      {item('guide', 'Guide', (c) => <Ionicons name="help-circle-outline" size={26} color={c} />, shortcut === 'guide', () => openShortcut('/guide'))}
      {item('settings', 'Settings', (c) => <Ionicons name="settings-outline" size={24} color={c} />, shortcut === 'settings', () => openShortcut('/settings'))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { width: SIDE_NAV_WIDTH, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, gap: 6, zIndex: 20 },
  logo: { width: 40, height: 40, borderRadius: 10, marginBottom: 14 },
  itemWrap: { position: 'relative' },
  item: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 32, height: StyleSheet.hairlineWidth * 2, marginVertical: 8 },
  tip: { position: 'absolute', left: 52, top: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
});
