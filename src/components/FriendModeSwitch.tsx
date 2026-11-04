import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';

/** "Friend first" mode: meet people as friends. Only other friend-mode users are shown, of any gender. */
export function FriendModeSwitch({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.outline }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>🤝 Friend first</Text>
        <Text style={{ color: t.textSecondary, marginTop: 4, lineHeight: 19 }}>
          Looking for friends, not only a partner? You will only see, and be seen by, other people who also turned this on, and
          gender doesn't matter.
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: t.primary, false: t.outline }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
});
