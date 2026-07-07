import { deflateSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearExternalTiledMapCache,
  getAutoLayerTilesetAssets,
  getSheetTilesetAssets,
  loadExternalTiledMap,
  shouldManuallyRenderSheetTileset,
  toAssetPath,
} from './loadExternalTiledMap';

const loadTiledAssetHelper = async ({
  dev = true,
  tiledProjectRootUrl = '',
  assetBaseUrl = '',
} = {}) => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('DEV', dev ? 'true' : '');
  vi.stubEnv('PROD', dev ? '' : 'true');
  vi.stubEnv('VITE_TILED_PROJECT_ROOT_URL', tiledProjectRootUrl);
  vi.stubEnv('VITE_ASSET_BASE_URL', assetBaseUrl);

  return import('./loadExternalTiledMap');
};

const encodeCompressedTileLayerData = (gids) => {
  const rawTileData = Buffer.alloc(gids.length * 4);

  gids.forEach((gid, index) => {
    rawTileData.writeUInt32LE(gid >>> 0, index * 4);
  });

  return deflateSync(rawTileData).toString('base64');
};

afterEach(() => {
  clearExternalTiledMapCache();
  vi.restoreAllMocks();
});

describe('loadExternalTiledMap', () => {
  it('decodes base64+zlib tile layers before filtering used tilesets', async () => {
    const mapPath = '/city-v2/tiled/maps/district-01/compressed-room.tmj';
    const responsesByPath = {
      [mapPath]: {
        height: 2,
        layers: [
          {
            compression: 'zlib',
            data: encodeCompressedTileLayerData([0, 2, 0, 0]),
            encoding: 'base64',
            height: 2,
            name: 'Floor',
            type: 'tilelayer',
            visible: true,
            width: 2,
          },
        ],
        tileheight: 16,
        tilesets: [
          {
            firstgid: 1,
            source: 'ground.tsj',
          },
          {
            firstgid: 2,
            source: 'props.tsj',
          },
        ],
        tilewidth: 16,
        width: 2,
      },
      '/city-v2/tiled/maps/district-01/ground.tsj': {
        columns: 1,
        image: 'ground.png',
        imageheight: 16,
        imagewidth: 16,
        name: 'ground',
        tilecount: 1,
        tileheight: 16,
        tilewidth: 16,
        type: 'tileset',
      },
      '/city-v2/tiled/maps/district-01/props.tsj': {
        columns: 1,
        image: 'props.png',
        imageheight: 16,
        imagewidth: 16,
        name: 'props',
        tilecount: 1,
        tileheight: 16,
        tilewidth: 16,
        type: 'tileset',
      },
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (assetPath) => {
      const responseBody = responsesByPath[String(assetPath)];

      if (!responseBody) {
        return new Response('', { status: 404 });
      }

      return new Response(JSON.stringify(responseBody), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    });

    const mapData = await loadExternalTiledMap(mapPath);

    expect(mapData.layers[0].data).toEqual([0, 2, 0, 0]);
    expect(mapData.layers[0]).not.toHaveProperty('compression');
    expect(mapData.layers[0]).not.toHaveProperty('encoding');
    expect(mapData.tilesets).toEqual([
      expect.objectContaining({
        firstgid: 2,
        image: '/city-v2/tiled/maps/district-01/props.png',
        name: 'props',
      }),
    ]);
  });

  it('loads external XML tilesets from the dev asset route', async () => {
    const mapPath = '/__external_tiled__/maps/district-01/apartment-seed.tmj';
    const tilesetPath = '/__external_tiled__/maps/district-01/d01-16_x_16_cyberpunk_icons.tsx';
    const tilesetImagePath =
      '/__external_tiled__/icons_trash_other_env_decorations_for_interior/Cyberpunk%20icon%20pack.png';
    const responsesByPath = {
      [mapPath]: {
        height: 1,
        layers: [
          {
            data: [1],
            height: 1,
            name: 'Floor',
            type: 'tilelayer',
            visible: true,
            width: 1,
          },
        ],
        tileheight: 16,
        tilesets: [
          {
            firstgid: 1,
            source: 'd01-16_x_16_cyberpunk_icons.tsx',
          },
        ],
        tilewidth: 16,
        width: 1,
      },
      [tilesetPath]: `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.12.1" name="16_x_16_cyberpunk_icons" tilewidth="16" tileheight="16" tilecount="40" columns="40">
 <image source="../../icons_trash_other_env_decorations_for_interior/Cyberpunk icon pack.png" width="640" height="16"/>
</tileset>`,
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (assetPath) => {
      const responseBody = responsesByPath[String(assetPath)];

      if (!responseBody) {
        return new Response('', { status: 404 });
      }

      return typeof responseBody === 'string'
        ? new Response(responseBody, {
            headers: { 'Content-Type': 'application/xml' },
            status: 200,
          })
        : new Response(JSON.stringify(responseBody), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          });
    });

    const mapData = await loadExternalTiledMap(mapPath);

    expect(globalThis.fetch).toHaveBeenCalledWith(tilesetPath);
    expect(mapData.tilesets).toEqual([
      expect.objectContaining({
        firstgid: 1,
        image: tilesetImagePath,
        name: '16_x_16_cyberpunk_icons',
      }),
    ]);
  });

  it('preserves oversized tilesets even when layer gids do not reference them directly', async () => {
    const mapPath = '/city-v2/tiled/maps/district-01/apartment-seed.tmj';
    const responsesByPath = {
      [mapPath]: {
        height: 1,
        layers: [
          {
            data: [1],
            height: 1,
            name: 'Floor',
            type: 'tilelayer',
            visible: true,
            width: 1,
          },
        ],
        tileheight: 16,
        tilesets: [
          {
            firstgid: 1,
            source: 'ground.tsj',
          },
          {
            firstgid: 2,
            source: 'Dusk_City_Background.tsj',
          },
        ],
        tilewidth: 16,
        width: 1,
      },
      '/city-v2/tiled/maps/district-01/ground.tsj': {
        columns: 1,
        image: 'ground.png',
        imageheight: 16,
        imagewidth: 16,
        name: 'ground',
        tilecount: 1,
        tileheight: 16,
        tilewidth: 16,
        type: 'tileset',
      },
      '/city-v2/tiled/maps/district-01/Dusk_City_Background.tsj': {
        columns: 81,
        image: '../../backgrounds_loadingScreens/Dusk_City_Background.png',
        imageheight: 229,
        imagewidth: 38070,
        name: 'Dusk_City_Background',
        tilecount: 81,
        tileheight: 229,
        tilewidth: 470,
        type: 'tileset',
      },
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (assetPath) => {
      const responseBody = responsesByPath[String(assetPath)];

      if (!responseBody) {
        return new Response('', { status: 404 });
      }

      return new Response(JSON.stringify(responseBody), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    });

    const mapData = await loadExternalTiledMap(mapPath);

    expect(mapData.tilesets).toEqual([
      expect.objectContaining({
        firstgid: 1,
        name: 'ground',
      }),
      expect.objectContaining({
        firstgid: 2,
        image: '/city-v2/tiled/backgrounds_loadingScreens/Dusk_City_Background.png',
        name: 'Dusk_City_Background',
      }),
    ]);
  });

  it('reuses the normalized map result for repeated loads of the same path', async () => {
    const mapPath = '/city-v2/tiled/maps/district-01/reused-room.tmj';
    const responsesByPath = {
      [mapPath]: {
        height: 1,
        layers: [
          {
            data: [1],
            height: 1,
            name: 'Floor',
            type: 'tilelayer',
            visible: true,
            width: 1,
          },
        ],
        tileheight: 16,
        tilesets: [
          {
            firstgid: 1,
            source: 'ground.tsj',
          },
        ],
        tilewidth: 16,
        width: 1,
      },
      '/city-v2/tiled/maps/district-01/ground.tsj': {
        columns: 1,
        image: 'ground.png',
        imageheight: 16,
        imagewidth: 16,
        name: 'ground',
        tilecount: 1,
        tileheight: 16,
        tilewidth: 16,
        type: 'tileset',
      },
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (assetPath) => {
      const responseBody = responsesByPath[String(assetPath)];

      if (!responseBody) {
        return new Response('', { status: 404 });
      }

      return new Response(JSON.stringify(responseBody), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    });

    const [firstMap, secondMap] = await Promise.all([
      loadExternalTiledMap(mapPath),
      loadExternalTiledMap(mapPath),
    ]);

    expect(firstMap).toBe(secondMap);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('loadExternalTiledMap sheet tile rendering rules', () => {
  it('keeps tall single-image tilesets out of the Phaser auto-layer path', () => {
    const mapData = {
      tileheight: 16,
      tilesets: [
        {
          columns: 1,
          image: '/tiles/tall-tree.png',
          imageheight: 64,
          imagewidth: 32,
          name: 'tall-tree',
          tileheight: 64,
          tilewidth: 32,
        },
        {
          columns: 16,
          image: '/tiles/ground.png',
          imageheight: 256,
          imagewidth: 256,
          name: 'ground',
          tileheight: 16,
          tilewidth: 16,
        },
      ],
      tilewidth: 16,
    };

    expect(getSheetTilesetAssets(mapData)).toEqual([
      { key: 'tall-tree', path: '/tiles/tall-tree.png' },
      { key: 'ground', path: '/tiles/ground.png' },
    ]);
    expect(shouldManuallyRenderSheetTileset(mapData, mapData.tilesets[0])).toBe(true);
    expect(getAutoLayerTilesetAssets(mapData)).toEqual([
      { key: 'ground', path: '/tiles/ground.png' },
    ]);
  });
});

describe('loadExternalTiledMap asset path resolution', () => {
  it('resolves legacy tiled asset aliases against the external dev asset root', async () => {
    const { toAssetPath: resolveAssetPath } = await loadTiledAssetHelper({
      dev: true,
      tiledProjectRootUrl: '/__external_tiled__',
    });

    expect(
      resolveAssetPath(
        'city-v2/tiled/player-character/Player_Characters_Default/selectable_character_01.png'
      )
    ).toBe(
      '/__external_tiled__/player-character/Player_Characters_Default/selectable_character_01.png'
    );
  });

  it('falls back to normal asset URLs when no external tiled root exists', async () => {
    const { toAssetPath: resolveAssetPath } = await loadTiledAssetHelper({
      dev: true,
      tiledProjectRootUrl: '',
      assetBaseUrl: '',
    });

    expect(
      resolveAssetPath(
        'city-v2/tiled/player-character/Player_Characters_Default/selectable_character_01.png'
      )
    ).toBe('/city-v2/tiled/player-character/Player_Characters_Default/selectable_character_01.png');
  });
});
