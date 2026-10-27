<!--
  Saved universes.

  A universe is saved as its rule plus its live cells in Life RLE, so what comes
  back is exactly what was on screen — and the same file opens in the CLI, or as
  a link anyone can follow.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { toShareString } from 'complexity-automata';

  /** @type {import('complexity-automata').UniverseLibrary} */
  export let library;
  /** @type {import('complexity-automata').Automata} */
  export let automata;
  /** Suggested name for the next save. */
  export let suggestedName = '';

  const dispatch = createEventDispatcher();

  let universes = library.list();
  let name = '';
  let copied = '';

  function refresh() {
    universes = library.list();
  }

  function save() {
    const chosen = name.trim() || suggestedName || `${automata.ruleString} gen ${automata.generation}`;
    library.save(automata, { name: chosen });
    name = '';
    refresh();
    dispatch('saved', { name: chosen });
  }

  function load(universe) {
    dispatch('load', { universe });
  }

  function remove(universe) {
    library.remove(universe.name);
    refresh();
  }

  async function share(universe) {
    const url = `${location.origin}${location.pathname}?u=${toShareString(universe)}`;
    try {
      if (navigator.share) await navigator.share({ title: universe.name, url });
      else await navigator.clipboard.writeText(url);
      copied = universe.name;
      setTimeout(() => (copied = ''), 2000);
    } catch {
      // The user dismissed the share sheet, or the clipboard is unavailable.
    }
  }

  function download(universe) {
    const blob = new Blob([JSON.stringify(universe, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${universe.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
</script>

<div class="shelf">
  <form class="save" on:submit|preventDefault={save}>
    <input
      bind:value={name}
      placeholder={suggestedName || 'name this universe'}
      aria-label="Name this universe"
      maxlength="60"
    />
    <button type="submit" class="primary">Save</button>
  </form>

  {#if universes.length === 0}
    <p class="empty">
      Nothing saved yet. Saving keeps the rule and every live cell — reopen it here, or open the same file with
      <code>automata --load</code>.
    </p>
  {:else}
    <ul>
      {#each universes as universe (universe.name)}
        <li>
          <button class="open" on:click={() => load(universe)}>
            <span class="name">{universe.name}</span>
            <span class="meta">{universe.rule} · {universe.width}×{universe.height} · gen {universe.generation}</span>
          </button>
          <div class="actions">
            <button on:click={() => share(universe)} aria-label={`Share ${universe.name}`}>
              {copied === universe.name ? '✓' : '↗'}
            </button>
            <button on:click={() => download(universe)} aria-label={`Download ${universe.name}`}>↓</button>
            <button on:click={() => remove(universe)} aria-label={`Delete ${universe.name}`}>×</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .shelf {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    color: #d5dcea;
  }

  .save {
    display: flex;
    gap: 0.4rem;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #e8ecf5;
    font-size: 0.85rem;
  }

  .primary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #5b8cff, #8d5bff);
    color: white;
    font-weight: 600;
    cursor: pointer;
  }

  .empty {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.5;
    color: #8c9ab4;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 13rem;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .open {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    padding: 0.45rem 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .open:hover {
    background: rgba(90, 140, 255, 0.14);
  }

  .name {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .meta {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.68rem;
    color: #8fa6cc;
  }

  .actions {
    display: flex;
    gap: 0.2rem;
  }

  .actions button {
    width: 2rem;
    height: 2rem;
    border-radius: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: #c9d4e8;
    cursor: pointer;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #9fb0d0;
  }
</style>
