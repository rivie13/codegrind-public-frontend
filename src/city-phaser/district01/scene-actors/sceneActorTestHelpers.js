import { vi } from 'vitest';

import { attachApartmentPreviewSceneActorMethods } from '../apartmentPreviewScene.actors';
import {
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  getDistrict01PreviewMap,
} from '../district01PreviewMaps';

export { DISTRICT_01_PREVIEW_LOCATION_IDS, getDistrict01PreviewMap };

export class MockVector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const length = Math.hypot(this.x, this.y);

    if (!length) {
      return this;
    }

    this.x /= length;
    this.y /= length;
    return this;
  }

  scale(value) {
    this.x *= value;
    this.y *= value;
    return this;
  }
}

export class MockScene {}

attachApartmentPreviewSceneActorMethods(MockScene, {
  Math: {
    Vector2: MockVector2,
  },
});

export const createShadow = (x, y) => {
  const shadow = {
    visible: true,
    x,
    y,
    setDepth: vi.fn(function setDepth(depth) {
      this.depth = depth;
      return this;
    }),
    setPosition: vi.fn(function setPosition(nextX, nextY) {
      this.x = nextX;
      this.y = nextY;
      return this;
    }),
    setVisible: vi.fn(function setVisible(value) {
      this.visible = value;
      return this;
    }),
  };

  return shadow;
};

export const createSprite = (x, y) => {
  const body = {
    blocked: {
      down: false,
      left: false,
      right: false,
      up: false,
    },
    debugShowVelocity: false,
    embedded: false,
    enable: true,
    reset: vi.fn(),
    setAllowGravity: vi.fn(),
    setOffset: vi.fn(),
    setSize: vi.fn(),
    stop: vi.fn(),
    touching: {
      down: false,
      left: false,
      right: false,
      up: false,
    },
    updateFromGameObject: vi.fn(),
    velocity: {
      x: 0,
      y: 0,
    },
  };
  const sprite = {
    body,
    depth: 0,
    visible: true,
    x,
    y,
    destroy: vi.fn(),
    play: vi.fn().mockReturnThis(),
    setCollideWorldBounds: vi.fn().mockReturnThis(),
    setDepth: vi.fn(function setDepth(depth) {
      this.depth = depth;
      return this;
    }),
    setFlipX: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setSlideFactor: vi.fn().mockReturnThis(),
    setPosition: vi.fn(function setPosition(nextX, nextY) {
      this.x = nextX;
      this.y = nextY;
      return this;
    }),
    setVelocity: vi.fn(function setVelocity(nextX, nextY) {
      this.body.velocity = {
        x: nextX,
        y: nextY,
      };
      return this;
    }),
    setVisible: vi.fn(function setVisible(value) {
      this.visible = value;
      return this;
    }),
  };

  return sprite;
};

export const createAppearance = (keyPrefix) => ({
  animationKeyPrefix: keyPrefix,
  depth: 138,
  frameConfig: {
    frameHeight: 48,
    frameWidth: 64,
  },
  idleFrameCount: 4,
  originY: 32 / 48,
  scale: 2,
  shadow: {
    alpha: 0.2,
    height: 6,
    width: 20,
  },
  textures: {
    idleDown: { key: `${keyPrefix}:idle:down` },
    idleSide: { key: `${keyPrefix}:idle:side` },
    idleUp: { key: `${keyPrefix}:idle:up` },
    walkDown: { key: `${keyPrefix}:walk:down` },
    walkSide: { key: `${keyPrefix}:walk:side` },
    walkUp: { key: `${keyPrefix}:walk:up` },
  },
  walkFrameCount: 8,
});

export const createPointObject = (name, x, y) => ({
  height: 0,
  name,
  point: true,
  width: 0,
  x,
  y,
});

export const createScene = (previewMapConfig) => {
  const scene = new MockScene();
  const createdAnimationKeys = new Set();

  scene.previewMapConfig = previewMapConfig;
  scene.collisionBodies = [{ id: 'wall' }];
  scene.add = {
    ellipse: vi.fn((x, y) => createShadow(x, y)),
    sprite: vi.fn((x, y) => createSprite(x, y)),
  };
  scene.anims = {
    create: vi.fn((config) => {
      createdAnimationKeys.add(config.key);
    }),
    exists: vi.fn((key) => createdAnimationKeys.has(key)),
  };
  scene.physics = {
    add: {
      collider: vi.fn(),
      sprite: vi.fn((x, y) => createSprite(x, y)),
    },
  };
  scene.getMapObjectLayer = vi.fn(() => ({ objects: [] }));
  scene.rawCollisionObjects = [];
  scene.resolvedCollisionRectangles = [];
  scene.resolveSpawnTargetPosition = vi.fn((target) => {
    if (target?.objectName === 'VendorCounter') {
      return { x: 300, y: 160 };
    }

    if (target?.layerName && target?.objectName) {
      const objectValue = scene
        .getMapObjectLayer(target.layerName)
        ?.objects?.find((candidate) => candidate?.name === target.objectName);

      if (objectValue) {
        return {
          x: Number(objectValue.x ?? 0) + Number(target.offsetX ?? 0),
          y: Number(objectValue.y ?? 0) + Number(target.offsetY ?? 0),
        };
      }
    }

    return null;
  });
  scene.shouldShowCollisionDebug = vi.fn(() => false);
  scene.time = { now: 0 };

  return scene;
};
