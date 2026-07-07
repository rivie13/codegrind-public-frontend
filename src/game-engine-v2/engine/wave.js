import { getUnlockedEnemyTypesForLevel } from '../enemyProgression.js';

export function startWave(engine, difficulty = 'normal') {
  if (
    engine.state.status !== engine.GAME_STATUS.PREHACK &&
    engine.state.status !== engine.GAME_STATUS.READY &&
    engine.state.status !== engine.GAME_STATUS.WAVE_COMPLETE
  ) {
    return false;
  }

  if (engine.state.wave === 1 && !engine.gameStartTime) {
    engine.gameStartTime = Date.now();
  }

  engine.waveDifficulty = difficulty;
  engine.waveStartTime = Date.now();

  engine.enemyQueue = engine.waveGenerator.generateWaveQueue(engine.state.wave, difficulty);
  engine.state.enemiesInWave = engine.enemyQueue.length;

  engine.updateState({ status: engine.GAME_STATUS.PLAYING });

  engine.emit('wave-started', {
    wave: engine.state.wave,
    difficulty: difficulty,
    enemyCount: engine.state.enemiesInWave,
  });

  if (!engine.isRunning) {
    engine.start();
  }

  return true;
}

export function checkWaveStatus(engine) {
  if (engine.state.status !== engine.GAME_STATUS.PLAYING) return;
  if (engine.enemyQueue.length > 0 || engine.enemies.length > 0) return;

  if (engine.isEndlessMode) {
    const completedEndlessWave = engine.endlessWave || 1;
    const endlessBonus = engine.calculateEndlessWaveBonus(completedEndlessWave);
    engine.addEndlessScore(endlessBonus);

    engine.emit('endless-wave-complete', {
      wave: completedEndlessWave,
      bonus: endlessBonus,
      credits: engine.state.credits,
      score: engine.state.score,
      endlessScore: engine.state.endlessScore,
    });

    engine.endlessWave += 1;
    engine.waveStartTime = Date.now();
    engine.enemyQueue = engine.generateEndlessWave(engine.endlessWave);
    engine.state.enemiesInWave = engine.enemyQueue.length;

    engine.updateState({
      endlessWave: engine.endlessWave,
      enemiesInWave: engine.state.enemiesInWave,
    });

    engine.emit('endless-wave-started', {
      wave: engine.endlessWave,
      enemyCount: engine.state.enemiesInWave,
    });

    return;
  }

  const completedWave = engine.state.wave;

  if (engine.projectiles.length > 0) {
    engine.projectiles = [];
  }
  if (engine.pendingAttacks.length > 0) {
    engine.pendingAttacks = [];
  }
  if (engine.impacts.length > 0) {
    engine.impacts = [];
  }

  const bonus = Math.ceil(
    (engine.GAME_CONSTANTS.WAVE_BONUS_BASE +
      completedWave * engine.GAME_CONSTANTS.WAVE_BONUS_PER_WAVE) *
      engine.GAME_CONSTANTS.WAVE_BONUS_MULTIPLIER
  );
  engine.state.credits += bonus;

  engine.emit('wave-complete', {
    wave: completedWave,
    bonus: bonus,
    credits: engine.state.credits,
  });

  if (completedWave >= engine.totalWaves) {
    engine.levelComplete();
  } else {
    engine.state.wave++;
    engine.updateState({ status: engine.GAME_STATUS.WAVE_COMPLETE });

    engine.enemyQueue = engine.waveGenerator.generateWaveQueue(
      engine.state.wave,
      engine.waveDifficulty
    );
    engine.state.enemiesInWave = engine.enemyQueue.length;
  }
}

export function levelComplete(engine) {
  engine.stop();

  engine.totalGameTime = Date.now() - (engine.gameStartTime || Date.now());
  const score = engine.calculateScore(engine.solutionSuccess);

  engine.updateState({
    status: engine.GAME_STATUS.LEVEL_COMPLETE,
    score: score,
  });

  engine.emit('level-complete', {
    score: score,
    lives: engine.state.lives,
    credits: engine.state.credits,
    time: engine.totalGameTime,
  });
}

export function gameOver(engine) {
  engine.stop();

  if (engine.isEndlessMode) {
    engine.applyEndlessSurvivalBonus();
  }

  engine.updateState({
    status: engine.GAME_STATUS.GAME_OVER,
    lives: 0,
  });

  engine.emit('game-over', {
    wave: engine.state.wave,
    enemiesDefeated: engine.state.enemiesDefeated,
    isEndlessMode: engine.isEndlessMode,
    endlessWave: engine.endlessWave,
    endlessScore: engine.state.endlessScore,
    totalScore: engine.state.score,
    endlessSurvivalTime: engine.state.endlessSurvivalTime,
  });
}

export function startEndlessMode(engine, options = {}) {
  const { force = false, difficulty = 'normal', startingWave = 1, tuning = 'default' } = options;

  if (engine.state.status !== engine.GAME_STATUS.LEVEL_COMPLETE && !force) {
    return false;
  }

  engine.isEndlessMode = true;
  engine.endlessDifficulty = difficulty || 'normal';
  engine.endlessTuning = difficulty === 'nightmare' ? 'default' : tuning;
  engine.endlessWave = Math.max(1, startingWave);
  engine.endlessStartScore = engine.state.score || 0;
  engine.endlessBossesKilled = 0;
  engine.endlessStartTime = Date.now();
  engine.endlessSurvivalBonusApplied = false;

  engine.waveStartTime = Date.now();
  engine.enemyQueue = engine.generateEndlessWave(engine.endlessWave);
  engine.state.enemiesInWave = engine.enemyQueue.length;

  engine.updateState({
    status: engine.GAME_STATUS.PLAYING,
    isEndlessMode: true,
    endlessWave: engine.endlessWave,
    endlessScore: 0,
    endlessBossesKilled: 0,
    enemiesInWave: engine.state.enemiesInWave,
  });

  engine.emit('endless-mode-started', {
    wave: engine.endlessWave,
    enemyCount: engine.state.enemiesInWave,
    scoreStart: engine.endlessStartScore,
    difficulty: engine.endlessDifficulty,
  });

  engine.emit('endless-wave-started', {
    wave: engine.endlessWave,
    enemyCount: engine.state.enemiesInWave,
  });

  if (!engine.isRunning) {
    engine.start();
  }

  return true;
}

export function generateEndlessWave(engine, endlessWaveNum) {
  const baseWave = 5;
  const difficulty = engine.endlessDifficulty || 'normal';
  const isVictoryTuning = engine.endlessTuning === 'victory' && difficulty !== 'nightmare';
  const nightmareScale = difficulty === 'nightmare' ? 1.35 : 1;
  const nightmareSpeed = difficulty === 'nightmare' ? 1.15 : 1;
  const nightmareCount = difficulty === 'nightmare' ? 1.25 : 1;

  const scaleFactor = (1 + endlessWaveNum * (isVictoryTuning ? 0.035 : 0.05)) * nightmareScale;
  const healthMultiplier = scaleFactor * (engine.gameSettings.enemyHealthMultiplier || 1);
  const speedMultiplier =
    (1 + endlessWaveNum * (isVictoryTuning ? 0.015 : 0.02)) *
    (engine.gameSettings.enemySpeedMultiplier || 1) *
    nightmareSpeed;
  const enemies = [];
  const baseCount = Math.round(
    (28 + Math.floor(endlessWaveNum * (isVictoryTuning ? 1.5 : 2))) *
      nightmareCount *
      (isVictoryTuning ? 0.85 : 1)
  );
  const allTypes = [
    'basic',
    'edge',
    'complex',
    'timeLimit',
    'spaceComplex',
    'hijacker',
    'buffer',
    'pathShaper',
  ];
  const unlockedTypes = getUnlockedEnemyTypesForLevel(
    engine.playerLevel ?? engine.state?.playerLevel ?? 1
  );
  const types = allTypes.filter((type) => unlockedTypes.includes(type));
  const spawnTypes = types.length ? types : ['basic'];
  const spawnSpacing =
    (difficulty === 'nightmare' ? 700 : isVictoryTuning ? 950 : 800) / scaleFactor;

  for (let i = 0; i < baseCount; i++) {
    const type = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];
    enemies.push({
      type,
      spawnTime: i * spawnSpacing,
      healthMultiplier,
      speedMultiplier,
      isEndless: true,
      baseWave,
      wave: endlessWaveNum,
    });
  }

  if (endlessWaveNum % 5 === 0) {
    // Prefer the classic endless boss when unlocked; otherwise fallback to a tanky unlocked type.
    const bossType = spawnTypes.includes('spaceComplex')
      ? 'spaceComplex'
      : spawnTypes.includes('complex')
        ? 'complex'
        : 'basic';

    enemies.push({
      type: bossType,
      spawnTime: enemies.length * spawnSpacing,
      healthMultiplier: healthMultiplier * (difficulty === 'nightmare' ? 3.6 : 3),
      speedMultiplier: speedMultiplier * (difficulty === 'nightmare' ? 0.8 : 0.7),
      isBoss: true,
      isEndless: true,
      baseWave,
      wave: endlessWaveNum,
    });
  }

  return enemies;
}
