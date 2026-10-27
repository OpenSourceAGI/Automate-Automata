/**
 * Command line parsing, kept separate from the animation loop so it can be
 * tested without a terminal.
 */

export type Command = 'run' | 'help' | 'version' | 'demos' | 'patterns' | 'rules' | 'saved' | 'forget';

export type ColorChoice = 'auto' | 'truecolor' | '256' | 'mono';

export interface CliOptions {
  command: Command;
  /** Demo id to start from. */
  demo?: string;
  /** Rule override, in any notation the engine accepts. */
  rule?: string;
  /** Pattern to stamp in the centre. */
  pattern?: string;
  /** A saved universe: a file path, a name in the library, or `-` for stdin. */
  load?: string;
  /** Write the universe to this file when the run ends. */
  save?: string;
  /** Save to the library under this name when the run ends. */
  name?: string;
  /** Name to forget, for the `forget` command. */
  target?: string;
  fps: number;
  /** Stop after this many generations instead of running until quit. */
  generations?: number;
  width?: number;
  height?: number;
  density?: number;
  seed?: number;
  wrap: boolean;
  color: ColorChoice;
  ascii: boolean;
  /** Automatic mode: keep jumping to new rules when a universe stops evolving. */
  auto: boolean;
  /** Hide the status bar. */
  quiet: boolean;
  /** Render one frame to stdout and exit — for pipes, screenshots and CI. */
  print: boolean;
  /** Show the intro screen before the animation starts. */
  intro: boolean;
}

export interface ParseResult {
  options: CliOptions;
  errors: string[];
}

const DEFAULTS: CliOptions = {
  command: 'run',
  fps: 20,
  wrap: true,
  color: 'auto',
  ascii: false,
  auto: false,
  quiet: false,
  print: false,
  intro: false,
};

const COMMANDS = new Set<Command>(['run', 'help', 'version', 'demos', 'patterns', 'rules', 'saved', 'forget']);

/** Parse `process.argv.slice(2)`. Unknown flags are reported, not thrown. */
export function parseArgs(argv: string[]): ParseResult {
  const options: CliOptions = { ...DEFAULTS };
  const errors: string[] = [];
  const positional: string[] = [];

  const number = (flag: string, raw: string | undefined, { min = -Infinity, max = Infinity } = {}): number | undefined => {
    const value = Number(raw);
    if (raw === undefined || Number.isNaN(value)) {
      errors.push(`${flag} needs a number`);
      return undefined;
    }
    if (value < min || value > max) {
      errors.push(`${flag} must be between ${min} and ${max}`);
      return undefined;
    }
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const next = (): string | undefined => argv[++i];

    switch (arg) {
      case '-h':
      case '--help':
        options.command = 'help';
        break;
      case '-v':
      case '--version':
        options.command = 'version';
        break;
      case '-d':
      case '--demo':
        options.demo = next();
        if (!options.demo) errors.push('--demo needs a demo id (try `automata demos`)');
        break;
      case '-r':
      case '--rule':
        options.rule = next();
        if (!options.rule) errors.push('--rule needs a rule like B3/S23');
        break;
      case '-p':
      case '--pattern':
        options.pattern = next();
        if (!options.pattern) errors.push('--pattern needs a pattern name (try `automata patterns`)');
        break;
      case '-l':
      case '--load':
        options.load = next();
        if (!options.load) errors.push('--load needs a file, a saved name, or - for stdin');
        break;
      case '-s':
      case '--save':
        options.save = next();
        if (!options.save) errors.push('--save needs a file path');
        break;
      case '--name':
        options.name = next();
        if (!options.name) errors.push('--name needs a name to save under');
        break;
      case '-f':
      case '--fps':
        options.fps = number(arg, next(), { min: 0.1, max: 240 }) ?? options.fps;
        break;
      case '-g':
      case '--generations':
        options.generations = number(arg, next(), { min: 1 });
        break;
      case '-W':
      case '--width':
        options.width = number(arg, next(), { min: 4, max: 4096 });
        break;
      case '-H':
      case '--height':
        options.height = number(arg, next(), { min: 4, max: 4096 });
        break;
      case '--density':
        options.density = number(arg, next(), { min: 0, max: 1 });
        break;
      case '--seed':
        options.seed = number(arg, next());
        break;
      case '--wrap':
        options.wrap = true;
        break;
      case '--no-wrap':
        options.wrap = false;
        break;
      case '-a':
      case '--auto':
        options.auto = true;
        break;
      case '--ascii':
        options.ascii = true;
        break;
      case '--mono':
        options.color = 'mono';
        break;
      case '--no-color':
      case '--no-colour':
        options.color = 'mono';
        break;
      case '--color':
      case '--colour': {
        const value = next();
        if (value === 'auto' || value === 'truecolor' || value === '256' || value === 'mono') {
          options.color = value;
        } else if (value === 'none' || value === 'never') {
          options.color = 'mono';
        } else {
          errors.push('--color takes auto, truecolor, 256 or mono');
        }
        break;
      }
      case '-q':
      case '--quiet':
        options.quiet = true;
        break;
      case '--print':
        options.print = true;
        break;
      case '--intro':
        options.intro = true;
        break;
      default:
        if (arg.startsWith('-') && arg !== '-') errors.push(`unknown option: ${arg}`);
        else positional.push(arg);
    }
  }

  if (positional.length > 0) {
    const [first, ...rest] = positional;
    if (COMMANDS.has(first as Command)) {
      options.command = first as Command;
      if (options.command === 'forget') {
        options.target = rest.join(' ');
        if (!options.target) errors.push('forget needs the name of a saved universe');
      }
    } else if (!options.demo) {
      // `automata fractal` is shorthand for `automata --demo fractal`.
      options.demo = first;
    }
  }

  if (options.print) options.generations ??= 0;

  return { options, errors };
}

export const HELP = `complexity-automata — cellular automata in your terminal

Usage
  automata [demo] [options]
  automata demos | patterns | rules | saved
  automata forget <name>

Options
  -d, --demo <id>         start from a demo (default: conway)
  -r, --rule <rule>       rule to run, e.g. B3/S23, 6152, highlife
  -p, --pattern <name>    stamp a pattern in the centre, e.g. "Glider Gun"
  -l, --load <src>        load a saved universe: file path, saved name, or -
  -s, --save <file>       write the universe to a file when the run ends
      --name <name>       save to the library under this name when the run ends
  -f, --fps <n>           generations per second (default 20)
  -g, --generations <n>   stop after n generations
  -W, --width <n>         grid width in cells (default: terminal width)
  -H, --height <n>        grid height in cells (default: terminal height × 2)
      --density <0..1>    fraction of cells alive when seeding randomly
      --seed <n>          RNG seed, so a run can be reproduced exactly
      --no-wrap           bound the edges instead of wrapping into a torus
  -a, --auto              automatic mode: tour random rules that stay alive
      --color <mode>      auto, truecolor, 256 or mono
      --mono, --ascii     no colour / plain ASCII output
  -q, --quiet             hide the status bar
      --print             render one frame to stdout and exit
      --intro             show the intro screen first
  -h, --help              this help
  -v, --version           print the version

Keys while running
  space   play / pause          n   next random rule
  a       automatic mode        r   random soup
  c       clear the grid        p   stamp a random pattern
  d       next demo             s   save this universe
  + / -   faster / slower       q   quit

Examples
  automata                            Conway's Game of Life, gliders and a gun
  automata fractal                    a Sierpinski triangle from one cell
  automata --rule highlife --auto     tour random universes at HighLife speed
  automata -p "Glider Gun" -f 30      the gun, fast
  automata --print -g 200 > life.txt  200 generations, one frame, piped
`;
