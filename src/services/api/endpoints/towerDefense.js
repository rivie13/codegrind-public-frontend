import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';
import { requestAdProofToken } from './adRewards';

const towerDefense = {
  submitScore: async (
    userId,
    problemId,
    solutionStatus,
    gameStatus,
    score,
    time,
    problemType = 'CODEGRIND',
    extra = {}
  ) => {
    logger.info('Submitting tower defense score:');
    logger.debug({ userId, problemId, score, time, solutionStatus, gameStatus });

    try {
      return await fetchWithError('/api/tower-defense/scores', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          problemId,
          solutionStatus,
          gameStatus,
          score,
          time,
          problemType,
          ...extra,
        }),
      });
    } catch (error) {
      logger.error('Error submitting tower defense score:');
      logger.debug(error.stack);
      throw error;
    }
  },
  getScores: async (userId) => {
    logger.info('Fetching tower defense scores:');
    logger.debug({ userId });
    return fetchWithError(`/api/tower-defense/scores/${userId}`);
  },
  getScoresBulk: async (userId, problemIds = [], problemType = 'CODEGRIND') => {
    logger.info('Fetching bulk tower defense scores:');
    logger.debug({ userId, count: problemIds.length, problemType });
    return fetchWithError('/api/tower-defense/scores/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemIds, problemType }),
    });
  },

  // New method for AI-powered code snippet generation
  generateSnippet: async (context, towerType, userInfo = null, model = null) => {
    logger.info(
      `[TowerDefense] Generating AI code snippet for ${towerType} in ${context.language}`
    );
    logger.debug({
      operation: 'frontend_generate_snippet_request',
      towerType,
      language: context.language,
      contextSize: {
        codeLength: context.code?.length || 0,
        problemLength: context.problem?.length || 0,
        towerCount: context.towerCount || 1,
      },
    });

    try {
      // Add user information to the request
      const userData = userInfo || {
        status: localStorage.getItem('user_id')
          ? localStorage.getItem('email_verified') === 'true'
            ? 'verified'
            : 'unverified'
          : 'anonymous',
        userId: localStorage.getItem('user_id'),
        membershipTier:
          (localStorage.getItem('membership_tier') || 'FREE').toUpperCase() === 'PRO'
            ? 'PREMIUM'
            : localStorage.getItem('membership_tier') || 'FREE',
      };

      // Get session token from sessionStorage to track browser sessions
      if (!userData.sessionToken && window.sessionStorage) {
        if (!window.sessionStorage.getItem('snippet_session_token')) {
          const newToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          window.sessionStorage.setItem('snippet_session_token', newToken);
          logger.info(`[TowerDefense] Generated new session token: ${newToken}`);
        }
        userData.sessionToken = window.sessionStorage.getItem('snippet_session_token');
      }

      logger.info(`[TowerDefense] Using session token: ${userData.sessionToken}`);

      logger.info(
        '[TowerDefense] Routing to Node.js backend endpoint: /api/tower-defense/generate-snippet'
      );

      // Record the start time to measure request duration
      const startTime = Date.now();

      // Use fetchWithError to automatically handle CSRF tokens
      const data = await fetchWithError('/api/tower-defense/generate-snippet', {
        method: 'POST',
        body: JSON.stringify({ context, towerType, userInfo: userData, ...(model && { model }) }),
      });

      const requestTime = Date.now() - startTime;
      logger.info(`[TowerDefense] Received response in ${requestTime}ms`);

      logger.info(
        `[TowerDefense] Snippet generation successful, snippet length: ${data.snippet?.length || 0} chars`
      );
      logger.debug({
        operation: 'frontend_generate_snippet_success',
        requestTimeMs: requestTime,
        snippetLength: data.snippet?.length || 0,
        rateLimit: data.rateLimit
          ? `${data.rateLimit.remaining}/${data.rateLimit.limit}`
          : 'not provided',
        rateLimitInfo: data.rateLimit || 'none',
      });

      // Store rate limit info in localStorage
      if (data.rateLimit) {
        const rateLimitKey = userData.userId
          ? `snippet_rate_${userData.userId}`
          : 'snippet_rate_anonymous';

        const previousRateLimit = localStorage.getItem(rateLimitKey)
          ? JSON.parse(localStorage.getItem(rateLimitKey))
          : null;

        localStorage.setItem(
          rateLimitKey,
          JSON.stringify({
            limit: data.rateLimit.limit,
            remaining: data.rateLimit.remaining,
            reset: data.rateLimit.reset,
            resetIn: data.rateLimit.resetIn,
            resetPeriod: data.rateLimit.resetPeriod,
          })
        );

        // Log if rate limit has changed
        if (previousRateLimit && previousRateLimit.remaining !== data.rateLimit.remaining) {
          logger.info(
            `[TowerDefense] Rate limit updated: ${data.rateLimit.remaining}/${data.rateLimit.limit} (was ${previousRateLimit.remaining}/${previousRateLimit.limit})`
          );
        }
      }

      return data;
    } catch (error) {
      logger.error(`[TowerDefense] Error generating AI snippet: ${error.message}`);
      logger.debug({
        operation: 'frontend_generate_snippet_error',
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        errorStatus: error.status,
        requestInfo: {
          towerType,
          language: context.language,
        },
      });

      if (error.status === 429) {
        return {
          rateLimited: true,
          rateLimit: error.data?.rateLimit || null,
          error: error.data?.error || 'Rate limit exceeded',
          message: error.data?.message || 'You have reached your AI snippet generation limit.',
        };
      }

      // Return null to trigger fallback in the caller
      return null;
    }
  },

  // Check rate limit status for AI snippet generation
  checkRateLimit: async (userInfo = null) => {
    logger.info('[TowerDefense] Checking AI snippet rate limit');

    try {
      // Add user information to the request
      const userData = userInfo || {
        status: localStorage.getItem('user_id')
          ? localStorage.getItem('email_verified') === 'true'
            ? 'verified'
            : 'unverified'
          : 'anonymous',
        userId: localStorage.getItem('user_id'),
        membershipTier:
          (localStorage.getItem('membership_tier') || 'FREE').toUpperCase() === 'PRO'
            ? 'PREMIUM'
            : localStorage.getItem('membership_tier') || 'FREE',
      };

      // Get session token from sessionStorage
      if (!userData.sessionToken && window.sessionStorage) {
        if (!window.sessionStorage.getItem('snippet_session_token')) {
          const newToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          window.sessionStorage.setItem('snippet_session_token', newToken);
          logger.info(`[TowerDefense] Generated new session token for rate check: ${newToken}`);
        }
        userData.sessionToken = window.sessionStorage.getItem('snippet_session_token');
      }

      logger.info(`[TowerDefense] Checking rate with session token: ${userData.sessionToken}`);

      // Build query parameters
      const params = new URLSearchParams({
        status: userData.status,
      });

      if (userData.userId) {
        params.append('userId', userData.userId);
      }

      if (userData.membershipTier) {
        params.append('membershipTier', userData.membershipTier);
      }

      if (userData.sessionToken) {
        params.append('sessionToken', userData.sessionToken);
      }

      const endpoint = `/api/tower-defense/rate-limit-status?${params.toString()}`;

      logger.info(`[TowerDefense] Routing rate check to Node.js backend endpoint: ${endpoint}`);

      // Record start time
      const startTime = Date.now();

      const data = await fetchWithError(endpoint, {
        method: 'GET',
      });

      const requestTime = Date.now() - startTime;
      logger.info(`[TowerDefense] Received rate limit response in ${requestTime}ms`);

      logger.info(`[TowerDefense] Rate limit status: ${data.remaining}/${data.limit} remaining`);
      logger.debug({
        operation: 'frontend_rate_limit_check_success',
        requestTimeMs: requestTime,
        rateLimit: data,
      });

      // Store updated rate limit info in localStorage
      const rateLimitKey = userData.userId
        ? `snippet_rate_${userData.userId}`
        : 'snippet_rate_anonymous';

      localStorage.setItem(
        rateLimitKey,
        JSON.stringify({
          limit: data.limit,
          remaining: data.remaining,
          reset: data.reset,
          resetIn: data.resetIn,
          resetPeriod: data.resetPeriod,
        })
      );

      return data;
    } catch (error) {
      logger.error(`[TowerDefense] Error checking rate limit: ${error.message}`);
      logger.debug({
        operation: 'frontend_rate_limit_check_error',
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      // Return fallback status based on user type - ensure we use the right variable scope
      const userStatus =
        (userInfo || {}).status ||
        (localStorage.getItem('user_id')
          ? localStorage.getItem('email_verified') === 'true'
            ? 'verified'
            : 'unverified'
          : 'anonymous');

      logger.info(`[TowerDefense] Using fallback rate limit values for ${userStatus} user`);

      const resetPeriod = userStatus === 'verified' ? 86400 : 600; // 24h or 10m
      return {
        limit: userStatus === 'verified' ? 20 : userStatus === 'unverified' ? 10 : 5,
        used: 0,
        remaining: userStatus === 'verified' ? 20 : userStatus === 'unverified' ? 10 : 5,
        resetPeriod: resetPeriod,
        resetIn: resetPeriod,
      };
    }
  },
  addSnippetCredit: async (userInfo = null, adType = 'short') => {
    logger.info('[TowerDefense] Adding AI snippet credit');

    try {
      const userData = userInfo || {
        status: localStorage.getItem('user_id')
          ? localStorage.getItem('email_verified') === 'true'
            ? 'verified'
            : 'unverified'
          : 'anonymous',
        userId: localStorage.getItem('user_id'),
        membershipTier:
          (localStorage.getItem('membership_tier') || 'FREE').toUpperCase() === 'PRO'
            ? 'PREMIUM'
            : localStorage.getItem('membership_tier') || 'FREE',
      };

      if (!userData.sessionToken && window.sessionStorage) {
        if (!window.sessionStorage.getItem('snippet_session_token')) {
          const newToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          window.sessionStorage.setItem('snippet_session_token', newToken);
        }
        userData.sessionToken = window.sessionStorage.getItem('snippet_session_token');
      }

      const adProofToken = await requestAdProofToken('tower-defense-snippet-credit', adType);

      const data = await fetchWithError('/api/tower-defense/add-snippet-credit', {
        method: 'POST',
        body: JSON.stringify({
          status: userData.status,
          userId: userData.userId,
          sessionToken: userData.sessionToken,
          adType,
          adProofToken,
          membershipTier: userData.membershipTier,
        }),
      });

      return data;
    } catch (error) {
      logger.error('[TowerDefense] Error adding snippet credit:', error);
      throw error;
    }
  },
  refineSolution: async (params) => {
    try {
      const { code, problem, language, userId, membershipTier, model } = params;

      logger.info(
        '[TowerDefense] Sending refinement request to Node.js backend: /api/tower-defense/refine-solution'
      );
      logger.debug({
        operation: 'frontend_refine_solution_request',
        problemId: problem.id,
        titleSlug: problem.titleSlug,
        language,
        codeLength: code.length,
        hostname: window.location.hostname,
      });

      // Record the start time to measure request duration
      const startTime = Date.now();

      // Use fetchWithError to automatically handle CSRF tokens and JSON parsing
      const data = await fetchWithError('/api/tower-defense/refine-solution', {
        method: 'POST',
        body: JSON.stringify({
          code,
          problem,
          language,
          userId,
          membershipTier,
          ...(model && { model }),
        }),
      });

      const requestTime = Date.now() - startTime;
      logger.info(`[TowerDefense] Received refinement response in ${requestTime}ms`);

      // Check for rate limit or error response first
      if (data.error || data.showAd) {
        logger.info(`[TowerDefense] Received error/rate limit response:`, {
          error: data.error,
          showAd: data.showAd,
          rateLimit: data.rateLimit,
        });
        return data;
      }

      // Check if we already have refined code property directly from server
      if (data.refinedCode) {
        logger.info(
          `[TowerDefense] Server returned pre-processed code of length: ${data.refinedCode.length}`
        );
        return data;
      }

      // If we have a raw response, we need to process it
      if (data.response) {
        logger.info(`[TowerDefense] Processing raw AI response of length: ${data.response.length}`);
        // Process the response to extract code
        const refinedCode = extractCodeFromResponse(data.response);

        logger.info(`[TowerDefense] Extracted code of length: ${refinedCode.length}`);
        return {
          ...data,
          refinedCode,
        };
      }

      // If we have neither, log error but return original data
      logger.error(`[TowerDefense] Could not find code in response:`, data);
      return data;
    } catch (error) {
      logger.error('[TowerDefense] Error refining solution:', error);
      throw error;
    }
  },
  resetRefinementLimit: async (userId) => {
    try {
      logger.info(
        '[TowerDefense] Resetting refinement limit via Node.js backend: /api/tower-defense/reset-refinement-limit'
      );

      const adProofToken = await requestAdProofToken('tower-defense-reset-refinement', 'full');

      // Use fetchWithError to automatically handle CSRF tokens
      // fetchWithError already returns parsed JSON data, not the response object
      const data = await fetchWithError('/api/tower-defense/reset-refinement-limit', {
        method: 'POST',
        body: JSON.stringify({ userId, adProofToken }),
      });

      return data;
    } catch (error) {
      console.error('Error resetting refinement limit:', error);
      throw error;
    }
  },
};

// Helper function to extract code from AI response
function extractCodeFromResponse(response) {
  // Extract code blocks from markdown if present
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // If no code block found, try to clean up the response
  // Remove common intro phrases
  let cleanedResponse = response;
  const introPatterns = [
    /^.*?Here\'s the refined code:.*?\n/i,
    /^.*?The refined code:.*?\n/i,
    /^.*?Here\'s a refined version:.*?\n/i,
    /^.*?Here is the refined solution:.*?\n/i,
    /^.*?Refined solution:.*?\n/i,
    /^.*?Let\'s refine this code.*?\n/i,
    /^.*?I\'ve refined the code.*?\n/i,
    /^.*?I\'ll improve the solution.*?\n/i,
  ];

  introPatterns.forEach((pattern) => {
    cleanedResponse = cleanedResponse.replace(pattern, '');
  });

  // Remove trailing explanations
  const outroPatterns = [
    /\n\n.*?(explanation|improvements|changes|optimizations|fixes).*?$/i,
    /\n\n.*?This refined version.*?$/i,
    /\n\n.*?In this solution.*?$/i,
  ];

  outroPatterns.forEach((pattern) => {
    cleanedResponse = cleanedResponse.replace(pattern, '');
  });

  return cleanedResponse.trim();
}

export default towerDefense;
