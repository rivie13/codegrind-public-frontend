import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import city from './city';

describe('city endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads the authenticated city story state', async () => {
    await city.getStoryState();

    expect(fetchWithError).toHaveBeenCalledWith('/api/city/story-state');
  });

  it('persists path choice and city return state with the expected payloads', async () => {
    await city.savePathChoice({
      selectedTrialLearningPath: 'python-path',
      selectedTrialTrack: 'beginner',
    });

    expect(fetchWithError).toHaveBeenLastCalledWith('/api/city/story-state/path-choice', {
      method: 'PUT',
      body: JSON.stringify({
        selectedTrialLearningPath: 'python-path',
        selectedTrialTrack: 'beginner',
      }),
    });

    await city.saveReturnState({ pathname: '/city', search: '?scene=apartment-room-01' });

    expect(fetchWithError).toHaveBeenLastCalledWith('/api/city/story-state/return-state', {
      method: 'PUT',
      body: JSON.stringify({
        cityReturnState: { pathname: '/city', search: '?scene=apartment-room-01' },
      }),
    });

    await city.saveMissionState({
      progressSummary: {
        problemsSolvedCount: 2,
        problemsAttemptedCount: 3,
      },
      routeMissionState: {
        surface: 'clusters',
        resumePath: '/games/clusters/arrays?collection=interview-core',
        clusterId: 'arrays',
      },
      selectedPlayerCharacterId: 'neo-runner',
    });

    expect(fetchWithError).toHaveBeenLastCalledWith('/api/city/story-state/mission-state', {
      method: 'PUT',
      body: JSON.stringify({
        progressSummary: {
          problemsSolvedCount: 2,
          problemsAttemptedCount: 3,
        },
        routeMissionState: {
          surface: 'clusters',
          resumePath: '/games/clusters/arrays?collection=interview-core',
          clusterId: 'arrays',
        },
        selectedPlayerCharacterId: 'neo-runner',
      }),
    });
  });

  it('claims a city collectible with the expected payload', async () => {
    await city.claimCollectible({ collectibleId: 'district-01-ada' });

    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/city/collectibles/district-01-ada/claim',
      {
        method: 'POST',
      }
    );
  });
});
