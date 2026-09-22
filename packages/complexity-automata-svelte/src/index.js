/**
 * complexity-automata-svelte — the UI half of the project.
 *
 * ```svelte
 * <script>
 *   import { AutomataApp } from 'complexity-automata-svelte';
 * </script>
 *
 * <AutomataApp demo="conway" />
 * ```
 *
 * The engine itself lives in `complexity-automata`, which this package
 * re-exports so an embedder only needs one dependency.
 */

export { default as AutomataApp } from './AutomataApp.svelte';
export { default as AutomataCanvas } from './AutomataCanvas.svelte';
export { default as IntroScreen } from './IntroScreen.svelte';
export { default as RuleControls } from './RuleControls.svelte';
export { default as UniverseShelf } from './UniverseShelf.svelte';
export { CanvasPainter, cellAtPointer, createBuffer, gridSizeFor } from './canvas.js';
export * from 'complexity-automata';
