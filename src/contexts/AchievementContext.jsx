import { useToast } from '@chakra-ui/react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import RetroAchievementToast from '../components/retro/RetroAchievementToast';
import { achievementService } from '../services/achievementService';
import logger from '../utils/core/logger';
import { useAuth } from './AuthContext';

const AchievementContext = createContext();
const shownAchievementsKey = (userId) => `codegrind_shown_achievements_${userId}`;
const lastSeenAchievementKey = (userId) => `codegrind_last_seen_achievement_${userId}`;

export const AchievementProvider = ({ children }) => {
  const [achievements, setAchievements] = useState([]);
  const [latestAchievement, setLatestAchievement] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const shownAchievementIds = useRef(new Set());

  // Load previously shown achievements from localStorage per user
  useEffect(() => {
    if (!user?.id) {
      shownAchievementIds.current = new Set();
      return;
    }

    try {
      const storedIds = localStorage.getItem(shownAchievementsKey(user.id));
      if (storedIds) {
        const parsedIds = JSON.parse(storedIds);
        shownAchievementIds.current = new Set(parsedIds);
      } else {
        shownAchievementIds.current = new Set();
      }
    } catch (error) {
      logger.error('Error loading shown achievements from localStorage:', error);
      shownAchievementIds.current = new Set();
    }
  }, [user?.id]);

  // Function to fetch user's achievements
  const fetchAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      logger.info('Fetching achievements for user', user.id);
      const userAchievements = await achievementService.getUserAchievements(user.id);

      // Update achievements list
      setAchievements(userAchievements);

      if (!userAchievements || userAchievements.length === 0) {
        return;
      }

      const latestUnlockDate = userAchievements.reduce((latest, current) => {
        const currentDate = new Date(current.unlockedAt);
        return currentDate > latest ? currentDate : latest;
      }, new Date(0));

      let lastSeenAt = null;
      try {
        const storedLastSeen = localStorage.getItem(lastSeenAchievementKey(user.id));
        if (storedLastSeen) {
          const parsed = new Date(storedLastSeen);
          if (!Number.isNaN(parsed.getTime())) {
            lastSeenAt = parsed;
          }
        }
      } catch (error) {
        logger.error('Error loading last seen achievement timestamp:', error);
      }

      // If this is the first time loading achievements for this user, mark all as seen.
      if (!lastSeenAt) {
        userAchievements.forEach((achievement) => {
          shownAchievementIds.current.add(achievement.id);
        });

        try {
          localStorage.setItem(
            shownAchievementsKey(user.id),
            JSON.stringify([...shownAchievementIds.current])
          );
          localStorage.setItem(lastSeenAchievementKey(user.id), latestUnlockDate.toISOString());
        } catch (error) {
          logger.error('Error saving initial achievement state:', error);
        }
        return;
      }

      // Find new achievements that haven't been shown yet
      const newAchievements = userAchievements.filter(
        (achievement) =>
          !shownAchievementIds.current.has(achievement.id) &&
          new Date(achievement.unlockedAt) > lastSeenAt
      );

      if (newAchievements.length > 0) {
        // Sort by unlock date to find the most recent
        const sorted = [...newAchievements].sort(
          (a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)
        );

        const newAchievement = sorted[0];
        setLatestAchievement(newAchievement);

        // Mark this achievement as shown
        shownAchievementIds.current.add(newAchievement.id);

        // Save to localStorage
        try {
          localStorage.setItem(
            shownAchievementsKey(user.id),
            JSON.stringify([...shownAchievementIds.current])
          );
          localStorage.setItem(
            lastSeenAchievementKey(user.id),
            new Date(newAchievement.unlockedAt).toISOString()
          );
        } catch (error) {
          logger.error('Error saving shown achievements to localStorage:', error);
        }

        // Show toast notification
        toast({
          title: 'Achievement Unlocked!',
          description: `${newAchievement.icon} ${newAchievement.title}: ${newAchievement.description}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
          variant: 'solid',
          render: ({ onClose }) => (
            <RetroAchievementToast
              heading="Achievement Unlocked"
              title={newAchievement.title}
              description={newAchievement.description}
              icon={newAchievement.icon}
              onClose={onClose}
            />
          ),
        });
      }
    } catch (error) {
      logger.error('Error fetching achievements:', error);
    }
  }, [toast, user?.id]);

  // Poll for new achievements periodically
  useEffect(() => {
    if (user?.id) {
      fetchAchievements();

      // Check every 60 seconds for new achievements
      const interval = setInterval(fetchAchievements, 60000);

      return () => clearInterval(interval);
    }
  }, [fetchAchievements, user?.id]);

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        latestAchievement,
        refetchAchievements: fetchAchievements,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => useContext(AchievementContext);

export default AchievementProvider;
