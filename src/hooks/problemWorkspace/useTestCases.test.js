import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('../../utils/core/logger', () => ({
  default: mockLogger,
}));

import { useTestCases } from './useTestCases';

describe('useTestCases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty list when no problem data is provided', () => {
    const { result } = renderHook(() => useTestCases(null));
    expect(result.current).toEqual([]);
  });

  it('parses valid test cases from preformatted content', async () => {
    const problemData = {
      content: `
        <div>
          <pre>Input: nums = [2,7,11,15], target = 9
Output: [0,1]</pre>
          <pre>Input: nums = [-1,4,5], target = -1
Output: [0]</pre>
          <pre>Unrelated block</pre>
        </div>
      `,
    };

    const { result } = renderHook(() => useTestCases(problemData));

    await waitFor(() => {
      expect(result.current).toEqual([
        { params: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] },
        { params: [[-1, 4, 5], -1], expectedOutput: [0] },
      ]);
    });
  });

  it('logs parsing errors and skips invalid test case blocks', async () => {
    const problemData = {
      content: `
        <pre>Input: nums = [1,,2], target = 3
Output: [0,1]</pre>
      `,
    };

    const { result } = renderHook(() => useTestCases(problemData));

    await waitFor(() => {
      expect(result.current).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('Error parsing test case:');
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });
});
