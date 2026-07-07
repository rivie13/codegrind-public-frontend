import { describe, expect, it } from 'vitest';
import { drawVariantChip, getVariantIndex } from './chipVariants';
import { createMockCanvasContext } from '../../tests/helpers/mockCanvasContext';

describe('chipVariants', () => {
  it('maps cluster ids to deterministic variant indexes', () => {
    expect(getVariantIndex({ id: 'arrays-hashing' })).toBe(
      getVariantIndex({ id: 'arrays-hashing' })
    );
    expect(getVariantIndex({ id: 'binary-search' })).toBeGreaterThanOrEqual(0);
    expect(getVariantIndex({ id: 'binary-search' })).toBeLessThan(6);
    expect(getVariantIndex({})).toBe(0);
  });

  it('renders all chip variants in active state', () => {
    const ctx = createMockCanvasContext();

    for (let variant = 0; variant < 6; variant += 1) {
      drawVariantChip(
        ctx,
        20 + variant * 4,
        20 + variant * 3,
        80,
        '#00FF8C',
        'active',
        1.6,
        `CL-${variant}`,
        variant
      );
    }

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('renders completion and lock overlays with option flags', () => {
    const ctx = createMockCanvasContext();

    drawVariantChip(ctx, 40, 40, 80, '#00CCFF', 'complete', 0.4, 'DONE', 5, {
      skipInterior: true,
    });
    drawVariantChip(ctx, 140, 40, 80, '#00CCFF', 'locked', 0.4, 'LOCKED', 4, {
      skipLabel: true,
    });
    drawVariantChip(ctx, 240, 40, 80, '#00CCFF', 'available', 0.4, 'READY', 0);

    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
