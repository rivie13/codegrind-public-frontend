import { fetchWithError } from '../fetcher';

const leaderboards = {
  getAll: async () => {
    try {
      // Use fetchWithError instead of fetch for consistent credential handling
      return await fetchWithError('/api/leaderboards');
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      throw error;
    }
  },

  getTowerDefense: async () => {
    try {
      // Use fetchWithError instead of fetch for consistent credential handling
      return await fetchWithError('/api/leaderboards/tower-defense');
    } catch (error) {
      console.error('Error fetching tower defense leaderboards:', error);
      throw error;
    }
  },

  // New methods to support paginated loading
  getProblems: async () => {
    try {
      return await fetchWithError('/api/leaderboards/problems');
    } catch (error) {
      console.error('Error fetching problems list:', error);
      throw error;
    }
  },

  getProblemLeaderboard: async (problemKey) => {
    try {
      // Add validation to ensure the problemKey has the correct format
      if (!problemKey || typeof problemKey !== 'string' || !problemKey.includes('_')) {
        console.error(`Invalid problem key format: ${problemKey}. Expected format: SOURCE_ID`);
        throw new Error('Invalid problem key format. Expected format: SOURCE_ID');
      }

      return await fetchWithError(`/api/leaderboards/problem/${problemKey}`);
    } catch (error) {
      console.error(`Error fetching leaderboard for problem ${problemKey}:`, error);
      throw error;
    }
  },

  getTowerDefenseProblemLeaderboard: async (problemKey) => {
    try {
      // Add validation to ensure the problemKey has the correct format
      if (!problemKey || typeof problemKey !== 'string' || !problemKey.includes('_')) {
        console.error(`Invalid problem key format: ${problemKey}. Expected format: SOURCE_ID`);
        throw new Error('Invalid problem key format. Expected format: SOURCE_ID');
      }

      return await fetchWithError(`/api/leaderboards/tower-defense/problem/${problemKey}`);
    } catch (error) {
      console.error(`Error fetching tower defense leaderboard for problem ${problemKey}:`, error);
      throw error;
    }
  }
};

export default leaderboards;
