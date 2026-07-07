/**
 * Tower Defense V2 - Ref Sync
 */

import { useEffect } from 'react';

import { GAME_STATUS } from '../../../../../game-engine-v2';

export default function useTowerDefenseV2RefSync({
  gameState,
  livesRef,
  creditsRef,
  waveRef,
  scoreSubmittedRef,
  endlessScoreSubmittedRef,
  victoryOutputAppliedRef
}) {
  useEffect(() => {
    livesRef.current = gameState.lives;
    creditsRef.current = gameState.credits;
    waveRef.current = gameState.wave;
  }, [creditsRef, gameState.credits, gameState.lives, gameState.wave, livesRef, waveRef]);

  useEffect(() => {
    if (gameState.status === GAME_STATUS.PREHACK) {
      scoreSubmittedRef.current = false;
      endlessScoreSubmittedRef.current = false;
      victoryOutputAppliedRef.current = false;
    }
  }, [endlessScoreSubmittedRef, gameState.status, scoreSubmittedRef, victoryOutputAppliedRef]);
}
