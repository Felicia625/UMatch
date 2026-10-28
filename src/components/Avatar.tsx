import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../constants/theme';

/** Grey box with a person icon, shown wherever a user has not set a profile picture yet. */
export function PersonPlaceholder({ style, iconSize }: { style?: StyleProp<ViewStyle>; iconSize: number }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.surfaceVariant, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name="person" size={iconSize} color={t.textSecondary} />
    </View>
  );
}

export function Avatar({ uri, size = 48 }: { uri?: string; name?: string; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return <PersonPlaceholder style={{ width: size, height: size, borderRadius: size / 2 }} iconSize={Math.round(size * 0.55)} />;
}
