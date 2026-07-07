import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkWaveStatus,
  gameOver,
  generateEndlessWave,
  levelComplete,
  startEndlessMode,
  startWave,
} from './wave';

const buildEngine = () => {
  const engine = {
    GAME_STATUS: {
      PREHACK: 'prehack',
      READY: 'ready',
      PLAYING: 'playing',
      WAVE_COMPLETE: 'wave-complete',
      LEVEL_COMPLETE: 'level-complete',
      GAME_OVER: 'game-over',
    },
    GAME_CONSTANTS: {
      WAVE_BONUS_BASE: 40,
      WAVE_BONUS_PER_WAVE: 8,
      WAVE_BONUS_MULTIPLIER: 1.5,
    },
    state: {
      status: 'ready',
      wave: 1,
      enemiesInWave: 0,
      credits: 120,
      score: 450,
      lives: 9,
      enemiesDefeated: 4,
      endlessScore: 0,
      endlessSurvivalTime: 0,
    },
    waveGenerator: {
      generateWaveQueue: vi.fn((wave, difficulty) => [
        { id: `w${wave}-1`, difficulty },
        { id: `w${wave}-2`, difficulty },
      ]),
    },
    updateState: vi.fn((patch) => {
      engine.state = { ...engine.state, ...patch };
    }),
    emit: vi.fn(),
    start: vi.fn(() => {
      engine.isRunning = true;
    }),
    stop: vi.fn(() => {
      engine.isRunning = false;
    }),
    calculateScore: vi.fn(() => 777),
    calculateEndlessWaveBonus: vi.fn(() => 75),
    addEndlessScore: vi.fn((bonus) => {
      engine.state.score += bonus;
      engine.state.endlessScore += bonus;
    }),
    generateEndlessWave: vi.fn((wave) => [{ type: 'basic', wave }]),
    levelComplete: vi.fn(),
    applyEndlessSurvivalBonus: vi.fn(),
    enemyQueue: [],
    enemies: [],
    projectiles: [],
    pendingAttacks: [],
    impacts: [],
    isRunning: false,
    isEndlessMode: false,
    endlessWave: 1,
    totalWaves: 5,
    gameStartTime: null,
    waveStartTime: null,
    waveDifficulty: 'normal',
    endlessDifficulty: 'normal',
    endlessTuning: 'default',
    playerLevel: 1,
    endlessStartScore: 0,
    endlessBossesKilled: 0,
    endlessStartTime: null,
    endlessSurvivalBonusApplied: false,
    gameSettings: {
      enemyHealthMultiplier: 1,
      enemySpeedMultiplier: 1,
    },
    solutionSuccess: false,
  };

  return engine;
};

describe('engine/wave', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts waves only from valid statuses and initializes wave state', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const engine = buildEngine();
    engine.state.status = engine.GAME_STATUS.READY;

    const started = startWave(engine, 'hard');

    expect(started).toBe(true);
    expect(engine.waveDifficulty).toBe('hard');
    expect(engine.waveStartTime).toBe(1_000);
    expect(engine.gameStartTime).toBe(1_000);
    expect(engine.waveGenerator.generateWaveQueue).toHaveBeenCalledWith(1, 'hard');
    expect(engine.state.enemiesInWave).toBe(2);
    expect(engine.updateState).toHaveBeenCalledWith({ status: engine.GAME_STATUS.PLAYING });
    expect(engine.emit).toHaveBeenCalledWith(
      'wave-started',
      expect.objectContaining({ wave: 1, difficulty: 'hard', enemyCount: 2 })
    );
    expect(engine.start).toHaveBeenCalledTimes(1);
  });

  it('does not start a wave from terminal statuses', () => {
    const engine = buildEngine();
    engine.state.status = engine.GAME_STATUS.GAME_OVER;

    const started = startWave(engine, 'normal');

    expect(started).toBe(false);
    expect(engine.waveGenerator.generateWaveQueue).not.toHaveBeenCalled();
    expect(engine.updateState).not.toHaveBeenCalled();
  });

  it('handles endless wave completion by awarding score and queueing next endless wave', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2_500);
    const engine = buildEngine();
    engine.state.status = engine.GAME_STATUS.PLAYING;
    engine.isEndlessMode = true;
    engine.endlessWave = 3;

    checkWaveStatus(engine);

    expect(engine.calculateEndlessWaveBonus).toHaveBeenCalledWith(3);
    expect(engine.addEndlessScore).toHaveBeenCalledWith(75);
    expect(engine.endlessWave).toBe(4);
    expect(engine.generateEndlessWave).toHaveBeenCalledWith(4);
    expect(engine.state.enemiesInWave).toBe(1);
    expect(engine.updateState).toHaveBeenCalledWith({ endlessWave: 4, enemiesInWave: 1 });
    expect(engine.emit).toHaveBeenCalledWith(
      'endless-wave-complete',
      expect.objectContaining({ wave: 3, bonus: 75 })
    );
    expect(engine.emit).toHaveBeenCalledWith(
      'endless-wave-started',
      expect.objectContaining({ wave: 4, enemyCount: 1 })
    );
  });

  it('awards wave bonus and advances to next wave when level is not finished', () => {
    const engine = buildEngine();
    engine.state.status = engine.GAME_STATUS.PLAYING;
    engine.state.wave = 2;

    checkWaveStatus(engine);

    const expectedBonus = Math.ceil((40 + 2 * 8) * 1.5);
    expect(engine.state.credits).toBe(120 + expectedBonus);
    expect(engine.state.wave).toBe(3);
    expect(engine.updateState).toHaveBeenCalledWith({ status: engine.GAME_STATUS.WAVE_COMPLETE });
    expect(engine.waveGenerator.generateWaveQueue).toHaveBeenCalledWith(3, 'normal');
    expect(engine.state.enemiesInWave).toBe(2);
  });

  it('clears transient effects and calls levelComplete on the final wave', () => {
    const engine = buildEngine();
    engine.state.status = engine.GAME_STATUS.PLAYING;
    engine.state.wave = 5;
    engine.projectiles = [{ id: 'p' }];
    engine.pendingAttacks = [{ id: 'a' }];
    engine.impacts = [{ id: 'i' }];

    checkWaveStatus(engine);

    expect(engine.projectiles).toEqual([]);
    expect(engine.pendingAttacks).toEqual([]);
    expect(engine.impacts).toEqual([]);
    expect(engine.levelComplete).toHaveBeenCalledTimes(1);
    expect(engine.emit).toHaveBeenCalledWith(
      'wave-complete',
      expect.objectContaining({ wave: 5, credits: expect.any(Number) })
    );
  });

  it('finalizes level completion state and emits summary stats', () => {
    const engine = buildEngine();
    engine.gameStartTime = 1_000;
    vi.spyOn(Date, 'now').mockReturnValue(5_250);

    levelComplete(engine);

    expect(engine.stop).toHaveBeenCalledTimes(1);
    expect(engine.totalGameTime).toBe(4_250);
    expect(engine.calculateScore).toHaveBeenCalledWith(false);
    expect(engine.updateState).toHaveBeenCalledWith({
      status: engine.GAME_STATUS.LEVEL_COMPLETE,
      score: 777,
    });
    expect(engine.emit).toHaveBeenCalledWith(
      'level-complete',
      expect.objectContaining({ score: 777, lives: 9, credits: 120, time: 4_250 })
    );
  });

  it('passes solutionSuccess=true to calculateScore when engine.solutionSuccess is set', () => {
    const engine = buildEngine();
    engine.solutionSuccess = true;
    engine.gameStartTime = 1_000;
    vi.spyOn(Date, 'now').mockReturnValue(5_250);

    levelComplete(engine);

    expect(engine.calculateScore).toHaveBeenCalledWith(true);
  });

  it('handles game over for endless and non-endless runs', () => {
    const engine = buildEngine();
    engine.isEndlessMode = true;
    engine.endlessWave = 7;
    engine.state.enemiesDefeated = 16;

    gameOver(engine);

    expect(engine.stop).toHaveBeenCalledTimes(1);
    expect(engine.applyEndlessSurvivalBonus).toHaveBeenCalledTimes(1);
    expect(engine.updateState).toHaveBeenCalledWith({
      status: engine.GAME_STATUS.GAME_OVER,
      lives: 0,
    });
    expect(engine.emit).toHaveBeenCalledWith(
      'game-over',
      expect.objectContaining({
        wave: 1,
        enemiesDefeated: 16,
        isEndlessMode: true,
        endlessWave: 7,
      })
    );
  });

  it('starts endless mode with expected defaults and emits startup events', () => {
    vi.spyOn(Date, 'now').mockReturnValue(9_000);
    const engine = buildEngine();

    expect(startEndlessMode(engine)).toBe(false);

    const started = startEndlessMode(engine, {
      force: true,
      difficulty: 'nightmare',
      startingWave: 0,
      tuning: 'victory',
    });

    expect(started).toBe(true);
    expect(engine.isEndlessMode).toBe(true);
    expect(engine.endlessDifficulty).toBe('nightmare');
    expect(engine.endlessTuning).toBe('default');
    expect(engine.endlessWave).toBe(1);
    expect(engine.endlessStartScore).toBe(450);
    expect(engine.generateEndlessWave).toHaveBeenCalledWith(1);
    expect(engine.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        status: engine.GAME_STATUS.PLAYING,
        isEndlessMode: true,
        endlessWave: 1,
      })
    );
    expect(engine.emit).toHaveBeenCalledWith(
      'endless-mode-started',
      expect.objectContaining({ wave: 1, enemyCount: 1, scoreStart: 450 })
    );
    expect(engine.emit).toHaveBeenCalledWith(
      'endless-wave-started',
      expect.objectContaining({ wave: 1, enemyCount: 1 })
    );
    expect(engine.start).toHaveBeenCalledTimes(1);
  });

  it('generates endless waves with scaling and periodic boss spawns', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = buildEngine();
    engine.endlessDifficulty = 'normal';
    engine.endlessTuning = 'default';
    engine.gameSettings = { enemyHealthMultiplier: 1.2, enemySpeedMultiplier: 1.1 };
    engine.playerLevel = 1;

    const regular = generateEndlessWave(engine, 4);
    const bossWave = generateEndlessWave(engine, 5);

    expect(regular.length).toBeGreaterThan(0);
    expect(regular.every((enemy) => enemy.isEndless === true)).toBe(true);
    expect(regular.every((enemy) => enemy.wave === 4)).toBe(true);
    expect(regular.every((enemy) => enemy.type === 'basic')).toBe(true);

    const boss = bossWave.find((enemy) => enemy.isBoss);
    expect(boss).toBeTruthy();
    expect(boss.wave).toBe(5);
    expect(boss.healthMultiplier).toBeGreaterThan(regular[0].healthMultiplier);
    expect(boss.type).toBe('basic');

    const victoryTunedEngine = {
      ...engine,
      endlessTuning: 'victory',
    };
    const victoryWave = generateEndlessWave(victoryTunedEngine, 6);
    expect(victoryWave.length).toBeLessThan(generateEndlessWave(engine, 6).length);

    randomSpy.mockReturnValue(0.999);
    const highLevelEngine = {
      ...engine,
      playerLevel: 15,
    };
    const highLevelWave = generateEndlessWave(highLevelEngine, 4);
    expect(highLevelWave.some((enemy) => enemy.type === 'pathShaper')).toBe(true);

    randomSpy.mockRestore();
  });
});
