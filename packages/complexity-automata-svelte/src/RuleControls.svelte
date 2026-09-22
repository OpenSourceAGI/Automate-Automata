<!--
  The rule, as eighteen switches.

  Birth counts on the top row, survival counts below; the rule number beside
  them is the same eighteen bits read as an integer, so it doubles as an address
  you can type in to jump straight to a universe.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { parseRule, RULE_SPACE, ruleSetToRuleNumber } from 'complexity-automata';

  /** Rule in `B3/S23` notation. */
  export let rule = 'B3/S23';
  /** Compact layout for narrow screens. */
  export let compact = false;

  const dispatch = createEventDispatcher();
  const counts = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  $: parsed = parseRule(rule);
  $: ruleNumber = ruleSetToRuleNumber(parsed);

  function toggle(kind, count) {
    const list = kind === 'birth' ? parsed.birth : parsed.survive;
    const next = list.includes(count) ? list.filter((n) => n !== count) : [...list, count].sort((a, b) => a - b);
    dispatch('change', {
      rule: kind === 'birth' ? { ...parsed, birth: next } : { ...parsed, survive: next },
    });
  }

  function jump(delta) {
    dispatch('change', { rule: (ruleNumber + delta + RULE_SPACE) % RULE_SPACE });
  }

  function onNumberInput(event) {
    const value = Number(event.currentTarget.value);
    if (Number.isFinite(value)) dispatch('change', { rule: ((value % RULE_SPACE) + RULE_SPACE) % RULE_SPACE });
  }
</script>

<div class="rules" class:compact>
  <div class="row">
    <span class="label" title="Neighbour counts that bring a dead cell to life">B</span>
    {#each counts as count}
      <button
        class="bit"
        class:on={parsed.birth.includes(count)}
        aria-pressed={parsed.birth.includes(count)}
        aria-label={`Born with ${count} neighbours`}
        on:click={() => toggle('birth', count)}
      >
        {count}
      </button>
    {/each}
  </div>

  <div class="row">
    <span class="label" title="Neighbour counts that keep a live cell alive">S</span>
    {#each counts as count}
      <button
        class="bit"
        class:on={parsed.survive.includes(count)}
        aria-pressed={parsed.survive.includes(count)}
        aria-label={`Survives with ${count} neighbours`}
        on:click={() => toggle('survive', count)}
      >
        {count}
      </button>
    {/each}
  </div>

  <div class="row number">
    <button class="step" on:click={() => jump(-1)} aria-label="Previous universe">−</button>
    <label class="rule-number">
      <span class="hash">#</span>
      <input
        type="number"
        min="0"
        max={RULE_SPACE - 1}
        value={ruleNumber}
        on:change={onNumberInput}
        aria-label="Rule number"
      />
    </label>
    <button class="step" on:click={() => jump(1)} aria-label="Next universe">+</button>
    <span class="notation">{rule}</span>
  </div>
</div>

<style>
  .rules {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .label {
    width: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #9fb0d0;
  }

  .bit {
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 0.35rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #c9d4e8;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .compact .bit {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 0.7rem;
  }

  .bit.on {
    background: linear-gradient(135deg, #5b8cff, #8d5bff);
    border-color: transparent;
    color: white;
    font-weight: 600;
  }

  .number {
    margin-top: 0.15rem;
    gap: 0.35rem;
  }

  .step {
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 0.35rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #c9d4e8;
    cursor: pointer;
  }

  .rule-number {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    padding: 0 0.35rem;
    border-radius: 0.35rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
  }

  .hash {
    color: #7e8ca8;
    font-size: 0.75rem;
  }

  input {
    width: 4.5rem;
    padding: 0.25rem 0;
    border: none;
    background: transparent;
    color: #e8ecf5;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8rem;
  }

  input:focus {
    outline: none;
  }

  .notation {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.75rem;
    color: #8fa6cc;
  }
</style>
