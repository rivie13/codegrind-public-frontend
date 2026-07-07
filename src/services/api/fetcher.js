import logger from '../../utils/core/logger';
import { API_URL, AI_SERVER_URL } from './config';
import { fetchCsrfToken, getCsrfToken } from './csrf';

// Custom error for VM starting state
class VmStartingError extends Error {
  constructor(message, errorCode) {
    super(message);
    this.name = 'VmStartingError';
    this.errorCode = errorCode;
  }
}

const GUEST_TOKEN_KEY = 'guest_token';
const AUTHENTICATED_USER_ID_KEY = 'user_id';
let guestTokenCache = null;
let guestTokenPromise = null;

const clearGuestToken = () => {
  guestTokenCache = null;
  guestTokenPromise = null;
  localStorage.removeItem(GUEST_TOKEN_KEY);
};

const loadGuestToken = () => {
  if (guestTokenCache) {
    return guestTokenCache;
  }
  const stored = localStorage.getItem(GUEST_TOKEN_KEY);
  if (stored) {
    guestTokenCache = stored;
  }
  return guestTokenCache;
};

const requestGuestToken = async () => {
  if (guestTokenPromise) {
    return guestTokenPromise;
  }

  guestTokenPromise = (async () => {
    const data = await fetchWithError('/api/guest/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      skipGuestToken: true,
    });

    if (data?.token) {
      guestTokenCache = data.token;
      localStorage.setItem(GUEST_TOKEN_KEY, data.token);
      return data.token;
    }

    return null;
  })();

  try {
    return await guestTokenPromise;
  } finally {
    guestTokenPromise = null;
  }
};

const ensureGuestToken = async () => {
  const cached = loadGuestToken();
  if (cached) {
    return cached;
  }
  return requestGuestToken();
};

const hasAuthenticatedUserHint = () => {
  const storedUserId = localStorage.getItem(AUTHENTICATED_USER_ID_KEY);
  return typeof storedUserId === 'string' && storedUserId.trim().length > 0;
};

const fetchWithError = async (endpoint, options = {}) => {
  const {
    skipGuestToken,
    guestTokenRetried = false,
    csrfRetried = false,
    ...requestOptions
  } = options;
  const requestMethod = (requestOptions.method || 'GET').toUpperCase();
  //I need to check if the endpoint is for chat or not
  const isLocalChatEndpoint = endpoint.includes('/chat/local');
  const isChatEndpoint = endpoint.includes('/chat/');

  // Check if endpoint is exempt from CSRF protection
  const csrfExemptPaths = ['/api/csrf-token', '/api/auth/register', '/api/analytics/guest-funnel'];
  const isCsrfExempt = csrfExemptPaths.some(
    (path) => endpoint === path || endpoint.startsWith(path)
  );
  const requiresCsrf =
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(requestMethod) &&
    !isLocalChatEndpoint &&
    !isCsrfExempt;

  let baseUrl;
  if (isLocalChatEndpoint) {
    baseUrl = AI_SERVER_URL;
  } else {
    baseUrl = API_URL;
  }
  const url = `${baseUrl}${endpoint}`;

  // Enhanced logging for chat endpoints
  if (isChatEndpoint) {
    // logger.info('Making chat request:');
    // logger.debug({
    //   url,
    //   method: options.method || 'GET',
    //   isLocalChat: isLocalChatEndpoint,
    //   baseUrl,
    //   endpoint,
    // });
  } else {
    // logger.info('Making request:');
    // logger.debug({ url, method: options.method || 'GET' });
  }

  try {
    // Ensure we have a CSRF token for non-chat, non-exempt endpoints
    const csrfToken = getCsrfToken();
    if (requiresCsrf && !csrfToken) {
      logger.info('Fetching CSRF token for request');
      await fetchCsrfToken();
    }

    // Add CSRF token to headers for non-chat, non-exempt endpoints
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...requestOptions.headers,
    };

    const refreshedCsrfToken = getCsrfToken();
    if (requiresCsrf && refreshedCsrfToken) {
      headers['X-CSRF-Token'] = refreshedCsrfToken;
      // logger.debug({
      //   csrfTokenPresent: !!refreshedCsrfToken,
      //   csrfTokenLength: refreshedCsrfToken?.length,
      // });
    }

    const guestEligiblePaths = [
      '/api/chat',
      '/api/run-code',
      '/api/ai-problems/run-code',
      '/api/ai-problems/submit',
      '/api/code-execution',
      '/api/learning-problems',
      '/api/problems',
      '/api/tower-defense/generate-snippet',
      '/api/tower-defense/rate-limit-status',
      '/api/tower-defense/add-snippet-credit',
      '/api/tower-defense/scores',
      '/api/tower-defense/refine-solution',
      '/api/tower-defense/reset-refinement-limit',
      '/api/analytics/guest-funnel',
      '/api/guest/progress',
      '/api/guest/limit-check',
      '/api/auth/register',
      '/api/auth/ad-proof',
    ];
    const guestOptionalPaths = ['/api/prewarm', '/api/email/bug-report'];
    const isGuestEligible = guestEligiblePaths.some((path) => endpoint.startsWith(path));
    const shouldAttachCachedGuestToken = guestOptionalPaths.some((path) =>
      endpoint.startsWith(path)
    );
    const shouldSkipGuestTokenForAuthenticatedUser =
      hasAuthenticatedUserHint() && !endpoint.startsWith('/api/auth/register');

    if (
      !skipGuestToken &&
      !shouldSkipGuestTokenForAuthenticatedUser &&
      isGuestEligible &&
      !headers['x-guest-token']
    ) {
      const guestToken = await ensureGuestToken();
      if (guestToken) {
        headers['x-guest-token'] = guestToken;
      }
    } else if (
      !skipGuestToken &&
      !shouldSkipGuestTokenForAuthenticatedUser &&
      shouldAttachCachedGuestToken &&
      !headers['x-guest-token']
    ) {
      const guestToken = loadGuestToken();
      if (guestToken) {
        headers['x-guest-token'] = guestToken;
      }
    }

    const response = await fetch(url, {
      ...requestOptions,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (
        response.status === 401 &&
        isGuestEligible &&
        !skipGuestToken &&
        !guestTokenRetried &&
        !shouldSkipGuestTokenForAuthenticatedUser
      ) {
        clearGuestToken();
        const freshGuestToken = await ensureGuestToken();
        if (freshGuestToken) {
          return fetchWithError(endpoint, {
            ...requestOptions,
            headers: {
              ...requestOptions.headers,
              'x-guest-token': freshGuestToken,
            },
            skipGuestToken: true,
            guestTokenRetried: true,
          });
        }
      }

      // Try to parse error response for more details
      let errorData;
      try {
        errorData = await response.json();
        // eslint-disable-next-line no-unused-vars
      } catch (_jsonError) {
        logger.warn('API Error: Could not parse JSON response for error');
      }

      // Check for VM_STARTING error specifically
      if (response.status === 503 && errorData && errorData.error_code === 'VM_STARTING') {
        logger.warn(`VM Starting: ${errorData.message}`);
        throw new VmStartingError(
          errorData.message ||
            'The code execution environment is preparing. Please try again in a few moments.',
          errorData.error_code
        );
      }

      // If we get a 403 and it's not a chat or exempt endpoint, try refreshing the CSRF token once
      if (response.status === 403 && requiresCsrf && !csrfRetried) {
        logger.warn('Received 403, refreshing CSRF token and retrying');
        await fetchCsrfToken(true);
        logger.debug({
          retryingWithCsrfToken: !!getCsrfToken(),
          csrfTokenLength: getCsrfToken()?.length,
        });
        return fetchWithError(endpoint, {
          ...requestOptions,
          skipGuestToken,
          guestTokenRetried,
          csrfRetried: true,
        });
      }

      // Enhanced error logging for chat endpoints
      const buildError = (message) => {
        const apiError = new Error(message);
        apiError.status = response.status;
        apiError.data = errorData;
        return apiError;
      };

      if (isChatEndpoint) {
        logger.error('Chat API Error:');
        logger.debug({
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          endpoint,
          isLocalChat: isLocalChatEndpoint,
        });

        logger.error('Chat API Error Details:');
        logger.debug(errorData || { message: 'No JSON error body' });
        throw buildError(
          errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`
        );
      } else {
        if (response.status === 401 && endpoint === '/api/auth/check') {
          logger.info(`Auth check status: ${response.status} (User is unauthenticated)`);
        } else {
          logger.error('API Error:');
          logger.debug({
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            errorData: errorData || { message: 'No JSON error body' },
          });
        }
        throw buildError(
          errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`
        );
      }
    }

    if (response.status === 204) {
      return null;
    }

    const responseData = await response.json();

    // Enhanced logging for chat responses
    if (isChatEndpoint) {
      logger.info('Chat response received:');
      logger.debug({
        endpoint,
        responseStructure: Object.keys(responseData),
        hasResponse: !!responseData.response,
        hasMessage: !!responseData.message,
        hasContent: !!responseData.content,
      });
    }

    return responseData;
  } catch (error) {
    if (error.status === 401 && endpoint === '/api/auth/check') {
      logger.info(`API Request Error: Auth check status 401 (User is unauthenticated)`);
    } else {
      logger.error('API Request Error:');
      logger.debug(error.stack);

      // Enhanced error for chat endpoints
      if (isChatEndpoint) {
        logger.error('Chat API Request Failed:');
        logger.debug({
          endpoint,
          url,
          isLocalChat: isLocalChatEndpoint,
          message: error.message,
        });
      }
    }

    throw error;
  }
};

export { clearGuestToken as clearGuestTokenState, fetchWithError, VmStartingError };
