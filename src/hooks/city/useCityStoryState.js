import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import logger from '../../utils/core/logger';
import { CITY_STORY_STATE_UPDATED_EVENT } from '../../utils/navigation/cityStoryState';

const useCityStoryState = () => {
  const { isAuthenticated } = useAuth();
  const requestVersionRef = useRef(0);
  const [storyState, setStoryState] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(isAuthenticated));
  const [error, setError] = useState(null);

  const refreshStoryState = useCallback(async () => {
    if (!isAuthenticated) {
      requestVersionRef.current += 1;
      setStoryState(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    setIsLoading(true);

    try {
      const result = await api.city.getStoryState();
      const nextStoryState = result?.storyState ?? null;

      if (requestVersionRef.current === requestVersion) {
        setStoryState(nextStoryState);
        setError(null);
        setIsLoading(false);
      }

      return nextStoryState;
    } catch (nextError) {
      if (requestVersionRef.current === requestVersion) {
        setError(nextError);
        setIsLoading(false);
      }

      logger.warn('Failed to load city story state', nextError?.message || nextError);
      return null;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      requestVersionRef.current += 1;
      setStoryState(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void refreshStoryState();
  }, [isAuthenticated, refreshStoryState]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return undefined;
    }

    const handleStoryStateChanged = () => {
      void refreshStoryState();
    };

    window.addEventListener(CITY_STORY_STATE_UPDATED_EVENT, handleStoryStateChanged);
    return () => {
      window.removeEventListener(CITY_STORY_STATE_UPDATED_EVENT, handleStoryStateChanged);
    };
  }, [isAuthenticated, refreshStoryState]);

  const savePathChoice = useCallback(
    async ({ selectedTrialLearningPath = null, selectedTrialTrack }) => {
      if (!isAuthenticated) {
        return null;
      }

      const result = await api.city.savePathChoice({
        selectedTrialLearningPath,
        selectedTrialTrack,
      });
      const nextStoryState = result?.storyState ?? null;
      setStoryState(nextStoryState);
      setError(null);
      return nextStoryState;
    },
    [isAuthenticated]
  );

  const saveReturnState = useCallback(
    async (cityReturnState) => {
      if (!isAuthenticated) {
        return null;
      }

      const result = await api.city.saveReturnState(cityReturnState);
      const nextStoryState = result?.storyState ?? null;
      setStoryState(nextStoryState);
      setError(null);
      return nextStoryState;
    },
    [isAuthenticated]
  );

  const saveMissionState = useCallback(
    async ({ progressSummary = null, routeMissionState, selectedPlayerCharacterId = null }) => {
      if (!isAuthenticated) {
        return null;
      }

      const result = await api.city.saveMissionState({
        progressSummary,
        routeMissionState,
        selectedPlayerCharacterId,
      });
      const nextStoryState = result?.storyState ?? null;
      setStoryState(nextStoryState);
      setError(null);
      return nextStoryState;
    },
    [isAuthenticated]
  );

  return {
    error,
    isLoading,
    isReady: !isAuthenticated || !isLoading,
    refreshStoryState,
    saveMissionState,
    savePathChoice,
    saveReturnState,
    storyState,
  };
};

export default useCityStoryState;
