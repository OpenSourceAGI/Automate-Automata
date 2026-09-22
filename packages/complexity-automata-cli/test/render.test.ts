import { describe, expect, test } from 'bun:test';
import { Automata } from 'complexity-automata';
import { gridHeightForRows, renderFrame, stripAnsiForTest, toAnsi256 } from './helpers.js';

const grid = (): Automata => {
  const life = new Automata({ width: 4, height: 4, wrap: false });
  life.set(0, 0, true, [255, 0, 0]);
  life.set(1, 1, true, [0, 255, 0]);
  return life;
};

describe('renderFrame', () => {
  test('two grid rows share one terminal row', () => {
    expect(renderFrame(grid(), { color: 'mono' }).split('\n').length).toBe(2);
  });

  test('mono mode uses block characters and no escapes', () => {
    const frame = renderFrame(grid(), { color: 'mono' });
    expect(frame).not.toContain('\u001B');
    expect(frame).toContain('▀');
  });

  test('truecolor mode emits 24 bit colour for live cells', () => {
    const frame = renderFrame(grid(), { color: 'truecolor' });
    // The top cell of a pair is the foreground, the bottom one the background.
    expect(frame).toContain('38;2;255;0;0');
    expect(frame).toContain('48;2;0;255;0');
  });

  test('256 colour mode emits palette indexes instead', () => {
    const frame = renderFrame(grid(), { color: 'ansi256' });
    expect(frame).toContain('38;5;');
    expect(frame).not.toContain('38;2;');
  });

  test('repeated colours are not repeated in the output', () => {
    const life = new Automata({ width: 40, height: 2, wrap: false });
    for (let x = 0; x < 40; x++) life.set(x, 0, true, [10, 20, 30]);
    const frame = renderFrame(life, { color: 'truecolor' });
    expect(frame.split('38;2;10;20;30').length - 1).toBe(1);
  });

  test('ascii mode falls back to plain characters', () => {
    const frame = renderFrame(grid(), { ascii: true });
    expect(stripAnsiForTest(frame)).toBe(frame);
    expect(frame.split('\n').length).toBe(4);
    expect(frame[0]).toBe('#');
  });

  test('an empty grid renders blank rows of the right width', () => {
    const empty = new Automata({ width: 10, height: 6 });
    expect(renderFrame(empty, { color: 'mono' }).split('\n')).toEqual([' '.repeat(10), ' '.repeat(10), ' '.repeat(10)]);
  });
});

describe('sizing', () => {
  test('block mode gets two grid rows per terminal row', () => {
    expect(gridHeightForRows(24, 1)).toBe(46);
  });

  test('ascii mode gets one', () => {
    expect(gridHeightForRows(24, 1, true)).toBe(23);
  });

  test('never returns a zero-height grid', () => {
    expect(gridHeightForRows(1, 1)).toBe(2);
  });
});

describe('toAnsi256', () => {
  test('maps greys onto the grey ramp', () => {
    expect(toAnsi256([0, 0, 0])).toBe(16);
    expect(toAnsi256([255, 255, 255])).toBe(231);
    expect(toAnsi256([128, 128, 128])).toBeGreaterThanOrEqual(232);
  });

  test('maps colours into the 6×6×6 cube', () => {
    expect(toAnsi256([255, 0, 0])).toBe(196);
    expect(toAnsi256([0, 255, 0])).toBe(46);
  });
});
