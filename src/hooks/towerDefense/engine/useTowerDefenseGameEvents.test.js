import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@rivie13/premium-core/sync', () => ({
  processGameEvent: vi.fn(),
}));

vi.mock('../../../utils/audio/AudioManager', () => ({
  default: {
    playSoundEffect: vi.fn(),
  },
}));

import { processGameEvent } from '@rivie13/premium-core/sync';
import audioManager from '../../../utils/audio/AudioManager';
import useTowerDefenseGameEvents from './useTowerDefenseGameEvents';

describe('useTowerDefenseGameEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces combat terminal events into batched summaries', () => {
    const addTerminalMessage = vi.fn();
    const livesRef = { current: 5 };

    const { result } = renderHook(() =>
      useTowerDefenseGameEvents({
        addTerminalMessage,
        totalWavesByDifficulty: 7,
        livesRef,
      })
    );

    act(() => {
      result.current.handleEnemySpawned({ enemy: { type: 'basic' } });
      result.current.handleEnemySpawned({ enemy: { type: 'edge' } });
      result.current.handleEnemyDefeated({ reward: 5, enemy: { type: 'basic' } });
      result.current.handleEnemyDefeated({ reward: 7, enemy: { type: 'complex' } });
      result.current.handleEnemyReachedEnd({ damage: 2 });
    });

    expect(addTerminalMessage).not.toHaveBeenCalled();
    expect(processGameEvent).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(180);
    });

    expect(addTerminalMessage).toHaveBeenCalledTimes(3);
    expect(addTerminalMessage).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('1 Security daemon, 1 Edge-case scanner deployed')
    );
    expect(addTerminalMessage).toHaveBeenNthCalledWith(
      2,
      '[BREACH] 2 security protocols neutralized. [12] databits extracted.'
    );
    expect(addTerminalMessage).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        '[ALERT] SYSTEM BREACH! 1 intrusion countermeasure bypassed defenses.'
      )
    );
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('enemy-defeated');
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('enemy-reach-end');
  });

  it('flushes pending combat events before wave completion messaging', () => {
    const addTerminalMessage = vi.fn();
    const livesRef = { current: 9 };

    const { result } = renderHook(() =>
      useTowerDefenseGameEvents({
        addTerminalMessage,
        totalWavesByDifficulty: 7,
        livesRef,
      })
    );

    act(() => {
      result.current.handleEnemyDefeated({ reward: 9, enemy: { type: 'basic' } });
      result.current.handleWaveComplete({ wave: 2, bonus: 40 });
    });

    expect(addTerminalMessage).toHaveBeenNthCalledWith(
      1,
      '[BREACH] Security protocol neutralized. [9] databits extracted.'
    );
    expect(addTerminalMessage).toHaveBeenNthCalledWith(
      2,
      '[SUCCESS] Wave 2 neutralized. System stability maintained. +40 databits extracted.'
    );
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('enemy-defeated');
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('wave-complete');
  });

  it('still delegates wave start events through the existing game event manager', () => {
    const addTerminalMessage = vi.fn();
    const livesRef = { current: 10 };

    const { result } = renderHook(() =>
      useTowerDefenseGameEvents({
        addTerminalMessage,
        totalWavesByDifficulty: 7,
        livesRef,
      })
    );

    act(() => {
      result.current.handleWaveStarted({ wave: 2, enemyCount: 8 });
    });

    expect(processGameEvent).toHaveBeenCalledWith(
      'wave-start',
      { wave: 2, enemyCount: 8 },
      { addTerminalMessage }
    );
  });
});

