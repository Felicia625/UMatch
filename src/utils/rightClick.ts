import { Platform } from 'react-native';

/**
 * On the web a right click does what a long press does on a phone. Spread the result onto a Pressable next to
 * `onLongPress`; it adds nothing on iOS / Android. The browser's own context menu is suppressed.
 */
export function rightClick(handler: () => void): object {
  if (Platform.OS !== 'web') return {};
  return {
    onContextMenu: (e: { preventDefault?: () => void }) => {
      e.preventDefault?.();
      handler();
    },
  };
}
