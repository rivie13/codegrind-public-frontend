const STABLE_DIMENSION_THRESHOLD = 64;

const toPositiveViewportNumber = (value) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0 ? Math.round(numericValue) : 0;
};

const pickViewportDimension = (...values) => {
  // First pass: try to find a stable size (>= threshold)
  for (const value of values) {
    const normalizedValue = toPositiveViewportNumber(value);

    if (normalizedValue >= STABLE_DIMENSION_THRESHOLD) {
      return normalizedValue;
    }
  }

  // Second pass: fall back to any positive value if no stable size is found
  for (const value of values) {
    const normalizedValue = toPositiveViewportNumber(value);

    if (normalizedValue > 0) {
      return normalizedValue;
    }
  }

  return 0;
};

export const resolveStableViewportSize = ({
  containerSize = null,
  gameSize = null,
  previousSize = null,
  scaleManager = null,
  visualViewport = typeof window === 'undefined' ? null : window.visualViewport || null,
  win = typeof window === 'undefined' ? null : window,
} = {}) => ({
  width: pickViewportDimension(
    gameSize?.width,
    scaleManager?.gameSize?.width,
    scaleManager?.width,
    containerSize?.width,
    visualViewport?.width,
    win?.innerWidth,
    previousSize?.width
  ),
  height: pickViewportDimension(
    gameSize?.height,
    scaleManager?.gameSize?.height,
    scaleManager?.height,
    containerSize?.height,
    visualViewport?.height,
    win?.innerHeight,
    previousSize?.height
  ),
});

export default resolveStableViewportSize;
