/**
 * Building the universe a run starts from, and the status line that describes
 * it. Kept out of `cli.ts` so both can be tested without a terminal.
 */

import {
  Automata,
  buildDemo,
  demos,
  getDemo,
  getPattern,
  loadUniverse,
  NAMED_RULES,
  parseUniverse,
  patterns,
  saveUniverse,
  type UniverseFile,
} from 'complexity-automata';
import type { CliOptions } from './args.js';
import { bold, dim } from './render.js';

export interface BuildResult {
  automata: Automata;
  /** What the status line calls this universe. */
  title: string;
}

/**
 * Turn the parsed options into a running universe. Precedence is
 * `--load` over `--rule`/`--pattern` over `--demo`, because a saved universe is
 * the most specific thing the user can ask for.
 */
export function buildUniverse(options: CliOptions, size: { width: number; height: number }, source?: string): BuildResult {
  const { width, height } = size;

  if (options.rule) checkRule(options.rule);

  if (options.load && source !== undefined) {
    const file: UniverseFile = parseUniverse(source);
    const automata = loadUniverse(file, { width, height, wrap: options.wrap, seed: options.seed });
    if (options.rule) automata.setRule(options.rule);
    return { automata, title: file.name || 'saved universe' };
  }

  if (options.rule || options.pattern) {
    const automata = new Automata({
      width,
      height,
      rule: options.rule ?? 'B3/S23',
      wrap: options.wrap,
      seed: options.seed,
    });
    if (options.pattern) {
      const pattern = getPattern(options.pattern);
      if (!pattern) throw new Error(`unknown pattern: ${options.pattern} (try \`automata patterns\`)`);
      automata.stampCentered(pattern);
    } else {
      automata.randomize(options.density ?? 0.28);
    }
    return { automata, title: options.pattern ?? automata.ruleString };
  }

  const demo = getDemo(options.demo ?? 'conway');
  if (options.demo && !demo) throw new Error(`unknown demo: ${options.demo} (try \`automata demos\`)`);
  const automata = buildDemo(demo?.id ?? 'conway', { width, height, wrap: options.wrap, seed: options.seed });
  if (options.density !== undefined) automata.randomize(options.density);
  return { automata, title: demo?.name ?? "Conway's Game of Life" };
}

/**
 * Reject a rule nobody meant to ask for. The parser is deliberately forgiving —
 * it reads anything with digits in it — so a typo like `--rule conwya` would
 * otherwise become an empty rule and an empty screen.
 */
export function checkRule(rule: string): void {
  if (/\d/.test(rule)) return;
  if (NAMED_RULES[rule.trim().toLowerCase()]) return;
  const names = Object.keys(NAMED_RULES).slice(0, 8).join(', ');
  throw new Error(`unknown rule: ${rule} — try B3/S23, a rule number, or a name (${names}, …)`);
}

export interface StatusInfo {
  title: string;
  playing: boolean;
  auto: boolean;
  fps: number;
  saved?: string;
}

/**
 * The one-line status bar under the animation.
 *
 * It must never wrap onto a second line — that would push the frame up and
 * leave a trail — so the hint is dropped, and then the text truncated, until
 * what is left fits the terminal.
 */
export function statusLine(automata: Automata, info: StatusInfo, width: number): string {
  const parts = [
    bold(info.title),
    automata.ruleString,
    `#${automata.ruleNumber}`,
    `gen ${automata.generation}`,
    `pop ${automata.population}`,
    `${info.fps}fps`,
  ];
  if (info.auto) parts.push('auto');
  if (!info.playing) parts.push('paused');

  const left = parts.join(dim(' \u00b7 '));
  const leftWidth = stripAnsi(left).length;
  if (leftWidth >= width) {
    // No room for decoration: plain text, cut to the terminal.
    return stripAnsi(left).slice(0, width);
  }

  const hint = info.saved ?? 'space pause \u00b7 n rule \u00b7 a auto \u00b7 s save \u00b7 q quit';
  const hintWidth = stripAnsi(hint).length;
  if (leftWidth + hintWidth + 1 > width) return left;

  return `${left}${' '.repeat(width - leftWidth - hintWidth)}${dim(hint)}`;
}

/** Remove ANSI escapes so a coloured string can be measured in columns. */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001B\[[0-9;]*[A-Za-z]/g, '');
}

/** `automata demos` output. */
export function demoList(): string {
  return demos
    .map((demo) => `  ${demo.id.padEnd(10)} ${bold(demo.name)} ${dim(demo.rule)}\n      ${wrap(demo.about, 72, 6)}`)
    .join('\n');
}

/** `automata patterns` output. */
export function patternList(): string {
  return patterns
    .filter((p) => p.cells.length > 0)
    .map((p) => `  ${p.name.padEnd(22)} ${dim(`${p.category}${p.rule ? ` · ${p.rule}` : ''}`)}\n      ${wrap(p.about ?? '', 72, 6)}`)
    .join('\n');
}

/** `automata saved` output. */
export function savedList(files: UniverseFile[]): string {
  if (files.length === 0) return dim('  no saved universes yet — press s while one is running');
  return files
    .map(
      (file) =>
        `  ${file.name.padEnd(28)} ${dim(`${file.rule} · ${file.width}×${file.height} · gen ${file.generation} · pop ${file.population ?? '?'}`)}`,
    )
    .join('\n');
}

/** Name a universe gets when it is saved without one. */
export function autoName(automata: Automata, title: string): string {
  return `${title} ${automata.ruleString} gen${automata.generation}`;
}

/** A universe ready to be written to disk. */
export function snapshot(automata: Automata, name: string, note?: string): UniverseFile {
  return saveUniverse(automata, { name, note });
}

function wrap(text: string, width: number, indent: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join(`\n${' '.repeat(indent)}`);
}
