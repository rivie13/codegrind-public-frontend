import { fetchWithError } from '../fetcher';

const learningPath = {
  listPaths: async () => fetchWithError('/api/learning-paths', { method: 'GET' }),
  getPath: async (pathId) => {
    const encodedPathId = encodeURIComponent(pathId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}`, {
      method: 'GET'
    });
  },
  getModule: async (pathId, moduleId) => {
    const encodedPathId = encodeURIComponent(pathId);
    const encodedModuleId = encodeURIComponent(moduleId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}/modules/${encodedModuleId}`, {
      method: 'GET'
    });
  },
  getProgress: async (pathId) => {
    const encodedPathId = encodeURIComponent(pathId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}/progress`, {
      method: 'GET'
    });
  },
  getRateLimit: async (pathId) => {
    const encodedPathId = encodeURIComponent(pathId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}/rate-limit`, {
      method: 'GET'
    });
  },
  completeNode: async (pathId, nodeId) => {
    const encodedPathId = encodeURIComponent(pathId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}/progress/complete`, {
      method: 'POST',
      body: JSON.stringify({ nodeId })
    });
  },
  watchAd: async (pathId, adType) => {
    const encodedPathId = encodeURIComponent(pathId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}/ads/watch`, {
      method: 'POST',
      body: JSON.stringify({ adType })
    });
  },
  resetProgress: async (pathId) => {
    const encodedPathId = encodeURIComponent(pathId);
    return fetchWithError(`/api/learning-paths/${encodedPathId}/progress`, {
      method: 'DELETE'
    });
  }
};

export default learningPath;
