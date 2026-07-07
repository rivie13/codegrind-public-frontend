import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const { buildResponsiveProfileMock } = vi.hoisted(() => ({
  buildResponsiveProfileMock: vi.fn(() => ({ isHandheldLayout: false })),
}));

vi.mock('../utils/web/responsiveProfile', () => ({
  RESPONSIVE_MEDIA_QUERIES: ['(max-width: 1024px)', '(pointer: coarse)'],
  buildResponsiveProfile: buildResponsiveProfileMock,
}));

import { ResponsiveContext, useResponsiveProfileState } from '../contexts/ResponsiveContext';
import useResponsiveProfile from './useResponsiveProfile';

describe('useResponsiveProfile', () => {
  let originalMatchMedia;
  let resizeListeners;
  let fullscreenListeners;

  beforeEach(() => {
    vi.resetAllMocks();
    resizeListeners = [];
    fullscreenListeners = [];
    originalMatchMedia = window.matchMedia;

    window.matchMedia = vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'resize') resizeListeners.push(listener);
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    vi.spyOn(document, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'fullscreenchange') fullscreenListeners.push(listener);
    });
    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('returns the provided responsive context value when available', () => {
    const providedProfile = { isHandheldLayout: true, isCompactLandscapeShellMode: false };
    const wrapper = ({ children }) => (
      <ResponsiveContext.Provider value={providedProfile}>{children}</ResponsiveContext.Provider>
    );

    const { result } = renderHook(() => useResponsiveProfile(), { wrapper });

    expect(result.current).toBe(providedProfile);
  });

  it('returns the initial fallback profile when no provider is present', () => {
    buildResponsiveProfileMock.mockReturnValue({ isHandheldLayout: false });

    const { result } = renderHook(() => useResponsiveProfileState());

    expect(result.current.isHandheldLayout).toBe(false);
  });

  it('updates the fallback profile when resize fires', () => {
    buildResponsiveProfileMock.mockReturnValue({ isHandheldLayout: false });
    const { result } = renderHook(() => useResponsiveProfileState());

    buildResponsiveProfileMock.mockReturnValue({ isHandheldLayout: true });
    act(() => {
      resizeListeners.forEach((listener) => listener());
    });

    expect(result.current.isHandheldLayout).toBe(true);
  });

  it('updates the fallback profile when fullscreenchange fires', () => {
    buildResponsiveProfileMock.mockReturnValue({ isHandheldLayout: false });
    const { result } = renderHook(() => useResponsiveProfileState());

    buildResponsiveProfileMock.mockReturnValue({ isHandheldLayout: true });
    act(() => {
      fullscreenListeners.forEach((listener) => listener());
    });

    expect(result.current.isHandheldLayout).toBe(true);
  });

  it('removes resize listeners on unmount', () => {
    buildResponsiveProfileMock.mockReturnValue({ isHandheldLayout: false });
    const { unmount } = renderHook(() => useResponsiveProfileState());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
