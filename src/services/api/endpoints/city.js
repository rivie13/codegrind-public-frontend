import { fetchWithError } from '../fetcher';

const city = {
  getStoryState: async () => fetchWithError('/api/city/story-state'),
  savePathChoice: async ({ selectedTrialLearningPath = null, selectedTrialTrack }) =>
    fetchWithError('/api/city/story-state/path-choice', {
      method: 'PUT',
      body: JSON.stringify({
        selectedTrialLearningPath,
        selectedTrialTrack,
      }),
    }),
  saveReturnState: async (cityReturnState) =>
    fetchWithError('/api/city/story-state/return-state', {
      method: 'PUT',
      body: JSON.stringify({ cityReturnState }),
    }),
  saveMissionState: async ({
    progressSummary = null,
    routeMissionState,
    selectedPlayerCharacterId = null,
  }) =>
    fetchWithError('/api/city/story-state/mission-state', {
      method: 'PUT',
      body: JSON.stringify({
        progressSummary,
        routeMissionState,
        selectedPlayerCharacterId,
      }),
    }),
  claimCollectible: async ({ collectibleId }) =>
    fetchWithError(`/api/city/collectibles/${collectibleId}/claim`, {
      method: 'POST',
    }),
};

export default city;
