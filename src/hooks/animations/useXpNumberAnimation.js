import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const normalizeTarget = (target) => ({
  into: Number.isFinite(target?.into) ? target.into : 0,
  toNext: Number.isFinite(target?.toNext) ? target.toNext : 0,
  remaining: target?.remaining === null
    ? null
    : (Number.isFinite(target?.remaining) ? target.remaining : 0)
});

const useXpNumberAnimation = ({ isOpen, target, durationMs = 650 }) => {
  const [state, setState] = useState(() => normalizeTarget(target));
  const stateRef = useRef(state);
  const rafRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!isOpen) return;

    const start = normalizeTarget(stateRef.current);
    const end = normalizeTarget(target);

    if (durationMs <= 0) {
      setState(end);
      return;
    }

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(progress);
      const lerp = (from, to) => Math.round(from + (to - from) * eased);

      setState({
        into: lerp(start.into, end.into),
        toNext: lerp(start.toNext, end.toNext),
        remaining: end.remaining === null ? null : lerp(start.remaining ?? 0, end.remaining)
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [durationMs, isOpen, target?.into, target?.toNext, target?.remaining]);

  return state;
};

export default useXpNumberAnimation;
