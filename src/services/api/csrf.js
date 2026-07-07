import logger from '../../utils/core/logger';
import { getApiOrigin } from './base';

// Add CSRF token handling
let csrfToken = null;
let csrfTokenPromise = null;

const clearCsrfToken = () => {
  logger.info('[CSRF] Clearing CSRF token due to session change');
  csrfToken = null;
  csrfTokenPromise = null;
};

const fetchCsrfToken = async (forceRefresh = false) => {
  if (!forceRefresh && csrfTokenPromise) {
    return csrfTokenPromise;
  }

  const baseUrl = getApiOrigin().replace(/\/api\/?$/, '');
  logger.info(`[CSRF] Fetching CSRF token from ${baseUrl}/api/csrf-token`);

  // Clear any existing token to force a fresh fetch
  csrfToken = null;

  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${baseUrl}/api/csrf-token`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      csrfToken = data.token;
      logger.info(
        `[CSRF] Token fetched successfully, length: ${csrfToken?.length}, first 20 chars: ${csrfToken?.substring(0, 20)}...`
      );

      return csrfToken;
    } catch (error) {
      logger.error('[CSRF] Failed to fetch CSRF token:', error);
      throw error;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
};

const getCsrfToken = () => csrfToken;

export { clearCsrfToken, fetchCsrfToken, getCsrfToken };
