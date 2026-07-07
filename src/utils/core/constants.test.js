import { describe, expect, it } from 'vitest';

import { DIFFICULTY_COLORS, PANEL_SIZES, SUPPORTED_LANGUAGES } from './constants';

describe('core/constants', () => {
  it('defines the supported editor languages in expected order', () => {
    expect(SUPPORTED_LANGUAGES).toEqual([
      { value: 'python', label: 'Python' },
      { value: 'javascript', label: 'JavaScript' },
      { value: 'java', label: 'Java' },
      { value: 'cpp', label: 'C++' },
    ]);
  });

  it('maps difficulties to stable color tokens', () => {
    expect(DIFFICULTY_COLORS).toEqual({
      Easy: '#38A169',
      Medium: '#D69E2E',
      Hard: '#E53E3E',
    });
  });

  it('exposes panel size defaults and bounds for workspace layout', () => {
    expect(PANEL_SIZES).toEqual({
      problem: { default: 30, min: 20, max: 45 },
      editor: { default: 45, min: 30, max: 60 },
      chat: { default: 25, min: 15, max: 40 },
    });
  });
});
