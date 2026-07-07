import { fetchWithError } from '../fetcher';

const models = {
  /**
   * Get the list of AI models available to the current user for a feature.
   * @param {'chat'|'snippet'|'problem'|'refinement'|'analysis'} feature
   * @returns {Promise<{tier: string, feature: string, models: Array<{id: string, displayName: string, description: string, creditCost: number, isDefault: boolean}>}>}
   */
  getAvailable: async (feature = 'chat') => {
    return fetchWithError(`/api/models?feature=${encodeURIComponent(feature)}`);
  },
};

export default models;
