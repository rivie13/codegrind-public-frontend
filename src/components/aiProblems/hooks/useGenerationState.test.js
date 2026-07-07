import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useGenerationState from './useGenerationState';
import { generateStep } from '../utils/generationHelpers';
import { unwrapTestCasesArray } from '../utils/formatters';

vi.mock('../../../services/api', () => ({ api: {} }));

vi.mock('../utils/generationHelpers', () => ({
  generateStep: vi.fn(),
}));

vi.mock('../utils/formatters', () => ({
  unwrapTestCasesArray: vi.fn((value) => value),
}));

const createMockApi = () => ({
  aiProblems: {
    getRateLimitStatus: vi.fn().mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 3,
        totalRemaining: 3,
        adCooldownRemaining: 0,
      },
    }),
    addGenerationCredit: vi.fn().mockResolvedValue({
      creditsEarned: 3,
      rateLimit: {
        unlimited: false,
        remaining: 2,
        totalRemaining: 2,
        adCooldownRemaining: 0,
      },
    }),
    saveProblem: vi.fn().mockResolvedValue({
      problem: { displayNumber: '77' },
      xp: { summary: { total: 10 }, awards: [{ id: 'xp' }], levelUp: null },
    }),
    generate: vi.fn(),
    clearAllTempProblems: vi.fn().mockResolvedValue({}),
  },
});

const renderGenerationHook = (overrides = {}) => {
  const api = overrides.api ?? createMockApi();
  const toast = overrides.toast ?? vi.fn();
  const user = overrides.user ?? { id: 'user-1', membershipTier: 'FREE' };

  const hook = renderHook(() =>
    useGenerationState({
      api,
      user,
      toast,
      problemViewRef: { current: null },
    })
  );

  return { ...hook, api, toast };
};

describe('useGenerationState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts without a hardcoded AI model so the backend default can populate the selector', async () => {
    const { result, api } = renderGenerationHook();

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    expect(result.current.aiModel).toBe('');
  });

  it('shows a warning toast when generator status refresh fails', async () => {
    const api = createMockApi();
    api.aiProblems.getRateLimitStatus.mockRejectedValueOnce(new Error('network'));

    const { toast } = renderGenerationHook({ api });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ai-generation-status-unavailable',
          title: 'Generator status unavailable',
          status: 'warning',
        })
      );
    });
  });

  it('opens the generation ad modal when preflight credits are exhausted', async () => {
    const api = createMockApi();
    api.aiProblems.getRateLimitStatus.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 0,
        totalRemaining: 0,
        adCooldownRemaining: 0,
      },
    });

    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(generateStep).not.toHaveBeenCalled();
    expect(result.current.showGenerationAdModal).toBe(true);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Generation Limit Reached',
        status: 'warning',
      })
    );
  });

  it('runs all generation steps and stores merged output data', async () => {
    const api = createMockApi();

    generateStep.mockImplementation(async ({ step }) => {
      const byStep = {
        title: { title: 'Binary Search Drill' },
        description: { description: 'Find target quickly.' },
        functionName: { functionName: 'solve' },
        functionParams: { functionParams: ['nums', 'target'] },
        testCases: { testCases: [[1, 2, 3]] },
        expectedOutputs: { expectedOutputs: [2] },
        examples: { examples: [{ input: [1, 2, 3], output: 2 }] },
        codeSnippets: { snippets: { python: 'def solve(nums, target):\n    return -1' } },
        constraints: { constraints: ['1 <= n <= 1e5'] },
        solution: { solution: 'def solve(nums, target):\n    return 2' },
      };
      return byStep[step] ?? {};
    });

    const { result } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setProblemType('array');
      result.current.setDifficultyLevel(6);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    expect(generateStep).toHaveBeenCalledTimes(10);
    expect(result.current.generatedProblem.title).toBe('Binary Search Drill');
    expect(result.current.generatedProblem.functionName).toBe('solve');
    expect(result.current.generatedProblem.solution).toContain('return 2');
    expect(unwrapTestCasesArray).toHaveBeenCalledWith([[1, 2, 3]]);
    expect(unwrapTestCasesArray).toHaveBeenCalledWith([2]);
  });

  it('saves generated problems with normalized payload shape', async () => {
    const api = createMockApi();
    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setGeneratedProblem({
        title: 'Two Sum II',
        difficulty: 5,
        snippets: { python: 'def solve(nums, target):\n    return []' },
        examples: [{ input: [2, 7], output: [0, 1] }],
        testCases: [[2, 7]],
        expectedOutputs: [[0, 1]],
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(api.aiProblems.saveProblem).toHaveBeenCalledTimes(1);
    const payload = api.aiProblems.saveProblem.mock.calls[0][0];
    expect(payload.titleSlug).toBe('two-sum-ii');
    expect(payload.difficulty).toBe('MEDIUM');
    expect(payload.codeSnippets).toEqual({ python: 'def solve(nums, target):\n    return []' });
    expect(payload).not.toHaveProperty('snippets');
    expect(result.current.showSaveOptions).toBe(true);
    expect(result.current.savedProblemSlug).toBe('two-sum-ii');
    expect(result.current.problemNumber).toBe('77');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Problem Saved',
        status: 'success',
      })
    );
  });

  it('prevents ad completion while cooldown is active', async () => {
    const api = createMockApi();
    api.aiProblems.getRateLimitStatus.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 0,
        totalRemaining: 0,
        adCooldownRemaining: 180,
      },
    });

    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      await result.current.handleGenerate();
    });

    await act(async () => {
      await result.current.handleGenerationAdComplete();
    });

    expect(api.aiProblems.addGenerationCredit).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ad Cooldown Active',
      })
    );
  });

  it('adds generation credits after ad completion when cooldown is clear', async () => {
    const api = createMockApi();
    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setShowGenerationAdModal(true);
      result.current.setSelectedGenerationAdType('long');
    });

    await act(async () => {
      await result.current.handleGenerationAdComplete();
    });

    expect(api.aiProblems.addGenerationCredit).toHaveBeenCalledWith('long');
    expect(result.current.showGenerationAdModal).toBe(false);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Credits Added',
        status: 'success',
      })
    );
  });

  it('resets generated state even when backend cache clear fails', async () => {
    const api = createMockApi();
    api.aiProblems.clearAllTempProblems.mockRejectedValueOnce(new Error('network'));

    const { result } = renderGenerationHook({ api });

    await act(async () => {
      result.current.setGeneratedProblem({ title: 'Temp problem' });
      result.current.setTestResults({ passed: false });
      result.current.setTestError('err');
      result.current.setIsRunningTest(true);
    });

    await act(async () => {
      await result.current.handleReset();
    });

    expect(result.current.generatedProblem).toEqual({});
    expect(result.current.testResults).toBeNull();
    expect(result.current.testError).toBeNull();
    expect(result.current.isRunningTest).toBe(false);
    expect(result.current.isGenerating).toBe(false);
  });

  it('regenerates solution content and updates generated problem state', async () => {
    const api = createMockApi();
    api.aiProblems.generate.mockResolvedValueOnce({
      solution: 'def solve(nums):\n    return nums[0]',
    });

    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setGeneratedProblem({
        problemType: 'array',
        difficulty: 4,
        title: 'Array Intro',
        description: 'Pick first value.',
        functionName: 'solve',
        functionParams: ['nums'],
        testCases: [[1, 2, 3]],
        expectedOutputs: [1],
        solution: 'old',
      });
    });

    await act(async () => {
      await result.current.handleRegenerateSolution();
    });

    expect(api.aiProblems.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'solution',
        previousData: expect.objectContaining({
          title: 'Array Intro',
          functionName: 'solve',
        }),
      })
    );
    expect(result.current.generatedProblem.solution).toContain('return nums[0]');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Solution Regenerated',
        status: 'success',
      })
    );
  });

  it('reports regeneration errors when solution regeneration fails', async () => {
    const api = createMockApi();
    api.aiProblems.generate.mockRejectedValueOnce(new Error('service unavailable'));

    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setGeneratedProblem({
        problemType: 'array',
        difficulty: 4,
        title: 'Array Intro',
      });
    });

    await act(async () => {
      await result.current.handleRegenerateSolution();
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Regeneration Failed',
        status: 'error',
      })
    );
    expect(result.current.isRegeneratingSolution).toBe(false);
  });

  it('blocks example regeneration when test cases are missing', async () => {
    const api = createMockApi();
    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setGeneratedProblem({
        title: 'Needs tests',
      });
    });

    await act(async () => {
      await result.current.handleRegenerateExamples();
    });

    expect(api.aiProblems.generate).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cannot regenerate examples',
        status: 'error',
      })
    );
  });

  it('regenerates examples with current test context', async () => {
    const api = createMockApi();
    api.aiProblems.generate.mockResolvedValueOnce({
      examples: [{ input: [1, 2, 3], output: 1 }],
    });

    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setGeneratedProblem({
        problemType: 'array',
        difficulty: 4,
        title: 'Array Intro',
        description: 'Pick first value.',
        functionName: 'solve',
        functionParams: ['nums'],
        testCases: [[1, 2, 3]],
        expectedOutputs: [1],
      });
    });

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    await act(async () => {
      await result.current.handleRegenerateExamples();
    });

    expect(api.aiProblems.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'examples',
        previousData: expect.objectContaining({
          functionName: 'solve',
        }),
      })
    );
    expect(result.current.generatedProblem.examples).toEqual([{ input: [1, 2, 3], output: 1 }]);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Examples Regenerated',
        status: 'success',
      })
    );
    textarea.remove();
  });

  it('shows ad-credit failure toast when generation credit API fails', async () => {
    const api = createMockApi();
    api.aiProblems.addGenerationCredit.mockRejectedValueOnce(new Error('ad credit failed'));

    const { result, toast } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setShowGenerationAdModal(true);
    });

    await act(async () => {
      await result.current.handleGenerationAdComplete();
    });

    expect(api.aiProblems.addGenerationCredit).toHaveBeenCalled();
    expect(result.current.isProcessingGenerationAd).toBe(false);
    expect(result.current.showGenerationAdModal).toBe(true);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ad Credit Failed',
        status: 'error',
      })
    );
  });

  it('returns false on rate-limit errors while regenerating a specific step', async () => {
    const api = createMockApi();
    const rateLimitError = new Error('limit');
    rateLimitError.name = 'RateLimitError';
    generateStep.mockRejectedValueOnce(rateLimitError);

    const { result } = renderGenerationHook({ api });

    await waitFor(() => expect(api.aiProblems.getRateLimitStatus).toHaveBeenCalled());

    await act(async () => {
      result.current.setIsGenerating(true);
    });

    let stepResult;
    await act(async () => {
      stepResult = await result.current.regenerateSpecificStep('description');
    });

    expect(stepResult).toBe(false);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isRegeneratingDescription).toBe(false);
  });
});
