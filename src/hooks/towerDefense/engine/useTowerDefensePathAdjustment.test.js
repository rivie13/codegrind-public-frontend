import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useTowerDefensePathAdjustment from './useTowerDefensePathAdjustment';

describe('useTowerDefensePathAdjustment', () => {
  it('lengthens paths through the interior instead of favoring edge detours', () => {
    vi.spyOn(Date, 'now').mockReturnValue(4242);

    const setPathOverride = vi.fn();
    const addTerminalMessage = vi.fn();
    const pathNodes = [
      [3, 0],
      [3, 1],
      [3, 2],
      [3, 3],
      [3, 4],
      [3, 5],
      [3, 6],
      [3, 7],
      [3, 8],
      [3, 9],
      [3, 10],
      [3, 11],
      [3, 12],
      [3, 13],
    ];

    const { result } = renderHook(() =>
      useTowerDefensePathAdjustment({
        addTerminalMessage,
        basePathLength: pathNodes.length,
        getDeployablePlacementType: () => 'anywhere',
        gridCols: 14,
        gridRows: 12,
        isMapLoading: false,
        gameState: {
          deployables: [],
          enemies: [],
          status: 'ready',
          towers: [],
        },
        pathNodes,
        problemDifficulty: 'easy',
        setPathOverride,
      })
    );

    act(() => {
      result.current.adjustPath('lengthen');
    });

    const adjustedPath = setPathOverride.mock.calls.at(-1)?.[0];
    expect(Array.isArray(adjustedPath)).toBe(true);
    expect(adjustedPath.length).toBeGreaterThan(pathNodes.length);

    const interiorNodes = adjustedPath.filter(
      ([row, col]) => row >= 2 && row <= 9 && col >= 2 && col <= 11
    );
    expect(interiorNodes.length).toBeGreaterThan(0);
  });

  it('keeps required path deployables on the route when shortening', () => {
    vi.spyOn(Date, 'now').mockReturnValue(8181);

    const setPathOverride = vi.fn();
    const addTerminalMessage = vi.fn();
    const requiredNode = [8, 6];
    const pathNodes = [
      [8, 0],
      [8, 1],
      [8, 2],
      [7, 2],
      [6, 2],
      [6, 3],
      [6, 4],
      [7, 4],
      [8, 4],
      [8, 5],
      requiredNode,
      [8, 7],
      [8, 8],
      [7, 8],
      [6, 8],
      [6, 9],
      [6, 10],
      [7, 10],
      [8, 10],
      [8, 11],
      [8, 12],
      [8, 13],
    ];

    const { result } = renderHook(() =>
      useTowerDefensePathAdjustment({
        addTerminalMessage,
        basePathLength: pathNodes.length,
        getDeployablePlacementType: () => 'path',
        gridCols: 14,
        gridRows: 12,
        isMapLoading: false,
        gameState: {
          deployables: [{ position: { row: requiredNode[0], col: requiredNode[1] } }],
          enemies: [],
          status: 'ready',
          towers: [],
        },
        pathNodes,
        problemDifficulty: 'easy',
        setPathOverride,
      })
    );

    act(() => {
      result.current.adjustPath('shorten');
    });

    const adjustedPath = setPathOverride.mock.calls.at(-1)?.[0];
    expect(Array.isArray(adjustedPath)).toBe(true);
    expect(adjustedPath.length).toBeLessThan(pathNodes.length);
    expect(adjustedPath).toContainEqual(requiredNode);
  });
});
