import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import useTowerDefenseV2DerivedState from './useTowerDefenseV2DerivedState';

const baseGameState = {
  status: 'ready',
  wave: 1,
  totalWaves: 2,
};

describe('useTowerDefenseV2DerivedState simple demo', () => {
  it('shows START WAVE on ready wave 1 with no code or towers placed', () => {
    const { result } = renderHook(() =>
      useTowerDefenseV2DerivedState({
        gameState: baseGameState,
        initialCodeGenerated: false,
        functionTowerPlaced: false,
        objectTowerPlaced: false,
        coreTowerRequirements: { function: true, object: true },
        sharedUnlockActive: false,
        totalWavesByDifficulty: 2,
        isSimpleDemo: true,
      })
    );

    expect(result.current.effectiveInitialCodeGenerated).toBe(true);
    expect(result.current.showStartWaveButton).toBe(true);
  });

  it('hides verification controls until right before the final wave', () => {
    const base = {
      initialCodeGenerated: false,
      functionTowerPlaced: false,
      objectTowerPlaced: false,
      coreTowerRequirements: { function: true, object: true },
      sharedUnlockActive: false,
      totalWavesByDifficulty: 2,
      isSimpleDemo: true,
    };

    const onLoad = renderHook(() =>
      useTowerDefenseV2DerivedState({
        ...base,
        gameState: { status: 'ready', wave: 1, totalWaves: 2 },
      })
    );
    expect(onLoad.result.current.shouldShowVerificationControls).toBe(false);

    const midWave = renderHook(() =>
      useTowerDefenseV2DerivedState({
        ...base,
        gameState: { status: 'playing', wave: 1, totalWaves: 2 },
      })
    );
    expect(midWave.result.current.shouldShowVerificationControls).toBe(false);

    const waveComplete = renderHook(() =>
      useTowerDefenseV2DerivedState({
        ...base,
        gameState: { status: 'wave-complete', wave: 1, totalWaves: 2 },
      })
    );
    expect(waveComplete.result.current.shouldShowVerificationControls).toBe(true);

    const finalReady = renderHook(() =>
      useTowerDefenseV2DerivedState({
        ...base,
        gameState: { status: 'ready', wave: 2, totalWaves: 2 },
      })
    );
    expect(finalReady.result.current.shouldShowVerificationControls).toBe(true);
  });

  it('keeps the tower/code gate for the normal game', () => {
    const { result } = renderHook(() =>
      useTowerDefenseV2DerivedState({
        gameState: baseGameState,
        initialCodeGenerated: false,
        functionTowerPlaced: false,
        objectTowerPlaced: false,
        coreTowerRequirements: { function: true, object: true },
        sharedUnlockActive: false,
        totalWavesByDifficulty: 2,
      })
    );

    expect(result.current.showStartWaveButton).toBe(false);
    expect(result.current.shouldShowVerificationControls).toBe(false);
  });
});
