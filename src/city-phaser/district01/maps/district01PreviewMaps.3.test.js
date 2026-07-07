import { describe, expect, it } from 'vitest';

import {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  canUseDistrict01PreviewInteraction,
  getDistrict01PreviewInteractionAccess,
  getDistrict01PreviewInteraction,
  getDistrict01PreviewMapPoints,
} from './district01PreviewMapsTestHelpers';

describe('district01PreviewMaps 3', () => {
  it('normalizes the police display to the PEC world scale and grounded origin', () => {
    const policeInteraction = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      'DISTRICT_01_LOCKDOWN_COP'
    );

    expect(policeInteraction?.display).toMatchObject({
      originY: 32 / 48,
      scale: 1.3,
      shadow: expect.objectContaining({
        width: 16,
      }),
    });
  });

  it('keeps the apartment exit hub-only while allowing the exterior apartment entrance', () => {
    const apartmentExit = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.apartment,
      'ApartmentExit'
    );
    const exteriorEntrance = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      'PLAYER_APARTMENT_BUILDING_ENTRANCE'
    );

    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'intro',
        interaction: apartmentExit,
      })
    ).toBe(false);
    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'hub',
        interaction: apartmentExit,
      })
    ).toBe(true);
    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'intro',
        interaction: exteriorEntrance,
      })
    ).toBe(true);
  });

  it('keeps the apartment terminal intro-only and hides it once hub state is active', () => {
    const apartmentTerminal = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.apartment,
      APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME
    );

    expect(apartmentTerminal).toMatchObject({
      desktopPrompt: 'Press E to interact',
      hideWhenUnavailable: true,
      kind: 'terminal',
      requiresApartmentEntryState: 'intro',
    });

    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'intro',
        interaction: apartmentTerminal,
      })
    ).toBe(true);
    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'hub',
        interaction: apartmentTerminal,
      })
    ).toBe(false);
  });

  it('blocks the opposite path building for guest trial while keeping the chosen route open', () => {
    const learningEntrance = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      'LEARNING_PATH_BUILDING_ENTRANCE'
    );
    const clusterEntrance = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      'CLUSTER_MAP_BUILDING_ENTRANCE'
    );

    expect(
      getDistrict01PreviewInteractionAccess({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: false,
          selectedTrialTrack: 'beginner',
        },
        interaction: learningEntrance,
      })
    ).toMatchObject({
      allowed: true,
      routeSurface: 'learning',
    });

    expect(
      getDistrict01PreviewInteractionAccess({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: false,
          selectedTrialTrack: 'beginner',
        },
        interaction: clusterEntrance,
      })
    ).toMatchObject({
      allowed: false,
      reason: 'guest-trial',
      restrictionCode: 'track-route-locked',
      routeSurface: 'clusters',
      selectedTrialTrack: 'beginner',
    });

    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: false,
          selectedTrialTrack: 'pro',
        },
        interaction: learningEntrance,
      })
    ).toBe(false);
  });

  it('keeps the Packet Bazaar locked for guests and bypasses the lock after sign-in', () => {
    const storeEntrance = getDistrict01PreviewInteraction(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      'DATA_PACKET_STORE_ENTRANCE'
    );

    expect(
      getDistrict01PreviewInteractionAccess({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: false,
          selectedTrialTrack: 'pro',
        },
        interaction: storeEntrance,
      })
    ).toMatchObject({
      allowed: false,
      reason: 'guest-trial',
      restrictionCode: 'store-signin-required',
      routeSurface: 'store',
    });

    expect(
      canUseDistrict01PreviewInteraction({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: true,
          selectedTrialTrack: 'beginner',
        },
        interaction: storeEntrance,
      })
    ).toBe(true);
  });

  it('defines authored map points for the apartment terminal and the district exterior POIs', () => {
    expect(getDistrict01PreviewMapPoints(DISTRICT_01_PREVIEW_LOCATION_IDS.apartment)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'safehouse-terminal',
          kind: 'objective',
          objectName: APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
        }),
      ])
    );

    expect(getDistrict01PreviewMapPoints(DISTRICT_01_PREVIEW_LOCATION_IDS.exterior)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'learning-path',
          targetPath: '/learning',
        }),
        expect.objectContaining({
          id: 'cluster-map',
          targetPath: '/games/clusters',
        }),
        expect.objectContaining({
          id: 'data-packet-store',
          targetPath: '/store',
        }),
      ])
    );
  });

  it('defines the exterior lockdown cop interaction with dialogue and a synthetic zone', () => {
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'DISTRICT_01_LOCKDOWN_COP'
      )
    ).toMatchObject({
      desktopPrompt: 'Press E to ask the officer about the lockdown',
      dialogue: {
        statusLabel: 'Checkpoint',
        title: 'District 01 Lockdown',
      },
      kind: 'dialogue',
      zone: {
        height: 24,
        width: 32,
        x: 470,
        y: 220,
      },
    });
  });
});
