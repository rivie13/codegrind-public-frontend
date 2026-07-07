import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import useLearningWaveOverlays from './useLearningWaveOverlays';

const buildPathData = (sections) => ({
  modules: [
    {
      moduleId: 'm1',
      nodes: [
        { nodeId: 'tower-node', type: 'tower' },
        {
          nodeId: 'learn-node',
          type: 'learn',
          content: { sections },
        },
      ],
    },
  ],
});

describe('useLearningWaveOverlays', () => {
  it('stays inactive when learning mode is off or node is missing', () => {
    const pathData = buildPathData([{ id: 's1', type: 'text', text: 'A' }]);
    const { result, rerender } = renderHook((props) => useLearningWaveOverlays(props), {
      initialProps: {
        learningPathData: pathData,
        learningNodeId: 'tower-node',
        gameState: { status: 'ready', wave: 1, totalWaves: 2 },
        isLearningMode: false,
      },
    });

    expect(result.current.isOverlayActive).toBe(false);
    expect(result.current.totalTeachingSections).toBe(0);

    rerender({
      learningPathData: pathData,
      learningNodeId: 'unknown-node',
      gameState: { status: 'ready', wave: 1, totalWaves: 2 },
      isLearningMode: true,
    });

    expect(result.current.isOverlayActive).toBe(false);
    expect(result.current.totalTeachingSections).toBe(0);
  });

  it('shows wave-based overlays and respects dismiss tracking', async () => {
    const pathData = buildPathData([
      { id: 's1', type: 'text', text: 'Intro' },
      { id: 's2', type: 'example', text: 'Example' },
      { id: 's3', type: 'giphy', text: 'Ignored' },
    ]);

    const { result, rerender } = renderHook((props) => useLearningWaveOverlays(props), {
      initialProps: {
        learningPathData: pathData,
        learningNodeId: 'tower-node',
        gameState: { status: 'ready', wave: 1, totalWaves: 2 },
        isLearningMode: true,
      },
    });

    await waitFor(() => {
      expect(result.current.activeOverlay?.waveIndex).toBe(0);
    });
    expect(result.current.totalTeachingSections).toBe(2);
    expect(result.current.activeOverlay.sections.map((s) => s.id)).toEqual(['s1']);

    act(() => {
      result.current.dismissOverlay();
    });
    expect(result.current.activeOverlay).toBeNull();

    rerender({
      learningPathData: pathData,
      learningNodeId: 'tower-node',
      gameState: { status: 'ready', wave: 1, totalWaves: 2 },
      isLearningMode: true,
    });
    expect(result.current.activeOverlay).toBeNull();

    rerender({
      learningPathData: pathData,
      learningNodeId: 'tower-node',
      gameState: { status: 'wave-complete', wave: 1, totalWaves: 2 },
      isLearningMode: true,
    });

    await waitFor(() => {
      expect(result.current.activeOverlay?.waveIndex).toBe(1);
    });
    expect(result.current.activeOverlay.sections.map((s) => s.id)).toEqual(['s2']);
    expect(result.current.activeOverlay.shownSoFar).toBe(1);

    act(() => {
      result.current.dismissOverlay();
    });

    rerender({
      learningPathData: pathData,
      learningNodeId: 'tower-node',
      gameState: { status: 'wave-complete', wave: 2, totalWaves: 2 },
      isLearningMode: true,
    });
    expect(result.current.activeOverlay).toBeNull();
  });

  it('uses single-section special case before wave 1 only', async () => {
    const pathData = buildPathData([
      { id: 'single', type: 'text', text: 'Only one section' },
      { id: 'ignore', type: 'giphy', text: 'Ignored' },
    ]);

    const { result, rerender } = renderHook((props) => useLearningWaveOverlays(props), {
      initialProps: {
        learningPathData: pathData,
        learningNodeId: 'tower-node',
        gameState: { status: 'ready', wave: 1, totalWaves: 5 },
        isLearningMode: true,
      },
    });

    await waitFor(() => {
      expect(result.current.activeOverlay?.sections?.[0]?.id).toBe('single');
    });
    expect(result.current.totalTeachingSections).toBe(1);

    act(() => {
      result.current.dismissOverlay();
    });

    rerender({
      learningPathData: pathData,
      learningNodeId: 'tower-node',
      gameState: { status: 'wave-complete', wave: 1, totalWaves: 5 },
      isLearningMode: true,
    });

    expect(result.current.activeOverlay).toBeNull();
  });

  it('handles missing learn sections, non-trigger status, and no-op dismiss', () => {
    const pathData = {
      modules: [
        {
          moduleId: 'm1',
          nodes: [
            { nodeId: 'tower-node', type: 'tower' },
            { nodeId: 'learn-node', type: 'learn' },
          ],
        },
      ],
    };

    const { result } = renderHook(() =>
      useLearningWaveOverlays({
        learningPathData: pathData,
        learningNodeId: 'tower-node',
        gameState: { status: 'running', wave: 2 },
        isLearningMode: true,
      })
    );

    expect(result.current.totalTeachingSections).toBe(0);
    expect(result.current.activeOverlay).toBeNull();

    act(() => {
      result.current.dismissOverlay();
    });
    expect(result.current.activeOverlay).toBeNull();
  });

  it('skips repeated wave overlays and handles shown-section empty pending slices', async () => {
    const pathData = buildPathData([
      { id: 'shared', type: 'text', text: 'Shared' },
      { id: 'second', type: 'text', text: 'Second' },
    ]);

    const { result, rerender } = renderHook((props) => useLearningWaveOverlays(props), {
      initialProps: {
        learningPathData: pathData,
        learningNodeId: 'tower-node',
        gameState: { status: 'ready', wave: 1 },
        isLearningMode: true,
      },
    });

    await waitFor(() => {
      expect(result.current.activeOverlay?.sections?.map((s) => s.id)).toEqual(['shared']);
    });

    rerender({
      learningPathData: buildPathData([
        { id: 'shared', type: 'text', text: 'Shared' },
        { id: 'second', type: 'text', text: 'Second' },
      ]),
      learningNodeId: 'tower-node',
      gameState: { status: 'ready', wave: 1 },
      isLearningMode: true,
    });

    expect(result.current.activeOverlay?.sections?.map((s) => s.id)).toEqual(['shared']);

    act(() => {
      result.current.dismissOverlay();
    });

    rerender({
      learningPathData: buildPathData([
        { id: 'shared', type: 'text', text: 'Shared' },
        { id: 'second', type: 'text', text: 'Second' },
      ]),
      learningNodeId: 'tower-node',
      gameState: { status: 'ready', wave: 1 },
      isLearningMode: true,
    });
    expect(result.current.activeOverlay).toBeNull();

    rerender({
      learningPathData: buildPathData([
        { id: 'shared', type: 'text', text: 'Shared' },
        { id: 'second', type: 'text', text: 'Second' },
      ]),
      learningNodeId: 'tower-node',
      gameState: { status: 'wave-complete', wave: 1 },
      isLearningMode: true,
    });

    await waitFor(() => {
      expect(result.current.activeOverlay?.sections?.map((s) => s.id)).toEqual(['second']);
    });

    act(() => {
      result.current.dismissOverlay();
    });

    rerender({
      learningPathData: buildPathData([
        { id: 'shared', type: 'text', text: 'Shared' },
        { id: 'second', type: 'text', text: 'Second' },
      ]),
      learningNodeId: 'tower-node',
      gameState: { status: 'ready', wave: 1 },
      isLearningMode: true,
    });
    expect(result.current.activeOverlay).toBeNull();
  });

  it('returns null for single-section slot when section was already shown', async () => {
    const multi = buildPathData([
      { id: 'shared', type: 'text', text: 'Shared' },
      { id: 'second', type: 'text', text: 'Second' },
    ]);
    const single = buildPathData([{ id: 'shared', type: 'text', text: 'Shared again' }]);

    const { result, rerender } = renderHook((props) => useLearningWaveOverlays(props), {
      initialProps: {
        learningPathData: multi,
        learningNodeId: 'tower-node',
        gameState: { status: 'ready', wave: 1, totalWaves: 2 },
        isLearningMode: true,
      },
    });

    await waitFor(() => {
      expect(result.current.activeOverlay?.sections?.[0]?.id).toBe('shared');
    });
    act(() => {
      result.current.dismissOverlay();
    });

    rerender({
      learningPathData: multi,
      learningNodeId: 'tower-node',
      gameState: { status: 'wave-complete', wave: 1, totalWaves: 2 },
      isLearningMode: true,
    });
    await waitFor(() => {
      expect(result.current.activeOverlay?.sections?.[0]?.id).toBe('second');
    });
    act(() => {
      result.current.dismissOverlay();
    });

    rerender({
      learningPathData: single,
      learningNodeId: 'tower-node',
      gameState: { status: 'ready', wave: 1, totalWaves: 5 },
      isLearningMode: true,
    });
    expect(result.current.activeOverlay).toBeNull();
  });
});
