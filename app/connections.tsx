import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { ConnectionGraph } from '../src/components/ConnectionGraph';
import { HEADER_EDGES, Screen } from '../src/components/ui';
import { useTheme } from '../src/constants/theme';
import { useAuth } from '../src/providers/AuthProvider';
import { getMyConnectionsVisible, setConnectionsVisible, syncMyConnections } from '../src/services/connections';

// "My connections": my own graph, and the switch that lets other people see it. Hidden by default.
export default function MyConnections() {
  const t = useTheme();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!user) return;
    syncMyConnections(user.uid).then(() => getMyConnectionsVisible(user.uid)).then(setVisible).catch(() => undefined).finally(() => setLoaded(true));
  }, [user]);

  async function onToggle(next: boolean) {
    if (!user) return;
    setBusy(true);
    try {
      await setConnectionsVisible(user.uid, next);
      setVisible(next);
      setReload((n) => n + 1);
    } catch (e) {
      console.warn('Could not change connection visibility', e);
      Alert.alert("Couldn't change this setting", 'Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={HEADER_EDGES}>
      <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.outline }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>Let others see my connections</Text>
          <Text style={{ color: t.textSecondary, marginTop: 4, lineHeight: 19 }}>
            When this is on, people who view your profile can see who you are connected with. When it is off, nobody else can see
            your connections or draw lines through you. You can always see your own graph.
          </Text>
        </View>
        <Switch
          value={visible}
          onValueChange={onToggle}
          disabled={!loaded || busy}
          trackColor={{ true: t.primary, false: t.outline }}
          thumbColor="#FFFFFF"
        />
      </View>

      {user && <ConnectionGraph viewerId={user.uid} centerId={user.uid} reloadKey={reload} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
});
