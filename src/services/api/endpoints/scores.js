import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';

const scores = {
  update: (userId, problemId, newScore, newTime, problemType = 'CODEGRIND') => {
    //use logger only
    logger.info('Sending score update:');
    logger.debug({ userId, problemId, newScore, newTime, problemType });
    return fetchWithError('/api/scores/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        problemId,
        newScore,
        newTime,
        problemType,
      }),
    });
  },
  get: (userId, problemId, problemType = 'CODEGRIND') => {
    //use logger only
    logger.info('Fetching score:');
    logger.debug({ userId, problemId, problemType });
    return fetchWithError(`/api/scores/${userId}/${problemId}/${problemType}`);
  },
  getBulk: (userId, problemIds = [], problemType = 'CODEGRIND') => {
    logger.info('Fetching bulk scores:');
    logger.debug({ userId, count: problemIds.length, problemType });
    return fetchWithError('/api/scores/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemIds, problemType }),
    });
  },
};

export default scores;
