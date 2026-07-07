export function updateCombatText(engine, now) {
  if (!engine.combatText.length) return;
  engine.combatText = engine.combatText.filter(item => {
    const duration = item.duration || 700;
    return now - item.createdAt < duration;
  });
}

export function spawnCombatText(engine, entry, options = {}) {
  if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) return;
  if (!entry.text) return;

  const now = Date.now();
  const { cooldownKey, cooldownMs = 0 } = options;

  if (cooldownKey) {
    const lastTime = engine.combatTextCooldowns.get(cooldownKey) || 0;
    if (now - lastTime < cooldownMs) return;
    engine.combatTextCooldowns.set(cooldownKey, now);
  }

  const drift = (Math.random() - 0.5) * engine.cellSize * 0.4;
  const maxEntries = 80;
  if (engine.combatText.length >= maxEntries) {
    engine.combatText.shift();
  }

  engine.combatText.push({
    id: `ct-${now}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    duration: entry.duration || 700,
    x: entry.x,
    y: entry.y,
    text: entry.text,
    color: entry.color,
    type: entry.type || 'damage',
    driftX: entry.driftX ?? drift,
    scale: entry.scale || 1
  });
}

export function spawnDeployablePopup(engine, deployable, now) {
  if (!deployable) return;
  const center = deployable.getCenter(engine.cellSize);
  const textMap = {
    damage: 'BOOM',
    percentDamage: 'BOOM',
    freeze: 'ICE',
    slow: 'GLITCH',
    block: 'LOCK',
    execute: 'EXEC'
  };
  const text = textMap[deployable.effect] || 'PING';
  spawnCombatText(engine, {
    x: center.x,
    y: center.y,
    text,
    color: deployable.color || '#ff4dd2',
    type: 'status',
    duration: 800,
    scale: 1.2
  }, { cooldownKey: `deployable-${deployable.id}-trigger`, cooldownMs: 500 });
}
