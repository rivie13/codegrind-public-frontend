import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearCompactMobileShellBootstrap,
  persistCompactMobileShellBootstrap,
} from '../navigation/mobileShellNavigation';
import { buildResponsiveProfile } from './responsiveProfile';

const createMockWindow = ({ search = '' } = {}) => ({
  innerWidth: 1440,
  innerHeight: 900,
  location: { search },
  matchMedia: vi.fn(() => ({
    matches: false,
  })),
  screen: {
    orientation: {
      type: 'landscape-primary',
    },
  },
  sessionStorage: window.sessionStorage,
});

const createMockNavigator = () => ({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  maxTouchPoints: 0,
});

describe('buildResponsiveProfile OAuth handheld bootstrap', () => {
  beforeEach(() => {
    clearCompactMobileShellBootstrap(window);
  });

  it('keeps desktop-class detection false when no OAuth handheld override exists', () => {
    const profile = buildResponsiveProfile({
      win: createMockWindow(),
      nav: createMockNavigator(),
    });

    expect(profile.isHandheldLayout).toBe(false);
  });

  it('forces handheld layout when the OAuth return query requests the compact mobile shell', () => {
    const profile = buildResponsiveProfile({
      win: createMockWindow({ search: '?cgMobileShell=compact' }),
      nav: createMockNavigator(),
    });

    expect(profile.isHandheldLayout).toBe(true);
  });

  it('keeps handheld layout after the query is removed when the tab bootstrap is persisted', () => {
    persistCompactMobileShellBootstrap(window);

    const profile = buildResponsiveProfile({
      win: createMockWindow(),
      nav: createMockNavigator(),
    });

    expect(profile.isHandheldLayout).toBe(true);
  });
});
