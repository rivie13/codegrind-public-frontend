import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRng,
  drawChipNode,
  drawCircuitTrace,
  drawComponentBlock,
  drawDataStream,
  drawDitheredRect,
  drawFlashOverlay,
  drawGlitchBit,
  drawMiniChip,
  drawPcbBackground,
  drawPixelRect,
  drawScanlines,
  drawVoltageBar,
  fillPixel,
  hexToRgb,
  rgbStr,
  withAlpha,
} from './pixelUtils';
import { createMockCanvasContext } from '../../tests/helpers/mockCanvasContext';

describe('pixelUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides deterministic rng and color helpers', () => {
    const rngA = createRng(1337);
    const rngB = createRng(1337);

    expect(rngA()).toBeCloseTo(rngB(), 10);
    expect(rngA()).toBeCloseTo(rngB(), 10);

    expect(hexToRgb('#00FF8C')).toEqual([0, 255, 140]);
    expect(rgbStr(1, 2, 3)).toBe('rgb(1,2,3)');
    expect(rgbStr(1, 2, 3, 0.4)).toBe('rgba(1,2,3,0.4)');
    expect(withAlpha('#112233', 0.25)).toBe('rgba(17,34,51,0.25)');
  });

  it('draws primitive pixel-art helpers', () => {
    const ctx = createMockCanvasContext();

    drawDitheredRect(ctx, 0, 0, 24, 12, '#00FF8C', 0.7, 2);
    fillPixel(ctx, 3.3, 4.6, 2, '#fff');
    drawPixelRect(ctx, 2, 2, 20, 10, '#0ff', 2);
    drawScanlines(ctx, 0, 0, 40, 20, 4, 0.08);

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillStyle).toBeTruthy();
  });

  it('handles data stream and glitch particles', () => {
    const ctx = createMockCanvasContext();
    const rng = createRng(42);

    drawDataStream(ctx, 10, 10, 11, 10.5, '#00FFFF', 1.2, rng, 1);
    const callsAfterShortDistance = ctx.fillRect.mock.calls.length;

    drawDataStream(ctx, 10, 10, 120, 70, '#00FFFF', 1.2, createRng(10), 1);
    drawGlitchBit(ctx, 50, 50, 10, '#00FFFF', 0.8);

    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(callsAfterShortDistance);
  });

  it('draws chip and mini-chip states', () => {
    const ctx = createMockCanvasContext();

    drawChipNode(ctx, 20, 20, 80, '#00FF8C', 'active', 1.1, 'NODE-1');
    drawChipNode(ctx, 120, 20, 80, '#00FF8C', 'complete', 1.1, 'NODE-2');
    drawChipNode(ctx, 220, 20, 80, '#00FF8C', 'locked', 1.1, 'NODE-3', {
      skipLabel: true,
      skipInterior: true,
    });

    drawMiniChip(ctx, 40, 140, 20, '#00CCFF', 'active', 0.5);
    drawMiniChip(ctx, 70, 140, 20, '#00CCFF', 'complete', 0.5);
    drawMiniChip(ctx, 100, 140, 20, '#00CCFF', 'locked', 0.5);

    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('draws traces, component blocks, and board overlays', () => {
    const ctx = createMockCanvasContext();

    drawCircuitTrace(ctx, 10, 10, 120, 70, '#FFCC00', 3, 0.6);
    drawComponentBlock(
      ctx,
      20,
      20,
      120,
      56,
      '#00FF8C',
      'active',
      1.3,
      'Longest Label Here',
      'Hard'
    );
    drawComponentBlock(ctx, 160, 20, 120, 56, '#00FF8C', 'complete', 1.3, 'Solved', 'Easy');
    drawComponentBlock(ctx, 300, 20, 120, 56, '#00FF8C', 'locked', 1.3, 'Locked', null);

    drawPcbBackground(ctx, 500, 320, 3.7, '#00FF8C');
    drawFlashOverlay(ctx, 500, 320, 0.5, '#00FFFF');
    drawFlashOverlay(ctx, 500, 320, 0, '#00FFFF');

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('renders voltage bar in empty, partial, and full states', () => {
    const ctx = createMockCanvasContext();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    drawVoltageBar(ctx, 10, 10, 180, 14, 0, '#00FFFF', 0.2);
    drawVoltageBar(ctx, 10, 30, 180, 14, 0.45, '#00FFFF', 0.6);
    drawVoltageBar(ctx, 10, 50, 180, 14, 1, '#00FFFF', 1.1);

    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
