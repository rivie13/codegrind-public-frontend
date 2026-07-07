import { describe, expect, it } from 'vitest';

import { shouldHydrateRoot } from './rootRenderMode';

describe('shouldHydrateRoot', () => {
  it('client-renders the homepage even when prerendered markup exists', () => {
    expect(
      shouldHydrateRoot({
        hasPrerenderedMarkup: true,
        pathname: '/',
      })
    ).toBe(false);
  });

  it('hydrates prerendered informational routes', () => {
    expect(
      shouldHydrateRoot({
        hasPrerenderedMarkup: true,
        pathname: '/faq',
      })
    ).toBe(true);
  });

  it('client-renders the standalone city boot route', () => {
    expect(
      shouldHydrateRoot({
        hasPrerenderedMarkup: true,
        pathname: '/city',
      })
    ).toBe(false);

    expect(
      shouldHydrateRoot({
        hasPrerenderedMarkup: true,
        pathname: '/city/phaser-preview',
      })
    ).toBe(false);
  });

  it('falls back to client rendering when there is no prerendered markup', () => {
    expect(
      shouldHydrateRoot({
        hasPrerenderedMarkup: false,
        pathname: '/faq',
      })
    ).toBe(false);
  });
});
