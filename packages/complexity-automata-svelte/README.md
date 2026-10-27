# complexity-automata-svelte

Svelte components for [`complexity-automata`](https://www.npmjs.com/package/complexity-automata):
a canvas view of a running universe, the rule as eighteen switches, a demo
picker, and a shelf of saved universes.

This is the UI that ships as both the web app and the Android app of
[Complexity Automata](https://github.com/OpenSourceAGI/Automate-Automata).

```bash
npm i complexity-automata-svelte
```

## The whole app

```svelte
<script>
  import { AutomataApp } from 'complexity-automata-svelte';
</script>

<AutomataApp demo="conway" intro={true} cellSize={4} />
```

| prop | | |
| --- | --- | --- |
| `demo` | `'conway'` | which demo to open with |
| `intro` | `true` | show the intro screen first |
| `cellSize` | `4` | CSS pixels per cell — bigger cells, smaller universe |
| `playing` | `true` | start running immediately |
| `storage` | `localStorage` | where saved universes live |

It fills its parent, so give that parent a height.

## Just the grid

```svelte
<script>
  import { AutomataCanvas, buildDemo } from 'complexity-automata-svelte';

  let automata = buildDemo('gliders', { width: 200, height: 120 });
  let canvas;
</script>

<AutomataCanvas
  bind:this={canvas}
  {automata}
  fps={24}
  playing
  auto={false}
  pattern="Glider"
  on:generation={(e) => console.log(e.detail.generation, e.detail.population)}
  on:universe={(e) => console.log('new rule', e.detail.rule)}
/>
```

The canvas owns the frame loop and pointer drawing, nothing else. It exposes
`repaint()` and `nextUniverse()` for a parent that edits the grid directly.

## The other pieces

- `IntroScreen` — the explanation and the demo buttons, as an overlay over a
  live grid. Events: `select`, `start`, `dismiss`.
- `RuleControls` — birth and survival counts as switches, plus the rule number.
  Event: `change` with a rule.
- `UniverseShelf` — save, reopen, share, download and delete universes, on top
  of a `UniverseLibrary`.
- `CanvasPainter`, `gridSizeFor`, `cellAtPointer` — the painting helpers, if you
  would rather draw the grid yourself.

Everything from `complexity-automata` is re-exported, so one dependency is
enough.

## Rendering

The grid is painted at one pixel per cell into an offscreen buffer and scaled up
with smoothing off, so a full redraw costs the number of cells rather than the
number of screen pixels — which is what keeps a 300×600 grid comfortable on a
phone.

Components carry their own scoped styles and assume a dark background. No CSS
framework, no global stylesheet.

MIT
