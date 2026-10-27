/**
 * Rule sets for 2-state, 9-neighbour (Moore neighbourhood) cellular automata.
 *
 * A rule is two sets of neighbour counts:
 *   - `birth`   — counts that bring a dead cell to life
 *   - `survive` — counts that keep a live cell alive
 *
 * Conway's Game of Life is `B3/S23`: born with exactly 3 neighbours,
 * survives with 2 or 3.
 *
 * Every rule also has a **rule number**: an 18 bit integer where bits 0..8 are
 * the birth counts 0..8 and bits 9..17 are the survival counts 0..8. That makes
 * the whole space of 262,144 universes addressable by a single integer, which is
 * what the "random universe" mode walks through.
 */

/** Neighbour counts that create and preserve life. */
export interface RuleSet {
  birth: number[];
  survive: number[];
}

/** Number of bits in a rule number: 9 birth counts + 9 survival counts. */
export const RULE_BITS = 18;

/** One past the largest valid rule number (2 ** 18). */
export const RULE_SPACE = 1 << RULE_BITS;

/** Anything that can be turned into a {@link RuleSet}. */
export type RuleLike = RuleSet | number | string;

const sortUnique = (counts: Iterable<number>): number[] =>
  [...new Set(counts)].filter((n) => Number.isInteger(n) && n >= 0 && n <= 8).sort((a, b) => a - b);

/** Expand a rule number into the neighbour counts it encodes. */
export function ruleNumberToRuleSet(ruleNumber: number): RuleSet {
  const n = normalizeRuleNumber(ruleNumber);
  const birth: number[] = [];
  const survive: number[] = [];
  for (let i = 0; i <= 8; i++) {
    if (n & (1 << i)) birth.push(i);
    if (n & (1 << (i + 9))) survive.push(i);
  }
  return { birth, survive };
}

/** Pack neighbour counts back into an 18 bit rule number. */
export function ruleSetToRuleNumber(rule: RuleSet): number {
  let n = 0;
  for (const b of sortUnique(rule.birth ?? [])) n |= 1 << b;
  for (const s of sortUnique(rule.survive ?? [])) n |= 1 << (s + 9);
  return n;
}

/** Clamp any number into the rule space, wrapping rather than throwing. */
export function normalizeRuleNumber(ruleNumber: number): number {
  const n = Math.floor(Number(ruleNumber) || 0);
  return ((n % RULE_SPACE) + RULE_SPACE) % RULE_SPACE;
}

/** Render a rule set in the conventional `B3/S23` notation. */
export function formatRule(rule: RuleSet): string {
  return `B${sortUnique(rule.birth).join('')}/S${sortUnique(rule.survive).join('')}`;
}

/**
 * Accept a rule in any of the shapes people actually have one in:
 * `{ birth, survive }`, a rule number, `"B3/S23"`, `"3/23"`, or `"23/3"`
 * (the older Golly ordering, detected by the `S` prefix being absent and the
 * first group being the survival counts).
 */
export function parseRule(rule: RuleLike): RuleSet {
  if (typeof rule === 'number') return ruleNumberToRuleSet(rule);
  if (rule && typeof rule === 'object') {
    return { birth: sortUnique(rule.birth ?? []), survive: sortUnique(rule.survive ?? []) };
  }

  const text = String(rule).trim();
  if (text === '') return { birth: [], survive: [] };
  if (/^\d+$/.test(text) && !text.includes('/')) return ruleNumberToRuleSet(Number(text));

  const named = NAMED_RULES[text.toLowerCase()];
  if (named) return parseRule(named);

  const [left = '', right = ''] = text.split('/');
  const digits = (part: string): number[] => sortUnique([...part.replace(/[^\d]/g, '')].map(Number));

  // `S23/B3` and `B3/S23` are both common; so is the bare `3/23` (birth first)
  // and Golly's `23/3` (survive first).
  if (/^\s*s/i.test(left) || /^\s*b/i.test(right)) {
    return { birth: digits(right), survive: digits(left) };
  }
  return { birth: digits(left), survive: digits(right) };
}

/** Convenience: anything rule-like straight to a rule number. */
export function toRuleNumber(rule: RuleLike): number {
  return typeof rule === 'number' ? normalizeRuleNumber(rule) : ruleSetToRuleNumber(parseRule(rule));
}

/** Are these the same rule? */
export function rulesEqual(a: RuleLike, b: RuleLike): boolean {
  return toRuleNumber(a) === toRuleNumber(b);
}

/**
 * Rules worth knowing by name. Each one is a different universe with its own
 * physics — Conway's is only the most famous of them.
 */
export const NAMED_RULES: Record<string, string> = {
  conway: 'B3/S23',
  life: 'B3/S23',
  highlife: 'B36/S23',
  daynight: 'B3678/S34678',
  seeds: 'B2/S',
  replicator: 'B1357/S1357',
  fredkin: 'B1357/S02468',
  maze: 'B3/S12345',
  mazectric: 'B3/S1234',
  coral: 'B3/S45678',
  coagulations: 'B378/S235678',
  diamoeba: 'B35678/S5678',
  amoeba: 'B357/S1358',
  anneal: 'B4678/S35678',
  assimilation: 'B345/S4567',
  gnarl: 'B1/S1',
  lifewithoutdeath: 'B3/S012345678',
  serviettes: 'B234/S',
  walledcities: 'B45678/S2345',
  '34life': 'B34/S34',
  '2x2': 'B36/S125',
  morley: 'B368/S245',
  stains: 'B3678/S235678',
  vote: 'B5678/S45678',
};

/** Conway's Game of Life, the rule everything else is measured against. */
export const CONWAY: RuleSet = parseRule('B3/S23');
