/**
 * The engine: a grid of cells, a rule, and a `step()` that advances one
 * generation. No DOM, no timers, no rendering — the browser component, the
 * terminal renderer and the tests all drive this same object.
 */

import { blend, seedColor, type RGB } from './color.js';
import { getPattern, type Pattern } from './patterns.js';
import {
  formatRule,
  parseRule,
  ruleSetToRuleNumber,
  RULE_SPACE,
  type RuleLike,
  type RuleSet,
} from './rules.js';

export interface AutomataOptions {
  width: number;
  height: number;
  /** Rule set, rule number or `B3/S23` string. Defaults to Conway's rules. */
  rule?: RuleLike;
  /** Wrap the edges into a torus so gliders come back around. Default true. */
  wrap?: boolean;
  /** Track a colour per cell so colonies inherit and blend hues. Default true. */
  colors?: boolean;
  /** Seed for the built-in RNG, so random universes are reproducible. */
  seed?: number;
}

/** A small deterministic PRNG — same seed, same universe, on every platform. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEAD: RGB = [0, 0, 0];

export class Automata {
  readonly width: number;
  readonly height: number;
  /** One byte per cell: 1 alive, 0 dead. Row-major, `y * width + x`. */
  cells: Uint8Array;
  /** Three bytes per cell (r, g, b). Empty when `colors` is off. */
  colors: Uint8Array;
  wrap: boolean;
  /** Whether colour inheritance is tracked. */
  readonly tracksColor: boolean;

  generation = 0;
  population = 0;

  private ruleSet: RuleSet;
  private ruleNum: number;
  private birthLookup = new Uint8Array(9);
  private surviveLookup = new Uint8Array(9);
  private history: number[] = [];
  private rng: () => number;
  private seedValue: number;

  constructor(options: AutomataOptions) {
    this.width = Math.max(1, Math.floor(options.width));
    this.height = Math.max(1, Math.floor(options.height));
    this.wrap = options.wrap ?? true;
    this.tracksColor = options.colors ?? true;
    this.cells = new Uint8Array(this.width * this.height);
    this.colors = new Uint8Array(this.tracksColor ? this.width * this.height * 3 : 0);
    this.seedValue = options.seed ?? (Date.now() & 0xffffffff);
    this.rng = mulberry32(this.seedValue);
    this.ruleSet = parseRule(options.rule ?? 'B3/S23');
    this.ruleNum = ruleSetToRuleNumber(this.ruleSet);
    this.refreshLookups();
  }

  // ---------------------------------------------------------------- rules

  get rule(): RuleSet {
    return { birth: [...this.ruleSet.birth], survive: [...this.ruleSet.survive] };
  }

  set rule(rule: RuleLike) {
    this.setRule(rule);
  }

  /** The current rule as an 18 bit integer. */
  get ruleNumber(): number {
    return this.ruleNum;
  }

  /** The current rule in `B3/S23` notation. */
  get ruleString(): string {
    return formatRule(this.ruleSet);
  }

  /** Swap in a new rule mid-run; the grid keeps its cells. */
  setRule(rule: RuleLike): this {
    this.ruleSet = parseRule(rule);
    this.ruleNum = ruleSetToRuleNumber(this.ruleSet);
    this.refreshLookups();
    this.history.length = 0;
    return this;
  }

  /** Toggle one neighbour count in the birth or survive set. */
  toggleRuleBit(kind: 'birth' | 'survive', count: number): this {
    const list = kind === 'birth' ? this.ruleSet.birth : this.ruleSet.survive;
    const next = list.includes(count) ? list.filter((n) => n !== count) : [...list, count].sort((a, b) => a - b);
    return this.setRule(kind === 'birth' ? { ...this.ruleSet, birth: next } : { ...this.ruleSet, survive: next });
  }

  /** Jump to a random universe somewhere else in the 262,144 rule space. */
  randomRule(): this {
    return this.setRule(Math.floor(this.rng() * RULE_SPACE));
  }

  private refreshLookups(): void {
    this.birthLookup.fill(0);
    this.surviveLookup.fill(0);
    for (const n of this.ruleSet.birth) if (n >= 0 && n <= 8) this.birthLookup[n] = 1;
    for (const n of this.ruleSet.survive) if (n >= 0 && n <= 8) this.surviveLookup[n] = 1;
  }

  // ----------------------------------------------------------------- cells

  /** Index into `cells` for a coordinate, or -1 when it is off-grid and wrap is off. */
  index(x: number, y: number): number {
    let px = Math.floor(x);
    let py = Math.floor(y);
    if (this.wrap) {
      px = ((px % this.width) + this.width) % this.width;
      py = ((py % this.height) + this.height) % this.height;
    } else if (px < 0 || py < 0 || px >= this.width || py >= this.height) {
      return -1;
    }
    return py * this.width + px;
  }

  /** Is the cell at these coordinates alive? */
  get(x: number, y: number): 0 | 1 {
    const i = this.index(x, y);
    return i < 0 ? 0 : ((this.cells[i] ? 1 : 0) as 0 | 1);
  }

  /** Bring a cell to life (or kill it), inheriting colour from its neighbours. */
  set(x: number, y: number, alive = true, color?: RGB): this {
    const i = this.index(x, y);
    if (i < 0) return this;
    const was = this.cells[i];
    this.cells[i] = alive ? 1 : 0;
    if (alive && !was) this.population++;
    if (!alive && was) this.population--;
    if (this.tracksColor) {
      const rgb = alive ? (color ?? this.inheritedColor(x, y)) : DEAD;
      this.colors[i * 3] = rgb[0];
      this.colors[i * 3 + 1] = rgb[1];
      this.colors[i * 3 + 2] = rgb[2];
    }
    return this;
  }

  /** Flip one cell — what a click or a tap does. */
  toggle(x: number, y: number): this {
    return this.set(x, y, !this.get(x, y));
  }

  /** The colour of a cell; dead cells are black. */
  colorAt(x: number, y: number): RGB {
    const i = this.index(x, y);
    if (i < 0 || !this.tracksColor || !this.cells[i]) return DEAD;
    return [this.colors[i * 3]!, this.colors[i * 3 + 1]!, this.colors[i * 3 + 2]!];
  }

  /** Average of the live neighbours' colours, or a fresh seed colour if alone. */
  private inheritedColor(x: number, y: number): RGB {
    if (!this.tracksColor) return DEAD;
    const parents: RGB[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const i = this.index(x + dx, y + dy);
        if (i < 0 || !this.cells[i]) continue;
        const c: RGB = [this.colors[i * 3]!, this.colors[i * 3 + 1]!, this.colors[i * 3 + 2]!];
        if (c[0] || c[1] || c[2]) parents.push(c);
      }
    }
    return parents.length ? blend(parents) : seedColor(this.ruleNum, this.generation, x, y);
  }

  /** Live neighbours in the Moore neighbourhood, respecting `wrap`. */
  countNeighbors(x: number, y: number, grid: Uint8Array = this.cells): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const i = this.index(x + dx, y + dy);
        if (i >= 0 && grid[i]) count++;
      }
    }
    return count;
  }

  // -------------------------------------------------------------- editing

  /** Empty the grid and reset the generation counter. */
  clear(): this {
    this.cells.fill(0);
    if (this.tracksColor) this.colors.fill(0);
    this.population = 0;
    this.generation = 0;
    this.history.length = 0;
    return this;
  }

  /** Sprinkle live cells over the grid. `density` is the fraction alive. */
  randomize(density = 0.25): this {
    this.clear();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.rng() < density) this.set(x, y, true, seedColor(this.ruleNum, y, x, y));
      }
    }
    return this;
  }

  /** Stamp a pattern (or a pattern name) with its top-left corner at `x, y`. */
  stamp(pattern: Pattern | string, x = 0, y = 0): this {
    const found = typeof pattern === 'string' ? getPattern(pattern) : pattern;
    if (!found) return this;
    const color = this.tracksColor ? seedColor(this.ruleNum, this.generation, x, y) : undefined;
    for (const [dx, dy] of found.cells) this.set(x + dx, y + dy, true, color);
    return this;
  }

  /** Stamp a pattern in the middle of the grid. */
  stampCentered(pattern: Pattern | string, offsetX = 0, offsetY = 0): this {
    const found = typeof pattern === 'string' ? getPattern(pattern) : pattern;
    if (!found || found.cells.length === 0) return this;
    let maxX = 0;
    let maxY = 0;
    for (const [px, py] of found.cells) {
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    return this.stamp(
      found,
      Math.floor((this.width - maxX) / 2) + offsetX,
      Math.floor((this.height - maxY) / 2) + offsetY,
    );
  }

  /** Stamp a pattern somewhere random, fully on-grid where it fits. */
  stampRandom(pattern: Pattern | string): this {
    const found = typeof pattern === 'string' ? getPattern(pattern) : pattern;
    if (!found || found.cells.length === 0) return this;
    return this.stamp(found, Math.floor(this.rng() * this.width), Math.floor(this.rng() * this.height));
  }

  // ------------------------------------------------------------ simulation

  /** Advance one generation. Returns the new generation number. */
  step(): number {
    const previous = this.cells;
    const next = new Uint8Array(previous.length);
    const nextColors = this.tracksColor ? new Uint8Array(this.colors.length) : this.colors;
    let population = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x;
        const alive = previous[i]!;
        const n = this.countNeighbors(x, y, previous);
        const lives = alive ? this.surviveLookup[n]! || this.birthLookup[n]! : this.birthLookup[n]!;
        if (!lives) continue;

        next[i] = 1;
        population++;
        if (!this.tracksColor) continue;

        if (alive) {
          // A survivor keeps the colour it was born with.
          nextColors[i * 3] = this.colors[i * 3]!;
          nextColors[i * 3 + 1] = this.colors[i * 3 + 1]!;
          nextColors[i * 3 + 2] = this.colors[i * 3 + 2]!;
        } else {
          const [r, g, b] = this.inheritedColor(x, y);
          nextColors[i * 3] = r;
          nextColors[i * 3 + 1] = g;
          nextColors[i * 3 + 2] = b;
        }
      }
    }

    this.cells = next;
    if (this.tracksColor) this.colors = nextColors;
    this.population = population;
    this.generation++;
    this.recordHistory();
    return this.generation;
  }

  /** Run several generations at once. */
  run(generations: number): this {
    for (let i = 0; i < generations; i++) this.step();
    return this;
  }

  private recordHistory(): void {
    this.history.push(this.hash());
    if (this.history.length > 6) this.history.shift();
  }

  /** FNV-1a over the live cells — cheap enough to run every generation. */
  hash(): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < this.cells.length; i++) {
      h ^= this.cells[i]!;
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * Has the universe stopped going anywhere — died out, frozen into still
   * lifes, or fallen into a short oscillation? This is what the automatic mode
   * watches for before moving on to the next rule.
   */
  isStagnant(): boolean {
    if (this.population === 0) return true;
    if (this.history.length < 4) return false;
    const current = this.history[this.history.length - 1]!;
    for (let i = this.history.length - 4; i < this.history.length - 1; i++) {
      if (this.history[i] === current) return true;
    }
    return false;
  }

  // ----------------------------------------------------------- bookkeeping

  /** The RNG seed this universe was created with. */
  get seed(): number {
    return this.seedValue;
  }

  /** Restart the RNG so a replay produces the same random choices. */
  reseed(seed: number): this {
    this.seedValue = seed >>> 0;
    this.rng = mulberry32(this.seedValue);
    return this;
  }

  /** The next value from the universe's RNG, for callers driving it. */
  random(): number {
    return this.rng();
  }

  /** Coordinates of every live cell — handy for sparse renderers and tests. */
  liveCells(): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y * this.width + x]) out.push([x, y]);
      }
    }
    return out;
  }

  /** A copy with the same cells, colours, rule and seed. */
  clone(): Automata {
    const copy = new Automata({
      width: this.width,
      height: this.height,
      rule: this.rule,
      wrap: this.wrap,
      colors: this.tracksColor,
      seed: this.seedValue,
    });
    copy.cells.set(this.cells);
    if (this.tracksColor) copy.colors.set(this.colors);
    copy.population = this.population;
    copy.generation = this.generation;
    return copy;
  }

  /** A new grid of a different size holding as much of this one as fits. */
  resized(width: number, height: number): Automata {
    const next = new Automata({
      width,
      height,
      rule: this.rule,
      wrap: this.wrap,
      colors: this.tracksColor,
      seed: this.seedValue,
    });
    const w = Math.min(this.width, next.width);
    const h = Math.min(this.height, next.height);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.get(x, y)) next.set(x, y, true, this.tracksColor ? this.colorAt(x, y) : undefined);
      }
    }
    next.generation = this.generation;
    return next;
  }

  /** Render the grid as text — `.` for dead, `#` for alive. */
  toString(alive = '#', dead = '.'): string {
    const rows: string[] = [];
    for (let y = 0; y < this.height; y++) {
      let row = '';
      for (let x = 0; x < this.width; x++) row += this.cells[y * this.width + x] ? alive : dead;
      rows.push(row);
    }
    return rows.join('\n');
  }
}

/** Build an automaton from an ASCII block — the inverse of `toString()`. */
export function fromString(text: string, options: Partial<AutomataOptions> = {}): Automata {
  const rows = text.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  const height = Math.max(1, rows.length);
  const width = Math.max(1, ...rows.map((r) => r.length));
  const automata = new Automata({ ...options, width: options.width ?? width, height: options.height ?? height });
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char !== '.' && char !== ' ' && char !== '0') automata.set(x, y, true);
    });
  });
  return automata;
}
