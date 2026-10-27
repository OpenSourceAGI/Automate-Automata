import { describe, expect, test } from 'bun:test';
import { saveUniverse } from 'complexity-automata';
import { parseArgs } from '../src/args.js';
import { autoName, buildUniverse, demoList, patternList, savedList, statusLine, stripAnsi } from '../src/session.js';

const options = (argv: string[]) => parseArgs(argv).options;
const size = { width: 60, height: 30 };

describe('buildUniverse', () => {
  test('builds the named demo', () => {
    const { automata, title } = buildUniverse(options(['fractal']), size);
    expect(automata.ruleString).toBe('B1357/S1357');
    expect(title).toBe('Fractal Replicator');
  });

  test('an unknown demo is an error, not a silent fallback', () => {
    expect(() => buildUniverse(options(['--demo', 'nope']), size)).toThrow(/unknown demo/);
  });

  test('a rule without a pattern seeds a random soup', () => {
    const { automata } = buildUniverse(options(['--rule', 'B36/S23', '--seed', '4']), size);
    expect(automata.ruleString).toBe('B36/S23');
    expect(automata.population).toBeGreaterThan(0);
  });

  test('a pattern is stamped in the centre', () => {
    const { automata } = buildUniverse(options(['--pattern', 'Glider']), size);
    expect(automata.population).toBe(5);
    expect(automata.liveCells().every(([x, y]) => x > 20 && y > 10)).toBe(true);
  });

  test('a rule that is not a rule is an error, not an empty screen', () => {
    expect(() => buildUniverse(options(['--rule', 'conwya']), size)).toThrow(/unknown rule/);
    expect(buildUniverse(options(['--rule', 'highlife']), size).automata.ruleString).toBe('B36/S23');
    expect(buildUniverse(options(['--rule', '6152']), size).automata.ruleString).toBe('B3/S23');
  });

  test('an unknown pattern is an error', () => {
    expect(() => buildUniverse(options(['--pattern', 'Banana']), size)).toThrow(/unknown pattern/);
  });

  test('a loaded universe wins over the demo', () => {
    const source = JSON.stringify(saveUniverse(buildUniverse(options(['gun']), size).automata, { name: 'my gun' }));
    const { automata, title } = buildUniverse(options(['--load', 'file.json', '--demo', 'fractal']), size, source);
    expect(title).toBe('my gun');
    expect(automata.ruleString).toBe('B3/S23');
  });

  test('--rule still applies on top of a loaded universe', () => {
    const source = JSON.stringify(saveUniverse(buildUniverse(options(['gun']), size).automata, { name: 'g' }));
    const { automata } = buildUniverse(options(['--load', 'f.json', '--rule', 'B2/S']), size, source);
    expect(automata.ruleString).toBe('B2/S');
  });

  test('the same seed builds the same universe twice', () => {
    const a = buildUniverse(options(['soup', '--seed', '11']), size).automata;
    const b = buildUniverse(options(['soup', '--seed', '11']), size).automata;
    expect(a.toString()).toBe(b.toString());
  });
});

describe('status line', () => {
  test('fits the terminal width and names the rule', () => {
    const { automata } = buildUniverse(options(['gun']), size);
    const line = statusLine(automata, { title: 'Gosper Glider Gun', playing: true, auto: false, fps: 20 }, 120);
    expect(stripAnsi(line).length).toBe(120);
    expect(stripAnsi(line)).toContain('B3/S23');
    expect(stripAnsi(line)).toContain('gen 0');
  });

  test('drops the hint, then truncates, rather than wrapping', () => {
    const { automata } = buildUniverse(options(['gun']), size);
    const info = { title: 'Gosper Glider Gun', playing: true, auto: false, fps: 20 } as const;
    expect(stripAnsi(statusLine(automata, info, 60)).length).toBeLessThanOrEqual(60);
    expect(stripAnsi(statusLine(automata, info, 20)).length).toBe(20);
    expect(statusLine(automata, info, 20)).not.toContain('\u001B');
  });

  test('says when it is paused and when automatic mode is on', () => {
    const { automata } = buildUniverse(options(['gun']), size);
    const line = stripAnsi(statusLine(automata, { title: 'x', playing: false, auto: true, fps: 20 }, 120));
    expect(line).toContain('paused');
    expect(line).toContain('auto');
  });
});

describe('listings', () => {
  test('demos, patterns and saved universes all render', () => {
    expect(stripAnsi(demoList())).toContain("Conway's Game of Life");
    expect(stripAnsi(patternList())).toContain('Glider Gun');
    expect(stripAnsi(savedList([]))).toContain('no saved universes yet');
    const file = saveUniverse(buildUniverse(options(['gun']), size).automata, { name: 'kept' });
    expect(stripAnsi(savedList([file]))).toContain('kept');
  });
});

describe('autoName', () => {
  test('describes the universe it came from', () => {
    const { automata } = buildUniverse(options(['gun']), size);
    expect(autoName(automata, 'Gun')).toBe('Gun B3/S23 gen0');
  });
});
