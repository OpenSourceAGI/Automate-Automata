/**
 * A catalogue of starting shapes, as `[x, y]` offsets from where you stamp them.
 *
 * Most are the classic Conway patterns; the `fractal` group are seeds that only
 * do something interesting under a replicator-style rule (`B1357/S1357` and
 * friends), where a single cell copies itself into a Sierpinski triangle.
 *
 * More patterns, and the RLE files this format mirrors:
 * https://conwaylife.com/book/#rle_files
 */

export type PatternCategory = 'spaceship' | 'gun' | 'oscillator' | 'still' | 'methuselah' | 'fractal' | 'tool';

export interface Pattern {
  /** Display name, also the lookup key for {@link getPattern}. */
  name: string;
  /** Live cells as `[x, y]` offsets. Empty for the freehand drawing tool. */
  cells: Array<[number, number]>;
  category: PatternCategory;
  /** One line on what it does — shown in tooltips and `--list` output. */
  about?: string;
  /** Rule this pattern is designed for, when it isn't Conway's. */
  rule?: string;
}

/** Freehand drawing: toggles the single cell under the cursor. */
export const POINT: Pattern = {
  name: 'Point On/Off',
  cells: [],
  category: 'tool',
  about: 'Draw cell by cell.',
};

export const patterns: Pattern[] = [
  POINT,
  {
    name: 'Glider',
    category: 'spaceship',
    about: 'The smallest spaceship — walks diagonally forever.',
    cells: [
      [0, 2],
      [1, 0],
      [1, 2],
      [2, 1],
      [2, 2],
    ],
  },
  {
    name: 'Glider Fleet',
    category: 'spaceship',
    about: 'Four gliders heading out to the four corners.',
    cells: [
      [0, 2],
      [1, 0],
      [1, 2],
      [2, 1],
      [2, 2],
      [14, 2],
      [13, 0],
      [13, 2],
      [12, 1],
      [12, 2],
      [0, 12],
      [1, 14],
      [1, 12],
      [2, 13],
      [2, 12],
      [14, 12],
      [13, 14],
      [13, 12],
      [12, 13],
      [12, 12],
    ],
  },
  {
    name: 'Lightweight Spaceship',
    category: 'spaceship',
    about: 'Travels straight across the grid, two cells every four generations.',
    cells: [
      [1, 0],
      [4, 0],
      [0, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  },
  {
    name: 'Glider Gun',
    category: 'gun',
    about: "Gosper's gun — emits a glider every 30 generations, forever.",
    cells: [
      [25, 0],
      [22, 1],
      [23, 1],
      [24, 1],
      [25, 1],
      [30, 1],
      [13, 2],
      [21, 2],
      [22, 2],
      [23, 2],
      [24, 2],
      [30, 2],
      [12, 3],
      [14, 3],
      [21, 3],
      [24, 3],
      [34, 3],
      [35, 3],
      [11, 4],
      [15, 4],
      [16, 4],
      [21, 4],
      [22, 4],
      [23, 4],
      [24, 4],
      [34, 4],
      [35, 4],
      [0, 5],
      [1, 5],
      [11, 5],
      [15, 5],
      [16, 5],
      [22, 5],
      [23, 5],
      [24, 5],
      [25, 5],
      [0, 6],
      [1, 6],
      [11, 6],
      [15, 6],
      [16, 6],
      [25, 6],
      [12, 7],
      [14, 7],
      [13, 8],
    ],
  },
  {
    name: 'Pulsar',
    category: 'oscillator',
    about: 'A period-3 oscillator that beats like a heart.',
    cells: [
      [2, 0],
      [3, 0],
      [4, 0],
      [8, 0],
      [9, 0],
      [10, 0],
      [0, 2],
      [5, 2],
      [7, 2],
      [12, 2],
      [0, 3],
      [5, 3],
      [7, 3],
      [12, 3],
      [0, 4],
      [5, 4],
      [7, 4],
      [12, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [8, 5],
      [9, 5],
      [10, 5],
      [2, 7],
      [3, 7],
      [4, 7],
      [8, 7],
      [9, 7],
      [10, 7],
      [0, 8],
      [5, 8],
      [7, 8],
      [12, 8],
      [0, 9],
      [5, 9],
      [7, 9],
      [12, 9],
      [0, 10],
      [5, 10],
      [7, 10],
      [12, 10],
      [2, 12],
      [3, 12],
      [4, 12],
      [8, 12],
      [9, 12],
      [10, 12],
    ],
  },
  {
    name: 'Tumbler',
    category: 'oscillator',
    about: 'Period-14 oscillator that rocks side to side.',
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [2, 1],
      [2, 3],
      [2, 4],
      [3, 2],
      [3, 4],
      [5, 2],
      [5, 4],
      [6, 1],
      [6, 3],
      [6, 4],
      [7, 0],
      [8, 1],
      [8, 2],
    ],
  },
  {
    name: 'Octagon',
    category: 'oscillator',
    about: 'Breathes in and out on a period of 5.',
    cells: [
      [0, 6],
      [0, 7],
      [1, 5],
      [1, 8],
      [2, 4],
      [2, 9],
      [3, 3],
      [3, 10],
      [4, 3],
      [4, 10],
      [5, 4],
      [5, 9],
      [6, 5],
      [6, 8],
      [7, 6],
      [7, 7],
    ],
  },
  {
    name: 'Pinwheel',
    category: 'oscillator',
    about: 'Four-fold rotor, period 4.',
    cells: [
      [0, 4],
      [0, 5],
      [1, 4],
      [1, 5],
      [3, 4],
      [3, 5],
      [3, 6],
      [3, 7],
      [4, 3],
      [4, 8],
      [4, 10],
      [4, 11],
      [5, 3],
      [5, 7],
      [5, 8],
      [5, 10],
      [5, 11],
      [6, 0],
      [6, 1],
      [6, 3],
      [6, 5],
      [6, 8],
      [7, 0],
      [7, 1],
      [7, 3],
      [7, 6],
      [7, 8],
      [8, 4],
      [8, 5],
      [8, 6],
      [8, 7],
      [10, 6],
      [10, 7],
      [11, 6],
      [11, 7],
    ],
  },
  {
    name: 'Beehive',
    category: 'still',
    about: 'A still life — nothing ever changes unless something hits it.',
    cells: [
      [0, 0],
      [0, 6],
      [1, 0],
      [1, 6],
      [2, 1],
      [2, 5],
      [3, 2],
      [3, 3],
      [3, 4],
    ],
  },
  {
    name: 'R-pentomino',
    category: 'methuselah',
    about: 'Five cells that take 1103 generations to settle down.',
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
    ],
  },
  {
    name: 'Acorn',
    category: 'methuselah',
    about: 'Seven cells that run for over 5000 generations.',
    cells: [
      [1, 0],
      [3, 1],
      [0, 2],
      [1, 2],
      [4, 2],
      [5, 2],
      [6, 2],
    ],
  },
  {
    name: 'Diehard',
    category: 'methuselah',
    about: 'Vanishes completely after exactly 130 generations.',
    cells: [
      [6, 0],
      [0, 1],
      [1, 1],
      [1, 2],
      [5, 2],
      [6, 2],
      [7, 2],
    ],
  },
  {
    name: 'Bar',
    category: 'methuselah',
    about: 'A ten cell line — simple input, complicated output.',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
      [8, 0],
      [9, 0],
    ],
  },
  {
    name: 'Goose',
    category: 'spaceship',
    about: 'A larger travelling shape.',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 10],
      [1, 11],
      [2, 1],
      [2, 8],
      [2, 9],
      [2, 10],
      [2, 12],
      [3, 3],
      [3, 4],
      [3, 7],
      [3, 8],
      [4, 4],
      [5, 8],
      [6, 4],
      [6, 5],
      [6, 9],
      [7, 3],
      [7, 5],
      [7, 7],
      [7, 8],
      [8, 3],
      [8, 5],
      [8, 8],
      [8, 10],
      [8, 11],
      [9, 2],
      [9, 7],
      [9, 8],
      [10, 2],
      [10, 3],
      [11, 2],
      [11, 3],
    ],
  },
  {
    name: 'Unix',
    category: 'oscillator',
    about: 'Period-6 oscillator named for its shape.',
    cells: [
      [0, 4],
      [0, 5],
      [1, 0],
      [1, 1],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 4],
      [2, 7],
      [3, 5],
      [3, 7],
      [4, 6],
      [6, 5],
      [6, 6],
      [7, 5],
      [7, 6],
    ],
  },
  {
    name: 'Lightsaber',
    category: 'oscillator',
    about: 'A diagonal blade of cells.',
    cells: [
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 2],
      [3, 1],
      [3, 2],
      [4, 3],
      [4, 4],
      [5, 3],
      [6, 4],
      [6, 6],
      [8, 6],
      [8, 8],
      [9, 9],
      [10, 8],
      [10, 9],
    ],
  },
  {
    name: 'Fractal Seed',
    category: 'fractal',
    rule: 'B1357/S1357',
    about: 'One cell. Under a replicator rule it copies itself into a Sierpinski triangle.',
    cells: [[0, 0]],
  },
  {
    name: 'Fractal Cross',
    category: 'fractal',
    rule: 'B1357/S1357',
    about: 'A plus sign — replicator rules turn it into nested diamonds.',
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
  },
  {
    name: 'Fractal Triangle',
    category: 'fractal',
    rule: 'B1357/S02468',
    about: 'A Sierpinski-triangle seed row for Fredkin replication.',
    cells: [
      [0, 0],
      [2, 0],
      [4, 0],
      [1, 1],
      [3, 1],
      [2, 2],
    ],
  },
  {
    name: 'Fractal Comb',
    category: 'fractal',
    rule: 'B1/S1',
    about: 'Gnarl rule seed — grows an endlessly detailed woven texture.',
    cells: [
      [0, 0],
      [2, 0],
      [4, 0],
      [6, 0],
    ],
  },
];

/** Look a pattern up by name, case- and space-insensitively. */
export function getPattern(name: string): Pattern | undefined {
  const key = name.trim().toLowerCase().replace(/\s+/g, '');
  return patterns.find((p) => p.name.toLowerCase().replace(/\s+/g, '') === key);
}

/** Every pattern in a category, in catalogue order. */
export function patternsByCategory(category: PatternCategory): Pattern[] {
  return patterns.filter((p) => p.category === category);
}

/** Width and height of a pattern's bounding box. */
export function patternSize(pattern: Pattern): { width: number; height: number } {
  if (pattern.cells.length === 0) return { width: 0, height: 0 };
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of pattern.cells) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { width: maxX + 1, height: maxY + 1 };
}

/** Rotate a pattern by 90° steps, normalised back to the origin. */
export function rotatePattern(pattern: Pattern, quarterTurns = 1): Pattern {
  const turns = ((quarterTurns % 4) + 4) % 4;
  let cells = pattern.cells.map(([x, y]) => [x, y] as [number, number]);
  for (let t = 0; t < turns; t++) cells = cells.map(([x, y]) => [-y, x] as [number, number]);
  let minX = Infinity;
  let minY = Infinity;
  for (const [x, y] of cells) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }
  if (!Number.isFinite(minX)) return { ...pattern, cells: [] };
  return { ...pattern, cells: cells.map(([x, y]) => [x - minX, y - minY] as [number, number]) };
}
