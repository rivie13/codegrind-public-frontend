import { describe, expect, it } from 'vitest';
import { validateProblem } from './problemValidation';

const createValidProblem = () => ({
  title: 'Two Sum',
  difficulty: 'EASY',
  description: 'Find two numbers that add up to the target.',
  solution: 'def two_sum(nums, target):\n    return []',
  functionName: 'two_sum',
  examples: [
    {
      input: '[2,7,11,15], 9',
      output: '[0,1]',
      explanation: 'nums[0] + nums[1] == 9',
    },
  ],
  testCases: ['[2,7,11,15]\n9'],
  expectedOutputs: ['[0,1]'],
});

describe('validateProblem', () => {
  it('returns valid for a fully valid problem', () => {
    const result = validateProblem(createValidProblem());

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('flags required field and structural errors', () => {
    const result = validateProblem({
      ...createValidProblem(),
      title: '',
      difficulty: '',
      description: '',
      solution: '',
      examples: [],
      testCases: ['a'],
      expectedOutputs: [],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title cannot be empty');
    expect(result.errors).toContain('Difficulty cannot be empty');
    expect(result.errors).toContain('Description cannot be empty');
    expect(result.errors).toContain('Solution cannot be empty');
    expect(result.errors).toContain('At least one example is required');
    expect(result.errors).toContain('Test cases and expected outputs must match in number');
  });

  it('flags malformed examples', () => {
    const result = validateProblem({
      ...createValidProblem(),
      examples: [{ input: '1 2 3' }],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Example 1 must have both input and output');
  });

  it('adds a warning when function name does not match solution code', () => {
    const result = validateProblem({
      ...createValidProblem(),
      functionName: 'expected_name',
      solution: 'def different_name(nums, target):\n    return []',
    });

    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain(
      'Function name in solution may not match the specified function name'
    );
  });

  it('flags profanity in text content', () => {
    const result = validateProblem({
      ...createValidProblem(),
      description: 'This contains fuck and should fail validation.',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Description contains inappropriate content or potential security issues'
    );
  });

  it('flags script-injection content in examples', () => {
    const result = validateProblem({
      ...createValidProblem(),
      examples: [
        {
          input: '<script>alert(1)</script>',
          output: '[0,1]',
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Example 1 input contains inappropriate content or potential security issues'
    );
  });
});
