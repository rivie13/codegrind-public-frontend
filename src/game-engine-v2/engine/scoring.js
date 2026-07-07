export function calculateScore(engine, solutionSuccess = false) {
  const { GAME_CONSTANTS } = engine;
  const livesScore = engine.state.lives * GAME_CONSTANTS.SCORE_PER_LIFE;
  const creditsScore = Math.floor(engine.state.credits / 10) * GAME_CONSTANTS.SCORE_PER_10_CREDITS;

  const timeSeconds = engine.totalGameTime / 1000;
  const timeBonus = Math.max(0, Math.floor(
    GAME_CONSTANTS.TIME_BONUS_BASE - (timeSeconds * GAME_CONSTANTS.TIME_PENALTY_PER_SECOND)
  ));

  const solutionBonus = solutionSuccess ? GAME_CONSTANTS.SOLUTION_BONUS : 0;

  return livesScore + creditsScore + timeBonus + solutionBonus;
}

export function calculateEndlessWaveBonus(_engine, endlessWave) {
  const { ENDLESS_SCORING } = _engine;
  const waveClearBonus = endlessWave * ENDLESS_SCORING.WAVE_CLEAR_BONUS;
  const waveMultiplierBonus = (endlessWave * (endlessWave - 1) / 2) * ENDLESS_SCORING.WAVE_MULTIPLIER;
  return Math.floor(waveClearBonus + waveMultiplierBonus);
}

export function addEndlessScore(engine, points) {
  if (!points || points <= 0) return;
  engine.state.score += points;
  engine.state.endlessScore += points;
}

export function getEndlessSurvivalTime(engine) {
  if (!engine.endlessStartTime) return 0;
  return Math.max(0, Date.now() - engine.endlessStartTime);
}

export function applyEndlessSurvivalBonus(engine) {
  if (engine.endlessSurvivalBonusApplied) return;
  const survivalTime = getEndlessSurvivalTime(engine);
  const survivalBonus = Math.floor(survivalTime / 60000) * engine.ENDLESS_SCORING.SURVIVAL_BONUS_PER_MINUTE;

  addEndlessScore(engine, survivalBonus);
  engine.endlessSurvivalBonusApplied = true;
  engine.state.endlessSurvivalTime = survivalTime;
}
