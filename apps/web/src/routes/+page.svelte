<script>
  import { AutomataApp } from 'complexity-automata-svelte';
  import { page } from '$app/stores';

  // `?demo=fractal` opens straight into a demo; `?intro=0` skips the intro
  // screen, which is what the Android app's shortcut and the demo links use.
  $: demo = $page.url.searchParams.get('demo') ?? 'conway';
  $: intro = $page.url.searchParams.get('intro') !== '0' && !$page.url.searchParams.get('u');
  $: cellSize = Number($page.url.searchParams.get('cell')) || 4;
</script>

{#key demo}
  <AutomataApp {demo} {intro} {cellSize} />
{/key}
