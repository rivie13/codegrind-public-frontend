import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: mockLogger,
}));

import useChallengeState from './useChallengeState';

const baseOptions = () => ({
  challenges: [],
  mode: 'practice',
  problemData: { difficulty: 'EASY' },
  setMatrixBombActive: vi.fn(),
  setShouldAddRandomChars: vi.fn(),
  setFreshTimer: vi.fn(),
  startTimer: vi.fn(),
  stopTimer: vi.fn(),
  timer: 120,
  setExecutionResult: vi.fn(),
});

describe('useChallengeState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps default state in practice mode', () => {
    const opts = baseOptions();
    const { result } = renderHook(() => useChallengeState(opts));

    expect(result.current.challengeState).toEqual({
      isTimerRunning: false,
      isAIDisabled: false,
      hasRandomChars: false,
      hasMatrixBomb: false,
      isTimeAttack: false,
      isAutoTimer: false,
    });
    expect(opts.setMatrixBombActive).not.toHaveBeenCalled();
    expect(opts.startTimer).not.toHaveBeenCalled();
    expect(opts.setFreshTimer).not.toHaveBeenCalled();
  });

  it('initializes challenge flags and challenge side effects', async () => {
    const opts = baseOptions();
    opts.mode = 'challenge';
    opts.challenges = ['autoTimer', 'noAI', 'randomChars', 'matrixBomb', 'timeAttack'];
    opts.problemData = { difficulty: 'MEDIUM' };

    const { result, unmount } = renderHook(() => useChallengeState(opts));

    await waitFor(() => {
      expect(result.current.challengeState).toMatchObject({
        isTimerRunning: true,
        isAIDisabled: true,
        hasRandomChars: true,
        hasMatrixBomb: true,
        isTimeAttack: true,
        isAutoTimer: true,
      });
    });

    expect(opts.setMatrixBombActive).toHaveBeenCalledWith(true);
    expect(opts.startTimer).toHaveBeenCalledTimes(2);
    expect(opts.setFreshTimer).toHaveBeenCalledWith(1800, true);
    expect(opts.setShouldAddRandomChars).toHaveBeenCalledWith(true);

    unmount();
    expect(opts.setShouldAddRandomChars).toHaveBeenCalledWith(false);
  });

  it('turns matrix bomb off when matrixBomb challenge is absent', async () => {
    const opts = baseOptions();
    opts.mode = 'challenge';
    opts.challenges = ['noAI'];

    const { result } = renderHook(() => useChallengeState(opts));

    await waitFor(() => {
      expect(result.current.challengeState).toMatchObject({
        isAIDisabled: true,
        hasMatrixBomb: false,
      });
    });

    expect(opts.setMatrixBombActive).toHaveBeenCalledWith(false);
    expect(opts.startTimer).not.toHaveBeenCalled();
  });

  it('stops timer and resets time attack when timer reaches zero', async () => {
    const opts = baseOptions();
    opts.mode = 'challenge';
    opts.challenges = ['timeAttack'];
    opts.problemData = { difficulty: 'EASY' };
    opts.timer = 0;

    renderHook(() => useChallengeState(opts));

    await waitFor(() => {
      expect(opts.stopTimer).toHaveBeenCalledTimes(1);
    });

    expect(opts.setExecutionResult).toHaveBeenCalledWith("Time Attack: Time's up! Try again.");
    expect(opts.setFreshTimer).toHaveBeenCalledTimes(2);
    expect(opts.setFreshTimer).toHaveBeenCalledWith(900, true);
    expect(opts.startTimer).toHaveBeenCalledTimes(1);
  });

  it('early-returns random-char effect when setter is not provided', async () => {
    const opts = baseOptions();
    opts.mode = 'challenge';
    opts.challenges = ['randomChars'];
    opts.setShouldAddRandomChars = undefined;

    const { result } = renderHook(() => useChallengeState(opts));

    await waitFor(() => {
      expect(result.current.challengeState.hasRandomChars).toBe(true);
    });

    expect(opts.setMatrixBombActive).toHaveBeenCalledWith(false);
  });
});
