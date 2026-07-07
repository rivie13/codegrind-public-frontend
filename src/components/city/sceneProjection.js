export const CITY_SCENE_ART_SIZE = {
  width: 1536,
  height: 1024,
};

const clampPercent = (value) => Math.min(100, Math.max(0, value));

const normalizeStageSize = (stageSize) => {
  const width = Number(stageSize?.width) || 0;
  const height = Number(stageSize?.height) || 0;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
};

export const getSceneCoverFrame = (stageSize, artSize = CITY_SCENE_ART_SIZE) => {
  const normalizedStage = normalizeStageSize(stageSize);
  const artWidth = Number(artSize?.width) || 0;
  const artHeight = Number(artSize?.height) || 0;

  if (!normalizedStage || artWidth <= 0 || artHeight <= 0) {
    return null;
  }

  const scale = Math.max(normalizedStage.width / artWidth, normalizedStage.height / artHeight);
  const renderedWidth = artWidth * scale;
  const renderedHeight = artHeight * scale;

  return {
    stageWidth: normalizedStage.width,
    stageHeight: normalizedStage.height,
    renderedWidth,
    renderedHeight,
    offsetX: (normalizedStage.width - renderedWidth) / 2,
    offsetY: (normalizedStage.height - renderedHeight) / 2,
  };
};

export const projectScenePositionToStagePercent = (
  position,
  stageSize,
  artSize = CITY_SCENE_ART_SIZE
) => {
  if (!position) return null;

  const frame = getSceneCoverFrame(stageSize, artSize);
  if (!frame) {
    return {
      x: position.x,
      y: position.y,
    };
  }

  const xPx = frame.offsetX + (position.x / 100) * frame.renderedWidth;
  const yPx = frame.offsetY + (position.y / 100) * frame.renderedHeight;

  return {
    x: (xPx / frame.stageWidth) * 100,
    y: (yPx / frame.stageHeight) * 100,
  };
};

export const projectStagePositionToScenePercent = (
  position,
  stageSize,
  artSize = CITY_SCENE_ART_SIZE
) => {
  if (!position) return null;

  const frame = getSceneCoverFrame(stageSize, artSize);
  if (!frame) {
    return {
      x: position.x,
      y: position.y,
    };
  }

  const xPx = (position.x / 100) * frame.stageWidth;
  const yPx = (position.y / 100) * frame.stageHeight;

  return {
    x: clampPercent(((xPx - frame.offsetX) / frame.renderedWidth) * 100),
    y: clampPercent(((yPx - frame.offsetY) / frame.renderedHeight) * 100),
  };
};

export const projectSceneZoneToStageBounds = (zone, stageSize, artSize = CITY_SCENE_ART_SIZE) => {
  if (!zone) return null;

  const topLeft = projectScenePositionToStagePercent(
    { x: zone.xMin, y: zone.yMin },
    stageSize,
    artSize
  );
  const bottomRight = projectScenePositionToStagePercent(
    { x: zone.xMax, y: zone.yMax },
    stageSize,
    artSize
  );

  if (!topLeft || !bottomRight) return null;

  return {
    left: `${topLeft.x}%`,
    top: `${topLeft.y}%`,
    width: `${bottomRight.x - topLeft.x}%`,
    height: `${bottomRight.y - topLeft.y}%`,
  };
};
