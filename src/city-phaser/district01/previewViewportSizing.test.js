import { describe, expect, it } from 'vitest';

import { resolveStableViewportSize } from './previewViewportSizing';

describe('previewViewportSizing', () => {
  it('prefers an explicit preview container size before browser viewport fallbacks', () => {
    expect(
      resolveStableViewportSize({
        containerSize: {
          height: 812.8,
          width: 375.6,
        },
        visualViewport: {
          height: 844.2,
          width: 390.4,
        },
        win: {
          innerHeight: 915,
          innerWidth: 412,
        },
      })
    ).toEqual({
      height: 813,
      width: 376,
    });
  });

  it('uses the visual viewport for page-level sizing when it is available', () => {
    expect(
      resolveStableViewportSize({
        visualViewport: {
          height: 844.2,
          width: 390.4,
        },
        win: {
          innerHeight: 915,
          innerWidth: 412,
        },
      })
    ).toEqual({
      height: 844,
      width: 390,
    });
  });

  it('prefers Phaser-provided game sizing before browser viewport fallbacks', () => {
    expect(
      resolveStableViewportSize({
        gameSize: {
          height: 576,
          width: 1024,
        },
        scaleManager: {
          gameSize: {
            height: 600,
            width: 1100,
          },
          height: 640,
          width: 1200,
        },
        visualViewport: {
          height: 480,
          width: 320,
        },
        win: {
          innerHeight: 720,
          innerWidth: 1280,
        },
      })
    ).toEqual({
      height: 576,
      width: 1024,
    });
  });

  it('keeps the last stable size when transient viewport values collapse to zero or the minimum ScaleManager boundary', () => {
    expect(
      resolveStableViewportSize({
        previousSize: {
          height: 844,
          width: 390,
        },
        visualViewport: {
          height: 0,
          width: 0,
        },
        win: {
          innerHeight: 0,
          innerWidth: 0,
        },
      })
    ).toEqual({
      height: 844,
      width: 390,
    });

    // Verify it ignores Phaser's default 16x16 minimum scale boundary collapse
    expect(
      resolveStableViewportSize({
        previousSize: {
          height: 844,
          width: 390,
        },
        scaleManager: {
          gameSize: {
            height: 16,
            width: 16,
          },
          height: 16,
          width: 16,
        },
        visualViewport: {
          height: 0,
          width: 0,
        },
        win: {
          innerHeight: 0,
          innerWidth: 0,
        },
      })
    ).toEqual({
      height: 844,
      width: 390,
    });
  });
});
