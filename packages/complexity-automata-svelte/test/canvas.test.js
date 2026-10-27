import { describe, expect, test } from 'bun:test';
import { Automata } from 'complexity-automata';
import { cellAtPointer, gridSizeFor } from '../src/canvas.js';

describe('gridSizeFor', () => {
  test('divides the viewport by the cell size', () => {
    expect(gridSizeFor(800, 600, 4)).toEqual({ width: 200, height: 150 });
  });

  test('a bigger cell size means a smaller, cheaper universe', () => {
    expect(gridSizeFor(800, 600, 8)).toEqual({ width: 100, height: 75 });
  });

  test('never returns a degenerate grid', () => {
    expect(gridSizeFor(10, 10, 40)).toEqual({ width: 8, height: 8 });
    expect(gridSizeFor(0, 0, 0)).toEqual({ width: 8, height: 8 });
  });
});

describe('cellAtPointer', () => {
  const canvas = (rect) => ({ getBoundingClientRect: () => rect });
  const automata = new Automata({ width: 100, height: 50 });

  test('maps client coordinates onto grid cells', () => {
    const element = canvas({ left: 0, top: 0, width: 400, height: 200 });
    expect(cellAtPointer(element, automata, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(cellAtPointer(element, automata, 200, 100)).toEqual({ x: 50, y: 25 });
    expect(cellAtPointer(element, automata, 399, 199)).toEqual({ x: 99, y: 49 });
  });

  test('accounts for where the canvas sits on the page', () => {
    const element = canvas({ left: 40, top: 20, width: 400, height: 200 });
    expect(cellAtPointer(element, automata, 40, 20)).toEqual({ x: 0, y: 0 });
    expect(cellAtPointer(element, automata, 240, 120)).toEqual({ x: 50, y: 25 });
  });
});
