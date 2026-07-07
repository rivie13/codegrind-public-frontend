import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../core/logger', () => ({
  default: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import logger from '../core/logger';
import { analyzeCode } from './codeParser';

const areAllConcepts = (result, expectedValue) =>
  Object.values(result).every((value) => value === expectedValue);

describe('analyzeCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all-false concepts for empty code', () => {
    const result = analyzeCode('', 'javascript');

    expect(areAllConcepts(result, false)).toBe(true);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('detects core JavaScript concepts from common syntax', () => {
    const code = `
      const nums = [1, 2];
      const helper = (n) => n * 2;
      for (let i = 0; i < nums.length; i++) {}
      while (false) {}
      if (nums.length) { return nums[0]; }
      const obj = { a: 1 };
      try { helper(nums[0]); } catch (e) {}
      switch (nums[0]) { default: break; }
      Object.keys(obj);
      nums.map((n) => n + 1);
    `;

    const result = analyzeCode(code, 'javascript');

    expect(result).toMatchObject({
      FOR_LOOP: true,
      WHILE_LOOP: true,
      IF_CONDITION: true,
      VARIABLE: true,
      FUNCTION: true,
      ARRAY: true,
      OBJECT: true,
      RETURN_STATEMENT: true,
      TRY_CATCH: true,
      SWITCH: true,
    });
    expect(logger.info).toHaveBeenCalledWith('Code analysis results:');
    expect(logger.debug).toHaveBeenCalledWith(result);
  });

  it('normalizes python3 and detects comprehension-based concepts', () => {
    const code = `
      numbers = [x for x in range(3)]
      mapping = {x: x * 2 for x in range(3)}
      def solve():
          return numbers
    `;

    const result = analyzeCode(code, 'python3');

    expect(result.FOR_LOOP).toBe(true);
    expect(result.FUNCTION).toBe(true);
    expect(result.ARRAY).toBe(true);
    expect(result.OBJECT).toBe(true);
    expect(result.RETURN_STATEMENT).toBe(true);
    expect(result.SWITCH).toBe(false);
  });

  it('marks every concept true for unsupported languages', () => {
    const result = analyzeCode('puts "hello"', 'ruby');

    expect(areAllConcepts(result, true)).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      'Unsupported language: ruby, defaulting to general detection'
    );
  });

  it('falls back to all-true concepts when analysis throws', () => {
    const result = analyzeCode('const x = 1;', null);

    expect(areAllConcepts(result, true)).toBe(true);
    expect(logger.error).toHaveBeenCalledWith('Error analyzing code:');
    expect(logger.debug).toHaveBeenCalled();
  });
});
