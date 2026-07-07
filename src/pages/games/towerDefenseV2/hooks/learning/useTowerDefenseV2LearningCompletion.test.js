import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  isAuthenticated: false,
  guestCtx: null,
  completeLearningPathNode: vi.fn(),
  trackUserContentEvent: vi.fn(),
}));

vi.mock('../../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockState.isAuthenticated }),
}));

vi.mock('../../../../../contexts/GuestProgressProvider', () => ({
  useGuestProgressCtx: () => mockState.guestCtx,
}));

vi.mock('../../../../../utils/learning/learningPathProgress', () => ({
  completeLearningPathNode: (...args) => mockState.completeLearningPathNode(...args),
}));

vi.mock('../../../../../services/userContentEventService', () => ({
  trackUserContentEvent: (...args) => mockState.trackUserContentEvent(...args),
}));

import useTowerDefenseV2LearningCompletion from './useTowerDefenseV2LearningCompletion';

describe('useTowerDefenseV2LearningCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.isAuthenticated = false;
    mockState.completeLearningPathNode.mockResolvedValue({});
    mockState.guestCtx = {
      getLearningNodeRewardPreview: vi.fn(() => null),
      recordLpNodeCompleted: vi.fn(),
    };
  });

  it('persists authenticated learning completion with the provided canonical node id', async () => {
    const addTerminalMessage = vi.fn();
    const setGameStats = vi.fn();
    const onLearningXpAwarded = vi.fn();

    mockState.isAuthenticated = true;
    mockState.completeLearningPathNode.mockResolvedValue({
      xp: {
        summary: { xp: 60, level: 1, roleName: 'Greenhorn' },
        awards: [{ reason: 'learning_path_node_complete', amount: 60 }],
        levelUp: null,
      },
    });

    renderHook(() =>
      useTowerDefenseV2LearningCompletion({
        isLearningMode: true,
        learningPathMeta: {
          pathId: 'python-path',
          nodeId: 'py-m0-tower-hello',
          moduleId: 'py-m0-hello',
        },
        gameStatus: 'level-complete',
        addTerminalMessage,
        setGameStats,
        onLearningXpAwarded,
      })
    );

    await waitFor(() => {
      expect(mockState.completeLearningPathNode).toHaveBeenCalledWith(
        'python-path',
        'py-m0-tower-hello'
      );
      expect(mockState.trackUserContentEvent).toHaveBeenCalledWith(
        'user_learning_node_completed',
        expect.objectContaining({
          area: 'learning',
          surface: 'learning_td',
          pathId: 'python-path',
          nodeId: 'py-m0-tower-hello',
        })
      );
      expect(setGameStats).toHaveBeenCalled();
      expect(onLearningXpAwarded).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({ xp: 60 }),
          awards: [expect.objectContaining({ amount: 60 })],
        })
      );
    });
  });

  it('does not persist guest LP completion when guest persistence is disabled', async () => {
    const addTerminalMessage = vi.fn();
    const setGameStats = vi.fn();

    renderHook(() =>
      useTowerDefenseV2LearningCompletion({
        isLearningMode: true,
        learningPathMeta: {
          pathId: 'python-path',
          nodeId: 'py-m0-tower',
        },
        gameStatus: 'level-complete',
        addTerminalMessage,
        setGameStats,
        shouldPersistGuestLearningCompletion: false,
      })
    );

    await waitFor(() => {
      expect(mockState.guestCtx.recordLpNodeCompleted).not.toHaveBeenCalled();
      expect(mockState.guestCtx.getLearningNodeRewardPreview).not.toHaveBeenCalled();
    });
  });

  it('persists guest LP completion by default', async () => {
    const addTerminalMessage = vi.fn();
    const setGameStats = vi.fn();

    renderHook(() =>
      useTowerDefenseV2LearningCompletion({
        isLearningMode: true,
        learningPathMeta: {
          pathId: 'python-path',
          nodeId: 'py-m0-tower',
        },
        gameStatus: 'level-complete',
        addTerminalMessage,
        setGameStats,
      })
    );

    await waitFor(() => {
      expect(mockState.guestCtx.recordLpNodeCompleted).toHaveBeenCalledTimes(1);
      expect(mockState.guestCtx.recordLpNodeCompleted).toHaveBeenCalledWith(
        'py-m0-tower',
        expect.objectContaining({ pathId: 'python-path' })
      );
    });
  });

  it('uses persisted guest data packets for guest learning completion modal state', async () => {
    const addTerminalMessage = vi.fn();
    const setGameStats = vi.fn();

    mockState.guestCtx = {
      getLearningNodeRewardPreview: vi.fn(() => ({
        summary: { xp: 40, level: 1, roleName: 'Greenhorn' },
        awards: [{ reason: 'learning_path_node_complete', amount: 40 }],
        levelUp: null,
      })),
      recordLpNodeCompleted: vi.fn(),
      activitySummary: { guestDataPacketsEarned: 120 },
      progress: { guestDataPacketsEarned: 120 },
    };

    renderHook(() =>
      useTowerDefenseV2LearningCompletion({
        isLearningMode: true,
        learningPathMeta: {
          pathId: 'python-path',
          nodeId: 'py-m0-tower',
        },
        gameStatus: 'level-complete',
        addTerminalMessage,
        setGameStats,
      })
    );

    await waitFor(() => {
      expect(setGameStats).toHaveBeenCalled();
    });

    const updater = setGameStats.mock.calls.at(-1)?.[0];
    expect(typeof updater).toBe('function');
    const next = updater({});
    expect(next).toEqual(
      expect.objectContaining({
        dataPackets: {
          amount: 120,
          reason: 'guest_session_total',
        },
      })
    );
  });
});
