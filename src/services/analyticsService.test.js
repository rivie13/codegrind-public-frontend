import { afterEach, describe, expect, it, vi } from 'vitest';

// Load the module fresh with analytics enabled via the VITE_ENABLE_ANALYTICS escape hatch.
// import.meta.env.PROD is a build-time boolean set by Vite and cannot be stubbed at runtime;
// VITE_ENABLE_ANALYTICS provides the same code path for tests.
const loadAnalytics = async () => {
  vi.resetModules();
  vi.stubEnv('VITE_ENABLE_ANALYTICS', 'true');
  return import('./analyticsService');
};

describe('analyticsService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    delete window.gtag;
    delete window.dataLayer;
    delete window.adsenseScriptLoaded;
    delete window.adsbygoogle;
    delete window.adInitialized;
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
    document.querySelectorAll('script[src*="adsbygoogle"]').forEach((s) => s.remove());
  });

  describe('initializeGoogleAnalytics', () => {
    it('configures GA immediately when gtag is available', async () => {
      const { initializeGoogleAnalytics } = await loadAnalytics();
      window.gtag = vi.fn();

      initializeGoogleAnalytics();

      expect(window.gtag).toHaveBeenNthCalledWith(1, 'config', 'G-TZBYE7GZJN', {
        send_page_view: false,
      });
      expect(window.gtag).toHaveBeenNthCalledWith(2, 'event', 'page_view', {
        page_path: '/',
        page_title: document.title,
        page_location: 'http://localhost:3000/',
      });
      expect(window.gtag).toHaveBeenCalledTimes(2);
    });

    it('injects GTM script tag and defines gtag when not yet available', async () => {
      const { initializeGoogleAnalytics } = await loadAnalytics();
      delete window.gtag;

      initializeGoogleAnalytics();

      expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).not.toBeNull();
      expect(typeof window.gtag).toBe('function');
      expect(Array.isArray(window.dataLayer)).toBe(true);
    });

    it('uses setTimeout when GTM script tag exists but gtag not yet defined', async () => {
      vi.useFakeTimers();
      const { initializeGoogleAnalytics } = await loadAnalytics();
      delete window.gtag;

      const existing = document.createElement('script');
      existing.src = 'https://www.googletagmanager.com/gtag/js?id=G-TZBYE7GZJN';
      document.head.appendChild(existing);

      initializeGoogleAnalytics();

      // Simulate gtag becoming available after the script loads
      window.gtag = vi.fn();
      vi.advanceTimersByTime(2000);

      expect(window.gtag).toHaveBeenNthCalledWith(1, 'config', 'G-TZBYE7GZJN', {
        send_page_view: false,
      });
      expect(window.gtag).toHaveBeenNthCalledWith(2, 'event', 'page_view', {
        page_path: '/',
        page_title: document.title,
        page_location: 'http://localhost:3000/',
      });

      existing.remove();
    });

    it('logs an error when gtag throws during config', async () => {
      const { initializeGoogleAnalytics } = await loadAnalytics();
      const failure = new Error('gtag failed');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.gtag = vi.fn(() => {
        throw failure;
      });

      initializeGoogleAnalytics();

      expect(errorSpy).toHaveBeenCalledWith(
        '[AnalyticsService] Error calling gtag("config"): ',
        failure
      );
    });

    it('is a no-op when analytics are not enabled', async () => {
      vi.resetModules();
      vi.unstubAllEnvs();
      const { initializeGoogleAnalytics } = await import('./analyticsService');
      window.gtag = vi.fn();

      initializeGoogleAnalytics();

      expect(window.gtag).not.toHaveBeenCalled();
    });
  });

  describe('trackGoogleAnalyticsEvent', () => {
    it('sends custom GA events when gtag is available', async () => {
      const { trackGoogleAnalyticsEvent } = await loadAnalytics();
      window.gtag = vi.fn();

      trackGoogleAnalyticsEvent('guest_funnel_demo_completed', { track: 'beginner' });

      expect(window.gtag).toHaveBeenCalledWith('event', 'guest_funnel_demo_completed', {
        track: 'beginner',
      });
    });
  });

  describe('initializeAdSense', () => {
    it('injects AdSense script tag when not already loaded', async () => {
      const { initializeAdSense } = await loadAnalytics();
      delete window.adsenseScriptLoaded;

      initializeAdSense();

      expect(document.querySelector('script[src*="adsbygoogle.js"]')).not.toBeNull();
    });

    it('skips injection when window.adsenseScriptLoaded is already set', async () => {
      const { initializeAdSense } = await loadAnalytics();
      window.adsenseScriptLoaded = true;

      initializeAdSense();

      expect(document.querySelectorAll('script[src*="adsbygoogle.js"]').length).toBe(0);
    });

    it('skips injection when AdSense script tag already exists in DOM', async () => {
      const { initializeAdSense } = await loadAnalytics();
      const existing = document.createElement('script');
      existing.src =
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-test';
      document.head.appendChild(existing);

      initializeAdSense();

      expect(document.querySelectorAll('script[src*="adsbygoogle.js"]').length).toBe(1);
      existing.remove();
    });

    it('is a no-op when analytics are not enabled', async () => {
      vi.resetModules();
      vi.unstubAllEnvs();
      const { initializeAdSense } = await import('./analyticsService');

      initializeAdSense();

      expect(document.querySelector('script[src*="adsbygoogle.js"]')).toBeNull();
    });
  });
});
