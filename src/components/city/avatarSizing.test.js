import { describe, expect, it } from 'vitest';
import { getAvatarWidth } from './avatarSizing';

describe('getAvatarWidth', () => {
  it('returns viewport-fallback clamp widths when no stage size is available', () => {
    expect(getAvatarWidth(1.2)).toBe('clamp(352px, 55.44vmin, 592px)');
    expect(getAvatarWidth(1.15)).toBe('clamp(337px, 53.13vmin, 567px)');
  });

  it('applies mobile scene boosts on narrow mobile layouts without changing desktop widths', () => {
    expect(getAvatarWidth(1.2, { width: 1280, height: 720 })).toBe('363px');
    expect(
      getAvatarWidth(1.2, { width: 393, height: 852 }, { isMobileViewport: true, mobileBoost: 1.2 })
    ).toBe('226px');
    expect(
      getAvatarWidth(
        0.9,
        { width: 393, height: 852 },
        { isMobileViewport: true, mobileBoost: 1.15 }
      )
    ).toBe('163px');
  });

  it('adds another 20 percent on top of the mobile boost when touch controls are visible', () => {
    expect(
      getAvatarWidth(
        1.2,
        { width: 393, height: 852 },
        { isMobileViewport: true, mobileBoost: 1.512 }
      )
    ).toBe('285px');
  });

  it('keeps the mobile boost on wide fullscreen phone stages', () => {
    expect(getAvatarWidth(1.2, { width: 1180, height: 430 })).toBe('217px');
    expect(
      getAvatarWidth(
        1.2,
        { width: 1180, height: 430 },
        { isMobileViewport: true, mobileBoost: 1.2 }
      )
    ).toBe('260px');
  });

  it('falls back to the default scale when the provided scale is invalid', () => {
    expect(getAvatarWidth(0)).toBe('clamp(293px, 46.2vmin, 493px)');
    expect(getAvatarWidth(Number.NaN)).toBe('clamp(293px, 46.2vmin, 493px)');
  });
});
