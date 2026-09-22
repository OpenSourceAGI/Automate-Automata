/**
 * Colour is not part of the automaton's physics — it is inheritance.
 *
 * A cell born next to living cells takes the average colour of those parents,
 * so colonies drift into their own hues and collisions between two colonies
 * fade into a blend. A cell born with no live neighbours (a stamped pattern,
 * a random seed) gets a fresh colour derived from the rule and generation, so
 * each universe looks different from the last.
 */

export type RGB = [number, number, number];

const clampByte = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n));

/** Convert HSL (h in degrees, s and l in 0..1) to 8 bit RGB. */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [clampByte((r + m) * 255), clampByte((g + m) * 255), clampByte((b + m) * 255)];
}

/** `#rrggbb` for CSS, canvases and anything that wants a hex string. */
export function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Parse `#rgb`, `#rrggbb` or `rgb(r,g,b)` into a tuple. Returns null if it can't. */
export function parseColor(input: string): RGB | null {
  const text = input.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(text);
  if (short) return [0x11 * parseInt(short[1]!, 16), 0x11 * parseInt(short[2]!, 16), 0x11 * parseInt(short[3]!, 16)];
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(text);
  if (long) return [parseInt(long[1]!, 16), parseInt(long[2]!, 16), parseInt(long[3]!, 16)];
  const fn = /^rgba?\(([^)]+)\)$/i.exec(text);
  if (fn) {
    const parts = fn[1]!.split(',').map((p) => clampByte(Number(p)));
    if (parts.length >= 3) return [parts[0]!, parts[1]!, parts[2]!];
  }
  return null;
}

/** Average a handful of parent colours into the colour a child inherits. */
export function blend(colors: RGB[]): RGB {
  if (colors.length === 0) return [0, 0, 0];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const c of colors) {
    r += c[0];
    g += c[1];
    b += c[2];
  }
  const n = colors.length;
  return [clampByte(r / n), clampByte(g / n), clampByte(b / n)];
}

/**
 * The colour a spontaneously-born cell starts with.
 *
 * The rule number sets the palette, so successive universes look different;
 * position drifts the hue about a degree per cell, so colonies on opposite
 * sides of the grid are clearly different colours while neighbours — which
 * will end up blending into each other anyway — stay close; and the generation
 * moves the whole thing slowly through the spectrum as a universe runs.
 */
export function seedColor(ruleNumber: number, generation: number, x = 0, y = 0): RGB {
  const hue = (ruleNumber * 137.508 + generation * 2.5 + x * 0.7 + y * 1.1) % 360;
  const saturation = 0.55 + ((ruleNumber >> 5) % 40) / 100;
  const lightness = 0.42 + ((ruleNumber >> 11) % 22) / 100;
  return hslToRgb(hue, saturation, lightness);
}

/** Mix a colour toward another by `amount` (0..1) — used for fade-out trails. */
export function mix(a: RGB, b: RGB, amount: number): RGB {
  const t = amount < 0 ? 0 : amount > 1 ? 1 : amount;
  return [clampByte(a[0] + (b[0] - a[0]) * t), clampByte(a[1] + (b[1] - a[1]) * t), clampByte(a[2] + (b[2] - a[2]) * t)];
}
