import logger from '../utils/core/logger';
import { api } from './api';

/**
 * Service to interact with the achievement API
 */
export const achievementService = {
  /**
   * Get all available achievements
   * @returns {Promise<Array>} - Array of all possible achievements
   */
  getAvailableAchievements: async () => {
    try {
      return await api.achievements.getAvailable();
    } catch (error) {
      logger.error('Error fetching available achievements:', error);
      throw error;
    }
  },
  
  /**
   * Get user's earned achievements
   * @param {number} userId - The user ID
   * @returns {Promise<Array>} - Array of user's earned achievements
   */
  getUserAchievements: async (userId) => {
    try {
      return await api.achievements.getUserAchievements(userId);
    } catch (error) {
      logger.error('Error fetching user achievements:', error);
      throw error;
    }
  }
};

export default achievementService; 