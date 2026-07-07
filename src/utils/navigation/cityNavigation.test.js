import { describe, expect, it } from 'vitest';

import {
  buildCityReturnState,
  getCityReturnHref,
  isCityRoute,
  shouldOfferCityReturn,
  shouldRenderSiteNavigation,
} from './cityNavigation';

describe('isCityRoute', () => {
  it('matches city roots and nested city paths', () => {
    expect(isCityRoute('/city')).toBe(true);
    expect(isCityRoute('/city/phaser-preview')).toBe(true);
  });

  it('rejects non-city paths', () => {
    expect(isCityRoute('/games')).toBe(false);
    expect(isCityRoute('/profile')).toBe(false);
  });
});

describe('shouldRenderSiteNavigation', () => {
  it('hides the navbar while a city route is active', () => {
    expect(
      shouldRenderSiteNavigation({
        pathname: '/city',
        isGlobalShellVisible: true,
      })
    ).toBe(false);
  });

  it('hides the navbar for nested city preview routes too', () => {
    expect(
      shouldRenderSiteNavigation({
        pathname: '/city/phaser-preview',
        isGlobalShellVisible: true,
      })
    ).toBe(false);
  });

  it('renders the navbar on non-city routes when the shell is visible', () => {
    expect(
      shouldRenderSiteNavigation({
        pathname: '/games',
        isGlobalShellVisible: true,
      })
    ).toBe(true);
  });

  it('stays hidden when the wider global shell is already hidden', () => {
    expect(
      shouldRenderSiteNavigation({
        pathname: '/learning',
        isGlobalShellVisible: false,
      })
    ).toBe(false);
  });
});

describe('city return helpers', () => {
  it('builds a normalized city return state', () => {
    expect(
      buildCityReturnState({
        pathname: '/city',
        search: 'scene=apartment-room-01',
      })
    ).toEqual({
      pathname: '/city',
      search: '?scene=apartment-room-01',
    });
  });

  it('returns the default city href when no return state exists', () => {
    expect(getCityReturnHref(null)).toBe('/city');
  });

  it('offers city return from supported site surfaces', () => {
    expect(shouldOfferCityReturn('/games')).toBe(true);
    expect(shouldOfferCityReturn('/store')).toBe(true);
    expect(shouldOfferCityReturn('/city')).toBe(false);
  });
});
