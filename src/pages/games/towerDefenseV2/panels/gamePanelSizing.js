const MOBILE_CANVAS_SCALE_SAFETY_FACTOR = 0.95;

export const resolveCanvasFitScale = ({
  availableCanvasWidth,
  availableCanvasHeight,
  canvasWidth,
  canvasHeight,
  isMobileCanvasMode,
}) => {
  if (!canvasWidth || !canvasHeight) return 1;
  if (!availableCanvasWidth) return 1;

  const widthScale = availableCanvasWidth / canvasWidth;
  const heightScale = availableCanvasHeight
    ? availableCanvasHeight / canvasHeight
    : Number.POSITIVE_INFINITY;
  const maxCanvasFitScale = isMobileCanvasMode ? 2.25 : 1;
  const fitScale = Math.min(maxCanvasFitScale, widthScale, heightScale);

  if (isMobileCanvasMode) {
    return Math.max(0.3, fitScale * MOBILE_CANVAS_SCALE_SAFETY_FACTOR);
  }

  return Math.max(0.3, fitScale);
};

export const resolveMobileCanvasViewportHeight = ({
  canvasViewportHeight,
  displayCanvasHeight,
  topHudClearance,
  bottomHudClearance,
}) => {
  if (canvasViewportHeight) {
    return Math.max(1, Math.round(canvasViewportHeight));
  }

  return Math.max(1, Math.round(displayCanvasHeight + topHudClearance + bottomHudClearance + 8));
};
