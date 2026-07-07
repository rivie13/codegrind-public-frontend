/**
 * Shared avatar asset resolution for city scenes.
 *
 * Consolidates the `resolveAvatarAsset` and `getAvatarCandidates` functions
 * that were previously duplicated in CityScene.jsx, CityTravelTransition.jsx,
 * and CityMap.jsx.
 */

import { DISTRICT_01_AVATAR_ASSETS } from '../../data/cityMap';
import getAssetUrl from '../assets/assetUrl';

const IDLE_DIRECTION_FALLBACKS = {
  northeast: ['east', 'north'],
  northwest: ['west', 'north'],
  southeast: ['east', 'south'],
  southwest: ['west', 'south'],
};

/**
 * Resolves the correct avatar sprite asset for the given state and direction.
 *
 * Tries the exact direction first, then falls back through diagonal-to-cardinal
 * mappings, and finally defaults to the "south" direction.
 *
 * @param {string} avatarState - The animation state (e.g. "idle", "walk")
 * @param {string} avatarDirection - The facing direction (e.g. "south", "northeast")
 * @returns {object|null} The avatar asset descriptor or null
 */
export const resolveAvatarAsset = (avatarState, avatarDirection) => {
  const stateAssets = DISTRICT_01_AVATAR_ASSETS?.[avatarState] || {};

  if (stateAssets[avatarDirection]) {
    return stateAssets[avatarDirection];
  }

  const fallbackDirections = IDLE_DIRECTION_FALLBACKS[avatarDirection] || [];

  for (const fallbackDirection of fallbackDirections) {
    if (stateAssets[fallbackDirection]) {
      return stateAssets[fallbackDirection];
    }
  }

  return stateAssets.south || null;
};

/**
 * Builds an ordered list of image source URLs for the given avatar asset,
 * with the primary CDN source first and the fallback second.
 *
 * @param {object|null} avatarAsset - The asset descriptor from resolveAvatarAsset
 * @returns {string[]} Array of image URLs (may be empty)
 */
export const getAvatarCandidates = (avatarAsset) => {
  if (!avatarAsset?.assetPath) return [];

  const primarySrc = getAssetUrl(avatarAsset.assetPath);
  const fallbackSrc = avatarAsset.fallbackSrc;
  if (!fallbackSrc || fallbackSrc === primarySrc) {
    return [primarySrc];
  }

  return [primarySrc, fallbackSrc];
};
