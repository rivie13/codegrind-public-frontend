import { describe, expect, it } from 'vitest';

import { resolveLearningLanguageLock } from './useTowerDefenseV2LanguageLock';

describe('resolveLearningLanguageLock', () => {
  it('locks JavaScript learning tower slugs to javascript', () => {
    expect(
      resolveLearningLanguageLock({
        isLearningMode: true,
        learningPathSlug: 'javascript-path',
        learningPathTitleSlug: 'lp-js-m0-td-hello-print',
      })
    ).toBe('javascript');
  });

  it('distinguishes java from javascript', () => {
    expect(
      resolveLearningLanguageLock({
        isLearningMode: true,
        learningPathSlug: 'java-path',
        learningPathTitleSlug: 'lp-java-m0-td-hello-print',
      })
    ).toBe('java');
  });
});
