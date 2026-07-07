import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockToast = vi.hoisted(() => {
  const fn = vi.fn();
  fn.isActive = vi.fn(() => false);
  return fn;
});

vi.mock('@chakra-ui/react', () => ({
  useToast: () => mockToast,
}));

import useTowerDefenseCodeActions from './useTowerDefenseCodeActions';

const createBaseProps = (overrides = {}) => ({
  addTerminalMessage: vi.fn(),
  api: {
    towerDefense: {
      refineSolution: vi.fn().mockResolvedValue({ refinedCode: 'print(1)' }),
    },
  },
  canRefineSolution: true,
  code: 'print(1)',
  initialCodeGenerated: true,
  isDemo: false,
  isRefining: false,
  language: 'python',
  onSettingsLock: vi.fn(),
  problem: { id: 1, titleSlug: 'two-sum' },
  runCodeTests: vi.fn().mockResolvedValue(true),
  runCodeOutput: vi.fn().mockResolvedValue({ response: { formatted: { testCases: [] } } }),
  setCode: vi.fn(),
  setCodeSubmitted: vi.fn(),
  setCodeSubmissionSuccess: vi.fn(),
  setVerifyAttemptInProgress: vi.fn(),
  setIsExecuting: vi.fn(),
  setIsRefining: vi.fn(),
  setRefinementLimitReached: vi.fn(),
  setShowAdModal: vi.fn(),
  startEndlessMode: vi.fn(),
  startEngineWave: vi.fn(),
  submitSolution: vi.fn().mockResolvedValue(true),
  notifySolutionSuccess: vi.fn(),
  coreTowerRequirements: { function: true, object: true },
  ...overrides,
});

describe('useTowerDefenseCodeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.isActive.mockReturnValue(false);
  });

  it('shows a warning toast when test execution times out', async () => {
    const props = createBaseProps({
      runCodeTests: vi.fn().mockResolvedValue('vm_timeout'),
    });

    const { result } = renderHook(() => useTowerDefenseCodeActions(props));

    await act(async () => {
      await result.current.handleRunCode();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'td-code-execution-unavailable',
        title: 'Code execution unavailable',
        status: 'warning',
      })
    );
  });

  it('shows a warning toast when output capture throws', async () => {
    const props = createBaseProps({
      runCodeOutput: vi.fn().mockRejectedValue(new Error('network')),
    });

    const { result } = renderHook(() => useTowerDefenseCodeActions(props));

    await act(async () => {
      await result.current.handleRunCodeOutput();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'td-code-execution-unavailable',
        title: 'Code execution unavailable',
        status: 'warning',
      })
    );
  });

  it('shows a warning toast when refinement fails without a refined solution', async () => {
    const props = createBaseProps({
      api: {
        towerDefense: {
          refineSolution: vi.fn().mockResolvedValue({}),
        },
      },
    });

    const { result } = renderHook(() => useTowerDefenseCodeActions(props));

    await act(async () => {
      await result.current.handleRefineSolution();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'td-refinement-unavailable',
        title: 'Refinement unavailable',
        status: 'warning',
      })
    );
  });

  it('marks verify attempt in progress while verification request is running', async () => {
    const props = createBaseProps({
      submitSolution: vi.fn().mockResolvedValue(true),
    });

    const { result } = renderHook(() => useTowerDefenseCodeActions(props));

    await act(async () => {
      await result.current.handleSubmitSolution();
    });

    expect(props.setVerifyAttemptInProgress).toHaveBeenNthCalledWith(1, true);
    expect(props.setVerifyAttemptInProgress).toHaveBeenLastCalledWith(false);
  });
});
