import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchWithError = vi.hoisted(() => vi.fn());

vi.mock('../../services/api/fetcher', () => ({
  fetchWithError: mockFetchWithError,
}));

import useGuestProgress, {
  GUEST_FREE_PROBLEM_LIMIT,
  GUEST_XP_REWARDS,
  getGuestClusterTrialUnlockedSlugs,
  getGuestLearningTrialUnlockedCanonicalSlugs,
  isGuestClusterTrialProblemUnlocked,
  isGuestLearningTrialProblemUnlocked,
} from './useGuestProgress';

const STORAGE_KEY = 'codegrind_guest_progress';

describe('useGuestProgress', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockFetchWithError.mockResolvedValue({ problems: [] });
  });

  it('falls back to empty progress when stored JSON is invalid', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    expect(result.current.progress.firstSeen).toBeNull();
    expect(result.current.progress.problemsAttempted).toEqual([]);
    expect(result.current.freeProblemsRemaining).toBe(GUEST_FREE_PROBLEM_LIMIT);
    expect(result.current.hasReachedProblemWall).toBe(false);
  });

  it('normalizes partial legacy blobs written outside the guest hook', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        demoCompleted: true,
        demoCompletedAt: '2026-03-01T00:00:00.000Z',
        pathChoice: 'pro',
      })
    );

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    expect(result.current.progress.demoCompleted).toBe(true);
    expect(result.current.progress.demoCompletedAt).toBe('2026-03-01T00:00:00.000Z');
    expect(result.current.progress.pathChoice).toBe('pro');
    expect(result.current.progress.selectedPlayerCharacterId).toBeNull();
    expect(result.current.progress.trialLearningPath).toBeNull();
    expect(result.current.progress.problemsAttempted).toEqual([]);
    expect(result.current.progress.problemsSolved).toEqual([]);
    expect(result.current.freeProblemsRemaining).toBe(GUEST_FREE_PROBLEM_LIMIT);
    expect(result.current.hasReachedProblemWall).toBe(false);
  });

  it('records a selected player character and drops invalid stored ids', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedPlayerCharacterId: 'broken-character-id',
      })
    );

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    expect(result.current.selectedPlayerCharacterId).toBeNull();

    act(() => {
      result.current.recordSelectedPlayerCharacter('selectable_character_05');
    });

    expect(result.current.selectedPlayerCharacterId).toBe('selectable_character_05');
    expect(result.current.progress.selectedPlayerCharacterId).toBe('selectable_character_05');
  });

  it('loads existing progress and computes derived summary values', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        firstSeen: '2026-03-01T00:00:00.000Z',
        demoCompleted: true,
        problemsAttempted: ['two-sum', 'valid-parentheses', 'merge-k-lists'],
        problemsSolved: ['two-sum'],
        lpNodesStarted: ['arrays'],
        lpNodesCompleted: ['arrays'],
        tdGamesPlayed: 2,
        codeExecutions: 5,
        clustersBrowsed: ['cluster-a', 'cluster-b'],
      })
    );

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    expect(result.current.freeProblemsRemaining).toBe(2);
    expect(result.current.hasReachedProblemWall).toBe(false);
    expect(result.current.activitySummary).toEqual({
      problemsAttemptedCount: 3,
      problemsSolvedCount: 1,
      problemsCompletedCount: 1,
      clusterTrialSolvedCount: 1,
      learningTrialSolvedCount: 0,
      lpNodesCompletedCount: 1,
      tdGamesPlayed: 2,
      clustersBrowsedCount: 2,
      demoCompleted: true,
      guestXp: 0,
      guestDataPacketsEarned: 0,
      guestLevel: 1,
      guestRoleName: 'Greenhorn',
      guestAchievementsCount: 2,
    });
  });

  it('initializes firstSeen and persists progress for unauthenticated users', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.firstSeen).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.firstSeen).toBe(result.current.progress.firstSeen);
    expect(setItemSpy).toHaveBeenCalled();
  });

  it('deduplicates records and updates wall/summary state', async () => {
    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.firstSeen).not.toBeNull();
    });

    act(() => {
      result.current.markDemoCompleted();
      result.current.recordPathChoice('pro');
      result.current.recordProblemAttempt('two-sum');
      result.current.recordProblemAttempt('two-sum');
      result.current.recordProblemAttempt('valid-parentheses');
      result.current.recordProblemAttempt('merge-k-lists');
      result.current.recordProblemSolved('two-sum');
      result.current.recordProblemSolved('two-sum');
      result.current.recordLpNodeStarted('arrays');
      result.current.recordLpNodeStarted('arrays');
      result.current.recordLpNodeCompleted('arrays');
      result.current.recordLpNodeCompleted('arrays');
      result.current.recordTdGamePlayed();
      result.current.recordTdGamePlayed();
      result.current.recordCodeExecution();
      result.current.recordCodeExecution();
      result.current.recordClusterBrowsed('cluster-a');
      result.current.recordClusterBrowsed('cluster-a');
    });

    await waitFor(() => {
      expect(result.current.progress.problemsAttempted).toHaveLength(3);
    });

    expect(result.current.progress.problemsAttempted).toEqual([
      'two-sum',
      'valid-parentheses',
      'merge-k-lists',
    ]);
    expect(result.current.progress.problemsSolved).toEqual(['two-sum']);
    expect(result.current.progress.demoCompletedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(result.current.progress.pathChoice).toBe('pro');
    expect(result.current.progress.pathChosenAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(result.current.progress.lpNodesStarted).toEqual(['arrays']);
    expect(result.current.progress.lpNodesCompleted).toEqual(['arrays']);
    expect(result.current.progress.tdGamesPlayed).toBe(2);
    expect(result.current.progress.codeExecutions).toBe(2);
    expect(result.current.progress.clustersBrowsed).toEqual(['cluster-a']);
    expect(result.current.freeProblemsRemaining).toBe(2);
    expect(result.current.hasReachedProblemWall).toBe(false);
    expect(result.current.activitySummary).toEqual({
      problemsAttemptedCount: 3,
      problemsSolvedCount: 1,
      problemsCompletedCount: 1,
      clusterTrialSolvedCount: 1,
      learningTrialSolvedCount: 0,
      lpNodesCompletedCount: 1,
      tdGamesPlayed: 2,
      clustersBrowsedCount: 1,
      demoCompleted: true,
      guestXp: expect.any(Number),
      guestDataPacketsEarned: expect.any(Number),
      guestLevel: expect.any(Number),
      guestRoleName: expect.any(String),
      guestAchievementsCount: expect.any(Number),
    });
  });

  it('avoids storage writes when authenticated, can export, and can clear state', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        firstSeen: '2026-03-01T00:00:00.000Z',
        demoCompleted: false,
        problemsAttempted: ['two-sum'],
        problemsSolved: [],
        lpNodesStarted: [],
        lpNodesCompleted: [],
        tdGamesPlayed: 0,
        codeExecutions: 0,
        clustersBrowsed: [],
      })
    );

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    act(() => {
      result.current.recordProblemAttempt('valid-parentheses');
      result.current.recordCodeExecution();
    });

    const snapshot = result.current.exportForMigration();
    expect(snapshot).toEqual(
      expect.objectContaining({
        problemsAttempted: ['two-sum', 'valid-parentheses'],
        codeExecutions: 1,
      })
    );
    expect(snapshot).not.toBe(result.current.progress);

    act(() => {
      result.current.clearProgress();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.progress.problemsAttempted).toEqual([]);
    expect(result.current.progress.problemsSolved).toEqual([]);
    expect(result.current.progress.lpNodesStarted).toEqual([]);
    expect(result.current.progress.lpNodesCompleted).toEqual([]);
    expect(result.current.progress.tdGamesPlayed).toBe(0);
    expect(result.current.progress.codeExecutions).toBe(0);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('awards guest XP and achievements when demo is completed and first solve is recorded', async () => {
    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.firstSeen).not.toBeNull();
    });

    act(() => {
      result.current.markDemoCompleted();
      result.current.recordProblemSolved('hello-world', { difficulty: 'easy', source: 'demo' });
    });

    expect(result.current.progress.demoCompleted).toBe(true);
    expect(result.current.progress.problemsSolved).toEqual(['hello-world']);
    expect(result.current.progress.guestAchievements).toEqual(['hello-codegrind', 'first-blood']);

    const expectedXp =
      GUEST_XP_REWARDS.demo_completed +
      GUEST_XP_REWARDS.problem_solved_easy +
      GUEST_XP_REWARDS.guest_achievement_hello_codegrind +
      GUEST_XP_REWARDS.guest_achievement_first_blood;
    expect(result.current.xpSummary.xp).toBe(expectedXp);
    expect(result.current.xpSummary.level).toBe(2);
    expect(result.current.unlockedGuestAchievements.map((a) => a.id)).toEqual([
      'hello-codegrind',
      'first-blood',
    ]);
  });

  it('builds a demo reward preview before applying updates', async () => {
    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.firstSeen).not.toBeNull();
    });

    const preview = result.current.getDemoRewardPreview();
    const reasons = preview.awards.map((award) => award.reason);

    expect(preview.totalXp).toBeGreaterThan(0);
    expect(reasons).toContain('demo_completed');
    expect(reasons).toContain('problem_solved_easy');
    expect(preview.unlockedAchievements.map((a) => a.id)).toEqual([
      'hello-codegrind',
      'first-blood',
    ]);
    expect(preview.projectedSummary.level).toBeGreaterThanOrEqual(1);
  });

  it('reconciles alias-duplicated guest solves so trial counts and xp stay canonical', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        firstSeen: '2026-03-01T00:00:00.000Z',
        demoCompleted: true,
        demoCompletedAt: '2026-03-01T00:05:00.000Z',
        pathChoice: 'pro',
        problemsAttempted: [
          'hello-world',
          'lp-m0-td-hello-print',
          'decrypt-neural-frequency-pair',
          'trace-rogue-daemon-instances',
        ],
        problemsSolved: [
          'hello-world',
          'lp-m0-td-hello-print',
          'decrypt-neural-frequency-pair',
          'trace-rogue-daemon-instances',
        ],
        xp: 345,
        guestAchievements: ['hello-codegrind', 'first-blood', 'triple-threat'],
        xpEvents: [
          { reason: 'demo_completed', amount: 60, at: '2026-03-01T00:05:00.000Z' },
          {
            reason: 'guest_achievement_hello_codegrind',
            amount: 20,
            at: '2026-03-01T00:05:01.000Z',
            context: { achievementId: 'hello-codegrind' },
          },
          {
            reason: 'problem_solved_easy',
            amount: 50,
            at: '2026-03-01T00:05:02.000Z',
            context: { slug: 'hello-world', difficulty: 'easy' },
          },
          {
            reason: 'guest_achievement_first_blood',
            amount: 25,
            at: '2026-03-01T00:05:03.000Z',
            context: { achievementId: 'first-blood' },
          },
          {
            reason: 'problem_solved_easy',
            amount: 50,
            at: '2026-03-01T00:05:04.000Z',
            context: { slug: 'lp-m0-td-hello-print', difficulty: 'easy' },
          },
          {
            reason: 'problem_solved_easy',
            amount: 50,
            at: '2026-03-01T00:05:05.000Z',
            context: { slug: 'decrypt-neural-frequency-pair', difficulty: 'easy' },
          },
          {
            reason: 'problem_solved_easy',
            amount: 50,
            at: '2026-03-01T00:05:06.000Z',
            context: { slug: 'trace-rogue-daemon-instances', difficulty: 'easy' },
          },
          {
            reason: 'guest_achievement_triple_threat',
            amount: 40,
            at: '2026-03-01T00:05:07.000Z',
            context: { achievementId: 'triple-threat' },
          },
        ],
      })
    );

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    expect(result.current.progress.problemsSolved).toEqual([
      'hello-world',
      'decrypt-neural-frequency-pair',
      'trace-rogue-daemon-instances',
    ]);
    expect(result.current.activitySummary.problemsAttemptedCount).toBe(3);
    expect(result.current.activitySummary.problemsSolvedCount).toBe(3);
    expect(result.current.activitySummary.clusterTrialSolvedCount).toBe(3);
    expect(result.current.xpSummary.xp).toBe(295);
    expect(result.current.xpSummary.xpIntoLevel).toBe(145);
    expect(result.current.xpSummary.xpToNextLevel).toBe(213);
    expect(result.current.xpSummary.xpRemainingToNextLevel).toBe(68);
  });

  it('awards learning-path node XP and supports repeat node XP previews', async () => {
    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.firstSeen).not.toBeNull();
    });

    const firstPreview = result.current.getLearningNodeRewardPreview('py-m0-learn', {
      pathId: 'python-path',
      nodeType: 'learn',
      nodeTitle: 'What You Learned',
      moduleId: 'py-m0-hello',
      moduleTitle: 'Hello World',
    });
    expect(firstPreview?.awards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: 'learning_path_node_complete',
          amount: 10,
          isRepeat: false,
        }),
      ])
    );

    const startingXp = result.current.xpSummary.xp;
    act(() => {
      result.current.recordLpNodeCompleted('py-m0-learn', {
        pathId: 'python-path',
        nodeType: 'learn',
        nodeTitle: 'What You Learned',
        moduleId: 'py-m0-hello',
        moduleTitle: 'Hello World',
      });
    });

    expect(result.current.progress.lpNodesCompleted).toContain('py-m0-learn');
    expect(result.current.xpSummary.xp).toBe(startingXp + 10);

    const repeatPreview = result.current.getLearningNodeRewardPreview('py-m0-learn', {
      pathId: 'python-path',
      nodeType: 'learn',
      nodeTitle: 'What You Learned',
      moduleId: 'py-m0-hello',
      moduleTitle: 'Hello World',
    });
    expect(repeatPreview?.awards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: 'learning_path_node_repeat',
          amount: 2,
          isRepeat: true,
        }),
      ])
    );

    act(() => {
      result.current.recordLpNodeCompleted('py-m0-learn', {
        pathId: 'python-path',
        nodeType: 'learn',
        nodeTitle: 'What You Learned',
        moduleId: 'py-m0-hello',
        moduleTitle: 'Hello World',
      });
    });

    expect(result.current.xpSummary.xp).toBe(startingXp + 12);
  });

  it.each(['javascript-path', 'java-path'])(
    'awards the shared homepage demo node after choosing %s',
    async (trialLearningPath) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          firstSeen: '2026-03-01T00:00:00.000Z',
          pathChoice: 'beginner',
          pathChosenAt: '2026-03-01T00:00:05.000Z',
          trialLearningPath,
        })
      );

      const { result } = renderHook(() => useGuestProgress());

      await waitFor(() => {
        expect(result.current.progress.firstSeen).not.toBeNull();
      });

      const startingXp = result.current.xpSummary.xp;

      act(() => {
        result.current.recordLpNodeCompleted('py-m0-tower-hello', {
          pathId: 'python-path',
          nodeType: 'tower',
          nodeTitle: 'Mission 1: Hello Print',
          moduleId: 'py-m0-hello',
          moduleTitle: 'Hello World',
        });
      });

      expect(result.current.progress.trialLearningPath).toBe(trialLearningPath);
      expect(result.current.progress.lpNodesCompleted).toContain('py-m0-tower-hello');
      expect(result.current.xpSummary.xp).toBe(startingXp + 60);
      expect(result.current.progress.xpEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: 'learning_path_node_complete',
            amount: 60,
            context: expect.objectContaining({
              pathId: 'python-path',
              nodeId: 'py-m0-tower-hello',
              nodeType: 'tower',
            }),
          }),
        ])
      );
    }
  );

  it('uses solved count, not attempted count, to trigger the guest wall', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        problemsAttempted: ['hello-world', 'two-sum', 'contains-duplicate', 'd', 'e'],
        problemsSolved: ['hello-world', 'two-sum', 'contains-duplicate'],
      })
    );

    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));
    expect(result.current.freeProblemsRemaining).toBe(0);
    expect(result.current.hasReachedProblemWall).toBe(true);
  });

  it('locks guest trial track after first choice', async () => {
    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    act(() => {
      result.current.recordPathChoice('beginner');
      result.current.recordPathChoice('pro');
    });

    expect(result.current.selectedTrialTrack).toBe('beginner');
    expect(result.current.isProTrialLocked).toBe(true);
    expect(result.current.isBeginnerTrialLocked).toBe(false);
  });

  it('locks guest trial learning path after first language selection', async () => {
    const { result } = renderHook(() => useGuestProgress({ isAuthenticated: true }));

    act(() => {
      result.current.recordTrialLearningPath('javascript-path');
      result.current.recordTrialLearningPath('python-path');
    });

    expect(result.current.selectedTrialTrack).toBe('beginner');
    expect(result.current.selectedTrialLearningPath).toBe('javascript-path');
    expect(result.current.isTrialLearningPathLocked('python-path')).toBe(true);
    expect(result.current.isTrialLearningPathLocked('javascript-path')).toBe(false);
  });

  it('computes cluster trial unlocks from contiguous solves only', () => {
    expect(getGuestClusterTrialUnlockedSlugs([])).toEqual(['hello-world']);
    expect(isGuestClusterTrialProblemUnlocked('two-sum', [])).toBe(false);
    expect(isGuestClusterTrialProblemUnlocked('two-sum', ['hello-world'])).toBe(true);
    expect(
      isGuestClusterTrialProblemUnlocked('contains-duplicate', [
        'hello-world',
        'contains-duplicate',
      ])
    ).toBe(false);
    expect(
      isGuestClusterTrialProblemUnlocked('contains-duplicate', [
        'hello-world',
        'two-sum',
        'contains-duplicate',
      ])
    ).toBe(true);
  });

  it('computes learning trial unlocks from canonical contiguous solves', () => {
    expect(getGuestLearningTrialUnlockedCanonicalSlugs([])).toEqual(['lp-m0-td-hello-print']);
    expect(isGuestLearningTrialProblemUnlocked('lp-m0-td-addition', [])).toBe(false);
    expect(isGuestLearningTrialProblemUnlocked('lp-m0-td-addition', ['lp-hello-print'])).toBe(true);
    expect(
      isGuestLearningTrialProblemUnlocked('lp-m0-td-variables', [
        'lp-m0-td-hello-print',
        'lp-m0-td-variables',
      ])
    ).toBe(false);
    expect(
      isGuestLearningTrialProblemUnlocked('lp-m0-td-variables', [
        'lp-m0-td-hello-print',
        'lp-m0-td-addition',
        'lp-m0-td-variables',
      ])
    ).toBe(true);
  });

  it('treats hello-world as lp-m0-td-hello-print for learning trial unlock chain', () => {
    // hello-world is recorded by the home-page demo; it must count as the first
    // canonical learning trial mission so the final challenge becomes reachable.
    expect(isGuestLearningTrialProblemUnlocked('lp-m0-td-addition', ['hello-world'])).toBe(true);
    expect(
      isGuestLearningTrialProblemUnlocked('lp-m0-final-two-lines', [
        'hello-world',
        'lp-m0-td-addition',
        'lp-m0-td-variables',
      ])
    ).toBe(true);
    // Without the prerequisites the final is still locked
    expect(isGuestLearningTrialProblemUnlocked('lp-m0-final-two-lines', ['hello-world'])).toBe(
      false
    );
  });

  it('does not let home demo skip non-python mission 1', () => {
    expect(isGuestLearningTrialProblemUnlocked('lp-js-m0-td-addition', ['hello-world'])).toBe(
      false
    );
    expect(
      isGuestLearningTrialProblemUnlocked('lp-js-m0-td-addition', ['lp-js-m0-td-hello-print'])
    ).toBe(true);
  });

  it('hydrates solved and attempted slugs from server guest progress', async () => {
    localStorage.setItem('guest_token', 'test-guest-token');

    mockFetchWithError.mockResolvedValueOnce({
      problems: [
        { problemSlug: 'hello-world', status: 'solved' },
        { problemSlug: 'two-sum', status: 'attempted' },
      ],
    });

    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.problemsSolved).toContain('hello-world');
    });

    expect(result.current.progress.problemsAttempted).toEqual(
      expect.arrayContaining(['hello-world', 'two-sum'])
    );
    expect(result.current.selectedTrialTrack).toBe('pro');
  });

  it('does not auto-lock track or language from shared onboarding demo slugs', async () => {
    localStorage.setItem('guest_token', 'test-guest-token');

    mockFetchWithError.mockResolvedValueOnce({
      problems: [{ problemSlug: 'lp-m0-td-hello-print', status: 'attempted' }],
    });

    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.problemsAttempted).toContain('lp-m0-td-hello-print');
    });

    expect(result.current.selectedTrialTrack).toBeNull();
    expect(result.current.selectedTrialLearningPath).toBeNull();
  });

  it('hydrates javascript mission 1 as beginner track + javascript path', async () => {
    localStorage.setItem('guest_token', 'test-guest-token');

    mockFetchWithError.mockResolvedValueOnce({
      problems: [{ problemSlug: 'lp-js-m0-td-hello-print', status: 'attempted' }],
    });

    const { result } = renderHook(() => useGuestProgress());

    await waitFor(() => {
      expect(result.current.progress.problemsAttempted).toContain('lp-js-m0-td-hello-print');
    });

    expect(result.current.selectedTrialTrack).toBe('beginner');
    expect(result.current.selectedTrialLearningPath).toBe('javascript-path');
  });
});
