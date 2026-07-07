import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';

const learningProblemsCache = new Map();

const learningProblems = {
  getById: (titleSlug) => {
    if (learningProblemsCache.has(titleSlug)) {
      logger.info(`[CACHE HIT] Returning cached promise for learning problem: ${titleSlug}`);
      return learningProblemsCache.get(titleSlug);
    }
    logger.info('Fetching learning problem:');
    logger.debug(titleSlug);
    const promise = fetchWithError(`/api/learning-problems/${titleSlug}`);
    if (promise && typeof promise.catch === 'function') {
      const caughtPromise = promise.catch((err) => {
        learningProblemsCache.delete(titleSlug);
        throw err;
      });
      learningProblemsCache.set(titleSlug, caughtPromise);
      return caughtPromise;
    }
    return promise;
  },

  _clearCache: () => {
    learningProblemsCache.clear();
  },

  runCode: (code, titleSlug, language, outputOnly = false) => {
    logger.info('Running code for learning problem:');
    logger.debug({ titleSlug, language });
    return fetchWithError('/api/learning-problems/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, titleSlug, language, outputOnly }),
    });
  },
};

export default learningProblems;
