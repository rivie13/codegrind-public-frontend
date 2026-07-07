import { fetchWithError } from './api/fetcher';
import { trackGoogleAnalyticsEvent } from './analyticsService';
import logger from '../utils/core/logger';

const ENDPOINT = '/api/analytics/user-content';
const POST_SIGNUP_CONTEXT_KEY = 'codegrind_post_signup_context';
const POST_SIGNUP_FIRST_CONTENT_KEY = 'codegrind_post_signup_first_content_sent';
const POST_SIGNUP_FIRST_MEANINGFUL_KEY = 'codegrind_post_signup_first_meaningful_sent';
const POST_SIGNUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const POST_SIGNUP_MEANINGFUL_EVENTS = new Set([
  'user_problem_started',
  'user_problem_solved',
  'user_learning_node_completed',
  'user_social_share',
]);

const now = () => Date.now();

const createSignupSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `signup-${now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const safeGetStorageItem = (storage, key) => {
  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
};

const safeSetStorageItem = (storage, key, value) => {
  try {
    storage?.setItem(key, value);
  } catch {
    // Best effort only.
  }
};

const safeRemoveStorageItem = (storage, key) => {
  try {
    storage?.removeItem(key);
  } catch {
    // Best effort only.
  }
};

const getCurrentRoute = () => {
  if (typeof window === 'undefined') return 'unknown';
  return window.location?.pathname || 'unknown';
};

const getPostSignupAgeBucket = (minutesSinceSignup) => {
  if (minutesSinceSignup < 1) return 'under_1m';
  if (minutesSinceSignup < 5) return '1m_to_5m';
  if (minutesSinceSignup < 30) return '5m_to_30m';
  if (minutesSinceSignup < 120) return '30m_to_2h';
  if (minutesSinceSignup < 1440) return '2h_to_24h';
  if (minutesSinceSignup < 4320) return '1d_to_3d';
  return '3d_to_7d';
};

const parsePostSignupContext = () => {
  if (typeof window === 'undefined') return null;

  const raw = safeGetStorageItem(window.localStorage, POST_SIGNUP_CONTEXT_KEY);
  if (!raw) return null;

  try {
    const context = JSON.parse(raw);
    if (!context || typeof context !== 'object') {
      return null;
    }

    const createdAtMs = Number(context.createdAtMs);
    if (!Number.isFinite(createdAtMs) || now() - createdAtMs > POST_SIGNUP_WINDOW_MS) {
      return null;
    }

    return context;
  } catch {
    return null;
  }
};

const getActivePostSignupContext = () => {
  const context = parsePostSignupContext();
  if (context) {
    return context;
  }

  clearPostSignupTelemetrySession();
  return null;
};

const buildPostSignupMetadata = (context) => {
  if (!context) return {};

  const minutesSinceSignup = Math.max(0, Math.floor((now() - Number(context.createdAtMs)) / 60000));
  return {
    signupSessionId: context.signupSessionId,
    signupSource: context.signupSource,
    signupAuthProvider: context.signupAuthProvider,
    signupEntryRoute: context.signupEntryRoute,
    signupGuestTrialState: context.signupGuestTrialState,
    signupAgeMinutes: String(minutesSinceSignup),
    signupAgeBucket: getPostSignupAgeBucket(minutesSinceSignup),
  };
};

const postUserContentEvent = async (eventName, metadata = {}) => {
  trackGoogleAnalyticsEvent(eventName, metadata);

  await fetchWithError(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, metadata }),
  });
};

const maybeEmitDerivedPostSignupEvents = async (eventName, metadata) => {
  if (typeof window === 'undefined') return;

  const context = getActivePostSignupContext();
  if (!context) return;

  if (
    eventName === 'user_content_surface_opened' &&
    safeGetStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_CONTENT_KEY) !== '1'
  ) {
    safeSetStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_CONTENT_KEY, '1');
    await postUserContentEvent('user_post_signup_first_content_opened', {
      ...metadata,
      triggerEventName: eventName,
    });
  }

  if (
    POST_SIGNUP_MEANINGFUL_EVENTS.has(eventName) &&
    safeGetStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_MEANINGFUL_KEY) !== '1'
  ) {
    safeSetStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_MEANINGFUL_KEY, '1');
    await postUserContentEvent('user_post_signup_first_meaningful_action', {
      ...metadata,
      triggerEventName: eventName,
    });
  }
};

export const beginPostSignupTelemetrySession = ({
  signupSource,
  signupGuestTrialState,
  signupAuthProvider,
  signupEntryRoute,
  emailVerified,
  membershipTier,
  progressSummary = {},
} = {}) => {
  if (typeof window === 'undefined') return null;

  const context = {
    signupSessionId: createSignupSessionId(),
    createdAtMs: now(),
    signupSource: signupSource || 'unknown',
    signupGuestTrialState: signupGuestTrialState || 'unknown',
    signupAuthProvider: signupAuthProvider || 'unknown',
    signupEntryRoute: signupEntryRoute || getCurrentRoute(),
    emailVerified: emailVerified || 'unknown',
    membershipTier: membershipTier || 'unknown',
    demoCompleted: progressSummary.demoCompleted || 'false',
    pathChoice: progressSummary.pathChoice || 'none',
    trialLearningPath: progressSummary.trialLearningPath || 'none',
    problemsAttemptedCount: progressSummary.problemsAttemptedCount || '0',
    problemsSolvedCount: progressSummary.problemsSolvedCount || '0',
    lpNodesCompletedCount: progressSummary.lpNodesCompletedCount || '0',
    hadGuestToken: progressSummary.hadGuestToken || 'false',
  };

  safeSetStorageItem(window.localStorage, POST_SIGNUP_CONTEXT_KEY, JSON.stringify(context));
  safeRemoveStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_CONTENT_KEY);
  safeRemoveStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_MEANINGFUL_KEY);
  return context;
};

export const clearPostSignupTelemetrySession = () => {
  if (typeof window === 'undefined') return;

  safeRemoveStorageItem(window.localStorage, POST_SIGNUP_CONTEXT_KEY);
  safeRemoveStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_CONTENT_KEY);
  safeRemoveStorageItem(window.sessionStorage, POST_SIGNUP_FIRST_MEANINGFUL_KEY);
};

export async function trackUserContentEvent(eventName, metadata = {}) {
  const postSignupContext = getActivePostSignupContext();
  const enrichedMetadata = {
    ...metadata,
    ...buildPostSignupMetadata(postSignupContext),
    ...(postSignupContext
      ? {
          signupEmailVerified: postSignupContext.emailVerified,
          signupMembershipTier: postSignupContext.membershipTier,
        }
      : {}),
  };

  try {
    await postUserContentEvent(eventName, enrichedMetadata);
    await maybeEmitDerivedPostSignupEvents(eventName, enrichedMetadata);
  } catch (err) {
    logger.warn(`[userContentEvent] Failed to record event "${eventName}":`, err.message);
  }
}
