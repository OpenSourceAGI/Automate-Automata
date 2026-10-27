/**
 * Automatic mode: keep the screen alive without anyone touching it.
 *
 * Most of the 262,144 rules are boring — they die out in ten generations or
 * fill the grid with static. The autopilot watches for both and moves on,
 * so what you actually see is a tour of the rules that do something.
 */

import type { Automata } from './automata.js';
import { patterns, type Pattern } from './patterns.js';
import { RULE_SPACE } from './rules.js';

export interface AutopilotOptions {
  /** Never switch rules before this many generations. Default 40. */
  minGenerations?: number;
  /** Always switch by this many generations. Default 400. */
  maxGenerations?: number;
  /** Fraction of the grid seeded when a new universe starts. Default 0.18. */
  density?: number;
  /** Also stamp a few known patterns into each new universe. Default true. */
  stampPatterns?: boolean;
  /** Called whenever the autopilot moves to a new universe. */
  onUniverse?: (info: UniverseChange) => void;
}

export interface UniverseChange {
  ruleNumber: number;
  rule: string;
  /** Why the previous universe ended. */
  reason: 'start' | 'stagnant' | 'timeout' | 'manual';
  /** How many generations the previous universe survived. */
  survived: number;
}

const stampable = (): Pattern[] => patterns.filter((p) => p.cells.length > 0 && p.category !== 'fractal');

export class Autopilot {
  private options: Required<Omit<AutopilotOptions, 'onUniverse'>> & Pick<AutopilotOptions, 'onUniverse'>;
  private generationsInUniverse = 0;
  private budget: number;

  constructor(
    private automata: Automata,
    options: AutopilotOptions = {},
  ) {
    this.options = {
      minGenerations: options.minGenerations ?? 40,
      maxGenerations: options.maxGenerations ?? 400,
      density: options.density ?? 0.18,
      stampPatterns: options.stampPatterns ?? true,
      onUniverse: options.onUniverse,
    };
    this.budget = this.options.maxGenerations;
  }

  /**
   * Call once per generation, after `step()`. Returns true if it started a new
   * universe on this tick.
   */
  tick(): boolean {
    this.generationsInUniverse++;
    if (this.generationsInUniverse < this.options.minGenerations) return false;
    if (this.automata.isStagnant()) return this.next('stagnant');
    if (this.generationsInUniverse >= this.budget) return this.next('timeout');
    return false;
  }

  /** Jump to a new random universe right now. */
  next(reason: UniverseChange['reason'] = 'manual'): boolean {
    const survived = this.generationsInUniverse;
    this.automata.setRule(Math.floor(this.automata.random() * RULE_SPACE));
    this.automata.clear();
    this.automata.randomize(this.options.density);

    if (this.options.stampPatterns) {
      const choices = stampable();
      const count = 1 + Math.floor(this.automata.random() * 3);
      for (let i = 0; i < count; i++) {
        this.automata.stampRandom(choices[Math.floor(this.automata.random() * choices.length)]!);
      }
    }

    this.generationsInUniverse = 0;
    // Vary how long each universe gets, so the tour does not feel metronomic.
    this.budget =
      this.options.minGenerations +
      Math.floor(this.automata.random() * Math.max(1, this.options.maxGenerations - this.options.minGenerations));

    this.options.onUniverse?.({
      ruleNumber: this.automata.ruleNumber,
      rule: this.automata.ruleString,
      reason,
      survived,
    });
    return true;
  }

  /** Generations the current universe has run under the autopilot. */
  get age(): number {
    return this.generationsInUniverse;
  }
}
