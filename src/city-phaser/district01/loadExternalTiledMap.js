import getAssetUrl from '../../utils/assets/assetUrl';

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const TILE_FLIP_MASK = 0xe0000000;
const TILE_GID_BYTE_WIDTH = 4;
const MAX_TILESET_TEXTURE_DIMENSION = 8192;
const VITE_ENV = import.meta.env || {};
const TILED_ASSET_ALIAS_PREFIX = 'city-v2/tiled/';
const JSON_ASSET_CACHE = new Map();
const TEXT_ASSET_CACHE = new Map();
const TILED_MAP_CACHE = new Map();

const normalizeTargetAssetPath = (targetPath) => String(targetPath).replace(/^\/+/, '');

const normalizeExternalTiledProjectRootUrl = (value) =>
  typeof value === 'string' ? value.replace(/\/+$/, '') : '';

const EXTERNAL_TILED_PROJECT_ROOT_URL = normalizeExternalTiledProjectRootUrl(
  VITE_ENV.DEV ? VITE_ENV.VITE_TILED_PROJECT_ROOT_URL : ''
);

const getBaseAssetPath = () => toAssetPath('city-v2/tiled/maps/district-01/apartment-seed.tmj');

const resolveExternalTiledAssetPath = (normalizedTargetPath) => {
  if (!EXTERNAL_TILED_PROJECT_ROOT_URL) {
    return '';
  }

  if (!normalizedTargetPath.startsWith(TILED_ASSET_ALIAS_PREFIX)) {
    return '';
  }

  return `${EXTERNAL_TILED_PROJECT_ROOT_URL}/${normalizedTargetPath.slice(
    TILED_ASSET_ALIAS_PREFIX.length
  )}`;
};

const toAssetPath = (targetPath) => {
  const normalizedTargetPath = normalizeTargetAssetPath(targetPath);
  const externalTiledAssetPath = resolveExternalTiledAssetPath(normalizedTargetPath);

  if (externalTiledAssetPath) {
    return externalTiledAssetPath;
  }

  return getAssetUrl(`/${normalizedTargetPath}`);
};

const resolveAssetPath = (basePath, relativePath) => {
  const resolvedUrl = new URL(relativePath, new URL(basePath, window.location.origin));
  if (/^https?:\/\//i.test(basePath)) {
    return resolvedUrl.href;
  }
  return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
};

const loadCachedAsset = (cache, cacheKey, loader) => {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const pendingValue = loader().catch((error) => {
    cache.delete(cacheKey);
    throw error;
  });

  cache.set(cacheKey, pendingValue);
  return pendingValue;
};

const loadJson = async (assetPath) => {
  return loadCachedAsset(JSON_ASSET_CACHE, assetPath, async () => {
    const response = await fetch(assetPath);

    if (!response.ok) {
      throw new Error(`Unable to load JSON asset: ${assetPath}`);
    }

    return response.json();
  });
};

const loadText = async (assetPath) => {
  return loadCachedAsset(TEXT_ASSET_CACHE, assetPath, async () => {
    const response = await fetch(assetPath);

    if (!response.ok) {
      throw new Error(`Unable to load text asset: ${assetPath}`);
    }

    return response.text();
  });
};

const decodeBase64Bytes = (encodedValue) => {
  const binaryValue = atob(encodedValue);
  const bytes = new Uint8Array(binaryValue.length);

  for (let index = 0; index < binaryValue.length; index += 1) {
    bytes[index] = binaryValue.charCodeAt(index);
  }

  return bytes;
};

const decodeUint32TileData = (bytes) => {
  if (bytes.byteLength % TILE_GID_BYTE_WIDTH !== 0) {
    throw new Error('Encoded Tiled layer data length was not aligned to 32-bit gids.');
  }

  const tileData = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let offset = 0; offset < bytes.byteLength; offset += TILE_GID_BYTE_WIDTH) {
    tileData.push(view.getUint32(offset, true));
  }

  return tileData;
};

const inflateZlibBytes = async (compressedBytes) => {
  if (typeof DecompressionStream !== 'function') {
    throw new Error(
      'Unable to decode compressed Tiled layer data: DecompressionStream is unavailable.'
    );
  }

  const compressedStream = new Response(compressedBytes).body;

  if (!compressedStream) {
    throw new Error('Unable to decode compressed Tiled layer data: input stream was unavailable.');
  }

  const decompressedStream = compressedStream.pipeThrough(new DecompressionStream('deflate'));
  const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();

  return new Uint8Array(decompressedBuffer);
};

const decodeEncodedTileData = async ({ compression, data, encoding }) => {
  if (encoding !== 'base64' || typeof data !== 'string') {
    return data;
  }

  const encodedBytes = decodeBase64Bytes(data);

  if (!compression) {
    return decodeUint32TileData(encodedBytes);
  }

  if (compression !== 'zlib') {
    throw new Error(`Unsupported Tiled layer compression: ${compression}`);
  }

  return decodeUint32TileData(await inflateZlibBytes(encodedBytes));
};

const normalizeTileLayer = async (layer) => {
  const nestedLayers = Array.isArray(layer?.layers)
    ? await Promise.all(layer.layers.map((nestedLayer) => normalizeTileLayer(nestedLayer)))
    : layer?.layers;

  if (layer?.type !== 'tilelayer') {
    return nestedLayers ? { ...layer, layers: nestedLayers } : layer;
  }

  const { compression, data, encoding, ...restLayer } = layer;
  const normalizedLayer = nestedLayers ? { ...restLayer, layers: nestedLayers } : restLayer;

  if (Array.isArray(data)) {
    return {
      ...normalizedLayer,
      data,
    };
  }

  if (typeof data === 'string' && encoding === 'base64') {
    return {
      ...normalizedLayer,
      data: await decodeEncodedTileData({ compression, data, encoding }),
    };
  }

  return {
    ...normalizedLayer,
    ...(typeof data === 'undefined' ? {} : { data }),
    ...(compression ? { compression } : {}),
    ...(encoding ? { encoding } : {}),
  };
};

const normalizeTileLayers = async (layers = []) =>
  Promise.all(layers.map((layer) => normalizeTileLayer(layer)));

const getDirectChildrenByTagName = (element, tagName) =>
  Array.from(element.children).filter((child) => child.tagName === tagName);

const getNumberAttribute = (element, attributeName, fallback = 0) => {
  const rawValue = element.getAttribute(attributeName);
  if (rawValue === null || rawValue === '') return fallback;

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const parseTsxTileset = (tsxText, tilesetPath) => {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(tsxText, 'application/xml');
  const parserError = documentNode.querySelector('parsererror');

  if (parserError) {
    throw new Error(`Unable to parse TSX tileset: ${tilesetPath}`);
  }

  const tilesetElement = documentNode.documentElement;
  const imageElement = getDirectChildrenByTagName(tilesetElement, 'image')[0];
  const tileElements = getDirectChildrenByTagName(tilesetElement, 'tile');
  const gridElement = getDirectChildrenByTagName(tilesetElement, 'grid')[0];
  const tileOffsetElement = getDirectChildrenByTagName(tilesetElement, 'tileoffset')[0];

  return {
    columns: getNumberAttribute(tilesetElement, 'columns', 0),
    grid: gridElement
      ? {
          height: getNumberAttribute(gridElement, 'height', 1),
          orientation: gridElement.getAttribute('orientation') || 'orthogonal',
          width: getNumberAttribute(gridElement, 'width', 1),
        }
      : undefined,
    image: imageElement
      ? resolveAssetPath(tilesetPath, imageElement.getAttribute('source'))
      : undefined,
    imageheight: imageElement ? getNumberAttribute(imageElement, 'height', 0) : undefined,
    imagewidth: imageElement ? getNumberAttribute(imageElement, 'width', 0) : undefined,
    margin: getNumberAttribute(tilesetElement, 'margin', 0),
    name: tilesetElement.getAttribute('name') || 'external-tileset',
    spacing: getNumberAttribute(tilesetElement, 'spacing', 0),
    tilecount: getNumberAttribute(tilesetElement, 'tilecount', tileElements.length),
    tiledversion: tilesetElement.getAttribute('tiledversion') || '1.12.1',
    tileheight: getNumberAttribute(tilesetElement, 'tileheight', 16),
    tileoffset: tileOffsetElement
      ? {
          x: getNumberAttribute(tileOffsetElement, 'x', 0),
          y: getNumberAttribute(tileOffsetElement, 'y', 0),
        }
      : undefined,
    tiles: tileElements.map((tileElement) => {
      const tileImageElement = getDirectChildrenByTagName(tileElement, 'image')[0];
      const animationElement = getDirectChildrenByTagName(tileElement, 'animation')[0];

      return {
        animation: animationElement
          ? getDirectChildrenByTagName(animationElement, 'frame').map((frameElement) => ({
              duration: getNumberAttribute(frameElement, 'duration', 100),
              tileid: getNumberAttribute(frameElement, 'tileid', 0),
            }))
          : undefined,
        id: getNumberAttribute(tileElement, 'id', 0),
        image: tileImageElement
          ? resolveAssetPath(tilesetPath, tileImageElement.getAttribute('source'))
          : undefined,
        imageheight: tileImageElement
          ? getNumberAttribute(tileImageElement, 'height', 0)
          : undefined,
        imagewidth: tileImageElement ? getNumberAttribute(tileImageElement, 'width', 0) : undefined,
      };
    }),
    tilewidth: getNumberAttribute(tilesetElement, 'tilewidth', 16),
    type: 'tileset',
    version: tilesetElement.getAttribute('version') || '1.10',
  };
};

const normalizeTilesetAssetPaths = (tileset, tilesetPath) => ({
  ...tileset,
  image: tileset.image ? resolveAssetPath(tilesetPath, tileset.image) : tileset.image,
  tiles: Array.isArray(tileset.tiles)
    ? tileset.tiles.map((tile) => ({
        ...tile,
        image: tile.image ? resolveAssetPath(tilesetPath, tile.image) : tile.image,
      }))
    : tileset.tiles,
});

const stripTileFlags = (gid) => gid & ~TILE_FLIP_MASK;

const sortTilesetsByFirstGid = (tilesets = []) =>
  [...tilesets].sort((left, right) => (left?.firstgid || 0) - (right?.firstgid || 0));

/**
 * Returns the tilesets sorted by firstgid ascending.
 * Call this once per render pass and reuse the result to avoid re-sorting
 * on every tile lookup when iterating large layer data arrays.
 */
export const getSortedTilesets = (mapData) => sortTilesetsByFirstGid(mapData?.tilesets);

const collectUsedTileGids = (layers = []) => {
  const usedGids = new Set();

  const visitLayer = (layer) => {
    if (layer.type === 'tilelayer' && Array.isArray(layer.data)) {
      layer.data.forEach((gid) => {
        const normalizedGid = stripTileFlags(gid >>> 0);
        if (normalizedGid > 0) {
          usedGids.add(normalizedGid);
        }
      });
    }

    if (layer.type === 'objectgroup' && Array.isArray(layer.objects)) {
      layer.objects.forEach((objectValue) => {
        if (typeof objectValue.gid === 'number' && objectValue.gid > 0) {
          usedGids.add(stripTileFlags(objectValue.gid >>> 0));
        }
      });
    }

    if (Array.isArray(layer.layers)) {
      layer.layers.forEach(visitLayer);
    }
  };

  layers.forEach(visitLayer);
  return usedGids;
};

const filterUnusedTilesetReferences = (mapData, tilesetReferences, usedGids) => {
  if (!usedGids.size) {
    return tilesetReferences;
  }

  return tilesetReferences.filter((ref, index) => {
    const source = ref.source || '';
    const name = ref.name || '';
    if (
      source.includes('Dusk_City_Background') ||
      source.includes('dusk-city') ||
      name.includes('Dusk_City_Background') ||
      name.includes('dusk-city')
    ) {
      return true;
    }

    if (isOversizedTileset(ref)) {
      return true;
    }

    const currentFirstGid = ref.firstgid || 0;
    const nextFirstGid = tilesetReferences[index + 1]?.firstgid ?? Number.POSITIVE_INFINITY;

    for (const gid of usedGids) {
      if (gid >= currentFirstGid && gid < nextFirstGid) {
        return true;
      }
    }

    return false;
  });
};

const filterUnusedTilesets = (mapData, tilesets) => {
  const usedGids = collectUsedTileGids(mapData.layers);
  return filterUnusedTilesetReferences(mapData, tilesets, usedGids);
};

const loadExternalTileset = async (tilesetReference, mapPath) => {
  if (!tilesetReference.source) {
    return tilesetReference;
  }

  const tilesetPath = resolveAssetPath(mapPath, tilesetReference.source);
  const rawTileset = tilesetPath.endsWith('.tsj')
    ? await loadJson(tilesetPath)
    : parseTsxTileset(await loadText(tilesetPath), tilesetPath);

  return {
    ...normalizeTilesetAssetPaths(rawTileset, tilesetPath),
    firstgid: tilesetReference.firstgid,
  };
};

export const clearExternalTiledMapCache = () => {
  JSON_ASSET_CACHE.clear();
  TEXT_ASSET_CACHE.clear();
  TILED_MAP_CACHE.clear();
};

export const loadExternalTiledMap = async (mapPath = getBaseAssetPath()) => {
  return loadCachedAsset(TILED_MAP_CACHE, mapPath, async () => {
    const mapData = await loadJson(mapPath);
    const normalizedLayers = await normalizeTileLayers(mapData.layers || []);
    const usedGids = collectUsedTileGids(normalizedLayers);
    const filteredReferences = filterUnusedTilesetReferences(
      mapData,
      mapData.tilesets || [],
      usedGids
    );
    const inlinedTilesets = await Promise.all(
      filteredReferences.map((tilesetReference) => loadExternalTileset(tilesetReference, mapPath))
    );

    const normalizedMapData = {
      ...mapData,
      layers: normalizedLayers,
    };

    return {
      ...normalizedMapData,
      tilesets: inlinedTilesets,
    };
  });
};

export const decodeTileGid = (rawGid = 0) => {
  const normalizedValue = rawGid >>> 0;

  return {
    flipDiagonal: Boolean(normalizedValue & FLIPPED_DIAGONALLY_FLAG),
    flipX: Boolean(normalizedValue & FLIPPED_HORIZONTALLY_FLAG),
    flipY: Boolean(normalizedValue & FLIPPED_VERTICALLY_FLAG),
    gid: stripTileFlags(normalizedValue),
  };
};

export const isCollectionTileset = (tileset) => Array.isArray(tileset?.tiles) && !tileset?.image;

export const isOversizedTileset = (tileset) =>
  Boolean(tileset?.image) &&
  ((tileset?.imagewidth || 0) > MAX_TILESET_TEXTURE_DIMENSION ||
    (tileset?.imageheight || 0) > MAX_TILESET_TEXTURE_DIMENSION);

const isRenderableSheetTileset = (tileset) =>
  Boolean(tileset?.image) && !isOversizedTileset(tileset);

export const getTilesetDrawingOffset = (tileset) => ({
  x: Number(tileset?.tileoffset?.x) || 0,
  y: Number(tileset?.tileoffset?.y) || 0,
});

export const shouldManuallyRenderSheetTileset = (mapData, tileset) => {
  if (!isRenderableSheetTileset(tileset)) {
    return false;
  }

  const drawingOffset = getTilesetDrawingOffset(tileset);
  const mapTileWidth = Number(mapData?.tilewidth) || 0;
  const mapTileHeight = Number(mapData?.tileheight) || 0;

  return (
    ((Number(tileset?.tilewidth) || 0) > mapTileWidth && mapTileWidth > 0) ||
    ((Number(tileset?.tileheight) || 0) > mapTileHeight && mapTileHeight > 0) ||
    drawingOffset.x !== 0 ||
    drawingOffset.y !== 0
  );
};

export const shouldManuallyRenderTileset = (mapData, tileset) =>
  isCollectionTileset(tileset) ||
  isOversizedTileset(tileset) ||
  shouldManuallyRenderSheetTileset(mapData, tileset);

export const getTilesetForGid = (mapData, gid, sortedTilesets) => {
  if (!gid) {
    return null;
  }

  const tilesets = sortedTilesets ?? sortTilesetsByFirstGid(mapData?.tilesets);

  for (let index = tilesets.length - 1; index >= 0; index -= 1) {
    const tileset = tilesets[index];
    if (gid >= (tileset?.firstgid || 0)) {
      return tileset;
    }
  }

  return null;
};

export const getTileByLocalId = (tileset, localTileId) =>
  Array.isArray(tileset?.tiles)
    ? tileset.tiles.find((tile) => tile.id === localTileId) || null
    : null;

export const getSheetTilesetAssets = (mapData) => {
  const seenKeys = new Set();

  return (mapData.tilesets || [])
    .filter((tileset) => Boolean(tileset?.name) && isRenderableSheetTileset(tileset))
    .filter((tileset) => {
      if (seenKeys.has(tileset.name)) {
        return false;
      }

      seenKeys.add(tileset.name);
      return true;
    })
    .map((tileset) => ({
      key: tileset.name,
      path: tileset.image,
    }));
};

export const getAutoLayerTilesetAssets = (mapData) =>
  getSheetTilesetAssets(mapData).filter(({ key }) => {
    const tileset = (mapData?.tilesets || []).find((candidate) => candidate?.name === key);
    return !shouldManuallyRenderSheetTileset(mapData, tileset);
  });

export const getOversizedTilesets = (mapData) =>
  (mapData?.tilesets || []).filter((tileset) => isOversizedTileset(tileset));

export { toAssetPath };
