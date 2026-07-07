import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import logger from '../../utils/core/logger';
import { readStorage, removeStorageItem } from '../../utils/web/storage';

// This component helps ensure session persistence during SPA navigation
function SessionValidator({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if we have a locally stored user ID
    const userId = readStorage('localStorage', 'user_id');
    const lastLogin = readStorage('localStorage', 'last_login');
    const authProvider = readStorage('localStorage', 'auth_provider');

    // Only validate session on protected routes and if we think we should be logged in
    const isProtectedRoute =
      !location.pathname.startsWith('/login') &&
      !location.pathname.startsWith('/register') &&
      location.pathname !== '/' &&
      !location.pathname.startsWith('/auth/') && // Don't validate during auth flows
      !location.pathname.startsWith('/about') &&
      !location.pathname.startsWith('/leaderboards') &&
      !location.pathname.startsWith('/privacy-policy') &&
      !location.pathname.startsWith('/updates');

    if (userId && isProtectedRoute) {
      // Handle identity provider issue with Google authentication
      if (location.search.includes('error=wrong_provider') && authProvider === 'google') {
        logger.warn('Detected wrong_provider error with Google auth, attempting to recover');
        const redirectUrl = window.location.origin + '/api/auth/azure-auth-handler?provider=google';
        window.location.href = redirectUrl;
        return;
      }

      logger.info('Validating session on navigation');
      logger.debug(`Current path: ${location.pathname}`);
      logger.debug(`User ID from localStorage: ${userId}`);
      logger.debug(`Last login time: ${lastLogin}`);
      logger.debug(`Auth provider: ${authProvider}`);
      logger.debug(`Hostname: ${window.location.hostname}`);
      logger.debug(`Protocol: ${window.location.protocol}`);

      // Check if running on a domain
      const isDomain = window.location.hostname.includes('codegrind.online');
      if (isDomain) {
        logger.info('Running on codegrind domain');
      }

      // Function to check session with retries
      const checkSessionWithRetry = (attempt = 1, maxAttempts = 3) => {
        logger.info(`Checking session, attempt ${attempt} of ${maxAttempts}`);

        // Perform session check with credentials
        api.auth
          .check()
          .then((result) => {
            if (!result.authenticated) {
              logger.warn('Session validation failed');
              logger.debug('Authentication result:', result);

              // Check if this might be from a recent Google authentication
              const recentLogin = lastLogin && new Date() - new Date(lastLogin) < 300000; // Within the last 5 minutes

              if (recentLogin && attempt < maxAttempts) {
                logger.info(`Recent login detected, retrying (attempt ${attempt})`);
                // Try another session check after a delay
                setTimeout(() => {
                  checkSessionWithRetry(attempt + 1, maxAttempts);
                }, attempt * 1000); // Increasing delay with each attempt
              } else if (recentLogin && authProvider === 'google' && attempt >= maxAttempts) {
                // Try Google-specific recovery one more time
                logger.info('Attempting Google-specific recovery after retry failures');

                // Try query parameter fallback
                if (isDomain) {
                  const recoveryUrl = `/api/auth/check?userId=${userId}`;
                  logger.info(`Making fallback request to: ${recoveryUrl}`);

                  fetch(recoveryUrl, { credentials: 'include' })
                    .then((response) => response.json())
                    .then((data) => {
                      if (data.authenticated) {
                        logger.info('Fallback authentication successful');
                        window.location.reload(); // Reload to apply the session
                      } else {
                        clearStorageAndRedirect();
                      }
                    })
                    .catch(() => {
                      clearStorageAndRedirect();
                    });
                } else {
                  clearStorageAndRedirect();
                }
              } else {
                clearStorageAndRedirect();
              }
            } else {
              logger.info('Session validation successful');
              logger.debug(result.user);
            }
          })
          .catch((error) => {
            if (Number(error?.status) === 401) {
              logger.info(
                'Unauthorized status (401) received during session validation, skipping retries'
              );
              clearStorageAndRedirect();
              return;
            }

            logger.error('Session validation error:');
            logger.debug(error);

            if (attempt < maxAttempts) {
              logger.info(`Retrying after error (attempt ${attempt})`);
              setTimeout(() => {
                checkSessionWithRetry(attempt + 1, maxAttempts);
              }, attempt * 1000);
            } else {
              clearStorageAndRedirect();
            }
          });
      };

      // Function to clear storage and redirect
      const clearStorageAndRedirect = () => {
        logger.warn('Session recovery failed, redirecting to login');
        removeStorageItem('localStorage', 'user_id');
        removeStorageItem('localStorage', 'last_login');
        removeStorageItem('localStorage', 'auth_provider');
        navigate('/', { state: { from: location.pathname } });
      };

      // Start the session check process
      checkSessionWithRetry(1, 3);
    }
  }, [location.pathname, location.search]);

  return children;
}

export default SessionValidator;
