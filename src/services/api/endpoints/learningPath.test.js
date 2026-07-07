import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import learningPath from './learningPath';

describe('learningPath endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists paths', async () => {
    fetchWithError.mockResolvedValue({ paths: [] });

    const result = await learningPath.listPaths();

    expect(fetchWithError).toHaveBeenCalledWith('/api/learning-paths', { method: 'GET' });
    expect(result).toEqual({ paths: [] });
  });

  it('encodes path and module identifiers for route calls', async () => {
    await learningPath.getPath('python basics');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/learning-paths/python%20basics', {
      method: 'GET',
    });

    await learningPath.getModule('python basics', 'module/1');
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/learning-paths/python%20basics/modules/module%2F1',
      { method: 'GET' }
    );
  });

  it('gets progress and rate limit', async () => {
    await learningPath.getProgress('path-1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/learning-paths/path-1/progress', {
      method: 'GET',
    });

    await learningPath.getRateLimit('path-1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/learning-paths/path-1/rate-limit', {
      method: 'GET',
    });
  });

  it('completes node and watches ad with JSON payloads', async () => {
    await learningPath.completeNode('path-1', 'node-1');
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/learning-paths/path-1/progress/complete',
      {
        method: 'POST',
        body: JSON.stringify({ nodeId: 'node-1' }),
      }
    );

    await learningPath.watchAd('path-1', 'short');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/learning-paths/path-1/ads/watch', {
      method: 'POST',
      body: JSON.stringify({ adType: 'short' }),
    });
  });

  it('resets progress with DELETE', async () => {
    await learningPath.resetProgress('path-1');

    expect(fetchWithError).toHaveBeenCalledWith('/api/learning-paths/path-1/progress', {
      method: 'DELETE',
    });
  });
});
