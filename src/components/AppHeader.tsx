import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WIDE_SCREEN } from '../constants/layout';
import { useTheme } from '../constants/theme';
import { isSignedIn, useAuth } from '../providers/AuthProvider';
import { withLeaveGuard } from '../utils/leaveGuard';

// Just the parts of the react-navigation header props we use, so this works for both the Stack and the Tabs.
export interface HeaderProps {
  options: { title?: string; headerTitle?: unknown; headerRight?: unknown };
  route: { name: string };
  back?: unknown;
}

const call = (fn: unknown, arg: unknown): ReactNode =>
  typeof fn === 'function' ? (fn as (a: unknown) => ReactNode)(arg) : null;

/** Passed as `header` to the Stack and Tabs navigators; screens set their title with `title` / `headerTitle` / `headerRight`. */
export function renderAppHeader({ options, route, back }: HeaderProps) {
  const title = typeof options.title === 'string' ? options.title : route.name;
  return (
    <AppHeader
      title={title}
      titleNode={call(options.headerTitle, { children: title, tintColor: '#FFFFFF' })}
      extra={call(options.headerRight, { tintColor: '#FFFFFF', canGoBack: !!back })}
      showBack={!!back}
    />
  );
}

/**
 * Header for the root Stack. A stack screen always shows the back button: after a browser refresh (or when a link is
 * opened directly) the navigation history is gone and `back` is undefined, but the button then goes Home instead.
 */
export function renderStackHeader(props: HeaderProps) {
  return renderAppHeader({ ...props, back: props.back ?? { fallback: true } });
}

/** App-coloured title bar: back button (stack screens), title, screen-specific buttons, help (guide) and settings. */
export function AppHeader({
  title,
  titleNode,
  extra,
  showBack,
}: {
  title: string;
  titleNode?: ReactNode;
  extra?: ReactNode;
  showBack: boolean;
}) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user } = useAuth();
  // On a wide screen Guide and Settings are in the side navigation, so the title bar does not repeat them, and those two
  // pages (reached from the navigation, not from another page) have no back button.
  const wide = useWindowDimensions().width >= WIDE_SCREEN;
  const onRailPage = pathname === '/guide' || pathname === '/settings';
  const signedIn = isSignedIn(user) && !wide; // the Terms screen is also reachable signed out, without the help/settings buttons

  return (
    <View style={{ backgroundColor: t.primary, paddingTop: insets.top }}>
      <View style={styles.bar}>
        {showBack && !(wide && onRailPage) && (
          <Pressable onPress={() => withLeaveGuard(() => (router.canGoBack() ? router.back() : router.replace('/')))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}
        <View style={styles.titleWrap}>
          {titleNode ?? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {extra}
          {/* Guide and Settings never link to each other, so they cannot pile up on the stack. */}
          {signedIn && pathname !== '/guide' && pathname !== '/settings' && (
            <Pressable onPress={() => router.push('/guide')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Guide">
              <Ionicons name="help-circle-outline" size={26} color="#FFFFFF" />
            </Pressable>
          )}
          {signedIn && pathname !== '/guide' && pathname !== '/settings' && (
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16, gap: 14 },
  titleWrap: { flex: 1, justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
});
