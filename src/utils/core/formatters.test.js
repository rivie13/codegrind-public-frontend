import { describe, expect, it } from 'vitest';
import { formatTestResults } from './formatters';

describe('core formatters', () => {
  it('formats detailed failed test output', () => {
    const output = formatTestResults({
      testCases: [
        {
          passed: false,
          input: [1, 2],
          expectedOutput: [3],
          actualOutput: [4],
          runtime: '0.123',
          memory: 2048,
          compile_output: 'compile failed',
          stderr: 'stderr text',
          message: 'message text',
          error: 'error text',
        },
      ],
    });

    expect(output).toContain('Test case details:');
    expect(output).toContain('Input: [1,2]');
    expect(output).toContain('Expected Output: [3]');
    expect(output).toContain('Actual Output: [4]');
    expect(output).toContain('Compilation Error:');
    expect(output).toContain('Runtime Error:');
    expect(output).toContain('Message:');
    expect(output).toContain('Error:');
  });

  it('formats nested arrays and all-pass footer', () => {
    const output = formatTestResults({
      testCases: [
        {
          passed: true,
          input: [
            [1, 2],
            [3, 4],
          ],
          expectedOutput: [10],
          actualOutput: [10],
          runtime: '1',
          memory: 1024,
        },
      ],
    });

    expect(output).toContain('Input: [[1,2],[3,4]]');
    expect(output).toContain('All test cases passed!');
  });

  it('returns empty string when no formatted data exists', () => {
    expect(formatTestResults(null)).toBe('');
  });
});
