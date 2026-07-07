import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  api: {
    learningPath: {
      getProgress: vi.fn(),
      completeNode: vi.fn(),
      resetProgress: vi.fn(),
    },
  },
}));

import { api } from '../../services/api';
import {
  completeLearningPathNode,
  loadLearningPathProgress,
  resetLearningPathProgress,
} from './learningPathProgress';

describe('learningPathProgress', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns seed IDs when pathId is missing', async () => {
    const result = await loadLearningPathProgress(null, [1, '2']);
    expect([...result].sort()).toEqual(['1', '2']);
  });

  it('merges seed and stored IDs when pathData is not provided', async () => {
    api.learningPath.getProgress.mockResolvedValue({
      completedNodeIds: [2, '3'],
    });

    const result = await loadLearningPathProgress('python', [1]);

    expect(api.learningPath.getProgress).toHaveBeenCalledWith('python');
    expect([...result].sort()).toEqual(['1', '2', '3']);
  });

  it('normalizes stored completion aliases to node IDs when pathData exists', async () => {
    const pathData = {
      nodes: [
        {
          id: 'node-1',
          content: {
            learningProblemSlug: 'slug-one',
            towerConfig: {
              learningProblemSlug: 'tower-slug',
              learningProblemSlugs: ['tower-list-a', 'tower-list-b'],
              onboardingId: 'onboarding-node',
            },
          },
        },
        { id: 'node-2', content: {} },
      ],
    };

    api.learningPath.getProgress.mockResolvedValue({
      completedNodeIds: ['slug-one', 'tower-list-b', 'onboarding-node', 'node-2', 'unknown'],
    });

    const result = await loadLearningPathProgress('python', ['node-1'], pathData);

    expect([...result].sort()).toEqual(['node-1', 'node-2']);
  });

  it('falls back to seed IDs when progress fetch fails', async () => {
    api.learningPath.getProgress.mockRejectedValue(new Error('network'));

    const result = await loadLearningPathProgress('python', ['seed-1']);

    expect([...result]).toEqual(['seed-1']);
  });

  it('returns null when completeLearningPathNode is called without required values', async () => {
    expect(await completeLearningPathNode(null, 'node-1')).toBeNull();
    expect(await completeLearningPathNode('path-1', null)).toBeNull();
  });

  it('returns API response when completing a node succeeds', async () => {
    api.learningPath.completeNode.mockResolvedValue({ ok: true });

    const result = await completeLearningPathNode('path-1', 'node-1');

    expect(api.learningPath.completeNode).toHaveBeenCalledWith('path-1', 'node-1');
    expect(result).toEqual({ ok: true });
  });

  it('returns rate limit payload for 429 completion errors', async () => {
    api.learningPath.completeNode.mockRejectedValue({
      status: 429,
      data: { rateLimit: { remaining: 0, resetAt: 'soon' } },
    });

    const result = await completeLearningPathNode('path-1', 'node-1');

    expect(result).toEqual({
      error: 'rate_limit',
      rateLimit: { remaining: 0, resetAt: 'soon' },
    });
  });

  it('returns null for non-rate-limit completion failures', async () => {
    api.learningPath.completeNode.mockRejectedValue(new Error('boom'));

    const result = await completeLearningPathNode('path-1', 'node-1');

    expect(result).toBeNull();
  });

  it('returns null when resetLearningPathProgress has no path ID', async () => {
    expect(await resetLearningPathProgress(null)).toBeNull();
  });

  it('returns API response for reset success and null on reset failure', async () => {
    api.learningPath.resetProgress.mockResolvedValue({ reset: true });
    expect(await resetLearningPathProgress('path-1')).toEqual({ reset: true });

    api.learningPath.resetProgress.mockRejectedValue(new Error('fail'));
    expect(await resetLearningPathProgress('path-1')).toBeNull();
  });
});
