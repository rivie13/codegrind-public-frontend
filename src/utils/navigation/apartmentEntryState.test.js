import { describe, expect, it } from 'vitest';

import {
  APARTMENT_HUB_SHELL_ID,
  APARTMENT_INTRO_SHELL_ID,
  APARTMENT_INTRO_PHONE_SHELL_ID,
  PATH_CHOICE_CITY_ENTRY,
  WORLD_PHONE_SHELL_ID,
  resolveApartmentCityEntryState,
  resolveApartmentShellId,
  shouldPlayApartmentIntroSequence,
  shouldAutoOpenApartmentHub,
} from './apartmentEntryState';

describe('apartmentEntryState', () => {
  it('resolves the apartment shell to the hub after demo completion and path choice', () => {
    expect(
      resolveApartmentShellId({
        hasCompletedDemo: true,
        hasChosenPath: true,
      })
    ).toBe(APARTMENT_HUB_SHELL_ID);
  });

  it('keeps the intro shell when the shared home demo is not complete', () => {
    expect(
      resolveApartmentShellId({
        hasCompletedDemo: false,
        hasChosenPath: true,
      })
    ).toBe(APARTMENT_INTRO_SHELL_ID);
  });

  it('routes phone-class users into the world phone shell after the intro checkpoint', () => {
    expect(
      resolveApartmentShellId({
        deviceClass: 'phone',
        hasCompletedDemo: true,
        hasChosenPath: true,
      })
    ).toBe(WORLD_PHONE_SHELL_ID);
  });

  it('keeps phone-class users in the intro phone shell before the intro checkpoint', () => {
    expect(
      resolveApartmentShellId({
        deviceClass: 'phone',
        hasCompletedDemo: false,
        hasChosenPath: true,
      })
    ).toBe(APARTMENT_INTRO_PHONE_SHELL_ID);
  });

  it('respects an explicit hub apartment state even before stored demo progress exists', () => {
    expect(
      resolveApartmentCityEntryState({
        apartmentState: 'hub',
        hasCompletedDemo: false,
        hasChosenPath: false,
      })
    ).toBe('hub');

    expect(
      shouldPlayApartmentIntroSequence({
        apartmentState: 'hub',
        hasCompletedDemo: false,
        hasChosenPath: false,
      })
    ).toBe(false);
  });

  it('uses a persisted hub checkpoint when no explicit apartment state is provided', () => {
    expect(
      resolveApartmentCityEntryState({
        persistedApartmentState: 'hub',
        hasCompletedDemo: false,
        hasChosenPath: false,
      })
    ).toBe('hub');
  });

  it('keeps the intro gate only for intro entry state', () => {
    expect(
      shouldPlayApartmentIntroSequence({
        apartmentState: 'intro',
        hasCompletedDemo: true,
        hasChosenPath: true,
      })
    ).toBe(true);
  });

  it('only auto-opens the apartment hub on the path-choice handoff', () => {
    expect(
      shouldAutoOpenApartmentHub({
        sceneId: 'apartment-room-01',
        entry: PATH_CHOICE_CITY_ENTRY,
        hasCompletedDemo: true,
        hasChosenPath: true,
      })
    ).toBe(true);

    expect(
      shouldAutoOpenApartmentHub({
        sceneId: 'apartment-room-01',
        entry: 'manual-return',
        hasCompletedDemo: true,
        hasChosenPath: true,
      })
    ).toBe(false);
  });
});
