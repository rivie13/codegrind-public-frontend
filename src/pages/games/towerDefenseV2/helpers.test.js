import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../game-engine-v2', () => ({
  DEPLOYABLE_TYPES: {
    BURST_TURRET: { type: 'burst_turret', placementType: 'tower' },
    BLAST_TURRET: { type: 'blast_turret', placementType: 'tower' },
    MINE: { type: 'mine', placementType: 'path' },
  },
}));

import {
  normalizeTerminalOutput,
  getDeployablePlacementType,
  resolveTypeKey,
  getTowerDefenseProblemId,
} from './helpers.js';

describe('normalizeTerminalOutput', () => {
  it('converts a plain string to an array of line objects', () => {
    const result = normalizeTerminalOutput('hello\nworld');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'hello\n', className: 'terminal-line' });
    expect(result[1]).toEqual({ text: 'world\n', className: 'terminal-line' });
  });

  it('returns empty array for non-string non-array input', () => {
    expect(normalizeTerminalOutput(null)).toEqual([]);
    expect(normalizeTerminalOutput(42)).toEqual([]);
    expect(normalizeTerminalOutput(undefined)).toEqual([]);
  });

  it('converts array of strings to line objects', () => {
    const result = normalizeTerminalOutput(['line1', 'line2']);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'line1\n', className: 'terminal-line' });
  });

  it('passes through array items that already have a text field', () => {
    const item = { text: 'already\n', className: 'custom-class' };
    const result = normalizeTerminalOutput([item]);
    expect(result[0]).toBe(item);
  });

  it('converts array items with a message field', () => {
    const result = normalizeTerminalOutput([{ message: 'msg', className: 'info' }]);
    expect(result[0]).toEqual({ text: 'msg\n', className: 'info' });
  });

  it('defaults className to terminal-line when item has message but no className', () => {
    const result = normalizeTerminalOutput([{ message: 'hello' }]);
    expect(result[0].className).toBe('terminal-line');
  });

  it('filters out null items in arrays', () => {
    const result = normalizeTerminalOutput([
      null,
      { text: 'valid\n', className: 'x' },
      { unknownField: true },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('valid\n');
  });
});

describe('getDeployablePlacementType', () => {
  it('returns "any" for null/undefined deployable', () => {
    expect(getDeployablePlacementType(null)).toBe('any');
    expect(getDeployablePlacementType(undefined)).toBe('any');
  });

  it('resolves by key when deployable has a matching key', () => {
    expect(getDeployablePlacementType({ key: 'MINE' })).toBe('path');
  });

  it('resolves by type when key is not found', () => {
    expect(getDeployablePlacementType({ type: 'burst_turret' })).toBe('tower');
  });

  it('returns "any" for unknown key and type', () => {
    expect(getDeployablePlacementType({ key: 'UNKNOWN', type: 'unknown' })).toBe('any');
  });
});

describe('resolveTypeKey', () => {
  const types = {
    BURST_TURRET: { type: 'burst_turret' },
    BLAST_TURRET: { type: 'blast_turret' },
    MINE: { type: 'mine' },
  };

  it('returns null for falsy input', () => {
    expect(resolveTypeKey(null, types)).toBeNull();
    expect(resolveTypeKey('', types)).toBeNull();
  });

  it('matches by direct key (case-insensitive normalization)', () => {
    expect(resolveTypeKey('BURST_TURRET', types)).toBe('BURST_TURRET');
    expect(resolveTypeKey('burst_turret', types)).toBe('BURST_TURRET');
  });

  it('resolves BURST alias to BURST_TURRET', () => {
    expect(resolveTypeKey('BURST', types)).toBe('BURST_TURRET');
  });

  it('resolves BLAST alias to BLAST_TURRET', () => {
    expect(resolveTypeKey('BLAST', types)).toBe('BLAST_TURRET');
  });

  it('matches by type name when key lookup fails', () => {
    expect(resolveTypeKey('mine', types)).toBe('MINE');
  });

  it('returns null for completely unknown input', () => {
    expect(resolveTypeKey('UNKNOWN_XYZ', types)).toBeNull();
  });
});

describe('getTowerDefenseProblemId', () => {
  it('returns null for null/undefined problem', () => {
    expect(getTowerDefenseProblemId(null)).toBeNull();
    expect(getTowerDefenseProblemId(undefined)).toBeNull();
  });

  it('returns questionId for regular (non-AI) problems', () => {
    expect(getTowerDefenseProblemId({ questionId: 42 })).toBe(42);
  });

  it('returns questionFrontendId when questionId is absent', () => {
    expect(getTowerDefenseProblemId({ questionFrontendId: 99 })).toBe(99);
  });

  it('uses displayNumber as fallback for regular problems', () => {
    expect(getTowerDefenseProblemId({ displayNumber: 5 })).toBe(5);
  });

  it('uses id as last fallback', () => {
    expect(getTowerDefenseProblemId({ id: 7 })).toBe(7);
  });

  it('prefers id for CODEGRIND problems', () => {
    expect(getTowerDefenseProblemId({ source: 'CODEGRIND', id: 501, questionId: 1 })).toBe(501);
  });

  it('uses metadata frontend id fallback when direct ids are missing', () => {
    expect(getTowerDefenseProblemId({ metadata: { frontendQuestionId: '55' } })).toBe(55);
  });

  it('for AI problems, prefers displayNumber over questionId', () => {
    expect(getTowerDefenseProblemId({ source: 'AI', displayNumber: 3, questionId: 10 })).toBe(3);
  });

  it('returns null when no valid numeric id can be parsed', () => {
    expect(getTowerDefenseProblemId({ questionId: 'abc' })).toBeNull();
  });

  it('parses string numbers', () => {
    expect(getTowerDefenseProblemId({ questionId: '100' })).toBe(100);
  });
});
