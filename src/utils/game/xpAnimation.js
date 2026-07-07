export const getProgressTransitionDuration = ({
  fromPercent = 0,
  toPercent = 0,
  minMs = 1200,
  maxMs = 1800
} = {}) => {
  const clampedFrom = Math.max(0, Math.min(100, Number(fromPercent) || 0));
  const clampedTo = Math.max(0, Math.min(100, Number(toPercent) || 0));
  const delta = Math.abs(clampedTo - clampedFrom);

  if (delta <= 0) {
    return minMs;
  }

  const speedFactor = Math.min(1, delta / 100);
  return Math.round(maxMs - (maxMs - minMs) * speedFactor);
};

export const buildProgressTransition = (durationMs) => `width ${durationMs}ms ease`;

export const getXpNumbersForPercent = ({
  percent = 0,
  toNext = 0,
  showRemaining = true
} = {}) => {
  const safeToNext = Math.max(0, Number(toNext) || 0);
  const clampedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const into = safeToNext
    ? Math.min(safeToNext, Math.round((clampedPercent / 100) * safeToNext))
    : 0;

  return {
    into,
    toNext: safeToNext,
    remaining: showRemaining ? Math.max(0, safeToNext - into) : null
  };
};

export default {
  getProgressTransitionDuration,
  buildProgressTransition,
  getXpNumbersForPercent
};
