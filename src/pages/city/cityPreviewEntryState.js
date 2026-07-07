import {
  resolveApartmentCityEntryState,
  resolveApartmentShellId,
} from '../../utils/navigation/apartmentEntryState';
import { normalizeCityMissionState } from '../../utils/navigation/cityStoryState';
import { resolvePlayerCharacterId } from '../../player-character/playerCharacterPresets';

const PHONE_CLUSTER_TRIAL_PROBLEM_LIMIT = 3;
const PHONE_LEARNING_TRIAL_PROBLEM_LIMIT = 4;

const normalizeSelectedPlayerCharacterId = (value) => {
  if (typeof value !== 'string') return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const resolvedValue = resolvePlayerCharacterId(trimmedValue);
  return resolvedValue === trimmedValue ? resolvedValue : null;
};

const countProgressEntries = (value) => (Array.isArray(value) ? value.length : 0);

const readProgressCount = (value, fallbackEntries) => {
  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return Math.floor(numericValue);
  }

  return countProgressEntries(fallbackEntries);
};

const buildPhoneProgressSummary = ({
  isAuthenticated = false,
  selectedTrialLearningPath = null,
  selectedTrialTrack = null,
  storyState = null,
  storedGuestProgress = {},
} = {}) => {
  const storyProgressSummary =
    storyState?.progressSummary && typeof storyState.progressSummary === 'object'
      ? storyState.progressSummary
      : null;
  const progressSource =
    !isAuthenticated && storedGuestProgress && typeof storedGuestProgress === 'object'
      ? storedGuestProgress
      : storyProgressSummary;

  if (!progressSource || typeof progressSource !== 'object') {
    return null;
  }

  const problemsAttemptedCount = readProgressCount(
    progressSource.problemsAttemptedCount,
    progressSource.problemsAttempted
  );
  const problemsSolvedCount = readProgressCount(
    progressSource.problemsSolvedCount,
    progressSource.problemsSolved
  );
  const lpNodesStartedCount = readProgressCount(
    progressSource.lpNodesStartedCount,
    progressSource.lpNodesStarted
  );
  const lpNodesCompletedCount = readProgressCount(
    progressSource.lpNodesCompletedCount,
    progressSource.lpNodesCompleted
  );
  const clustersBrowsedCount = readProgressCount(
    progressSource.clustersBrowsedCount,
    progressSource.clustersBrowsed
  );
  const learningTrialSolvedCount = selectedTrialLearningPath
    ? Math.min(problemsSolvedCount, PHONE_LEARNING_TRIAL_PROBLEM_LIMIT)
    : null;
  const learningTrialProblemsRemaining =
    learningTrialSolvedCount == null
      ? null
      : Math.max(0, PHONE_LEARNING_TRIAL_PROBLEM_LIMIT - learningTrialSolvedCount);
  const clusterTrialSolvedCount =
    selectedTrialTrack === 'pro' || clustersBrowsedCount > 0
      ? Math.min(problemsSolvedCount, PHONE_CLUSTER_TRIAL_PROBLEM_LIMIT)
      : 0;

  return {
    clusterFreeProblemsRemaining: Math.max(
      0,
      PHONE_CLUSTER_TRIAL_PROBLEM_LIMIT - clusterTrialSolvedCount
    ),
    clusterTrialProblemLimit: PHONE_CLUSTER_TRIAL_PROBLEM_LIMIT,
    clusterTrialSolvedCount,
    clustersBrowsedCount,
    learningNodesCompletedCount: lpNodesCompletedCount,
    learningNodesStartedCount: lpNodesStartedCount,
    learningTrialProblemLimit: PHONE_LEARNING_TRIAL_PROBLEM_LIMIT,
    learningTrialProblemsRemaining,
    learningTrialSolvedCount,
    problemsAttemptedCount,
    problemsSolvedCount,
  };
};

export const buildPreviewEntryState = ({
  isAuthenticated = false,
  isMobileDevice = false,
  requestedApartmentState = null,
  requestedSelectedLearningPath = null,
  requestedSelectedTrack = null,
  storyState = null,
  storedGuestProgress = {},
} = {}) => {
  const persistedApartmentState = isAuthenticated ? storyState?.apartmentState || null : null;
  const selectedTrialTrack =
    requestedSelectedTrack ||
    (isAuthenticated
      ? storyState?.selectedTrialTrack || null
      : storedGuestProgress?.selectedTrialTrack ||
        storedGuestProgress?.progress?.pathChoice ||
        storedGuestProgress?.pathChoice ||
        null);
  const selectedTrialLearningPath =
    requestedSelectedLearningPath ||
    (isAuthenticated
      ? storyState?.selectedTrialLearningPath || null
      : storedGuestProgress?.selectedTrialLearningPath ||
        storedGuestProgress?.progress?.selectedLearningPath ||
        storedGuestProgress?.selectedLearningPath ||
        null);
  const selectedPlayerCharacterId = isAuthenticated
    ? storyState?.selectedPlayerCharacterId || null
    : storedGuestProgress?.selectedPlayerCharacterId ||
      storedGuestProgress?.progress?.selectedPlayerCharacterId ||
      null;
  const routeMissionState = isAuthenticated
    ? normalizeCityMissionState(storyState?.routeMissionState) || null
    : normalizeCityMissionState(storedGuestProgress?.cityMissionState) ||
      normalizeCityMissionState(storedGuestProgress?.progress?.cityMissionState) ||
      null;
  const guestResolvedApartmentState = resolveApartmentCityEntryState({
    apartmentState: requestedApartmentState,
    hasCompletedDemo: Boolean(storedGuestProgress?.demoCompleted),
    hasChosenPath: Boolean(selectedTrialTrack),
  });
  const shouldForceHubState =
    isAuthenticated && storyState?.selectedTrialTrack && storyState?.apartmentState !== 'intro';
  const resolvedApartmentState =
    isAuthenticated && !selectedTrialTrack
      ? 'intro'
      : shouldForceHubState
        ? persistedApartmentState || 'hub'
        : isAuthenticated
          ? requestedApartmentState || persistedApartmentState || 'hub'
          : guestResolvedApartmentState;
  const normalizedSelectedTrialTrack =
    typeof selectedTrialTrack === 'string' ? selectedTrialTrack : null;
  const normalizedSelectedTrialLearningPath =
    typeof selectedTrialLearningPath === 'string' ? selectedTrialLearningPath : null;
  const normalizedSelectedPlayerCharacterId =
    normalizeSelectedPlayerCharacterId(selectedPlayerCharacterId);
  const progressSummary = buildPhoneProgressSummary({
    isAuthenticated,
    selectedTrialLearningPath: normalizedSelectedTrialLearningPath,
    selectedTrialTrack: normalizedSelectedTrialTrack,
    storyState,
    storedGuestProgress,
  });

  return {
    apartmentShellId: resolveApartmentShellId({
      apartmentState: resolvedApartmentState,
      deviceClass: isMobileDevice ? 'phone' : 'desktop',
    }),
    guestPhoneContext: {
      hasChosenPath: Boolean(normalizedSelectedTrialTrack),
      isAuthenticated,
      progressSummary,
      routeMissionState,
      selectedPlayerCharacterId: normalizedSelectedPlayerCharacterId,
      selectedTrialLearningPath: normalizedSelectedTrialLearningPath,
      selectedTrialTrack: normalizedSelectedTrialTrack,
    },
    resolvedApartmentState,
  };
};
