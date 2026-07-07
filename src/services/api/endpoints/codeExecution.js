import { fetchWithError } from '../fetcher';
import { requestAdProofToken } from './adRewards';

const codeExecution = {
  getRateLimitStatus: () => fetchWithError('/api/code-execution/rate-limit-status'),

  prewarm: () =>
    fetchWithError('/api/prewarm', {
      method: 'POST',
    }),

  addCredit: async (adType = 'short') => {
    const adProofToken = await requestAdProofToken('code-execution-credit', adType);
    return fetchWithError('/api/code-execution/add-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType, adProofToken }),
    });
  },
};

export default codeExecution;
