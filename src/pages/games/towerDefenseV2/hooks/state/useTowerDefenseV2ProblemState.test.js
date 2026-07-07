import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseProblemData = vi.hoisted(() => vi.fn());
const mockUseTowerDefenseV2LearningState = vi.hoisted(() => vi.fn());

vi.mock('../../../../../hooks/towerDefense/engine/data/useProblemData', () => ({
  default: (...args) => mockUseProblemData(...args),
}));

vi.mock('../learning/useTowerDefenseV2LearningState', () => ({
  default: (...args) => mockUseTowerDefenseV2LearningState(...args),
}));

import useTowerDefenseV2ProblemState from './useTowerDefenseV2ProblemState';

describe('useTowerDefenseV2ProblemState', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTowerDefenseV2LearningState.mockReturnValue({
      isLearningMode: true,
      learningProblemSlugs: ['lp-js-m0-td-hello-print'],
      activeProblemIndex: 0,
      setActiveProblemIndex: vi.fn(),
      activeTitleSlug: 'lp-js-m0-td-hello-print',
      resolvedLearningPathSlug: 'javascript-path',
      learningPathData: null,
      learningNodeId: 'javascript-node-1',
      learningNextNode: null,
      learningNextRoute: null,
      learningReturnPath: '/learning/javascript-path',
      buildLearningRoute: vi.fn(),
      handleContinueLearning: vi.fn(),
      handleReturnToMap: vi.fn(),
      canEnterEndlessMode: false,
      isMultiProblemTower: false,
    });

    mockUseProblemData.mockReturnValue({
      problem: null,
      error: null,
      generatedMap: null,
      renderProblemDescription: () => null,
    });
  });

  it('passes a deterministic seed into the learning problem loader', () => {
    const clearChatHistory = vi.fn();
    const setSharedLearningMap = vi.fn();

    renderHook(() =>
      useTowerDefenseV2ProblemState({
        activeTitleSlug: 'lp-js-m0-td-hello-print',
        isLearningMode: true,
        isMultiProblemTower: false,
        learningNodeId: 'javascript-node-1',
        learningPathSlug: 'javascript-path',
        learningPathTitleSlug: 'lp-js-m0-td-hello-print',
        learningProblemSlugs: ['lp-js-m0-td-hello-print'],
        sharedLearningMap: null,
        setSharedLearningMap,
        clearChatHistory,
      })
    );

    expect(mockUseProblemData).toHaveBeenCalledWith(
      'lp-js-m0-td-hello-print',
      clearChatHistory,
      null,
      expect.objectContaining({
        sourceHint: 'learning',
        mapSeedKey: 'javascript-node-1',
        preserveMapOnSlugChange: false,
        preserveChatOnSlugChange: false,
        sharedMap: null,
        setSharedMap: null,
      })
    );
  });
});
