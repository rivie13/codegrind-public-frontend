import {
  getSpecialPresentation,
  getSpecialEffectDescription,
} from '../../components/towerDefense/data/specialEffectPresentation.js';

export const TD_PREVIEW_KIND = {
  COSMETIC: 'cosmetic',
  GAMEPLAY: 'gameplay',
};

export const TD_GAMEPLAY_DEMO_MODE = {
  BASELINE: 'baseline',
  SPECIAL_1: 'special-1',
  SPECIAL_2: 'special-2',
};

export const TD_GAMEPLAY_TOWER_POSITIONS = [
  // Deterministic open-cell layout: all towers visible at once, no path collisions.
  { type: 'Return', key: 'RETURN', row: 4, col: 2 },
  { type: 'Function', key: 'FUNCTION', row: 2, col: 5 },
  { type: 'IfCondition', key: 'IF_CONDITION', row: 1, col: 9 },
  { type: 'TryCatch', key: 'TRY_CATCH', row: 0, col: 10 },
  { type: 'Object', key: 'OBJECT', row: 7, col: 9 },
  { type: 'Switch', key: 'SWITCH', row: 4, col: 9 },
  // Variable aura cluster: Array + ForLoop should remain adjacent to Variable.
  { type: 'Array', key: 'ARRAY', row: 6, col: 9 },
  { type: 'Variable', key: 'VARIABLE', row: 7, col: 6 },
  { type: 'ForLoop', key: 'FOR_LOOP', row: 7, col: 7 },
  { type: 'WhileLoop', key: 'WHILE_LOOP', row: 7, col: 11 },
];

// Towers adjacent to Variable that receive the Special II aura buff.
// Shown in solo mode so the aura enhancement on their projectiles is visible.
export const VARIABLE_AURA_NEIGHBOR_KEYS = ['ARRAY', 'FOR_LOOP'];

// Pre-defined placement coordinates for each deployable in the gameplay preview.
// Path-type deployables use path cells; any-type use open non-path cells.
export const DEPLOYABLE_PREVIEW_POSITIONS = {
  DATA_MINE: { row: 5, col: 1 }, // path: row-5 cols 0-3
  ICE_TRAP: { row: 5, col: 2 }, // path: row-5 cols 0-3
  BANDWIDTH_THROTTLE: { row: 8, col: 5 }, // path: row-8 cols 3-8
  FIREWALL_SHARD: { row: 8, col: 7 }, // path: row-8 cols 3-8
  BUFFER_OVERFLOW: { row: 3, col: 4 }, // any:  not on path
  LOGIC_BOMB: { row: 6, col: 10 }, // any:  not on path
};

const toTowerKey = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const getSpecialTowerKeyFromPack = (pack) => {
  if (!pack) return null;

  const slugMatch = String(pack.storeSlug || '').match(/td\.upgrade\.([a-z0-9_]+)\.special[12]/i);
  if (slugMatch?.[1]) {
    return toTowerKey(slugMatch[1]);
  }

  const idMatch = String(pack.id || '').match(/^([a-z0-9_]+)-special-[12]$/i);
  if (idMatch?.[1]) {
    return toTowerKey(idMatch[1]);
  }

  return null;
};

export const getDeployableKeyFromPack = (pack) => {
  if (!pack) return null;
  const slugMatch = String(pack.storeSlug || '').match(/td\.deployable\.([a-z0-9_]+)/i);
  if (slugMatch?.[1]) {
    return toTowerKey(slugMatch[1]);
  }

  return toTowerKey(pack.id);
};

const formatSpecialEffect = (effect = {}) => {
  if (effect.multiTarget) {
    const mt = effect.multiTarget;
    return `Mode ${mt.mode}, +${mt.extraTargets || 0} targets, ${Math.round((mt.secondaryDamageMultiplier || 1) * 100)}% secondary damage`;
  }
  if (effect.execute) {
    return `Executes at ${Math.round((effect.execute.threshold || 0) * 100)}% HP with ${Math.round((effect.execute.chance || 0) * 100)}% chance`;
  }
  if (effect.aura) {
    return `Aura radius ${effect.aura.radius}, +${Math.round((effect.aura.damageMultiplier || 0) * 100)}% damage, +${Math.round((effect.aura.speedMultiplier || 0) * 100)}% speed`;
  }
  if (effect.typeDamageBonus) {
    const entries = Object.entries(effect.typeDamageBonus)
      .map(([enemy, bonus]) => `${enemy}: +${Math.round(bonus * 100)}%`)
      .join(', ');
    return `Type bonus ${entries}`;
  }
  if (effect.splash) {
    return `Splash radius ${effect.splash.radius}, ${Math.round((effect.splash.damageMultiplier || 0) * 100)}% splash damage`;
  }
  if (effect.field) {
    return `Lingering field radius ${effect.field.radius}, duration ${effect.field.duration}ms`;
  }
  if (effect.slow) {
    return `Slow to ${Math.round((effect.slow.factor || 1) * 100)}% for ${effect.slow.duration}ms`;
  }
  if (effect.delayedDamage) {
    return `Delayed damage ${Math.round((effect.delayedDamage.damageMultiplier || 0) * 100)}% after ${effect.delayedDamage.delayMs}ms`;
  }
  if (effect.logicField) {
    return `Corruption field ${effect.logicField.duration}ms, execute under ${Math.round((effect.logicField.executeThreshold || 0) * 100)}% HP`;
  }
  if (effect.rangeBonus || effect.damageMultiplier) {
    const parts = [];
    if (effect.rangeBonus) parts.push(`+${effect.rangeBonus} range`);
    if (effect.damageMultiplier)
      parts.push(`+${Math.round(effect.damageMultiplier * 100)}% damage`);
    return parts.join(', ');
  }
  if (effect.speedMultiplier) {
    return `+${Math.round(effect.speedMultiplier * 100)}% attack speed`;
  }

  return 'Special effect active';
};

export const getSpecialUpgradeInfo = (pack, towerTypes) => {
  const towerKey = getSpecialTowerKeyFromPack(pack);
  if (!towerKey || !towerTypes?.[towerKey]) return null;

  const tower = towerTypes[towerKey];
  const tier = Number(pack?.tier || (String(pack?.storeSlug).includes('special2') ? 2 : 1));
  const specialData = tower.specialUpgrades?.[tier - 1] || null;
  const specialEffect = tower.specialEffects?.[tier - 1] || null;

  // Prefer presentation config description; fall back to towerTypes effect string
  const presentation = getSpecialPresentation(towerKey, tier);
  const effectText = presentation?.description || specialData?.effect || 'Special unlock';
  // details = raw technical dump always available for programmatic consumers
  const details = specialEffect ? formatSpecialEffect(specialEffect) : null;

  return {
    towerKey,
    towerName: tower.type,
    tier,
    name: specialData?.name || pack?.name,
    effectText,
    baseCost: tower.specialUpgradeCosts?.[tier - 1] ?? null,
    details,
    visualTag: presentation?.visualTag ?? null,
    combatTextColor: presentation?.combatTextColor ?? null,
  };
};

export const getDeployableInfo = (pack, deployableTypes) => {
  if (!pack) return null;

  if (pack.defaultUnlocked && !pack.storeSlug) {
    return {
      title: pack.name,
      defaultUnlocked: true,
      description: pack.description,
      cost: 0,
    };
  }

  const deployableKey = getDeployableKeyFromPack(pack);
  const canonical = deployableTypes?.[deployableKey];
  if (!canonical) {
    return {
      title: pack.name,
      defaultUnlocked: Boolean(pack.defaultUnlocked),
      description: pack.description,
      cost: Number(pack.priceDataPackets || 0),
    };
  }

  return {
    title: canonical.type,
    defaultUnlocked: Boolean(pack.defaultUnlocked),
    description: canonical.description,
    placementType: canonical.placementType,
    trigger: canonical.trigger,
    effect: canonical.effect,
    damage: canonical.damage ?? null,
    percentDamage: canonical.percentDamage ?? null,
    executeThreshold: canonical.executeThreshold ?? null,
    radius: canonical.radius ?? null,
    duration: canonical.duration ?? null,
    uses: canonical.uses ?? null,
    inMatchCost: canonical.cost ?? null,
    unlockCost: Number(pack.priceDataPackets || 0),
  };
};

export const getSpecialLevelForDemo = (mode) => {
  if (mode === TD_GAMEPLAY_DEMO_MODE.SPECIAL_2) return 2;
  if (mode === TD_GAMEPLAY_DEMO_MODE.SPECIAL_1) return 1;
  return 0;
};

export const getMainCodePreviewTowers = () => TD_GAMEPLAY_TOWER_POSITIONS;

// Re-export for consumers that need the presentation config directly
export { getSpecialPresentation, getSpecialEffectDescription };
