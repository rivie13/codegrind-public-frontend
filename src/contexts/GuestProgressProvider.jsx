/**
 * GuestProgressProvider.jsx — React context for guest progress tracking.
 *
 * Wraps the useGuestProgress hook in a context so any component can
 * record milestones or check the signup wall without prop drilling.
 *
 * Must be nested inside AuthProvider (uses useAuth internally).
 *
 * Usage:
 *   <AuthProvider>
 *     <GuestProgressProvider>
 *       <App />
 *     </GuestProgressProvider>
 *   </AuthProvider>
 *
 *   const { recordProblemAttempt, hasReachedProblemWall } = useGuestProgressCtx();
 */

import { useToast } from '@chakra-ui/react';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import RetroAchievementToast from '../components/retro/RetroAchievementToast';
import useGuestProgress from '../hooks/guest/useGuestProgress';
import { useAuth } from './AuthContext';

const GuestProgressCtx = createContext(null);

export function GuestProgressProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const guest = useGuestProgress({ isAuthenticated });
  const toast = useToast();
  const seenGuestAchievementIdsRef = useRef(new Set());
  const hasHydratedGuestAchievementsRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      seenGuestAchievementIdsRef.current = new Set();
      hasHydratedGuestAchievementsRef.current = false;
      return;
    }

    if (guest && !guest.hydrated) {
      return;
    }

    const unlocked = Array.isArray(guest?.unlockedGuestAchievements)
      ? guest.unlockedGuestAchievements
      : [];
    const unlockedIds = unlocked
      .map((achievement) => achievement?.id)
      .filter((id) => typeof id === 'string' && id.length > 0);

    // Seed from current local state once to avoid replaying toasts after refresh.
    if (!hasHydratedGuestAchievementsRef.current) {
      seenGuestAchievementIdsRef.current = new Set(unlockedIds);
      hasHydratedGuestAchievementsRef.current = true;
      return;
    }

    const newlyUnlocked = unlocked.filter(
      (achievement) => achievement?.id && !seenGuestAchievementIdsRef.current.has(achievement.id)
    );
    if (!newlyUnlocked.length) return;

    for (const achievement of newlyUnlocked) {
      seenGuestAchievementIdsRef.current.add(achievement.id);

      toast({
        title: 'Guest Achievement Unlocked!',
        description: `${achievement.title}: ${achievement.description}`,
        status: 'success',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
        render: ({ onClose }) => (
          <RetroAchievementToast
            heading="Guest Achievement"
            title={achievement.title}
            description={achievement.description}
            onClose={onClose}
          />
        ),
      });
    }
  }, [guest?.unlockedGuestAchievements, guest?.hydrated, isAuthenticated, toast]);

  // Stable reference — hook already memoises everything internally
  const value = useMemo(
    () => guest,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guest.progress, guest.freeProblemsRemaining, guest.hasReachedProblemWall, guest.hydrated]
  );

  return <GuestProgressCtx.Provider value={value}>{children}</GuestProgressCtx.Provider>;
}

/**
 * Consume guest progress context. Returns null when accessed outside provider
 * (e.g. in storybook) — callers should null-check or provide defaults.
 */
export function useGuestProgressCtx() {
  return useContext(GuestProgressCtx);
}
