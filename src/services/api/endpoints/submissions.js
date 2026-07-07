import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';

const submissions = {
  getProfileStats: async (userId) => {
    const response = await fetchWithError(`/api/profile/stats/${userId}`);

    // Log the raw response to see what's coming from the server
    logger.info('Raw profile stats response:');
    //logger.debug(response);

    // Log tower defense stats specifically
    logger.info('Tower defense stats from server:');
    //logger.debug(response.towerDefenseStats);

    return {
      total: response.total || 0,
      easy: response.easy || 0,
      medium: response.medium || 0,
      hard: response.hard || 0,
      totalAttempts: response.totalAttempts || 0,
      successRate: response.successRate || 0,
      overallTotal: response.overallTotal || 0,
      overallAttempts: response.overallAttempts || 0,
      overallSuccessRate: response.overallSuccessRate || 0,
      easyProgress: response.easyProgress || 0,
      mediumProgress: response.mediumProgress || 0,
      hardProgress: response.hardProgress || 0,
      streak: response.streak || 0,
      submissions: response.submissions || [],
      recentSubmissions: response.recentSubmissions || [],
      // Add tower defense stats mapping
      towerDefenseStats: response.towerDefenseStats || {
        wins: 0,
        perfectWins: 0,
        highScore: 0,
        totalGames: 0,
      },
      towerDefenseWins: response.towerDefenseStats?.wins || 0,
      towerDefenseHighScore: response.towerDefenseStats?.highScore || 0,
      towerDefensePerfectWins: response.towerDefenseStats?.perfectWins || 0,
      totalTowerDefenseGames: response.towerDefenseStats?.totalGames || 0,
      // Interview Tower Defense stats
      interviewTD: response.interviewTD || {
        easy: 0,
        medium: 0,
        hard: 0,
        easyProgress: 0,
        mediumProgress: 0,
        hardProgress: 0,
        total: 0,
      },
      // AI Problems stats
      aiProblems: response.aiProblems || {
        easy: 0,
        medium: 0,
        hard: 0,
        easyProgress: 0,
        mediumProgress: 0,
        hardProgress: 0,
        total: 0,
      },
      // AI Problems Tower Defense stats - preserve all fields from response
      aiProblemsTD: response.aiProblemsTD || {
        easy: 0,
        medium: 0,
        hard: 0,
        easyProgress: 0,
        mediumProgress: 0,
        hardProgress: 0,
        total: 0,
      },
    };
  },
  getSubmissions: async (userId, { page = 1, limit = 10, difficulty = null } = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(difficulty && { difficulty }),
    });
    const response = await fetchWithError(`/api/submissions/${userId}?${queryParams}`);
    return response;
  },
  getProfileSubmissions: async (userId, limit = 5) => {
    const response = await fetchWithError(`/api/profile/submissions/${userId}?limit=${limit}`);
    return (
      response.submissions?.map((sub) => ({
        id: sub.id,
        problem: sub.problemId,
        status: sub.status,
        date: sub.submission_date,
        difficulty: sub.problem_difficulty,
      })) || []
    );
  },
  getActivityTimeline: async (userId) => {
    try {
      const response = await fetchWithError(`/api/profile/activity/${userId}`);

      // Add debug to see what's being returned
      logger.info('Activity timeline response:');
      //logger.debug(response);

      // Return the raw response directly - don't transform it
      return response || [];
    } catch (error) {
      logger.error('Error fetching activity timeline:');
      logger.debug(error.stack);
      return []; // Return empty array on error rather than propagating
    }
  },
  getCreatedAIProblems: async (userId, limit = 12) => {
    try {
      const response = await fetchWithError(`/api/profile/ai-problems/${userId}?limit=${limit}`);
      return {
        problems: response.problems || [],
        total: response.total || 0,
      };
    } catch (error) {
      logger.error('Error fetching created AI problems:');
      logger.debug(error.stack);
      return { problems: [], total: 0 };
    }
  },
  getDashboardStats: async (userId) => {
    const response = await fetchWithError(`/api/submissions/dashboard/${userId}`);
    return {
      easySolved: response.easySolved || 0,
      mediumSolved: response.mediumSolved || 0,
      hardSolved: response.hardSolved || 0,
      totalSolved: response.totalSolved || 0,
      totalSubmissions: response.totalSubmissions || 0,
      recentSubmissions: response.submissions || [],
    };
  },
  getDashboardSubmissions: async (userId, page = 1, limit = 10, difficulty = null) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(difficulty && { difficulty }),
    });
    const response = await fetchWithError(
      `/api/submissions/dashboard/${userId}/list?${queryParams}`
    );
    return {
      submissions: response.submissions || [],
      currentPage: response.currentPage,
      totalPages: response.totalPages,
    };
  },
  /**
   * Get the distinct set of LeetCode problem slugs the user has solved (accepted).
   * Used by cluster progress widgets and the dashboard shepherd.
   */
  getSolvedSlugs: async (userId) => {
    try {
      const response = await fetchWithError(`/api/profile/solved-slugs/${userId}`);
      return response?.slugs || [];
    } catch {
      return [];
    }
  },
};

export default submissions;
