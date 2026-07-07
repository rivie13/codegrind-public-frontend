import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';
import { API_URL } from '../config';

const MAX_NEXT_PROBLEM_FALLBACK_LIMIT = 1000;

const normalizeToken = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const getProblemTokens = (problem) => {
  if (!problem || typeof problem !== 'object') return [];

  const candidates = [
    problem.titleSlug,
    problem.slug,
    problem.questionId,
    problem.questionFrontendId,
    problem.displayNumber,
    problem?.metadata?.frontendQuestionId,
    problem.id,
  ];

  const uniqueTokens = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const token = normalizeToken(candidate);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    uniqueTokens.push(token);
  }

  return uniqueTokens;
};

const resolveNextProblemFromList = (questions, cursor) => {
  if (!Array.isArray(questions) || questions.length === 0) return null;

  const normalizedCursor = normalizeToken(cursor);
  if (!normalizedCursor) {
    return questions[0] || null;
  }

  const cursorAsNumber = Number.parseInt(normalizedCursor, 10);

  const currentIndex = questions.findIndex((problem) => {
    const tokens = getProblemTokens(problem);
    if (tokens.includes(normalizedCursor)) return true;

    if (!Number.isFinite(cursorAsNumber)) return false;
    return tokens.some((token) => Number.parseInt(token, 10) === cursorAsNumber);
  });

  if (currentIndex < 0) return questions[0] || null;
  return questions[(currentIndex + 1) % questions.length] || null;
};

const problems = {
  getAll: (difficulty, page = 1, limit = 10, source = null) => {
    logger.info('Fetching problems with pagination:');
    logger.debug({ difficulty, page, limit, source });
    const queryParams = new URLSearchParams({
      ...(difficulty && { difficulty }),
      page: page.toString(),
      limit: limit.toString(),
      ...(source && { source }),
    });
    return fetchWithError(`/api/problems?${queryParams}`);
  },
  getById: (titleSlug) => {
    //use logger only
    logger.info('Fetching problem:');
    logger.debug(titleSlug);
    logger.info('from:');
    logger.debug(API_URL);
    return fetchWithError(`/api/problems/${titleSlug}`);
  },
  lookupBySlugs: (slugs = []) => {
    logger.info('Looking up problems by slugs:');
    logger.debug({ count: slugs.length });
    return fetchWithError('/api/problems/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs }),
    });
  },
  runCode: async (
    code,
    problemId,
    titleSlug,
    metaData,
    isSubmission = false,
    userId = null,
    mode = 'freeplay',
    language = 'python',
    difficulty = null,
    timer = null,
    aiUsageCount = null,
    outputOnly = false
  ) =>
    fetchWithError('/api/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        problemId,
        titleSlug,
        metaData,
        isSubmission,
        userId,
        mode,
        language,
        problem_difficulty: difficulty,
        newTime: timer,
        aiUsageCount,
        outputOnly,
      }),
    }),
  checkTestCases: (titleSlug) => fetchWithError(`/api/problems/${titleSlug}/test-cases`),
  // Get next interview problem based on cursor. Falls back to list-based ordering if needed.
  getNextProblem: async (questionIdOrCursor) => {
    const normalizedCursor = normalizeToken(questionIdOrCursor);
    if (!normalizedCursor) {
      throw new Error('Missing questionId or cursor for next-problem lookup');
    }

    try {
      const nextProblem = await fetchWithError(
        `/api/problems/next/${encodeURIComponent(normalizedCursor)}`
      );
      if (nextProblem?.titleSlug || nextProblem?.slug) {
        return nextProblem;
      }
    } catch (error) {
      logger.error('Primary next-problem lookup failed; falling back to list ordering.');
      logger.debug(error);
    }

    const fallbackResponse = await fetchWithError(
      `/api/problems?page=1&limit=${MAX_NEXT_PROBLEM_FALLBACK_LIMIT}`
    );
    const fallbackQuestions = Array.isArray(fallbackResponse?.questions)
      ? fallbackResponse.questions
      : [];
    const fallbackNextProblem = resolveNextProblemFromList(fallbackQuestions, normalizedCursor);

    if (!fallbackNextProblem) {
      throw new Error('Unable to resolve next interview problem');
    }

    return fallbackNextProblem;
  },
  submitSolution: async (payload) =>
    fetchWithError('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  submitGuestSolution: async (payload) =>
    fetchWithError('/api/guest/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

export default problems;
