<!--
  The whole app: the grid, the controls, the demo picker, the saved-universe
  shelf and the intro screen, wired together.

  The web app and the Android app both render this and nothing else — anything
  platform-specific (the page shell, the status bar colour) stays outside.
-->
<script>
  import { onMount } from 'svelte';
  import {
    Automata,
    buildDemo,
    demos,
    getDemo,
    loadUniverse,
    memoryStorage,
    parseRule,
    parseUniverse,
    patterns,
    UniverseLibrary,
  } from 'complexity-automata';
  import AutomataCanvas from './AutomataCanvas.svelte';
  import IntroScreen from './IntroScreen.svelte';
  import RuleControls from './RuleControls.svelte';
  import UniverseShelf from './UniverseShelf.svelte';
  import { gridSizeFor } from './canvas.js';

  /** Demo to open with. */
  export let demo = 'conway';
  /** Show the intro screen on first paint. */
  export let intro = true;
  /** CSS pixels per cell. Bigger cells mean a smaller, faster universe. */
  export let cellSize = 4;
  /** Start playing immediately. */
  export let playing = true;
  /** Where saved universes live. Defaults to `localStorage`. */
  export let storage = null;

  let stage;
  let canvasComponent;
  let automata = null;
  let library = new UniverseLibrary(memoryStorage());
  let showIntro = intro;
  let panel = null; // 'demos' | 'rules' | 'saved'
  let fps = 20;
  let auto = false;
  let pattern = 'Glider';
  let title = "Conway's Game of Life";
  let generation = 0;
  let population = 0;
  let toast = '';
  let toastTimer;

  const stampable = patterns.filter((p) => p.cells.length > 0 || p.name === 'Point On/Off');

  onMount(() => {
    library = new UniverseLibrary(storage ?? (typeof localStorage === 'undefined' ? memoryStorage() : localStorage));

    const size = viewportGrid();
    const shared = sharedUniverse();
    if (shared) {
      automata = loadUniverse(shared, { ...size });
      title = shared.name;
      showIntro = false;
    } else {
      startDemo(demo, size);
    }

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  });

  /** A universe passed in the URL as `?u=…`, if there is one. */
  function sharedUniverse() {
    if (typeof location === 'undefined') return null;
    const share = new URLSearchParams(location.search).get('u');
    if (!share) return null;
    try {
      return parseUniverse(share);
    } catch {
      return null;
    }
  }

  function viewportGrid() {
    const width = stage?.clientWidth || (typeof window === 'undefined' ? 800 : window.innerWidth);
    const height = stage?.clientHeight || (typeof window === 'undefined' ? 600 : window.innerHeight);
    return gridSizeFor(width, height, cellSize);
  }

  function startDemo(id, size = viewportGrid()) {
    const found = getDemo(id);
    automata = buildDemo(found?.id ?? 'conway', { ...size });
    title = found?.name ?? "Conway's Game of Life";
    fps = found?.fps ?? 20;
    generation = 0;
    population = automata.population;
    panel = null;
    flash(`${title} — ${automata.ruleString}`);
  }

  function resize() {
    if (!automata) return;
    const { width, height } = viewportGrid();
    if (width === automata.width && height === automata.height) return;
    automata = automata.resized(width, height);
  }

  function onRuleChange(event) {
    automata.setRule(event.detail.rule);
    automata = automata;
    flash(automata.ruleString);
  }

  function onGeneration(event) {
    generation = event.detail.generation;
    population = event.detail.population;
  }

  function onUniverse(event) {
    title = 'Automatic';
    flash(`new universe ${event.detail.rule}`);
  }

  function togglePlay() {
    playing = !playing;
  }

  function randomRule() {
    automata.randomRule();
    automata = automata;
    flash(`rule ${automata.ruleString} · #${automata.ruleNumber}`);
  }

  function randomSoup() {
    automata.randomize(0.28);
    canvasComponent?.repaint();
    flash('random soup');
  }

  function clearGrid() {
    automata.clear();
    canvasComponent?.repaint();
    generation = 0;
    population = 0;
    flash('cleared');
  }

  function loadSaved(event) {
    const size = viewportGrid();
    automata = loadUniverse(event.detail.universe, { ...size });
    title = event.detail.universe.name;
    panel = null;
    flash(`loaded ${title}`);
  }

  function flash(message) {
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 2200);
  }

  function togglePanel(which) {
    panel = panel === which ? null : which;
  }

  function onKeydown(event) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    switch (event.key) {
      case ' ':
        togglePlay();
        event.preventDefault();
        break;
      case 'n':
        randomRule();
        break;
      case 'a':
        auto = !auto;
        flash(auto ? 'automatic mode on' : 'automatic mode off');
        break;
      case 'r':
        randomSoup();
        break;
      case 'c':
        clearGrid();
        break;
      case 's':
        togglePanel('saved');
        break;
      case 'd':
        togglePanel('demos');
        break;
      case '?':
        showIntro = true;
        break;
    }
  }

  $: ruleString = automata?.ruleString ?? 'B3/S23';
  $: parsedRule = parseRule(ruleString);
</script>

<svelte:window on:keydown={onKeydown} />

<div class="app" bind:this={stage}>
  {#if automata}
    <AutomataCanvas
      bind:this={canvasComponent}
      {automata}
      {fps}
      {playing}
      {auto}
      {pattern}
      on:generation={onGeneration}
      on:universe={onUniverse}
    />
  {/if}

  {#if showIntro}
    <IntroScreen
      on:select={(event) => {
        startDemo(event.detail.id);
        showIntro = false;
      }}
      on:start={() => (showIntro = false)}
      on:dismiss={() => (showIntro = false)}
    />
  {/if}

  {#if toast}
    <div class="toast" role="status">{toast}</div>
  {/if}

  <div class="hud">
    <span class="stat"><strong>{ruleString}</strong></span>
    <span class="stat">gen {generation}</span>
    <span class="stat">pop {population}</span>
    {#if auto}<span class="stat badge">auto</span>{/if}
  </div>

  <div class="dock">
    {#if panel === 'demos'}
      <div class="panel">
        <h2>Demos</h2>
        <div class="demo-grid">
          {#each demos as entry (entry.id)}
            <button class="demo" class:active={title === entry.name} on:click={() => startDemo(entry.id)}>
              <span class="demo-name">{entry.name}</span>
              <span class="demo-rule">{entry.rule}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else if panel === 'rules'}
      <div class="panel">
        <h2>Rule</h2>
        <RuleControls rule={ruleString} on:change={onRuleChange} />
        <div class="row">
          <label>
            Pattern
            <select bind:value={pattern}>
              {#each stampable as entry (entry.name)}
                <option value={entry.name}>{entry.name}</option>
              {/each}
            </select>
          </label>
          <label>
            Speed
            <input type="range" min="1" max="60" step="1" bind:value={fps} aria-label="Generations per second" />
          </label>
        </div>
        <p class="note">
          {parsedRule.birth.length} birth {parsedRule.birth.length === 1 ? 'count' : 'counts'},
          {parsedRule.survive.length} survival — tap the grid to place a {pattern.toLowerCase()}.
        </p>
      </div>
    {:else if panel === 'saved'}
      <div class="panel">
        <h2>Universes</h2>
        <UniverseShelf
          {library}
          {automata}
          suggestedName={`${title} · ${ruleString} · gen ${generation}`}
          on:load={loadSaved}
          on:saved={(event) => flash(`saved "${event.detail.name}"`)}
        />
      </div>
    {/if}

    <div class="bar">
      <button class="round primary" on:click={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
        {#if playing}
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
            ><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg
          >
        {:else}
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21" /></svg>
        {/if}
      </button>

      <button class="round" class:on={auto} on:click={() => (auto = !auto)} aria-label="Automatic mode" title="Automatic mode">↻</button>
      <button class="round" on:click={randomRule} aria-label="Random rule" title="Random rule">⚄</button>
      <button class="round" on:click={randomSoup} aria-label="Random soup" title="Random soup">░</button>
      <button class="round" on:click={clearGrid} aria-label="Clear" title="Clear">⌫</button>

      <div class="spacer"></div>

      <button class="tab" class:on={panel === 'demos'} on:click={() => togglePanel('demos')}>Demos</button>
      <button class="tab" class:on={panel === 'rules'} on:click={() => togglePanel('rules')}>Rule</button>
      <button class="tab" class:on={panel === 'saved'} on:click={() => togglePanel('saved')}>Save</button>
      <button class="tab" on:click={() => (showIntro = true)} aria-label="About">?</button>
    </div>
  </div>
</div>

<style>
  .app {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #080a10;
    color: #e8ecf5;
    font-family:
      system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }

  .hud {
    position: absolute;
    top: max(0.5rem, env(safe-area-inset-top));
    left: 0.6rem;
    display: flex;
    gap: 0.35rem;
    pointer-events: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.7rem;
  }

  .stat {
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(8, 10, 16, 0.6);
    color: #b9c6dd;
  }

  .stat.badge {
    background: rgba(91, 140, 255, 0.35);
    color: #fff;
  }

  .toast {
    position: absolute;
    top: max(2.4rem, calc(env(safe-area-inset-top) + 2rem));
    left: 50%;
    transform: translateX(-50%);
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    background: rgba(8, 10, 16, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.78rem;
    white-space: nowrap;
    pointer-events: none;
  }

  .dock {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.5rem 0.5rem max(0.5rem, env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(8, 10, 16, 0.92), rgba(8, 10, 16, 0));
  }

  .panel {
    max-height: 45vh;
    overflow-y: auto;
    padding: 0.7rem 0.8rem;
    border-radius: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(12, 15, 24, 0.94);
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8fa6cc;
  }

  .demo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.35rem;
  }

  .demo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.5rem 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .demo.active {
    border-color: rgba(120, 160, 255, 0.6);
    background: rgba(90, 140, 255, 0.16);
  }

  .demo-name {
    font-size: 0.82rem;
    font-weight: 600;
  }

  .demo-rule {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.68rem;
    color: #8fa6cc;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.6rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: #a9b6cd;
  }

  select {
    padding: 0.3rem 0.4rem;
    border-radius: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #e8ecf5;
    font-size: 0.78rem;
  }

  .note {
    margin: 0.6rem 0 0;
    font-size: 0.72rem;
    color: #8c9ab4;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .bar::-webkit-scrollbar {
    display: none;
  }

  .spacer {
    flex: 1;
    min-width: 0.5rem;
  }

  .round,
  .tab {
    flex: 0 0 auto;
    min-height: 2.6rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(18, 22, 34, 0.9);
    color: #d5dcea;
    cursor: pointer;
  }

  .round {
    width: 2.6rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .round svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .round.primary {
    border: none;
    background: linear-gradient(135deg, #5b8cff, #8d5bff);
    color: white;
  }

  .round.on,
  .tab.on {
    border-color: rgba(120, 160, 255, 0.6);
    background: rgba(90, 140, 255, 0.24);
    color: #fff;
  }

  .tab {
    padding: 0 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  /* On a phone the whole bar will not fit on one line, and a horizontally
     scrolling bar hides the Save tab off the right edge — so wrap instead. */
  @media (max-width: 30rem) {
    .bar {
      flex-wrap: wrap;
      justify-content: center;
      overflow-x: visible;
    }

    .spacer {
      display: none;
    }

    .panel {
      max-height: 40vh;
    }
  }
</style>
