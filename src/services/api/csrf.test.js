import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./base', () => ({
  getApiOrigin: vi.fn(() => 'https://api.example.test/api'),
}));

vi.mock('../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import logger from '../../utils/core/logger';
import { clearCsrfToken, fetchCsrfToken, getCsrfToken } from './csrf';

describe('csrf helpers', () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetches and stores CSRF token from API origin', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ token: 'csrf-token-value' }),
    });

    const token = await fetchCsrfToken();

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.test/api/csrf-token', {
      credentials: 'include',
    });
    expect(token).toBe('csrf-token-value');
    expect(getCsrfToken()).toBe('csrf-token-value');
  });

  it('dedupes concurrent CSRF fetches', async () => {
    let resolveFetch;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const first = fetchCsrfToken();
    const second = fetchCsrfToken();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    resolveFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({ token: 'shared-token' }),
    });

    await expect(first).resolves.toBe('shared-token');
    await expect(second).resolves.toBe('shared-token');
    expect(getCsrfToken()).toBe('shared-token');
  });

  it('clears token on demand', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ token: 'to-clear' }),
    });
    await fetchCsrfToken();
    expect(getCsrfToken()).toBe('to-clear');

    clearCsrfToken();
    expect(getCsrfToken()).toBeNull();
  });

  it('throws and logs when token fetch fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    });

    await expect(fetchCsrfToken()).rejects.toThrow('HTTP error! status: 500');
    expect(logger.error).toHaveBeenCalled();
  });
});
