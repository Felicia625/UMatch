import { createSim } from '../../src/utils/forceLayout';

const ring = (ids: string[], r: number) =>
  ids.map((id, i) => ({ id, x: Math.cos((2 * Math.PI * i) / ids.length) * r, y: Math.sin((2 * Math.PI * i) / ids.length) * r }));

describe('createSim', () => {
  const ids = ['me', 'a', 'b', 'c', 'd', 'e'];
  const edges: [string, string][] = [['me', 'a'], ['me', 'b'], ['me', 'c'], ['a', 'd'], ['b', 'e'], ['a', 'b']];

  it('gives every node a finite position and settles', () => {
    const sim = createSim(ring(ids, 90), edges);
    sim.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
    for (let i = 0; i < 200; i++) sim.step();
    expect(sim.energy()).toBeLessThan(0.5);
  });

  it('keeps nodes apart', () => {
    const sim = createSim(ring(ids, 90), edges);
    for (const a of sim.nodes) for (const b of sim.nodes) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20);
  });

  it('is the same every time for the same seeds', () => {
    const a = createSim(ring(ids, 90), edges);
    const b = createSim(ring(ids, 90), edges);
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(b.nodes.map((n) => [n.x, n.y]));
  });

  it('does not blow up when two nodes start at the same point', () => {
    const sim = createSim([{ id: 'x', x: 0, y: 0 }, { id: 'y', x: 0, y: 0 }], [['x', 'y']]);
    sim.nodes.forEach((n) => expect(Number.isFinite(n.x)).toBe(true));
    expect(Math.hypot(sim.nodes[0].x - sim.nodes[1].x, sim.nodes[0].y - sim.nodes[1].y)).toBeGreaterThan(10);
  });

  it('ignores edges to unknown nodes and leaves a pinned node alone', () => {
    const sim = createSim(ring(ids, 90), [...edges, ['me', 'ghost']], 10);
    const n = sim.byId.get('a')!;
    n.pinned = true;
    const { x, y } = n;
    for (let i = 0; i < 50; i++) sim.step();
    expect([n.x, n.y]).toEqual([x, y]);
  });

  it('with one node stays finite', () => {
    const sim = createSim([{ id: 'only', x: 0, y: 0 }], []);
    expect(Number.isFinite(sim.nodes[0].x)).toBe(true);
  });
});
