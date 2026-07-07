import { describe, expect, it } from 'vitest';

import { resolveTowerDefensePageShellLayout } from './pageShellLayout';

describe('resolveTowerDefensePageShellLayout', () => {
  it('shrinks banner footprint in compact landscape shell mode', () => {
    const compactLandscapeStageHeight =
      'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) + 8px)';

    expect(
      resolveTowerDefensePageShellLayout({
        isCompactLandscapeShellMode: true,
      })
    ).toEqual({
      pageFrame: {
        minH: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
      bannerHeight: '56px',
      topBannerWrapper: {
        mt: 1,
        mb: 2,
      },
      topBannerProps: {
        wrapperMb: 0,
      },
      bottomBannerWrapper: {
        mt: 2,
        mb: 0,
        pb: 0,
      },
      bottomBannerProps: {
        wrapperMt: 0,
        wrapperMb: 0,
      },
      middleStage: {
        flex: '0 0 auto',
        minH: compactLandscapeStageHeight,
        display: 'flex',
        flexDirection: 'column',
        cssVars: {
          '--td-mobile-stage-height': 'auto',
          '--td-mobile-stage-min-height': compactLandscapeStageHeight,
        },
      },
    });
  });

  it('preserves the existing desktop and portrait banner footprint by default', () => {
    expect(resolveTowerDefensePageShellLayout()).toEqual({
      pageFrame: null,
      bannerHeight: '90px',
      topBannerWrapper: {
        mt: 4,
        mb: 4,
      },
      topBannerProps: {
        wrapperMb: 4,
      },
      bottomBannerWrapper: {
        mt: 6,
        mb: 1,
        pb: 0,
      },
      bottomBannerProps: {
        wrapperMt: 6,
        wrapperMb: 4,
      },
      middleStage: null,
    });
  });
});
