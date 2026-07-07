import { beforeEach, describe, expect, it, vi } from 'vitest';

import { continueAfterFailedStep, generateStep, parseEscapeSequences } from './generationHelpers';

vi.mock('../../../utils/core/logger', () => ({
  default: {
    debug: vi.fn(),
  },
}));

const createStepStatusStore = (initial = {}) => {
  let state = initial;
  const history = [];
  const setStepStatus = vi.fn((updater) => {
    state = typeof updater === 'function' ? updater(state) : updater;
    history.push(state);
  });
  return { setStepStatus, history, getState: () => state };
};

const createGeneratedStore = (initial = {}) => {
  let state = initial;
  const setGeneratedProblem = vi.fn((updater) => {
    state = typeof updater === 'function' ? updater(state) : updater;
  });
  return { setGeneratedProblem, getState: () => state };
};

describe('generationHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('marks failed steps as skipped and notifies continuation', () => {
    const store = createStepStatusStore({
      title: { status: 'failed', retryCount: 2 },
      description: { status: 'pending', retryCount: 0 },
    });
    const toast = vi.fn();
    toast.closeAll = vi.fn();

    const result = continueAfterFailedStep(store.setStepStatus, toast, 'title', 'description');

    expect(result).toEqual({});
    expect(store.getState().title).toEqual(
      expect.objectContaining({
        status: 'skipped',
        retryCount: 2,
      })
    );
    expect(toast.closeAll).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Continuing without title',
        status: 'info',
      })
    );
  });

  it('parses escape sequences into displayable strings', () => {
    expect(parseEscapeSequences('line1\\nline2\\t\\"quoted\\"')).toBe('line1\nline2\t"quoted"');
    expect(parseEscapeSequences('')).toBe('');
    expect(parseEscapeSequences(null)).toBe('');
  });

  it('generates a step successfully and updates loading -> completed status', async () => {
    const store = createStepStatusStore({
      title: { status: 'pending', retryCount: 0 },
    });
    const generated = createGeneratedStore();
    const api = {
      aiProblems: {
        generate: vi.fn().mockResolvedValue({ title: 'Generated Title' }),
      },
    };

    const result = await generateStep({
      step: 'title',
      api,
      setStepStatus: store.setStepStatus,
      setGeneratedProblem: generated.setGeneratedProblem,
      previousData: { problemType: 'array' },
      difficultyLevel: 3,
      language: 'python',
      aiModel: 'gpt-4o',
      userId: 'u-1',
      wackiness: 2,
      additionalInfo: '',
      generationId: 1,
      currentGenerationIdRef: { current: 1 },
      toast: vi.fn(),
      regenerateSpecificStep: vi.fn(),
      onRateLimit: vi.fn(),
    });

    expect(result).toEqual({ title: 'Generated Title' });
    expect(api.aiProblems.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'title',
        problemType: 'array',
        difficulty: 3,
        language: 'python',
      })
    );
    expect(store.history.map((snapshot) => snapshot.title?.status).filter(Boolean)).toEqual([
      'loading',
      'completed',
    ]);
    expect(generated.getState()).toEqual({ title: 'Generated Title' });
  });

  it('handles showAd rate-limit payloads by notifying and retrying once', async () => {
    vi.useFakeTimers();
    const store = createStepStatusStore({
      title: { status: 'pending', retryCount: 0 },
    });
    const generated = createGeneratedStore();
    const onRateLimit = vi.fn();
    const api = {
      aiProblems: {
        generate: vi
          .fn()
          .mockResolvedValueOnce({
            showAd: true,
            message: 'Limit reached',
            rateLimit: { remaining: 0 },
          })
          .mockResolvedValueOnce({ title: 'Recovered after ad prompt' }),
      },
    };

    const promise = generateStep({
      step: 'title',
      api,
      setStepStatus: store.setStepStatus,
      setGeneratedProblem: generated.setGeneratedProblem,
      previousData: { problemType: 'array' },
      difficultyLevel: 3,
      language: 'python',
      aiModel: 'gpt-4o',
      userId: 'u-1',
      wackiness: 2,
      additionalInfo: '',
      generationId: 1,
      currentGenerationIdRef: { current: 1 },
      toast: vi.fn(),
      regenerateSpecificStep: vi.fn(),
      onRateLimit,
    });

    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toEqual({ title: 'Recovered after ad prompt' });
    expect(onRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        showAd: true,
      })
    );
    expect(store.history.map((snapshot) => snapshot.title?.status).filter(Boolean)).toEqual([
      'loading',
      'retrying',
      'completed',
    ]);
  });

  it('returns partial results when API marks the step with an embedded error payload', async () => {
    const store = createStepStatusStore({
      examples: { status: 'pending', retryCount: 0 },
    });
    const generated = createGeneratedStore();
    const api = {
      aiProblems: {
        generate: vi.fn().mockResolvedValue({
          error: true,
          errorMessage: 'example generation partially failed',
          examples: [{ input: [1], output: 1 }],
        }),
      },
    };

    const result = await generateStep({
      step: 'examples',
      api,
      setStepStatus: store.setStepStatus,
      setGeneratedProblem: generated.setGeneratedProblem,
      previousData: { problemType: 'array' },
      difficultyLevel: 5,
      language: 'python',
      aiModel: 'gpt-4o',
      userId: 'u-1',
      wackiness: 2,
      additionalInfo: '',
      generationId: 1,
      currentGenerationIdRef: { current: 1 },
      toast: vi.fn(),
      regenerateSpecificStep: vi.fn(),
      onRateLimit: vi.fn(),
    });

    expect(result).toEqual(
      expect.objectContaining({
        error: true,
        examples: [{ input: [1], output: 1 }],
      })
    );
    expect(generated.getState()).toEqual(
      expect.objectContaining({
        examples: [{ input: [1], output: 1 }],
      })
    );
    expect(store.history[0].examples.status).toBe('loading');
  });

  it('cancels generation when generation IDs no longer match', async () => {
    const store = createStepStatusStore({
      title: { status: 'pending', retryCount: 0 },
    });
    const generated = createGeneratedStore();
    const api = {
      aiProblems: {
        generate: vi.fn(),
      },
    };

    await expect(
      generateStep({
        step: 'title',
        api,
        setStepStatus: store.setStepStatus,
        setGeneratedProblem: generated.setGeneratedProblem,
        previousData: { problemType: 'array' },
        difficultyLevel: 3,
        language: 'python',
        aiModel: 'gpt-4o',
        userId: 'u-1',
        wackiness: 2,
        additionalInfo: '',
        generationId: 1,
        currentGenerationIdRef: { current: 2 },
        toast: vi.fn(),
        regenerateSpecificStep: vi.fn(),
        onRateLimit: vi.fn(),
      })
    ).rejects.toThrow('Generation canceled');

    expect(api.aiProblems.generate).not.toHaveBeenCalled();
  });
});
