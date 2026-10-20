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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps combat terminal-silent while preserving combat sounds', () => {
    const addTerminalMessage = vi.fn();

    const { result } = renderHook(() =>
      useTowerDefenseGameEvents({
        addTerminalMessage,
        totalWavesByDifficulty: 7,
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
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('enemy-defeated');
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('enemy-reach-end');
  });

  it('prints one wave-complete line with no combat spam', () => {
    const addTerminalMessage = vi.fn();

    const { result } = renderHook(() =>
      useTowerDefenseGameEvents({
        addTerminalMessage,
        totalWavesByDifficulty: 7,
      })
    );

    act(() => {
      result.current.handleEnemyDefeated({ reward: 9, enemy: { type: 'basic' } });
      result.current.handleWaveComplete({ wave: 2, bonus: 40 });
    });

    expect(addTerminalMessage).toHaveBeenCalledTimes(1);
    expect(addTerminalMessage).toHaveBeenCalledWith(
      '[SUCCESS] Wave 2 neutralized. System stability maintained. +40 databits extracted.'
    );
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('enemy-defeated');
    expect(audioManager.playSoundEffect).toHaveBeenCalledWith('wave-complete');
  });

  it('still delegates wave start events through the existing game event manager', () => {
    const addTerminalMessage = vi.fn();

    const { result } = renderHook(() =>
      useTowerDefenseGameEvents({
        addTerminalMessage,
        totalWavesByDifficulty: 7,
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
