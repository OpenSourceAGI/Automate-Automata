import { describe, expect, test } from 'bun:test';
import { Autopilot } from '../src/autopilot.js';
import { buildDemo, demos, getDemo } from '../src/demos.js';

describe('demos', () => {
  test('every demo builds a living universe at terminal size', () => {
    for (const demo of demos) {
      const life = demo.build({ width: 80, height: 24, seed: 7 });
      expect(life.population).toBeGreaterThan(0);
      expect(life.ruleString).toBe(demo.rule);
    }
  });

  test('every demo survives its first generations at phone size', () => {
    for (const demo of demos) {
      const life = demo.build({ width: 60, height: 100, seed: 3 });
      life.run(10);
      expect(life.width).toBe(60);
    }
  });

  test('the replicator demo grows a fractal from one cell', () => {
    const life = buildDemo('fractal', { width: 65, height: 65, seed: 1 });
    expect(life.population).toBe(1);
    life.run(8);
    // Replication doubles outward: by generation 8 the single cell has copied
    // itself into a ring of descendants spread across many rows.
    expect(life.population).toBeGreaterThanOrEqual(8);
    const rows = new Set(life.liveCells().map(([, y]) => y));
    expect(rows.size).toBeGreaterThan(2);
  });

  test('demos are addressable by id and by name', () => {
    expect(getDemo('conway')?.id).toBe('conway');
    expect(getDemo("Conway's Game of Life")?.id).toBe('conway');
    expect(getDemo('nope')).toBeUndefined();
  });

  test('an unknown id falls back to the first demo', () => {
    expect(buildDemo('nope', { width: 30, height: 30 }).ruleString).toBe(demos[0]!.rule);
  });
});

describe('autopilot', () => {
  test('starts a new universe when the current one stagnates', () => {
    const life = buildDemo('conway', { width: 40, height: 40, seed: 5 });
    const seen: string[] = [];
    const pilot = new Autopilot(life, { minGenerations: 2, maxGenerations: 6, onUniverse: (i) => seen.push(i.rule) });

    for (let i = 0; i < 40; i++) {
      life.step();
      pilot.tick();
    }
    expect(seen.length).toBeGreaterThan(0);
    expect(life.population).toBeGreaterThan(0);
  });

  test('a manual jump reports why it happened', () => {
    const life = buildDemo('soup', { width: 30, height: 30, seed: 9 });
    let reason = '';
    new Autopilot(life, { onUniverse: (i) => (reason = i.reason) }).next();
    expect(reason).toBe('manual');
  });
});
