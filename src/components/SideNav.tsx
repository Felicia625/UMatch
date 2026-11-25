import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../constants/theme';

export const SIDE_NAV_WIDTH = 64;

// The parts of the react-navigation tab bar props used here (kept local so no extra package import is needed).
interface RouteLike {
  key: string;
  name: string;
}
export interface SideNavProps {
  state: { index: number; routes: RouteLike[] };
  descriptors: Record<string, { options: { title?: string; tabBarLabel?: unknown; tabBarIcon?: unknown } }>;
}

type IconProps = { color: string; size: number; focused: boolean };

/**
 * Desktop navigation: a narrow rail on the left with the logo, the three tabs, a divider, then Guide and Settings.
 * Icons only; the name appears next to the icon while the cursor is over it.
 */
export function SideNav({ state, descriptors }: SideNavProps) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hover, setHover] = useState<string | null>(null);

  const hoverProps = (id: string) =>
    Platform.OS === 'web' ? ({ onHoverIn: () => setHover(id), onHoverOut: () => setHover((h) => (h === id ? null : h)) } as object) : {};

  function item(id: string, label: string, icon: (color: string) => React.ReactNode, active: boolean, onPress: () => void) {
    return (
      <View key={id} style={[styles.itemWrap, { zIndex: hover === id ? 30 : 1 }]}>
        <Pressable
          onPress={onPress}
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

      {state.routes.map((route, i) => {
        const o = descriptors[route.key].options;
        const label = typeof o.tabBarLabel === 'string' ? o.tabBarLabel : (o.title ?? route.name);
        const focused = state.index === i;
        const renderIcon = typeof o.tabBarIcon === 'function' ? (o.tabBarIcon as (p: IconProps) => React.ReactNode) : null;
        return item(
          route.key,
          label,
          (color) => renderIcon?.({ color, size: 24, focused }),
          focused,
          // Navigate by path (the navigation object is not the same in every router version), only if not already there.
          () => {
            if (!focused) router.navigate((route.name === 'index' ? '/' : `/${route.name}`) as never);
          },
        );
      })}

      <View style={[styles.divider, { backgroundColor: t.outline }]} />

      {item('guide', 'Guide', (c) => <Ionicons name="help-circle-outline" size={26} color={c} />, false, () => router.push('/guide'))}
      {item('settings', 'Settings', (c) => <Ionicons name="settings-outline" size={24} color={c} />, false, () => router.push('/settings'))}
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
