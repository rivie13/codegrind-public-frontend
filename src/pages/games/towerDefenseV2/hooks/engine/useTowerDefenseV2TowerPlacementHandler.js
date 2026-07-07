import { useCallback } from 'react';

import { processGameEvent } from '@rivie13/premium-core/sync';
import CodeSnippetManager from '@rivie13/premium-core/sync/towerDefense/CodeSnippetManager';

export default function useTowerDefenseV2TowerPlacementHandler({
  addTerminalMessage,
  functionTowerPlaced,
  objectTowerPlaced,
  initialCodeGenerated,
  effectiveInitialCodeGenerated,
  isLearningMode,
  learningUnlockActive,
  setFunctionTowerPlaced,
  setObjectTowerPlaced,
  setInitialCodeGenerated,
  setCode,
  code,
  addTowerCodeSnippet,
  getCodeSnippetForLanguage,
  language,
  problem,
  coreTowerRequirements,
  waveRef,
  isHomepageDemo,
}) {
  return useCallback(
    ({ towerType, position, placementSource }) => {
      processGameEvent(
        'tower-placed',
        {
          towerType,
          position,
          placementSource,
        },
        {
          addTerminalMessage,
          functionTowerPlaced,
          objectTowerPlaced,
          initialCodeGenerated,
          effectiveInitialCodeGenerated,
          isLearningMode,
          learningUnlockActive,
          setFunctionTowerPlaced,
          setObjectTowerPlaced,
          setInitialCodeGenerated,
          setCode,
          code,
          addTowerCodeSnippet,
          getCodeSnippetForLanguage,
          CodeSnippetManager,
          language,
          problem,
          coreTowerRequirements,
          currentWave: waveRef.current,
          isHomepageDemo,
        }
      );

      if (typeof document !== 'undefined') {
        const normalizedTowerType =
          typeof towerType === 'string' ? towerType.toUpperCase() : towerType;
        document.dispatchEvent(
          new CustomEvent('tower-placed', {
            detail: {
              towerType: normalizedTowerType,
              position,
              placementSource,
            },
          })
        );
      }
    },
    [
      addTerminalMessage,
      addTowerCodeSnippet,
      functionTowerPlaced,
      getCodeSnippetForLanguage,
      initialCodeGenerated,
      effectiveInitialCodeGenerated,
      isLearningMode,
      learningUnlockActive,
      language,
      objectTowerPlaced,
      problem,
      coreTowerRequirements,
      code,
      setCode,
      setFunctionTowerPlaced,
      setInitialCodeGenerated,
      setObjectTowerPlaced,
      waveRef,
      isHomepageDemo,
    ]
  );
}

