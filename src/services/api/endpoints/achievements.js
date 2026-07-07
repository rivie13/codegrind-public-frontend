import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';

const achievements = {
  getAvailable: async () => {
    logger.info('Fetching available achievements');
    return fetchWithError('/api/achievements/available');
  },
  getUserAchievements: async (userId) => {
    logger.info('Fetching user achievements:');
    logger.debug({ userId });
    return fetchWithError(`/api/achievements/user/${userId}`);
  },
  createTestAchievement: async (userId) => {
    logger.info('Creating test achievement:');
    logger.debug({ userId });
    return fetchWithError('/api/achievements/test-create', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        title: 'Test Achievement',
        description: 'This is a test achievement created for testing purposes',
        icon: '🧪'
      })
    });
  }
};

export default achievements;
