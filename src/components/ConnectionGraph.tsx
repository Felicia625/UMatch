import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ActivityIndicator, GestureResponderEvent, Modal, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../constants/theme';
import { GraphData, loadGraph } from '../services/connections';
import { createSim, shortestPath } from '../utils/forceLayout';
import { Avatar } from './Avatar';

const TIP_W = 200; // width available for the username bubble above a picture
export const DATING_LINE = '#EC4899'; // pink: formed in the default mode
export const FRIEND_LINE = '#F97316'; // orange: formed in Friend first mode
const HIGHLIGHT = '#2563EB'; // blue border: you and the person whose graph this is
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const HOLD_MS = 400; // holding a picture this long shows the name instead of opening the profile

/** Picture size follows the number of connections: more connections, bigger picture. */
const sizeFor = (connections: number) => 30 + Math.min(connections, 8) * 4;

/** Starting points for the physics: the person in the middle, matches on a ring, their matches a bit further out. */
function seedsFor(data: GraphData, sizeOf: (id: string) => number) {
  const at = (id: string, x: number, y: number) => ({ id, x, y, r: sizeOf(id) / 2 });
  const seeds = [at(data.nodes[0].uid, 0, 0)];
  const l1 = data.nodes.filter((n) => n.level === 1);
  const angleOf = new Map<string, number>();
  l1.forEach((n, i) => {
    const a = (2 * Math.PI * i) / Math.max(l1.length, 1) - Math.PI / 2;
    angleOf.set(n.uid, a);
    seeds.push(at(n.uid, Math.cos(a) * 110, Math.sin(a) * 110));
  });
  const kidsOf = new Map<string, string[]>();
  data.nodes.filter((n) => n.level === 2).forEach((n) => kidsOf.set(n.parent ?? '', [...(kidsOf.get(n.parent ?? '') ?? []), n.uid]));
  kidsOf.forEach((kids, parent) => {
    const base = angleOf.get(parent) ?? 0;
    kids.forEach((id, i) => {
      const a = base + (i - (kids.length - 1) / 2) * 0.35;
      seeds.push(at(id, Math.cos(a) * 210, Math.sin(a) * 210));
    });
  });
  return seeds;
}

interface DotProps {
  id: string;
  x: number; // screen position of the centre
  y: number;
  size: number;
  marked: boolean; // you and the inspected person get the blue border
  hovered: boolean;
  dim: boolean;
  name: string;
  photoUrl?: string;
  onDragStart: (id: string) => void;
  onDrag: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, tap: boolean) => void;
  onHover: (id: string | null) => void;
}

/** One person: the picture. Drag it to move it, tap / click it to open the profile, hover / hold it to see the name. */
function Person(props: DotProps) {
  const t = useTheme();
  const latest = useRef(props);
  latest.current = props;
  const ref = useRef<ComponentRef<typeof View>>(null);
  const gesture = useRef({ moved: false, at: 0 });
  const pan = useMemo(() => {
    const end = () => {
      const g = gesture.current;
      latest.current.onDragEnd(latest.current.id, !g.moved && Date.now() - g.at < HOLD_MS);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        gesture.current = { moved: false, at: Date.now() };
        latest.current.onDragStart(latest.current.id);
      },
      onPanResponderMove: (_e, g) => {
        if (!gesture.current.moved && Math.abs(g.dx) + Math.abs(g.dy) <= 5) return; // still a tap or a hold
        gesture.current.moved = true;
        latest.current.onDrag(latest.current.id, g.dx, g.dy);
      },
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    });
  }, []);

  // Website: light up the way to the centre while the cursor is over this picture.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const el = ref.current as unknown as HTMLElement | null;
    if (!el || typeof el.addEventListener !== 'function') return undefined;
    const enter = () => latest.current.onHover(latest.current.id);
    const leave = () => latest.current.onHover(null);
    const noNativeDrag = (e: Event) => e.preventDefault();
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    el.addEventListener('dragstart', noNativeDrag);
    return () => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
      el.removeEventListener('dragstart', noNativeDrag);
    };
  }, []);

  const { size, marked } = props;
  return (
    <View
      ref={ref}
      {...pan.panHandlers}
      accessibilityLabel={props.name}
      style={[
        { position: 'absolute', left: props.x - size / 2, top: props.y - size / 2, opacity: props.dim ? 0.35 : 1, zIndex: props.hovered ? 20 : props.dim ? 0 : 5 },
        Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as object) : null,
      ]}
    >
      {/* pointerEvents none: the browser's own picture dragging (the ghost image) must not start, our drag handles it. */}
      <View pointerEvents="none" style={{ borderRadius: size, borderWidth: marked ? 3 : 2, borderColor: marked ? HIGHLIGHT : t.outline, backgroundColor: t.surface }}>
        <Avatar uri={props.photoUrl} name={props.name} size={size - (marked ? 6 : 4)} />
      </View>
      {props.hovered && (
        // The wrapper is wider than the picture so a long username is shown in full (it wraps instead of being cut).
        <View style={[styles.tipWrap, { bottom: size + 4, left: (size - TIP_W) / 2 }]} pointerEvents="none">
          <View style={[styles.tip, { backgroundColor: t.text }]}>
            <Text style={{ color: t.background, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{props.name}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const touchDistance = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

/**
 * The graph, in the style of Obsidian's graph view: pictures that settle by themselves (a small physics simulation).
 * Drag a picture and the others follow, drag the background to move around, scroll (website) or pinch (phone, full
 * screen) or use the buttons to zoom. Hovering (website) or holding / dragging (phone) a picture lights up the
 * shortest way from that person to the person in the middle. Tap it to open the profile.
 */
function GraphCanvas({
  data, scale, height, centerId, viewerId, recenter, onZoom, onScale, pinchZoom,
}: {
  data: GraphData; scale: number; height: number; centerId: string; viewerId: string; recenter: number;
  onZoom: (delta: number) => void; onScale: (value: number) => void; pinchZoom: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState({ w: 0, h: height });
  const [hover, setHover] = useState<string | null>(null);
  const [, setFrame] = useState(0);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const offRef = useRef(off);
  offRef.current = off;
  const panStart = useRef({ x: 0, y: 0 });
  const box = useRef<ComponentRef<typeof View>>(null);

  const edgePairs = useMemo(() => data.edges.map((e) => [e.a, e.b] as [string, string]), [data]);
  const degree = useMemo(() => {
    const d = new Map<string, number>();
    edgePairs.forEach(([a, b]) => {
      d.set(a, (d.get(a) ?? 0) + 1);
      d.set(b, (d.get(b) ?? 0) + 1);
    });
    return d;
  }, [edgePairs]);
  const sizeOf = useCallback((id: string) => sizeFor(degree.get(id) ?? 0), [degree]);
  const { sim, extent } = useMemo(() => {
    const sim = createSim(seedsFor(data, sizeOf), edgePairs);
    const mid = sim.byId.get(centerId) ?? sim.nodes[0];
    return { sim, extent: Math.max(60, ...sim.nodes.map((n) => Math.hypot(n.x - mid.x, n.y - mid.y) + n.r)) };
  }, [data, edgePairs, sizeOf, centerId]);

  // Fit the graph to the box, then apply the user's zoom on top.
  const fit = Math.max(0.4, Math.min(1.6, Math.min(view.w / 2 - 20, view.h / 2 - 20) / extent));
  const s = fit * scale;
  const sRef = useRef(s);
  sRef.current = s;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const limitRef = useRef({ x: 0, y: 0 });
  limitRef.current = { x: extent * s + view.w / 2, y: extent * s + view.h / 2 };

  // The person in the middle is always the centre of the view: at the start, and whenever "back to the center" is pressed.
  useEffect(() => {
    const mid = sim.byId.get(centerId);
    if (mid && view.w > 0) setOff({ x: -mid.x * sRef.current, y: -mid.y * sRef.current });
  }, [recenter, sim, centerId, view.w > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation: runs while something is dragged or the pictures are still moving, then stops by itself.
  const running = useRef(false);
  const dragging = useRef(0);
  const raf = useRef<number | null>(null);
  const kick = useCallback(() => {
    if (running.current) return;
    running.current = true;
    const loop = () => {
      sim.step();
      setFrame((n) => n + 1);
      if (dragging.current > 0 || sim.energy() > 0.05) raf.current = requestAnimationFrame(loop);
      else {
        running.current = false;
        raf.current = null;
      }
    };
    raf.current = requestAnimationFrame(loop);
  }, [sim]);
  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
      running.current = false;
      dragging.current = 0;
    },
    [sim],
  );

  const pinch = useRef({ active: false, d0: 1, s0: 1 });
  const dragFrom = useRef({ x: 0, y: 0 });
  const onDragStart = useCallback(
    (id: string) => {
      const n = sim.byId.get(id);
      if (!n) return;
      n.pinned = true;
      dragFrom.current = { x: n.x, y: n.y };
      dragging.current += 1;
      setHover(id);
      kick();
    },
    [sim, kick],
  );
  const onDrag = useCallback(
    (id: string, dx: number, dy: number) => {
      const n = sim.byId.get(id);
      if (!n || pinch.current.active) return;
      n.x = dragFrom.current.x + dx / sRef.current;
      n.y = dragFrom.current.y + dy / sRef.current;
    },
    [sim],
  );
  const onDragEnd = useCallback(
    (id: string, tap: boolean) => {
      const n = sim.byId.get(id);
      if (n) {
        n.pinned = false;
        if (tap) {
          n.x = dragFrom.current.x;
          n.y = dragFrom.current.y;
        }
      }
      dragging.current = Math.max(0, dragging.current - 1);
      if (Platform.OS !== 'web') setHover(null);
      if (tap && id !== centerId) router.push(`/profile/${id}`);
      kick();
    },
    [sim, kick, router, centerId],
  );

  // Dragging the background moves the whole graph (kept within reach so it cannot be lost off-screen).
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          panStart.current = offRef.current;
        },
        onPanResponderMove: (_e, g) => {
          if (pinch.current.active) return;
          const lim = limitRef.current;
          setOff({
            x: Math.max(-lim.x, Math.min(lim.x, panStart.current.x + g.dx)),
            y: Math.max(-lim.y, Math.min(lim.y, panStart.current.y + g.dy)),
          });
        },
      }),
    [],
  );

  // Two fingers anywhere on the graph zoom it (full screen only, so the page can still scroll normally).
  const touchStart = (e: GestureResponderEvent) => {
    if (!pinchZoom || e.nativeEvent.touches.length !== 2) return;
    pinch.current = { active: true, d0: Math.max(1, touchDistance(e)), s0: scaleRef.current };
  };
  const touchMove = (e: GestureResponderEvent) => {
    if (!pinch.current.active || e.nativeEvent.touches.length !== 2) return;
    onScale(pinch.current.s0 * (touchDistance(e) / pinch.current.d0));
  };
  const touchEnd = (e: GestureResponderEvent) => {
    if (e.nativeEvent.touches.length < 2) pinch.current.active = false;
  };

  // Website: the mouse wheel zooms.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const el = box.current as unknown as HTMLElement | null;
    if (!el || typeof el.addEventListener !== 'function') return undefined;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      onZoom(e.deltaY < 0 ? 0.15 : -0.15);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [onZoom]);

  // The way from the picture under the cursor / finger to the person in the middle.
  const path = useMemo(() => (hover ? shortestPath(edgePairs, hover, centerId) : []), [hover, edgePairs, centerId]);
  const onPath = useMemo(() => new Set(hover ? (path.length ? path : [hover]) : []), [hover, path]);
  const litEdges = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i + 1 < path.length; i++) keys.add([path[i], path[i + 1]].sort().join('|'));
    return keys;
  }, [path]);

  const cx = view.w / 2 + off.x;
  const cy = view.h / 2 + off.y;

  return (
    <View
      ref={box}
      {...pan.panHandlers}
      onTouchStart={touchStart}
      onTouchMove={touchMove}
      onTouchEnd={touchEnd}
      onTouchCancel={touchEnd}
      style={[{ height, overflow: 'hidden' }, Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none', touchAction: 'none' } as object) : null]}
      onLayout={(e) => setView({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {data.edges.map(({ a, b, friend }) => {
        const p = sim.byId.get(a);
        const q = sim.byId.get(b);
        if (!p || !q) return null;
        const x1 = cx + p.x * s;
        const y1 = cy + p.y * s;
        const x2 = cx + q.x * s;
        const y2 = cy + q.y * s;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const lit = litEdges.has([a, b].sort().join('|'));
        return (
          <View
            key={`${a}-${b}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (x1 + x2) / 2 - len / 2,
              top: (y1 + y2) / 2 - (lit ? 2 : 1),
              width: len,
              height: lit ? 4 : 2,
              borderRadius: 2,
              opacity: !hover || lit ? 1 : 0.15,
              backgroundColor: friend ? FRIEND_LINE : DATING_LINE,
              transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
            }}
          />
        );
      })}
      {sim.nodes.map((n) => {
        const profile = data.profiles[n.id];
        return (
          <Person
            key={n.id}
            id={n.id}
            x={cx + n.x * s}
            y={cy + n.y * s}
            size={n.r * 2}
            marked={n.id === centerId || n.id === viewerId}
            hovered={hover === n.id}
            dim={!!hover && !onPath.has(n.id)}
            name={profile?.username ?? ''}
            photoUrl={profile?.photoUrl}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onHover={setHover}
          />
        );
      })}
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

  const setScaleTo = useCallback((v: number) => setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, v))), []);
  const zoom = useCallback((d: number) => setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + d).toFixed(2)))), []);
  const hasGraph = state === 'ready' && data && data.nodes.length > 1;

  const body = (h: number, inModal: boolean) => (
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
      {hasGraph && data && <GraphCanvas data={data} scale={scale} height={h} centerId={centerId} viewerId={viewerId} recenter={recenter} onZoom={zoom} onScale={setScaleTo} pinchZoom={inModal} />}
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
      {body(300, false)}
      <Text style={{ color: t.textSecondary, fontSize: 11, textAlign: 'center', paddingBottom: 8 }}>
        {Platform.OS === 'web'
          ? 'Click a picture to open the profile. Hover to see the username and the way to the center. Drag to move, scroll to zoom.'
          : 'Tap a picture to open the profile. Hold or drag it to see the username and the way to the center. Pinch to zoom in full screen.'}
      </Text>

      <Modal visible={full} animationType="fade" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setFull(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
          <View style={[styles.head, { paddingHorizontal: 16 }]}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>Connections</Text>
            {controls(true)}
          </View>
          {body(Math.max(180, winH - 90), true)}
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
      {item(DATING_LINE, 'Match')}
      {item(FRIEND_LINE, 'Friend')}
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
  tipWrap: { position: 'absolute', width: TIP_W, alignItems: 'center' },
  tip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, maxWidth: TIP_W },
});
