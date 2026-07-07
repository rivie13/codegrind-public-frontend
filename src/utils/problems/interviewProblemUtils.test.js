import { describe, expect, it } from 'vitest';
import { INTERVIEW_UTILS, getStarterCode, wrapUserCode } from './interviewProblemUtils';

describe('interviewProblemUtils', () => {
  it('exposes starter helpers and starter code template', () => {
    expect(INTERVIEW_UTILS).toContain('class ListNode');
    expect(INTERVIEW_UTILS).toContain('class TreeNode');

    expect(getStarterCode()).toContain('def solution():');
    expect(getStarterCode('solve_problem')).toContain('def solve_problem():');
  });

  it('wraps user code with parser logic for every supported param type', () => {
    const wrapped = wrapUserCode(
      `
class Solution:
    def solve(self, a, b, nums, words, meta):
        return a
      `.trim(),
      {
        name: 'solve',
        params: [
          { name: 'a', type: 'integer' },
          { name: 'b', type: 'string' },
          { name: 'nums', type: 'integer[]' },
          { name: 'words', type: 'string[]' },
          { name: 'meta', type: 'object' },
        ],
      }
    );

    expect(wrapped).toContain('for i in range(0, len(test_cases), 5):');
    expect(wrapped).toContain('a = int(test_cases[i + 0])');
    expect(wrapped).toContain('b = test_cases[i + 1]');
    expect(wrapped).toContain('nums = json.loads(test_cases[i + 2])');
    expect(wrapped).toContain('words = json.loads(test_cases[i + 3])');
    expect(wrapped).toContain('meta = json.loads(test_cases[i + 4])');
    expect(wrapped).toContain('result = solution.solve(a, b, nums, words, meta)');
    expect(wrapped).toContain('if __name__ == "__main__":');
  });
});
