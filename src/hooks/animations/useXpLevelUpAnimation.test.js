import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/audio/AudioManager', () => ({
  default: {
    playSoundEffect: vi.fn(),
  },
}));

import audioManager from '../../utils/audio/AudioManager';
import useXpLevelUpAnimation from './useXpLevelUpAnimation';

describe('useXpLevelUpAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays at defaults when closed or without XP data', () => {
    const { result } = renderHook(() => useXpLevelUpAnimation({ isOpen: false, hasXpData: false }));

    expect(result.current.animatedXpProgress).toBe(0);
    expect(result.current.showLevelUpCelebration).toBe(false);
    expect(result.current.animatedXpDisplay.toNext).toBe(0);
    expect(audioManager.playSoundEffect).not.toHaveBeenCalled();
  });

  it('animates non-level-up path and plays progress sound', () => {
    const { result } = renderHook(() =>
      useXpLevelUpAnimation({
        isOpen: true,
        hasXpData: true,
        hasLevelUp: false,
        xpProgress: 65,
        xpGained: 12,
        newLevel: 4,
        newRoleName: 'Debugger',
        currentXpIntoLevel: 40,
        currentXpToNextLevel: 100,
      })
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.animatedXpProgress).toBe(65);
    expect(result.current.displayLevel).toBe(4);
    expect(result.current.displayRoleName).toBe('Debugger');
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('progress-bar');
  });

  it('runs full level-up choreography with sounds and final state', () => {
    const { result } = renderHook(() =>
      useXpLevelUpAnimation({
        isOpen: true,
        hasXpData: true,
        hasLevelUp: true,
        previousXpProgress: 35,
        xpProgress: 22,
        previousLevel: 2,
        newLevel: 3,
        previousRoleName: 'Greenhorn',
        newRoleName: 'Script Kiddie',
        previousXpIntoLevel: 50,
        previousXpToNextLevel: 100,
        currentXpIntoLevel: 22,
        currentXpToNextLevel: 150,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    const played = audioManager.playSoundEffect.mock.calls.map(([name]) => name);
    expect(played).toContain('progress-bar');
    expect(played).toContain('level-up-begin');
    expect(played).toContain('level-up-thud');

    expect(result.current.displayLevel).toBe(3);
    expect(result.current.displayRoleName).toBe('Script Kiddie');
    expect(result.current.showLevelUpCelebration).toBe(true);
    expect(result.current.xpDisplayMode).toBe('current');
    expect(result.current.animatedXpProgress).toBe(22);
    expect(result.current.barFlashActive).toBe(false);
    expect(result.current.barShakeActive).toBe(false);
  });

  it('skips sound effects when reduced motion is enabled', () => {
    renderHook(() =>
      useXpLevelUpAnimation({
        isOpen: true,
        hasXpData: true,
        hasLevelUp: true,
        prefersReducedMotion: true,
        previousXpProgress: 40,
        xpProgress: 15,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(audioManager.playSoundEffect).not.toHaveBeenCalled();
  });
});
