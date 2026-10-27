/**
 * Terminal rendering.
 *
 * A terminal cell is about twice as tall as it is wide, so every character
 * shows two grid rows: the half block `▀` painted with the top cell's colour as
 * foreground and the bottom cell's colour as background. That gives square
 * pixels and doubles the vertical resolution for free.
 *
 * These functions are pure — they return the string to print, which is what
 * makes the renderer testable without a terminal.
 */

import type { Automata, RGB } from 'complexity-automata';

export type ColorMode = 'truecolor' | 'ansi256' | 'mono';

export interface RenderOptions {
  /** How much colour the terminal can take. */
  color?: ColorMode;
  /** Use `#`/`.` instead of block characters, for terminals without them. */
  ascii?: boolean;
  /** Background colour for dead cells. Default black. */
  background?: RGB;
  /** Colour for live cells in `mono` mode. Default the terminal's default. */
  foreground?: RGB;
}

const ESC = '\u001B[';
export const RESET = `${ESC}0m`;
export const HIDE_CURSOR = `${ESC}?25l`;
export const SHOW_CURSOR = `${ESC}?25h`;
export const CLEAR_SCREEN = `${ESC}2J${ESC}H`;
export const HOME = `${ESC}H`;
export const ALT_SCREEN_ON = `${ESC}?1049h`;
export const ALT_SCREEN_OFF = `${ESC}?1049l`;

const UPPER_HALF = '▀'; // ▀
const FULL_BLOCK = '█'; // █

/** Nearest xterm-256 colour index for an RGB triple. */
export function toAnsi256([r, g, b]: RGB): number {
  // Greys have their own ramp at the end of the palette and look much better
  // than the 6×6×6 cube's nearest match.
  if (Math.abs(r - g) < 8 && Math.abs(g - b) < 8) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return 232 + Math.round(((r - 8) / 247) * 24);
  }
  const level = (v: number): number => Math.round((v / 255) * 5);
  return 16 + 36 * level(r) + 6 * level(g) + level(b);
}

const fg = (color: RGB, mode: ColorMode): string =>
  mode === 'truecolor'
    ? `${ESC}38;2;${color[0]};${color[1]};${color[2]}m`
    : `${ESC}38;5;${toAnsi256(color)}m`;

const bg = (color: RGB, mode: ColorMode): string =>
  mode === 'truecolor'
    ? `${ESC}48;2;${color[0]};${color[1]};${color[2]}m`
    : `${ESC}48;5;${toAnsi256(color)}m`;

const sameColor = (a: RGB | null, b: RGB | null): boolean =>
  a === b || (a !== null && b !== null && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);

/**
 * One frame of the animation, without a trailing newline.
 *
 * Consecutive cells of the same colour share one escape sequence, which keeps
 * a full-screen frame down to a few kilobytes instead of tens of them.
 */
export function renderFrame(automata: Automata, options: RenderOptions = {}): string {
  const mode = options.color ?? 'truecolor';
  const background = options.background ?? ([0, 0, 0] as RGB);

  if (options.ascii) return renderAscii(automata, mode, options);

  const lines: string[] = [];
  for (let y = 0; y < automata.height; y += 2) {
    let line = '';
    let currentFg: RGB | null = null;
    let currentBg: RGB | null = null;

    for (let x = 0; x < automata.width; x++) {
      const topAlive = automata.get(x, y) === 1;
      const bottomAlive = y + 1 < automata.height && automata.get(x, y + 1) === 1;

      if (mode === 'mono') {
        line += topAlive && bottomAlive ? FULL_BLOCK : topAlive ? UPPER_HALF : bottomAlive ? '▄' : ' ';
        continue;
      }

      const top = topAlive ? cellColor(automata, x, y, options) : background;
      const bottom = bottomAlive ? cellColor(automata, x, y + 1, options) : background;
      if (!sameColor(top, currentFg)) {
        line += fg(top, mode);
        currentFg = top;
      }
      if (!sameColor(bottom, currentBg)) {
        line += bg(bottom, mode);
        currentBg = bottom;
      }
      line += UPPER_HALF;
    }
    lines.push(mode === 'mono' ? line : line + RESET);
  }
  return lines.join('\n');
}

function cellColor(automata: Automata, x: number, y: number, options: RenderOptions): RGB {
  const color = automata.colorAt(x, y);
  if (color[0] || color[1] || color[2]) return color;
  return options.foreground ?? ([220, 220, 220] as RGB);
}

function renderAscii(automata: Automata, _mode: ColorMode, _options: RenderOptions): string {
  const lines: string[] = [];
  for (let y = 0; y < automata.height; y++) {
    let line = '';
    for (let x = 0; x < automata.width; x++) line += automata.get(x, y) ? '#' : ' ';
    lines.push(line);
  }
  return lines.join('\n');
}

/** Grid rows that fit in a terminal of `rows` lines, leaving room for the status bar. */
export function gridHeightForRows(rows: number, statusLines = 1, ascii = false): number {
  const usable = Math.max(1, rows - statusLines);
  return ascii ? usable : usable * 2;
}

/** Dim grey text for the status line. */
export function dim(text: string): string {
  return `${ESC}2m${text}${RESET}`;
}

/** Bold text for the status line. */
export function bold(text: string): string {
  return `${ESC}1m${text}${RESET}`;
}

/** Move the cursor to the top-left without clearing — how frames are swapped. */
export function frameTo(width: number, height: number, frame: string, status: string): string {
  void width;
  void height;
  return `${HOME}${frame}\n${status}${ESC}0K`;
}
