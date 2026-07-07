import { Box, Image, Text, VisuallyHidden } from '@chakra-ui/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { getAvatarWidth } from './avatarSizing';
import { CITY_SCENE_ART_SIZE, projectScenePositionToStagePercent } from './sceneProjection';
import { resolveAvatarAsset, getAvatarCandidates } from '../../utils/city/avatarUtils';
import getAssetUrl from '../../utils/assets/assetUrl';

const TravelBackdrop = memo(function TravelBackdrop({ art }) {
  const candidates = useMemo(() => {
    if (!art?.assetPath) return [];

    const primarySrc = getAssetUrl(art.assetPath);
    const fallbackSrc = art.fallbackSrc;
    if (!fallbackSrc || fallbackSrc === primarySrc) {
      return [primarySrc];
    }

    return [primarySrc, fallbackSrc];
  }, [art?.assetPath, art?.fallbackSrc]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidatesKey = candidates.join('|');

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidatesKey]);

  if (candidates.length === 0) return null;

  const src = candidates[candidateIndex] || candidates[0];

  return (
    <Image
      src={src}
      alt={art?.alt || 'District 01 travel transition background'}
      data-testid="city-travel-transition-backdrop"
      position="absolute"
      inset={0}
      w="100%"
      h="100%"
      objectFit="cover"
      onError={() => {
        setCandidateIndex((current) => {
          if (current >= candidates.length - 1) return current;
          return current + 1;
        });
      }}
    />
  );
});

const TravelAvatar = memo(function TravelAvatar({ avatar, stageSize, isMobileViewport = false }) {
  const avatarState = avatar?.state || 'walk';
  const avatarDirection = avatar?.direction || 'south';
  const avatarAsset = resolveAvatarAsset(avatarState, avatarDirection);
  const candidates = useMemo(() => getAvatarCandidates(avatarAsset), [avatarAsset]);
  const candidatesKey = candidates.join('|');
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidatesKey]);

  if (!avatarAsset || candidates.length === 0) return null;

  const src = candidates[candidateIndex] || candidates[0];

  const avatarScale = avatar?.scale || 1.2;
  const avatarMobileScaleBoost = avatar?.mobileScaleBoost || 1;
  const avatarX = avatar?.x ?? 68;
  const avatarY = avatar?.y ?? 78;
  const projectedPosition = projectScenePositionToStagePercent(
    { x: avatarX, y: avatarY },
    stageSize,
    CITY_SCENE_ART_SIZE
  );

  return (
    <Image
      src={src}
      alt={avatarAsset.alt}
      data-avatar-x={avatarX}
      data-avatar-y={avatarY}
      position="absolute"
      left={`${projectedPosition?.x ?? avatarX}%`}
      top={`${projectedPosition?.y ?? avatarY}%`}
      transform="translate(-50%, -100%)"
      w={getAvatarWidth(avatarScale, stageSize, {
        isMobileViewport,
        mobileBoost: avatarMobileScaleBoost,
      })}
      imageRendering="pixelated"
      filter="drop-shadow(0 18px 28px rgba(0, 0, 0, 0.72))"
      zIndex={2}
      onError={() => {
        setCandidateIndex((current) => {
          if (current >= candidates.length - 1) return current;
          return current + 1;
        });
      }}
      pointerEvents="none"
      style={{ willChange: 'left, top, transform' }}
      draggable={false}
    />
  );
});

export default function CityTravelTransition({
  art,
  avatar,
  destinationTitle,
  isMobileViewport = false,
}) {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const nextWidth = rect.width || window.innerWidth || 0;
      const nextHeight = rect.height || window.innerHeight || 0;

      setStageSize((current) => {
        if (current?.width === nextWidth && current?.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    measure();

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => measure());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <Box
      data-testid="city-travel-transition"
      ref={stageRef}
      position="relative"
      overflow="hidden"
      h="100dvh"
      minH="100dvh"
      bg="rgba(4, 7, 13, 0.96)"
    >
      <TravelBackdrop art={art} />
      <TravelAvatar avatar={avatar} stageSize={stageSize} isMobileViewport={isMobileViewport} />
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, rgba(4, 7, 13, 0.16) 0%, rgba(4, 7, 13, 0.08) 38%, rgba(4, 7, 13, 0.3) 72%, rgba(4, 7, 13, 0.58) 100%)"
        pointerEvents="none"
      />
      <VisuallyHidden>
        <Text as="h1">District 01 travel transition</Text>
        <Text>
          {destinationTitle ? `Travelling to ${destinationTitle}` : 'Travelling between scenes.'}
        </Text>
      </VisuallyHidden>
    </Box>
  );
}
