import { useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import { api } from '../../services/api';
import logger from '../../utils/core/logger';
import {
  emitCityStoryStateChanged,
  normalizeCityMissionState,
  normalizeCityProgressSummary,
} from '../../utils/navigation/cityStoryState';

const useCityMissionSync = () => {
  const { isAuthenticated } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const lastPayloadRef = useRef('');

  const syncMissionState = useCallback(
    async ({ progressSummary = null, routeMissionState = null } = {}) => {
      const normalizedRouteMissionState = normalizeCityMissionState(routeMissionState);
      if (!normalizedRouteMissionState) {
        return null;
      }

      const normalizedProgressSummary = normalizeCityProgressSummary(progressSummary);
      const selectedPlayerCharacterId =
        guestCtx?.selectedPlayerCharacterId ||
        guestCtx?.progress?.selectedPlayerCharacterId ||
        null;
      const payloadSignature = JSON.stringify({
        isAuthenticated,
        progressSummary: normalizedProgressSummary,
        routeMissionState: normalizedRouteMissionState,
        selectedPlayerCharacterId,
      });

      if (payloadSignature === lastPayloadRef.current) {
        return normalizedRouteMissionState;
      }

      lastPayloadRef.current = payloadSignature;

      if (!isAuthenticated) {
        guestCtx?.setCityMissionState?.(normalizedRouteMissionState);
        return normalizedRouteMissionState;
      }

      try {
        await api.city.saveMissionState({
          progressSummary: normalizedProgressSummary,
          routeMissionState: normalizedRouteMissionState,
          selectedPlayerCharacterId,
        });
        emitCityStoryStateChanged({ reason: 'mission-sync' });
        return normalizedRouteMissionState;
      } catch (error) {
        lastPayloadRef.current = '';
        logger.warn('Failed to sync city mission state', error?.message || error);
        return null;
      }
    },
    [guestCtx, isAuthenticated]
  );

  return { syncMissionState };
};

export default useCityMissionSync;
