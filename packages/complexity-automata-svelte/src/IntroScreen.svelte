<!--
  The intro screen.

  It sits over a live grid rather than replacing it, so the first thing anyone
  sees is Conway's rules actually running, with the explanation on top of it and
  a demo one tap away.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { demos } from 'complexity-automata';

  /** Demo ids offered as big buttons; the rest stay in the demo picker. */
  export let featured = ['conway', 'gliders', 'gun', 'fractal', 'fredkin', 'soup'];

  const dispatch = createEventDispatcher();
  const featuredDemos = () => featured.map((id) => demos.find((d) => d.id === id)).filter(Boolean);
</script>

<div class="intro" role="dialog" aria-modal="true" aria-label="Welcome to Complexity Automata">
  <div class="panel">
    <h1>Complexity Automata</h1>
    <p class="tagline">Conway's Game of Life, and 262,143 other universes.</p>

    <p class="rule">
      A cell is <strong>born</strong> when it has exactly three live neighbours, and
      <strong>survives</strong> with two or three. That is the entire rule. Everything else — gliders that
      walk across the screen, guns that fire them forever, fractals that copy themselves — follows from it.
    </p>

    <div class="demos">
      {#each featuredDemos() as demo (demo.id)}
        <button class="demo" on:click={() => dispatch('select', { id: demo.id })}>
          <span class="demo-name">{demo.name}</span>
          <span class="demo-rule">{demo.rule}</span>
          <span class="demo-about">{demo.about}</span>
        </button>
      {/each}
    </div>

    <div class="actions">
      <button class="primary" on:click={() => dispatch('start')}>Start exploring</button>
      <button class="ghost" on:click={() => dispatch('dismiss')}>Skip intro</button>
    </div>

    <p class="hint">Tap the grid to draw · save any universe you like · the terminal version is <code>npx complexity-automata-cli</code></p>
  </div>
</div>

<style>
  .intro {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: radial-gradient(circle at 50% 30%, rgba(8, 10, 16, 0.72), rgba(8, 10, 16, 0.94));
    backdrop-filter: blur(2px);
    z-index: 20;
    overflow-y: auto;
  }

  .panel {
    width: min(46rem, 100%);
    max-height: 100%;
    padding: clamp(1rem, 4vw, 2rem);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 1rem;
    background: rgba(10, 12, 20, 0.88);
    color: #e8ecf5;
    box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.55);
  }

  h1 {
    margin: 0;
    font-size: clamp(1.6rem, 6vw, 2.4rem);
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .tagline {
    margin: 0.25rem 0 1rem;
    color: #9fb0d0;
    font-size: 0.95rem;
  }

  .rule {
    margin: 0 0 1.25rem;
    line-height: 1.55;
    font-size: 0.95rem;
    color: #cdd6e8;
  }

  .rule strong {
    color: #ffffff;
  }

  .demos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .demo {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.7rem 0.8rem;
    text-align: left;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .demo:hover,
  .demo:focus-visible {
    background: rgba(90, 140, 255, 0.16);
    border-color: rgba(120, 160, 255, 0.5);
    outline: none;
  }

  .demo-name {
    font-weight: 600;
  }

  .demo-rule {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.72rem;
    color: #8fa6cc;
  }

  .demo-about {
    font-size: 0.75rem;
    line-height: 1.35;
    color: #98a6c0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  button.primary,
  button.ghost {
    padding: 0.7rem 1.2rem;
    border-radius: 999px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 2.75rem;
  }

  button.primary {
    border: none;
    background: linear-gradient(135deg, #5b8cff, #8d5bff);
    color: white;
  }

  button.ghost {
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    color: #c4cee2;
  }

  .hint {
    margin: 1rem 0 0;
    font-size: 0.72rem;
    color: #7e8ca8;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #9fb0d0;
  }

  @media (max-width: 30rem) {
    .intro {
      padding: 0.5rem;
      align-items: flex-start;
    }

    .panel {
      padding: 1rem 0.9rem;
    }

    .demos {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }

    .demo-about {
      -webkit-line-clamp: 1;
    }

    .rule {
      font-size: 0.88rem;
    }
  }
</style>
