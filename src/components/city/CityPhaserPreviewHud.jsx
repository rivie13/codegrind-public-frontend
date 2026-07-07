import { Box, Flex, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import getAssetUrl from '../../utils/assets/assetUrl';

const UI_FONT = "'Tahoma', 'MS Sans Serif', sans-serif";
const COLLECTIBLE_ICON_SRC = getAssetUrl(
  '/city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Software_Internet_Download_Save_to_Disk.png'
);
const HUD_TEXT_SHADOW =
  '0 1px 2px rgba(0, 0, 0, 0.98), 1px 0 1px rgba(0, 0, 0, 0.92), -1px 0 1px rgba(0, 0, 0, 0.92), 0 -1px 1px rgba(0, 0, 0, 0.92), 0 0 6px rgba(0, 0, 0, 0.82)';

const getPlacementStyles = (placement, isCompactViewport) => {
  if (isCompactViewport) {
    return {
      left: '14px',
      right: '12px',
      top: '18px',
    };
  }

  switch (placement) {
    case 'top-right':
      return { right: '20px', top: '20px' };
    case 'bottom-left':
      return { bottom: '20px', left: '20px' };
    case 'bottom-right':
      return { bottom: '20px', right: '20px' };
    case 'top-left':
    default:
      return { left: '24px', top: '24px' };
  }
};

const getCompactObjectiveText = (text) =>
  String(text || '')
    .replace(/^OBJ:\s*/i, '')
    .trim();

const formatLocationLine = (locationLabel) => {
  const resolvedLabel = String(locationLabel || 'District 01').trim();

  if (!resolvedLabel.includes(':')) {
    return resolvedLabel.toUpperCase();
  }

  const [districtLabel, ...rest] = resolvedLabel.split(':');
  return `${districtLabel.trim().toUpperCase()}: ${rest.join(':').trim()}`;
};

const getCollectibleCountText = (collectibleSummaryText) => {
  const resolvedSummary = String(collectibleSummaryText || '').trim();
  const countMatch = resolvedSummary.match(/(\d+\s*\/\s*\d+)/);

  if (countMatch) {
    return countMatch[1].replace(/\s+/g, '');
  }

  return resolvedSummary;
};

export default function CityPhaserPreviewHud({ hidden = false, hudState, zIndex = 2 }) {
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => typeof window !== 'undefined' && (window.innerWidth < 1366 || window.innerHeight <= 768)
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncViewportMode = () => {
      setIsCompactViewport(window.innerWidth < 1366 || window.innerHeight <= 768);
    };

    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    window.addEventListener('orientationchange', syncViewportMode);

    return () => {
      window.removeEventListener('resize', syncViewportMode);
      window.removeEventListener('orientationchange', syncViewportMode);
    };
  }, []);

  if (hidden || !hudState || hudState.presentation !== 'compact-objective') {
    return null;
  }

  const placementStyles = getPlacementStyles(hudState.placement, isCompactViewport);
  const objectiveText = getCompactObjectiveText(hudState.text);
  const locationLine = formatLocationLine(
    hudState.districtLocationLabel || hudState.accentLabel || hudState.title || 'District 01'
  );
  const collectibleCountText = getCollectibleCountText(hudState.collectibleSummaryText);

  return (
    <Box inset="0" pointerEvents="none" position="absolute" zIndex={zIndex}>
      <Box
        data-testid="city-preview-hud-compact-objective"
        position="absolute"
        maxWidth={isCompactViewport ? 'calc(100vw - 24px)' : 'min(46vw, 420px)'}
        {...placementStyles}
      >
        <Text
          color="rgba(249, 251, 255, 0.98)"
          fontFamily={UI_FONT}
          fontSize={isCompactViewport ? '11px' : '12px'}
          fontWeight="700"
          lineHeight="1.35"
          letterSpacing="0.03em"
          textShadow={HUD_TEXT_SHADOW}
          whiteSpace="pre-wrap"
        >
          {locationLine}
        </Text>

        <Text
          mt={0.5}
          color="rgba(249, 251, 255, 0.98)"
          fontFamily={UI_FONT}
          fontSize={isCompactViewport ? '11px' : '12px'}
          fontWeight="700"
          lineHeight="1.35"
          textShadow={HUD_TEXT_SHADOW}
          whiteSpace="pre-wrap"
        >
          {`OBJ: ${objectiveText || hudState.text}`}
        </Text>

        {collectibleCountText ? (
          <Flex mt={0.5} align="center" gap={1.5}>
            <Box
              as="img"
              src={COLLECTIBLE_ICON_SRC}
              alt=""
              aria-hidden="true"
              w="12px"
              h="12px"
              imageRendering="pixelated"
              filter="brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.96))"
            />
            <Text
              color="rgba(249, 251, 255, 0.98)"
              fontFamily={UI_FONT}
              fontSize={isCompactViewport ? '11px' : '12px'}
              fontWeight="700"
              lineHeight="1.2"
              textShadow={HUD_TEXT_SHADOW}
            >
              : {collectibleCountText}
            </Text>
          </Flex>
        ) : null}
      </Box>
    </Box>
  );
}
