import {
  LAYERS_ABOVE_PLAYER,
  LAYERS_BELOW_PLAYER,
  PLAYER_IDLE_FRAME_RATE,
  PLAYER_WALK_FRAME_RATE,
  PREVIEW_DIRECTION_BY_CODE,
} from './apartmentPreviewScene.constants';
import { getPlayerCharacterPreset } from '../../player-character/playerCharacterPresets';

const NATIVE_IMAGE_CACHE = new Map();

export const getLayerDepth = (layerName) => {
  const belowPlayerIndex = LAYERS_BELOW_PLAYER.indexOf(layerName);
  if (belowPlayerIndex >= 0) {
    return belowPlayerIndex * 10;
  }

  const abovePlayerIndex = LAYERS_ABOVE_PLAYER.indexOf(layerName);
  if (abovePlayerIndex >= 0) {
    return 200 + abovePlayerIndex * 10;
  }

  return 100;
};

export const clearNativeImageCache = () => {
  NATIVE_IMAGE_CACHE.clear();
};

export const loadNativeImage = (sourcePath) => {
  const normalizedSourcePath = String(sourcePath || '');

  if (NATIVE_IMAGE_CACHE.has(normalizedSourcePath)) {
    return NATIVE_IMAGE_CACHE.get(normalizedSourcePath);
  }

  const pendingImage = new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      NATIVE_IMAGE_CACHE.delete(normalizedSourcePath);
      reject(new Error(`Unable to load oversized tileset image: ${normalizedSourcePath}`));
    };
    image.src = normalizedSourcePath;
  });

  NATIVE_IMAGE_CACHE.set(normalizedSourcePath, pendingImage);
  return pendingImage;
};

export const loadOptionalNativeImage = async (sourcePath) => {
  try {
    return await loadNativeImage(sourcePath);
  } catch {
    return null;
  }
};

export const getUncroppedBackdropFrameSize = (sourceImage, animationFrames) => {
  const requiredFrameCount = Math.max(
    1,
    ...animationFrames.map((frame) => Number(frame?.tileid ?? 0) + 1)
  );

  if (!sourceImage?.width || !sourceImage?.height || sourceImage.width % requiredFrameCount !== 0) {
    return null;
  }

  return {
    frameCount: requiredFrameCount,
    frameHeight: sourceImage.height,
    frameWidth: sourceImage.width / requiredFrameCount,
  };
};

export const queueLoaderFiles = (scene, files) =>
  new Promise((resolve, reject) => {
    const pendingFiles = files.filter((file) => !scene.textures.exists(file.key));
    const optionalFileKeys = new Set(
      pendingFiles.filter((file) => file.optional).map((file) => file.key)
    );

    if (pendingFiles.length === 0) {
      resolve();
      return;
    }

    const cleanup = () => {
      scene.load.off('complete', handleComplete);
      scene.load.off('loaderror', handleError);
    };

    const handleComplete = () => {
      cleanup();
      resolve();
    };

    const handleError = (file) => {
      if (optionalFileKeys.has(file?.key)) {
        return;
      }

      cleanup();
      reject(new Error(`Unable to load Phaser asset: ${file?.src || file?.key || 'unknown'}`));
    };

    scene.load.on('complete', handleComplete);
    scene.load.on('loaderror', handleError);

    pendingFiles.forEach((file) => {
      if (file.type === 'image') {
        scene.load.image(file.key, file.path);
        return;
      }

      scene.load.spritesheet(file.key, file.path, file.config);
    });

    scene.load.start();
  });

export const findObject = (objects = [], name) =>
  objects.find((objectValue) => objectValue.name === name);

export const getZoneCenter = (zoneObject) => ({
  x: zoneObject.x + zoneObject.width / 2,
  y: zoneObject.y + zoneObject.height / 2,
});

export const getPolygonCollisionRectangles = (collisionObject) => {
  if (!Array.isArray(collisionObject?.polygon) || collisionObject.polygon.length < 3) {
    return [];
  }

  const polygonPoints = collisionObject.polygon.map((point) => ({
    x: collisionObject.x + point.x,
    y: collisionObject.y + point.y,
  }));
  const uniqueYValues = [...new Set(polygonPoints.map((point) => point.y))].sort(
    (left, right) => left - right
  );
  const rectangles = [];

  for (let index = 0; index < uniqueYValues.length - 1; index += 1) {
    const top = uniqueYValues[index];
    const bottom = uniqueYValues[index + 1];
    const sampleY = top + (bottom - top) / 2;
    const intersections = [];

    for (let pointIndex = 0; pointIndex < polygonPoints.length; pointIndex += 1) {
      const currentPoint = polygonPoints[pointIndex];
      const nextPoint = polygonPoints[(pointIndex + 1) % polygonPoints.length];

      if (
        (currentPoint.y <= sampleY && nextPoint.y > sampleY) ||
        (nextPoint.y <= sampleY && currentPoint.y > sampleY)
      ) {
        const ratio = (sampleY - currentPoint.y) / (nextPoint.y - currentPoint.y);
        intersections.push(currentPoint.x + (nextPoint.x - currentPoint.x) * ratio);
      }
    }

    intersections.sort((left, right) => left - right);

    for (
      let intersectionIndex = 0;
      intersectionIndex < intersections.length;
      intersectionIndex += 2
    ) {
      const left = intersections[intersectionIndex];
      const right = intersections[intersectionIndex + 1];

      if (typeof left === 'number' && typeof right === 'number' && right > left) {
        rectangles.push({
          height: bottom - top,
          width: right - left,
          x: left,
          y: top,
        });
      }
    }
  }

  return rectangles;
};

export const getCollisionRectangles = (collisionObject) => {
  if (Array.isArray(collisionObject?.polygon) && collisionObject.polygon.length >= 3) {
    return getPolygonCollisionRectangles(collisionObject);
  }

  if (!collisionObject?.width || !collisionObject?.height) {
    return [];
  }

  return [
    {
      height: collisionObject.height,
      width: collisionObject.width,
      x: collisionObject.x,
      y: collisionObject.y,
    },
  ];
};

export const createAnimationIfNeeded = (scene, config) => {
  if (scene.anims.exists(config.key)) {
    return;
  }

  scene.anims.create(config);
};

const buildAnimationFrames = (textureKey, frameNumbers) =>
  frameNumbers.map((frame) => ({ frame, key: textureKey }));

export const buildPlayerAnimations = (scene, playerCharacterPreset = null) => {
  const resolvedPlayerCharacterPreset =
    playerCharacterPreset || scene.playerCharacterPreset || getPlayerCharacterPreset();
  const textureKey = resolvedPlayerCharacterPreset.textureKeys.atlas;
  const animationKeys = resolvedPlayerCharacterPreset.animationKeys;
  const animationFrameIndices = resolvedPlayerCharacterPreset.animationFrameIndices;

  createAnimationIfNeeded(scene, {
    frameRate: PLAYER_IDLE_FRAME_RATE,
    frames: buildAnimationFrames(textureKey, animationFrameIndices.idleDown),
    key: animationKeys.idleDown,
    repeat: -1,
  });
  createAnimationIfNeeded(scene, {
    frameRate: PLAYER_IDLE_FRAME_RATE,
    frames: buildAnimationFrames(textureKey, animationFrameIndices.idleSide),
    key: animationKeys.idleSide,
    repeat: -1,
  });
  createAnimationIfNeeded(scene, {
    frameRate: PLAYER_IDLE_FRAME_RATE,
    frames: buildAnimationFrames(textureKey, animationFrameIndices.idleUp),
    key: animationKeys.idleUp,
    repeat: -1,
  });
  createAnimationIfNeeded(scene, {
    frameRate: PLAYER_WALK_FRAME_RATE,
    frames: buildAnimationFrames(textureKey, animationFrameIndices.walkDown),
    key: animationKeys.walkDown,
    repeat: -1,
  });
  createAnimationIfNeeded(scene, {
    frameRate: PLAYER_WALK_FRAME_RATE,
    frames: buildAnimationFrames(textureKey, animationFrameIndices.walkSide),
    key: animationKeys.walkSide,
    repeat: -1,
  });
  createAnimationIfNeeded(scene, {
    frameRate: PLAYER_WALK_FRAME_RATE,
    frames: buildAnimationFrames(textureKey, animationFrameIndices.walkUp),
    key: animationKeys.walkUp,
    repeat: -1,
  });
};

export const getPreviewTraceTagName = (target) => {
  const resolvedTagName = String(target?.tagName || target?.nodeName || '')
    .trim()
    .toLowerCase();

  return resolvedTagName || 'window';
};

export const getPreviewInputTraceNote = ({ event, eventType }) => {
  const direction = PREVIEW_DIRECTION_BY_CODE[event?.code] || null;
  const isModified = Boolean(event?.ctrlKey || event?.metaKey || event?.altKey);

  if (direction) {
    if (isModified) {
      return eventType === 'keydown'
        ? 'Phaser received modified movement key.'
        : 'Phaser received modified movement key release.';
    }

    return eventType === 'keydown'
      ? 'Phaser received movement key.'
      : 'Phaser received movement key release.';
  }

  return eventType === 'keydown'
    ? 'Phaser received non-movement key.'
    : 'Phaser received non-movement key release.';
};

export const buildPreviewInputTracePayload = ({ event, eventType, note }) => ({
  activeElementTag:
    typeof document === 'undefined' ? 'unknown' : getPreviewTraceTagName(document.activeElement),
  capsLock: Boolean(event?.getModifierState?.('CapsLock')),
  code: typeof event?.code === 'string' ? event.code : '',
  defaultPreventedBeforeHandler: Boolean(event?.defaultPrevented),
  documentHasFocus: typeof document === 'undefined' ? false : document.hasFocus(),
  eventType,
  key: typeof event?.key === 'string' ? event.key : '',
  note,
  repeat: Boolean(event?.repeat),
  sceneDirection: PREVIEW_DIRECTION_BY_CODE[event?.code] || null,
  sceneReceived: true,
  shiftKey: Boolean(event?.shiftKey),
  targetTag: getPreviewTraceTagName(event?.target),
});
