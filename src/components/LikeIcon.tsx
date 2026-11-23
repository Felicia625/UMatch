import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * The "like" icon follows the mode: a heart in the default mode, a handshake in Friend first mode.
 * `filled = false` gives the outline version (not liked yet).
 */
export function LikeIcon({ friend, size, color, filled = true }: { friend: boolean; size: number; color: string; filled?: boolean }) {
  if (friend) return <MaterialCommunityIcons name={filled ? 'handshake' : 'handshake-outline'} size={size} color={color} />;
  return <Ionicons name={filled ? 'heart' : 'heart-outline'} size={size} color={color} />;
}
