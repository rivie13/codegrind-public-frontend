export function applyDelayedDamage(engine, currentTime) {
  if (!engine.delayedDamage.length) return;

  for (let i = engine.delayedDamage.length - 1; i >= 0; i--) {
    const entry = engine.delayedDamage[i];
    if (currentTime < entry.applyAt) continue;

    const target = engine.enemies.find(e => e.id === entry.targetId);
    if (target && target.isActive) {
      const killed = target.takeDamage(entry.damage);
      const color = entry.color || '#ff66cc';
      engine.spawnCombatText({
        x: target.x,
        y: target.y,
        text: `-${Math.round(entry.damage)}`,
        color,
        type: 'damage'
      }, { cooldownKey: `delayed-${entry.targetId}-${entry.sourceTowerId}`, cooldownMs: 200 });

      if (killed) {
        engine.emit('enemy-killed', {
          enemy: target.getState(),
          tower: engine.towers.find(t => t.id === entry.sourceTowerId)?.getState()
        });
      }
    }

    engine.delayedDamage.splice(i, 1);
  }
}

export function updateDamageFields(engine, currentTime) {
  if (!engine.damageFields.length) return;

  for (let i = engine.damageFields.length - 1; i >= 0; i--) {
    const field = engine.damageFields[i];
    if (currentTime >= field.endTime) {
      engine.damageFields.splice(i, 1);
      continue;
    }

    if (currentTime < field.nextTickAt) continue;
    field.nextTickAt = currentTime + field.tickMs;

    for (const enemy of engine.enemies) {
      if (!enemy.isActive) continue;
      const dx = enemy.x - field.x;
      const dy = enemy.y - field.y;
      if (Math.sqrt(dx * dx + dy * dy) > field.radius) continue;

      const killed = enemy.takeDamage(field.damagePerTick);
      engine.spawnCombatText({
        x: enemy.x,
        y: enemy.y,
        text: `-${Math.round(field.damagePerTick)}`,
        color: field.color || '#ffdd00',
        type: 'damage'
      }, { cooldownKey: `field-${field.id}-${enemy.id}`, cooldownMs: 260 });

      if (killed) {
        engine.emit('enemy-killed', {
          enemy: enemy.getState(),
          tower: engine.towers.find(t => t.id === field.sourceTowerId)?.getState()
        });
      }
    }
  }
}
