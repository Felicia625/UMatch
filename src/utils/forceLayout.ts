/**
 * A tiny force-directed layout (the same idea as Obsidian's graph view): every node pushes the others away, every
 * connection pulls its two ends together like a spring, and a weak pull toward the middle keeps the whole thing
 * together. No library: the graph never has more than a few dozen nodes.
 */
export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** A node being dragged: it follows the finger and ignores the forces. */
  pinned: boolean;
}

export interface Sim {
  nodes: SimNode[];
  byId: Map<string, SimNode>;
  /** Runs one step of the physics. */
  step: () => void;
  /** How much the nodes are still moving (sum of speeds); close to 0 means the layout has settled. */
  energy: () => number;
}

const REPEL = 3000; // push between every pair of nodes
const REST = 70; // the length a connection wants to be
const SPRING = 0.05;
const GRAVITY = 0.012; // pull toward the middle
const DAMPING = 0.82;
const MAX_SPEED = 12;

/**
 * `seeds` gives each node a starting point (for example a ring per level) so the result is the same every time the
 * graph is opened, then the physics is run `warmup` steps so it opens already settled.
 */
export function createSim(
  seeds: { id: string; x: number; y: number }[],
  edges: [string, string][],
  warmup = 300,
): Sim {
  const nodes: SimNode[] = seeds.map((s) => ({ id: s.id, x: s.x, y: s.y, vx: 0, vy: 0, pinned: false }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = edges
    .map(([a, b]) => [byId.get(a), byId.get(b)] as const)
    .filter((l): l is readonly [SimNode, SimNode] => !!l[0] && !!l[1] && l[0] !== l[1]);

  function step() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Exactly on top of each other: nudge apart in a fixed direction so the result stays deterministic.
          dx = (i % 2 ? 1 : -1) * 0.5;
          dy = (j % 2 ? 1 : -1) * 0.5;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        const f = REPEL / d2;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }
    for (const [a, b] of links) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - REST) * SPRING;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
    for (const n of nodes) {
      if (n.pinned) {
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx = (n.vx - n.x * GRAVITY) * DAMPING;
      n.vy = (n.vy - n.y * GRAVITY) * DAMPING;
      const speed = Math.hypot(n.vx, n.vy);
      if (speed > MAX_SPEED) {
        n.vx = (n.vx / speed) * MAX_SPEED;
        n.vy = (n.vy / speed) * MAX_SPEED;
      }
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  for (let i = 0; i < warmup; i++) step();

  return { nodes, byId, step, energy: () => nodes.reduce((s, n) => s + Math.hypot(n.vx, n.vy), 0) };
}
