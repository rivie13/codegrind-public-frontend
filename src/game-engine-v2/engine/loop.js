export function update(engine, deltaTime) {
  const currentTime = Date.now();
  engine.currentTime = currentTime;

  engine._stateDirty = true;

  engine.spawnEnemies(currentTime);
  engine.updateEnemies(deltaTime);
  engine.updateDeployables(deltaTime, currentTime);
  engine.applyDelayedDamage(currentTime);
  engine.updateDamageFields(currentTime);
  engine.updateTowers(currentTime);
  engine.updateProjectiles(deltaTime);
  engine.updateCombatText(currentTime);
  engine.checkWaveStatus();
  if (
    !engine._lastUiUpdateTime ||
    currentTime - engine._lastUiUpdateTime >= engine.uiUpdateIntervalMs
  ) {
    engine._lastUiUpdateTime = currentTime;
    engine.emit('update', engine.getUiState());
  }
}
