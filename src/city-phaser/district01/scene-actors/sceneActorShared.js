const SCENE_ACTOR_BODY_CONFIG = Object.freeze({
  height: 8,
  offsetX: 26,
  offsetY: 24,
  width: 12,
});
const SCENE_ACTOR_DEFAULT_SPEED = 28;
const SCENE_DOOR_TRANSITION_FRAME_RATE = 12;
const SCENE_ACTOR_IDLE_FRAME_RATE = 5;
const SCENE_ACTOR_WALK_FRAME_RATE = 10;
const SCENE_ACTOR_PROGRESS_EPSILON = 2;
const SCENE_ACTOR_STUCK_TIMEOUT_MS = 320;
const SCENE_ACTOR_RECOVERY_DURATION_MS = 180;
const SCENE_ACTOR_RECOVERY_SPEED_MULTIPLIER = 0.72;
const SCENE_ACTOR_MAX_STUCK_RECOVERY_ATTEMPTS = 2;
const SCENE_ACTOR_SLIDE_FACTOR = 0;
const SCENE_ACTOR_NAV_CLEARANCE_PADDING = 8;
const SCENE_ACTOR_NAV_DEFAULT_MAX_NEIGHBORS = 4;
const SCENE_ACTOR_NAV_SAMPLE_SPACING = 4;
const SCENE_ACTOR_NAV_RESERVED_DESTINATION_PENALTY = 0.18;
const SCENE_ACTOR_NAV_RESERVED_TARGET_PENALTY = 0.42;
const SCENE_ACTOR_NAV_OCCUPIED_NODE_PENALTY = 0.6;
const SCENE_ACTOR_NAV_RESERVED_NEARBY_DISTANCE = 96;
const SCENE_ACTOR_NAV_RESERVED_NEARBY_PENALTY = 0.72;
const SCENE_ACTOR_NAV_CROSSWALK_SIDE_TAGS = new Set(['left-side', 'right-side', 'east-side']);
const SCENE_ACTOR_NAV_CROSSWALK_SIDE_BONUS = 2.4;
const SCENE_ACTOR_NAV_CROSSWALK_CENTER_PENALTY = 0.38;
const SCENE_ACTOR_NAV_CROSSWALK_TRANSITION_PENALTY = 0.55;
const SCENE_ACTOR_NAV_CROSSWALK_HANGOUT_BONUS = 1.25;
const SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_RADIUS = 42;
const SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_WEIGHT = 0.7;

const buildAnimationFrames = (textureKey, frameCount) =>
  Array.from({ length: frameCount }, (_, index) => ({
    frame: index,
    key: textureKey,
  }));

const buildReverseAnimationFrames = (textureKey, frameCount) =>
  Array.from({ length: frameCount }, (_, index) => ({
    frame: frameCount - index - 1,
    key: textureKey,
  }));

const resolveActorDepth = (actorConfig = {}) =>
  actorConfig.depth ?? actorConfig.appearance?.depth ?? 138;

const resolveActorShadowConfig = (actorConfig = {}) => actorConfig.appearance?.shadow || null;

const normalizeActorTarget = (target) => {
  if (!target || typeof target !== 'object') {
    return null;
  }

  if (target.target && typeof target.target === 'object') {
    return target.target;
  }

  return target;
};

const scheduleSceneCallback = (scene, delayMs, callback) => {
  if (typeof callback !== 'function') {
    return null;
  }

  if (typeof scene.time?.delayedCall === 'function') {
    return scene.time.delayedCall(Math.max(Number(delayMs || 0), 0), callback);
  }

  callback();
  return null;
};

const resolveTransitionRangeValue = (rangeConfig) => {
  if (!rangeConfig || typeof rangeConfig !== 'object') {
    return null;
  }

  const min = Number(rangeConfig.min ?? rangeConfig.minimum ?? NaN);
  const max = Number(rangeConfig.max ?? rangeConfig.maximum ?? NaN);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);

  if (lowerBound === upperBound) {
    return lowerBound;
  }

  return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound + 1));
};

const cloneSceneActorConfigValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneSceneActorConfigValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        cloneSceneActorConfigValue(nestedValue),
      ])
    );
  }

  return value;
};

const createSceneActorNavTarget = (layerName, objectName) => ({
  anchor: 'object-origin',
  layerName,
  objectName,
});

const resolveSceneActorNavWaitMs = (waitConfig, fallbackValue = 0) => {
  if (typeof waitConfig === 'number' && Number.isFinite(waitConfig)) {
    return waitConfig;
  }

  const rangeValue = resolveTransitionRangeValue(waitConfig);

  return rangeValue ?? fallbackValue;
};

const createSceneActorNavPairLookup = (crosswalkPairs = []) => {
  const nodePairs = new Map();
  const traversalKeys = new Set();

  crosswalkPairs.forEach((pair, pairIndex) => {
    if (!Array.isArray(pair) || pair.length < 2) {
      return;
    }

    const [leftNodeName, rightNodeName] = pair;

    if (typeof leftNodeName !== 'string' || typeof rightNodeName !== 'string') {
      return;
    }

    const pairId = `${pairIndex}:${leftNodeName}:${rightNodeName}`;

    nodePairs.set(leftNodeName, {
      pairId,
      pairNodeName: rightNodeName,
    });
    nodePairs.set(rightNodeName, {
      pairId,
      pairNodeName: leftNodeName,
    });
    traversalKeys.add(`${leftNodeName}::${rightNodeName}`);
    traversalKeys.add(`${rightNodeName}::${leftNodeName}`);
  });

  return {
    nodePairs,
    traversalKeys,
  };
};

const isPointInsideSceneActorNavRectangle = (point, rectangle) =>
  point.x > rectangle.x &&
  point.x < rectangle.x + rectangle.width &&
  point.y > rectangle.y &&
  point.y < rectangle.y + rectangle.height;

const sceneActorNavSegmentHitsCollision = (start, end, collisionRectangles = []) => {
  const sampleCount = Math.max(
    Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / SCENE_ACTOR_NAV_SAMPLE_SPACING),
    1
  );
  const clearanceOffsets = [
    { x: 0, y: 0 },
    { x: SCENE_ACTOR_NAV_CLEARANCE_PADDING, y: 0 },
    { x: -SCENE_ACTOR_NAV_CLEARANCE_PADDING, y: 0 },
    { x: 0, y: SCENE_ACTOR_NAV_CLEARANCE_PADDING },
    { x: 0, y: -SCENE_ACTOR_NAV_CLEARANCE_PADDING },
    { x: SCENE_ACTOR_NAV_CLEARANCE_PADDING, y: SCENE_ACTOR_NAV_CLEARANCE_PADDING },
    { x: SCENE_ACTOR_NAV_CLEARANCE_PADDING, y: -SCENE_ACTOR_NAV_CLEARANCE_PADDING },
    { x: -SCENE_ACTOR_NAV_CLEARANCE_PADDING, y: SCENE_ACTOR_NAV_CLEARANCE_PADDING },
    { x: -SCENE_ACTOR_NAV_CLEARANCE_PADDING, y: -SCENE_ACTOR_NAV_CLEARANCE_PADDING },
  ];

  for (let sampleIndex = 1; sampleIndex < sampleCount; sampleIndex += 1) {
    const progress = sampleIndex / sampleCount;
    const samplePoint = {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    };

    if (
      clearanceOffsets.some((offset) =>
        collisionRectangles.some((rectangle) =>
          isPointInsideSceneActorNavRectangle(
            {
              x: samplePoint.x + offset.x,
              y: samplePoint.y + offset.y,
            },
            rectangle
          )
        )
      )
    ) {
      return true;
    }
  }

  return false;
};

const addSceneActorNavNeighbor = (
  adjacency,
  fromNodeName,
  toNodeName,
  distance,
  isCrosswalkTraversal
) => {
  const neighbors = adjacency.get(fromNodeName);

  if (!Array.isArray(neighbors)) {
    return;
  }

  if (neighbors.some((neighbor) => neighbor.nodeName === toNodeName)) {
    return;
  }

  neighbors.push({
    distance,
    isCrosswalkTraversal,
    nodeName: toNodeName,
  });
};

const pickWeightedSceneActorNavCandidate = (candidates = []) => {
  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);

  if (!(totalWeight > 0)) {
    return null;
  }

  let remainingWeight = Math.random() * totalWeight;

  for (const candidate of candidates) {
    remainingWeight -= candidate.weight;

    if (remainingWeight <= 0) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1] || null;
};

export {
  SCENE_ACTOR_BODY_CONFIG,
  SCENE_ACTOR_DEFAULT_SPEED,
  SCENE_DOOR_TRANSITION_FRAME_RATE,
  SCENE_ACTOR_IDLE_FRAME_RATE,
  SCENE_ACTOR_WALK_FRAME_RATE,
  SCENE_ACTOR_PROGRESS_EPSILON,
  SCENE_ACTOR_STUCK_TIMEOUT_MS,
  SCENE_ACTOR_RECOVERY_DURATION_MS,
  SCENE_ACTOR_RECOVERY_SPEED_MULTIPLIER,
  SCENE_ACTOR_MAX_STUCK_RECOVERY_ATTEMPTS,
  SCENE_ACTOR_SLIDE_FACTOR,
  SCENE_ACTOR_NAV_CLEARANCE_PADDING,
  SCENE_ACTOR_NAV_DEFAULT_MAX_NEIGHBORS,
  SCENE_ACTOR_NAV_SAMPLE_SPACING,
  SCENE_ACTOR_NAV_RESERVED_DESTINATION_PENALTY,
  SCENE_ACTOR_NAV_RESERVED_TARGET_PENALTY,
  SCENE_ACTOR_NAV_OCCUPIED_NODE_PENALTY,
  SCENE_ACTOR_NAV_RESERVED_NEARBY_DISTANCE,
  SCENE_ACTOR_NAV_RESERVED_NEARBY_PENALTY,
  SCENE_ACTOR_NAV_CROSSWALK_SIDE_TAGS,
  SCENE_ACTOR_NAV_CROSSWALK_SIDE_BONUS,
  SCENE_ACTOR_NAV_CROSSWALK_CENTER_PENALTY,
  SCENE_ACTOR_NAV_CROSSWALK_TRANSITION_PENALTY,
  SCENE_ACTOR_NAV_CROSSWALK_HANGOUT_BONUS,
  SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_RADIUS,
  SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_WEIGHT,
  buildAnimationFrames,
  buildReverseAnimationFrames,
  resolveActorDepth,
  resolveActorShadowConfig,
  normalizeActorTarget,
  scheduleSceneCallback,
  resolveTransitionRangeValue,
  cloneSceneActorConfigValue,
  createSceneActorNavTarget,
  resolveSceneActorNavWaitMs,
  createSceneActorNavPairLookup,
  isPointInsideSceneActorNavRectangle,
  sceneActorNavSegmentHitsCollision,
  addSceneActorNavNeighbor,
  pickWeightedSceneActorNavCandidate,
};
