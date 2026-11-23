import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types';
import { loadMatchMeta } from './matches';
import { matchIdFor } from './swipes';
import { getUser, getUsersByIds } from './users';

/**
 * Connections graph. Each person publishes `connections/{uid}` = { visible, partners, friends } themselves (nobody else can
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
export interface GraphEdge {
  a: string;
  b: string;
  /** Formed in Friend first mode (orange line); otherwise formed in the default mode (pink line). */
  friend: boolean;
}
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  profiles: Record<string, UserProfile>;
  /** The person keeps their connections private (you may still see your own match with them). */
  hidden: boolean;
}

const MAX_LEVEL1 = 24;
const MAX_LEVEL2 = 36;

interface Conn {
  visible: boolean;
  partners: string[];
  /** The part of `partners` whose connection was formed in Friend first mode. */
  friends: string[];
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string') : []);

async function readConn(uid: string): Promise<Conn> {
  const snap = await getDoc(doc(db, 'connections', uid));
  const d = snap.data();
  const visible = d?.visible === true;
  const partners = visible ? asList(d?.partners) : [];
  return { visible, partners, friends: asList(d?.friends).filter((f) => partners.includes(f)) };
}

/** My current mutual matches that nobody blocked, computed from my own data. */
export async function getMyActivePartners(myId: string): Promise<string[]> {
  const m = await loadMatchMeta(myId);
  return [...m.iLiked].filter((id) => m.likedMe.has(id) && !m.iBlocked.has(id) && !m.blockedMe.has(id));
}

/**
 * My matches, split by the mode each one was formed in. The mode is stored on the match document when it is created;
 * older matches have no such field, so they count as the mode I am in now.
 */
export async function getMyPartnersWithMode(myId: string): Promise<{ partners: string[]; friends: string[] }> {
  const [partners, me] = await Promise.all([getMyActivePartners(myId), getUser(myId).catch(() => null)]);
  const fallback = me?.friendFirst === true;
  const friends: string[] = [];
  await Promise.all(
    partners.map(async (p) => {
      try {
        const f = (await getDoc(doc(db, 'matches', matchIdFor(myId, p)))).data()?.friend;
        if (typeof f === 'boolean' ? f : fallback) friends.push(p);
      } catch {
        if (fallback) friends.push(p);
      }
    }),
  );
  return { partners, friends };
}

export async function getMyConnectionsVisible(myId: string): Promise<boolean> {
  return (await readConn(myId)).visible;
}

/** Turns "let others see my connections" on or off and publishes (or clears) the list. */
export async function setConnectionsVisible(myId: string, visible: boolean): Promise<void> {
  const { partners, friends } = visible ? await getMyPartnersWithMode(myId) : { partners: [], friends: [] };
  await setDoc(doc(db, 'connections', myId), { visible, partners, friends });
}

/** Refreshes the published list from my matches, only if I chose to show it. Safe to call often; never throws. */
export async function syncMyConnections(myId: string): Promise<void> {
  try {
    const current = await readConn(myId);
    if (!current.visible) return;
    const { partners, friends } = await getMyPartnersWithMode(myId);
    const sameSet = (x: string[], y: string[]) => x.length === y.length && x.every((p) => y.includes(p));
    if (!sameSet(partners, current.partners) || !sameSet(friends, current.friends)) {
      await setDoc(doc(db, 'connections', myId), { visible: true, partners, friends });
    }
  } catch (e) {
    console.warn('Could not sync connections', e);
  }
}

/**
 * The graph for `centerId` as seen by `viewerId`.
 * A line between two people is drawn when
 *  - one of them is the viewer and the other is one of the viewer's own matches (the viewer's own data, always shown), or
 *  - both people chose to show their connections and one of their published lists contains the other.
 * The colour of a line comes from the mode the connection was formed in (friend = orange, otherwise pink).
 * So someone who has not published never gets a line to anybody except the viewer, and a person is only reachable in
 * the graph through such lines. Level 1 is the middle person's lines, level 2 the lines of those people.
 */
export async function loadGraph(viewerId: string, centerId: string): Promise<GraphData> {
  const cache = new Map<string, Conn>();
  const mine = await getMyPartnersWithMode(viewerId);
  const own = new Set(mine.partners);
  const ownFriends = new Set(mine.friends);
  const conn = async (uid: string): Promise<Conn> => {
    if (uid === viewerId) return { visible: true, partners: [...own], friends: [...ownFriends] }; // I always see my own data
    let c = cache.get(uid);
    if (!c) {
      c = await readConn(uid);
      cache.set(uid, c);
    }
    return c;
  };
  const allowed = async (u: string, v: string): Promise<boolean> => {
    if (u === v) return false;
    if (u === viewerId) return own.has(v);
    if (v === viewerId) return own.has(u);
    const [cu, cv] = await Promise.all([conn(u), conn(v)]);
    return cu.visible && cv.visible && (cu.partners.includes(v) || cv.partners.includes(u));
  };

  const isFriend = async (u: string, v: string): Promise<boolean> => {
    if (u === viewerId) return ownFriends.has(v);
    if (v === viewerId) return ownFriends.has(u);
    const [cu, cv] = await Promise.all([conn(u), conn(v)]);
    return cu.friends.includes(v) || cv.friends.includes(u);
  };

  const nodes: GraphNode[] = [{ uid: centerId, level: 0 }];
  const inGraph = new Set([centerId]);
  const edges = new Map<string, GraphEdge>();
  const addEdge = async (a: string, b: string) => {
    edges.set([a, b].sort().join('|'), { a, b, friend: await isFriend(a, b) });
  };

  // Level 1: the middle person's lines.
  const center = await conn(centerId);
  const candidates1 = new Set(center.partners);
  if (centerId !== viewerId && own.has(centerId)) candidates1.add(viewerId); // my own match with them
  const level1: string[] = [];
  for (const v of [...candidates1].slice(0, MAX_LEVEL1 * 2)) {
    if (level1.length >= MAX_LEVEL1) break;
    if (await allowed(centerId, v)) {
      level1.push(v);
      inGraph.add(v);
      nodes.push({ uid: v, level: 1 });
      await addEdge(centerId, v);
    }
  }
  const hidden = centerId !== viewerId && !center.visible;

  // Level 2: lines of the level 1 people (and lines between level 1 people).
  let level2Count = 0;
  for (const p of level1) {
    const c = await conn(p);
    for (const q of c.partners) {
      if (q === centerId || q === p) continue;
      if (!inGraph.has(q) && level2Count >= MAX_LEVEL2) continue;
      if (!(await allowed(p, q))) continue;
      if (!inGraph.has(q)) {
        inGraph.add(q);
        level2Count++;
        nodes.push({ uid: q, level: 2, parent: p });
      }
      await addEdge(p, q);
    }
  }

  const ids = nodes.map((n) => n.uid);
  const profiles = Object.fromEntries((await getUsersByIds(ids)).map((u) => [u.uid, u]));
  const present = new Set(Object.keys(profiles));
  return {
    nodes: nodes.filter((n) => present.has(n.uid)),
    edges: [...edges.values()].filter((e) => present.has(e.a) && present.has(e.b)),
    profiles,
    hidden,
  };
}
