import { useToast } from '@chakra-ui/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { clearGuestTokenState, fetchWithError } from '../services/api/fetcher';
import { trackGuestFunnelStep } from '../services/guestFunnelService';
import { buildCompactMobileShellPath } from '../utils/navigation/mobileShellNavigation';
import {
  beginPostSignupTelemetrySession,
  clearPostSignupTelemetrySession,
  trackUserContentEvent,
} from '../services/userContentEventService';
import { emitCityStoryStateChanged } from '../utils/navigation/cityStoryState';
import useIsMobileDevice from '../hooks/useIsMobileDevice';
import { readStorage, removeStorageItem, writeStorage } from '../utils/web/storage';

//import logger from utils
import logger from '../utils/core/logger';

const PENDING_REGISTERED_USER_ID_KEY = 'codegrind_pending_registered_user_id';

const getGuestMigrationSessionKeys = (guestToken) => ({
  inFlightKey: `guest_migration_inflight:${guestToken}`,
  doneKey: `guest_migration_done:${guestToken}`,
  failedNoticeKey: `guest_migration_failed_notice:${guestToken}`,
});

const getPendingRegisteredUserId = () =>
  readStorage('localStorage', PENDING_REGISTERED_USER_ID_KEY) || null;

const setPendingRegisteredUserId = (userId) => {
  if (userId == null) return;
  writeStorage('localStorage', PENDING_REGISTERED_USER_ID_KEY, String(userId));
};

const clearPendingRegisteredUserId = () => {
  removeStorageItem('localStorage', PENDING_REGISTERED_USER_ID_KEY);
};

const summarizeGuestProgressForSignup = (progressData, guestToken) => {
  const problemsAttemptedCount = Array.isArray(progressData?.problemsAttempted)
    ? progressData.problemsAttempted.length
    : 0;
  const problemsSolvedCount = Array.isArray(progressData?.problemsSolved)
    ? progressData.problemsSolved.length
    : 0;
  const lpNodesCompletedCount = Array.isArray(progressData?.lpNodesCompleted)
    ? progressData.lpNodesCompleted.length
    : 0;

  return {
    demoCompleted: progressData?.demoCompleted ? 'true' : 'false',
    pathChoice: progressData?.pathChoice || 'none',
    trialLearningPath: progressData?.trialLearningPath || 'none',
    problemsAttemptedCount: String(problemsAttemptedCount),
    problemsSolvedCount: String(problemsSolvedCount),
    lpNodesCompletedCount: String(lpNodesCompletedCount),
    hadGuestToken: guestToken ? 'true' : 'false',
  };
};

const hasMeaningfulGuestTrialProgress = (progressSummary) =>
  progressSummary.demoCompleted === 'true' ||
  progressSummary.pathChoice !== 'none' ||
  progressSummary.trialLearningPath !== 'none' ||
  Number(progressSummary.problemsAttemptedCount) > 0 ||
  Number(progressSummary.problemsSolvedCount) > 0 ||
  Number(progressSummary.lpNodesCompletedCount) > 0;

const getSignupGuestTrialState = (progressSummary) => {
  if (hasMeaningfulGuestTrialProgress(progressSummary)) {
    return 'meaningful_guest_progress';
  }

  if (progressSummary.hadGuestToken === 'true') {
    return 'guest_token_no_progress';
  }

  return 'no_guest_token';
};

/**
 * Handle post-auth telemetry and guest-state migration.
 * Only emit signup completion when the auth flow actually created a new account.
 * If a guest token exists, migrate all server-side guest data to the signed-in user.
 */
const handlePostAuthTransition = async ({
  authAction = null,
  currentUser = null,
  onMigrationFailure,
} = {}) => {
  const guestToken = readStorage('localStorage', 'guest_token');
  const rawGuestProgress = readStorage('localStorage', 'codegrind_guest_progress');

  let progressData = null;
  if (rawGuestProgress) {
    try {
      const parsed = JSON.parse(rawGuestProgress);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        progressData = parsed;
      }
    } catch {
      // Best effort only; migration should continue even if local blob is invalid.
    }
  }

  const progressSummary = summarizeGuestProgressForSignup(progressData, guestToken);

  // Only count signup completion when auth actually created a new account.
  const shouldTrackSignupCompleted = authAction === 'register';
  const alreadyTracked = readStorage('sessionStorage', 'guest_funnel_signup_sent');
  if (shouldTrackSignupCompleted && !alreadyTracked) {
    writeStorage('sessionStorage', 'guest_funnel_signup_sent', '1');
    const signupSource = hasMeaningfulGuestTrialProgress(progressSummary)
      ? 'guest_conversion'
      : 'direct_signup';
    const signupRoute =
      typeof window !== 'undefined' ? window.location?.pathname || 'unknown' : 'unknown';

    beginPostSignupTelemetrySession({
      signupSource,
      signupGuestTrialState: getSignupGuestTrialState(progressSummary),
      signupAuthProvider: readStorage('localStorage', 'auth_provider') || 'unknown',
      signupEntryRoute: signupRoute,
      emailVerified: currentUser?.isEmailVerified ? 'true' : 'false',
      membershipTier: currentUser?.membershipTier || 'unknown',
      progressSummary,
    });

    trackGuestFunnelStep(
      hasMeaningfulGuestTrialProgress(progressSummary)
        ? 'signup_completed'
        : 'signup_completed_no_guest_trial',
      progressSummary
    );

    void trackUserContentEvent('user_signup_completed', {
      signupRoute,
      emailVerified: currentUser?.isEmailVerified ? 'true' : 'false',
      membershipTier: currentUser?.membershipTier || 'unknown',
    });
    void trackUserContentEvent('user_post_signup_landing_viewed', {
      landingRoute: signupRoute,
      surface: 'post_signup_entry',
    });
  }

  if (!guestToken) {
    if (authAction === 'register') {
      clearPendingRegisteredUserId();
    }
    return;
  }

  const { inFlightKey, doneKey, failedNoticeKey } = getGuestMigrationSessionKeys(guestToken);
  if (readStorage('sessionStorage', doneKey) === '1') {
    return;
  }
  if (readStorage('sessionStorage', inFlightKey) === '1') {
    return;
  }

  writeStorage('sessionStorage', inFlightKey, '1');

  // Migrate server-side guest data to the authenticated user (fire-and-forget)
  let migrationSucceeded = false;
  try {
    await fetchWithError('/api/guest/migrate', {
      method: 'POST',
      body: JSON.stringify({
        guestToken,
        ...(progressData ? { progressData } : {}),
      }),
      skipGuestToken: true,
    });
    migrationSucceeded = true;
    writeStorage('sessionStorage', doneKey, '1');
    removeStorageItem('sessionStorage', failedNoticeKey);
    logger.info('Guest data migrated successfully');
  } catch (err) {
    // Non-fatal — the user is signed up regardless
    logger.warn('Guest migration failed (non-fatal):', err?.message);
    if (readStorage('sessionStorage', failedNoticeKey) !== '1') {
      writeStorage('sessionStorage', failedNoticeKey, '1');
      onMigrationFailure?.();
    }
  } finally {
    removeStorageItem('sessionStorage', inFlightKey);
  }

  if (!migrationSucceeded) return;

  if (authAction === 'register') {
    clearPendingRegisteredUserId();
  }

  // Clean up client-side guest state only after successful transfer.
  emitCityStoryStateChanged({ reason: 'guest-migration-complete' });
  clearGuestTokenState();
  removeStorageItem('localStorage', 'codegrind_guest_progress');
};

const AuthContext = createContext(null);

const AUTH_CONTEXT_FALLBACK = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthProvider is not mounted');
  },
  register: async () => {
    throw new Error('AuthProvider is not mounted');
  },
  logout: async () => {},
  checkAuth: async () => AUTH_CONTEXT_FALLBACK,
  refreshAuth: async () => AUTH_CONTEXT_FALLBACK,
};

const triggerProviderLogoutInBackground = (providerLogoutUrl) => {
  if (!providerLogoutUrl || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }

  // Avoid navigating users onto the EasyAuth host, which can intermittently strand them on a blank page.
  void window
    .fetch(providerLogoutUrl, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'include',
      keepalive: true,
    })
    .catch((error) => {
      logger.warn('Provider logout request failed', error?.message);
    });
};

export const AuthProvider = ({ children }) => {
  const isMobileDevice = useIsMobileDevice();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const storedUserId = readStorage('localStorage', 'user_id');

  const showGuestMigrationFailureToast = () => {
    if (typeof toast.isActive === 'function' && toast.isActive('guest-migration-failed')) {
      return;
    }

    toast({
      id: 'guest-migration-failed',
      title: 'Guest progress not migrated',
      description:
        'Your account was created, but guest progress could not be moved yet. Contact support if anything is missing.',
      status: 'warning',
      duration: 4500,
      isClosable: true,
      position: 'top',
    });
  };

  const clearAuthStorage = () => {
    removeStorageItem('localStorage', 'user_id');
    removeStorageItem('localStorage', 'email_verified');
    removeStorageItem('localStorage', 'last_login');
    removeStorageItem('localStorage', 'auth_provider');
    removeStorageItem('localStorage', 'membership_tier');
    clearPostSignupTelemetrySession();
  };

  const applyAuthenticatedUser = ({
    user: authenticatedUser,
    authProvider = 'local',
    authAction = null,
  } = {}) => {
    if (!authenticatedUser) {
      throw new Error('Authenticated user is required');
    }

    setUser(authenticatedUser);
    setIsAuthenticated(true);

    writeStorage('localStorage', 'user_id', authenticatedUser.id);
    writeStorage(
      'localStorage',
      'email_verified',
      authenticatedUser.isEmailVerified ? 'true' : 'false'
    );
    writeStorage('localStorage', 'auth_provider', authProvider || 'local');
    writeStorage('localStorage', 'membership_tier', authenticatedUser.membershipTier || 'FREE');
    writeStorage('localStorage', 'last_login', new Date().toISOString());

    handlePostAuthTransition({
      authAction,
      currentUser: authenticatedUser,
      onMigrationFailure: showGuestMigrationFailureToast,
    });
  };

  const checkAuth = async () => {
    try {
      logger.info('Checking auth status from context');
      const userId = readStorage('localStorage', 'user_id');

      // If we have a user ID in localStorage, set initial authenticated state
      if (userId) {
        //logger.info('User ID found in localStorage:', userId);
        // Set as optimistically authenticated while we check
        setIsAuthenticated(true);
      }

      const response = await api.auth.check();

      logger.info('Auth check response:', response);
      if (response.authenticated && response.user) {
        logger.info('User is authenticated:', response.user.username);
        applyAuthenticatedUser({
          user: response.user,
          authProvider: response.authProvider || 'local',
          authAction: response.authAction,
        });
      } else {
        logger.info('User is not authenticated from server check');
        setUser(null);
        setIsAuthenticated(false);
        clearAuthStorage();
      }
    } catch (error) {
      if (Number(error?.status) === 401) {
        logger.info('No active session found during auth check');
        setUser(null);
        setIsAuthenticated(false);
        clearAuthStorage();
        return;
      }

      logger.error('Auth check error:');
      logger.debug(error.stack);

      // If error but we have userId in localStorage, try to keep the session
      const userId = readStorage('localStorage', 'user_id');
      if (userId) {
        logger.info('Error during auth check but userId exists, keeping session');
        // Keep user logged in if we have localStorage data
        // We'll rely on SessionValidator to verify on protected routes
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier, password, options = {}) => {
    try {
      logger.info('Attempting login');
      const response = await api.auth.login(identifier, password, options);

      if (response.user) {
        logger.info('Login successful for:', response.user.username);

        const effectiveAuthAction =
          getPendingRegisteredUserId() === String(response.user.id)
            ? 'register'
            : response.authAction;

        applyAuthenticatedUser({
          user: response.user,
          authProvider: 'local',
          authAction: effectiveAuthAction,
        });

        navigate(isMobileDevice ? buildCompactMobileShellPath('/profile') : '/profile');
        return response;
      } else {
        logger.error('Login response missing user data');
        throw new Error('Invalid login response');
      }
    } catch (error) {
      logger.error('Login error:');
      logger.debug(error.stack);
      throw error;
    }
  };

  const register = async (payload, options = {}) => {
    try {
      logger.info('Attempting registration');
      const response = await api.auth.register(payload, options);

      if (response.user) {
        setPendingRegisteredUserId(response.user.id);
      }

      return response;
    } catch (error) {
      logger.error('Registration error:');
      logger.debug(error.stack);
      throw error;
    }
  };

  const logout = async () => {
    const authProvider = readStorage('localStorage', 'auth_provider') || 'local';

    try {
      logger.info('Logging out user');
      const result = await api.auth.logout(authProvider);

      // Clear user state
      setUser(null);
      setIsAuthenticated(false);

      clearAuthStorage();

      if (result?.providerLogoutUrl) {
        triggerProviderLogoutInBackground(result.providerLogoutUrl);
      }

      if (
        typeof window !== 'undefined' &&
        window.location?.pathname === '/' &&
        typeof window.location.reload === 'function'
      ) {
        window.location.reload();
        return;
      }

      navigate('/');
    } catch (error) {
      logger.error('Logout error:');
      logger.debug(error.stack);

      // Even if logout fails on server, clear local state
      setUser(null);
      setIsAuthenticated(false);
      clearAuthStorage();
      navigate('/');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    refreshAuth: checkAuth, // Allow refreshing auth state
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context) return context;

  logger.error('useAuth() was called outside AuthProvider; using safe fallback context');
  return AUTH_CONTEXT_FALLBACK;
};
