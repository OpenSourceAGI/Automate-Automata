<!--
  The universe itself: a canvas bound to an `Automata`, a frame loop that steps
  it, and pointer handling for drawing patterns into it.

  It owns no rules and no UI — the parent passes in the automaton and decides
  what the controls do, so the same canvas serves the intro screen, the app and
  anything embedding the component.
-->
<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { Autopilot } from 'complexity-automata';
  import { CanvasPainter, cellAtPointer } from './canvas.js';

  /** @type {import('complexity-automata').Automata} */
  export let automata;
  /** Generations per second. */
  export let fps = 20;
  /** Whether the simulation is advancing. */
  export let playing = true;
  /** Automatic mode: tour random rules, moving on when one stops evolving. */
  export let auto = false;
  /** Pattern stamped on tap; `Point On/Off` draws single cells. */
  export let pattern = 'Glider';
  /** Let the user draw on the grid. */
  export let interactive = true;

  const dispatch = createEventDispatcher();

  let canvas;
  let painter;
  let frame;
  let lastStep = 0;
  let pilot;
  let drawing = false;
  let lastCell = { x: -1, y: -1 };

  // A new grid (a resize, a new demo, a loaded universe) needs a new painter.
  $: if (canvas && automata && (!painter || painter.width !== automata.width || painter.height !== automata.height)) {
    painter = new CanvasPainter(canvas, automata);
    sizeCanvas();
    painter.paint(automata);
  }

  $: if (automata) {
    pilot = new Autopilot(automata, {
      onUniverse: (change) => dispatch('universe', change),
    });
  }

  onMount(() => {
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  });

  onDestroy(() => {
    if (frame) cancelAnimationFrame(frame);
  });

  function loop(now) {
    frame = requestAnimationFrame(loop);
    if (!automata || !painter) return;

    const interval = 1000 / Math.max(0.2, fps);
    if (playing && now - lastStep >= interval) {
      lastStep = now;
      automata.step();
      if (auto) pilot?.tick();
      dispatch('generation', { generation: automata.generation, population: automata.population });
      painter.paint(automata);
    }
  }

  /** Repaint immediately — used after edits while paused. */
  export function repaint() {
    painter?.paint(automata);
  }

  /** Jump the autopilot to a new universe. */
  export function nextUniverse() {
    pilot?.next();
    repaint();
  }

  function sizeCanvas() {
    if (!canvas || !automata) return;
    // One backing pixel per cell, scaled to the element by CSS: the grid is
    // already the resolution, so a device-pixel-ratio canvas would only cost
    // memory.
    const scale = Math.max(1, Math.floor(Math.min(canvas.clientWidth / automata.width, 4)) || 1);
    canvas.width = automata.width * scale;
    canvas.height = automata.height * scale;
    if (painter) painter.canvas = canvas;
  }

  function paintAt(event, clientX, clientY) {
    if (!interactive || !automata) return;
    const { x, y } = cellAtPointer(canvas, automata, clientX, clientY);
    if (x === lastCell.x && y === lastCell.y) return;
    lastCell = { x, y };

    if (pattern === 'Point On/Off') automata.toggle(x, y);
    else automata.stamp(pattern, x, y);

    repaint();
    dispatch('edit', { x, y, pattern });
    event.preventDefault();
  }

  function onPointerDown(event) {
    drawing = true;
    canvas.setPointerCapture?.(event.pointerId);
    lastCell = { x: -1, y: -1 };
    paintAt(event, event.clientX, event.clientY);
  }

  function onPointerMove(event) {
    if (drawing) paintAt(event, event.clientX, event.clientY);
  }

  function onPointerUp(event) {
    drawing = false;
    canvas.releasePointerCapture?.(event.pointerId);
  }
</script>

<svelte:window on:resize={sizeCanvas} />

<canvas
  bind:this={canvas}
  class="automata-canvas"
  class:interactive
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
  aria-label="Cellular automata grid. Tap to place a pattern."
></canvas>

<style>
  .automata-canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    background: #080a10;
    touch-action: none;
  }

  .interactive {
    cursor: crosshair;
  }
</style>
