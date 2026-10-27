/**
 * Demos: ready-made universes worth watching.
 *
 * Each one is a rule plus a seeding function, so the same demo can be built at
 * any grid size — a phone screen, a browser canvas or an 80×24 terminal.
 */

import { Automata } from './automata.js';
import { getPattern } from './patterns.js';

export interface DemoContext {
  width: number;
  height: number;
  /** Seed for reproducible builds; demos that scatter cells use it. */
  seed?: number;
  wrap?: boolean;
}

export interface Demo {
  /** Stable id used by `--demo <id>` and `?demo=` links. */
  id: string;
  name: string;
  /** The rule this demo runs under, in `B3/S23` notation. */
  rule: string;
  /** One or two sentences on what you are looking at. */
  about: string;
  /** Suggested generations per second. */
  fps?: number;
  build(context: DemoContext): Automata;
}

const create = (context: DemoContext, rule: string): Automata =>
  new Automata({
    width: context.width,
    height: context.height,
    rule,
    wrap: context.wrap ?? true,
    seed: context.seed,
  });

export const demos: Demo[] = [
  {
    id: 'conway',
    name: "Conway's Game of Life",
    rule: 'B3/S23',
    fps: 20,
    about:
      'The original 1970 rule: a cell is born with exactly 3 neighbours and survives with 2 or 3. ' +
      'Gliders walk, the gun fires, and the pulsar beats — all from those two numbers.',
    build(context) {
      const life = create(context, 'B3/S23');
      const gun = getPattern('Glider Gun');
      const pulsar = getPattern('Pulsar');
      const glider = getPattern('Glider');

      if (gun && life.width > 40 && life.height > 12) life.stamp(gun, 2, 2);
      if (pulsar && life.width > 60) life.stamp(pulsar, life.width - 20, Math.floor(life.height / 2));
      if (glider) {
        life.stamp(glider, Math.floor(life.width / 3), Math.floor(life.height / 2));
        life.stamp(glider, Math.floor(life.width / 2), life.height - 12);
      }
      life.stamp('Acorn', Math.floor(life.width / 2), Math.floor(life.height / 3));
      return life;
    },
  },
  {
    id: 'gliders',
    name: 'Glider Parade',
    rule: 'B3/S23',
    fps: 24,
    about:
      'Gliders in all four diagonals on a wrapping grid, so they come back around and crash into each other. ' +
      'Every collision either annihilates them or leaves debris that starts something new.',
    build(context) {
      const life = create(context, 'B3/S23');
      const glider = getPattern('Glider')!;
      const spacing = Math.max(12, Math.floor(Math.min(life.width, life.height) / 4));
      for (let i = 0; i < 4; i++) {
        for (let turn = 0; turn < 4; turn++) {
          const x = 4 + ((i * spacing + turn * 7) % Math.max(1, life.width - 6));
          const y = 4 + ((turn * spacing + i * 5) % Math.max(1, life.height - 6));
          life.stamp({ ...glider, cells: rotate(glider.cells, turn) }, x, y);
        }
      }
      return life;
    },
  },
  {
    id: 'gun',
    name: 'Gosper Glider Gun',
    rule: 'B3/S23',
    fps: 20,
    about:
      'The pattern that proved Life can grow forever: a 36-cell machine that emits a new glider every 30 generations.',
    build(context) {
      const life = create(context, 'B3/S23');
      life.stamp('Glider Gun', 2, 2);
      return life;
    },
  },
  {
    id: 'fractal',
    name: 'Fractal Replicator',
    rule: 'B1357/S1357',
    fps: 12,
    about:
      'One single cell. Under this rule every cell copies itself into its empty neighbours, and the copies of ' +
      'copies cancel out in exactly the places that draw a Sierpinski triangle.',
    build(context) {
      const life = create({ ...context, wrap: context.wrap ?? false }, 'B1357/S1357');
      life.set(Math.floor(life.width / 2), Math.floor(life.height / 2), true);
      return life;
    },
  },
  {
    id: 'fredkin',
    name: 'Fredkin Fractal',
    rule: 'B1357/S02468',
    fps: 12,
    about:
      "Fredkin's replicator: any starting shape reproduces itself in a fractal lattice of copies, doubling in " +
      'scale every power of two generations.',
    build(context) {
      const life = create({ ...context, wrap: context.wrap ?? false }, 'B1357/S02468');
      life.stampCentered('Fractal Cross');
      return life;
    },
  },
  {
    id: 'gnarl',
    name: 'Gnarl',
    rule: 'B1/S1',
    fps: 18,
    about:
      'Born with one neighbour, survives with one. A handful of cells grows into an endlessly detailed woven ' +
      'texture that never repeats.',
    build(context) {
      const life = create({ ...context, wrap: context.wrap ?? false }, 'B1/S1');
      life.set(Math.floor(life.width / 2), Math.floor(life.height / 2), true);
      return life;
    },
  },
  {
    id: 'coral',
    name: 'Coral Growth',
    rule: 'B3/S45678',
    fps: 20,
    about: 'Cells stick where they land and never let go — a random soup crystallises into branching coral.',
    build(context) {
      const life = create(context, 'B3/S45678');
      life.randomize(0.35);
      return life;
    },
  },
  {
    id: 'maze',
    name: 'Maze Builder',
    rule: 'B3/S12345',
    fps: 20,
    about: 'A generous survival rule turns a scattering of cells into corridors and dead ends that keep extending.',
    build(context) {
      const life = create(context, 'B3/S12345');
      const cx = Math.floor(life.width / 2);
      const cy = Math.floor(life.height / 2);
      for (let i = 0; i < 40; i++) {
        life.set(cx + Math.floor(life.random() * 10) - 5, cy + Math.floor(life.random() * 10) - 5, true);
      }
      return life;
    },
  },
  {
    id: 'seeds',
    name: 'Seeds',
    rule: 'B2/S',
    fps: 30,
    about: 'Nothing survives — every generation is entirely new cells. Two cells are enough to fill the screen.',
    build(context) {
      const life = create(context, 'B2/S');
      const cx = Math.floor(life.width / 2);
      const cy = Math.floor(life.height / 2);
      life.set(cx, cy, true).set(cx + 1, cy, true);
      return life;
    },
  },
  {
    id: 'highlife',
    name: 'HighLife',
    rule: 'B36/S23',
    fps: 20,
    about:
      'Conway plus one extra birth condition, which is all it takes for a self-replicating pattern to exist ' +
      'inside an otherwise Life-like universe.',
    build(context) {
      const life = create(context, 'B36/S23');
      life.randomize(0.28);
      return life;
    },
  },
  {
    id: 'daynight',
    name: 'Day & Night',
    rule: 'B3678/S34678',
    fps: 18,
    about:
      'Symmetric under swapping live and dead cells, so blobs of "day" and "night" behave identically and grind ' +
      'against each other along fractal borders.',
    build(context) {
      const life = create(context, 'B3678/S34678');
      life.randomize(0.5);
      return life;
    },
  },
  {
    id: 'soup',
    name: 'Primordial Soup',
    rule: 'B3/S23',
    fps: 24,
    about:
      'Conway from pure noise. Most of it dies in the first hundred generations; what is left is still lifes, ' +
      'blinkers, and the occasional glider heading off into the dark.',
    build(context) {
      const life = create(context, 'B3/S23');
      life.randomize(0.32);
      return life;
    },
  },
];

/** A demo by id or name, case-insensitively. */
export function getDemo(id: string): Demo | undefined {
  const key = id.trim().toLowerCase().replace(/\s+/g, '');
  return demos.find((d) => d.id === key || d.name.toLowerCase().replace(/\s+/g, '') === key);
}

/** Build a demo's universe, falling back to Conway's if the id is unknown. */
export function buildDemo(id: string, context: DemoContext): Automata {
  return (getDemo(id) ?? demos[0]!).build(context);
}

/** The demo shown on the intro screen. */
export const INTRO_DEMO = 'conway';

function rotate(cells: Array<[number, number]>, quarterTurns: number): Array<[number, number]> {
  let out = cells.map(([x, y]) => [x, y] as [number, number]);
  for (let t = 0; t < ((quarterTurns % 4) + 4) % 4; t++) out = out.map(([x, y]) => [-y, x] as [number, number]);
  const minX = Math.min(...out.map(([x]) => x));
  const minY = Math.min(...out.map(([, y]) => y));
  return out.map(([x, y]) => [x - minX, y - minY] as [number, number]);
}
