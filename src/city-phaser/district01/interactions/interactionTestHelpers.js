import { vi } from 'vitest';

import { attachApartmentPreviewSceneInteractionMethods } from '../apartmentPreviewScene.interactions';
import {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  getDistrict01PreviewMap,
} from '../district01PreviewMaps';
import { getPlayerCharacterPreset } from '../../../player-character/playerCharacterPresets';

export {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  getDistrict01PreviewMap,
  getPlayerCharacterPreset,
};

export class MockScene {}

export class MockRectangle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  static Overlaps(left, right) {
    return !(
      left.x + left.width <= right.x ||
      right.x + right.width <= left.x ||
      left.y + left.height <= right.y ||
      right.y + right.height <= left.y
    );
  }
}

attachApartmentPreviewSceneInteractionMethods(MockScene, {
  Geom: {
    Rectangle: MockRectangle,
  },
});

export const createScene = (options = {}) => {
  const scene = new MockScene();

  scene.activeInteractionZone = options.activeInteractionZone || null;
  scene.previewLocationId = options.previewLocationId || 'apartment-room-01';
  scene.previewMapConfig =
    options.previewMapConfig || getDistrict01PreviewMap(scene.previewLocationId);
  scene.previewSpawnTarget = options.previewSpawnTarget || null;
  scene.getPreviewBridge =
    options.getPreviewBridge ||
    (() => ({
      apartmentEntryState: 'hub',
      apartmentShellId: 'apartment-hub-desktop',
      previewDeviceClass: 'desktop',
    }));
  scene.playerAnimationKeys =
    options.playerAnimationKeys || getPlayerCharacterPreset().animationKeys;
  scene.playerTextureKeys = options.playerTextureKeys || getPlayerCharacterPreset().textureKeys;
  scene.playerDoorApproachState = options.playerDoorApproachState ?? null;
  scene.player = options.player || { setVelocity: vi.fn() };
  scene.applyIdleFrame = options.applyIdleFrame || vi.fn();
  scene.setPreviewCollectibleModalState = options.setPreviewCollectibleModalState || vi.fn();
  scene.setPreviewHudState = options.setPreviewHudState || vi.fn();
  scene.setPreviewInteractionState = options.setPreviewInteractionState || vi.fn();
  scene.setPreviewWorldState = options.setPreviewWorldState || vi.fn();
  scene.showWindowView = options.showWindowView || vi.fn();
  scene.scene = options.scenePlugin || { restart: vi.fn() };
  scene.tilemap = options.tilemap || {
    getObjectLayer: vi.fn(() => ({ objects: [] })),
  };
  scene.mapData = options.mapData || { layers: [] };
  scene.time = options.time || { now: 0 };

  return scene;
};
