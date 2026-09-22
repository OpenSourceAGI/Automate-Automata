<p align="center">
    <img  src="https://i.imgur.com/XR8Zs9R.png" />
</p>
<p align="center">
    <a href="https://discord.gg/SJdBqBz3tV">
        <img src="https://img.shields.io/discord/1110227955554209923.svg?label=Chat&logo=Discord&colorB=7289da&style=flat"
            alt="Join Discord" />
    </a>
     <a href="https://github.com/vtempest/Automate-Automata/discussions">
     <img alt="GitHub Stars" src="https://img.shields.io/github/stars/vtempest/Automate-Automata" /></a>
    <a href="https://github.com/vtempest/Automate-Automata/discussions">
    <img alt="GitHub Discussions"
        src="https://img.shields.io/github/discussions/vtempest/Automate-Automata" />
    </a>
    <a href="https://www.npmjs.com/package/complexity-automata">
        <img alt="npm" src="https://img.shields.io/npm/v/complexity-automata?label=complexity-automata" />
    </a>
    <a href="https://github.com/vtempest/Automate-Automata/pulse" alt="Activity">
        <img src="https://img.shields.io/github/commit-activity/m/vtempest/Automate-Automata" />
    </a>
</p>
<p align="center">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square"
            alt="PRs Welcome" />
    <a href="https://codespaces.new/vtempest/Automate-Automata">
    <img src="https://github.com/codespaces/badge.svg" width="150" height="20" />
    </a>
</p>

<h3 align="center">
  <a href="https://automata-game-of-life.vtempest.workers.dev">🚀 Web app</a> ·
  <a href="https://play.google.com/store/apps/details?id=com.vtempest.automata">📱 Android app</a> ·
  <code>npx complexity-automata-cli</code>
</h3>

## Complexity Automata

Conway's Game of Life, and the 262,143 other universes that share its shape.

A cell is **born** when it has exactly three live neighbours and **survives**
with two or three. That is the entire rule. The gliders that walk across the
screen, the gun that fires them forever, and the fractals that copy themselves
all follow from it — and changing two numbers gives you a different universe
with its own physics.

- **Draw** patterns into a running grid — gliders, guns, oscillators, fractal seeds
- **Colour inheritance**: cells take the average colour of the cells that made
  them, so colonies drift apart and collisions fade into blends
- **Save universes** and reopen, share or download them; the same file opens in
  the web app, the terminal, and other Life software
- **Automatic mode** tours random rules, moving on whenever one stops evolving
- **Twelve demos**, from Conway's to Fredkin's fractal replicator

Runs the same on the web, on Android, and in a terminal.

## What is in here

| | | |
| --- | --- | --- |
| [`packages/complexity-automata`](packages/complexity-automata) | `complexity-automata` | The engine. Rules, grid, colour, patterns, demos, saving. No DOM, no dependencies. |
| [`packages/complexity-automata-cli`](packages/complexity-automata-cli) | `complexity-automata-cli` | The terminal animation, in truecolor half-blocks. |
| [`packages/complexity-automata-svelte`](packages/complexity-automata-svelte) | `complexity-automata-svelte` | Svelte components: canvas view, rule switches, demo picker, saved universes. |
| [`apps/web`](apps/web) | | The web app — SvelteKit, deployed to Cloudflare. |
| [`apps/android`](apps/android) | | The Android app — the same build, wrapped by Capacitor. |

## Try it

```bash
# In a terminal
npx complexity-automata-cli            # Conway's, with gliders and a gun
npx complexity-automata-cli fractal    # a Sierpinski triangle from one cell
npx complexity-automata-cli --auto     # a tour of random universes

# In your own code
npm i complexity-automata
```

```js
import { Automata } from 'complexity-automata';

const life = new Automata({ width: 80, height: 40, rule: 'B3/S23' });
life.stampCentered('Glider Gun');
life.run(120);
console.log(life.toString());
```

## Developing

Bun workspaces and no build orchestration to learn:

```bash
bun install
bun run build       # engine → CLI → web
bun run dev         # the web app at localhost:5173
bun run cli         # the terminal animation from source
bun run test        # every package's suite
bun run typecheck
bun run android     # build the web app and assemble the APK
bun run deploy      # wrangler deploy from apps/web
```

The engine has no dependencies and is tested on its own (`cd
packages/complexity-automata && bun test`); the CLI and the components are thin
layers over it. If a change is about *what the automata do*, it belongs in the
engine, with a test.

## Further Research

* Johnston, Nathaniel, and Greene, Dave  (2022). "Conway's Game of Life". https://conwaylife.com/book/#rle_files

*  Bradbury, Phillip (2012). "Life in life". https://www.youtube.com/watch?v=xP5-iIeKXE8

*  Wolfram, Stephen (2020). "Stephen Wolfram: Cellular Automata, Computation, and Physics | Lex Fridman Podcast #89" https://www.youtube.com/watch?v=ez773teNFYA

* Wolfram, Stephen (2013). "Talking about the Computational Future at SXSW 2013", https://writings.stephenwolfram.com/2013/03/talking-about-the-computational-future-at-sxsw-2013/

#### Excerpt:

> By the way, it’s bizarre how few people work on this. Because I’m sure that, just like cloning, there’s just going to be a wacky procedure that makes it possible—and once we know it, we’re just going to be able to do it quite routinely, and it’s going to be societally very important. But in the end, we want to solve the problem of keeping all the complexity that is a human running indefinitely. There are some fascinating basic science problems here. Connected to concepts like computational irreducibility, and a bit to the traditional halting problem. But I have no doubt that eventually it’ll be solved, and we’ll achieve effective human immortality. And when that happens I expect it’ll be the single biggest discontinuity in human history.
>
> Cellular automata
>
> You know, as one thinks about such things, one can’t help wondering about the general future of the human condition. And here’s something someone like me definitely thinks about. I’m spending my life trying to automate things. Trying to make it possible to do automatically with computation things that humans used to have to do themselves.
>
> Now, if we look at the arc of human history, the biggest systematic change through time is the arrival of more and more technology, and the automation of more and more kinds of tasks. So here’s a question: what if we succeed in automating everything? What will happen then? What will the humans do? There’s an ultimate—almost philosophical—version of this question. And there’s also a practical next-few-decades version.
>
> Let’s start with the ultimate version. As we go on and build more and more technology, what will the end point be? We might assume that we could somehow go on forever, achieving more and more. But the Principle of Computational Equivalence tells us that we cannot. One we have reached a certain level, everything is already in a sense possible. And even though our current engineering has not yet reached this point, the Principle of Computational Equivalence also tells us that this maximal level of computational sophistication is not particularly rare. Indeed it happens in many places in the physical world, as well as in systems like simple cellular automata.
>
> Cellular automata
>
> And it’s not too hard to see that as we improve our technology, getting down to the smallest scales, and removing everything that seems redundant, that we might wind up with something that looks just like a physical process that already happens in nature. So does this mean that in the ultimate future, with all that great automation and technology, all we’ll achieve is just to produce something that’s indistinguishable from zillions of things that already exist in nature?
>
>  Wolfram, Stephen (2013). "Talking about the Computational Future at SXSW 2013", https://writings.stephenwolfram.com/2013/03/talking-about-the-computational-future-at-sxsw-2013/

MIT · developed in 2014, ten years as an Android app, rewritten in Svelte in 2024, split into engine, apps and CLI in 2025.
