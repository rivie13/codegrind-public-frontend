import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cleanupStaleAds,
  createIframeAd,
  createVideoAd,
  isAdsenseLoaded,
  loadAdsenseScript,
  pushAd,
  reloadAllAds,
  resetAdState,
} from './adsenseHelper';

const resetDom = () => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  delete window.adsbygoogle;
  delete window.adInitialized;
  delete window.adsAttempted;
  delete window.insElementCount;
};

const mockIframeDocumentSupport = () => {
  const originalCreateElement = document.createElement.bind(document);
  const iframeDocs = [];

  const spy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
    const element = originalCreateElement(tagName, options);
    if (String(tagName).toLowerCase() === 'iframe') {
      let html = '';
      const iframeDoc = {
        open: vi.fn(),
        write: vi.fn((content) => {
          html = content;
        }),
        close: vi.fn(),
        get documentElement() {
          return { outerHTML: html };
        },
      };

      Object.defineProperty(element, 'contentWindow', {
        configurable: true,
        value: { document: iframeDoc },
      });
      iframeDocs.push(iframeDoc);
    }
    return element;
  });

  return { iframeDocs, spy };
};

describe('adsenseHelper', () => {
  beforeEach(() => {
    resetDom();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('detects whether AdSense is loaded from global or script tag', () => {
    expect(isAdsenseLoaded()).toBe(false);

    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-x';
    document.head.appendChild(script);
    expect(isAdsenseLoaded()).toBe(true);

    document.head.innerHTML = '';
    window.adsbygoogle = [];
    expect(isAdsenseLoaded()).toBe(true);
  });

  it('loadAdsenseScript resolves immediately when already loaded', async () => {
    window.adsbygoogle = [];
    await expect(loadAdsenseScript('ca-pub-custom')).resolves.toBe(true);
    expect(document.head.querySelectorAll('script[src*="adsbygoogle.js"]')).toHaveLength(0);
  });

  it('loadAdsenseScript appends script and resolves on load', async () => {
    const promise = loadAdsenseScript('ca-pub-custom');
    const script = document.head.querySelector('script[src*="adsbygoogle.js"]');

    expect(script).not.toBeNull();
    expect(script.src).toContain('client=ca-pub-custom');
    expect(script.crossOrigin).toBe('anonymous');
    expect(script.async).toBe(true);

    script.onload();
    await expect(promise).resolves.toBe(true);
    expect(Array.isArray(window.adsbygoogle)).toBe(true);
  });

  it('loadAdsenseScript rejects when script fails to load', async () => {
    const promise = loadAdsenseScript();
    const script = document.head.querySelector('script[src*="adsbygoogle.js"]');
    const error = new Error('network');

    script.onerror(error);
    await expect(promise).rejects.toBe(error);
  });

  it('pushAd initializes and pushes options after timeout', async () => {
    vi.useFakeTimers();

    const promise = pushAd({ slot: '123' });
    await vi.advanceTimersByTimeAsync(50);

    await expect(promise).resolves.toBe(true);
    expect(window.adsbygoogle).toEqual([{ slot: '123' }]);
  });

  it('pushAd rejects when push throws', async () => {
    vi.useFakeTimers();
    const error = new Error('push failed');
    window.adsbygoogle = {
      push: vi.fn(() => {
        throw error;
      }),
    };

    const promise = pushAd({ slot: 'x' });
    const assertion = expect(promise).rejects.toBe(error);
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('cleanupStaleAds clears only stale ad elements', () => {
    const stale = document.createElement('ins');
    stale.className = 'adsbygoogle';
    stale.innerHTML = '<span>stale</span>';

    const activeByStatus = document.createElement('ins');
    activeByStatus.className = 'adsbygoogle';
    activeByStatus.setAttribute('data-ad-status', 'filled');
    activeByStatus.innerHTML = '<span>active</span>';

    const activeByIframe = document.createElement('ins');
    activeByIframe.className = 'adsbygoogle';
    activeByIframe.appendChild(document.createElement('iframe'));

    document.body.appendChild(stale);
    document.body.appendChild(activeByStatus);
    document.body.appendChild(activeByIframe);

    cleanupStaleAds();

    expect(stale.innerHTML).toBe('');
    expect(activeByStatus.innerHTML).toBe('<span>active</span>');
    expect(activeByIframe.querySelector('iframe')).not.toBeNull();
  });

  it('resetAdState resets global counters and cleans stale elements', () => {
    window.adInitialized = { abc: true };
    window.adsAttempted = 7;
    window.insElementCount = 3;

    const stale = document.createElement('ins');
    stale.className = 'adsbygoogle';
    stale.innerHTML = '<span>stale</span>';
    document.body.appendChild(stale);

    resetAdState();

    expect(window.adInitialized).toEqual({});
    expect(window.adsAttempted).toBe(0);
    expect(window.insElementCount).toBe(0);
    expect(stale.innerHTML).toBe('');
  });

  it('createIframeAd returns null for missing container', () => {
    expect(createIframeAd(null, {})).toBeNull();
  });

  it('createIframeAd creates an ad iframe with config applied', () => {
    const { iframeDocs } = mockIframeDocumentSupport();
    const container = document.createElement('div');

    const iframe = createIframeAd(container, {
      slot: 'slot-123',
      format: 'horizontal',
      responsive: false,
      client: 'ca-pub-test',
    });

    expect(iframe).not.toBeNull();
    expect(container.contains(iframe)).toBe(true);
    expect(iframe.title).toBe('Advertisement');
    expect(iframe.style.height).toBe('90px');

    const html = iframeDocs[0].documentElement.outerHTML;
    expect(html).toContain('data-ad-slot="slot-123"');
    expect(html).toContain('data-ad-client="ca-pub-test"');
    expect(html).toContain('data-full-width-responsive="false"');
  });

  it('createIframeAd uses non-horizontal defaults when config is omitted', () => {
    const { iframeDocs } = mockIframeDocumentSupport();
    const container = document.createElement('div');

    const iframe = createIframeAd(container);

    expect(iframe.style.height).toBe('250px');
    const html = iframeDocs[0].documentElement.outerHTML;
    expect(html).toContain('data-full-width-responsive="true"');
  });

  it('createVideoAd returns null for missing container', () => {
    expect(createVideoAd(null, 'slot')).toBeNull();
  });

  it('createVideoAd creates iframe, clears container, and injects slot id', () => {
    const { iframeDocs } = mockIframeDocumentSupport();
    const container = document.createElement('div');
    container.innerHTML = '<p>old content</p>';
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const iframe = createVideoAd(container, 'video-slot-42');

    expect(iframe).not.toBeNull();
    expect(container.children).toHaveLength(1);
    expect(iframe.title).toBe('Video Advertisement');
    expect(iframe.style.height).toBe('300px');
    expect(iframe.id).toMatch(/^video-ad-/);

    const html = iframeDocs[0].documentElement.outerHTML;
    expect(html).toContain('data-ad-slot="video-slot-42"');
  });

  it('reloadAllAds still clears containers when adsbygoogle is unavailable', () => {
    const container = document.createElement('div');
    container.className = 'adsbygoogle-container';
    container.innerHTML = '<span>ad-a</span>';
    document.body.appendChild(container);
    delete window.adsbygoogle;

    reloadAllAds();

    expect(container.innerHTML).toBe('');
  });

  it('reloadAllAds clears containers and pushes each ad with error handling', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const containerA = document.createElement('div');
    containerA.className = 'adsbygoogle-container';
    containerA.innerHTML = '<span>ad-a</span>';
    const containerB = document.createElement('div');
    containerB.className = 'adsbygoogle-container';
    containerB.innerHTML = '<span>ad-b</span>';
    document.body.appendChild(containerA);
    document.body.appendChild(containerB);

    document.body.appendChild(document.createElement('ins')).className = 'adsbygoogle';
    document.body.appendChild(document.createElement('ins')).className = 'adsbygoogle';

    window.adsbygoogle = {
      push: vi
        .fn()
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
          throw new Error('push failed');
        }),
    };

    reloadAllAds();

    expect(containerA.innerHTML).toBe('');
    expect(containerB.innerHTML).toBe('');
    expect(window.adsbygoogle.push).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
