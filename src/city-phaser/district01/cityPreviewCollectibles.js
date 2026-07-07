import { toAssetPath } from './loadExternalTiledMap';

const CITY_PREVIEW_LOCATION_TO_DISTRICT = Object.freeze({
  'apartment-room-01': {
    districtId: 'district-01',
    districtLabel: 'District 01',
  },
  'array-fixer-office-01': {
    districtId: 'district-01',
    districtLabel: 'District 01',
  },
  'exterior-seed': {
    districtId: 'district-01',
    districtLabel: 'District 01',
  },
  'learning-module-guide-01': {
    districtId: 'district-01',
    districtLabel: 'District 01',
  },
  'packet-bazaar-interior-01': {
    districtId: 'district-01',
    districtLabel: 'District 01',
  },
});

const COLLECTIBLE_FIELD_DISK_ASSET_PATH = toAssetPath(
  'city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Software_Internet_Download_Save_to_Disk.png'
);

const buildCollectibleFallbackDescription = (displayName) => {
  const resolvedName =
    typeof displayName === 'string' && displayName.trim()
      ? displayName.trim()
      : 'This recovered archive entry';

  return `${resolvedName} has been restored to the district archive. Full biographical notes are still being recovered.`;
};

const CITY_PREVIEW_COLLECTIBLES = Object.freeze([
  {
    assetPath: COLLECTIBLE_FIELD_DISK_ASSET_PATH,
    displayMaxWidth: 20,
    displayName: 'Ada',
    districtId: 'district-01',
    displayOffsetY: -4,
    floatOffsetY: 3,
    footerStatusLabel: 'Recovered portrait',
    id: 'district-01-ada',
    interactionName: 'DISTRICT_01_COLLECTABLE',
    locationId: 'exterior-seed',
    mapArtLayerNames: ['MiddleLayer'],
    phoneImagePath: toAssetPath('city-v2/tiled/Collectibles/Ada_Collectible_Pic.jpg'),
    phoneCategoryLabel: 'Recovered portrait',
    phoneDescription:
      "Ada Lovelace wrote the first published algorithm intended for Charles Babbage's Analytical Engine and recognized that a machine could manipulate symbols as well as numbers. Her notes helped define what programming could become long before modern computers existed.",
    phoneFooter:
      'English mathematician and early computing visionary, often regarded as the first computer programmer.',
    phoneImageAlt: 'Ada collectible portrait',
    shadowHeight: 6,
    shadowOffsetY: 14,
    shadowWidth: 18,
    storeSlug: 'city.collectible.district-01.ada.v1',
    textureKey: 'city-preview-collectible:district-01-ada',
  },
]);

const buildCityPreviewCollectiblePhoneRecord = (collectible) => ({
  categoryLabel: collectible.phoneCategoryLabel || 'Recovered collectible',
  description:
    collectible.phoneDescription || buildCollectibleFallbackDescription(collectible.displayName),
  displayName: collectible.displayName,
  footer: collectible.phoneFooter || null,
  id: collectible.id,
  imageAlt: collectible.phoneImageAlt || `${collectible.displayName} collectible portrait`,
  imageSrc: collectible.phoneImagePath || collectible.assetPath,
  storeSlug: collectible.storeSlug,
  title: collectible.phoneTitle || collectible.displayName,
});

export const CITY_PREVIEW_COLLECTIBLE_STORE_SLUGS = new Set(
  CITY_PREVIEW_COLLECTIBLES.map((collectible) => collectible.storeSlug)
);

export const getCityPreviewCollectibleById = (collectibleId) => {
  if (typeof collectibleId !== 'string' || !collectibleId.trim()) {
    return null;
  }

  return (
    CITY_PREVIEW_COLLECTIBLES.find((collectible) => collectible.id === collectibleId.trim()) || null
  );
};

export const getCityPreviewCollectibleByInteraction = (locationId, interactionName) => {
  if (typeof interactionName !== 'string' || !interactionName.trim()) {
    return null;
  }

  return (
    CITY_PREVIEW_COLLECTIBLES.find(
      (collectible) =>
        collectible.locationId === locationId && collectible.interactionName === interactionName
    ) || null
  );
};

export const getCityPreviewCollectibleFilesForLocation = (locationId) =>
  CITY_PREVIEW_COLLECTIBLES.filter((collectible) => collectible.locationId === locationId).map(
    (collectible) => ({
      key: collectible.textureKey,
      path: collectible.assetPath,
      type: 'image',
    })
  );

export const buildCityPreviewCollectibleSummary = ({ locationId, ownedSlugs = [] } = {}) => {
  const districtConfig = CITY_PREVIEW_LOCATION_TO_DISTRICT[locationId];
  if (!districtConfig) {
    return null;
  }

  const districtCollectibles = CITY_PREVIEW_COLLECTIBLES.filter(
    (collectible) => collectible.districtId === districtConfig.districtId
  );
  const ownedSlugSet = new Set(Array.isArray(ownedSlugs) ? ownedSlugs : []);
  const collectedCount = districtCollectibles.filter((collectible) =>
    ownedSlugSet.has(collectible.storeSlug)
  ).length;

  return {
    collectedCount,
    districtId: districtConfig.districtId,
    districtLabel: districtConfig.districtLabel,
    remainingCount: Math.max(districtCollectibles.length - collectedCount, 0),
    totalCount: districtCollectibles.length,
  };
};

export const buildCityPreviewCollectiblePhoneState = ({ locationId, ownedSlugs = [] } = {}) => {
  const summary = buildCityPreviewCollectibleSummary({ locationId, ownedSlugs });

  if (!summary) {
    return null;
  }

  const ownedSlugSet = new Set(Array.isArray(ownedSlugs) ? ownedSlugs : []);
  const districtCollectibles = CITY_PREVIEW_COLLECTIBLES.filter(
    (collectible) => collectible.districtId === summary.districtId
  );

  return {
    ...summary,
    ownedCollectibles: districtCollectibles
      .filter((collectible) => ownedSlugSet.has(collectible.storeSlug))
      .map(buildCityPreviewCollectiblePhoneRecord),
  };
};

export const formatCityPreviewCollectibleSummaryText = (summary) => {
  if (!summary || !Number.isFinite(summary.totalCount) || summary.totalCount <= 0) {
    return null;
  }

  return `${summary.districtLabel} Collectibles ${summary.collectedCount}/${summary.totalCount}`;
};

export { buildCollectibleFallbackDescription };
