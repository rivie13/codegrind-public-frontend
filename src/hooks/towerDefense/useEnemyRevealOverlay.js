/**
 * useEnemyRevealOverlay.js — Progressive enemy reveal system.
 *
 * Tracks which enemy types the player has encountered across their LP journey
 * (persisted in localStorage). When a wave introduces an enemy type the player
 * hasn't seen before, an overlay is queued so the UI can display an intel
 * briefing before the wave starts.
 *
 * Trigger points:
 *   - PREHACK / READY  (wave === 1) → check wave-1 enemies
 *   - WAVE_COMPLETE     (wave N)     → check wave-(N+1) enemies
 *
 * Works in all game modes (learning, standalone, demo, endless).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WAVE_DEFINITIONS, ENEMY_TYPES } from '../../game-engine-v2/constants.js';
import {
  filterWaveDefinitionByPlayerLevel,
  normalizePlayerLevel,
} from '../../game-engine-v2/enemyProgression.js';

const STORAGE_KEY = 'codegrind_seen_enemy_types';

// ── Cyberpunk enemy dossiers ──────────────────────────────────────────
const ENEMY_DOSSIERS = {
  basic: {
    codename: 'Security Daemon',
    threat: 'Low',
    description: 'Standard-issue ICE patrol. Moderate health, moderate speed, no tricks.',
    tactic: 'Any tower handles these. Good for warming up your defences.',
  },
  edge: {
    codename: 'Edge-Case Scanner',
    threat: 'Low-Med',
    description: 'Fast, lightweight recon unit. Low health but hard to track.',
    tactic: 'Place towers with fast fire-rate near chokepoints. Do not let speed fool you.',
  },
  complex: {
    codename: 'Black ICE Construct',
    threat: 'Medium',
    description: 'Heavy-armoured enforcement node. High HP, slow crawl.',
    tactic: 'Stack high-damage towers. Sustained DPS beats burst here.',
  },
  timeLimit: {
    codename: 'Neural Hunter',
    threat: 'High',
    description: 'Blazing-fast interceptor that ignores slow and freeze effects.',
    tactic: 'Raw damage is your only option — crowd-control will not work.',
  },
  hijacker: {
    codename: 'System Hijacker',
    threat: 'High',
    description: 'Seizes the nearest tower and disables it until eliminated.',
    tactic: 'Keep tower placement spread out. Focus fire before it reaches your lines.',
  },
  spaceComplex: {
    codename: 'Elite ICE Construct',
    threat: 'Very High',
    description: 'Massive, heavily armoured fortress. Extremely slow but nearly indestructible.',
    tactic: 'Combine every tower you have. Prioritise upgrades before this wave.',
  },
  buffer: {
    codename: 'Aura Buffer Node',
    threat: 'Very High',
    description: 'Support unit that speeds up and toughens all nearby enemies in its aura.',
    tactic: 'Eliminate the buffer FIRST to strip the bonus from its allies.',
  },
  pathShaper: {
    codename: 'Path Shaper',
    threat: 'High',
    description: 'If it reaches the end, the path permanently shortens by 10%.',
    tactic: 'Never let this one leak. Place splash damage at the last stretch.',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────

/** Load seen types from localStorage */
function loadSeenTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Persist seen types to localStorage */
function saveSeenTypes(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Storage full or unavailable — silent
  }
}

function markTypesAsSeen(enemyTypes, seenSet) {
  let didChange = false;

  for (const enemyType of enemyTypes) {
    if (seenSet.has(enemyType)) continue;
    seenSet.add(enemyType);
    didChange = true;
  }

  if (didChange) {
    saveSeenTypes(seenSet);
  }
}

/** Get distinct enemy types for a given wave number after level gating. */
function getEnemyTypesForWave(wave, playerLevel) {
  const maxKey = Math.max(...Object.keys(WAVE_DEFINITIONS).map(Number));
  const key = Math.min(wave, maxKey);
  const baseDefinition = WAVE_DEFINITIONS[key];
  const def = filterWaveDefinitionByPlayerLevel(baseDefinition, playerLevel);
  if (!def) return [];
  return [...new Set(def.map((g) => g.type))];
}

/** Build a rich dossier entry for an enemy type string */
function buildRevealEntry(type) {
  const def = Object.values(ENEMY_TYPES).find((e) => e.type === type);
  const dossier = ENEMY_DOSSIERS[type] || {};
  return {
    type,
    codename: dossier.codename || type,
    color: def?.color || '#FF3366',
    size: def?.size || 16,
    shape: def?.shape || 'circle',
    health: def?.health || 0,
    speed: def?.speed || 0,
    reward: def?.reward || 0,
    description: dossier.description || def?.description || '',
    tactic: dossier.tactic || '',
    threat: dossier.threat || 'Unknown',
    special: def?.special || null,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────

/**
 * @param {Object}  gameState          - { status, wave, totalWaves }
 * @param {number}  playerLevel        - Current player level for progression gating
 * @param {boolean} disabled           - Skip all processing (e.g. during onboarding)
 * @returns {{
 *   activeEnemyReveal: { waveNumber: number, enemies: Array } | null,
 *   dismissEnemyReveal: Function,
 *   isEnemyRevealActive: boolean
 * }}
 */
export default function useEnemyRevealOverlay({ gameState, playerLevel = 1, disabled = false }) {
  const [activeReveal, setActiveReveal] = useState(null);
  const seenRef = useRef(loadSeenTypes());
  const lastCheckedWaveKey = useRef('');
  const dismissedForWaveKey = useRef('');
  const normalizedLevel = useMemo(() => normalizePlayerLevel(playerLevel), [playerLevel]);

  // Determine the "upcoming wave" from the current game status
  const upcomingWave = useMemo(() => {
    if (disabled) return -1;
    const { status, wave } = gameState || {};
    if (status === 'prehack' || status === 'ready') return wave || 1;
    if (status === 'wave-complete') return (wave || 0) + 1;
    return -1;
  }, [disabled, gameState?.status, gameState?.wave]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for new enemy types when the upcoming wave changes
  useEffect(() => {
    if (upcomingWave < 1) return;
    const waveKey = `${upcomingWave}:${normalizedLevel}`;
    if (waveKey === lastCheckedWaveKey.current) return;
    if (waveKey === dismissedForWaveKey.current) return;

    lastCheckedWaveKey.current = waveKey;

    const typesInWave = getEnemyTypesForWave(upcomingWave, normalizedLevel);
    const newTypes = typesInWave.filter((t) => !seenRef.current.has(t));

    if (!newTypes.length) return;

    // Mark reveals as seen the first time they are surfaced so remounts or route
    // changes cannot reopen intel the player already encountered.
    markTypesAsSeen(newTypes, seenRef.current);

    const enemies = newTypes.map(buildRevealEntry);

    setActiveReveal({ waveNumber: upcomingWave, enemies, playerLevel: normalizedLevel });
  }, [normalizedLevel, upcomingWave]);

  // Dismiss handler — mark types as seen, persist
  const dismissEnemyReveal = useCallback(() => {
    if (activeReveal) {
      const revealLevel = normalizePlayerLevel(activeReveal.playerLevel ?? normalizedLevel);
      dismissedForWaveKey.current = `${activeReveal.waveNumber}:${revealLevel}`;
    }
    setActiveReveal(null);
  }, [activeReveal, normalizedLevel]);

  return {
    activeEnemyReveal: activeReveal,
    dismissEnemyReveal,
    isEnemyRevealActive: activeReveal !== null,
  };
}
