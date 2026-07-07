import { normalizeLearningPathId } from './learningPathUtils';

export const CITY_STORY_STATE_UPDATED_EVENT = 'codegrind:city-story-state-updated';
export const CITY_MISSION_SURFACE_CLUSTERS = 'clusters';
export const CITY_MISSION_SURFACE_LEARNING = 'learning';

const CITY_MISSION_TARGET_POINTS = Object.freeze({
  [CITY_MISSION_SURFACE_CLUSTERS]: 'cluster-map',
  [CITY_MISSION_SURFACE_LEARNING]: 'learning-path',
});
const CITY_PROGRESS_SUMMARY_KEYS = Object.freeze([
  'problemsAttemptedCount',
  'problemsSolvedCount',
  'lpNodesStartedCount',
  'lpNodesCompletedCount',
  'clustersBrowsedCount',
  'clusterTrialSolvedCount',
  'clusterTrialProblemLimit',
  'clusterFreeProblemsRemaining',
  'learningTrialSolvedCount',
  'learningTrialProblemLimit',
  'learningTrialProblemsRemaining',
]);

const normalizeString = (value, maxLength = 255) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, maxLength);
};

const normalizeInternalPath = (value) => {
  const normalized = normalizeString(value, 512);
  if (!normalized || !normalized.startsWith('/') || normalized.startsWith('//')) {
    return null;
  }

  return normalized;
};

const normalizeCount = (value) => {
  if (value == null || value === '') return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;

  return Math.floor(numeric);
};

const normalizeTimestamp = (value) => {
  if (typeof value !== 'string') return new Date().toISOString();

  const trimmed = value.trim();
  if (!trimmed || Number.isNaN(Date.parse(trimmed))) {
    return new Date().toISOString();
  }

  return new Date(trimmed).toISOString();
};

export const buildPathWithSearch = (pathname = '', search = '') => {
  const normalizedPathname = normalizeInternalPath(pathname);
  if (!normalizedPathname) {
    return null;
  }

  const normalizedSearch = typeof search === 'string' ? search.trim() : '';
  if (!normalizedSearch) {
    return normalizedPathname;
  }

  return normalizedSearch.startsWith('?')
    ? `${normalizedPathname}${normalizedSearch}`
    : `${normalizedPathname}?${normalizedSearch}`;
};

export const normalizeCityProgressSummary = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const normalized = {};
  let hasValue = false;

  CITY_PROGRESS_SUMMARY_KEYS.forEach((key) => {
    const nextValue = normalizeCount(value[key]);
    normalized[key] = nextValue;
    hasValue ||= key in value || nextValue != null;
  });

  return hasValue ? normalized : null;
};

export const normalizeCityMissionState = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const surface = normalizeString(value.surface, 32);
  if (surface !== CITY_MISSION_SURFACE_CLUSTERS && surface !== CITY_MISSION_SURFACE_LEARNING) {
    return null;
  }

  return {
    collectionId: normalizeString(value.collectionId, 120),
    clusterId: normalizeString(value.clusterId, 120),
    learningPathId: normalizeLearningPathId(value.learningPathId),
    moduleId: normalizeString(value.moduleId, 120),
    nextNodeId: normalizeString(value.nextNodeId, 120),
    nodeId: normalizeString(value.nodeId, 120),
    problemSlug: normalizeString(value.problemSlug, 160),
    resumePath: normalizeInternalPath(value.resumePath),
    solvedCount: normalizeCount(value.solvedCount),
    surface,
    targetPointId:
      normalizeString(value.targetPointId, 120) || CITY_MISSION_TARGET_POINTS[surface] || null,
    totalCount: normalizeCount(value.totalCount),
    updatedAt: normalizeTimestamp(value.updatedAt),
  };
};

export const buildClusterMissionState = ({
  clusterId = null,
  collectionId = null,
  problemSlug = null,
  resumePath = null,
  solvedCount = null,
  totalCount = null,
} = {}) =>
  normalizeCityMissionState({
    clusterId,
    collectionId,
    problemSlug,
    resumePath,
    solvedCount,
    surface: CITY_MISSION_SURFACE_CLUSTERS,
    totalCount,
  });

export const buildLearningMissionState = ({
  learningPathId = null,
  moduleId = null,
  nextNodeId = null,
  nodeId = null,
  problemSlug = null,
  resumePath = null,
  solvedCount = null,
  totalCount = null,
} = {}) =>
  normalizeCityMissionState({
    learningPathId,
    moduleId,
    nextNodeId,
    nodeId,
    problemSlug,
    resumePath,
    solvedCount,
    surface: CITY_MISSION_SURFACE_LEARNING,
    totalCount,
  });

export const emitCityStoryStateChanged = (detail = null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CITY_STORY_STATE_UPDATED_EVENT, {
      detail,
    })
  );
};
