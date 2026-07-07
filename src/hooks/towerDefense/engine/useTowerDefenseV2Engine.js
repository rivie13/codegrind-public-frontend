/**
 * Tower Defense V2 - Engine/Renderer Hook
 *
 * Encapsulates GameEngine + Renderer lifecycle, canvas events,
 * and tower selection/placement state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, Renderer, GAME_STATUS } from '../../../game-engine-v2/GameEngine.js';
import { registerEngineAudioHandlers } from '../audio/engineAudioHandlers';
import { registerEngineEventHandlers } from './engineEventHandlers';
import { getCanvasPointFromEvent } from './canvasUtils';
import usePlacementMode from './usePlacementMode';
import useTowerSelection from './useTowerSelection';
import visualSettingsManager from '../../../utils/game/VisualSettingsManager';
import { TOWER_VERIFICATION_LOCK_MESSAGE } from '../../../utils/towerDefense/verificationLock';

const TD_MOBILE_OPEN_TOWER_DETAILS_EVENT = 'td-mobile-open-tower-details';

const isMobileTowerInteraction = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(pointer: coarse)').matches;
};

export default function useTowerDefenseV2Engine({
  pathNodes,
  gridCols,
  gridRows,
  cellSize,
  showPlacementHints = false,
  bootSequenceId = 0,
  initialCredits = 500,
  initialLives = 10,
  problemDifficulty = 'MEDIUM',
  totalWaves = 5,
  playerLevel = 1,
  addTerminalMessage,
  towerPlacementLocked = false,
  isTowerUnlocked,
  isDeployableUnlocked,
  isSpecialUpgradeUnlocked,
  onWaveStarted,
  onEnemySpawned,
  onEnemyDefeated,
  onEnemyReachedEnd,
  onTowerUpgraded,
  onTowerSpecialUpgraded,
  onTowerSold,
  onWaveComplete,
  onLevelComplete,
  onGameOver,
  onTowerPlaced,
  onEndlessModeStarted,
  onEndlessWaveStarted,
  onEndlessWaveComplete,
  rendererCosmetics = null,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const isCanvasIntersectingRef = useRef(true);
  const listenersSetupRef = useRef(false);
  const playerLevelRef = useRef(playerLevel);
  const bootSequenceRef = useRef(null);
  const rendererMessageRef = useRef(null);
  const engineConfigRef = useRef({
    initialCredits,
    initialLives,
    problemDifficulty,
    totalWaves,
  });
  const uiSnapshotRef = useRef(null);
  const uiUpdateRef = useRef({
    lastUpdate: 0,
    timeoutId: null,
    pendingState: null,
  });
  const [canvasElement, setCanvasElement] = useState(null);

  const [gameState, setGameState] = useState({
    status: GAME_STATUS.PREHACK,
    credits: initialCredits,
    lives: initialLives,
    wave: 1,
    enemiesDefeated: 0,
    enemiesInWave: 0,
    enemiesRemaining: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    deployables: [],
    totalWaves,
    problemDifficulty,
    playerLevel,
    isEndlessMode: false,
    endlessWave: 0,
    endlessScore: 0,
    endlessBossesKilled: 0,
    endlessSurvivalTime: 0,
  });

  const {
    selectedTowerType,
    selectedDeployableType,
    isTowerPlacementMode,
    placementModeKind,
    placementSourceRef,
    cancelPlacementMode,
    handleTowerTypeSelect,
    handleDeployableTypeSelect,
    reserveTowerPlacement,
    reserveDeployablePlacement,
    getReservedTowerCount,
    getReservedDeployableCount,
  } = usePlacementMode({
    engineRef,
    rendererRef,
    addTerminalMessage,
    towerPlacementLocked,
    isTowerUnlocked,
    isDeployableUnlocked,
  });
  const { selectedTower, selectedTowerIdRef, clearSelectedTower, selectTower, selectTowerById } =
    useTowerSelection({ gameState, rendererRef });

  const handlerRef = useRef({});
  const onTowerPlacedRef = useRef(onTowerPlaced);

  useEffect(() => {
    handlerRef.current = {
      onWaveStarted,
      onEnemySpawned,
      onEnemyDefeated,
      onEnemyReachedEnd,
      onTowerUpgraded,
      onTowerSpecialUpgraded,
      onTowerSold,
      onWaveComplete,
      onLevelComplete,
      onGameOver,
      onEndlessModeStarted,
      onEndlessWaveStarted,
      onEndlessWaveComplete,
    };
    onTowerPlacedRef.current = onTowerPlaced;
  }, [
    onWaveStarted,
    onEnemySpawned,
    onEnemyDefeated,
    onEnemyReachedEnd,
    onTowerUpgraded,
    onTowerSpecialUpgraded,
    onTowerSold,
    onWaveComplete,
    onLevelComplete,
    onGameOver,
    onTowerPlaced,
    onEndlessModeStarted,
    onEndlessWaveStarted,
    onEndlessWaveComplete,
  ]);

  const extractUiSnapshot = useCallback(
    (state) => ({
      status: state?.status,
      credits: state?.credits,
      lives: state?.lives,
      wave: state?.wave,
      totalWaves: state?.totalWaves,
      enemiesRemaining: state?.enemiesRemaining,
      isEndlessMode: state?.isEndlessMode,
      endlessWave: state?.endlessWave,
      endlessScore: state?.endlessScore,
      endlessSurvivalTime: state?.endlessSurvivalTime,
    }),
    []
  );

  const shouldUpdateUi = useCallback(
    (state) => {
      const nextSnapshot = extractUiSnapshot(state);
      const prevSnapshot = uiSnapshotRef.current;
      if (!prevSnapshot) {
        uiSnapshotRef.current = nextSnapshot;
        return true;
      }

      const keys = Object.keys(nextSnapshot);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (prevSnapshot[key] !== nextSnapshot[key]) {
          uiSnapshotRef.current = nextSnapshot;
          return true;
        }
      }

      return false;
    },
    [extractUiSnapshot]
  );

  const setGameStateImmediate = useCallback(
    (state) => {
      uiSnapshotRef.current = extractUiSnapshot(state);
      setGameState((prevState) => ({ ...prevState, ...state }));
    },
    [extractUiSnapshot]
  );

  const scheduleUiStateUpdate = useCallback(
    (state) => {
      if (!shouldUpdateUi(state)) return;
      const ref = uiUpdateRef.current;
      ref.pendingState = state;
      const now =
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const minInterval = 80;

      if (now - ref.lastUpdate >= minInterval) {
        ref.lastUpdate = now;
        setGameState((prevState) => ({ ...prevState, ...ref.pendingState }));
        ref.pendingState = null;
        return;
      }

      if (ref.timeoutId) return;
      const delay = Math.max(0, minInterval - (now - ref.lastUpdate));
      ref.timeoutId = setTimeout(() => {
        ref.timeoutId = null;
        const latest = ref.pendingState;
        if (!latest) return;
        ref.pendingState = null;
        ref.lastUpdate =
          typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        setGameState((prevState) => ({ ...prevState, ...latest }));
      }, delay);
    },
    [shouldUpdateUi]
  );

  const setupEngineListeners = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (listenersSetupRef.current) return;
    listenersSetupRef.current = true;

    registerEngineAudioHandlers(engine);
    registerEngineEventHandlers({
      engine,
      setGameState: setGameStateImmediate,
      setGameStateThrottled: scheduleUiStateUpdate,
      handlerRef,
    });
  }, [scheduleUiStateUpdate, setGameStateImmediate]);

  const canvasRefCallback = useCallback((node) => {
    canvasRef.current = node;
    setCanvasElement(node);
  }, []);

  useEffect(() => {
    if (!pathNodes?.length) {
      return;
    }

    const nextConfig = {
      initialCredits,
      initialLives,
      problemDifficulty,
      totalWaves,
    };

    const configChanged = Object.keys(nextConfig).some(
      (key) => engineConfigRef.current[key] !== nextConfig[key]
    );

    if (engineRef.current && configChanged) {
      engineRef.current.destroy?.();
      engineRef.current = null;
      listenersSetupRef.current = false;
    }

    if (!engineRef.current) {
      engineRef.current = new GameEngine({
        initialCredits,
        initialLives,
        problemDifficulty,
        totalWaves,
        playerLevel: playerLevelRef.current,
      });
      engineConfigRef.current = nextConfig;
    }

    engineRef.current.initialize({
      pathNodes,
      gridCols,
      gridRows,
      cellSize,
    });

    setupEngineListeners();

    if (addTerminalMessage && bootSequenceRef.current !== bootSequenceId) {
      bootSequenceRef.current = bootSequenceId;
      addTerminalMessage('[KERNEL] _/// CYBERSPACE DEFENSE MATRIX V2 ////_');
      addTerminalMessage('[SYSTEM] Neural interface compiled. Intrusion vectors loaded.');
      addTerminalMessage('[SYSTEM] Jack in: use terminal or tower selector to deploy defenses.');
      addTerminalMessage(`[KERNEL] Path lattice synced: ${pathNodes.length} waypoints locked.`);
    }

    setGameStateImmediate(engineRef.current.getState());
  }, [
    addTerminalMessage,
    bootSequenceId,
    cellSize,
    gridCols,
    gridRows,
    initialCredits,
    initialLives,
    pathNodes,
    problemDifficulty,
    setGameStateImmediate,
    setupEngineListeners,
    totalWaves,
  ]);

  useEffect(() => {
    playerLevelRef.current = playerLevel;
    if (!engineRef.current) return;
    if (typeof engineRef.current.setPlayerLevel === 'function') {
      engineRef.current.setPlayerLevel(playerLevel);
      setGameStateImmediate(engineRef.current.getState());
    }
  }, [playerLevel, setGameStateImmediate]);

  useEffect(() => {
    const canvas = canvasElement;
    if (!canvas || !engineRef.current || !pathNodes?.length) return;

    const initRenderer = () => {
      if (!canvas.isConnected) return;

      const needsNewRenderer = !rendererRef.current || rendererRef.current.canvas !== canvas;

      if (needsNewRenderer) {
        rendererRef.current = new Renderer(canvas, {
          cellSize,
          gridCols,
          gridRows,
          disableDynamicResolution: true,
          settings: {
            showPlacementHints,
          },
        });
      }

      if (rendererRef.current) {
        rendererRef.current.configure({
          pathNodes,
          gridCols,
          gridRows,
          cellSize,
        });

        const settings = visualSettingsManager.getSettings();
        rendererRef.current.updateSettings({
          showPlacementHints,
          particleEffects: settings.particleEffects,
          projectileTrails: settings.projectileTrails,
          glowEffects: settings.projectileGlow,
          hitEffects: settings.hitEffects !== false,
          combatText: settings.combatText !== false,
          explosionEffects: settings.explosionEffects !== false,
          ...(rendererCosmetics || {}),
        });

        if (addTerminalMessage && rendererMessageRef.current !== bootSequenceId) {
          rendererMessageRef.current = bootSequenceId;
          setTimeout(() => {
            addTerminalMessage('[RENDERER] Desktop display stable. Viewport calibrated.');
          }, 0);
        }
      }
    };

    initRenderer();

    const handleSettingsChange = () => {
      if (!rendererRef.current) return;
      const settings = visualSettingsManager.getSettings();
      rendererRef.current.updateSettings({
        showPlacementHints,
        particleEffects: settings.particleEffects,
        projectileTrails: settings.projectileTrails,
        glowEffects: settings.projectileGlow,
        hitEffects: settings.hitEffects !== false,
        combatText: settings.combatText !== false,
        explosionEffects: settings.explosionEffects !== false,
        ...(rendererCosmetics || {}),
      });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('td-settings-changed', handleSettingsChange);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isCanvasIntersectingRef.current = entry.isIntersecting;
          if (entry.isIntersecting && canvas.isConnected) {
            if (!rendererRef.current || rendererRef.current.canvas !== canvas) {
              initRenderer();
            }
            if (rendererRef.current && engineRef.current) {
              rendererRef.current.render(engineRef.current.getRenderState());
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('td-settings-changed', handleSettingsChange);
      }
    };
  }, [
    addTerminalMessage,
    bootSequenceId,
    canvasElement,
    cellSize,
    gridCols,
    gridRows,
    pathNodes,
    rendererCosmetics,
    showPlacementHints,
  ]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.updateSettings({
      ...(rendererCosmetics || {}),
      showPlacementHints,
    });
  }, [rendererCosmetics, showPlacementHints]);

  useEffect(() => {
    const render = () => {
      if (
        isCanvasIntersectingRef.current &&
        engineRef.current &&
        rendererRef.current &&
        canvasRef.current?.isConnected
      ) {
        const state = engineRef.current.getRenderState();
        rendererRef.current.render(state);
      }
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isTowerPlacementMode) {
        cancelPlacementMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelPlacementMode, isTowerPlacementMode]);

  useEffect(() => {
    const { current: uiUpdate } = uiUpdateRef;
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      listenersSetupRef.current = false;
      if (uiUpdate.timeoutId) {
        clearTimeout(uiUpdate.timeoutId);
        uiUpdate.timeoutId = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isTowerPlacementMode) return;
    clearSelectedTower();
  }, [clearSelectedTower, isTowerPlacementMode]);

  useEffect(() => {
    if (!rendererRef.current) return;
    const activeItemType =
      placementModeKind === 'deployable' ? selectedDeployableType : selectedTowerType;

    if (!isTowerPlacementMode || !activeItemType) {
      rendererRef.current.setPlacementMode(false, null, placementModeKind);
      rendererRef.current.clearPlacementPreview?.();
      rendererRef.current.clearHover?.();
      return;
    }

    rendererRef.current.setPlacementMode(true, activeItemType, placementModeKind);
  }, [isTowerPlacementMode, placementModeKind, selectedDeployableType, selectedTowerType]);

  const getCanvasPoint = useCallback(
    (event) => {
      return getCanvasPointFromEvent(canvasRef.current, event, gridCols, gridRows, cellSize);
    },
    [gridCols, gridRows, cellSize]
  );

  const handleCanvasClick = useCallback(
    (event) => {
      if (!canvasRef.current || !engineRef.current) return;

      const { x, y } = getCanvasPoint(event);

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      const clickedTower = gameState.towers.find(
        (t) => Number(t.position?.row) === row && Number(t.position?.col) === col
      );

      if (clickedTower) {
        if (isTowerPlacementMode) {
          cancelPlacementMode();
        }

        const isRepeatedMobileTap =
          !isTowerPlacementMode &&
          clickedTower.id === selectedTowerIdRef.current &&
          isMobileTowerInteraction();

        selectTower(clickedTower);

        if (isRepeatedMobileTap && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(TD_MOBILE_OPEN_TOWER_DETAILS_EVENT, {
              detail: {
                towerId: clickedTower.id,
                source: 'canvas-repeat-tap',
              },
            })
          );
        }

        return;
      }

      if (isTowerPlacementMode && placementModeKind === 'tower' && selectedTowerType) {
        if (towerPlacementLocked) {
          cancelPlacementMode();
          addTerminalMessage?.(`[SYSTEM] ${TOWER_VERIFICATION_LOCK_MESSAGE}`);
          return;
        }

        console.log('[V2Test.handleCanvasClick] Attempting placement:', {
          engineId: engineRef.current._engineId,
          pathNodesLength: engineRef.current.pathNodes?.length,
          row,
          col,
          selectedTowerType,
        });

        const placementSource = placementSourceRef.current || 'ui';
        const result = engineRef.current.placeTower(selectedTowerType, { row, col });
        if (result) {
          onTowerPlacedRef.current?.({
            towerType: selectedTowerType,
            position: { row, col },
            placementSource,
          });

          placementSourceRef.current = 'ui';
          cancelPlacementMode();
        } else {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('td-invalid-placement-attempt', {
                detail: { row, col },
              })
            );
          }
        }
      } else if (
        isTowerPlacementMode &&
        placementModeKind === 'deployable' &&
        selectedDeployableType
      ) {
        const result = engineRef.current.placeDeployable(selectedDeployableType, { row, col });
        if (result) {
          cancelPlacementMode();
        }
      } else {
        clearSelectedTower();
      }
    },
    [
      addTerminalMessage,
      cancelPlacementMode,
      cellSize,
      clearSelectedTower,
      gameState.towers,
      getCanvasPoint,
      isTowerPlacementMode,
      placementModeKind,
      placementSourceRef,
      selectedTowerIdRef,
      selectTower,
      selectedDeployableType,
      selectedTowerType,
      towerPlacementLocked,
    ]
  );

  const handleCanvasMouseMove = useCallback(
    (event) => {
      if (!canvasRef.current || !rendererRef.current) return;
      if (!isTowerPlacementMode) return;

      const { x, y } = getCanvasPoint(event);
      const itemType = placementModeKind === 'tower' ? selectedTowerType : selectedDeployableType;
      if (!itemType) return;

      rendererRef.current.setHoveredCell(x, y);
      rendererRef.current.setPlacementPreview(itemType, x, y, placementModeKind);
    },
    [
      getCanvasPoint,
      isTowerPlacementMode,
      placementModeKind,
      selectedDeployableType,
      selectedTowerType,
    ]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.clearHover();
      rendererRef.current.clearPlacementPreview();
    }
  }, []);

  const handleUpgradeSelectedTower = useCallback(() => {
    if (!engineRef.current || !selectedTower) return false;
    const success = engineRef.current.upgradeTower(selectedTower.id);
    if (!success && addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Unable to upgrade module.');
    }
    return success;
  }, [addTerminalMessage, selectedTower]);

  const handleSpecialUpgradeSelectedTower = useCallback(() => {
    if (!engineRef.current || !selectedTower) return false;
    if (isSpecialUpgradeUnlocked) {
      const nextTier = (selectedTower.specialUpgradeLevel ?? 0) + 1;
      if (!isSpecialUpgradeUnlocked(selectedTower.type, nextTier)) {
        addTerminalMessage?.(
          `[SYSTEM] Special upgrade tier ${nextTier} is locked. Requires level and store purchase.`
        );
        return false;
      }
    }
    const success = engineRef.current.upgradeTowerSpecial(selectedTower.id);
    if (!success && addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Unable to apply special module upgrade.');
    }
    return success;
  }, [addTerminalMessage, isSpecialUpgradeUnlocked, selectedTower]);

  const handleSetSelectedTowerTargeting = useCallback(
    (targeting) => {
      if (!engineRef.current || !selectedTower) return false;
      const success = engineRef.current.setTowerTargeting(selectedTower.id, targeting);
      if (!success && addTerminalMessage) {
        addTerminalMessage('[SYSTEM] Unable to update module targeting.');
      }
      return success;
    },
    [addTerminalMessage, selectedTower]
  );

  const handleSellSelectedTower = useCallback(() => {
    if (!engineRef.current || !selectedTower) return false;
    const success = engineRef.current.sellTower(selectedTower.id);
    if (!success && addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Unable to sell module.');
    }
    return success;
  }, [addTerminalMessage, selectedTower]);

  const transformTowerType = useCallback(
    (towerId, newType) => {
      if (!engineRef.current || !towerId || !newType) return false;
      const success = engineRef.current.transformTowerType?.(towerId, newType);
      if (success && selectedTowerIdRef.current === towerId) {
        const updated = engineRef.current.getState()?.towers?.find((t) => t.id === towerId);
        if (updated) {
          selectTower(updated);
        }
      }
      return Boolean(success);
    },
    [selectTower, selectedTowerIdRef]
  );

  const transformTowerAtPosition = useCallback(
    (position, newType) => {
      if (!engineRef.current || !position || !newType) return false;
      const row = Number(position.row);
      const col = Number(position.col);
      const tower = engineRef.current.towers.find(
        (t) => Number(t.position?.row) === row && Number(t.position?.col) === col
      );
      if (!tower) return false;
      return transformTowerType(tower.id, newType);
    },
    [transformTowerType]
  );

  const setStatus = useCallback((status) => {
    if (!engineRef.current) return;
    engineRef.current.setStatus(status);
  }, []);

  const startWave = useCallback((difficulty = 'normal') => {
    if (!engineRef.current) return false;
    return engineRef.current.startWave(difficulty);
  }, []);

  const startEndlessMode = useCallback((options = {}) => {
    if (!engineRef.current) return false;
    return engineRef.current.startEndlessMode(options);
  }, []);

  const resetEngineState = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    clearSelectedTower();
    cancelPlacementMode();
  }, [cancelPlacementMode, clearSelectedTower]);

  const applyGameSettings = useCallback((settings, options = {}) => {
    if (!engineRef.current) return false;
    engineRef.current.applyGameSettings(settings, options);
    setGameState(engineRef.current.getState());
    return true;
  }, []);

  const notifySolutionSuccess = useCallback((success) => {
    if (!engineRef.current) return;
    engineRef.current.notifySolutionSuccess(success);
  }, []);

  const canSpendBits = useCallback((amount) => {
    if (!engineRef.current) return false;
    const normalized = Math.max(0, Math.floor(Number(amount) || 0));
    return engineRef.current.state.credits >= normalized;
  }, []);

  const spendBits = useCallback((amount, options = {}) => {
    if (!engineRef.current) return false;
    const normalized = Math.max(0, Math.floor(Number(amount) || 0));
    if (!normalized) return true;
    if (engineRef.current.state.credits < normalized) return false;

    engineRef.current.state.credits -= normalized;
    engineRef.current.updateState({ credits: engineRef.current.state.credits });
    engineRef.current.emit('bits-spent', {
      amount: normalized,
      reason: options.reason || 'action-cost',
      credits: engineRef.current.state.credits,
    });
    return true;
  }, []);

  return {
    canvasRefCallback,
    gameState,
    selectedTowerType,
    selectedDeployableType,
    selectedTower,
    isTowerPlacementMode,
    placementModeKind,
    handleCanvasClick,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    handleTowerTypeSelect,
    handleDeployableTypeSelect,
    reserveTowerPlacement,
    reserveDeployablePlacement,
    getReservedTowerCount,
    getReservedDeployableCount,
    handleUpgradeSelectedTower,
    handleSpecialUpgradeSelectedTower,
    handleSetSelectedTowerTargeting,
    handleSellSelectedTower,
    selectTowerById,
    transformTowerType,
    transformTowerAtPosition,
    cancelPlacementMode,
    clearSelectedTower,
    setStatus,
    startWave,
    startEndlessMode,
    resetEngineState,
    applyGameSettings,
    notifySolutionSuccess,
    canSpendBits,
    spendBits,
  };
}
