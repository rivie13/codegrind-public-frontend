import { describe, expect, it, vi } from 'vitest';

const loadService = async ({ getAvailableImpl, getUserAchievementsImpl } = {}) => {
  vi.resetModules();

  const getAvailable = vi.fn(getAvailableImpl || (async () => [{ id: 'ach-1' }]));
  const getUserAchievements = vi.fn(
    getUserAchievementsImpl || (async (userId) => [{ id: 'ua-1', userId }])
  );
  const logger = {
    error: vi.fn(),
  };

  vi.doMock('./api', () => ({
    api: {
      achievements: {
        getAvailable,
        getUserAchievements,
      },
    },
  }));

  vi.doMock('../utils/core/logger', () => ({
    default: logger,
  }));

  const mod = await import('./achievementService');
  return {
    achievementService: mod.achievementService,
    getAvailable,
    getUserAchievements,
    logger,
  };
};

describe('achievementService', () => {
  it('returns available achievements from API', async () => {
    const { achievementService, getAvailable } = await loadService();

    const result = await achievementService.getAvailableAchievements();

    expect(getAvailable).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'ach-1' }]);
  });

  it('logs and rethrows errors when available achievements request fails', async () => {
    const error = new Error('available failed');
    const { achievementService, logger } = await loadService({
      getAvailableImpl: async () => {
        throw error;
      },
    });

    await expect(achievementService.getAvailableAchievements()).rejects.toThrow('available failed');
    expect(logger.error).toHaveBeenCalledWith('Error fetching available achievements:', error);
  });

  it('returns user achievements with user id', async () => {
    const { achievementService, getUserAchievements } = await loadService();

    const result = await achievementService.getUserAchievements(42);

    expect(getUserAchievements).toHaveBeenCalledWith(42);
    expect(result).toEqual([{ id: 'ua-1', userId: 42 }]);
  });

  it('logs and rethrows errors when user achievements request fails', async () => {
    const error = new Error('user request failed');
    const { achievementService, logger } = await loadService({
      getUserAchievementsImpl: async () => {
        throw error;
      },
    });

    await expect(achievementService.getUserAchievements(7)).rejects.toThrow('user request failed');
    expect(logger.error).toHaveBeenCalledWith('Error fetching user achievements:', error);
  });
});
