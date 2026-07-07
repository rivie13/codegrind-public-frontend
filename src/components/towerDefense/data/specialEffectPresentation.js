/**
 * Centralized presentation config for tower special upgrade effects.
 *
 * Each entry maps: towerKey → tier (1 or 2) → presentation metadata.
 * Used by the store preview, upgrade panel, and any UI that shows effect copy.
 *
 * Fields:
 *   label        — short display name (matches specialUpgrades[n].name)
 *   description  — human-readable effect summary for store/UI copy
 *   visualTag    — semantic tag describing the renderer overlay type
 *   combatTextColor — hex color used for related combat text spawns
 *   projectileOverlay — renderer overlay identifier string
 */
export const SPECIAL_EFFECT_PRESENTATION = {
  FOR_LOOP: {
    1: {
      label: 'Extra Iteration',
      description: 'Sweeps 1 extra target in sequence — 85% damage on follow-up shot',
      visualTag: 'multi-sequence',
      combatTextColor: '#00FF00',
      projectileOverlay: 'for-loop-multi',
    },
    2: {
      label: 'Nested Loop',
      description: 'Sweeps 2 extra targets in sequence — staggered 75% damage falloff',
      visualTag: 'multi-sequence-heavy',
      combatTextColor: '#00FF00',
      projectileOverlay: 'for-loop-multi',
    },
  },

  WHILE_LOOP: {
    1: {
      label: 'Focused Pierce',
      description:
        'Laser punches through — extends to hit 1 more enemy in sequence (80% secondary damage). Each shot deals 8% less damage to compensate for the extra hit.',
      visualTag: 'beam-pierce',
      combatTextColor: '#00FFCC',
      projectileOverlay: 'while-loop-pierce',
    },
    2: {
      label: 'Arc Discharge',
      description:
        'After the primary hit, the beam arcs to 2 more nearby enemies as chained lasers (72% chain damage). An additional 6% damage reduction keeps the spread in check.',
      visualTag: 'chain-arc',
      combatTextColor: '#00FFCC',
      projectileOverlay: 'while-loop-arc',
    },
  },

  IF_CONDITION: {
    1: {
      label: 'Additional Branch',
      description: 'Forks a second shot to the weakest visible target at 60% damage',
      visualTag: 'fork',
      combatTextColor: '#FF9900',
      projectileOverlay: 'if-condition-fork',
    },
    2: {
      label: 'elif Statement',
      description: '+35% bonus damage against edge and time-limit enemy types',
      visualTag: 'type-bonus',
      combatTextColor: '#FF9900',
      projectileOverlay: null,
    },
  },

  RETURN: {
    1: {
      label: 'Early Return',
      description: 'Execute ring overlay — 30% chance to execute enemies below 35% HP',
      visualTag: 'execute-ring',
      combatTextColor: '#ffd166',
      projectileOverlay: 'return-execute',
    },
    2: {
      label: 'Chain Return',
      description: 'Chains to a nearby enemy after primary hit — 80% secondary damage',
      visualTag: 'chain',
      combatTextColor: '#ffd166',
      projectileOverlay: 'return-chain',
    },
  },

  FUNCTION: {
    1: {
      label: 'Recursive Call',
      description: 'Delayed second strike at 50% damage after 600ms',
      visualTag: 'delayed-damage',
      combatTextColor: '#7B68EE',
      projectileOverlay: 'function-delay',
    },
    2: {
      label: 'Higher Order',
      description: 'Grants a splash burst on hit — 70% damage within 1.5 cell radius',
      visualTag: 'splash',
      combatTextColor: '#7B68EE',
      projectileOverlay: 'function-splash',
    },
  },

  ARRAY: {
    1: {
      label: 'Spread Operator',
      description: 'Splash burst on impact — 60% damage within 1 cell radius',
      visualTag: 'splash',
      combatTextColor: '#00BFFF',
      projectileOverlay: 'array-splash',
    },
    2: {
      label: 'Array Sort',
      description: 'Targets the highest-health enemy, dealing 90% splash damage in 1.5 cell radius',
      visualTag: 'splash-heavy',
      combatTextColor: '#00BFFF',
      projectileOverlay: 'array-splash',
    },
  },

  OBJECT: {
    1: {
      label: 'Property Access',
      description: 'Leaves a lingering damage field at the impact site (1.5 cell radius, 2.5s)',
      visualTag: 'damage-field',
      combatTextColor: '#FF6B6B',
      projectileOverlay: 'object-field',
    },
    2: {
      label: 'Object Freeze',
      description: 'Slows targets to 45% speed for 1.8 seconds after each hit',
      visualTag: 'slow',
      combatTextColor: '#00ffff',
      projectileOverlay: 'object-slow',
    },
  },

  VARIABLE: {
    1: {
      label: 'Type Casting',
      description: 'Targets the lowest-health enemy for precision strikes',
      visualTag: 'targeting',
      combatTextColor: '#c084fc',
      projectileOverlay: null,
    },
    2: {
      label: 'Global Scope',
      description: 'Aura: nearby towers deal +30% damage and attack 20% faster (radius 2.5)',
      visualTag: 'aura',
      combatTextColor: '#c084fc',
      projectileOverlay: 'variable-aura',
    },
  },

  TRY_CATCH: {
    1: {
      label: 'Retry Logic',
      description: '+25% bonus damage against bug and exploit enemy types',
      visualTag: 'type-bonus',
      combatTextColor: '#22d3ee',
      projectileOverlay: null,
    },
    2: {
      label: 'Finally Block',
      description: 'Adds a slow field on impact — targets slowed to 55% speed for 2 seconds',
      visualTag: 'slow-field',
      combatTextColor: '#22d3ee',
      projectileOverlay: 'try-catch-slow',
    },
  },

  SWITCH: {
    1: {
      label: 'Case Match',
      description: 'Fires a piercing shot that passes through up to 3 enemies in a line',
      visualTag: 'pierce',
      combatTextColor: '#FFD700',
      projectileOverlay: 'switch-pierce',
    },
    2: {
      label: 'Default Fallback',
      description: 'Adds 1 extra burst round — fires 2 shots per attack cycle',
      visualTag: 'burst',
      combatTextColor: '#FFD700',
      projectileOverlay: 'switch-burst',
    },
  },
};

/**
 * Get presentation metadata for a specific tower and special tier.
 * @param {string} towerKey - e.g. 'WHILE_LOOP', 'FOR_LOOP'
 * @param {number} tier - 1 or 2
 * @returns {{ label, description, visualTag, combatTextColor, projectileOverlay } | null}
 */
export function getSpecialPresentation(towerKey, tier) {
  return SPECIAL_EFFECT_PRESENTATION[towerKey]?.[tier] ?? null;
}

/**
 * Get a short human-readable effect description for a special tier.
 * Falls back to a generic message if no entry is configured.
 * @param {string} towerKey
 * @param {number} tier
 * @returns {string}
 */
export function getSpecialEffectDescription(towerKey, tier) {
  return getSpecialPresentation(towerKey, tier)?.description ?? 'Special effect active';
}
