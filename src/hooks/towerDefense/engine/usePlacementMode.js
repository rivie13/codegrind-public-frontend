import { useCallback, useEffect, useRef, useState } from 'react';

import { TOWER_VERIFICATION_LOCK_MESSAGE } from '../../../utils/towerDefense/verificationLock';

export default function usePlacementMode({
  engineRef,
  rendererRef,
  addTerminalMessage,
  towerPlacementLocked = false,
  isTowerUnlocked,
  isDeployableUnlocked,
}) {
  const [selectedTowerType, setSelectedTowerType] = useState(null);
  const [selectedDeployableType, setSelectedDeployableType] = useState(null);
  const [isTowerPlacementMode, setIsTowerPlacementMode] = useState(false);
  const [placementModeKind, setPlacementModeKind] = useState('tower');
  const placementSourceRef = useRef('ui');

  const enterPlacementMode = useCallback(
    (type, kind = 'tower') => {
      setPlacementModeKind(kind);
      if (kind === 'tower') {
        setSelectedTowerType(type);
        setSelectedDeployableType(null);
      } else {
        setSelectedDeployableType(type);
        setSelectedTowerType(null);
      }

      setIsTowerPlacementMode(true);

      if (rendererRef.current) {
        rendererRef.current.setPlacementMode(true, type, kind);
        rendererRef.current.selectedTowerId = null;
      }
    },
    [rendererRef]
  );

  const cancelPlacementMode = useCallback(() => {
    if (engineRef.current && isTowerPlacementMode) {
      const kind = placementModeKind === 'deployable' ? 'deployable' : 'tower';
      const type = placementModeKind === 'deployable' ? selectedDeployableType : selectedTowerType;
      if (type) {
        engineRef.current.cancelReservedPlacement?.(kind, type);
      }
    }
    setIsTowerPlacementMode(false);
    setSelectedTowerType(null);
    setSelectedDeployableType(null);
    placementSourceRef.current = 'ui';
    if (rendererRef.current) {
      rendererRef.current.setPlacementMode(false, null, 'tower');
      rendererRef.current.clearPlacementPreview();
    }
  }, [
    engineRef,
    isTowerPlacementMode,
    placementModeKind,
    rendererRef,
    selectedDeployableType,
    selectedTowerType,
  ]);

  useEffect(() => {
    if (!isTowerPlacementMode) return;
    const activeType =
      placementModeKind === 'deployable' ? selectedDeployableType : selectedTowerType;
    if (activeType) return;
    cancelPlacementMode();
  }, [
    cancelPlacementMode,
    isTowerPlacementMode,
    placementModeKind,
    selectedDeployableType,
    selectedTowerType,
  ]);

  useEffect(() => {
    if (!towerPlacementLocked) return;
    if (!isTowerPlacementMode || placementModeKind !== 'tower') return;
    cancelPlacementMode();
  }, [cancelPlacementMode, isTowerPlacementMode, placementModeKind, towerPlacementLocked]);

  const handleTowerTypeSelect = useCallback(
    (type, source = 'ui') => {
      if (towerPlacementLocked) {
        addTerminalMessage?.(`[SYSTEM] ${TOWER_VERIFICATION_LOCK_MESSAGE}`);
        return;
      }

      if (isTowerUnlocked && !isTowerUnlocked(type)) {
        addTerminalMessage?.('[SYSTEM] Tower locked: requires level and store purchase.');
        return;
      }

      if (selectedTowerType === type && placementModeKind === 'tower') {
        cancelPlacementMode();
        return;
      }

      if (isTowerPlacementMode) {
        if (
          placementSourceRef.current === 'terminal' &&
          source !== 'terminal' &&
          addTerminalMessage
        ) {
          addTerminalMessage(
            '[SYSTEM] Terminal reservation canceled because a tower was selected from the menu.'
          );
        }
        cancelPlacementMode();
      }

      placementSourceRef.current = source || 'ui';
      enterPlacementMode(type, 'tower');
    },
    [
      addTerminalMessage,
      cancelPlacementMode,
      enterPlacementMode,
      isDeployableUnlocked,
      isTowerPlacementMode,
      placementModeKind,
      selectedTowerType,
      towerPlacementLocked,
      isTowerUnlocked,
    ]
  );

  const handleDeployableTypeSelect = useCallback(
    (type, source = 'ui') => {
      if (isDeployableUnlocked && !isDeployableUnlocked(type)) {
        addTerminalMessage?.('[SYSTEM] Deployable locked: requires level and store purchase.');
        return;
      }

      if (selectedDeployableType === type && placementModeKind === 'deployable') {
        cancelPlacementMode();
        return;
      }

      if (isTowerPlacementMode) {
        if (
          placementSourceRef.current === 'terminal' &&
          source !== 'terminal' &&
          addTerminalMessage
        ) {
          addTerminalMessage(
            '[SYSTEM] Terminal reservation canceled because a menu item was selected.'
          );
        }
        cancelPlacementMode();
      }

      placementSourceRef.current = source || 'ui';
      enterPlacementMode(type, 'deployable');
    },
    [
      addTerminalMessage,
      cancelPlacementMode,
      enterPlacementMode,
      isDeployableUnlocked,
      isTowerPlacementMode,
      placementModeKind,
      selectedDeployableType,
    ]
  );

  const reserveTowerPlacement = useCallback(
    (type, source = 'ui') => {
      if (towerPlacementLocked) {
        return { success: false, reason: 'verification-lock' };
      }
      if (!engineRef.current) return { success: false, reason: 'engine' };
      placementSourceRef.current = source || 'ui';
      return engineRef.current.reservePlacement('tower', type);
    },
    [engineRef, towerPlacementLocked]
  );

  const reserveDeployablePlacement = useCallback(
    (type, source = 'ui') => {
      if (!engineRef.current) return { success: false, reason: 'engine' };
      placementSourceRef.current = source || 'ui';
      return engineRef.current.reservePlacement('deployable', type);
    },
    [engineRef]
  );

  const getReservedTowerCount = useCallback(() => {
    if (!engineRef.current) return 0;
    return engineRef.current.getReservedPlacementCount('tower');
  }, [engineRef]);

  const getReservedDeployableCount = useCallback(() => {
    if (!engineRef.current) return 0;
    return engineRef.current.getReservedPlacementCount('deployable');
  }, [engineRef]);

  return {
    selectedTowerType,
    selectedDeployableType,
    isTowerPlacementMode,
    placementModeKind,
    placementSourceRef,
    enterPlacementMode,
    cancelPlacementMode,
    handleTowerTypeSelect,
    handleDeployableTypeSelect,
    reserveTowerPlacement,
    reserveDeployablePlacement,
    getReservedTowerCount,
    getReservedDeployableCount,
  };
}
