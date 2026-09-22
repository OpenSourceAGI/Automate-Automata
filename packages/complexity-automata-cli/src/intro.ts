/**
 * The intro screen: Conway's Game of Life running behind a panel that says
 * what you are looking at and which keys do what.
 *
 * The panel is cut out of the grid itself — the cells under it are cleared so
 * the text sits in empty space — and then written with cursor positioning, so
 * the animation keeps running around the edges of it.
 */

import type { Automata } from 'complexity-automata';
import { bold, dim, renderFrame, RESET, type RenderOptions } from './render.js';

const ESC = '\u001B[';

export const INTRO_LINES = [
  '',
  "  C O M P L E X I T Y   A U T O M A T A",
  '',
  "  Conway's Game of Life, and 262,143 other universes.",
  '',
  '  A cell is born when it has exactly 3 live neighbours,',
  '  and survives with 2 or 3. That is the whole rule — the',
  '  gliders, guns and fractals all follow from it.',
  '',
  '  space play/pause    n next rule      a automatic mode',
  '  p stamp pattern     r random soup    s save universe',
  '  d next demo         + / - speed      q quit',
  '',
  '  press any key to begin',
  '',
];

/** Clear a box in the middle of the grid and write the intro text into it. */
export function renderIntro(automata: Automata, options: RenderOptions = {}): string {
  const lines = INTRO_LINES;
  const boxWidth = Math.max(...lines.map((l) => l.length)) + 2;
  const boxHeight = lines.length;

  // Terminal rows are two grid rows tall, so the box is measured in char rows.
  const charRows = Math.ceil(automata.height / 2);
  const left = Math.max(0, Math.floor((automata.width - boxWidth) / 2));
  const top = Math.max(0, Math.floor((charRows - boxHeight) / 2));

  for (let row = top; row < Math.min(charRows, top + boxHeight); row++) {
    for (let x = left; x < Math.min(automata.width, left + boxWidth); x++) {
      automata.set(x, row * 2, false);
      automata.set(x, row * 2 + 1, false);
    }
  }

  const out: string[] = [renderFrame(automata, options)];
  lines.forEach((line, i) => {
    const row = top + i + 1; // ANSI rows are 1-based
    const column = left + 1;
    const text = i === 1 ? bold(line) : i === lines.length - 2 ? dim(line) : line;
    out.push(`${ESC}${row};${column}H${RESET}${text}${RESET}`);
  });
  return out.join('');
}
