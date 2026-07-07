/**
 * Tower Defense V2 - Debug Bridge
 */

import { useEffect } from 'react';

export default function useTowerDefenseV2DebugBridge({ transformTowerAtPosition }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__tdTransformTowerAtPosition = transformTowerAtPosition;
    return () => {
      delete window.__tdTransformTowerAtPosition;
    };
  }, [transformTowerAtPosition]);
}
