import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types';
import { loadMatchMeta } from './matches';
import { getUsersByIds } from './users';

/**
 * Connections graph. Each person publishes `connections/{uid}` = { visible, partners } themselves (nobody else can
 * write it). Matches are private to the two people, so this small document is what lets others draw the graph. Rules:
 * - Hidden by default: no document, or visible = false, means nobody else sees that person's connections
 *   (partners is then stored empty, so the data is not there to read either).
 * - The document is refreshed from the person's own matches whenever they open the app screens that call
 *   syncMyConnections, so it can be a little behind (a new match shows up after the other person's next sync).
 */

export interface GraphNode {
  uid: string;
  level: 0 | 1 | 2; // 0 = the person in the middle, 1 = their matches, 2 = matches of those people
  parent?: string; // level 2 only: the level 1 person it hangs from
}
export interface GraphData {
  nodes: GraphNode[];
  edges: [string, string][];
  profiles: Record<string, UserProfile>;
  /** The person keeps their connections private (you may still see your own match with them). */
  hidden: boolean;
}

const MAX_LEVEL1 = 24;
const MAX_LEVEL2 = 36;

interface Conn {
  visible: boolean;
  partners: string[];
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string') : []);

async function readConn(uid: string): Promise<Conn> {
  const snap = await getDoc(doc(db, 'connections', uid));
  const d = snap.data();
  const visible = d?.visible === true;
  return { visible, partners: visible ? asList(d?.partners) : [] };
}

/** My current mutual matches that nobody blocked, computed from my own data. */
export async function getMyActivePartners(myId: string): Promise<string[]> {
  const m = await loadMatchMeta(myId);
  return [...m.iLiked].filter((id) => m.likedMe.has(id) && !m.iBlocked.has(id) && !m.blockedMe.has(id));
}

export async function getMyConnectionsVisible(myId: string): Promise<boolean> {
  return (await readConn(myId)).visible;
}

/** Turns "let others see my connections" on or off and publishes (or clears) the list. */
export async function setConnectionsVisible(myId: string, visible: boolean): Promise<void> {
  const partners = visible ? await getMyActivePartners(myId) : [];
  await setDoc(doc(db, 'connections', myId), { visible, partners });
}

/** Refreshes the published list from my matches, only if I chose to show it. Safe to call often; never throws. */
export async function syncMyConnections(myId: string): Promise<void> {
  try {
    const current = await readConn(myId);
    if (!current.visible) return;
    const partners = await getMyActivePartners(myId);
    const same = partners.length === current.partners.length && partners.every((p) => current.partners.includes(p));
    if (!same) await setDoc(doc(db, 'connections', myId), { visible: true, partners });
  } catch (e) {
    console.warn('Could not sync connections', e);
  }
}

/**
 * The graph for `centerId` as seen by `viewerId`.
 * - The person in the middle shows their matches only if they chose visible (the viewer always sees their own).
 * - Their matches (level 1) always appear, since the middle person chose to show them.
 * - A level 1 person's own other matches (level 2) and the lines between matches only appear when the people
 *   involved are visible: a hidden person never shows up behind someone else and their lines are not drawn.
 */
export async function loadGraph(viewerId: string, centerId: string): Promise<GraphData> {
  const cache = new Map<string, Conn>();
  let own: string[] | null = null;
  const getOwn = async () => (own ??= await getMyActivePartners(viewerId));
  const conn = async (uid: string): Promise<Conn> => {
    if (uid === viewerId) return { visible: true, partners: await getOwn() }; // I always see my own data
    let c = cache.get(uid);
    if (!c) {
      c = await readConn(uid);
      cache.set(uid, c);
    }
    return c;
  };

  const center = await conn(centerId);
  const nodes: GraphNode[] = [{ uid: centerId, level: 0 }];
  const edges = new Map<string, [string, string]>();
  const addEdge = (a: string, b: string) => {
    if (a !== b) edges.set([a, b].sort().join('|'), [a, b]);
  };

  let hidden = false;
  let level1: string[] = center.visible ? center.partners.slice(0, MAX_LEVEL1) : [];
  if (!center.visible) {
    hidden = true;
    // I can still see my own match with them.
    if ((await getOwn()).includes(centerId)) level1 = [viewerId];
  }

  level1 = level1.filter((id) => id !== centerId);
  level1.forEach((id) => {
    nodes.push({ uid: id, level: 1 });
    addEdge(centerId, id);
  });

  if (center.visible || level1.length > 0) {
    const l1Conns = await Promise.all(level1.map(async (id) => [id, await conn(id)] as const));
    const inL1 = new Set(level1);
    const candidates: { parent: string; id: string }[] = [];

    for (const [p, c] of l1Conns) {
      if (!c.visible) continue; // a hidden person shows no other matches and no lines
      for (const q of c.partners) {
        if (q === centerId || q === p) continue;
        candidates.push({ parent: p, id: q });
      }
    }

    // Only visible people appear or get a line, apart from the middle person's own matches (level 1).
    const uniq = [...new Set(candidates.map((c) => c.id))].filter((id) => !inL1.has(id)).slice(0, MAX_LEVEL2 * 2);
    const l2Conns = new Map(await Promise.all(uniq.map(async (id) => [id, await conn(id)] as const)));
    const l1Map = new Map(l1Conns);
    const added = new Set<string>();

    for (const { parent, id } of candidates) {
      const target = inL1.has(id) ? l1Map.get(id) : l2Conns.get(id);
      if (!target?.visible) continue;
      if (!inL1.has(id)) {
        if (!added.has(id)) {
          if (added.size >= MAX_LEVEL2) continue;
          added.add(id);
          nodes.push({ uid: id, level: 2, parent });
        }
      }
      addEdge(parent, id);
    }
  }

  const ids = nodes.map((n) => n.uid);
  const profiles = Object.fromEntries((await getUsersByIds(ids)).map((u) => [u.uid, u]));
  const present = new Set(Object.keys(profiles));
  return {
    nodes: nodes.filter((n) => present.has(n.uid)),
    edges: [...edges.values()].filter(([a, b]) => present.has(a) && present.has(b)),
    profiles,
    hidden,
  };
}
