import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { useResponsiveProfileMock } = vi.hoisted(() => ({
  useResponsiveProfileMock: vi.fn(() => ({ isHandheldLayout: false })),
}));

vi.mock('./useResponsiveProfile', () => ({
  default: useResponsiveProfileMock,
}));

import useIsMobileDevice from './useIsMobileDevice';

describe('useIsMobileDevice', () => {
  it('returns false when the responsive profile is not handheld', () => {
    useResponsiveProfileMock.mockReturnValue({ isHandheldLayout: false });
    const { result } = renderHook(() => useIsMobileDevice());

    expect(result.current).toBe(false);
  });

  it('returns true when the responsive profile is handheld', () => {
    useResponsiveProfileMock.mockReturnValue({ isHandheldLayout: true });
    const { result } = renderHook(() => useIsMobileDevice());

    expect(result.current).toBe(true);
  });
});
