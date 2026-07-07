import { describe, expect, it, vi } from 'vitest';

import { attachApartmentPreviewSceneAssetMethods } from './apartmentPreviewScene.assets';
import { INTRO_CITY_UNCROPPED_STRIP } from './apartmentPreviewScene.constants';
import { DISTRICT_01_PREVIEW_LOCATION_IDS, getDistrict01PreviewMap } from './district01PreviewMaps';
import * as apartmentPreviewSceneUtils from './apartmentPreviewScene.utils';

class MockPreviewScene {
  constructor() {
    this.oversizedTilesetImages = new Map();
  }
}

attachApartmentPreviewSceneAssetMethods(MockPreviewScene);

describe('apartmentPreviewScene.assets', () => {
  it('collects collection-tile animation frames without recursing forever on cycles', () => {
    const scene = new MockPreviewScene();
    const mapData = {
      layers: [
        {
          data: [1],
          height: 1,
          type: 'tilelayer',
          width: 1,
        },
      ],
      tilesets: [
        {
          firstgid: 1,
          name: 'cyclic-collection',
          tileheight: 16,
          tiles: [
            {
              animation: [{ duration: 100, tileid: 1 }],
              id: 0,
              image: '/tiles/terminal-a.png',
              imageheight: 16,
              imagewidth: 16,
            },
            {
              animation: [{ duration: 100, tileid: 0 }],
              id: 1,
              image: '/tiles/terminal-b.png',
              imageheight: 16,
              imagewidth: 16,
            },
          ],
          tilewidth: 16,
        },
      ],
    };

    expect(scene.collectCollectionTileAssets(mapData)).toEqual([
      {
        key: 'city-phaser:manual:cyclic-collection:0',
        path: '/tiles/terminal-a.png',
        type: 'image',
      },
      {
        key: 'city-phaser:manual:cyclic-collection:1',
        path: '/tiles/terminal-b.png',
        type: 'image',
      },
    ]);
  });

  it('bottom-left anchors tall sheet tiles when rendering them manually', async () => {
    const scene = new MockPreviewScene();
    const placedSprites = [];
    const addFrameSpy = vi.fn();

    scene.add = {
      blitter: vi.fn((x, y, textureKey) => {
        const blitterGroup = {
          create: vi.fn((bx, by, frameName) => {
            const bob = {
              flipX: false,
              flipY: false,
            };
            placedSprites.push({ frame: frameName, sprite: bob, textureKey, x: bx, y: by });
            return bob;
          }),
          setDepth: vi.fn().mockReturnThis(),
        };
        return blitterGroup;
      }),
      image: vi.fn((x, y, textureKey, frame) => {
        const sprite = {
          setDepth: vi.fn().mockReturnThis(),
          setFlip: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
        };

        placedSprites.push({ frame, sprite, textureKey, x, y });
        return sprite;
      }),
    };
    const mockTexture = {
      add: addFrameSpy,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      getSourceImage: vi.fn(() => ({})),
      has: vi.fn(() => false),
      refresh: vi.fn(),
    };
    scene.textures = {
      createCanvas: vi.fn(() => mockTexture),
      exists: vi.fn(() => false),
      get: vi.fn(() => mockTexture),
    };

    const mapData = {
      layers: [
        {
          data: [1],
          height: 1,
          name: 'TopLayer',
          type: 'tilelayer',
          visible: true,
          width: 1,
        },
      ],
      tileheight: 16,
      tilesets: [
        {
          columns: 1,
          firstgid: 1,
          image: '/tiles/tall-tree.png',
          imageheight: 64,
          imagewidth: 32,
          margin: 0,
          name: 'tall-tree',
          spacing: 0,
          tilecount: 1,
          tileheight: 64,
          tilewidth: 32,
        },
      ],
      tilewidth: 16,
    };

    await scene.renderManualTiles(mapData);

    // The tile should be placed at x:0, y:-48 (bottom-left anchored for a 64px tall tile on a 16px grid).
    expect(placedSprites).toEqual([
      expect.objectContaining({
        frame: 'city-phaser:manual:tall-tree:0',
        textureKey: 'city-phaser:tileset:tall-tree',
        x: 0,
        y: -48,
      }),
    ]);
    // Frame registration on the tileset texture (not canvas atlas) should have been used.
    expect(addFrameSpy).toHaveBeenCalledOnce();
    expect(addFrameSpy).toHaveBeenCalledWith(
      'city-phaser:manual:tall-tree:0',
      0, // sourceIndex
      0, // sourceX in the tileset texture
      0, // sourceY in the tileset texture
      32, // tileWidth
      64 // tileHeight
    );
  });

  it('collects configured interaction display files for synthetic scene actors', () => {
    const scene = new MockPreviewScene();
    scene.previewMapConfig = getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.exterior);

    expect(scene.collectConfiguredInteractionDisplayFiles()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          config: {
            frameHeight: 48,
            frameWidth: 64,
          },
          key: 'city-preview-npc:district-01-lockdown-cop',
          type: 'spritesheet',
        }),
      ])
    );
  });

  it('collects configured scene actor files for roaming PEC pedestrians', () => {
    const scene = new MockPreviewScene();
    scene.previewMapConfig = getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.exterior);

    expect(scene.collectConfiguredSceneActorFiles()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          config: {
            frameHeight: 48,
            frameWidth: 64,
          },
          key: 'city-preview-scene-actor:district-01-apartment-resident-01:walk:down',
          type: 'spritesheet',
        }),
        expect.objectContaining({
          config: {
            frameHeight: 48,
            frameWidth: 64,
          },
          key: 'city-preview-scene-actor:district-01-shopper-01:idle:up',
          type: 'spritesheet',
        }),
      ])
    );
  });

  it('collects configured door transition files for scene entrances and exits', () => {
    const scene = new MockPreviewScene();
    scene.previewMapConfig = getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.exterior);

    expect(scene.collectConfiguredTransitionDoorFiles()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          config: {
            frameHeight: 32,
            frameWidth: 32,
          },
          key: 'city-preview-door:district-01-charging-store-door-01:sheet',
          type: 'spritesheet',
        }),
        expect.objectContaining({
          config: {
            frameHeight: 32,
            frameWidth: 32,
          },
          key: 'city-preview-door:district-01-learning-door-01:sheet',
          type: 'spritesheet',
        }),
      ])
    );
  });

  it('does not queue the uncropped backdrop strip as a live Phaser texture during asset load', async () => {
    const scene = new MockPreviewScene();
    const queueLoaderFilesSpy = vi
      .spyOn(apartmentPreviewSceneUtils, 'queueLoaderFiles')
      .mockResolvedValue(undefined);
    const loadNativeImageSpy = vi
      .spyOn(apartmentPreviewSceneUtils, 'loadNativeImage')
      .mockResolvedValue({ width: 16, height: 16 });
    const buildPlayerAnimationsSpy = vi
      .spyOn(apartmentPreviewSceneUtils, 'buildPlayerAnimations')
      .mockImplementation(() => {});

    scene.getPreviewBridge = () => ({ guestPhoneContext: {} });
    scene.previewLocationId = 'unknown-preview-location';

    try {
      await scene.loadAssets({ layers: [], tilesets: [] });
    } finally {
      queueLoaderFilesSpy.mockRestore();
      loadNativeImageSpy.mockRestore();
      buildPlayerAnimationsSpy.mockRestore();
    }

    const queuedFiles = queueLoaderFilesSpy.mock.calls[0]?.[1] || [];

    expect(queuedFiles.some((file) => file.key === INTRO_CITY_UNCROPPED_STRIP.textureKey)).toBe(
      false
    );
  });

  it('builds uncropped backdrop frames from the cached native strip as fallback when pre-baked frames are missing', async () => {
    const scene = new MockPreviewScene();
    const animationFrames = [
      { duration: 100, tileid: 0 },
      { duration: 120, tileid: 1 },
      { duration: 140, tileid: 2 },
    ];

    const queueLoaderFilesSpy = vi
      .spyOn(apartmentPreviewSceneUtils, 'queueLoaderFiles')
      .mockResolvedValue(undefined);

    scene.uncroppedBackdropSourceImage = { width: 300, height: 60 };
    scene.textures = {
      exists: vi.fn(() => false),
    };
    scene.ensureUncroppedBackdropTexture = vi.fn(async (_sourceImage, frameId, frameSize) => {
      return `frame-${frameId}-${frameSize.frameWidth}x${frameSize.frameHeight}`;
    });

    try {
      const frames = await scene.collectUncroppedDuskCityFrames(animationFrames);

      expect(queueLoaderFilesSpy).toHaveBeenCalledOnce();
      expect(scene.ensureUncroppedBackdropTexture).toHaveBeenCalledTimes(3);
      expect(frames).toEqual([
        { duration: 100, key: 'frame-0-100x60' },
        { duration: 120, key: 'frame-1-100x60' },
        { duration: 140, key: 'frame-2-100x60' },
      ]);
    } finally {
      queueLoaderFilesSpy.mockRestore();
    }
  });

  it('loads pre-baked backdrop frames natively when available', async () => {
    const scene = new MockPreviewScene();
    const animationFrames = [
      { duration: 100, tileid: 0 },
      { duration: 120, tileid: 1 },
    ];

    const queueLoaderFilesSpy = vi
      .spyOn(apartmentPreviewSceneUtils, 'queueLoaderFiles')
      .mockResolvedValue(undefined);

    scene.textures = {
      exists: vi.fn(() => true),
    };
    scene.ensureUncroppedBackdropTexture = vi.fn();

    try {
      const frames = await scene.collectUncroppedDuskCityFrames(animationFrames);

      expect(queueLoaderFilesSpy).toHaveBeenCalledOnce();
      expect(scene.ensureUncroppedBackdropTexture).not.toHaveBeenCalled();
      expect(frames).toEqual([
        { duration: 100, key: `${INTRO_CITY_UNCROPPED_STRIP.keyPrefix}0` },
        { duration: 120, key: `${INTRO_CITY_UNCROPPED_STRIP.keyPrefix}1` },
      ]);
    } finally {
      queueLoaderFilesSpy.mockRestore();
    }
  });
});
