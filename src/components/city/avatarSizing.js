const AVATAR_WIDTH_MIN_PX = 293;
const AVATAR_WIDTH_PREFERRED_VH = 46.2;
const AVATAR_WIDTH_MAX_PX = 493;

const normalizeAvatarScale = (avatarScale) => {
  if (Number.isFinite(avatarScale) && avatarScale > 0) {
    return avatarScale;
  }

  return 1;
};

const normalizeMobileBoost = (mobileBoost) => {
  if (Number.isFinite(mobileBoost) && mobileBoost > 0) {
    return mobileBoost;
  }

  return 1;
};

const roundPixels = (value) => Math.round(Number(value.toFixed(4)));

const normalizeStageSize = (stageSize) => {
  const width = Number(stageSize?.width) || 0;
  const height = Number(stageSize?.height) || 0;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
};

export const getAvatarWidth = (avatarScale = 1, stageSize = null, options = {}) => {
  const scale = normalizeAvatarScale(avatarScale);
  const normalizedStage = normalizeStageSize(stageSize);
  const effectiveScale =
    scale * (options.isMobileViewport ? normalizeMobileBoost(options.mobileBoost) : 1);

  if (normalizedStage) {
    const stageResponsiveWidth = Math.min(
      normalizedStage.height * 0.42,
      normalizedStage.width * 0.4
    );
    const minWidthPx = 130 * effectiveScale;
    const maxWidthPx = AVATAR_WIDTH_MAX_PX * effectiveScale;

    return `${roundPixels(
      Math.min(maxWidthPx, Math.max(minWidthPx, stageResponsiveWidth * effectiveScale))
    )}px`;
  }

  const minWidthPx = roundPixels(AVATAR_WIDTH_MIN_PX * effectiveScale);
  const preferredSize = Number((AVATAR_WIDTH_PREFERRED_VH * effectiveScale).toFixed(2));
  const maxWidthPx = roundPixels(AVATAR_WIDTH_MAX_PX * effectiveScale);

  return `clamp(${minWidthPx}px, ${preferredSize}vmin, ${maxWidthPx}px)`;
};
