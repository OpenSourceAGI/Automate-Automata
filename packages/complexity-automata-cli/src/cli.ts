#!/usr/bin/env node
/**
 * `automata` — the terminal animation.
 *
 * Reads stdin (for `--load -`), takes over the alternate screen buffer, and
 * redraws one frame per generation. Everything it knows about cellular automata
 * comes from the `complexity-automata` engine; this file is the terminal.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { Autopilot, demos, getDemo, patterns } from 'complexity-automata';
import { HELP, parseArgs, type CliOptions } from './args.js';
import { openLibrary } from './library.js';
import { renderIntro } from './intro.js';
import {
  ALT_SCREEN_OFF,
  ALT_SCREEN_ON,
  CLEAR_SCREEN,
  frameTo,
  gridHeightForRows,
  HIDE_CURSOR,
  renderFrame,
  RESET,
  SHOW_CURSOR,
  type ColorMode,
  type RenderOptions,
} from './render.js';
import { autoName, buildUniverse, demoList, patternList, savedList, snapshot, statusLine } from './session.js';

const VERSION = '1.0.0';

/** What the terminal can actually display, unless the user overrode it. */
function detectColor(choice: CliOptions['color'], isTTY: boolean): ColorMode {
  if (choice === 'mono') return 'mono';
  if (choice === 'truecolor') return 'truecolor';
  if (choice === '256') return 'ansi256';
  if (process.env.NO_COLOR !== undefined || !isTTY) return 'mono';
  const term = `${process.env.COLORTERM ?? ''} ${process.env.TERM ?? ''}`.toLowerCase();
  if (term.includes('truecolor') || term.includes('24bit')) return 'truecolor';
  if (term.includes('256')) return 'ansi256';
  // Most terminals in use handle 24 bit colour even without advertising it.
  return term.includes('dumb') ? 'mono' : 'truecolor';
}

function readSource(load: string): string {
  if (load === '-') return readFileSync(0, 'utf8');
  try {
    return readFileSync(load, 'utf8');
  } catch {
    const saved = openLibrary().get(load);
    if (!saved) throw new Error(`cannot read universe: ${load}`);
    return JSON.stringify(saved);
  }
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const { options, errors } = parseArgs(argv);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`automata: ${error}\n`);
    process.stderr.write('\nTry `automata --help`.\n');
    return 1;
  }

  switch (options.command) {
    case 'help':
      process.stdout.write(HELP);
      return 0;
    case 'version':
      process.stdout.write(`${VERSION}\n`);
      return 0;
    case 'demos':
      process.stdout.write(`${demoList()}\n`);
      return 0;
    case 'patterns':
      process.stdout.write(`${patternList()}\n`);
      return 0;
    case 'rules':
      process.stdout.write(
        `${demos.map((d) => `  ${d.rule.padEnd(16)} ${d.name}`).join('\n')}\n` +
          `\n  Any of the 262,144 rule numbers also works: automata --rule 6152\n`,
      );
      return 0;
    case 'saved':
      process.stdout.write(`${savedList(openLibrary().list())}\n`);
      return 0;
    case 'forget': {
      const removed = openLibrary().remove(options.target ?? '');
      process.stdout.write(removed ? `forgot ${options.target}\n` : `no saved universe called ${options.target}\n`);
      return removed ? 0 : 1;
    }
  }

  const isTTY = Boolean(process.stdout.isTTY);
  const color = detectColor(options.color, isTTY);
  const render: RenderOptions = { color, ascii: options.ascii };

  const columns = options.width ?? (process.stdout.columns || 80);
  const rows = process.stdout.rows || 24;
  const height = options.height ?? gridHeightForRows(rows, options.quiet ? 0 : 1, options.ascii);

  let source: string | undefined;
  if (options.load) {
    try {
      source = readSource(options.load);
    } catch (error) {
      process.stderr.write(`automata: ${(error as Error).message}\n`);
      return 1;
    }
  }

  let built;
  try {
    built = buildUniverse(options, { width: columns, height }, source);
  } catch (error) {
    process.stderr.write(`automata: ${(error as Error).message}\n`);
    return 1;
  }

  let { automata } = built;
  const { title } = built;

  // Non-interactive: run the requested generations and print one frame. This is
  // what makes the CLI useful in a pipe, a README, or a CI check.
  if (options.print || !isTTY) {
    automata.run(options.generations ?? 0);
    process.stdout.write(`${renderFrame(automata, render)}\n`);
    if (options.save) writeFileSync(options.save, JSON.stringify(snapshot(automata, options.name ?? title), null, 2));
    if (options.name && !options.save) openLibrary().save(automata, { name: options.name });
    return 0;
  }

  return runInteractive(automata, title, options, render, rows);
}

function runInteractive(
  automata: import('complexity-automata').Automata,
  title: string,
  options: CliOptions,
  render: RenderOptions,
  initialRows: number,
): Promise<number> {
  return new Promise((resolve) => {
    let playing = true;
    let fps = options.fps;
    let auto = options.auto;
    let demoIndex = Math.max(0, demos.findIndex((d) => d.id === (getDemo(options.demo ?? 'conway')?.id ?? 'conway')));
    let status: string | undefined;
    let statusUntil = 0;
    let rows = initialRows;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let showingIntro = options.intro;

    const pilot = new Autopilot(automata, {
      onUniverse: (change) => flash(`new universe: ${change.rule} (#${change.ruleNumber})`),
    });

    const out = (text: string): void => void process.stdout.write(text);

    const flash = (message: string): void => {
      status = message;
      statusUntil = Date.now() + 2500;
    };

    const draw = (): void => {
      const frame = showingIntro
        ? renderIntro(automata.clone(), render)
        : frameTo(
            automata.width,
            automata.height,
            renderFrame(automata, render),
            options.quiet
              ? ''
              : statusLine(
                  automata,
                  {
                    title,
                    playing,
                    auto,
                    fps: Math.round(fps),
                    saved: status && Date.now() < statusUntil ? status : undefined,
                  },
                  automata.width,
                ),
          );
      out(showingIntro ? `\u001B[H${frame}` : frame);
    };

    const tick = (): void => {
      if (playing && !showingIntro) {
        automata.step();
        if (auto) pilot.tick();
      }
      draw();
      if (options.generations && automata.generation >= options.generations) return finish(0);
      timer = setTimeout(tick, Math.max(4, 1000 / fps));
    };

    const resize = (): void => {
      const width = options.width ?? (process.stdout.columns || automata.width);
      rows = process.stdout.rows || rows;
      const height = options.height ?? gridHeightForRows(rows, options.quiet ? 0 : 1, options.ascii);
      if (width === automata.width && height === automata.height) return;
      automata = automata.resized(width, height);
      out(CLEAR_SCREEN);
    };

    const finish = (code: number): void => {
      if (timer) clearTimeout(timer);
      process.stdout.off('resize', resize);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      out(`${SHOW_CURSOR}${ALT_SCREEN_OFF}${RESET}`);

      if (options.save) {
        writeFileSync(options.save, JSON.stringify(snapshot(automata, options.name ?? title), null, 2));
        process.stdout.write(`saved ${options.save}\n`);
      } else if (options.name) {
        openLibrary().save(automata, { name: options.name });
        process.stdout.write(`saved "${options.name}" to your library\n`);
      }
      resolve(code);
    };

    const onKey = (data: Buffer): void => {
      const key = data.toString('utf8');

      if (showingIntro) {
        showingIntro = false;
        out(CLEAR_SCREEN);
        if (key === 'q' || key === '\u0003') return finish(0);
        return;
      }

      switch (key) {
        case 'q':
        case '\u0003': // ctrl-c
          return finish(0);
        case ' ':
          playing = !playing;
          flash(playing ? 'playing' : 'paused');
          break;
        case 'n':
          automata.randomRule();
          flash(`rule ${automata.ruleString} (#${automata.ruleNumber})`);
          break;
        case 'a':
          auto = !auto;
          flash(auto ? 'automatic mode on' : 'automatic mode off');
          if (auto) pilot.next();
          break;
        case 'r':
          automata.randomize(options.density ?? 0.28);
          flash('random soup');
          break;
        case 'c':
          automata.clear();
          flash('cleared');
          break;
        case 'p': {
          const stampable = patterns.filter((p) => p.cells.length > 0);
          const pattern = stampable[Math.floor(automata.random() * stampable.length)]!;
          automata.stampRandom(pattern);
          flash(`stamped ${pattern.name}`);
          break;
        }
        case 'd': {
          demoIndex = (demoIndex + 1) % demos.length;
          const demo = demos[demoIndex]!;
          automata = demo.build({ width: automata.width, height: automata.height, wrap: options.wrap });
          flash(`${demo.name} — ${demo.rule}`);
          break;
        }
        case 's': {
          const name = autoName(automata, title);
          openLibrary().save(automata, { name });
          flash(`saved "${name}"`);
          break;
        }
        case '+':
        case '=':
          fps = Math.min(120, fps * 1.5);
          flash(`${Math.round(fps)} fps`);
          break;
        case '-':
        case '_':
          fps = Math.max(1, fps / 1.5);
          flash(`${Math.round(fps)} fps`);
          break;
        case '\u001B': // esc
          flash('press q to quit');
          break;
      }
    };

    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onKey);
    process.stdout.on('resize', resize);
    process.on('SIGINT', () => finish(0));
    process.on('SIGTERM', () => finish(0));

    out(`${ALT_SCREEN_ON}${HIDE_CURSOR}${CLEAR_SCREEN}`);
    tick();
  });
}

// Only run when invoked as a program, so tests can import `main` without
// starting an animation. Matching on the file name rather than the path keeps
// a directory called `complexity-automata-cli` from counting as an invocation.
const invokedAs = process.argv[1] ? basename(process.argv[1]) : '';
if (['cli.js', 'cli.ts', 'automata', 'complexity-automata'].includes(invokedAs)) {
  main().then(
    (code) => process.exit(code),
    (error: Error) => {
      process.stderr.write(`automata: ${error.message}\n`);
      process.exit(1);
    },
  );
}
