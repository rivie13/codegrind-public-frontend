import { describe, expect, it } from 'vitest';

import { isStandaloneCityRoute } from './standaloneCityRoute';

describe('isStandaloneCityRoute', () => {
  it('matches the standalone phaser city routes with and without trailing slashes', () => {
    expect(isStandaloneCityRoute('/city')).toBe(true);
    expect(isStandaloneCityRoute('/city/')).toBe(true);
    expect(isStandaloneCityRoute('/city/phaser-preview')).toBe(true);
    expect(isStandaloneCityRoute('/city/phaser-preview/')).toBe(true);
  });

  it('rejects legacy city routes and unrelated paths', () => {
    expect(isStandaloneCityRoute('/city/legacy')).toBe(false);
    expect(isStandaloneCityRoute('/games')).toBe(false);
    expect(isStandaloneCityRoute('/')).toBe(false);
  });
});
