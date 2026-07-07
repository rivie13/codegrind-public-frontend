/**
 * useGuestProgress.js - Tracks guest activity in localStorage for the funnel.
 *
 * Stores a JSON blob of progress milestones so that:
 * 1. Guests see continuity across page loads
 * 2. The signup CTA can show what they'd lose ("You've solved 3 problems!")
 * 3. On signup, the blob can be POST'd to a migration endpoint
 *
 * Progress is keyed by `codegrind_guest_progress` in localStorage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getUnlockedOrderedSlugs,
  isOrderedSlugUnlocked,
} from '../../utils/progression/orderedUnlocks';
import { resolvePlayerCharacterId } from '../../player-character/playerCharacterPresets';
import { fetchWithError } from '../../services/api/fetcher';
import { normalizeCityMissionState } from '../../utils/navigation/cityStoryState';
import { readStorage, removeStorageItem, writeStorage } from '../../utils/web/storage';
import { normalizeLearningPathId } from '../../utils/navigation/learningPathUtils';

const STORAGE_KEY = 'codegrind_guest_progress';
const PATH_CHOICES = new Set(['beginner', 'pro']);

const getLearningPathIdForNodeId = (nodeId) => {
  if (!nodeId) return null;
  const value = String(nodeId).toLowerCase();
  if (value.startsWith('py-')) return 'python-path';
  if (value.startsWith('js-')) return 'javascript-path';
  if (value.startsWith('java-')) return 'java-path';
  if (value.startsWith('cpp-')) return 'cpp-path';
  return null;
};

const getLearningPathIdForSlug = (slug) => {
  if (!slug) return null;
  const value = String(slug).trim().toLowerCase();
  if (!value || GUEST_SHARED_PRE_CHOICE_SLUGS.has(value)) return null;
  if (value.startsWith('lp-js-')) return 'javascript-path';
  if (value.startsWith('lp-java-')) return 'java-path';
  if (value.startsWith('lp-cpp-')) return 'cpp-path';
  if (value.startsWith('lp-')) return 'python-path';
  return null;
};

/** Maximum free solved problems before signup wall */
export const GUEST_CLUSTER_TRIAL_CANONICAL_SLUGS = Object.freeze([
  'hello-world',
  'decrypt-neural-frequency-pair',
  'trace-rogue-daemon-instances',
]);

const GUEST_CLUSTER_TRIAL_CANONICAL_BY_SLUG = new Map([
  ['two-sum', 'decrypt-neural-frequency-pair'],
  ['contains-duplicate', 'trace-rogue-daemon-instances'],
]);

export const GUEST_CLUSTER_TRIAL_PROBLEM_LIMIT = GUEST_CLUSTER_TRIAL_CANONICAL_SLUGS.length;
export const GUEST_FREE_PROBLEM_LIMIT = GUEST_CLUSTER_TRIAL_PROBLEM_LIMIT;

export const GUEST_CLUSTER_TRIAL_PROBLEM_SLUGS = Object.freeze([
  ...GUEST_CLUSTER_TRIAL_CANONICAL_SLUGS,
  ...GUEST_CLUSTER_TRIAL_CANONICAL_BY_SLUG.keys(),
]);

const GUEST_LEARNING_TRIAL_CANONICAL_SLUGS = Object.freeze([
  'lp-m0-td-hello-print',
  'lp-m0-td-addition',
  'lp-m0-td-variables',
  'lp-m0-final-two-lines',
]);

const GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JS = Object.freeze([
  'lp-js-m0-td-hello-print',
  'lp-js-m0-td-addition',
  'lp-js-m0-td-variables',
  'lp-js-m0-final-two-lines',
]);

const GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JAVA = Object.freeze([
  'lp-java-m0-td-hello-print',
  'lp-java-m0-td-addition',
  'lp-java-m0-td-variables',
  'lp-java-m0-final-two-lines',
]);

const GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_CPP = Object.freeze([
  'lp-cpp-m0-td-hello-print',
  'lp-cpp-m0-td-addition',
  'lp-cpp-m0-td-variables',
  'lp-cpp-m0-final-two-lines',
]);

export const GUEST_LEARNING_TRIAL_PROBLEM_SLUGS = Object.freeze([
  ...GUEST_LEARNING_TRIAL_CANONICAL_SLUGS,
  ...GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JS,
  ...GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JAVA,
  ...GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_CPP,
  // Legacy aliases kept for backwards-compatible links.
  'lp-hello-print',
  'lp-m0-hello-print',
]);

export const GUEST_LEARNING_TRIAL_PROBLEM_LIMIT = GUEST_LEARNING_TRIAL_CANONICAL_SLUGS.length;

const GUEST_CLUSTER_TRIAL_SLUG_SET = new Set(GUEST_CLUSTER_TRIAL_PROBLEM_SLUGS);
const GUEST_CLUSTER_TRIAL_CANONICAL_SET = new Set(GUEST_CLUSTER_TRIAL_CANONICAL_SLUGS);
const GUEST_LEARNING_TRIAL_SLUG_SET = new Set(GUEST_LEARNING_TRIAL_PROBLEM_SLUGS);
const GUEST_LEARNING_TRIAL_CANONICAL_BY_SLUG = new Map([
  ['lp-hello-print', 'lp-m0-td-hello-print'],
  ['lp-m0-hello-print', 'lp-m0-td-hello-print'],
]);

// Shared slugs are available before explicit track selection and must not
// auto-lock a guest into beginner/pro or a language path.
const GUEST_SHARED_PRE_CHOICE_SLUGS = new Set([
  'hello-world',
  'lp-m0-td-hello-print',
  'lp-hello-print',
  'lp-m0-hello-print',
]);

const GUEST_SHARED_PRE_CHOICE_NODE_IDS = new Set(['py-m0-tower-hello']);

const isSharedPreChoiceLearningNodeId = (nodeId) => {
  if (!nodeId) return false;
  return GUEST_SHARED_PRE_CHOICE_NODE_IDS.has(String(nodeId).trim().toLowerCase());
};

const LEARNING_TRIAL_CANONICAL_BY_PATH = Object.freeze({
  'python-path': GUEST_LEARNING_TRIAL_CANONICAL_SLUGS,
  'javascript-path': GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JS,
  'java-path': GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JAVA,
  'cpp-path': GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_CPP,
});

const LEARNING_TRIAL_CANONICAL_SET_BY_PATH = Object.freeze({
  'python-path': new Set(GUEST_LEARNING_TRIAL_CANONICAL_SLUGS),
  'javascript-path': new Set(GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JS),
  'java-path': new Set(GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_JAVA),
  'cpp-path': new Set(GUEST_LEARNING_TRIAL_CANONICAL_SLUGS_CPP),
});

// Map slug prefix to the correct ordered canonical list for that language.
const LANGUAGE_CANONICAL_LISTS = [
  { prefix: 'lp-js-', pathId: 'javascript-path' },
  { prefix: 'lp-java-', pathId: 'java-path' },
  { prefix: 'lp-cpp-', pathId: 'cpp-path' },
];

const getLearningPathIdForTrialSlug = (slug) => {
  if (!slug) return 'python-path';
  for (const { prefix, pathId } of LANGUAGE_CANONICAL_LISTS) {
    if (slug.startsWith(prefix)) return pathId;
  }
  return 'python-path';
};

const getCanonicalListForPath = (pathId = 'python-path') =>
  LEARNING_TRIAL_CANONICAL_BY_PATH[pathId] || LEARNING_TRIAL_CANONICAL_BY_PATH['python-path'];

const getCanonicalSetForPath = (pathId = 'python-path') =>
  LEARNING_TRIAL_CANONICAL_SET_BY_PATH[pathId] ||
  LEARNING_TRIAL_CANONICAL_SET_BY_PATH['python-path'];

const normalizeLearningTrialCanonicalSlug = (slug, pathId = 'python-path') => {
  if (!slug) return null;
  const normalizedSlug = String(slug).trim().toLowerCase();

  if (pathId === 'python-path') {
    // hello-world is the home-page demo that stands in for the first
    // python learning trial mission (py-m0-tower-hello redirects to home).
    if (normalizedSlug === 'hello-world') return 'lp-m0-td-hello-print';
    const canonical = GUEST_LEARNING_TRIAL_CANONICAL_BY_SLUG.get(normalizedSlug) || normalizedSlug;
    return getCanonicalSetForPath('python-path').has(canonical) ? canonical : null;
  }

  return getCanonicalSetForPath(pathId).has(normalizedSlug) ? normalizedSlug : null;
};

const getSolvedLearningTrialCanonicalSlugs = (solvedSlugs, pathId = 'python-path') => {
  if (!Array.isArray(solvedSlugs) || solvedSlugs.length === 0) return [];
  const solvedCanonical = new Set();
  const canonicalSet = getCanonicalSetForPath(pathId);
  for (const slug of solvedSlugs) {
    const canonical = normalizeLearningTrialCanonicalSlug(slug, pathId);
    if (canonical && canonicalSet.has(canonical)) {
      solvedCanonical.add(canonical);
    }
  }
  return Array.from(solvedCanonical);
};

const normalizeClusterTrialCanonicalSlug = (slug) => {
  if (!slug) return null;
  const normalizedSlug = String(slug).trim().toLowerCase();
  if (!normalizedSlug) return null;
  if (
    normalizedSlug === 'lp-m0-td-hello-print' ||
    normalizedSlug === 'lp-hello-print' ||
    normalizedSlug === 'lp-m0-hello-print'
  ) {
    return 'hello-world';
  }
  if (GUEST_CLUSTER_TRIAL_CANONICAL_SET.has(normalizedSlug)) return normalizedSlug;
  return GUEST_CLUSTER_TRIAL_CANONICAL_BY_SLUG.get(normalizedSlug) || null;
};

const getSolvedClusterTrialCanonicalSlugs = (solvedSlugs) => {
  if (!Array.isArray(solvedSlugs) || solvedSlugs.length === 0) return [];
  const solvedCanonical = new Set();
  for (const slug of solvedSlugs) {
    const canonical = normalizeClusterTrialCanonicalSlug(slug);
    if (canonical) solvedCanonical.add(canonical);
  }
  return Array.from(solvedCanonical);
};

export const getGuestClusterTrialUnlockedSlugs = (solvedSlugs) =>
  getUnlockedOrderedSlugs(
    GUEST_CLUSTER_TRIAL_CANONICAL_SLUGS,
    getSolvedClusterTrialCanonicalSlugs(solvedSlugs)
  );

export const isGuestClusterTrialProblemUnlocked = (slug, solvedSlugs) => {
  const canonical = normalizeClusterTrialCanonicalSlug(slug);
  if (!canonical) return false;
  return isOrderedSlugUnlocked(
    GUEST_CLUSTER_TRIAL_CANONICAL_SLUGS,
    canonical,
    getSolvedClusterTrialCanonicalSlugs(solvedSlugs)
  );
};

export const getGuestLearningTrialUnlockedCanonicalSlugs = (
  solvedSlugs,
  pathId = 'python-path'
) => {
  const solvedCanonical = getSolvedLearningTrialCanonicalSlugs(solvedSlugs, pathId);
  return getUnlockedOrderedSlugs(getCanonicalListForPath(pathId), solvedCanonical);
};

export const isGuestLearningTrialProblemUnlocked = (slug, solvedSlugs) => {
  const pathId = getLearningPathIdForTrialSlug(slug);
  const canonical = normalizeLearningTrialCanonicalSlug(slug, pathId);
  if (!canonical) return false;
  const solvedCanonical = getSolvedLearningTrialCanonicalSlugs(solvedSlugs, pathId);
  const unlockedCanonical = getUnlockedOrderedSlugs(
    getCanonicalListForPath(pathId),
    solvedCanonical
  );
  return unlockedCanonical.includes(canonical);
};

const countSolvedLearningTrialProblems = (solvedSlugs, pathId = 'python-path') => {
  return getSolvedLearningTrialCanonicalSlugs(solvedSlugs, pathId).length;
};

const countSolvedClusterTrialProblems = (solvedSlugs) => {
  return getSolvedClusterTrialCanonicalSlugs(solvedSlugs).length;
};

const getTrialTrackForSlug = (slug) => {
  if (GUEST_SHARED_PRE_CHOICE_SLUGS.has(slug)) return null;
  if (GUEST_CLUSTER_TRIAL_SLUG_SET.has(slug)) return 'pro';
  if (GUEST_LEARNING_TRIAL_SLUG_SET.has(slug)) return 'beginner';
  return null;
};

export const GUEST_XP_CONFIG = Object.freeze({
  base: 150,
  linear: 45,
  quadratic: 18,
});

const GUEST_ROLE_TIERS = [
  { name: 'Greenhorn', minLevel: 0, maxLevel: 2 },
  { name: 'Script Kiddie', minLevel: 3, maxLevel: 7 },
  { name: 'Debugger', minLevel: 8, maxLevel: 14 },
  { name: 'Stack Whisperer', minLevel: 15, maxLevel: 24 },
  { name: 'Code Alchemist', minLevel: 25, maxLevel: 34 },
  { name: 'Refactor Mage', minLevel: 35, maxLevel: 49 },
  { name: 'System Architect', minLevel: 50, maxLevel: 69 },
  { name: 'CodeGrind Champ', minLevel: 70, maxLevel: null },
];

export const GUEST_XP_REWARDS = Object.freeze({
  demo_completed: 60,
  problem_solved_easy: 50,
  problem_solved_medium: 80,
  problem_solved_hard: 120,
  guest_achievement_hello_codegrind: 20,
  guest_achievement_first_blood: 25,
  guest_achievement_triple_threat: 40,
});

/** Multiplier applied to repeat solves / demo replays (matches backend 0.25x) */
export const GUEST_REPEAT_XP_MULTIPLIER = 0.25;

/** Mirrors backend learning-path node XP awards by node type. */
export const GUEST_LEARNING_PATH_NODE_XP = Object.freeze({
  learn: 10,
  workspace: 40,
  tower: 60,
  final: 80,
});

/** Multiplier applied to repeated learning-path node completions (backend parity). */
export const GUEST_LEARNING_PATH_REPEAT_XP_MULTIPLIER = 0.25;

export const GUEST_ACHIEVEMENTS = Object.freeze({
  'hello-codegrind': {
    id: 'hello-codegrind',
    title: 'Hello CodeGrind',
    description: 'Cleared the homepage onboarding demo.',
    xpBonusReason: 'guest_achievement_hello_codegrind',
  },
  'first-blood': {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Solved your first problem as a guest.',
    xpBonusReason: 'guest_achievement_first_blood',
  },
  'triple-threat': {
    id: 'triple-threat',
    title: 'Triple Threat',
    description: 'Solved 3 guest-trial problems.',
    xpBonusReason: 'guest_achievement_triple_threat',
  },
});

const GUEST_ACHIEVEMENT_IDS = new Set(Object.keys(GUEST_ACHIEVEMENTS));
const GUEST_ACHIEVEMENT_ORDER = Object.freeze(['hello-codegrind', 'first-blood', 'triple-threat']);
const GUEST_SOLVE_REASON_PATTERN = /^problem_solved_(easy|medium|hard)$/;

const emptyProgress = () => ({
  /** ISO timestamp of first guest activity */
  firstSeen: null,
  /** Demo (Hello World TD) completed? */
  demoCompleted: false,
  /** ISO timestamp when demo was completed */
  demoCompletedAt: null,
  /** Guest-selected path from homepage modal */
  pathChoice: null,
  /** Guest-selected learning path for the beginner trial */
  trialLearningPath: null,
  /** ISO timestamp when path was selected */
  pathChosenAt: null,
  /** Guest-selected player character preset for the city preview */
  selectedPlayerCharacterId: null,
  /** Durable city route mission snapshot for guest city resume */
  cityMissionState: null,
  /** Slugs of problems the guest has attempted */
  problemsAttempted: [],
  /** Slugs of problems the guest has solved */
  problemsSolved: [],
  /** LP node IDs the guest has started */
  lpNodesStarted: [],
  /** LP node IDs the guest has completed */
  lpNodesCompleted: [],
  /** Number of TD games completed (any mode) */
  tdGamesPlayed: 0,
  /** Total code executions run */
  codeExecutions: 0,
  /** Cluster IDs the guest has browsed */
  clustersBrowsed: [],
  /** Guest XP total (local preview state before signup) */
  xp: 0,
  /** Earned guest achievement IDs */
  guestAchievements: [],
  /** Rolling history of XP events for recap UI */
  xpEvents: [],
  /** Persisted guest Data Packets earned (server authoritative) */
  guestDataPacketsEarned: 0,
});

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  const cleaned = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || cleaned.includes(trimmed)) continue;
    cleaned.push(trimmed);
  }
  return cleaned;
}

function mergeUniqueStrings(primary, secondary) {
  const next = normalizeStringArray(primary);
  const seen = new Set(next);
  for (const item of normalizeStringArray(secondary)) {
    if (seen.has(item)) continue;
    seen.add(item);
    next.push(item);
  }
  return next;
}

function arraysEqual(left, right) {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function normalizeCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.floor(numeric);
}

function normalizeSelectedPlayerCharacterId(value) {
  if (typeof value !== 'string') return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const resolvedValue = resolvePlayerCharacterId(trimmedValue);
  return resolvedValue === trimmedValue ? resolvedValue : null;
}

function normalizeXp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}

function normalizeNonNegativeInt(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}

function normalizeGuestAchievements(value) {
  if (!Array.isArray(value)) return [];
  const cleaned = [];
  for (const item of value) {
    if (!GUEST_ACHIEVEMENT_IDS.has(item)) continue;
    if (!cleaned.includes(item)) cleaned.push(item);
  }
  return cleaned;
}

function normalizeXpEvents(value) {
  if (!Array.isArray(value)) return [];
  const cleaned = [];
  for (const event of value) {
    if (!event || typeof event !== 'object') continue;
    const reason = typeof event.reason === 'string' ? event.reason : null;
    const amount = normalizeCount(event.amount);
    if (!reason || amount <= 0) continue;
    cleaned.push({
      reason,
      amount,
      at: typeof event.at === 'string' ? event.at : new Date().toISOString(),
      context: event.context && typeof event.context === 'object' ? event.context : null,
    });
  }
  return cleaned.slice(-50);
}

const getCanonicalGuestTrialSlug = (slug) => {
  const clusterCanonical = normalizeClusterTrialCanonicalSlug(slug);
  if (clusterCanonical) return clusterCanonical;

  const learningPathId = getLearningPathIdForSlug(slug) || 'python-path';
  return normalizeLearningTrialCanonicalSlug(slug, learningPathId);
};

const buildGuestProblemIdentityKey = (slug) => {
  if (!slug) return null;

  const normalizedSlug = String(slug).trim().toLowerCase();
  if (!normalizedSlug) return null;

  const canonical = getCanonicalGuestTrialSlug(normalizedSlug);
  return canonical ? `trial:${canonical}` : `slug:${normalizedSlug}`;
};

const dedupeGuestProblemSlugArray = (value) => {
  const result = [];
  const seen = new Set();

  for (const slug of normalizeStringArray(value)) {
    const key = buildGuestProblemIdentityKey(slug);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(slug);
  }

  return result;
};

const hasGuestProblemSlug = (slugs, targetSlug) => {
  const targetKey = buildGuestProblemIdentityKey(targetSlug);
  if (!targetKey) return false;

  return normalizeStringArray(slugs).some(
    (slug) => buildGuestProblemIdentityKey(slug) === targetKey
  );
};

const getSolvedGuestTrialCanonicalSlugs = (solvedSlugs) => {
  if (!Array.isArray(solvedSlugs) || solvedSlugs.length === 0) return [];

  const solvedCanonical = new Set();
  for (const slug of solvedSlugs) {
    const canonical = getCanonicalGuestTrialSlug(slug);
    if (canonical) {
      solvedCanonical.add(canonical);
    }
  }

  return Array.from(solvedCanonical);
};

const hasGuestDemoCompletionEvidence = (progress) => {
  if (progress?.demoCompleted) return true;
  return hasGuestProblemSlug(progress?.problemsSolved, 'hello-world');
};

const getEligibleGuestAchievementIds = (progress) => {
  const eligible = [];
  const canonicalSolvedCount = getSolvedGuestTrialCanonicalSlugs(progress?.problemsSolved).length;

  if (hasGuestDemoCompletionEvidence(progress)) {
    eligible.push('hello-codegrind');
  }
  if (canonicalSolvedCount >= 1) {
    eligible.push('first-blood');
  }
  if (canonicalSolvedCount >= 3) {
    eligible.push('triple-threat');
  }

  return eligible;
};

const reconcileGuestXpEvents = (progress, rawXpEvents) => {
  const normalizedEvents = normalizeXpEvents(rawXpEvents);
  if (normalizedEvents.length === 0) {
    return normalizedEvents;
  }

  const retainedEvents = [];
  const retainedAchievementEvents = new Map();
  const seenSolveKeys = new Set();
  let keptDemoCompletion = false;

  for (const event of normalizedEvents) {
    if (event.reason === 'demo_completed') {
      if (keptDemoCompletion) continue;
      keptDemoCompletion = true;
      retainedEvents.push(event);
      continue;
    }

    const achievementId = Object.values(GUEST_ACHIEVEMENTS).find(
      (achievement) => achievement.xpBonusReason === event.reason
    )?.id;
    if (achievementId) {
      if (!retainedAchievementEvents.has(achievementId)) {
        retainedAchievementEvents.set(achievementId, event);
      }
      continue;
    }

    if (GUEST_SOLVE_REASON_PATTERN.test(event.reason)) {
      const solveKey = buildGuestProblemIdentityKey(event?.context?.slug);
      if (solveKey) {
        if (seenSolveKeys.has(solveKey)) continue;
        seenSolveKeys.add(solveKey);
      }
      retainedEvents.push(event);
      continue;
    }

    retainedEvents.push(event);
  }

  const eligibleAchievementIds = getEligibleGuestAchievementIds(progress);
  for (const achievementId of eligibleAchievementIds) {
    const existingEvent = retainedAchievementEvents.get(achievementId);
    if (existingEvent) {
      retainedEvents.push(existingEvent);
      continue;
    }

    const achievement = GUEST_ACHIEVEMENTS[achievementId];
    if (!achievement) continue;
    retainedEvents.push({
      reason: achievement.xpBonusReason,
      amount: GUEST_XP_REWARDS[achievement.xpBonusReason] || 0,
      at: new Date().toISOString(),
      context: { achievementId },
    });
  }

  return retainedEvents.slice(-50);
};

const reconcileGuestProgress = (progress) => {
  const next = {
    ...progress,
    cityMissionState: normalizeCityMissionState(progress?.cityMissionState),
    problemsAttempted: dedupeGuestProblemSlugArray(progress?.problemsAttempted),
    problemsSolved: dedupeGuestProblemSlugArray(progress?.problemsSolved),
    selectedPlayerCharacterId: normalizeSelectedPlayerCharacterId(
      progress?.selectedPlayerCharacterId
    ),
    lpNodesStarted: normalizeStringArray(progress?.lpNodesStarted),
    lpNodesCompleted: normalizeStringArray(progress?.lpNodesCompleted),
    clustersBrowsed: normalizeStringArray(progress?.clustersBrowsed),
    tdGamesPlayed: normalizeCount(progress?.tdGamesPlayed),
    codeExecutions: normalizeCount(progress?.codeExecutions),
  };

  const guestAchievements = GUEST_ACHIEVEMENT_ORDER.filter((id) =>
    getEligibleGuestAchievementIds(next).includes(id)
  );
  const xpEvents = reconcileGuestXpEvents(next, progress?.xpEvents);
  const hasXpHistory = xpEvents.length > 0;
  const xp = hasXpHistory
    ? xpEvents.reduce((sum, event) => sum + normalizeCount(event.amount), 0)
    : normalizeXp(progress?.xp);

  return {
    ...next,
    demoCompleted: hasGuestDemoCompletionEvidence(next),
    guestAchievements,
    xpEvents,
    xp,
  };
};

const getXpForNextLevel = (level) => {
  const step = Math.max(Number(level) - 1, 0);
  return (
    GUEST_XP_CONFIG.base + GUEST_XP_CONFIG.linear * step + GUEST_XP_CONFIG.quadratic * step * step
  );
};

const getTotalXpForLevel = (level) => {
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += getXpForNextLevel(current);
  }
  return total;
};

const calculateLevelFromXp = (totalXp) => {
  let computedLevel = 1;
  while (totalXp >= getTotalXpForLevel(computedLevel + 1)) {
    computedLevel += 1;
  }
  return computedLevel;
};

const getRoleNameForLevel = (level) => {
  const match = GUEST_ROLE_TIERS.find((tier) => {
    if (tier.maxLevel === null) return level >= tier.minLevel;
    return level >= tier.minLevel && level <= tier.maxLevel;
  });
  return match?.name || 'Greenhorn';
};

export const getGuestXpSummaryFromTotalXp = (totalXpValue) => {
  const totalXp = normalizeXp(totalXpValue);
  const level = calculateLevelFromXp(totalXp);
  const xpToNextLevel = getXpForNextLevel(level);
  const xpIntoLevel = Math.max(0, totalXp - getTotalXpForLevel(level));
  const cappedXpIntoLevel = xpToNextLevel > 0 ? Math.min(xpIntoLevel, xpToNextLevel) : 0;
  const progressPercent =
    xpToNextLevel > 0 ? Math.min(100, Math.round((cappedXpIntoLevel / xpToNextLevel) * 100)) : 0;

  return {
    xp: totalXp,
    level,
    roleName: getRoleNameForLevel(level),
    xpIntoLevel: cappedXpIntoLevel,
    xpToNextLevel,
    progressPercent,
    xpRemainingToNextLevel: Math.max(0, xpToNextLevel - cappedXpIntoLevel),
  };
};

const normalizeDifficulty = (difficulty) => {
  const value = String(difficulty || '')
    .trim()
    .toLowerCase();
  if (value === 'hard') return 'hard';
  if (value === 'medium') return 'medium';
  return 'easy';
};

const normalizeLearningNodeType = (nodeType) => {
  const value = String(nodeType || '')
    .trim()
    .toLowerCase();
  if (!value) return null;
  if (!Object.prototype.hasOwnProperty.call(GUEST_LEARNING_PATH_NODE_XP, value)) return null;
  return value;
};

const buildLearningNodeAwardMetadata = (nodeId, metadata = {}, isRepeat = false) => {
  const normalizedType = normalizeLearningNodeType(metadata?.nodeType);
  return {
    pathId: metadata?.pathId || null,
    nodeId,
    nodeType: normalizedType,
    nodeTitle: metadata?.nodeTitle || null,
    moduleId: metadata?.moduleId || null,
    moduleTitle: metadata?.moduleTitle || null,
    isRepeat,
  };
};

const getSolveXpReward = (difficulty) =>
  GUEST_XP_REWARDS[`problem_solved_${normalizeDifficulty(difficulty)}`] ||
  GUEST_XP_REWARDS.problem_solved_easy;

const appendXpEvent = (progress, { reason, amount, context = null }) => {
  const awardAmount = normalizeCount(amount);
  if (!reason || awardAmount <= 0) return progress;

  const nextXp = normalizeXp(progress.xp) + awardAmount;
  const nextEvents = [
    ...(Array.isArray(progress.xpEvents) ? progress.xpEvents : []),
    {
      reason,
      amount: awardAmount,
      at: new Date().toISOString(),
      context: context && typeof context === 'object' ? context : null,
    },
  ].slice(-50);

  return {
    ...progress,
    xp: nextXp,
    xpEvents: nextEvents,
  };
};

const unlockAchievement = (progress, achievementId) => {
  const achievement = GUEST_ACHIEVEMENTS[achievementId];
  if (!achievement) return progress;
  if (progress.guestAchievements.includes(achievementId)) return progress;

  let next = {
    ...progress,
    guestAchievements: [...progress.guestAchievements, achievementId],
  };

  const bonusReason = achievement.xpBonusReason;
  const bonusAmount = GUEST_XP_REWARDS[bonusReason] || 0;
  if (bonusAmount > 0) {
    next = appendXpEvent(next, {
      reason: bonusReason,
      amount: bonusAmount,
      context: { achievementId },
    });
  }

  return next;
};

const applyGuestAchievementRules = (progress) => {
  let next = progress;
  const canonicalSolvedCount = getSolvedGuestTrialCanonicalSlugs(next.problemsSolved).length;

  if (hasGuestDemoCompletionEvidence(next)) {
    next = unlockAchievement(next, 'hello-codegrind');
  }
  if (canonicalSolvedCount >= 1) {
    next = unlockAchievement(next, 'first-blood');
  }
  if (canonicalSolvedCount >= 3) {
    next = unlockAchievement(next, 'triple-threat');
  }

  return next;
};

const buildDemoRewardPreview = (progress) => {
  const awards = [];
  const unlockedAchievements = [];

  const hasSolvedHelloWorld = hasGuestProblemSlug(progress.problemsSolved, 'hello-world');
  let projectedXp = normalizeXp(progress.xp);
  let projectedSolvedCount = getSolvedGuestTrialCanonicalSlugs(progress.problemsSolved).length;
  let projectedDemoCompleted = progress.demoCompleted;
  const isRepeatDemo = progress.demoCompleted && progress.demoCompletedAt;
  const isRepeatSolve = hasSolvedHelloWorld;

  const projectedAchievements = new Set(progress.guestAchievements);

  const addPreviewAward = (reason, amount) => {
    const awardAmount = normalizeCount(amount);
    if (!reason || awardAmount <= 0) return;
    projectedXp += awardAmount;
    awards.push({
      reason,
      amount: awardAmount,
    });
  };

  if (!progress.demoCompleted) {
    projectedDemoCompleted = true;
    addPreviewAward('demo_completed', GUEST_XP_REWARDS.demo_completed);
  } else {
    // Repeat demo: award reduced XP
    addPreviewAward(
      'demo_completed_repeat',
      Math.max(1, Math.floor(GUEST_XP_REWARDS.demo_completed * GUEST_REPEAT_XP_MULTIPLIER))
    );
  }

  if (!hasSolvedHelloWorld) {
    projectedSolvedCount += 1;
    addPreviewAward('problem_solved_easy', GUEST_XP_REWARDS.problem_solved_easy);
  } else {
    // Repeat solve of hello-world: award reduced XP
    addPreviewAward(
      'problem_solved_easy_repeat',
      Math.max(1, Math.floor(GUEST_XP_REWARDS.problem_solved_easy * GUEST_REPEAT_XP_MULTIPLIER))
    );
  }

  const maybeUnlockPreviewAchievement = (achievementId) => {
    if (projectedAchievements.has(achievementId)) return;
    projectedAchievements.add(achievementId);
    const achievement = GUEST_ACHIEVEMENTS[achievementId];
    if (achievement) {
      unlockedAchievements.push(achievement);
      addPreviewAward(achievement.xpBonusReason, GUEST_XP_REWARDS[achievement.xpBonusReason] || 0);
    }
  };

  if (projectedDemoCompleted) {
    maybeUnlockPreviewAchievement('hello-codegrind');
  }
  if (projectedSolvedCount >= 1) {
    maybeUnlockPreviewAchievement('first-blood');
  }
  if (projectedSolvedCount >= 3) {
    maybeUnlockPreviewAchievement('triple-threat');
  }

  const totalXp = projectedXp - normalizeXp(progress.xp);
  const isRepeat = isRepeatDemo || isRepeatSolve;
  return {
    awards,
    totalXp: Math.max(0, totalXp),
    unlockedAchievements,
    projectedSummary: getGuestXpSummaryFromTotalXp(projectedXp),
    isRepeat,
  };
};

/**
 * Simulate what recordProblemSolved would do and return an XP payload
 * in the same shape as the server returns, so modals can show guest XP
 * animations identically to authenticated users.
 *
 * @param {Object} progress    - Current guest progress state
 * @param {string} slug        - Problem slug being solved
 * @param {string} [difficulty='easy'] - Problem difficulty
 * @returns {{ summary, awards, levelUp }|null}
 */
export const buildSolveRewardPreview = (progress, slug, difficulty = 'easy') => {
  if (!slug || !progress) return null;

  const isRepeat = hasGuestProblemSlug(progress.problemsSolved, slug);

  const awards = [];
  const previousXp = normalizeXp(progress.xp);
  let projectedXp = previousXp;
  let projectedSolvedCount =
    getSolvedGuestTrialCanonicalSlugs(progress.problemsSolved).length + (isRepeat ? 0 : 1);
  const projectedAchievements = new Set(progress.guestAchievements);

  const addPreviewAward = (reason, amount) => {
    const awardAmount = normalizeCount(amount);
    if (!reason || awardAmount <= 0) return;
    projectedXp += awardAmount;
    awards.push({ reason, amount: awardAmount });
  };

  // Base solve reward (reduced for repeats)
  const diff = normalizeDifficulty(difficulty);
  const baseXp = getSolveXpReward(diff);
  if (isRepeat) {
    addPreviewAward(
      `problem_solved_${diff}_repeat`,
      Math.max(1, Math.floor(baseXp * GUEST_REPEAT_XP_MULTIPLIER))
    );
  } else {
    addPreviewAward(`problem_solved_${diff}`, baseXp);
  }

  // Achievement checks (mirrors applyGuestAchievementRules)
  const maybeUnlockPreviewAchievement = (achievementId) => {
    if (projectedAchievements.has(achievementId)) return;
    projectedAchievements.add(achievementId);
    const achievement = GUEST_ACHIEVEMENTS[achievementId];
    if (achievement) {
      addPreviewAward(achievement.xpBonusReason, GUEST_XP_REWARDS[achievement.xpBonusReason] || 0);
    }
  };

  if (progress.demoCompleted) {
    maybeUnlockPreviewAchievement('hello-codegrind');
  }
  if (projectedSolvedCount >= 1) {
    maybeUnlockPreviewAchievement('first-blood');
  }
  if (projectedSolvedCount >= 3) {
    maybeUnlockPreviewAchievement('triple-threat');
  }

  const prevSummary = getGuestXpSummaryFromTotalXp(previousXp);
  const curSummary = getGuestXpSummaryFromTotalXp(projectedXp);

  const summary = {
    xp: curSummary.xp,
    level: curSummary.level,
    roleName: curSummary.roleName,
    xpIntoLevel: curSummary.xpIntoLevel,
    xpToNextLevel: curSummary.xpToNextLevel,
    progressPercent: curSummary.progressPercent,
    xpRemainingToNextLevel: curSummary.xpRemainingToNextLevel,
  };

  let levelUp = null;
  if (curSummary.level > prevSummary.level) {
    levelUp = {
      previousLevel: prevSummary.level,
      newLevel: curSummary.level,
      previousRoleName: prevSummary.roleName,
      newRoleName: curSummary.roleName,
      roleChanged: prevSummary.roleName !== curSummary.roleName,
      previousXpIntoLevel: prevSummary.xpIntoLevel,
      previousXpToNextLevel: prevSummary.xpToNextLevel,
    };
  }

  return { summary, awards, levelUp, isRepeat };
};

/**
 * Simulate what recordLpNodeCompleted would do and return an XP payload
 * in the same shape as the server returns.
 *
 * @param {Object} progress - Current guest progress state
 * @param {string} nodeId - Learning path node id
 * @param {Object} [metadata] - Optional node metadata
 * @returns {{ summary, awards, levelUp, isRepeat }|null}
 */
export const buildLearningNodeRewardPreview = (progress, nodeId, metadata = {}) => {
  const stringNodeId = typeof nodeId === 'string' ? nodeId.trim() : '';
  if (!stringNodeId || !progress) return null;

  const nodeType = normalizeLearningNodeType(metadata?.nodeType);
  const baseXpAmount = nodeType ? GUEST_LEARNING_PATH_NODE_XP[nodeType] || 0 : 0;
  const isRepeat = progress.lpNodesCompleted.includes(stringNodeId);

  let awardAmount = 0;
  if (baseXpAmount > 0) {
    awardAmount = isRepeat
      ? Math.max(1, Math.floor(baseXpAmount * GUEST_LEARNING_PATH_REPEAT_XP_MULTIPLIER))
      : baseXpAmount;
  }

  const previousXp = normalizeXp(progress.xp);
  const projectedXp = previousXp + awardAmount;
  const prevSummary = getGuestXpSummaryFromTotalXp(previousXp);
  const curSummary = getGuestXpSummaryFromTotalXp(projectedXp);

  const summary = {
    xp: curSummary.xp,
    level: curSummary.level,
    roleName: curSummary.roleName,
    xpIntoLevel: curSummary.xpIntoLevel,
    xpToNextLevel: curSummary.xpToNextLevel,
    progressPercent: curSummary.progressPercent,
    xpRemainingToNextLevel: curSummary.xpRemainingToNextLevel,
  };

  const awards =
    awardAmount > 0
      ? [
          {
            reason: isRepeat ? 'learning_path_node_repeat' : 'learning_path_node_complete',
            amount: awardAmount,
            multiplier: isRepeat ? GUEST_LEARNING_PATH_REPEAT_XP_MULTIPLIER : 1,
            isRepeat,
            metadata: buildLearningNodeAwardMetadata(stringNodeId, metadata, isRepeat),
          },
        ]
      : [];

  let levelUp = null;
  if (curSummary.level > prevSummary.level) {
    levelUp = {
      previousLevel: prevSummary.level,
      newLevel: curSummary.level,
      previousRoleName: prevSummary.roleName,
      newRoleName: curSummary.roleName,
      roleChanged: prevSummary.roleName !== curSummary.roleName,
      previousXpIntoLevel: prevSummary.xpIntoLevel,
      previousXpToNextLevel: prevSummary.xpToNextLevel,
    };
  }

  return { summary, awards, levelUp, isRepeat };
};

function normalizeProgress(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;

  const merged = { ...base, ...raw };
  return reconcileGuestProgress({
    ...merged,
    firstSeen: typeof raw.firstSeen === 'string' ? raw.firstSeen : null,
    demoCompleted: Boolean(raw.demoCompleted),
    demoCompletedAt: typeof raw.demoCompletedAt === 'string' ? raw.demoCompletedAt : null,
    pathChoice: PATH_CHOICES.has(raw.pathChoice) ? raw.pathChoice : null,
    trialLearningPath: normalizeLearningPathId(raw.trialLearningPath),
    pathChosenAt: typeof raw.pathChosenAt === 'string' ? raw.pathChosenAt : null,
    selectedPlayerCharacterId: normalizeSelectedPlayerCharacterId(raw.selectedPlayerCharacterId),
    cityMissionState: normalizeCityMissionState(raw.cityMissionState),
    problemsAttempted: normalizeStringArray(raw.problemsAttempted),
    problemsSolved: normalizeStringArray(raw.problemsSolved),
    lpNodesStarted: normalizeStringArray(raw.lpNodesStarted),
    lpNodesCompleted: normalizeStringArray(raw.lpNodesCompleted),
    tdGamesPlayed: normalizeCount(raw.tdGamesPlayed),
    codeExecutions: normalizeCount(raw.codeExecutions),
    clustersBrowsed: normalizeStringArray(raw.clustersBrowsed),
    xp: normalizeXp(raw.xp),
    guestAchievements: normalizeGuestAchievements(raw.guestAchievements),
    xpEvents: normalizeXpEvents(raw.xpEvents),
    guestDataPacketsEarned: normalizeNonNegativeInt(raw.guestDataPacketsEarned),
  });
}

function loadProgress() {
  try {
    const raw = readStorage('localStorage', STORAGE_KEY);
    if (!raw) return null;
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveProgress(data) {
  try {
    writeStorage('localStorage', STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked - best effort
  }
}

/**
 * @param {{ isAuthenticated: boolean }} options
 */
export default function useGuestProgress({ isAuthenticated = false } = {}) {
  const [progress, setProgress] = useState(() => loadProgress() || emptyProgress());
  const [hydrated, setHydrated] = useState(() => {
    if (isAuthenticated) return true;
    const guestToken = readStorage('localStorage', 'guest_token');
    return !guestToken;
  });
  const dirty = useRef(false);

  // Sync to localStorage on changes
  useEffect(() => {
    if (isAuthenticated || !dirty.current) return;
    saveProgress(progress);
    dirty.current = false;
  }, [progress, isAuthenticated]);

  // Lazy-init firstSeen
  useEffect(() => {
    if (isAuthenticated) return;
    if (!progress.firstSeen) {
      setProgress((prev) => ({ ...prev, firstSeen: new Date().toISOString() }));
      dirty.current = true;
    }
  }, [isAuthenticated, progress.firstSeen]);

  // Hydrate trial problem progress from server state so local resets cannot
  // reopen solved trial nodes or problem-wall status.
  useEffect(() => {
    if (isAuthenticated) {
      setHydrated(true);
      return undefined;
    }

    const guestToken = readStorage('localStorage', 'guest_token');
    if (!guestToken) {
      setHydrated(true);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const serverProgress = await fetchWithError('/api/guest/progress', { method: 'GET' });
        if (cancelled || !serverProgress) return;

        const serverProblems = Array.isArray(serverProgress.problems)
          ? serverProgress.problems
          : [];
        const serverAttempted = [];
        const serverSolved = [];
        let serverTrack = null;
        let serverLearningPath = null;

        for (const entry of serverProblems) {
          const slug = typeof entry?.problemSlug === 'string' ? entry.problemSlug.trim() : '';
          if (!slug) continue;
          if (!serverAttempted.includes(slug)) {
            serverAttempted.push(slug);
          }
          if (entry?.status === 'solved' && !serverSolved.includes(slug)) {
            serverSolved.push(slug);
          }
          if (!serverTrack) {
            serverTrack = getTrialTrackForSlug(slug);
          }
          if (!serverLearningPath) {
            serverLearningPath = getLearningPathIdForSlug(slug);
          }
        }

        setProgress((prev) => {
          const nextAttempted = mergeUniqueStrings(prev.problemsAttempted, serverAttempted);
          const nextSolved = mergeUniqueStrings(prev.problemsSolved, serverSolved);
          const serverDataPacketsEarned = normalizeNonNegativeInt(
            serverProgress?.dataPacketsEarned
          );
          const shouldSetTrack = Boolean(
            serverTrack && (!prev.pathChoice || prev.pathChoice !== serverTrack)
          );
          const shouldSetLearningPath = Boolean(
            serverLearningPath &&
            (!prev.trialLearningPath || prev.trialLearningPath !== serverLearningPath)
          );
          const shouldSetDataPackets = prev.guestDataPacketsEarned !== serverDataPacketsEarned;

          if (
            arraysEqual(nextAttempted, prev.problemsAttempted) &&
            arraysEqual(nextSolved, prev.problemsSolved) &&
            !shouldSetTrack &&
            !shouldSetLearningPath &&
            !shouldSetDataPackets
          ) {
            return prev;
          }

          dirty.current = true;
          return reconcileGuestProgress({
            ...prev,
            problemsAttempted: nextAttempted,
            problemsSolved: nextSolved,
            ...(shouldSetTrack
              ? {
                  pathChoice: serverTrack,
                  pathChosenAt: prev.pathChosenAt || new Date().toISOString(),
                }
              : {}),
            ...(shouldSetLearningPath ? { trialLearningPath: serverLearningPath } : {}),
            ...(shouldSetDataPackets ? { guestDataPacketsEarned: serverDataPacketsEarned } : {}),
          });
        });
      } catch {
        // Best effort only. Guest UX still works from local state.
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const update = useCallback((mutator) => {
    setProgress((prev) => {
      const next = reconcileGuestProgress(mutator(prev));
      if (next === prev) return prev;
      dirty.current = true;
      return next;
    });
  }, []);

  const markDemoCompleted = useCallback(() => {
    const now = new Date().toISOString();
    update((p) => {
      const isRepeat = p.demoCompleted && p.demoCompletedAt;

      if (isRepeat) {
        // Repeat demo: award reduced XP only (no achievement re-triggers)
        const repeatAmount = Math.max(
          1,
          Math.floor(GUEST_XP_REWARDS.demo_completed * GUEST_REPEAT_XP_MULTIPLIER)
        );
        return appendXpEvent(p, {
          reason: 'demo_completed_repeat',
          amount: repeatAmount,
          context: { isRepeat: true, multiplier: GUEST_REPEAT_XP_MULTIPLIER },
        });
      }

      let next = {
        ...p,
        demoCompleted: true,
        demoCompletedAt: p.demoCompletedAt || now,
      };
      next = appendXpEvent(next, {
        reason: 'demo_completed',
        amount: GUEST_XP_REWARDS.demo_completed,
      });
      next = applyGuestAchievementRules(next);
      return next;
    });
  }, [update]);

  const recordPathChoice = useCallback(
    (choice) => {
      if (!PATH_CHOICES.has(choice)) return;
      const now = new Date().toISOString();
      update((p) => {
        if (p.pathChoice && p.pathChoice !== choice) {
          return p;
        }
        if (p.pathChoice === choice && p.pathChosenAt) {
          return p;
        }
        return {
          ...p,
          pathChoice: choice,
          pathChosenAt: now,
        };
      });
    },
    [update]
  );

  const recordTrialLearningPath = useCallback(
    (pathId) => {
      const normalizedPathId = normalizeLearningPathId(pathId);
      if (!normalizedPathId) return;

      const now = new Date().toISOString();
      update((p) => {
        if (p.pathChoice === 'pro') return p;
        if (p.trialLearningPath && p.trialLearningPath !== normalizedPathId) {
          return p;
        }

        const shouldSetPathChoice = !p.pathChoice;
        if (!shouldSetPathChoice && p.trialLearningPath === normalizedPathId) {
          return p;
        }

        return {
          ...p,
          trialLearningPath: normalizedPathId,
          ...(shouldSetPathChoice
            ? {
                pathChoice: 'beginner',
                pathChosenAt: p.pathChosenAt || now,
              }
            : {}),
        };
      });
    },
    [update]
  );

  const recordSelectedPlayerCharacter = useCallback(
    (playerCharacterId) => {
      const normalizedPlayerCharacterId = normalizeSelectedPlayerCharacterId(playerCharacterId);
      if (!normalizedPlayerCharacterId) return;

      update((p) => {
        if (p.selectedPlayerCharacterId === normalizedPlayerCharacterId) {
          return p;
        }

        return {
          ...p,
          selectedPlayerCharacterId: normalizedPlayerCharacterId,
        };
      });
    },
    [update]
  );

  const setCityMissionState = useCallback(
    (cityMissionState) => {
      const normalizedMissionState = normalizeCityMissionState(cityMissionState);

      update((p) => {
        const currentMissionState = normalizeCityMissionState(p.cityMissionState);
        if (JSON.stringify(currentMissionState) === JSON.stringify(normalizedMissionState)) {
          return p;
        }

        return {
          ...p,
          cityMissionState: normalizedMissionState,
        };
      });
    },
    [update]
  );

  const recordProblemAttempt = useCallback(
    (slug) => {
      if (!slug) return;
      const now = new Date().toISOString();
      update((p) => {
        const slugTrack = getTrialTrackForSlug(slug);
        const slugLearningPath = getLearningPathIdForSlug(slug);
        if (p.pathChoice && slugTrack && p.pathChoice !== slugTrack) {
          return p;
        }
        if (p.trialLearningPath && slugLearningPath && p.trialLearningPath !== slugLearningPath) {
          return p;
        }

        const shouldSetPathChoice = !p.pathChoice && Boolean(slugTrack);
        const shouldSetLearningPath =
          !p.trialLearningPath && slugTrack === 'beginner' && Boolean(slugLearningPath);
        const nextAttempted = hasGuestProblemSlug(p.problemsAttempted, slug)
          ? p.problemsAttempted
          : [...p.problemsAttempted, slug];

        if (
          !shouldSetPathChoice &&
          !shouldSetLearningPath &&
          nextAttempted === p.problemsAttempted
        ) {
          return p;
        }

        return {
          ...p,
          problemsAttempted: nextAttempted,
          ...(shouldSetPathChoice
            ? { pathChoice: slugTrack, pathChosenAt: p.pathChosenAt || now }
            : {}),
          ...(shouldSetLearningPath ? { trialLearningPath: slugLearningPath } : {}),
        };
      });
    },
    [update]
  );

  const recordProblemSolved = useCallback(
    (slug, metadata = {}) => {
      if (!slug) return;
      const now = new Date().toISOString();
      update((p) => {
        const slugTrack = getTrialTrackForSlug(slug);
        const slugLearningPath = getLearningPathIdForSlug(slug);
        if (p.pathChoice && slugTrack && p.pathChoice !== slugTrack) {
          return p;
        }
        if (p.trialLearningPath && slugLearningPath && p.trialLearningPath !== slugLearningPath) {
          return p;
        }
        const isRepeat = hasGuestProblemSlug(p.problemsSolved, slug);
        const difficulty = normalizeDifficulty(metadata?.difficulty);

        if (isRepeat) {
          // Repeat solve: award reduced XP only (no achievements, no re-add to solved list)
          const baseXp = getSolveXpReward(difficulty);
          const repeatAmount = Math.max(1, Math.floor(baseXp * GUEST_REPEAT_XP_MULTIPLIER));
          return appendXpEvent(p, {
            reason: `problem_solved_${difficulty}_repeat`,
            amount: repeatAmount,
            context: {
              slug,
              source: metadata?.source || null,
              difficulty,
              isRepeat: true,
              multiplier: GUEST_REPEAT_XP_MULTIPLIER,
            },
          });
        }

        const shouldSetPathChoice = !p.pathChoice && Boolean(slugTrack);
        const shouldSetLearningPath =
          !p.trialLearningPath && slugTrack === 'beginner' && Boolean(slugLearningPath);
        let next = {
          ...p,
          problemsSolved: [...p.problemsSolved, slug],
          problemsAttempted: hasGuestProblemSlug(p.problemsAttempted, slug)
            ? p.problemsAttempted
            : [...p.problemsAttempted, slug],
          ...(shouldSetPathChoice
            ? { pathChoice: slugTrack, pathChosenAt: p.pathChosenAt || now }
            : {}),
          ...(shouldSetLearningPath ? { trialLearningPath: slugLearningPath } : {}),
        };
        next = appendXpEvent(next, {
          reason: `problem_solved_${difficulty}`,
          amount: getSolveXpReward(difficulty),
          context: {
            slug,
            source: metadata?.source || null,
            difficulty,
          },
        });
        next = applyGuestAchievementRules(next);
        return next;
      });
    },
    [update]
  );

  const recordLpNodeStarted = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      const now = new Date().toISOString();
      update((p) => {
        const learningPathId = getLearningPathIdForNodeId(nodeId);
        if (p.trialLearningPath && learningPathId && p.trialLearningPath !== learningPathId) {
          return p;
        }

        const shouldSetPathChoice = !p.pathChoice && Boolean(learningPathId);
        const shouldSetLearningPath = !p.trialLearningPath && Boolean(learningPathId);
        const nextStarted = p.lpNodesStarted.includes(nodeId)
          ? p.lpNodesStarted
          : [...p.lpNodesStarted, nodeId];

        if (nextStarted === p.lpNodesStarted && !shouldSetPathChoice && !shouldSetLearningPath) {
          return p;
        }

        return {
          ...p,
          lpNodesStarted: nextStarted,
          ...(shouldSetPathChoice
            ? { pathChoice: 'beginner', pathChosenAt: p.pathChosenAt || now }
            : {}),
          ...(shouldSetLearningPath ? { trialLearningPath: learningPathId } : {}),
        };
      });
    },
    [update]
  );

  const recordLpNodeCompleted = useCallback(
    (nodeId, metadata = {}) => {
      const stringNodeId = typeof nodeId === 'string' ? nodeId.trim() : '';
      if (!stringNodeId) return;
      const now = new Date().toISOString();

      update((p) => {
        const learningPathId = isSharedPreChoiceLearningNodeId(stringNodeId)
          ? null
          : normalizeLearningPathId(metadata?.pathId) || getLearningPathIdForNodeId(stringNodeId);
        if (p.trialLearningPath && learningPathId && p.trialLearningPath !== learningPathId) {
          return p;
        }

        const preview = buildLearningNodeRewardPreview(p, stringNodeId, metadata);
        const alreadyCompleted = p.lpNodesCompleted.includes(stringNodeId);
        const shouldSetPathChoice = !p.pathChoice && Boolean(learningPathId);
        const shouldSetLearningPath = !p.trialLearningPath && Boolean(learningPathId);

        let next = alreadyCompleted
          ? p
          : {
              ...p,
              lpNodesCompleted: [...p.lpNodesCompleted, stringNodeId],
            };

        if (shouldSetPathChoice || shouldSetLearningPath) {
          next = {
            ...next,
            ...(shouldSetPathChoice
              ? { pathChoice: 'beginner', pathChosenAt: p.pathChosenAt || now }
              : {}),
            ...(shouldSetLearningPath ? { trialLearningPath: learningPathId } : {}),
          };
        }

        const award = preview?.awards?.[0];
        if (award?.amount > 0) {
          next = appendXpEvent(next, {
            reason: award.reason,
            amount: award.amount,
            context: {
              ...(award.metadata || {}),
              multiplier: award.multiplier,
            },
          });
        }

        return next;
      });
    },
    [update]
  );

  const recordTdGamePlayed = useCallback(() => {
    update((p) => ({ ...p, tdGamesPlayed: p.tdGamesPlayed + 1 }));
  }, [update]);

  const recordCodeExecution = useCallback(() => {
    update((p) => ({ ...p, codeExecutions: p.codeExecutions + 1 }));
  }, [update]);

  const recordClusterBrowsed = useCallback(
    (clusterId) => {
      if (!clusterId) return;
      update((p) =>
        p.clustersBrowsed.includes(clusterId)
          ? p
          : { ...p, clustersBrowsed: [...p.clustersBrowsed, clusterId] }
      );
    },
    [update]
  );

  /** Clear guest progress (call after successful signup migration) */
  const clearProgress = useCallback(() => {
    try {
      removeStorageItem('localStorage', STORAGE_KEY);
    } catch {
      // noop
    }
    setProgress(emptyProgress());
  }, []);

  /** Export progress blob for POST to migration endpoint */
  const exportForMigration = useCallback(() => ({ ...progress }), [progress]);

  const xpSummary = useMemo(() => getGuestXpSummaryFromTotalXp(progress.xp), [progress.xp]);

  const unlockedGuestAchievements = useMemo(
    () => progress.guestAchievements.map((id) => GUEST_ACHIEVEMENTS[id]).filter(Boolean),
    [progress.guestAchievements]
  );

  const getDemoRewardPreview = useCallback(() => buildDemoRewardPreview(progress), [progress]);

  /**
   * Preview XP payload for a problem solve (before actually recording it).
   * Returns { summary, awards, levelUp, isRepeat } matching server XP shape, or null.
   * Repeat solves return reduced XP (0.25x) instead of null.
   */
  const getSolveRewardPreview = useCallback(
    (slug, difficulty) => buildSolveRewardPreview(progress, slug, difficulty),
    [progress]
  );

  const getLearningNodeRewardPreview = useCallback(
    (nodeId, metadata = {}) => buildLearningNodeRewardPreview(progress, nodeId, metadata),
    [progress]
  );

  const clusterTrialSolvedCount = useMemo(
    () => countSolvedClusterTrialProblems(progress.problemsSolved),
    [progress.problemsSolved]
  );

  const clusterFreeProblemsRemaining = useMemo(
    () => Math.max(0, GUEST_CLUSTER_TRIAL_PROBLEM_LIMIT - clusterTrialSolvedCount),
    [clusterTrialSolvedCount]
  );

  const hasReachedClusterProblemWall = clusterFreeProblemsRemaining === 0;

  const activeTrialLearningPath = progress.trialLearningPath || 'python-path';

  const learningTrialSolvedCount = useMemo(
    () => countSolvedLearningTrialProblems(progress.problemsSolved, activeTrialLearningPath),
    [activeTrialLearningPath, progress.problemsSolved]
  );

  const clusterTrialUnlockedSlugs = useMemo(
    () => getGuestClusterTrialUnlockedSlugs(progress.problemsSolved),
    [progress.problemsSolved]
  );

  const learningTrialUnlockedCanonicalSlugs = useMemo(
    () =>
      getGuestLearningTrialUnlockedCanonicalSlugs(progress.problemsSolved, activeTrialLearningPath),
    [activeTrialLearningPath, progress.problemsSolved]
  );

  const learningFreeProblemsRemaining = useMemo(
    () => Math.max(0, GUEST_LEARNING_TRIAL_PROBLEM_LIMIT - learningTrialSolvedCount),
    [learningTrialSolvedCount]
  );

  const hasReachedLearningProblemWall = learningFreeProblemsRemaining === 0;

  const selectedTrialTrack = progress.pathChoice;
  const selectedTrialLearningPath = progress.trialLearningPath;
  const selectedPlayerCharacterId = progress.selectedPlayerCharacterId;
  const isBeginnerTrialLocked = selectedTrialTrack === 'pro';
  const isProTrialLocked = selectedTrialTrack === 'beginner';

  const isTrialTrackLocked = useCallback(
    (track) => Boolean(selectedTrialTrack && selectedTrialTrack !== track),
    [selectedTrialTrack]
  );

  const isTrialLearningPathLocked = useCallback(
    (pathId) => {
      const normalizedPathId = normalizeLearningPathId(pathId);
      if (!normalizedPathId) return false;
      return Boolean(selectedTrialLearningPath && selectedTrialLearningPath !== normalizedPathId);
    },
    [selectedTrialLearningPath]
  );

  // Legacy aliases (cluster trial semantics).
  const freeProblemsRemaining = useMemo(
    () => clusterFreeProblemsRemaining,
    [clusterFreeProblemsRemaining]
  );

  const hasReachedProblemWall = hasReachedClusterProblemWall;

  const activitySummary = useMemo(
    () => ({
      problemsAttemptedCount: progress.problemsAttempted.length,
      problemsSolvedCount: progress.problemsSolved.length,
      problemsCompletedCount: progress.problemsSolved.length,
      clusterTrialSolvedCount,
      learningTrialSolvedCount,
      lpNodesCompletedCount: progress.lpNodesCompleted.length,
      tdGamesPlayed: progress.tdGamesPlayed,
      clustersBrowsedCount: progress.clustersBrowsed.length,
      demoCompleted: progress.demoCompleted,
      guestXp: xpSummary.xp,
      guestDataPacketsEarned: progress.guestDataPacketsEarned,
      guestLevel: xpSummary.level,
      guestRoleName: xpSummary.roleName,
      guestAchievementsCount: progress.guestAchievements.length,
    }),
    [progress, clusterTrialSolvedCount, learningTrialSolvedCount, xpSummary]
  );

  return {
    progress,
    hydrated,
    markDemoCompleted,
    recordPathChoice,
    recordTrialLearningPath,
    recordSelectedPlayerCharacter,
    setCityMissionState,
    recordProblemAttempt,
    recordProblemSolved,
    recordLpNodeStarted,
    recordLpNodeCompleted,
    recordTdGamePlayed,
    recordCodeExecution,
    recordClusterBrowsed,
    clearProgress,
    exportForMigration,
    selectedTrialTrack,
    selectedTrialLearningPath,
    selectedPlayerCharacterId,
    isBeginnerTrialLocked,
    isProTrialLocked,
    isTrialTrackLocked,
    isTrialLearningPathLocked,
    clusterTrialSolvedCount,
    clusterFreeProblemsRemaining,
    hasReachedClusterProblemWall,
    learningTrialSolvedCount,
    learningFreeProblemsRemaining,
    hasReachedLearningProblemWall,
    clusterTrialUnlockedSlugs,
    learningTrialUnlockedCanonicalSlugs,
    freeProblemsRemaining,
    hasReachedProblemWall,
    activitySummary,
    xpSummary,
    unlockedGuestAchievements,
    getDemoRewardPreview,
    getSolveRewardPreview,
    getLearningNodeRewardPreview,
    getXpSummaryFromTotalXp: getGuestXpSummaryFromTotalXp,
    GUEST_FREE_PROBLEM_LIMIT,
    GUEST_CLUSTER_TRIAL_PROBLEM_LIMIT,
    GUEST_LEARNING_TRIAL_PROBLEM_LIMIT,
    GUEST_XP_REWARDS,
  };
}
