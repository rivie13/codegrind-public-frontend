import { beforeEach, describe, expect, it, vi } from 'vitest';

const loggerMock = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const fetchCsrfTokenMock = vi.fn();
const getCsrfTokenMock = vi.fn();

const mockResponse = ({
  ok = true,
  status = 200,
  statusText = 'OK',
  jsonData = {},
  jsonError = null,
  url = 'https://api.example.test/mock',
} = {}) => ({
  ok,
  status,
  statusText,
  url,
  json: jsonError ? vi.fn().mockRejectedValue(jsonError) : vi.fn().mockResolvedValue(jsonData),
});

async function loadFetcherModule(configOverrides = {}) {
  vi.resetModules();

  vi.doMock('../../utils/core/logger', () => ({
    default: loggerMock,
  }));

  vi.doMock('./config', () => ({
    API_URL: 'https://api.example.test',
    AI_SERVER_URL: 'https://ai.example.test',
    ...configOverrides,
  }));

  vi.doMock('./csrf', () => ({
    fetchCsrfToken: fetchCsrfTokenMock,
    getCsrfToken: getCsrfTokenMock,
  }));

  return import('./fetcher');
}

describe('api/fetcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();
    fetchCsrfTokenMock.mockReset();
    getCsrfTokenMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetches a CSRF token and attaches it for protected non-chat requests', async () => {
    getCsrfTokenMock.mockReturnValueOnce(null).mockReturnValue('csrf-token-123');
    fetchCsrfTokenMock.mockResolvedValue('csrf-token-123');
    global.fetch.mockResolvedValue(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/problems', {
      method: 'POST',
      body: JSON.stringify({ id: 1 }),
      skipGuestToken: true,
    });

    expect(data).toEqual({ ok: true });
    expect(fetchCsrfTokenMock).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/problems',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': 'csrf-token-123',
        }),
      })
    );
  });

  it('routes local chat calls to the AI server and skips CSRF workflow', async () => {
    getCsrfTokenMock.mockReturnValue(null);
    global.fetch.mockResolvedValue(mockResponse({ jsonData: { response: 'ok' } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/chat/local/completions', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'ping' }),
      skipGuestToken: true,
    });

    expect(data).toEqual({ response: 'ok' });
    expect(fetchCsrfTokenMock).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://ai.example.test/api/chat/local/completions',
      expect.any(Object)
    );
  });

  it('obtains and caches guest tokens for guest-eligible endpoints', async () => {
    getCsrfTokenMock.mockReturnValue(null);

    global.fetch
      .mockResolvedValueOnce(mockResponse({ jsonData: { token: 'guest-abc' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { ok: 'first-chat' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { ok: 'second-chat' } }));

    const { fetchWithError } = await loadFetcherModule();

    const first = await fetchWithError('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ m: 1 }),
    });
    const second = await fetchWithError('/api/chat/send-again', {
      method: 'POST',
      body: JSON.stringify({ m: 2 }),
    });

    expect(first).toEqual({ ok: 'first-chat' });
    expect(second).toEqual({ ok: 'second-chat' });
    expect(localStorage.getItem('guest_token')).toBe('guest-abc');
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/guest/session');
    expect(global.fetch.mock.calls[1][1].headers['x-guest-token']).toBe('guest-abc');
    expect(global.fetch.mock.calls[2][1].headers['x-guest-token']).toBe('guest-abc');
  });

  it('attaches a guest token for interview problem endpoints', async () => {
    getCsrfTokenMock.mockReturnValue(null);

    global.fetch
      .mockResolvedValueOnce(mockResponse({ jsonData: { token: 'guest-problem' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { titleSlug: 'two-sum' } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/problems/two-sum');

    expect(data).toEqual({ titleSlug: 'two-sum' });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/guest/session');
    expect(global.fetch.mock.calls[1][0]).toBe('https://api.example.test/api/problems/two-sum');
    expect(global.fetch.mock.calls[1][1].headers['x-guest-token']).toBe('guest-problem');
  });

  it('attaches a guest token for tower defense snippet credit endpoints', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-snippets');

    global.fetch
      .mockResolvedValueOnce(mockResponse({ jsonData: { token: 'guest-tower-defense' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { success: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/tower-defense/add-snippet-credit', {
      method: 'POST',
      body: JSON.stringify({ adType: 'short' }),
    });

    expect(data).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/guest/session');
    expect(global.fetch.mock.calls[1][0]).toBe(
      'https://api.example.test/api/tower-defense/add-snippet-credit'
    );
    expect(global.fetch.mock.calls[1][1].headers).toEqual(
      expect.objectContaining({
        'X-CSRF-Token': 'csrf-snippets',
        'x-guest-token': 'guest-tower-defense',
      })
    );
  });

  it('reuses a cached guest token for prewarm without creating a new guest session', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-prewarm');
    localStorage.setItem('guest_token', 'guest-existing');
    global.fetch.mockResolvedValueOnce(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/prewarm', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(data).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/prewarm',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-CSRF-Token': 'csrf-prewarm',
          'x-guest-token': 'guest-existing',
        }),
      })
    );
  });

  it('does not create a guest session for prewarm when no guest token is cached', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-prewarm');
    global.fetch.mockResolvedValueOnce(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/prewarm', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(data).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/prewarm');
    expect(global.fetch.mock.calls[0][1].headers['x-guest-token']).toBeUndefined();
  });

  it('reuses a cached guest token for bug reports without creating a new guest session', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-bug-report');
    localStorage.setItem('guest_token', 'guest-existing');
    global.fetch.mockResolvedValueOnce(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/email/bug-report', {
      method: 'POST',
      body: JSON.stringify({ description: 'Found a bug' }),
    });

    expect(data).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/email/bug-report',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-CSRF-Token': 'csrf-bug-report',
          'x-guest-token': 'guest-existing',
        }),
      })
    );
    expect(global.fetch).not.toHaveBeenCalledWith(
      'https://api.example.test/api/guest/session',
      expect.any(Object)
    );
  });

  it('does not create a guest session for bug reports when no guest token is cached', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-bug-report');
    global.fetch.mockResolvedValueOnce(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/email/bug-report', {
      method: 'POST',
      body: JSON.stringify({ description: 'Found a bug' }),
    });

    expect(data).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/email/bug-report');
    expect(global.fetch.mock.calls[0][1].headers['x-guest-token']).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalledWith(
      'https://api.example.test/api/guest/session',
      expect.any(Object)
    );
  });

  it('sends guest token for register endpoint to preserve migration context', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-register');

    global.fetch
      .mockResolvedValueOnce(mockResponse({ jsonData: { token: 'guest-register' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { success: true } }));

    const { fetchWithError } = await loadFetcherModule();

    const data = await fetchWithError('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'guest@example.com', password: 'secret123' }),
    });

    expect(data).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/guest/session');
    expect(global.fetch.mock.calls[1][0]).toBe('https://api.example.test/api/auth/register');
    expect(global.fetch.mock.calls[1][1].headers['x-guest-token']).toBe('guest-register');
  });

  it('does not mint or attach guest tokens when an authenticated user hint exists', async () => {
    getCsrfTokenMock.mockReturnValue(null);
    localStorage.setItem('user_id', '7');
    localStorage.setItem('guest_token', 'guest-stale');

    global.fetch.mockResolvedValueOnce(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ m: 1 }),
    });

    expect(data).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.test/api/chat/send');
    expect(global.fetch.mock.calls[0][1].headers['x-guest-token']).toBeUndefined();
  });

  it('clears the in-memory guest token cache when requested', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-prewarm');

    global.fetch
      .mockResolvedValueOnce(mockResponse({ jsonData: { token: 'guest-cached' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { ok: 'chat' } }))
      .mockResolvedValueOnce(mockResponse({ jsonData: { ok: 'prewarm' } }));

    const { clearGuestTokenState, fetchWithError } = await loadFetcherModule();

    await fetchWithError('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ m: 1 }),
    });

    clearGuestTokenState();

    const data = await fetchWithError('/api/prewarm', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(data).toEqual({ ok: 'prewarm' });
    expect(localStorage.getItem('guest_token')).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[2][0]).toBe('https://api.example.test/api/prewarm');
    expect(global.fetch.mock.calls[2][1].headers['x-guest-token']).toBeUndefined();
  });

  it('throws VmStartingError for 503 VM_STARTING responses', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-token');
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        jsonData: {
          error_code: 'VM_STARTING',
          message: 'Environment warming',
        },
      })
    );

    const { fetchWithError, VmStartingError } = await loadFetcherModule();

    await expect(
      fetchWithError('/api/run-code', { method: 'POST', body: '{}' })
    ).rejects.toBeInstanceOf(VmStartingError);
  });

  it('retries once on 403 for protected endpoints after refreshing CSRF token', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-token-2');
    fetchCsrfTokenMock.mockResolvedValue('csrf-token-2');

    global.fetch
      .mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          jsonData: { error: 'bad csrf' },
        })
      )
      .mockResolvedValueOnce(mockResponse({ jsonData: { retried: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/problems/private', {
      method: 'POST',
      body: '{}',
      skipGuestToken: true,
    });

    // Retry path calls fetchWithError recursively so the return value is parsed JSON.
    expect(data).toEqual({ retried: true });
    expect(fetchCsrfTokenMock).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][1].headers['X-CSRF-Token']).toBe('csrf-token-2');
  });

  it('does not retry on 403 a second time (csrfRetried guard)', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-token-2');
    fetchCsrfTokenMock.mockResolvedValue('csrf-token-2');

    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        jsonData: { error: 'still bad csrf' },
      })
    );

    const { fetchWithError } = await loadFetcherModule();

    await expect(
      fetchWithError('/api/problems/private', {
        method: 'POST',
        body: '{}',
        skipGuestToken: true,
      })
    ).rejects.toThrow('still bad csrf');

    // First call + one retry only = 2 fetch calls total
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(fetchCsrfTokenMock).toHaveBeenCalledTimes(1);
  });

  it('does not fetch a CSRF token for safe GET requests', async () => {
    getCsrfTokenMock.mockReturnValue(null);
    global.fetch.mockResolvedValue(mockResponse({ jsonData: { ok: true } }));

    const { fetchWithError } = await loadFetcherModule();
    const data = await fetchWithError('/api/auth/check');

    expect(data).toEqual({ ok: true });
    expect(fetchCsrfTokenMock).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/check',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.not.objectContaining({
          'X-CSRF-Token': expect.any(String),
        }),
      })
    );
  });

  it('throws chat-specific error messages when chat responses fail', async () => {
    getCsrfTokenMock.mockReturnValue(null);
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        jsonError: new Error('invalid json body'),
      })
    );

    const { fetchWithError } = await loadFetcherModule();

    await expect(fetchWithError('/api/chat/message', { skipGuestToken: true })).rejects.toThrow(
      'HTTP error! status: 500'
    );
  });

  it('propagates network failures from fetch calls', async () => {
    getCsrfTokenMock.mockReturnValue('csrf-token');
    global.fetch.mockRejectedValue(new Error('network down'));

    const { fetchWithError } = await loadFetcherModule();

    await expect(fetchWithError('/api/problems', { skipGuestToken: true })).rejects.toThrow(
      'network down'
    );
  });
});
