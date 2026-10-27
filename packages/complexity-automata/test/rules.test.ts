import { describe, expect, test } from 'bun:test';
import {
  formatRule,
  parseRule,
  ruleNumberToRuleSet,
  rulesEqual,
  ruleSetToRuleNumber,
  RULE_SPACE,
} from '../src/rules.js';

describe('rule parsing', () => {
  test('reads B/S notation', () => {
    expect(parseRule('B3/S23')).toEqual({ birth: [3], survive: [2, 3] });
  });

  test('reads S/B notation in either order', () => {
    expect(parseRule('S23/B3')).toEqual({ birth: [3], survive: [2, 3] });
  });

  test('reads bare birth/survive digits', () => {
    expect(parseRule('3/23')).toEqual({ birth: [3], survive: [2, 3] });
  });

  test('reads names', () => {
    expect(formatRule(parseRule('highlife'))).toBe('B36/S23');
  });

  test('handles empty survive sets', () => {
    expect(parseRule('B2/S')).toEqual({ birth: [2], survive: [] });
  });

  test('drops out-of-range and duplicate counts', () => {
    expect(parseRule({ birth: [3, 3, 9, -1], survive: [2] })).toEqual({ birth: [3], survive: [2] });
  });
});

describe('rule numbers', () => {
  test('round-trip every rule number', () => {
    for (const n of [0, 1, 6152, 12345, RULE_SPACE - 1]) {
      expect(ruleSetToRuleNumber(ruleNumberToRuleSet(n))).toBe(n);
    }
  });

  test('Conway is bit 3 plus bits 11 and 12', () => {
    expect(ruleSetToRuleNumber(parseRule('B3/S23'))).toBe((1 << 3) | (1 << 11) | (1 << 12));
  });

  test('wraps out-of-range numbers into the rule space', () => {
    expect(ruleNumberToRuleSet(RULE_SPACE + 8)).toEqual(ruleNumberToRuleSet(8));
  });

  test('compares rules across representations', () => {
    expect(rulesEqual('B3/S23', 6152)).toBe(true);
    expect(rulesEqual('B3/S23', 'B36/S23')).toBe(false);
  });
});
