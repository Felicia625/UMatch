import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { AI_DAILY_LIMIT, getAiQuotaLeft, loadStarters, Starters } from '../services/starters';
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
  const [left, setLeft] = useState<number | null>(null); // AI requests left today

  useEffect(() => {
    let alive = true;
    (async () => {
      me.current = await getUser(myId).catch(() => null);
      await loadStarters({ matchId, myId, partner, me: me.current, refresh: false }, (s) => alive && setStarters(s));
      if (alive) {
        setBusy(false);
        setLeft(await getAiQuotaLeft(myId));
      }
    })();
    return () => {
      alive = false;
    };
  }, [matchId, myId, partner]);

  async function refresh() {
    setBusy(true);
    setStarters(null); // hide the current ideas while the next ones are being made
    await loadStarters({ matchId, myId, partner, me: me.current, refresh: true }, setStarters);
    setBusy(false);
    setLeft(await getAiQuotaLeft(myId));
  }

  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.outline }]}>
      <View style={styles.header}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>
          Ide pembuka{starters?.source === 'ai' ? ' ✨' : ''}
        </Text>
        <View style={styles.right}>
          {left !== null && (
            <Text style={{ color: left === 0 ? t.danger : t.textSecondary, fontSize: 11 }}>
              {left === 0 ? `Batas pemakaian hari ini habis (0/${AI_DAILY_LIMIT}), reset tengah malam` : `Sisa pemakaian hari ini: ${left}/${AI_DAILY_LIMIT}`}
            </Text>
          )}
          <Pressable onPress={refresh} disabled={busy} hitSlop={10} accessibilityLabel="Ide lain" style={{ opacity: busy ? 0.4 : 1 }}>
            <Ionicons name="refresh" size={20} color={t.primary} />
          </Pressable>
        </View>
      </View>

      {busy && !starters && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={{ color: t.textSecondary, fontSize: 13 }}>AI sedang menyiapkan ide pembuka…</Text>
        </View>
      )}

      {starters?.items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onPick(item)}
          accessibilityRole="button"
          style={[styles.chip, { backgroundColor: t.tint, borderColor: t.primary }]}
        >
          <Text style={{ color: t.text, fontSize: 14 }}>{item}</Text>
        </Pressable>
      ))}

      <Text style={{ color: t.textSecondary, fontSize: 11, marginTop: 2 }}>
        Ketuk untuk memakai, lalu ubah sesukamu sebelum dikirim.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
});
