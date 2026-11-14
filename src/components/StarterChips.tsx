import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { loadStarters, Starters } from '../services/starters';
import { getUser } from '../services/users';
import { UserProfile } from '../types';

/** "Ide pembuka": tap an idea to put it in the message box (it is not sent until the user presses send). */
export function StarterChips({
  matchId,
  myId,
  partner,
  onPick,
}: {
  matchId: string;
  myId: string;
  partner: UserProfile;
  onPick: (text: string) => void;
}) {
  const t = useTheme();
  const [starters, setStarters] = useState<Starters | null>(null);
  const [busy, setBusy] = useState(true);
  const me = useRef<UserProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      me.current = await getUser(myId).catch(() => null);
      await loadStarters({ matchId, myId, partner, me: me.current, refresh: false }, (s) => alive && setStarters(s));
      if (alive) setBusy(false);
    })();
    return () => {
      alive = false;
    };
  }, [matchId, myId, partner]);

  async function refresh() {
    setBusy(true);
    await loadStarters({ matchId, myId, partner, me: me.current, refresh: true }, setStarters);
    setBusy(false);
  }

  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.outline }]}>
      <View style={styles.header}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>
          Ide pembuka{starters?.source === 'ai' ? ' ✨' : ''}
        </Text>
        <Pressable onPress={refresh} disabled={busy} hitSlop={10} accessibilityLabel="Ide lain" style={{ opacity: busy ? 0.4 : 1 }}>
          {busy && !starters ? (
            <ActivityIndicator size="small" color={t.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={t.primary} />
          )}
        </Pressable>
      </View>

      {starters?.items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onPick(item)}
          accessibilityRole="button"
          style={[styles.chip, { backgroundColor: t.lightPink, borderColor: t.primary }]}
        >
          <Text style={{ color: '#212121', fontSize: 14 }}>{item}</Text>
        </Pressable>
      ))}

      <Text style={{ color: t.textSecondary, fontSize: 11, marginTop: 2 }}>
        {busy && starters ? 'Mencari ide yang lebih cocok…' : 'Ketuk untuk memakai, lalu ubah sesukamu sebelum dikirim.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
});
