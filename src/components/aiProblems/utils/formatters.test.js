import { describe, expect, it } from 'vitest';

import {
  formatCompactJSON,
  formatDisplayValue,
  formatPrettyJSON,
  tryParseJSON,
  unwrapExtraNesting,
  unwrapTestCasesArray,
} from './formatters';

describe('aiProblems formatters', () => {
  it('parses valid JSON and falls back to raw strings when parsing fails', () => {
    expect(tryParseJSON('{"ok":true}')).toEqual({ ok: true });
    expect(tryParseJSON('not-json')).toBe('not-json');
  });

  it('formats compact JSON for null, objects, and primitive values', () => {
    expect(formatCompactJSON(null)).toBe('null');
    expect(formatCompactJSON({ a: 1, b: [2] })).toBe('{"a":1,"b":[2]}');
    expect(formatCompactJSON(42)).toBe('42');
  });

  it('formats pretty JSON for parseable strings and falls back on invalid input', () => {
    expect(formatPrettyJSON('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(formatPrettyJSON({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatPrettyJSON(undefined)).toBe('null');
    expect(formatPrettyJSON('plain text')).toBe('plain text');
  });

  it('formats display values for arrays, numeric strings, and string literals', () => {
    expect(formatDisplayValue(null)).toBe('n/a');
    expect(formatDisplayValue([1, 2, 3])).toBe('[1,2,3]');
    expect(formatDisplayValue('007')).toBe('7');
    expect(formatDisplayValue('  ')).toBe('"  "');
    expect(formatDisplayValue('hello')).toBe('"hello"');
    expect(formatDisplayValue(false)).toBe('false');
  });

  it('unwraps one-level array nesting and handles test-case arrays', () => {
    expect(unwrapExtraNesting([[1, 2]])).toEqual([1, 2]);
    expect(unwrapExtraNesting([1, 2])).toEqual([1, 2]);
    expect(unwrapExtraNesting('value')).toBe('value');
    expect(unwrapTestCasesArray([[[1]], [2], 'x'])).toEqual([[1], [2], 'x']);
    expect(unwrapTestCasesArray('not-array')).toBe('not-array');
  });
});
