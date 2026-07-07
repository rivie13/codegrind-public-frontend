export const registerEngineEventHandlers = ({
  engine,
  setGameState,
  setGameStateThrottled,
  handlerRef,
}) => {
  if (!engine) return;

  const getUiState = () => engine.getUiState?.() || engine.getState();

  engine.on('state-change', () => {
    setGameState(getUiState());
  });

  engine.on('update', (state) => {
    if (setGameStateThrottled) {
      setGameStateThrottled(state);
      return;
    }
    setGameState(state);
  });

  engine.on('wave-started', (data) => {
    handlerRef.current.onWaveStarted?.(data);
  });

  engine.on('enemy-spawned', (data) => {
    handlerRef.current.onEnemySpawned?.(data);
  });

  engine.on('enemy-defeated', (data) => {
    handlerRef.current.onEnemyDefeated?.(data);
  });

  engine.on('enemy-reached-end', (data) => {
    handlerRef.current.onEnemyReachedEnd?.(data);
  });

  engine.on('tower-upgraded', (data) => {
    handlerRef.current.onTowerUpgraded?.(data);
    setGameState(engine.getState());
  });

  engine.on('tower-placed', () => {
    setGameState(engine.getState());
  });

  engine.on('tower-special-upgraded', (data) => {
    handlerRef.current.onTowerSpecialUpgraded?.(data);
    setGameState(engine.getState());
  });

  engine.on('tower-sold', (data) => {
    handlerRef.current.onTowerSold?.(data);
    setGameState(engine.getState());
  });

  engine.on('wave-complete', (data) => {
    handlerRef.current.onWaveComplete?.(data);
  });

  engine.on('level-complete', (data) => {
    handlerRef.current.onLevelComplete?.(data);
  });

  engine.on('endless-mode-started', (data) => {
    handlerRef.current.onEndlessModeStarted?.(data);
  });

  engine.on('endless-wave-started', (data) => {
    handlerRef.current.onEndlessWaveStarted?.(data);
  });

  engine.on('endless-wave-complete', (data) => {
    handlerRef.current.onEndlessWaveComplete?.(data);
  });

  engine.on('game-over', (data) => {
    handlerRef.current.onGameOver?.(data);
  });

  engine.on('reset', () => {
    setGameState(engine.getState());
  });
};
