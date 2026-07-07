/**
 * Tower Defense V2 - Learning Completion Tracking
 */

import { useEffect, useRef } from 'react';

import { useAuth } from '../../../../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../../../../contexts/GuestProgressProvider';
import { trackUserContentEvent } from '../../../../../services/userContentEventService';
import { normalizeDataPacketsPayload } from '../../../../../utils/economy/dataPackets';
import { completeLearningPathNode } from '../../../../../utils/learning/learningPathProgress';

const mergeXpPayloads = (base, incoming) => {
  if (!incoming) return base || null;
  if (!base) return incoming;
  const baseAwards = Array.isArray(base.awards) ? base.awards : [];
  const incomingAwards = Array.isArray(incoming.awards) ? incoming.awards : [];
  const baseSummary = base.summary || null;
  const incomingSummary = incoming.summary || null;
  const baseXp = Number(baseSummary?.xp ?? NaN);
  const incomingXp = Number(incomingSummary?.xp ?? NaN);
  const summary =
    Number.isFinite(baseXp) && Number.isFinite(incomingXp) && incomingXp < baseXp
      ? baseSummary
      : incomingSummary || baseSummary || null;
  const levelUpCandidate =
    [base.levelUp, incoming.levelUp]
      .filter(Boolean)
      .sort((a, b) => (b?.newLevel || 0) - (a?.newLevel || 0))[0] || null;
  return {
    summary,
    awards: [...baseAwards, ...incomingAwards],
    levelUp: levelUpCandidate,
  };
};

export default function useTowerDefenseV2LearningCompletion({
  isLearningMode,
  learningPathMeta,
  gameStatus,
  addTerminalMessage,
  setGameStats,
  shouldPersistGuestLearningCompletion = true,
  onLearningXpAwarded = null,
}) {
  const learningCompletionRecordedRef = useRef(false);
  const { isAuthenticated } = useAuth();
  const guestCtx = useGuestProgressCtx();

  useEffect(() => {
    if (!isLearningMode) return;
    if (!learningPathMeta?.pathId || !learningPathMeta?.nodeId) return;
    if (learningCompletionRecordedRef.current) return;
    if (gameStatus !== 'level-complete') return;

    learningCompletionRecordedRef.current = true;

    // Guest: record locally and skip API.
    // Homepage embedded onboarding must not lock a trial path before modal choice.
    if (!isAuthenticated) {
      if (!shouldPersistGuestLearningCompletion) {
        return;
      }

      const guestXpPayload = guestCtx?.getLearningNodeRewardPreview?.(learningPathMeta.nodeId, {
        pathId: learningPathMeta.pathId || null,
        nodeType: learningPathMeta.nodeType || null,
        nodeTitle: learningPathMeta.nodeTitle || null,
        moduleId: learningPathMeta.moduleId || null,
        moduleTitle: learningPathMeta.moduleTitle || null,
      });
      guestCtx?.recordLpNodeCompleted?.(learningPathMeta.nodeId, {
        pathId: learningPathMeta.pathId || null,
        nodeType: learningPathMeta.nodeType || null,
        nodeTitle: learningPathMeta.nodeTitle || null,
        moduleId: learningPathMeta.moduleId || null,
        moduleTitle: learningPathMeta.moduleTitle || null,
      });
      if (guestXpPayload) {
        const persistedGuestDataPackets = Math.max(
          0,
          Number(
            guestCtx?.activitySummary?.guestDataPacketsEarned ??
              guestCtx?.progress?.guestDataPacketsEarned ??
              0
          )
        );
        setGameStats((prev) => ({
          ...(prev || {}),
          xp: mergeXpPayloads(prev?.xp || null, guestXpPayload),
          dataPackets:
            persistedGuestDataPackets > 0
              ? {
                  amount: Math.floor(persistedGuestDataPackets),
                  reason: 'guest_session_total',
                }
              : prev?.dataPackets || null,
        }));
      }
      return;
    }

    (async () => {
      const completionResponse = await completeLearningPathNode(
        learningPathMeta.pathId,
        learningPathMeta.nodeId
      );
      if (completionResponse?.error === 'rate_limit') {
        learningCompletionRecordedRef.current = false;
        const remaining = completionResponse.rateLimit?.adCooldownRemaining || 0;
        const message =
          remaining > 0
            ? `Learning limit reached. Wait ${Math.ceil(remaining / 60)}m before completing more activities.`
            : 'Learning limit reached. Please wait before completing more activities.';
        addTerminalMessage(`[LEARNING] ${message}`);
        return;
      }
      const xpPayload = completionResponse?.xp || null;
      const dataPacketsPayload = normalizeDataPacketsPayload(completionResponse?.dataPackets, {
        fallbackXpAmount: Array.isArray(xpPayload?.awards)
          ? xpPayload.awards.reduce((sum, award) => sum + (award?.amount || 0), 0)
          : 0,
      });
      if (!xpPayload) {
        if (dataPacketsPayload) {
          setGameStats((prev) => ({
            ...(prev || {}),
            dataPackets: dataPacketsPayload,
          }));
        }
        return;
      }
      setGameStats((prev) => ({
        ...(prev || {}),
        xp: mergeXpPayloads(prev?.xp || null, xpPayload),
        dataPackets: dataPacketsPayload || prev?.dataPackets || null,
      }));
      void trackUserContentEvent('user_learning_node_completed', {
        area: 'learning',
        surface: 'learning_td',
        pathId: learningPathMeta.pathId,
        nodeId: learningPathMeta.nodeId,
        ...(learningPathMeta.moduleId ? { moduleId: learningPathMeta.moduleId } : {}),
        ...(learningPathMeta.nodeType ? { nodeType: learningPathMeta.nodeType } : {}),
      });
      onLearningXpAwarded?.(xpPayload);
    })();
  }, [
    addTerminalMessage,
    gameStatus,
    guestCtx,
    isAuthenticated,
    isLearningMode,
    learningPathMeta,
    onLearningXpAwarded,
    setGameStats,
    shouldPersistGuestLearningCompletion,
  ]);

  useEffect(() => {
    if (!isLearningMode) return;
    if (gameStatus === 'prehack') {
      learningCompletionRecordedRef.current = false;
    }
  }, [gameStatus, isLearningMode]);
}
