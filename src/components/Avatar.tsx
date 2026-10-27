import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useTheme } from '../constants/theme';

export function Avatar({ uri, name, size = 48 }: { uri?: string; name?: string; size?: number }) {
  const t = useTheme();
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.textSecondary, fontSize: size * 0.4, fontWeight: '700' }}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}
