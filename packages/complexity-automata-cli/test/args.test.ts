import { describe, expect, test } from 'bun:test';
import { parseArgs } from '../src/args.js';

describe('parseArgs', () => {
  test('defaults to running the Conway demo', () => {
    const { options, errors } = parseArgs([]);
    expect(errors).toEqual([]);
    expect(options.command).toBe('run');
    expect(options.demo).toBeUndefined();
    expect(options.fps).toBe(20);
    expect(options.wrap).toBe(true);
  });

  test('a bare word is a demo id', () => {
    expect(parseArgs(['fractal']).options.demo).toBe('fractal');
  });

  test('reads subcommands', () => {
    expect(parseArgs(['demos']).options.command).toBe('demos');
    expect(parseArgs(['patterns']).options.command).toBe('patterns');
    expect(parseArgs(['saved']).options.command).toBe('saved');
  });

  test('forget needs a name', () => {
    expect(parseArgs(['forget', 'my', 'universe']).options.target).toBe('my universe');
    expect(parseArgs(['forget']).errors[0]).toMatch(/needs the name/);
  });

  test('reads long and short flags alike', () => {
    const { options } = parseArgs(['-r', 'B36/S23', '-f', '30', '-p', 'Glider Gun', '--no-wrap']);
    expect(options.rule).toBe('B36/S23');
    expect(options.fps).toBe(30);
    expect(options.pattern).toBe('Glider Gun');
    expect(options.wrap).toBe(false);
  });

  test('validates numbers', () => {
    expect(parseArgs(['--fps', 'fast']).errors[0]).toMatch(/needs a number/);
    expect(parseArgs(['--density', '3']).errors[0]).toMatch(/between 0 and 1/);
    expect(parseArgs(['--width', '1']).errors[0]).toMatch(/between 4 and 4096/);
  });

  test('reports unknown flags without throwing', () => {
    expect(parseArgs(['--nope']).errors).toEqual(['unknown option: --nope']);
  });

  test('colour modes', () => {
    expect(parseArgs(['--mono']).options.color).toBe('mono');
    expect(parseArgs(['--no-color']).options.color).toBe('mono');
    expect(parseArgs(['--color', '256']).options.color).toBe('256');
    expect(parseArgs(['--color', 'neon']).errors[0]).toMatch(/--color takes/);
  });

  test('help and version win over everything else', () => {
    expect(parseArgs(['fractal', '--help']).options.command).toBe('help');
    expect(parseArgs(['-v']).options.command).toBe('version');
  });
});
