/**
 * Saving universes.
 *
 * A universe is its rule plus its live cells, and that is all this format
 * stores. Cells are held as Life RLE (`b`/`o`/`$`/`!`), the same encoding
 * conwaylife.com uses, so a saved universe can be pasted into other Life
 * software and patterns from elsewhere can be loaded here.
 *
 * Three ways out, all lossless for the parts that matter:
 *   - {@link saveUniverse} → a JSON object, for a file or localStorage
 *   - {@link toShareString} → one URL-safe string, for a `?u=` link
 *   - {@link encodeRLE}     → just the cells, for other Life programs
 */

import { Automata, type AutomataOptions } from './automata.js';
import { formatRule, parseRule, type RuleLike } from './rules.js';

export const UNIVERSE_FORMAT = 'complexity-automata';
export const UNIVERSE_VERSION = 1;

/** A saved universe: everything needed to bring it back exactly as it was. */
export interface UniverseFile {
  format: typeof UNIVERSE_FORMAT;
  version: number;
  name: string;
  /** Rule in `B3/S23` notation. */
  rule: string;
  width: number;
  height: number;
  generation: number;
  wrap: boolean;
  /** Live cells in Life RLE. */
  cells: string;
  /** Live cell count at save time — cheap to show in a list without decoding. */
  population?: number;
  /** ISO timestamp. */
  savedAt?: string;
  /** Free-form note the user typed. */
  note?: string;
}

// ------------------------------------------------------------------ Life RLE

/** Encode the live cells of a grid as Life RLE. */
export function encodeRLE(automata: Automata): string {
  const tokens: string[] = [];
  let runChar = '';
  let runLength = 0;

  const flush = (): void => {
    if (runLength === 0) return;
    tokens.push(runLength === 1 ? runChar : `${runLength}${runChar}`);
    runLength = 0;
  };
  const push = (char: string): void => {
    if (char === runChar) {
      runLength++;
      return;
    }
    flush();
    runChar = char;
    runLength = 1;
  };

  for (let y = 0; y < automata.height; y++) {
    // Trailing dead cells on a row are implied by the row terminator.
    let lastLive = -1;
    for (let x = automata.width - 1; x >= 0; x--) {
      if (automata.cells[y * automata.width + x]) {
        lastLive = x;
        break;
      }
    }
    for (let x = 0; x <= lastLive; x++) push(automata.cells[y * automata.width + x] ? 'o' : 'b');
    if (y < automata.height - 1) push('$');
  }
  flush();
  return `${tokens.join('')}!`;
}

/** Decode Life RLE onto a grid, ignoring `#` comments and an `x = …` header. */
export function decodeRLE(rle: string, automata: Automata, offsetX = 0, offsetY = 0): Automata {
  const body = rle
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#') && !/^\s*x\s*=/i.test(line))
    .join('')
    .replace(/\s+/g, '');

  let x = 0;
  let y = 0;
  let count = 0;
  for (const char of body) {
    if (char >= '0' && char <= '9') {
      count = count * 10 + Number(char);
      continue;
    }
    const repeat = count || 1;
    count = 0;
    if (char === '!') break;
    if (char === '$') {
      y += repeat;
      x = 0;
    } else if (char === 'b' || char === '.') {
      x += repeat;
    } else if (char === 'o' || char === 'A') {
      for (let i = 0; i < repeat; i++) automata.set(x + i + offsetX, y + offsetY, true);
      x += repeat;
    }
  }
  return automata;
}

/** Bounding-box dimensions of an RLE blob, without allocating a grid. */
export function measureRLE(rle: string): { width: number; height: number } {
  const body = rle
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#') && !/^\s*x\s*=/i.test(line))
    .join('')
    .replace(/\s+/g, '');
  let x = 0;
  let width = 0;
  let rows = 1;
  let count = 0;
  for (const char of body) {
    if (char >= '0' && char <= '9') {
      count = count * 10 + Number(char);
      continue;
    }
    const repeat = count || 1;
    count = 0;
    if (char === '!') break;
    if (char === '$') {
      rows += repeat;
      if (x > width) width = x;
      x = 0;
    } else if (char === 'b' || char === '.' || char === 'o' || char === 'A') {
      x += repeat;
    }
  }
  if (x > width) width = x;
  return { width, height: rows };
}

// ------------------------------------------------------------- save and load

/** Capture a running universe as a saveable object. */
export function saveUniverse(
  automata: Automata,
  meta: { name?: string; note?: string } = {},
): UniverseFile {
  return {
    format: UNIVERSE_FORMAT,
    version: UNIVERSE_VERSION,
    name: meta.name?.trim() || `${formatRule(automata.rule)} @ gen ${automata.generation}`,
    rule: automata.ruleString,
    width: automata.width,
    height: automata.height,
    generation: automata.generation,
    wrap: automata.wrap,
    population: automata.population,
    cells: encodeRLE(automata),
    savedAt: new Date().toISOString(),
    ...(meta.note ? { note: meta.note } : {}),
  };
}

/** Restore a saved universe. Pass `width`/`height` to reflow it onto a different screen. */
export function loadUniverse(
  input: UniverseFile | string,
  overrides: Partial<AutomataOptions> = {},
): Automata {
  const file: UniverseFile = typeof input === 'string' ? parseUniverse(input) : input;
  const width = Math.max(1, Math.floor(overrides.width ?? file.width));
  const height = Math.max(1, Math.floor(overrides.height ?? file.height));
  const automata = new Automata({
    width,
    height,
    rule: overrides.rule ?? file.rule,
    wrap: overrides.wrap ?? file.wrap ?? true,
    colors: overrides.colors ?? true,
    seed: overrides.seed,
  });

  // Centre the saved pattern when it is being restored onto a larger screen.
  const offsetX = Math.max(0, Math.floor((width - file.width) / 2));
  const offsetY = Math.max(0, Math.floor((height - file.height) / 2));
  decodeRLE(file.cells ?? '', automata, offsetX, offsetY);
  automata.generation = file.generation ?? 0;
  return automata;
}

/** Parse a universe from JSON, a share string, or bare RLE. */
export function parseUniverse(text: string): UniverseFile {
  const trimmed = text.trim();

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as UniverseFile;
    if (parsed.format !== UNIVERSE_FORMAT) {
      throw new Error(`Not a ${UNIVERSE_FORMAT} universe (format: ${String(parsed.format)})`);
    }
    return parsed;
  }

  // Bare RLE, possibly with the `#N name` / `#r rule` header lines Life uses.
  if (/[bo$!]/.test(trimmed) && !/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    const nameLine = /^#N\s+(.+)$/m.exec(trimmed);
    const ruleLine = /rule\s*=\s*([^\s,]+)/i.exec(trimmed) ?? /^#r\s+(.+)$/m.exec(trimmed);
    const { width, height } = measureRLE(trimmed);
    return {
      format: UNIVERSE_FORMAT,
      version: UNIVERSE_VERSION,
      name: nameLine?.[1]?.trim() || 'Imported pattern',
      rule: formatRule(parseRule(ruleLine?.[1] ?? 'B3/S23')),
      width,
      height,
      generation: 0,
      wrap: true,
      cells: trimmed,
    };
  }

  return fromShareString(trimmed);
}

// ------------------------------------------------------------ share strings

const toBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return globalThis.btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
};

const fromBase64 = (text: string): string => {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(text, 'base64').toString('utf8');
};

/** Pack a universe into one URL-safe string, for `?u=` links and QR codes. */
export function toShareString(input: Automata | UniverseFile, meta?: { name?: string }): string {
  const file = input instanceof Automata ? saveUniverse(input, meta) : input;
  const compact = [file.name, file.rule, file.width, file.height, file.generation, file.wrap ? 1 : 0, file.cells];
  return toBase64(JSON.stringify(compact)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Unpack a {@link toShareString} string. */
export function fromShareString(share: string): UniverseFile {
  const base64 = share.replace(/-/g, '+').replace(/_/g, '/');
  const [name, rule, width, height, generation, wrap, cells] = JSON.parse(fromBase64(base64)) as [
    string,
    string,
    number,
    number,
    number,
    number,
    string,
  ];
  return {
    format: UNIVERSE_FORMAT,
    version: UNIVERSE_VERSION,
    name,
    rule,
    width,
    height,
    generation,
    wrap: Boolean(wrap),
    cells,
  };
}

// ---------------------------------------------------------------- the shelf

/** The slice of `localStorage` (or any key/value store) this library needs. */
export interface UniverseStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * A named shelf of saved universes on top of any key/value store —
 * `localStorage` in the browser, a JSON file in the CLI.
 */
export class UniverseLibrary {
  constructor(
    private storage: UniverseStorage,
    private key = 'complexity-automata:universes',
  ) {}

  /** Every saved universe, newest first. */
  list(): UniverseFile[] {
    try {
      const raw = this.storage.getItem(this.key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as UniverseFile[]) : [];
    } catch {
      return [];
    }
  }

  /** Look one up by name. */
  get(name: string): UniverseFile | undefined {
    const key = name.trim().toLowerCase();
    return this.list().find((u) => u.name.trim().toLowerCase() === key);
  }

  /** Save a universe, replacing any earlier one with the same name. */
  save(input: Automata | UniverseFile, meta: { name?: string; note?: string } = {}): UniverseFile {
    const file = input instanceof Automata ? saveUniverse(input, meta) : { ...input, ...meta };
    const rest = this.list().filter((u) => u.name.trim().toLowerCase() !== file.name.trim().toLowerCase());
    this.write([file, ...rest]);
    return file;
  }

  /** Forget a universe. Returns whether there was one to forget. */
  remove(name: string): boolean {
    const key = name.trim().toLowerCase();
    const kept = this.list().filter((u) => u.name.trim().toLowerCase() !== key);
    const removed = kept.length !== this.list().length;
    if (removed) this.write(kept);
    return removed;
  }

  /** Empty the shelf. */
  clear(): void {
    this.write([]);
  }

  private write(universes: UniverseFile[]): void {
    this.storage.setItem(this.key, JSON.stringify(universes));
  }
}

/** An in-memory {@link UniverseStorage}, for tests and for SSR. */
export function memoryStorage(): UniverseStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

/** Rule-like value straight to the notation a saved file stores. */
export function ruleToString(rule: RuleLike): string {
  return formatRule(parseRule(rule));
}
