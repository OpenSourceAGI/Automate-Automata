/**
 * complexity-automata — a cellular automata engine for the browser, the phone
 * and the terminal.
 *
 * ```ts
 * import { Automata, demos, saveUniverse } from 'complexity-automata';
 *
 * const life = new Automata({ width: 80, height: 40, rule: 'B3/S23' });
 * life.stampCentered('Glider Gun');
 * life.run(100);
 * console.log(life.toString());
 * ```
 */

export { Automata, fromString, mulberry32, type AutomataOptions } from './automata.js';
export { Autopilot, type AutopilotOptions, type UniverseChange } from './autopilot.js';
export { blend, hslToRgb, mix, parseColor, rgbToHex, seedColor, type RGB } from './color.js';
export { buildDemo, demos, getDemo, INTRO_DEMO, type Demo, type DemoContext } from './demos.js';
export {
  getPattern,
  patterns,
  patternsByCategory,
  patternSize,
  POINT,
  rotatePattern,
  type Pattern,
  type PatternCategory,
} from './patterns.js';
export {
  CONWAY,
  formatRule,
  NAMED_RULES,
  normalizeRuleNumber,
  parseRule,
  RULE_BITS,
  RULE_SPACE,
  ruleNumberToRuleSet,
  rulesEqual,
  ruleSetToRuleNumber,
  toRuleNumber,
  type RuleLike,
  type RuleSet,
} from './rules.js';
export {
  decodeRLE,
  encodeRLE,
  fromShareString,
  loadUniverse,
  measureRLE,
  memoryStorage,
  parseUniverse,
  ruleToString,
  saveUniverse,
  toShareString,
  UNIVERSE_FORMAT,
  UNIVERSE_VERSION,
  UniverseLibrary,
  type UniverseFile,
  type UniverseStorage,
} from './universe.js';
