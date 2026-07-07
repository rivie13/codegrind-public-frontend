import { APARTMENT_CITY_ENTRY_STATE_HUB } from '../../utils/navigation/apartmentEntryState';
import {
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  LEGACY_INTERACTION_NAME_ALIASES,
  getGuestPreviewInteractionRestriction,
  normalizePreviewRouteSurface,
} from './maps/district01PreviewMapShared';
import { DISTRICT_01_PREVIEW_MAPS } from './maps/district01PreviewMapConfigs';

export {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  DISTRICT_01_PREVIEW_LOCATION_IDS,
} from './maps/district01PreviewMapShared';
export { DISTRICT_01_PREVIEW_MAPS } from './maps/district01PreviewMapConfigs';

export const getDistrict01PreviewMap = (locationId) => {
  if (typeof locationId !== 'string') {
    return DISTRICT_01_PREVIEW_MAPS[DISTRICT_01_PREVIEW_LOCATION_IDS.apartment];
  }

  return (
    DISTRICT_01_PREVIEW_MAPS[locationId] ||
    DISTRICT_01_PREVIEW_MAPS[DISTRICT_01_PREVIEW_LOCATION_IDS.apartment]
  );
};

export const getDistrict01PreviewInteraction = (locationId, interactionName) => {
  if (typeof interactionName !== 'string' || !interactionName.trim()) {
    return null;
  }

  const normalizedInteractionName =
    LEGACY_INTERACTION_NAME_ALIASES[interactionName] || interactionName;

  return getDistrict01PreviewMap(locationId).interactions[normalizedInteractionName] || null;
};

export const getDistrict01PreviewMapPoints = (locationId) =>
  getDistrict01PreviewMap(locationId).mapPoints || [];

export const getDistrict01PreviewInteractionAccess = ({
  apartmentEntryState = null,
  guestPhoneContext = null,
  interaction,
}) => {
  if (!interaction) {
    return {
      allowed: false,
      reason: 'missing-interaction',
      restrictionCode: null,
      routeSurface: null,
      selectedTrialTrack: null,
    };
  }

  if (typeof interaction.requiresApartmentEntryState === 'string') {
    return {
      allowed: apartmentEntryState === interaction.requiresApartmentEntryState,
      reason:
        apartmentEntryState === interaction.requiresApartmentEntryState ? null : 'apartment-state',
      restrictionCode: null,
      routeSurface: normalizePreviewRouteSurface(interaction.routeSurface),
      selectedTrialTrack: null,
    };
  }

  if (interaction.requiresHubState && apartmentEntryState !== APARTMENT_CITY_ENTRY_STATE_HUB) {
    return {
      allowed: false,
      reason: 'apartment-state',
      restrictionCode: null,
      routeSurface: normalizePreviewRouteSurface(interaction.routeSurface),
      selectedTrialTrack: null,
    };
  }

  const guestRestriction = getGuestPreviewInteractionRestriction({
    guestPhoneContext,
    interaction,
  });

  if (guestRestriction) {
    return {
      allowed: false,
      reason: 'guest-trial',
      restrictionCode: guestRestriction.code,
      routeSurface: guestRestriction.routeSurface,
      selectedTrialTrack: guestRestriction.selectedTrialTrack,
    };
  }

  return {
    allowed: true,
    reason: null,
    restrictionCode: null,
    routeSurface: normalizePreviewRouteSurface(interaction.routeSurface),
    selectedTrialTrack: null,
  };
};

export const canUseDistrict01PreviewInteraction = ({
  apartmentEntryState = null,
  guestPhoneContext = null,
  interaction,
}) =>
  getDistrict01PreviewInteractionAccess({
    apartmentEntryState,
    guestPhoneContext,
    interaction,
  }).allowed;
