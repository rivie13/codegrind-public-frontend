import { useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { achievementService } from '../../../services/achievementService';
import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';

const useProfileData = (userId, options = {}) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const toast = useToast();
  const { isPublicView = false } = options;

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      logger.info('Fetching data for user:');
      logger.debug(userId);

      const [userProfile, profileStats] = await Promise.all([
        isPublicView ? api.profile.getPublicProfile(userId) : api.auth.getUserProfile(userId),
        api.submissions.getProfileStats(userId),
      ]);

      // Log tower defense stats from profile stats
      logger.info('Received tower defense stats from API:');

      // Enhanced debugging for profile stats
      logger.info('Full profile stats object:');
      logger.debug(profileStats);

      // Debug category stats
      logger.info('Category stats breakdown:');
      logger.debug({
        interview: {
          easy: profileStats.easy,
          medium: profileStats.medium,
          hard: profileStats.hard,
          total: profileStats.total,
        },
        interviewTD: profileStats.interviewTD,
        aiProblems: profileStats.aiProblems,
        aiProblemsTD: profileStats.aiProblemsTD,
      });

      // Check if towerDefenseStats is present
      logger.info(
        'TowerDefenseStats present in response?',
        profileStats.towerDefenseStats ? 'Yes' : 'No'
      );

      // Map the core data to match component expectations
      setUserData({
        id: userProfile.id || Number(userId),
        username: userProfile.username,
        email: userProfile.email,
        hasPassword: Boolean(userProfile.hasPassword),
        isEmailVerified: Boolean(userProfile.isEmailVerified),
        bio: userProfile.bio || 'No bio yet',
        avatarUrl: userProfile.avatarUrl || userProfile.discordProfile?.avatarUrl || '',
        createdAt: userProfile.createdAt,
        membershipTier: userProfile.membershipTier || 'FREE',
        subscriptionStatus: userProfile.subscriptionStatus || null,
        subscriptionCancelAtPeriodEnd: Boolean(userProfile.subscriptionCancelAtPeriodEnd),
        subscriptionCancelAt: userProfile.subscriptionCancelAt || null,
        discordProfile: userProfile.discordProfile || { linked: false, level: 0 },
        progress: userProfile.progress || null,
        stats: {
          problemsSolved: profileStats.overallTotal ?? profileStats.total ?? 0,
          easySolved: profileStats.easy || 0,
          mediumSolved: profileStats.medium || 0,
          hardSolved: profileStats.hard || 0,
          easyProgress: profileStats.easyProgress || 0,
          mediumProgress: profileStats.mediumProgress || 0,
          hardProgress: profileStats.hardProgress || 0,
          successRate: profileStats.overallSuccessRate ?? profileStats.successRate ?? 0,
          streak: profileStats.streak || 0,
          towerDefenseWins: profileStats.towerDefenseStats?.wins || 0,
          towerDefenseHighScore: profileStats.towerDefenseStats?.highScore || 0,
          towerDefensePerfectWins: profileStats.towerDefenseStats?.perfectWins || 0,
          // Add new stats for different problem categories
          interviewTD: profileStats.interviewTD || {
            easy: 0,
            medium: 0,
            hard: 0,
            easyProgress: 0,
            mediumProgress: 0,
            hardProgress: 0,
            total: 0,
          },
          aiProblems: profileStats.aiProblems || {
            easy: 0,
            medium: 0,
            hard: 0,
            easyProgress: 0,
            mediumProgress: 0,
            hardProgress: 0,
            total: 0,
          },
          aiProblemsTD: profileStats.aiProblemsTD || {
            easy: 0,
            medium: 0,
            hard: 0,
            easyProgress: 0,
            mediumProgress: 0,
            hardProgress: 0,
            total: 0,
          },
        },
        activityTimeline: [],
        recentActivity: [],
        achievements: [],
        createdAiProblems: [],
        createdAiProblemsTotal: 0,
        dataPackets: null,
        dataPacketEvents: [],
        equippedCosmetics: userProfile?.equippedCosmetics || {},
      });

      setIsLoading(false);

      const [activityResult, achievementsResult, createdAiResult] = await Promise.allSettled([
        api.submissions.getActivityTimeline(userId),
        achievementService.getUserAchievements(userId),
        api.submissions.getCreatedAIProblems(userId),
      ]);

      const walletResult = await Promise.allSettled([api.store.getWallet()]);
      const equippedResult = await Promise.allSettled([api.store.getEquipped()]);

      if (activityResult.status === 'fulfilled') {
        const activityTimeline = activityResult.value || [];
        logger.info('Received activity timeline:');
        logger.debug(JSON.stringify(activityTimeline, null, 2));

        setUserData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activityTimeline,
            recentActivity: activityTimeline.slice(0, 5).map((activity) => ({
              id: activity.id,
              problem: activity.description?.split(' ').slice(1).join(' ') || 'Unknown',
              status: activity.details?.status || 'Unknown',
              date: activity.timestamp || new Date().toISOString(),
              mode: activity.details?.mode || 'freeplay',
              difficulty: activity.details?.difficulty,
            })),
          };
        });
      }

      if (achievementsResult.status === 'fulfilled') {
        const userAchievements = achievementsResult.value || [];
        setAchievements(userAchievements);
        setUserData((prev) => (prev ? { ...prev, achievements: userAchievements } : prev));
      }

      if (createdAiResult.status === 'fulfilled') {
        const createdAiProblems = createdAiResult.value || {};
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                createdAiProblems: createdAiProblems?.problems || [],
                createdAiProblemsTotal: createdAiProblems?.total || 0,
              }
            : prev
        );
      }

      if (walletResult[0]?.status === 'fulfilled') {
        const walletPayload = walletResult[0].value || {};
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                dataPackets: Number(walletPayload?.balance ?? 0),
                dataPacketEvents: Array.isArray(walletPayload?.events)
                  ? walletPayload.events.slice(0, 10)
                  : [],
              }
            : prev
        );
      }

      if (equippedResult[0]?.status === 'fulfilled') {
        const equippedPayload = equippedResult[0].value || {};
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                equippedCosmetics: equippedPayload?.equipped || {},
              }
            : prev
        );
      }
    } catch (error) {
      logger.error('Error fetching profile data:');
      logger.debug(error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, isPublicView]);

  // Function to refresh profile data
  const refreshProfileData = useCallback(() => {
    return fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (userId) {
      fetchProfileData().catch((error) => {
        logger.error('Failed to fetch profile data:');
        logger.debug(error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }
  }, [userId, fetchProfileData, toast]);

  return { userData, isLoading, achievements, refreshProfileData };
};

export default useProfileData;
