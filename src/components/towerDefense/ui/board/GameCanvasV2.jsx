/**
 * GameCanvasV2 - Canvas-based game renderer for Tower Defense V2
 *
 * This component replaces TowerDefenseController's game grid with canvas rendering
 * but uses the same API pattern so it can slot into the existing UI.
 */

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { GameEngine, Renderer, GAME_STATUS, TOWER_TYPES } from '../../../../game-engine-v2';
import { getTowerByType } from '../../../../game-engine-v2/constants';
import {
  getDifficultyBaseStats,
  normalizeProblemDifficulty,
} from '../../../../utils/problems/difficultyConfig';
import visualSettingsManager from '../../../../utils/game/VisualSettingsManager';
import TowerSelector from '../../TowerSelector';

/**
 * Canvas-based game component that matches TowerDefenseController's interface
 */
const GameCanvasV2 = forwardRef(
  (
    {
      // Props matching TowerDefenseController
      difficulty = 'easy',
      cellSize = 50,
      onGameComplete,
      onLoseLife,
      onEarnCredits,
      onWaveStart,
      onEnemySpawn,
      onEnemyReachEnd,
      onTowerPlaced,
      onTowerUpgraded,
      onGameStatusChange,
      availableTowerTypes = null,
      generatedMap = null,
      initialCredits = 350,
      initialLives = 10,
      totalWaves = 5,
      hideResetButton = false,
      initialCodeGenerated = false,
      codeSubmitted = false,
      codeSubmissionSuccess = null,
      onProjectileHit,
      disableDynamicResolution = false,
      pathGradientMode = 'homepage-default',
      tdMapTheme = null,
      lightningInternalMode = null,
      lightningColor = '#FDE047',
      lightningGlow = '#FEF08A',
      towerPack = null,
      enemyPack = null,
      tdAttackFxMode = 'none',
      damageTextPack = null,
      deathFxPack = null,
      showTowerSelector = true,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const rendererRef = useRef(null);
    const animationRef = useRef(null);

    // Local state
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
      totalWaves,
      problemDifficulty: normalizeProblemDifficulty(difficulty),
    });

    const [selectedTowerType, setSelectedTowerType] = useState(null);
    const [selectedTower, setSelectedTower] = useState(null);
    const [isTowerPlacementMode, setIsTowerPlacementMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Extract path and map data
    const pathNodes = generatedMap?.pathNodes || [];
    const mapData = generatedMap?.map || null;
    const mapRows = Array.isArray(mapData) ? mapData.length : null;
    const mapCols = Array.isArray(mapData) && mapData.length > 0 ? mapData[0].length : null;
    const gridCols = generatedMap?.cols || mapData?.cols || mapCols || 10;
    const gridRows = generatedMap?.rows || mapData?.rows || mapRows || 10;

    // ========================================================================
    // RENDER LOOP
    // ========================================================================

    const startRenderLoop = useCallback(() => {
      if (animationRef.current) return;

      const render = () => {
        if (engineRef.current && rendererRef.current) {
          const state = engineRef.current.getState();
          rendererRef.current.render(state);
        }
        animationRef.current = requestAnimationFrame(render);
      };

      animationRef.current = requestAnimationFrame(render);
    }, []);

    const stopRenderLoop = useCallback(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }, []);

    // ========================================================================
    // ENGINE INITIALIZATION
    // ========================================================================

    const applyVisualSettings = useCallback(() => {
      const settings = visualSettingsManager.getSettings();
      if (rendererRef.current) {
        rendererRef.current.updateSettings({
          particleEffects: settings.particleEffects,
          projectileTrails: settings.projectileTrails,
          glowEffects: settings.projectileGlow,
          hitEffects: settings.hitEffects,
          combatText: settings.combatText,
          explosionEffects: settings.explosionEffects,
        });
      }
    }, []);

    useEffect(() => {
      if (!canvasRef.current || pathNodes.length === 0) return;

      // Create engine
      if (!engineRef.current) {
        const baseStats = getDifficultyBaseStats(difficulty);
        engineRef.current = new GameEngine({
          initialCredits: initialCredits ?? baseStats.initialCredits,
          initialLives: initialLives ?? baseStats.initialLives,
          problemDifficulty: difficulty,
          totalWaves: totalWaves ?? baseStats.totalWaves,
        });
      }

      // Initialize engine
      engineRef.current.initialize({
        pathNodes,
        gridCols,
        gridRows,
        cellSize,
      });

      // Create renderer
      if (!rendererRef.current) {
        rendererRef.current = new Renderer(canvasRef.current, {
          cellSize,
          gridCols,
          gridRows,
          disableDynamicResolution,
        });
      }

      // Configure renderer
      rendererRef.current.configure({
        pathNodes,
        gridCols,
        gridRows,
        cellSize,
      });

      applyVisualSettings();

      // Set up event listeners
      setupEngineListeners();

      // Update initial state
      setGameState(engineRef.current.getState());
      setIsInitialized(true);

      // Start render loop
      startRenderLoop();

      const handleSettingsChange = () => {
        applyVisualSettings();
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('td-settings-changed', handleSettingsChange);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('td-settings-changed', handleSettingsChange);
        }
        stopRenderLoop();
        if (engineRef.current) {
          engineRef.current.stop();
        }
      };
    }, [
      pathNodes,
      cellSize,
      gridCols,
      gridRows,
      initialCredits,
      initialLives,
      difficulty,
      totalWaves,
      applyVisualSettings,
      startRenderLoop,
      stopRenderLoop,
      disableDynamicResolution,
    ]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({
        pathGradientMode,
        mapTheme: tdMapTheme,
      });
    }, [pathGradientMode, tdMapTheme]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({
        lightningInternalMode,
        lightningColor,
        lightningGlow,
      });
    }, [lightningInternalMode, lightningColor, lightningGlow]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({ towerPack });
    }, [towerPack]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({ enemyPack });
    }, [enemyPack]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({ tdAttackFxMode });
    }, [tdAttackFxMode]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({ damageTextPack });
    }, [damageTextPack]);

    useEffect(() => {
      if (!rendererRef.current) return;
      rendererRef.current.updateSettings({ deathFxPack });
    }, [deathFxPack]);

    useEffect(() => {
      const engine = engineRef.current;
      if (!engine || typeof engine.applyGameSettings !== 'function') return;

      // Keep engine reset baselines in sync with prop changes (e.g., store preview mode switches).
      engine.applyGameSettings(
        {
          startingCredits: initialCredits,
          startingLives: initialLives,
          totalWaves,
        },
        {
          // Safe in store preview: we want reset/game state to immediately reflect new baseline values.
          applyToState: true,
        }
      );
    }, [initialCredits, initialLives, totalWaves]);

    // ========================================================================
    // EVENT HANDLING
    // ========================================================================

    const setupEngineListeners = useCallback(() => {
      const engine = engineRef.current;
      if (!engine) return;

      // State change
      engine.on('state-change', ({ current }) => {
        setGameState(current);

        // Notify parent of status changes
        if (onGameStatusChange) {
          onGameStatusChange(current.status);
        }
      });

      // Update loop
      engine.on('update', (state) => {
        setGameState(state);
      });

      // Wave started
      engine.on('wave-started', (data) => {
        console.log(`[GameCanvasV2] Wave ${data.wave} started with ${data.enemyCount} enemies`);
        if (onWaveStart) {
          onWaveStart(data.wave, data.difficulty);
        }
      });

      // Enemy spawned
      engine.on('enemy-spawned', (data) => {
        if (onEnemySpawn) {
          onEnemySpawn(data.enemy);
        }
      });

      // Enemy defeated
      engine.on('enemy-defeated', (data) => {
        if (rendererRef.current) {
          rendererRef.current.createExplosion(data.enemy.x, data.enemy.y, data.enemy.color);
        }
        if (onEarnCredits) {
          onEarnCredits(data.reward);
        }
      });

      // Enemy reached end
      engine.on('enemy-reached-end', (data) => {
        if (onLoseLife) {
          onLoseLife(data.damage);
        }
        if (onEnemyReachEnd) {
          onEnemyReachEnd(data.enemy);
        }
      });

      // Tower attack (for projectile effects)
      engine.on('tower-attack', (data) => {
        if (onProjectileHit) {
          onProjectileHit(data);
        }
      });

      // Wave complete
      engine.on('wave-complete', (data) => {
        console.log(`[GameCanvasV2] Wave ${data.wave} complete! Bonus: ${data.bonus}`);
      });

      // Level complete
      engine.on('level-complete', (data) => {
        console.log(`[GameCanvasV2] Level complete! Score: ${data.score}`);
        if (onGameComplete) {
          onGameComplete({
            won: true,
            score: data.score,
            lives: data.lives,
            credits: data.credits,
            time: data.time,
          });
        }
      });

      // Game over
      engine.on('game-over', (data) => {
        console.log(`[GameCanvasV2] Game over at wave ${data.wave}`);
        if (onGameComplete) {
          onGameComplete({ won: false, wave: data.wave });
        }
      });
    }, [
      onGameStatusChange,
      onWaveStart,
      onEnemySpawn,
      onEarnCredits,
      onLoseLife,
      onEnemyReachEnd,
      onProjectileHit,
      onGameComplete,
    ]);

    // ========================================================================
    // GAME ACTIONS
    // ========================================================================

    const startWave = useCallback((waveDifficulty = 'normal') => {
      if (!engineRef.current) return false;
      return engineRef.current.startWave(waveDifficulty);
    }, []);

    const placeTower = useCallback(
      (type, row, col) => {
        if (!engineRef.current) return false;

        const result = engineRef.current.placeTower(type, { row, col });

        if (result && onTowerPlaced) {
          onTowerPlaced({
            towerType: type,
            position: { row, col },
            placementSource: 'ui',
          });
        }

        return result;
      },
      [onTowerPlaced]
    );

    const upgradeTower = useCallback(
      (towerId) => {
        if (!engineRef.current) return false;

        const result = engineRef.current.upgradeTower(towerId);

        if (result && onTowerUpgraded) {
          const tower = engineRef.current.towers.find((t) => t.id === towerId);
          if (tower) {
            onTowerUpgraded(tower.getState());
          }
        }

        return result;
      },
      [onTowerUpgraded]
    );

    const upgradeSpecialTower = useCallback(
      (towerId) => {
        if (!engineRef.current) return false;

        const result = engineRef.current.upgradeTowerSpecial(towerId);

        if (result && onTowerUpgraded) {
          const tower = engineRef.current.towers.find((t) => t.id === towerId);
          if (tower) {
            onTowerUpgraded(tower.getState());
          }
        }

        return result;
      },
      [onTowerUpgraded]
    );

    const sellTower = useCallback((towerId) => {
      if (!engineRef.current) return false;
      return engineRef.current.sellTower(towerId);
    }, []);

    const resetGame = useCallback(() => {
      if (!engineRef.current) return;
      engineRef.current.reset();
      setSelectedTower(null);
      setSelectedTowerType(null);
      setIsTowerPlacementMode(false);
    }, []);

    // ========================================================================
    // IMPERATIVE HANDLE (for parent component access)
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        // Expose methods parent expects
        startWave,
        placeTower,
        upgradeTower,
        upgradeSpecialTower,
        sellTower,
        resetGame,

        // State getters
        get gameState() {
          return gameState;
        },
        get credits() {
          return gameState.credits;
        },
        get lives() {
          return gameState.lives;
        },
        get currentWave() {
          return gameState.wave;
        },
        get gameStatus() {
          return gameState.status;
        },
        get towers() {
          return gameState.towers;
        },

        // Selection state
        get selectedTowerType() {
          return selectedTowerType;
        },
        set selectedTowerType(type) {
          setSelectedTowerType(type);
        },
        get selectedTower() {
          return selectedTower;
        },
        set selectedTower(tower) {
          setSelectedTower(tower);
        },
        get isTowerPlacementMode() {
          return isTowerPlacementMode;
        },
        set isTowerPlacementMode(mode) {
          setIsTowerPlacementMode(mode);
        },

        // For compatibility
        _gameLogicRef: { current: engineRef.current },
      }),
      [
        gameState,
        selectedTowerType,
        selectedTower,
        isTowerPlacementMode,
        startWave,
        placeTower,
        upgradeTower,
        upgradeSpecialTower,
        sellTower,
        resetGame,
      ]
    );

    // ========================================================================
    // CANVAS EVENT HANDLERS
    // ========================================================================

    const getCanvasPoint = useCallback(
      (event) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const style = window.getComputedStyle(canvas);
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const borderTop = parseFloat(style.borderTopWidth) || 0;
        const borderRight = parseFloat(style.borderRightWidth) || 0;
        const borderBottom = parseFloat(style.borderBottomWidth) || 0;

        const logicalWidth = gridCols * cellSize;
        const logicalHeight = gridRows * cellSize;

        const contentWidth = Math.max(1, rect.width - borderLeft - borderRight);
        const contentHeight = Math.max(1, rect.height - borderTop - borderBottom);
        const scaleX = logicalWidth / contentWidth;
        const scaleY = logicalHeight / contentHeight;

        const rawX = event.clientX - rect.left - borderLeft;
        const rawY = event.clientY - rect.top - borderTop;

        const x = Math.max(0, Math.min(logicalWidth, rawX * scaleX));
        const y = Math.max(0, Math.min(logicalHeight, rawY * scaleY));
        return { x, y };
      },
      [gridCols, gridRows, cellSize]
    );

    const handleCanvasClick = useCallback(
      (event) => {
        if (!canvasRef.current || !engineRef.current) return;

        const { x, y } = getCanvasPoint(event);

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (isTowerPlacementMode && selectedTowerType) {
          // Try to place tower
          const success = placeTower(selectedTowerType, row, col);
          if (success) {
            // Stay in placement mode for multiple placements
            console.log(`[GameCanvasV2] Placed ${selectedTowerType} tower at (${row}, ${col})`);
          }
        } else {
          // Check if clicked on a tower
          const clickedTower = gameState.towers.find(
            (t) => t.position.row === row && t.position.col === col
          );

          if (clickedTower) {
            setSelectedTower(clickedTower);
            if (rendererRef.current) {
              rendererRef.current.selectedTowerId = clickedTower.id;
            }
          } else {
            setSelectedTower(null);
            if (rendererRef.current) {
              rendererRef.current.selectedTowerId = null;
            }
          }
        }
      },
      [
        cellSize,
        isTowerPlacementMode,
        selectedTowerType,
        gameState.towers,
        placeTower,
        getCanvasPoint,
      ]
    );

    const handleCanvasMouseMove = useCallback(
      (event) => {
        if (!canvasRef.current || !rendererRef.current) return;
        if (!isTowerPlacementMode || !selectedTowerType) return;

        const { x, y } = getCanvasPoint(event);

        rendererRef.current.setHoveredCell(x, y);
        rendererRef.current.setPlacementPreview(selectedTowerType, x, y);
      },
      [isTowerPlacementMode, selectedTowerType, getCanvasPoint]
    );

    const handleCanvasMouseLeave = useCallback(() => {
      if (rendererRef.current) {
        rendererRef.current.clearHover();
        rendererRef.current.clearPlacementPreview();
      }
    }, []);

    // ========================================================================
    // TOWER SELECTION
    // ========================================================================

    const handleTowerTypeSelect = useCallback(
      (type) => {
        if (selectedTowerType === type) {
          // Deselect
          setSelectedTowerType(null);
          setIsTowerPlacementMode(false);
          if (rendererRef.current) {
            rendererRef.current.placementMode = false;
            rendererRef.current.placementTowerType = null;
          }
        } else {
          // Select
          setSelectedTowerType(type);
          setIsTowerPlacementMode(true);
          setSelectedTower(null);
          if (rendererRef.current) {
            rendererRef.current.placementMode = true;
            rendererRef.current.placementTowerType = type;
            rendererRef.current.selectedTowerId = null;
          }
        }
      },
      [selectedTowerType]
    );

    useEffect(() => {
      if (selectedTowerType || !isTowerPlacementMode) return;
      setIsTowerPlacementMode(false);
      if (rendererRef.current) {
        rendererRef.current.placementMode = false;
        rendererRef.current.placementTowerType = null;
        rendererRef.current.clearPlacementPreview?.();
        rendererRef.current.clearHover?.();
      }
    }, [selectedTowerType, isTowerPlacementMode]);

    // Filter available towers
    const displayTowerTypes = availableTowerTypes
      ? Object.values(TOWER_TYPES).filter((t) => availableTowerTypes.includes(t.type))
      : Object.values(TOWER_TYPES);

    // ========================================================================
    // RENDER
    // ========================================================================

    const canvasWidth = gridCols * cellSize;
    const canvasHeight = gridRows * cellSize;

    return (
      <Box width="100%" height="100%">
        <Flex height="100%" gap={2}>
          {/* Tower Selector - matching original game layout */}
          {showTowerSelector && (
            <Box
              width="200px"
              flexShrink={0}
              bg="rgba(0, 20, 40, 0.9)"
              borderRadius="md"
              p={2}
              overflowY="auto"
            >
              <TowerSelector
                credits={gameState.credits}
                selectedTowerType={selectedTowerType}
                onSelectTower={handleTowerTypeSelect}
                availableTowerTypes={availableTowerTypes}
                isTowerPlacementMode={isTowerPlacementMode}
                onCancelPlacement={() => {
                  setIsTowerPlacementMode(false);
                  setSelectedTowerType(null);
                }}
              />

              {/* Selected Tower Info */}
              {selectedTower && (
                <Box
                  mt={4}
                  p={3}
                  bg="rgba(0, 30, 60, 0.8)"
                  borderRadius="md"
                  border="1px solid"
                  borderColor={selectedTower.color}
                >
                  <Text color={selectedTower.color} fontWeight="bold" fontSize="sm">
                    {getTowerByType(selectedTower.type)?.displayName || selectedTower.type}
                  </Text>
                  <Text color="#00ff8c" fontSize="xs">
                    Damage: {selectedTower.damage?.toFixed(1)}
                  </Text>
                  <Text color="#00ff8c" fontSize="xs">
                    Range: {selectedTower.range}
                  </Text>
                  <Text color="#00ff8c" fontSize="xs">
                    Level: {(selectedTower.upgradeLevel || 0) + 1}
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Game Canvas */}
          <Box
            flex="1"
            display="flex"
            alignItems="stretch"
            justifyContent="stretch"
            position="relative"
          >
            <Box
              flex="1"
              overflow="auto"
              display="flex"
              alignItems="flex-start"
              justifyContent="flex-start"
              p={2}
              sx={{
                '&::-webkit-scrollbar': {
                  height: '8px',
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0, 0, 0, 0.2)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0, 255, 255, 0.35)',
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(0, 255, 255, 0.6)',
                },
              }}
            >
              <Box display="inline-block" minW="max-content" minH="max-content">
                <canvas
                  ref={canvasRef}
                  data-tutorial="game-grid"
                  width={canvasWidth}
                  height={canvasHeight}
                  style={{
                    border: '2px solid #00ff8c',
                    borderRadius: '8px',
                    cursor: isTowerPlacementMode ? 'crosshair' : 'pointer',
                    boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
                  }}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                />
              </Box>
            </Box>

            {/* Status overlay - DEBUG */}
            {!isInitialized && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="rgba(0,0,0,0.8)"
                p={4}
                borderRadius="md"
              >
                <Text color="#00ff8c">Initializing Engine...</Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
    );
  }
);

GameCanvasV2.displayName = 'GameCanvasV2';

export default GameCanvasV2;
