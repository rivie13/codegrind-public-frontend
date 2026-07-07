import { Image } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function CityPhaserAnimatedWindowViewSign({
  animationTickMs,
  backdropRect,
  filter,
  frameDelayMs = 100,
  framePlacement,
  frameSources,
  opacity = 0.98,
  signId,
  transform,
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const usesSharedAnimationTick = Number.isFinite(animationTickMs);

  useEffect(() => {
    if (!usesSharedAnimationTick) {
      return undefined;
    }

    setFrameIndex(0);

    return undefined;
  }, [frameSources, usesSharedAnimationTick]);

  useEffect(() => {
    if (usesSharedAnimationTick) {
      return undefined;
    }

    setFrameIndex(0);

    if (!Array.isArray(frameSources) || frameSources.length <= 1) {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return undefined;
    }

    const resolvedFrameDelayMs = Math.max(1, Number(frameDelayMs) || 100);
    let animationFrameId = null;
    let previousFrameAt = null;

    const advanceFrame = (timestamp) => {
      if (previousFrameAt === null) {
        previousFrameAt = timestamp;
        animationFrameId = window.requestAnimationFrame(advanceFrame);
        return;
      }

      const elapsedMs = timestamp - previousFrameAt;

      if (elapsedMs >= resolvedFrameDelayMs) {
        const frameStepCount = Math.floor(elapsedMs / resolvedFrameDelayMs);
        previousFrameAt += frameStepCount * resolvedFrameDelayMs;
        setFrameIndex(
          (currentFrameIndex) => (currentFrameIndex + frameStepCount) % frameSources.length
        );
      }

      animationFrameId = window.requestAnimationFrame(advanceFrame);
    };

    animationFrameId = window.requestAnimationFrame(advanceFrame);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [frameDelayMs, frameSources, usesSharedAnimationTick]);

  if (!Array.isArray(frameSources) || frameSources.length === 0) {
    return null;
  }

  const resolvedFrameDelayMs = Math.max(1, Number(frameDelayMs) || 100);
  const resolvedFrameIndex = usesSharedAnimationTick
    ? Math.floor(Math.max(animationTickMs, 0) / resolvedFrameDelayMs) % frameSources.length
    : frameIndex;

  const resolvedLeft = backdropRect.left + framePlacement.x * backdropRect.width;
  const resolvedTop = backdropRect.top + framePlacement.y * backdropRect.height;
  const resolvedWidth =
    typeof framePlacement.width === 'number' ? framePlacement.width * backdropRect.width : null;
  const resolvedHeight =
    typeof framePlacement.height === 'number' ? framePlacement.height * backdropRect.height : null;
  const translateX = -100 * (framePlacement.anchorX ?? 0);
  const translateY = -100 * (framePlacement.anchorY ?? 0);
  const resolvedTransform = [`translate(${translateX}%, ${translateY}%)`, transform]
    .filter(Boolean)
    .join(' ');

  return (
    <Image
      src={frameSources[resolvedFrameIndex]}
      alt=""
      aria-hidden="true"
      data-testid={`city-backdrop-sign-${signId}`}
      position="absolute"
      top={`${resolvedTop}px`}
      left={`${resolvedLeft}px`}
      width={resolvedWidth ? `${resolvedWidth}px` : undefined}
      height={resolvedHeight ? `${resolvedHeight}px` : undefined}
      imageRendering="pixelated"
      pointerEvents="none"
      draggable={false}
      filter={filter}
      opacity={opacity}
      transform={resolvedTransform}
      zIndex={0}
    />
  );
}
