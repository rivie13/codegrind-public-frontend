import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import useAnimationSettings from './useAnimationSettings';

const setViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
};

describe('useAnimationSettings', () => {
  beforeEach(() => {
    setViewport(1280, 720);
  });

  it('uses high-quality defaults on standard resolution', async () => {
    const { result } = renderHook(() => useAnimationSettings({ defaultEnabled: true }));

    await waitFor(() => {
      expect(result.current.quality).toBe('high');
    });

    expect(result.current.isHighRes).toBe(false);
    expect(result.current.animationsEnabled).toBe(true);
    expect(result.current.settings.gridAnimation.opacity).toBe(0.2);
    expect(result.current.settings.scanLineAnimation.speed).toBe(5);
  });

  it('auto-adjusts to medium/high-res and low/4k settings on resize', async () => {
    setViewport(2560, 1440);
    const { result } = renderHook(() => useAnimationSettings({ defaultEnabled: true }));

    await waitFor(() => {
      expect(result.current.isHighRes).toBe(true);
      expect(result.current.quality).toBe('medium');
    });

    expect(result.current.settings.gridAnimation.opacity).toBe(0.1);
    expect(result.current.settings.scanLineAnimation.speed).toBe(8);

    await act(async () => {
      setViewport(3840, 2160);
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(result.current.quality).toBe('low');
    });

    expect(result.current.settings.gridAnimation.opacity).toBe(0.05);
    expect(result.current.settings.scanLineAnimation.enabled).toBe(false);
  });

  it('toggles all animations and supports specific animation + quality controls', async () => {
    const { result } = renderHook(() => useAnimationSettings({ defaultEnabled: true }));

    await waitFor(() => {
      expect(result.current.animationsEnabled).toBe(true);
    });

    act(() => {
      result.current.toggleAnimations();
    });

    expect(result.current.animationsEnabled).toBe(false);
    expect(result.current.settings.gridAnimation.enabled).toBe(false);
    expect(result.current.settings.glitchEffects.enabled).toBe(false);

    act(() => {
      result.current.toggleAnimation('gridAnimation');
    });
    expect(result.current.settings.gridAnimation.enabled).toBe(true);

    act(() => {
      result.current.setAnimationQuality('none');
    });
    expect(result.current.quality).toBe('none');
    expect(result.current.settings.scanLineAnimation.enabled).toBe(false);
    expect(result.current.settings.matrixEffects.intensity).toBe(0);

    act(() => {
      result.current.setAnimationQuality('medium');
    });
    expect(result.current.quality).toBe('medium');
    expect(result.current.settings.glitchEffects.intensity).toBe(0.7);
  });
});
