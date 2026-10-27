import { describe, expect, test } from 'bun:test';
import { Automata } from '../src/automata.js';
import {
  decodeRLE,
  encodeRLE,
  fromShareString,
  loadUniverse,
  memoryStorage,
  parseUniverse,
  saveUniverse,
  toShareString,
  UniverseLibrary,
} from '../src/universe.js';

const glider = (): Automata => new Automata({ width: 20, height: 20, wrap: false }).stamp('Glider', 3, 3);

describe('RLE', () => {
  test('round-trips a pattern', () => {
    const life = glider();
    const restored = decodeRLE(encodeRLE(life), new Automata({ width: 20, height: 20, wrap: false }));
    expect(restored.toString()).toBe(life.toString());
  });

  test('encodes runs rather than single cells', () => {
    const row = new Automata({ width: 30, height: 1, wrap: false });
    for (let x = 0; x < 10; x++) row.set(x, 0, true);
    expect(encodeRLE(row)).toBe('10o!');
  });

  test('reads RLE with a header and comments', () => {
    const text = '#N Glider\nx = 3, y = 3, rule = B3/S23\nbob$2bo$3o!';
    const life = decodeRLE(text, new Automata({ width: 10, height: 10, wrap: false }));
    expect(life.population).toBe(5);
  });
});

describe('save and load', () => {
  test('a saved universe restores its cells, rule and generation', () => {
    const life = glider();
    life.run(3);
    const file = saveUniverse(life, { name: 'test glider' });
    const restored = loadUniverse(file);
    expect(restored.toString()).toBe(life.toString());
    expect(restored.ruleString).toBe(life.ruleString);
    expect(restored.generation).toBe(life.generation);
    expect(file.name).toBe('test glider');
  });

  test('restoring onto a bigger grid centres the pattern', () => {
    const life = glider();
    const restored = loadUniverse(saveUniverse(life), { width: 60, height: 60 });
    expect(restored.population).toBe(life.population);
    expect(restored.width).toBe(60);
  });

  test('share strings round-trip', () => {
    const life = glider();
    const share = toShareString(life, { name: 'shared' });
    expect(share).not.toMatch(/[+/=]/);
    const file = fromShareString(share);
    expect(file.name).toBe('shared');
    expect(loadUniverse(file).toString()).toBe(life.toString());
  });

  test('parseUniverse accepts JSON, share strings and bare RLE', () => {
    const life = glider();
    expect(parseUniverse(JSON.stringify(saveUniverse(life))).rule).toBe('B3/S23');
    expect(parseUniverse(toShareString(life)).rule).toBe('B3/S23');
    const bare = parseUniverse('#N Glider\nx = 3, y = 3, rule = B3/S23\nbob$2bo$3o!');
    expect(bare.name).toBe('Glider');
    expect(loadUniverse(bare).population).toBe(5);
  });

  test('rejects JSON that is not a universe', () => {
    expect(() => parseUniverse('{"format":"something-else"}')).toThrow();
  });
});

describe('UniverseLibrary', () => {
  test('saves, lists, replaces and removes', () => {
    const library = new UniverseLibrary(memoryStorage());
    library.save(glider(), { name: 'one' });
    library.save(glider(), { name: 'two' });
    expect(library.list().map((u) => u.name)).toEqual(['two', 'one']);

    library.save(glider().run(2), { name: 'one' });
    expect(library.list().length).toBe(2);
    expect(library.list()[0]!.name).toBe('one');
    expect(library.get('ONE')?.generation).toBe(2);

    expect(library.remove('one')).toBe(true);
    expect(library.remove('one')).toBe(false);
    expect(library.list().map((u) => u.name)).toEqual(['two']);

    library.clear();
    expect(library.list()).toEqual([]);
  });

  test('survives corrupted storage', () => {
    const storage = memoryStorage();
    storage.setItem('complexity-automata:universes', 'not json');
    expect(new UniverseLibrary(storage).list()).toEqual([]);
  });
});
