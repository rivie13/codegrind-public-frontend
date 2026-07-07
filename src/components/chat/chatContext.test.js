import { describe, expect, it } from 'vitest';

import { buildProblemChatContext, buildTowerDefenseChatContext } from './chatContext';

describe('chatContext builders', () => {
  it('builds context when problemId is missing but page problem context exists', () => {
    const problemContext = buildProblemChatContext({
      problemId: null,
      draftProblem: {
        title: 'Two Sum',
        titleSlug: 'two-sum',
      },
      code: 'print("ok")',
      messages: [],
    });

    const tdContext = buildTowerDefenseChatContext({
      problemId: null,
      problem: {
        title: 'Tower Intro',
        titleSlug: 'tower-intro',
      },
      messages: [],
    });

    expect(problemContext.problem.title).toBe('Two Sum');
    expect(problemContext.problemId).toBe('two-sum');
    expect(tdContext.problem.title).toBe('Tower Intro');
    expect(tdContext.problemId).toBe('tower-intro');
  });

  it('builds sanitized problem chat context with filtered history and execution errors', () => {
    const context = buildProblemChatContext({
      problemId: '42',
      draftProblem: {
        title: 'Two Sum',
        titleSlug: 'two-sum',
        difficulty: 'easy',
        description: '<p>Solve this attack scenario</p>',
        constraints: '<strong>No exploit attempts</strong>',
        examples: ['<div>[1,2,3]</div>', '<span>target=4</span>'],
        functionName: 'twoSum',
        functionParams: [
          { name: 'nums', type: 'number[]' },
          { name: 'target', type: 'number' },
        ],
        returnType: 'number[]',
        referenceName: 'Two Sum',
      },
      code: 'print("ok")',
      executionResult: [
        'Test case details:',
        'Test Case Failed',
        'Input: [1,2,3]',
        'Expected Output: [4]',
        'Actual Output: [3]',
        'Message: mismatch',
        '------------------',
        'Runtime Error: index out of range',
      ].join('\n'),
      messages: [
        { id: 'intro', content: 'Welcome', isAi: true },
        { id: '1', content: 'first', isAi: false },
        { id: '2', content: 'second', isAi: true },
        { id: '3', content: 'third', isAi: false },
        { id: '4', content: 'fourth', isAi: true },
        { id: '5', content: 'fifth', isAi: false },
        { id: '6', content: 'sixth', isAi: true },
        { id: '7', content: 'seventh', isAi: false },
        { id: 'thinking', content: '...', isThinking: true },
        { id: 'err', content: 'oops', isError: true },
      ],
    });

    expect(context.problem.title).toBe('Two Sum');
    expect(context.problem.description).toContain('Solve this [redacted] scenario');
    expect(context.problem.description).toContain('Constraints: No [redacted] attempts');
    expect(context.problem.description).toContain('Examples: [1,2,3] | target=4');
    expect(context.problemMetadata.functionName).toBe('twoSum');
    expect(context.problemMetadata.inputSpec).toContain('nums: number[]');
    expect(context.problemMetadata.outputSpec).toBe('number[]');
    expect(context.problemMetadata.canonicalName).toBe('Two Sum');

    expect(context.terminalErrors).toContain('Test Case Failed');
    expect(context.terminalErrors).toContain('Runtime Error: index out of range');
    expect(context.terminalOutputRaw).toContain('Test Case Failed');
    expect(context.chatHistory).toHaveLength(6);
    expect(context.chatHistory.map((msg) => msg.content)).toEqual([
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth',
      'seventh',
    ]);
    expect(context.codeWrapped).toContain('[USER_CODE_START]');
  });

  it('builds tower-defense context with failed-test extraction from terminal output', () => {
    const context = buildTowerDefenseChatContext({
      problemId: 'td-1',
      problem: {
        title: 'Tower Intro',
        titleSlug: 'tower-intro',
        constraints: '<div>Use no exploit path.</div>',
        metadata: {
          functionName: 'defendLane',
          functionParams: [{ name: 'lane', type: 'number[]' }],
          returnType: 'number',
          referenceSlug: 'maximum-subarray',
        },
      },
      problemDescription: '<div>Do not attack friendly nodes.</div>',
      language: 'python',
      code: 'def solve():\n  pass',
      terminalOutput: [
        '[TEST 1] FAILED',
        'Input: [1]',
        'Expected Output: [2]',
        'Actual Output: [1]',
        '------------------',
        '[ERROR] transport message',
        'Error: runtime exploded',
      ].join('\n'),
      messages: [
        { id: '1', content: 'Need help', isAi: false },
        { id: '2', content: 'Try improving range', isAi: true },
      ],
    });

    expect(context.problem.title).toBe('Tower Intro');
    expect(context.problem.description).toContain('Do not [redacted] friendly nodes.');
    expect(context.problem.description).toContain('Constraints: Use no [redacted] path.');
    expect(context.problemMetadata.functionName).toBe('defendLane');
    expect(context.problemMetadata.inputSpec).toContain('lane: number[]');
    expect(context.problemMetadata.outputSpec).toBe('number');
    expect(context.problemMetadata.canonicalName).toBe('maximum-subarray');
    expect(context.terminalErrors).toContain('[TEST 1] FAILED');
    expect(context.terminalErrors).toContain('Expected Output: [2]');
    expect(context.terminalErrors).toContain('Error: runtime exploded');
    expect(context.terminalErrors).not.toContain('[ERROR] transport message');
    expect(context.terminalOutputRaw).toContain('[ERROR] transport message');
    expect(context.language).toBe('python');
  });
});
