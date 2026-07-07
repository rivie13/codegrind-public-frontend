import { describe, expect, it } from 'vitest';
import {
  drawBackground,
  drawClusterTooltip,
  drawTierHeader,
  drawTitle,
  spawnPulses,
} from './cyberGridMacroHelpers';
import { createMockCanvasContext } from '../../tests/helpers/mockCanvasContext';

describe('cyberGridMacroHelpers', () => {
  it('spawns animated pulses from edge list', () => {
    const edges = [
      {
        from: { centerX: 10, centerY: 20 },
        to: { centerX: 110, centerY: 120 },
        color: '#00FFFF',
      },
      {
        from: { centerX: 30, centerY: 10 },
        to: { centerX: 90, centerY: 70 },
        color: '#00FF8C',
      },
      {
        from: { centerX: 15, centerY: 40 },
        to: { centerX: 80, centerY: 140 },
        color: '#FFD700',
      },
    ];

    const pulses = spawnPulses(edges, 0);

    expect(pulses.length).toBeGreaterThan(0);
    expect(pulses.every((pulse) => Number.isFinite(pulse.x))).toBe(true);
    expect(pulses.every((pulse) => Number.isFinite(pulse.y))).toBe(true);
  });

  it('draws background, tier header, and title elements', () => {
    const ctx = createMockCanvasContext();

    drawBackground(ctx, 960, 540, 1.2);
    drawTierHeader(
      ctx,
      {
        label: 'BEGINNER',
        color: '#00FF8C',
        y: 120,
        x: 60,
        width: 300,
      },
      1.5
    );
    drawTitle(ctx, 75, 17, 1.5, 'UNIT TEST GRID');

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('BEGINNER'))).toBe(true);
    expect(labels.some((text) => text.includes('UNIT TEST GRID'))).toBe(true);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('draws tooltip variants for auth, trial, and locked states', () => {
    const ctx = createMockCanvasContext();
    ctx.canvas = { width: 300 };
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1,
    });

    const node = {
      cluster: {
        id: 'trial-cluster',
        accent: '#00FFFF',
        title: 'Two Pointers',
        description: 'Converging pointers and partition patterns.',
        difficulty: 'beginner',
        slugs: ['a', 'b', 'c'],
      },
    };

    drawClusterTooltip(ctx, node, 290, 120, false, 'other-trial');
    drawClusterTooltip(ctx, node, 290, 120, false, 'trial-cluster');
    drawClusterTooltip(ctx, node, 290, 120, true, 'trial-cluster');

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('Sign in to access'))).toBe(true);
    expect(labels.some((text) => text.includes('Free trial'))).toBe(true);
    expect(labels.some((text) => text.includes('Click to explore'))).toBe(true);

    const [tx] = ctx.fillRect.mock.calls[0];
    expect(tx).toBeLessThan(290);
  });
});
