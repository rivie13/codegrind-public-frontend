import { fetchWithError } from '../fetcher';

const analysis = {
  /**
   * Request an AI analysis of a code submission.
   * @param {number} submissionId
   * @param {string} [model] - Model ID, e.g. 'gpt-4.1'. Server defaults if omitted.
   * @returns {Promise<{analysis: string, suggestions: Array, model: string, cached: boolean, usage: {used: number, limit: number}}>}
   */
  analyzeSubmission: async (submissionId, model) => {
    return fetchWithError('/api/analysis/submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, ...(model && { model }) }),
    });
  },

  /**
   * Get the caller's daily analysis usage and limit.
   * @returns {Promise<{tier: string, used: number, limit: number, available: number}>}
   */
  getUsage: async () => {
    return fetchWithError('/api/analysis/usage');
  },
};

export default analysis;
