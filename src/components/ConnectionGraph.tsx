import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ActivityIndicator, Modal, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../constants/theme';
import { GraphData, loadGraph } from '../services/connections';
import { Avatar } from './Avatar';

const NODE = 44;
export const DATING_LINE = '#EC4899'; // pink: formed in the default mode
export const FRIEND_LINE = '#F97316'; // orange: formed in Friend first mode
const HIGHLIGHT = '#2563EB'; // blue border: you and the person whose graph this is
const PAD = 40;

interface Placed {
  uid: string;
  x: number;
  y: number;
  level: 0 | 1 | 2;
}

/** Radial layout: the person in the middle, their matches on a ring, matches of those people just outside. */
function layout(data: GraphData): { placed: Placed[]; width: number; height: number } {
  const l1 = data.nodes.filter((n) => n.level === 1);
  const l2 = data.nodes.filter((n) => n.level === 2);
  const r1 = Math.max(110, l1.length * 20);
  const pos = new Map<string, Placed>();
  pos.set(data.nodes[0].uid, { uid: data.nodes[0].uid, x: 0, y: 0, level: 0 });
  const angleOf = new Map<string, number>();
  l1.forEach((n, i) => {
    // Two people would sit exactly opposite each other, so a line between them would run through the middle person and
    // hide behind the other lines. Put them side by side instead (a triangle).
    const a =
      l1.length === 2
        ? (i === 0 ? -5 : -1) * (Math.PI / 6)
        : (2 * Math.PI * i) / Math.max(l1.length, 1) - Math.PI / 2;
    angleOf.set(n.uid, a);
    pos.set(n.uid, { uid: n.uid, x: Math.cos(a) * r1, y: Math.sin(a) * r1, level: 1 });
  });
  const byParent = new Map<string, typeof l2>();
  l2.forEach((n) => byParent.set(n.parent ?? '', [...(byParent.get(n.parent ?? '') ?? []), n]));
  byParent.forEach((kids, parent) => {
    const base = angleOf.get(parent) ?? 0;
    const spread = Math.min(1.2, 0.32 * kids.length);
    const r2 = r1 + 90 + Math.max(0, kids.length - 3) * 10;
    kids.forEach((n, i) => {
      const a = kids.length === 1 ? base : base - spread / 2 + (spread * i) / (kids.length - 1);
      pos.set(n.uid, { uid: n.uid, x: Math.cos(a) * r2, y: Math.sin(a) * r2, level: 2 });
    });
  });
  const all = [...pos.values()];
  const minX = Math.min(...all.map((p) => p.x)) - NODE / 2 - PAD;
  const minY = Math.min(...all.map((p) => p.y)) - NODE / 2 - PAD;
  const maxX = Math.max(...all.map((p) => p.x)) + NODE / 2 + PAD;
  const maxY = Math.max(...all.map((p) => p.y)) + NODE / 2 + PAD;
  return {
    placed: all.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY })),
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** The graph itself: pictures only; long press (right-click / hover on the web) a picture to see the username, tap it to open the profile. */
function GraphCanvas({ data, scale, height, centerId, viewerId, recenter }: { data: GraphData; scale: number; height: number; centerId: string; viewerId: string; recenter: number }) {
  const t = useTheme();
  const router = useRouter();
  const [label, setLabel] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [view, setView] = useState({ w: 0, h: height });
  // Drag to move the graph around (no scroll bars). The offset is clamped so the graph can't be lost off-screen.
  const [off, setOff] = useState({ x: 0, y: 0 });
  const offRef = useRef(off);
  offRef.current = off;
  const start = useRef({ x: 0, y: 0 });
  useEffect(() => setOff({ x: 0, y: 0 }), [recenter]); // the "back to the middle" button
  const sizeRef = useRef({ W: 0, H: 0, vw: 0, vh: 0 });
  const g = useMemo(() => layout(data), [data]);
  const W = g.width * scale;
  const H = g.height * scale;
  const at = useMemo(() => new Map(g.placed.map((p) => [p.uid, p])), [g]);
  const size = NODE * scale;
  sizeRef.current = { W, H, vw: view.w, vh: view.h };
  const pan = useMemo(() => {
    const clamp = (v: number, content: number, viewport: number) => {
      const limit = Math.max(content, viewport) / 2;
      return Math.max(-limit, Math.min(limit, v));
    };
    return PanResponder.create({
      // Take over only once the finger has really moved, so a tap or a long press on a picture still works.
      onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = offRef.current;
      },
      onPanResponderMove: (_e, g) => {
        const { W: w, H: h, vw, vh } = sizeRef.current;
        setOff({ x: clamp(start.current.x + g.dx, w, vw), y: clamp(start.current.y + g.dy, h, vh) });
      },
    });
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  // On the website the username shows while the cursor is over a picture.
  function hover(uid: string | null) {
    if (timer.current) clearTimeout(timer.current);
    setLabel(uid);
  }
  function showLabel(uid: string) {
    setLabel(uid);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLabel(null), 3000);
  }

  return (
    <View
      {...pan.panHandlers}
      style={[{ height, overflow: 'hidden' }, Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none', touchAction: 'none' } as object) : null]}
      onLayout={(e) => setView({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <View style={{ position: 'absolute', width: W, height: H, left: view.w / 2 - W / 2 + off.x, top: view.h / 2 - H / 2 + off.y }}>
        {data.edges.map(({ a, b, friend }) => {
          const p = at.get(a);
          const q = at.get(b);
          if (!p || !q) return null;
          const x1 = p.x * scale;
          const y1 = p.y * scale;
          const x2 = q.x * scale;
          const y2 = q.y * scale;
          const len = Math.hypot(x2 - x1, y2 - y1);
          return (
            <View
              key={`${a}-${b}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (x1 + x2) / 2 - len / 2,
                top: (y1 + y2) / 2 - 1,
                width: len,
                height: 2,
                borderRadius: 1,
                backgroundColor: friend ? FRIEND_LINE : DATING_LINE,
                transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
              }}
            />
          );
        })}
        {g.placed.map((p) => {
          const profile = data.profiles[p.uid];
          const isCenter = p.uid === centerId;
          const mark = isCenter || p.uid === viewerId; // you and the inspected person get the blue border
          return (
            <Pressable
              key={p.uid}
              onPress={() => !isCenter && router.push(`/profile/${p.uid}`)}
              onLongPress={() => showLabel(p.uid)}
              {...(Platform.OS === 'web' ? ({ onHoverIn: () => hover(p.uid), onHoverOut: () => hover(null) } as object) : {})}
              delayLongPress={350}
              accessibilityLabel={profile?.username}
              style={{ position: 'absolute', left: p.x * scale - size / 2, top: p.y * scale - size / 2 }}
            >
              <View style={{ borderRadius: size, borderWidth: mark ? 3 : 2, borderColor: mark ? HIGHLIGHT : t.outline, backgroundColor: t.surface }}>
                <Avatar uri={profile?.photoUrl} name={profile?.username} size={size - (mark ? 6 : 4)} />
              </View>
              {label === p.uid && (
                <View style={[styles.tip, { backgroundColor: t.text, bottom: size + 4 }]}>
                  <Text style={{ color: t.background, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                    {profile?.username}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * "Connections" card: loads the graph for `centerId` (as seen by `viewerId`), with zoom in, zoom out and full screen.
 * `reloadKey` makes it load again (for example after the visibility toggle changed).
 */
export function ConnectionGraph({ viewerId, centerId, username, reloadKey = 0 }: { viewerId: string; centerId: string; username?: string; reloadKey?: number }) {
  const t = useTheme();
  const { height: winH } = useWindowDimensions();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<GraphData | null>(null);
  const [scale, setScale] = useState(1);
  const [recenter, setRecenter] = useState(0);
  const [full, setFull] = useState(false);

  // Full screen on a phone turns the screen to landscape (more room for the graph) and back when closed.
  // The web / desktop build has nothing to rotate.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (full) ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    else ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
  }, [full]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      setData(await loadGraph(viewerId, centerId));
      setState('ready');
    } catch (e) {
      console.warn('Failed to load connections', e);
      setState('error');
    }
  }, [viewerId, centerId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const zoom = (d: number) => setScale((s) => Math.min(2.5, Math.max(0.5, +(s + d).toFixed(2))));
  const hasGraph = state === 'ready' && data && data.nodes.length > 1;

  const body = (h: number) => (
    <>
      {state === 'loading' && <ActivityIndicator color={t.primary} style={{ height: h }} />}
      {state === 'error' && (
        <View style={[styles.note, { height: h }]}>
          <Text style={{ color: t.textSecondary, textAlign: 'center' }}>Could not load connections.</Text>
          <Pressable onPress={load}>
            <Text style={{ color: t.primary, fontWeight: '700', marginTop: 8 }}>Try again</Text>
          </Pressable>
        </View>
      )}
      {state === 'ready' && data && !hasGraph && (
        <View style={[styles.note, { height: h }]}>
          <Ionicons name="git-network-outline" size={64} color={t.textSecondary} style={{ opacity: 0.25 }} />
          <Text style={{ color: t.textSecondary, textAlign: 'center', marginTop: 8 }}>
            {data.hidden ? `${username ?? 'This user'} keeps their connections private.` : 'No connections to show yet.'}
          </Text>
        </View>
      )}
      {hasGraph && data && <GraphCanvas data={data} scale={scale} height={h} centerId={centerId} viewerId={viewerId} recenter={recenter} />}
      {hasGraph && <Legend />}
    </>
  );

  const controls = (inModal: boolean) => (
    <View style={styles.controls}>
      <Ctl icon="locate" label="Back to the center" onPress={() => { setRecenter((n) => n + 1); setScale(1); }} disabled={!hasGraph} />
      <Ctl icon="add" label="Zoom in" onPress={() => zoom(0.25)} disabled={!hasGraph} />
      <Ctl icon="remove" label="Zoom out" onPress={() => zoom(-0.25)} disabled={!hasGraph} />
      <Ctl icon={inModal ? 'contract' : 'expand'} label={inModal ? 'Close full screen' : 'Full screen'} onPress={() => setFull(!inModal)} disabled={!hasGraph && !inModal} />
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.outline }]}>
      <View style={styles.head}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Connections</Text>
        {controls(false)}
      </View>
      {body(300)}
      <Text style={{ color: t.textSecondary, fontSize: 11, textAlign: 'center', paddingBottom: 8 }}>
        {Platform.OS === 'web'
          ? 'Click a picture to open the profile, hover over it to see the username.'
          : 'Tap a picture to open the profile, press and hold to see the username.'}
      </Text>

      <Modal visible={full} animationType="fade" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setFull(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
          <View style={[styles.head, { paddingHorizontal: 16 }]}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>Connections</Text>
            {controls(true)}
          </View>
          {body(Math.max(180, winH - 90))}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function Legend() {
  const t = useTheme();
  const item = (color: string, text: string) => (
    <View style={styles.legendItem}>
      <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ color: t.textSecondary, fontSize: 11 }}>{text}</Text>
    </View>
  );
  return (
    <View style={styles.legend}>
      {item(DATING_LINE, 'Dating mode')}
      {item(FRIEND_LINE, 'Friend first')}
    </View>
  );
}

function Ctl({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[styles.ctl, { backgroundColor: t.surfaceVariant, opacity: disabled ? 0.4 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={t.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginTop: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  controls: { flexDirection: 'row', gap: 8 },
  ctl: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  note: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingTop: 6, paddingBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tip: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, maxWidth: 140, minWidth: 40 },
});
