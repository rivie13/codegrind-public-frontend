import { describe, expect, it } from 'vitest';
import { detectMobileDevice } from './deviceDetection';

const createMatchMedia =
  (matchesByQuery = {}) =>
  (query) => ({
    matches: Boolean(matchesByQuery[query]),
  });

describe('detectMobileDevice', () => {
  it('does not classify desktop as mobile when devtools narrows viewport', () => {
    const result = detectMobileDevice({
      win: {
        innerWidth: 780,
        matchMedia: createMatchMedia({
          '(max-width: 1024px)': true,
          '(max-width: 900px)': true,
          '(pointer: coarse)': false,
          '(pointer: fine)': true,
          '(hover: none)': false,
        }),
      },
      nav: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        maxTouchPoints: 0,
      },
    });

    expect(result).toBe(false);
  });

  it('does not classify a windows touch laptop in tent mode as mobile', () => {
    const result = detectMobileDevice({
      win: {
        innerWidth: 880,
        innerHeight: 1280,
        matchMedia: createMatchMedia({
          '(max-width: 1024px)': true,
          '(max-width: 900px)': true,
          '(pointer: coarse)': true,
          '(pointer: fine)': false,
          '(hover: none)': true,
          '(orientation: landscape)': false,
          '(max-height: 900px)': false,
          '(max-height: 600px)': false,
          '(max-height: 760px)': false,
          '(display-mode: standalone)': false,
        }),
      },
      nav: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        maxTouchPoints: 10,
      },
    });

    expect(result).toBe(false);
  });

  it('does not classify a wide windows touch laptop as mobile', () => {
    const result = detectMobileDevice({
      win: {
        innerWidth: 1366,
        innerHeight: 768,
        matchMedia: createMatchMedia({
          '(max-width: 1024px)': false,
          '(max-width: 900px)': false,
          '(pointer: coarse)': true,
          '(pointer: fine)': false,
          '(hover: none)': true,
          '(orientation: landscape)': true,
          '(max-height: 900px)': true,
          '(max-height: 600px)': false,
          '(max-height: 760px)': false,
          '(display-mode: standalone)': false,
        }),
      },
      nav: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        maxTouchPoints: 10,
      },
    });

    expect(result).toBe(false);
  });

  it('classifies iphone as mobile', () => {
    const result = detectMobileDevice({
      win: {
        innerWidth: 390,
        matchMedia: createMatchMedia({
          '(max-width: 1024px)': true,
          '(max-width: 900px)': true,
          '(pointer: coarse)': true,
          '(pointer: fine)': false,
          '(hover: none)': true,
          '(orientation: landscape)': false,
          '(max-height: 900px)': true,
          '(max-height: 600px)': true,
          '(max-height: 760px)': true,
          '(display-mode: standalone)': false,
        }),
      },
      nav: {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        maxTouchPoints: 5,
      },
    });

    expect(result).toBe(true);
  });

  it('classifies ipad desktop user agent with touch points as mobile', () => {
    const result = detectMobileDevice({
      win: {
        innerWidth: 1024,
        innerHeight: 768,
        matchMedia: createMatchMedia({
          '(max-width: 1024px)': true,
          '(max-width: 900px)': false,
          '(pointer: coarse)': true,
          '(pointer: fine)': false,
          '(hover: none)': true,
          '(orientation: landscape)': true,
          '(max-height: 900px)': true,
          '(max-height: 600px)': false,
          '(max-height: 760px)': false,
          '(display-mode: standalone)': false,
        }),
      },
      nav: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15',
        maxTouchPoints: 5,
      },
    });

    expect(result).toBe(true);
  });

  it('classifies touch-first wide fullscreen phone viewports as mobile even without a mobile user agent', () => {
    const result = detectMobileDevice({
      win: {
        innerWidth: 1180,
        innerHeight: 430,
        matchMedia: createMatchMedia({
          '(max-width: 1024px)': false,
          '(max-width: 900px)': false,
          '(pointer: coarse)': true,
          '(pointer: fine)': false,
          '(hover: none)': true,
          '(orientation: landscape)': true,
          '(max-height: 900px)': true,
          '(max-height: 600px)': true,
          '(max-height: 760px)': true,
          '(display-mode: standalone)': false,
        }),
      },
      nav: {
        userAgent: 'Mozilla/5.0 (Linux; armv8l) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        maxTouchPoints: 5,
      },
    });

    expect(result).toBe(true);
  });
});
