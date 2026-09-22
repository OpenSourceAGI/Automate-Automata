# complexity-automata

The cellular automata engine behind [Complexity Automata](https://github.com/OpenSourceAGI/Automate-Automata):
Conway's Game of Life and the 262,143 other rules that share its shape, with
colour inheritance, saveable universes, a pattern catalogue and ready-made demos.

No DOM, no timers, no dependencies — the web app, the Android app and the
terminal animation all drive this same object.

```bash
npm i complexity-automata
```

## Quick start

```js
import { Automata } from 'complexity-automata';

const life = new Automata({ width: 80, height: 40, rule: 'B3/S23' });
life.stampCentered('Glider Gun');
life.run(120);

console.log(life.toString());   // '#' for alive, '.' for dead
console.log(life.population);   // live cells
```

## Rules

A rule is the neighbour counts that create and preserve life. `B3/S23` is
Conway's: born with exactly three neighbours, survives with two or three.

```js
import { parseRule, formatRule, ruleNumberToRuleSet } from 'complexity-automata';

parseRule('B3/S23');        // { birth: [3], survive: [2, 3] }
parseRule('highlife');      // { birth: [3, 6], survive: [2, 3] }
parseRule(6152);            // the same rule, as a rule number
formatRule({ birth: [2], survive: [] });  // 'B2/S'
```

Every rule is also an **18 bit number** — nine birth counts, nine survival
counts — so the whole space of universes is addressable by an integer:

```js
const life = new Automata({ width: 60, height: 60, rule: 6152 });
life.ruleNumber;   // 6152
life.ruleString;   // 'B3/S23'
life.randomRule(); // somewhere else in the 262,144
```

`NAMED_RULES` has the ones worth knowing: `highlife`, `seeds`, `replicator`,
`fredkin`, `maze`, `coral`, `daynight`, `gnarl`, `diamoeba` and more.

## The grid

```js
const life = new Automata({
  width: 200,
  height: 100,
  rule: 'B3/S23',
  wrap: true,     // edges join into a torus, so gliders come back around
  colors: true,   // track a colour per cell
  seed: 42,       // deterministic RNG: same seed, same universe
});

life.set(10, 10, true);       // bring a cell to life
life.toggle(10, 10);          // flip it
life.get(10, 10);             // 0 or 1
life.stamp('Glider', 4, 4);   // stamp a pattern by name
life.stampCentered('Pulsar');
life.randomize(0.25);         // a soup with a quarter of the cells alive
life.step();                  // one generation
life.run(100);                // a hundred more
life.isStagnant();            // dead, frozen, or a short oscillation?
life.resized(300, 150);       // a new grid holding what still fits
```

Cells live in a `Uint8Array` (`life.cells`, row-major) and colours in a parallel
`Uint8Array` of RGB triples (`life.colors`), which is what makes a renderer a
single pass over memory rather than a call per cell.

## Colour

Colour is inheritance, not physics. A cell born beside living cells takes the
average of their colours, so colonies drift into their own hues and a collision
between two of them fades into a blend. A cell born alone gets a fresh colour
from the rule, the generation and its position.

```js
life.colorAt(10, 10);  // [r, g, b], black when the cell is dead
```

## Patterns

```js
import { patterns, getPattern, patternsByCategory, rotatePattern } from 'complexity-automata';

getPattern('Glider Gun');            // Gosper's gun
patternsByCategory('fractal');       // seeds for replicator rules
rotatePattern(getPattern('Glider'), 1);  // a quarter turn
```

Categories: `spaceship`, `gun`, `oscillator`, `still`, `methuselah`, `fractal`.

## Demos

Each demo is a rule plus a seeding function, so it builds at any grid size —
a phone screen, a canvas, or an 80×24 terminal.

```js
import { demos, buildDemo } from 'complexity-automata';

const life = buildDemo('fractal', { width: 120, height: 120, seed: 1 });
demos.map((d) => d.id);
// conway, gliders, gun, fractal, fredkin, gnarl, coral, maze, seeds,
// highlife, daynight, soup
```

## Saving universes

A universe is its rule plus its live cells. Cells are stored as Life RLE — the
same encoding [conwaylife.com](https://conwaylife.com/book/#rle_files) uses — so
a saved universe opens in other Life software, and patterns from elsewhere load
here.

```js
import { saveUniverse, loadUniverse, toShareString, UniverseLibrary } from 'complexity-automata';

const file = saveUniverse(life, { name: 'my gun' });   // a plain JSON object
const back = loadUniverse(file);                        // exactly as it was
const back2 = loadUniverse(file, { width: 400, height: 200 }); // recentred to fit

const share = toShareString(life);   // one URL-safe string for a ?u= link

// A shelf on top of localStorage, or any get/set/remove store.
const library = new UniverseLibrary(localStorage);
library.save(life, { name: 'my gun' });
library.list();
library.remove('my gun');
```

`parseUniverse` accepts all three: the JSON, a share string, or bare RLE.

## Automatic mode

Most of the 262,144 rules die out in ten generations or fill the screen with
static. `Autopilot` watches for both and moves on, so what you see is a tour of
the rules that do something.

```js
import { Autopilot } from 'complexity-automata';

const pilot = new Autopilot(life, {
  minGenerations: 40,
  maxGenerations: 400,
  onUniverse: ({ rule, survived }) => console.log(`${rule} after ${survived} generations`),
});

for (;;) {
  life.step();
  pilot.tick();
}
```

## See also

- [`complexity-automata-cli`](https://www.npmjs.com/package/complexity-automata-cli) — the terminal animation
- [`complexity-automata-svelte`](https://www.npmjs.com/package/complexity-automata-svelte) — canvas view and controls

MIT
