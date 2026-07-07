import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useTowerDefenseV2MapState from './useTowerDefenseV2MapState';

describe('useTowerDefenseV2MapState', () => {
  it('uses fallback difficulty dimensions while the map is loading', () => {
    const setPathOverride = vi.fn();

    const { result } = renderHook(() =>
      useTowerDefenseV2MapState({
        activeTitleSlug: 'decrypt-neural-frequency-pair',
        fallbackGridCols: 14,
        fallbackGridRows: 12,
        generatedMap: null,
        pathOverride: null,
        setPathOverride,
      })
    );

    expect(result.current.isMapLoading).toBe(true);
    expect(result.current.gridCols).toBe(14);
    expect(result.current.gridRows).toBe(12);
  });

  it('keeps the same dimensions once the generated map arrives', () => {
    const setPathOverride = vi.fn();
    const generatedMap = {
      pathNodes: [
        [0, 0],
        [0, 1],
      ],
      map: Array.from({ length: 12 }, () => Array(14).fill(0)),
    };

    const { result } = renderHook(() =>
      useTowerDefenseV2MapState({
        activeTitleSlug: 'decrypt-neural-frequency-pair',
        fallbackGridCols: 14,
        fallbackGridRows: 12,
        generatedMap,
        pathOverride: null,
        setPathOverride,
      })
    );

    expect(result.current.isMapLoading).toBe(false);
    expect(result.current.gridCols).toBe(14);
    expect(result.current.gridRows).toBe(12);
  });
});
