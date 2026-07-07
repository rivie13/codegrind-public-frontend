import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';
import { requestAdProofToken } from './adRewards';

const aiProblems = {
  getAll: (difficulty, page = 1, limit = 10) => {
    logger.info('Fetching AI problems with pagination:');
    logger.debug({ difficulty, page, limit });
    const queryParams = new URLSearchParams({
      ...(difficulty && { difficulty }),
      page: page.toString(),
      limit: limit.toString(),
    });
    return fetchWithError(`/api/ai-problems?${queryParams}`);
  },
  generate: (data) => {
    logger.info('Generating AI problem:');
    const requestBody = {
      step: data.step,
      data: {
        problemType: data.problemType,
        difficulty: data.difficulty,
        language: data.language,
        model: data.model,
        userId: data.userId,
        wackiness: data.wackiness,
        additionalInfo: data.additionalInfo || '',
        previousData: data.previousData || {},
      },
    };

    //logger.debug('Request body:', requestBody);

    return fetchWithError('/api/ai-problems/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  },
  addGenerationCredit: async (adType = 'short') => {
    logger.info('Adding AI problem generation credit');
    const adProofToken = await requestAdProofToken('ai-problem-generation-credit', adType);
    return fetchWithError('/api/ai-problems/add-generation-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType, adProofToken }),
    });
  },
  getRateLimitStatus: () => {
    logger.info('Fetching AI problem generation rate limit status');
    return fetchWithError('/api/ai-problems/rate-limit-status');
  },

  saveProblem: (problem) => {
    logger.info('Saving AI problem:');
    //logger.debug(problem);
    return fetchWithError('/api/ai-problems/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(problem),
    });
  },

  getById: (titleSlug) => {
    logger.info('Fetching AI problem:');
    logger.debug(titleSlug);
    return fetchWithError(`/api/ai-problems/${titleSlug}`);
  },

  runCode: (code, titleSlug, language, codeSnippets, outputOnly = false) => {
    logger.info('Running code for AI problem:');
    logger.debug({ titleSlug, language });
    return fetchWithError('/api/ai-problems/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, titleSlug, language, codeSnippets, outputOnly }),
    });
  },

  saveTempProblem: (problemData) => {
    logger.info('Saving temporary problem data for testing:');
    //logger.debug(problemData);
    return fetchWithError('/api/ai-problems/save-temp-problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(problemData),
    });
  },

  clearTempProblem: (titleSlug) => {
    logger.info('Clearing temporary problem cache:');
    logger.debug({ titleSlug });
    return fetchWithError(`/api/ai-problems/clear-temp-problem/${titleSlug}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  clearAllTempProblems: () => {
    logger.info('Clearing all temporary problem cache');
    return fetchWithError('/api/ai-problems/clear-all-temp-problems', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  submit: (code, titleSlug, language, userId, mode, newTime, codeSnippets, aiUsageCount = null) => {
    logger.info('Submitting solution for AI problem:');
    logger.debug({ titleSlug, language, mode });
    return fetchWithError('/api/ai-problems/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        titleSlug,
        language,
        userId,
        mode,
        newTime,
        codeSnippets,
        aiUsageCount,
      }),
    });
  },

  updateScore: (userId, problemId, newScore, newTime) => {
    logger.info('Updating AI problem score:');
    logger.debug({ userId, problemId, newScore, newTime });
    return fetchWithError('/api/ai-problems/update-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemId, newScore, newTime }),
    });
    //TODO: add a new endpoint for chat with local ai server/azure
    //similar to the chat endpoint but with a different endpoint
    //
  },

  getNextProblem: (problemId, displayNumber) => {
    logger.info('Fetching next AI problem:');
    logger.debug({ problemId, displayNumber });
    return fetchWithError(
      `/api/ai-problems/next/${problemId}${displayNumber ? `?displayNumber=${displayNumber}` : ''}`
    );
  },
};

export default aiProblems;
