import { usePathname, useRouter } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';
import { WIDE_SCREEN } from '../constants/layout';
import { useTheme } from '../constants/theme';
import { isSignedIn, useAuth } from '../providers/AuthProvider';
import { MAIN_TABS, NavRail, RailTab } from './SideNav';

/** Which rail item a route belongs to (Edit Profile, the likes lists and My connections hang off Profile; a chat off Matches). */
function activeKey(pathname: string): 'index' | 'matches' | 'profile' | 'guide' | 'settings' | null {
  if (pathname === '/' || pathname === '/index') return 'index';
  if (pathname.startsWith('/matches') || pathname.startsWith('/chat')) return 'matches';
  if (pathname === '/profile' || pathname === '/profile/edit' || pathname.startsWith('/lists') || pathname.startsWith('/connections')) return 'profile';
  if (pathname.startsWith('/guide')) return 'guide';
  if (pathname.startsWith('/settings')) return 'settings';
  return null; // another person's profile, Terms, ...
}

/**
 * Desktop only: the navigation rail stays on the left for every screen once signed in (tabs and stack screens alike),
 * with the screen and its title bar to the right. Phones and the sign-in screens are untouched.
 */
export function DesktopShell({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const wide = useWindowDimensions().width >= WIDE_SCREEN;
  if (!wide || !isSignedIn(user)) return <>{children}</>;

  const active = activeKey(pathname);
  const tabs: RailTab[] = MAIN_TABS.map((m) => ({
    key: m.key,
    label: m.label,
    icon: m.icon,
    active: active === m.key,
    onPress: () => {
      if (active !== m.key || pathname !== m.path) router.navigate(m.path as never);
    },
  }));
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.background }}>
      <NavRail tabs={tabs} shortcut={active === 'guide' || active === 'settings' ? active : undefined} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
