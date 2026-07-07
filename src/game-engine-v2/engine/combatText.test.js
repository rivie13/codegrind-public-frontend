import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCombatText, spawnCombatText, spawnDeployablePopup } from './combatText.js';

function makeEngine(overrides = {}) {
  return {
    combatText: [],
    combatTextCooldowns: new Map(),
    cellSize: 40,
    ...overrides,
  };
}

describe('updateCombatText', () => {
  it('does nothing when combatText is empty', () => {
    const engine = makeEngine();
    updateCombatText(engine, Date.now());
    expect(engine.combatText).toHaveLength(0);
  });

  it('removes expired combat text entries', () => {
    const now = Date.now();
    const engine = makeEngine({
      combatText: [
        { createdAt: now - 1000, duration: 700, text: 'old' },
        { createdAt: now - 100, duration: 700, text: 'fresh' },
      ],
    });
    updateCombatText(engine, now);
    expect(engine.combatText).toHaveLength(1);
    expect(engine.combatText[0].text).toBe('fresh');
  });

  it('keeps entries within their custom duration', () => {
    const now = Date.now();
    const engine = makeEngine({
      combatText: [{ createdAt: now - 500, duration: 1000, text: 'longLasting' }],
    });
    updateCombatText(engine, now);
    expect(engine.combatText).toHaveLength(1);
  });

  it('removes entries that exceed default 700ms duration when no duration specified', () => {
    const now = Date.now();
    const engine = makeEngine({
      combatText: [
        { createdAt: now - 800, text: 'expired' }, // no duration, defaults to 700
      ],
    });
    updateCombatText(engine, now);
    expect(engine.combatText).toHaveLength(0);
  });
});

describe('spawnCombatText', () => {
  it('does nothing for missing entry', () => {
    const engine = makeEngine();
    spawnCombatText(engine, null);
    expect(engine.combatText).toHaveLength(0);
  });

  it('does nothing when x or y are not finite', () => {
    const engine = makeEngine();
    spawnCombatText(engine, { x: NaN, y: 10, text: 'dmg' });
    spawnCombatText(engine, { x: 10, y: Infinity, text: 'dmg' });
    expect(engine.combatText).toHaveLength(0);
  });

  it('does nothing when text is falsy', () => {
    const engine = makeEngine();
    spawnCombatText(engine, { x: 10, y: 10, text: '' });
    expect(engine.combatText).toHaveLength(0);
  });

  it('spawns a combat text entry with required fields', () => {
    const engine = makeEngine();
    spawnCombatText(engine, { x: 100, y: 200, text: '-50', color: '#ff0000', type: 'damage' });
    expect(engine.combatText).toHaveLength(1);
    const entry = engine.combatText[0];
    expect(entry.text).toBe('-50');
    expect(entry.x).toBe(100);
    expect(entry.y).toBe(200);
    expect(entry.color).toBe('#ff0000');
    expect(entry.type).toBe('damage');
    expect(entry.id).toMatch(/^ct-/);
    expect(entry.createdAt).toBeTypeOf('number');
  });

  it('defaults type to damage and duration to 700', () => {
    const engine = makeEngine();
    spawnCombatText(engine, { x: 10, y: 10, text: '-10' });
    const entry = engine.combatText[0];
    expect(entry.type).toBe('damage');
    expect(entry.duration).toBe(700);
  });

  it('respects cooldown key — skips if called again within cooldownMs', () => {
    const engine = makeEngine();
    const entry = { x: 10, y: 10, text: '-5' };
    spawnCombatText(engine, entry, { cooldownKey: 'tower-1', cooldownMs: 500 });
    expect(engine.combatText).toHaveLength(1);
    spawnCombatText(engine, entry, { cooldownKey: 'tower-1', cooldownMs: 500 });
    expect(engine.combatText).toHaveLength(1); // second call blocked by cooldown
  });

  it('caps combatText entries at 80 by shifting the oldest', () => {
    const engine = makeEngine();
    for (let i = 0; i < 85; i++) {
      spawnCombatText(engine, { x: i, y: i, text: `${i}` });
    }
    expect(engine.combatText).toHaveLength(80);
  });

  it('uses provided driftX when given', () => {
    const engine = makeEngine();
    spawnCombatText(engine, { x: 10, y: 10, text: 'hit', driftX: 99 });
    expect(engine.combatText[0].driftX).toBe(99);
  });

  it('uses provided scale', () => {
    const engine = makeEngine();
    spawnCombatText(engine, { x: 10, y: 10, text: 'hit', scale: 2 });
    expect(engine.combatText[0].scale).toBe(2);
  });
});

describe('spawnDeployablePopup', () => {
  it('does nothing for null deployable', () => {
    const engine = makeEngine();
    spawnDeployablePopup(engine, null, Date.now());
    expect(engine.combatText).toHaveLength(0);
  });

  it('spawns a status popup for a known effect', () => {
    const engine = makeEngine();
    const deployable = {
      id: 'd1',
      effect: 'freeze',
      color: '#00ffff',
      getCenter: () => ({ x: 50, y: 60 }),
    };
    spawnDeployablePopup(engine, deployable, Date.now());
    expect(engine.combatText).toHaveLength(1);
    expect(engine.combatText[0].text).toBe('ICE');
    expect(engine.combatText[0].type).toBe('status');
  });

  it('uses PING for unknown effect', () => {
    const engine = makeEngine();
    const deployable = {
      id: 'd2',
      effect: 'unknown',
      getCenter: () => ({ x: 0, y: 0 }),
    };
    spawnDeployablePopup(engine, deployable, Date.now());
    expect(engine.combatText[0].text).toBe('PING');
  });

  it('maps all known effects to correct labels', () => {
    const effectMap = {
      damage: 'BOOM',
      percentDamage: 'BOOM',
      freeze: 'ICE',
      slow: 'GLITCH',
      block: 'LOCK',
      execute: 'EXEC',
    };
    for (const [effect, label] of Object.entries(effectMap)) {
      const engine = makeEngine();
      const deployable = {
        id: `d-${effect}`,
        effect,
        getCenter: () => ({ x: 0, y: 0 }),
      };
      spawnDeployablePopup(engine, deployable, Date.now());
      expect(engine.combatText[0].text).toBe(label);
    }
  });
});
