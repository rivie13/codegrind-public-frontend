import { beforeEach, describe, expect, it } from 'vitest';
import { drawProfileCard } from './profileCardRenderer';
import { createMockCanvasContext } from '../../tests/helpers/mockCanvasContext';

describe('profileCardRenderer', () => {
  beforeEach(() => {
    global.Image = class MockImage {
      constructor() {
        this.crossOrigin = '';
        this.onload = null;
        this.onerror = null;
      }

      set src(value) {
        this._src = value;
        if (String(value).includes('fail')) {
          if (this.onerror) this.onerror(new Error('image failed'));
        } else if (this.onload) {
          this.onload();
        }
      }
    };
  });

  it('returns early when there is no user and not guest mode', () => {
    const ctx = createMockCanvasContext();

    drawProfileCard(ctx, 1200, 700, null, 0.2, { isGuest: false });

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('renders guest profile card with custom and default CTA text', () => {
    const ctx = createMockCanvasContext();

    drawProfileCard(ctx, 1200, 700, null, 0.8, {
      isGuest: true,
      guestLabel: 'GuestPilot',
      guestCta: 'Sign up now to save your progress forever.',
    });

    drawProfileCard(ctx, 1200, 700, null, 1.1, { isGuest: true });

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('GuestPilot'))).toBe(true);
    expect(labels.some((text) => text.includes('Sign up'))).toBe(true);
  });

  it('renders authenticated card and uses cached avatar on repeat draw', () => {
    const ctx = createMockCanvasContext();

    const user = {
      username: 'VeryLongUsernameForProfileCard',
      avatarUrl: 'https://example.com/avatar.png',
      progress: {
        xp: 640,
        level: 6,
        roleName: 'Debugger',
        xpIntoLevel: 30,
        xpToNextLevel: 90,
      },
    };

    drawProfileCard(ctx, 1200, 700, user, 1.3, {});
    drawProfileCard(ctx, 1200, 700, user, 1.7, {});

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('LV.6'))).toBe(true);
    expect(labels.some((text) => text.includes('30/90 XP'))).toBe(true);
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('falls back to xp-derived progress when progress summary is absent', () => {
    const ctx = createMockCanvasContext();

    drawProfileCard(
      ctx,
      1200,
      700,
      {
        username: 'FallbackUser',
        xp: 1000,
      },
      2.3,
      {}
    );

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('LV.'))).toBe(true);
    expect(labels.some((text) => text.includes('XP'))).toBe(true);
  });
});
