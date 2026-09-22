import { describe, expect, test } from 'bun:test';
import { Automata, fromString } from '../src/automata.js';

describe('Conway rules', () => {
  test('a blinker oscillates with period 2', () => {
    const life = fromString('.....\n.....\n.###.\n.....\n.....', { wrap: false });
    const start = life.toString();
    life.step();
    expect(life.toString()).not.toBe(start);
    life.step();
    expect(life.toString()).toBe(start);
  });

  test('a block is a still life', () => {
    const life = fromString('....\n.##.\n.##.\n....', { wrap: false });
    const start = life.toString();
    life.run(5);
    expect(life.toString()).toBe(start);
  });

  test('a glider moves one cell diagonally every four generations', () => {
    const life = new Automata({ width: 20, height: 20, rule: 'B3/S23', wrap: false });
    life.stamp('Glider', 2, 2);
    const before = life.liveCells();
    life.run(4);
    const after = life.liveCells();
    expect(after.length).toBe(before.length);
    const shifted = before.map(([x, y]) => `${x + 1},${y + 1}`).sort();
    expect(after.map(([x, y]) => `${x},${y}`).sort()).toEqual(shifted);
  });

  test('lone cells die of loneliness', () => {
    const life = new Automata({ width: 10, height: 10, wrap: false });
    life.set(5, 5, true);
    life.step();
    expect(life.population).toBe(0);
  });
});

describe('grid mechanics', () => {
  test('wrap makes the grid a torus', () => {
    const wrapped = new Automata({ width: 8, height: 8, wrap: true });
    expect(wrapped.index(-1, -1)).toBe(7 * 8 + 7);

    const bounded = new Automata({ width: 8, height: 8, wrap: false });
    expect(bounded.index(-1, -1)).toBe(-1);
    expect(bounded.get(-1, -1)).toBe(0);
  });

  test('population tracks set, toggle and clear', () => {
    const life = new Automata({ width: 6, height: 6 });
    life.set(1, 1, true).set(1, 1, true).toggle(2, 2);
    expect(life.population).toBe(2);
    life.toggle(2, 2);
    expect(life.population).toBe(1);
    life.clear();
    expect(life.population).toBe(0);
  });

  test('neighbour counts ignore the cell itself', () => {
    const life = fromString('###\n###\n###', { wrap: false });
    expect(life.countNeighbors(1, 1)).toBe(8);
    expect(life.countNeighbors(0, 0)).toBe(3);
  });

  test('resizing keeps the cells that still fit', () => {
    const life = new Automata({ width: 10, height: 10, wrap: false });
    life.stamp('Glider', 1, 1);
    const bigger = life.resized(20, 20);
    expect(bigger.liveCells()).toEqual(life.liveCells());
    expect(bigger.width).toBe(20);
  });

  test('clones are independent', () => {
    const life = new Automata({ width: 8, height: 8 });
    life.set(0, 0, true);
    const copy = life.clone();
    copy.set(1, 1, true);
    expect(life.get(1, 1)).toBe(0);
    expect(copy.get(0, 0)).toBe(1);
  });
});

describe('determinism', () => {
  test('the same seed gives the same random soup', () => {
    const a = new Automata({ width: 30, height: 30, seed: 42 }).randomize(0.3);
    const b = new Automata({ width: 30, height: 30, seed: 42 }).randomize(0.3);
    expect(a.toString()).toBe(b.toString());
  });

  test('different seeds give different soups', () => {
    const a = new Automata({ width: 30, height: 30, seed: 1 }).randomize(0.3);
    const b = new Automata({ width: 30, height: 30, seed: 2 }).randomize(0.3);
    expect(a.toString()).not.toBe(b.toString());
  });
});

describe('stagnation', () => {
  test('an empty grid is stagnant', () => {
    const life = new Automata({ width: 10, height: 10 });
    expect(life.isStagnant()).toBe(true);
  });

  test('a still life is stagnant once it has a few generations of history', () => {
    const life = fromString('....\n.##.\n.##.\n....', { wrap: false });
    life.run(5);
    expect(life.isStagnant()).toBe(true);
  });

  test('a glider on a big grid is not stagnant', () => {
    const life = new Automata({ width: 40, height: 40, wrap: false });
    life.stamp('Glider', 2, 2);
    life.run(6);
    expect(life.isStagnant()).toBe(false);
  });
});

describe('colour inheritance', () => {
  test('a cell born beside a colony inherits its colour', () => {
    const life = new Automata({ width: 12, height: 12, wrap: false });
    life.set(5, 5, true, [200, 0, 0]);
    life.set(5, 6, true, [200, 0, 0]);
    life.set(6, 5, true, [200, 0, 0]);
    life.step();
    expect(life.colorAt(6, 6)).toEqual([200, 0, 0]);
  });

  test('dead cells have no colour', () => {
    const life = new Automata({ width: 6, height: 6 });
    expect(life.colorAt(0, 0)).toEqual([0, 0, 0]);
  });

  test('colour tracking can be turned off', () => {
    const life = new Automata({ width: 6, height: 6, colors: false });
    life.set(1, 1, true);
    expect(life.colors.length).toBe(0);
    expect(life.get(1, 1)).toBe(1);
  });
});

describe('rules on a running grid', () => {
  test('toggling rule bits rewrites the rule string', () => {
    const life = new Automata({ width: 8, height: 8, rule: 'B3/S23' });
    life.toggleRuleBit('birth', 6);
    expect(life.ruleString).toBe('B36/S23');
    life.toggleRuleBit('survive', 2);
    expect(life.ruleString).toBe('B36/S3');
  });

  test('rule numbers survive a round trip through the engine', () => {
    const life = new Automata({ width: 8, height: 8, rule: 6152 });
    expect(life.ruleString).toBe('B3/S23');
    expect(life.ruleNumber).toBe(6152);
  });
});
