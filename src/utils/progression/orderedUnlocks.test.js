import { describe, expect, it } from 'vitest';
import {
  getContiguousSolvedPrefixLength,
  getUnlockedOrderedSlugs,
  isOrderedSlugUnlocked,
} from './orderedUnlocks';

describe('getContiguousSolvedPrefixLength', () => {
  it('returns 0 for empty orderedSlugs', () => {
    expect(getContiguousSolvedPrefixLength([], new Set(['a']))).toBe(0);
  });

  it('returns 0 for non-array orderedSlugs', () => {
    expect(getContiguousSolvedPrefixLength(null, ['a'])).toBe(0);
    expect(getContiguousSolvedPrefixLength(undefined, ['a'])).toBe(0);
  });

  it('returns 0 when nothing is solved', () => {
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c'], [])).toBe(0);
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c'], new Set())).toBe(0);
  });

  it('returns 1 when only the first slug is solved', () => {
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c'], ['a'])).toBe(1);
  });

  it('returns length of contiguous prefix solved', () => {
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c', 'd'], ['a', 'b'])).toBe(2);
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(3);
  });

  it('stops counting at first unsolved slug (non-contiguous)', () => {
    // a solved, b NOT solved, c solved — prefix is 1
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c'], ['a', 'c'])).toBe(1);
  });

  it('accepts a Set for solvedSlugs', () => {
    expect(getContiguousSolvedPrefixLength(['a', 'b', 'c'], new Set(['a', 'b']))).toBe(2);
  });

  it('filters out falsy slugs in orderedSlugs', () => {
    expect(getContiguousSolvedPrefixLength([null, 'a', 'b'], ['a', 'b'])).toBe(0);
  });
});

describe('getUnlockedOrderedSlugs', () => {
  it('returns empty array for empty orderedSlugs', () => {
    expect(getUnlockedOrderedSlugs([], ['a'])).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(getUnlockedOrderedSlugs(null, ['a'])).toEqual([]);
  });

  it('returns first slug when nothing solved (initial unlock)', () => {
    expect(getUnlockedOrderedSlugs(['a', 'b', 'c'], [])).toEqual(['a']);
  });

  it('unlocks one beyond the solved prefix', () => {
    expect(getUnlockedOrderedSlugs(['a', 'b', 'c', 'd'], ['a', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('does not exceed array length when all are solved', () => {
    expect(getUnlockedOrderedSlugs(['a', 'b'], ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('isOrderedSlugUnlocked', () => {
  const slugs = ['a', 'b', 'c', 'd'];

  it('returns false for falsy slug', () => {
    expect(isOrderedSlugUnlocked(slugs, null, [])).toBe(false);
    expect(isOrderedSlugUnlocked(slugs, '', [])).toBe(false);
  });

  it('returns true for first slug regardless of solved set', () => {
    expect(isOrderedSlugUnlocked(slugs, 'a', [])).toBe(true);
  });

  it('returns true for a slug within the unlocked range', () => {
    expect(isOrderedSlugUnlocked(slugs, 'b', ['a'])).toBe(true);
  });

  it('returns false for a locked slug', () => {
    // 'c' is locked when only 'a' is solved (unlocked = ['a', 'b'])
    expect(isOrderedSlugUnlocked(slugs, 'c', ['a'])).toBe(false);
  });

  it('returns false for a slug not in the list', () => {
    expect(isOrderedSlugUnlocked(slugs, 'z', ['a', 'b', 'c', 'd'])).toBe(false);
  });
});
