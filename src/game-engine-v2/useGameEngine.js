/**
 * Tower Defense Game Engine V2 - React Hook
 * 
 * React hook for integrating the GameEngine with React components
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './GameEngine.js';
import { Renderer } from './Renderer.js';
import { GAME_STATUS } from './constants.js';

/**
 * Hook for using the game engine in React
 * 
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to canvas element
 * @param {Object} options - Options
 * @param {Array} options.pathNodes - Path nodes for the map
 * @param {number} options.gridCols - Number of columns
 * @param {number} options.gridRows - Number of rows
 * @param {number} options.cellSize - Cell size in pixels
 * @param {number} options.initialCredits - Starting credits
 * @param {Object} options.visualSettings - Visual settings for renderer
 * 
 * @returns {Object} Engine interface
 */
export function useGameEngine(canvasRef, options = {}) {
  // Refs for engine and renderer (don't trigger re-renders)
  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  
  // Game state (triggers re-renders)
  const [gameState, setGameState] = useState({
    status: GAME_STATUS.PREHACK,
    credits: options.initialCredits || 350,
    lives: 10,
    wave: 1,
    enemiesDefeated: 0,
    enemiesInWave: 0,
    enemiesRemaining: 0,
    score: 0,
    towers: [],
    enemies: [],
    projectiles: []
  });
  
  // UI state
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [placementTowerType, setPlacementTowerType] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize the engine and renderer
   */
  const initialize = useCallback((config) => {
    const {
      pathNodes = [],
      gridCols = 10,
      gridRows = 10,
      cellSize = 50,
      initialCredits = 350,
      visualSettings = {}
    } = config;

    // Create engine if needed
    if (!engineRef.current) {
      engineRef.current = new GameEngine({ initialCredits });
    }

    // Initialize engine with path data
    engineRef.current.initialize({
      pathNodes,
      gridCols,
      gridRows,
      cellSize
    });

    // Create renderer if we have a canvas
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new Renderer(canvasRef.current, {
        cellSize,
        gridCols,
        gridRows,
        settings: visualSettings
      });
    }

    // Configure renderer
    if (rendererRef.current) {
      rendererRef.current.configure({
        pathNodes,
        gridCols,
        gridRows,
        cellSize
      });
    }

    // Set up event listeners
    setupEventListeners();

    // Initial state update
    setGameState(engineRef.current.getState());
    setIsInitialized(true);

    // Start render loop
    startRenderLoop();
  }, [canvasRef, placementMode, placementTowerType]);

  /**
   * Set up engine event listeners
   */
  const setupEventListeners = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // State change listener - update React state
    engine.on('state-change', ({ current }) => {
      setGameState(current);
    });

    // Update listener - sync state
    engine.on('update', (state) => {
      setGameState(state);
    });

    // Enemy defeated - handled by renderer death effect
    engine.on('enemy-defeated', () => {});

    // Game events for terminal/UI notifications
    engine.on('wave-started', (data) => {
      console.log(`[GameEngine] Wave ${data.wave} started`);
    });

    engine.on('wave-complete', (data) => {
      console.log(`[GameEngine] Wave ${data.wave} complete! Bonus: ${data.bonus}`);
    });

    engine.on('level-complete', (data) => {
      console.log(`[GameEngine] Level complete! Score: ${data.score}`);
    });

    engine.on('game-over', (data) => {
      console.log(`[GameEngine] Game over at wave ${data.wave}`);
    });
  }, []);

  /**
   * Start the render loop
   */
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

  /**
   * Stop the render loop
   */
  const stopRenderLoop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // ========================================================================
  // GAME ACTIONS
  // ========================================================================

  /**
   * Start a wave
   * @param {string} difficulty - Difficulty for wave 5
   */
  const startWave = useCallback((difficulty = 'normal') => {
    if (engineRef.current) {
      return engineRef.current.startWave(difficulty);
    }
    return false;
  }, []);

  /**
   * Place a tower
   * @param {string} type - Tower type
   * @param {{row: number, col: number}} position - Grid position
   */
  const placeTower = useCallback((type, position) => {
    if (engineRef.current) {
      const success = engineRef.current.placeTower(type, position);
      if (success) {
        setPlacementMode(false);
        setPlacementTowerType(null);
        if (rendererRef.current) {
          rendererRef.current.setPlacementMode(false, null);
        }
      }
      return success;
    }
    return false;
  }, []);

  /**
   * Upgrade a tower
   * @param {string} towerId - Tower ID
   */
  const upgradeTower = useCallback((towerId) => {
    if (engineRef.current) {
      return engineRef.current.upgradeTower(towerId);
    }
    return false;
  }, []);

  /**
   * Upgrade a tower's special ability
   * @param {string} towerId - Tower ID
   */
  const upgradeTowerSpecial = useCallback((towerId) => {
    if (engineRef.current) {
      return engineRef.current.upgradeTowerSpecial(towerId);
    }
    return false;
  }, []);

  /**
   * Sell a tower
   * @param {string} towerId - Tower ID
   */
  const sellTower = useCallback((towerId) => {
    if (engineRef.current) {
      const success = engineRef.current.sellTower(towerId);
      if (success && towerId === selectedTowerId) {
        setSelectedTowerId(null);
        if (rendererRef.current) {
          rendererRef.current.setSelectedTower(null);
        }
      }
      return success;
    }
    return false;
  }, [selectedTowerId]);

  /**
   * Reset the game
   */
  const resetGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setSelectedTowerId(null);
      setPlacementMode(false);
      setPlacementTowerType(null);
      if (rendererRef.current) {
        rendererRef.current.setSelectedTower(null);
        rendererRef.current.setPlacementMode(false, null);
      }
    }
  }, []);

  /**
   * Set game status
   * @param {string} status - New status
   */
  const setStatus = useCallback((status) => {
    if (engineRef.current) {
      engineRef.current.setStatus(status);
    }
  }, []);

  // ========================================================================
  // UI ACTIONS
  // ========================================================================

  /**
   * Enter tower placement mode
   * @param {string} towerType - Type of tower to place
   */
  const enterPlacementMode = useCallback((towerType) => {
    setPlacementMode(true);
    setPlacementTowerType(towerType);
    setSelectedTowerId(null);
    
    if (rendererRef.current) {
      rendererRef.current.setPlacementMode(true, towerType, 'tower');
      rendererRef.current.setSelectedTower(null);
    }
  }, []);

  /**
   * Exit tower placement mode
   */
  const exitPlacementMode = useCallback(() => {
    setPlacementMode(false);
    setPlacementTowerType(null);
    
    if (rendererRef.current) {
      rendererRef.current.setPlacementMode(false, null, 'tower');
    }
  }, []);

  /**
   * Select a tower
   * @param {string|null} towerId - Tower ID or null to deselect
   */
  const selectTower = useCallback((towerId) => {
    setSelectedTowerId(towerId);
    setPlacementMode(false);
    setPlacementTowerType(null);
    
    if (rendererRef.current) {
      rendererRef.current.setSelectedTower(towerId);
      rendererRef.current.setPlacementMode(false, null, 'tower');
    }
  }, []);

  /**
   * Handle canvas click
   * @param {MouseEvent} event - Click event
   */
  const handleCanvasClick = useCallback((event) => {
    if (!canvasRef.current || !rendererRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cell = rendererRef.current.getCellAtPosition(x, y);
    if (!cell) return;
    
    if (placementMode && placementTowerType) {
      // Place tower
      placeTower(placementTowerType, cell);
    } else {
      // Check for tower selection
      const tower = rendererRef.current.getTowerAtCell(gameState.towers, cell);
      if (tower) {
        selectTower(tower.id);
      } else {
        selectTower(null);
      }
    }
  }, [canvasRef, placementMode, placementTowerType, gameState.towers, placeTower, selectTower]);

  /**
   * Handle canvas mouse move
   * @param {MouseEvent} event - Mouse event
   */
  const handleCanvasMouseMove = useCallback((event) => {
    if (!canvasRef.current || !rendererRef.current) return;
    if (!placementMode || !placementTowerType) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    rendererRef.current.setHoveredCell(x, y);
  }, [canvasRef, placementMode, placementTowerType]);

  /**
   * Handle canvas mouse leave
   */
  const handleCanvasMouseLeave = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.clearHover();
    }
  }, []);

  // ========================================================================
  // LIFECYCLE
  // ========================================================================

  // Initialize with options when path changes
  useEffect(() => {
    if (options.pathNodes && options.pathNodes.length > 0) {
      initialize(options);
    }
  }, [options.pathNodes, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRenderLoop();
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      rendererRef.current = null;
    };
  }, [stopRenderLoop]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    gameState,
    isInitialized,
    selectedTowerId,
    placementMode,
    placementTowerType,
    
    // Game actions
    startWave,
    placeTower,
    upgradeTower,
    upgradeTowerSpecial,
    sellTower,
    resetGame,
    setStatus,
    
    // UI actions
    enterPlacementMode,
    exitPlacementMode,
    selectTower,
    
    // Event handlers
    handleCanvasClick,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    
    // Direct engine access (for advanced use)
    engine: engineRef.current,
    renderer: rendererRef.current,
    
    // Manual initialization
    initialize
  };
}

export default useGameEngine;
