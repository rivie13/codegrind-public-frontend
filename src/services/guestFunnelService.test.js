import { describe, expect, it, vi } from 'vitest';

const loadService = async ({ fetchImpl } = {}) => {
  vi.resetModules();

  const fetchWithError = vi.fn(fetchImpl || (async () => ({ ok: true })));
  const trackGoogleAnalyticsEvent = vi.fn();
  const logger = {
    warn: vi.fn(),
  };

  vi.doMock('./api/fetcher', () => ({
    fetchWithError,
  }));

  vi.doMock('./analyticsService', () => ({
    trackGoogleAnalyticsEvent,
  }));

  vi.doMock('../utils/core/logger', () => ({
    default: logger,
  }));

  const mod = await import('./guestFunnelService');
  return {
    trackGuestFunnelStep: mod.trackGuestFunnelStep,
    fetchWithError,
    trackGoogleAnalyticsEvent,
    logger,
  };
};

describe('guestFunnelService', () => {
  it('posts funnel steps to the analytics endpoint', async () => {
    const { trackGuestFunnelStep, fetchWithError, trackGoogleAnalyticsEvent, logger } =
      await loadService();

    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    vi.stubGlobal('window', {
      innerWidth: 1280,
      innerHeight: 720,
      screen: { width: 1920, height: 1080 },
    });

    const result = await trackGuestFunnelStep('path_chosen', { path: 'beginner' });

    expect(trackGoogleAnalyticsEvent).toHaveBeenCalledWith('guest_funnel_path_chosen', {
      client_os: 'Windows',
      client_browser: 'Chrome',
      client_device: 'desktop',
      client_viewport_w: '1280',
      client_viewport_h: '720',
      client_screen_w: '1920',
      client_screen_h: '1080',
      path: 'beginner',
    });
    expect(fetchWithError).toHaveBeenCalledWith('/api/analytics/guest-funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'path_chosen',
        metadata: {
          client_os: 'Windows',
          client_browser: 'Chrome',
          client_device: 'desktop',
          client_viewport_w: '1280',
          client_viewport_h: '720',
          client_screen_w: '1920',
          client_screen_h: '1080',
          path: 'beginner',
        },
      }),
    });
    expect(result).toEqual({ ok: true });
    expect(logger.warn).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('swallows request failures and logs a warning', async () => {
    const error = new Error('network down');
    const { trackGuestFunnelStep, logger } = await loadService({
      fetchImpl: async () => {
        throw error;
      },
    });

    await expect(trackGuestFunnelStep('signup_completed')).resolves.toBeNull();

    expect(logger.warn).toHaveBeenCalledWith(
      '[guestFunnel] Failed to record step "signup_completed":',
      'network down'
    );
  });
});
