import { useEffect, useRef, useState } from 'react';
import { keyframes } from '@emotion/react';
import { Box, Button, Flex, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import {
  PORT_MERIDIAN_CREDIT_REGISTRY,
  PORT_MERIDIAN_CREDIT_SCOPE,
  PORT_MERIDIAN_CREDIT_STATUS,
  PORT_MERIDIAN_CREDIT_SUMMARY,
} from '../../data/portMeridianCredits';
import getAssetUrl from '../../utils/assets/assetUrl';

const makeAssetUrl = (relativePath) => {
  if (!relativePath) {
    return relativePath;
  }

  return encodeURI(getAssetUrl(relativePath));
};

const FILE_ICON_SHEET = makeAssetUrl(
  '/city-v2/tiled/device-shell-art/computer_icons_asset_pack_v1.1/file_icons.png'
);
const BUTTON_ICON_SHEET = makeAssetUrl(
  '/city-v2/tiled/device-shell-art/computer_icons_asset_pack_v1.1/buttons.png'
);
const MONITOR_SHEET = makeAssetUrl(
  '/city-v2/tiled/device-shell-art/monitors_terminals/Pixel Art Computers/Computer Monitor Asset Pack Rev 1 (1).png'
);
const MONITOR_SHEET_COLUMNS = 15;
const MONITOR_SHEET_ROWS = 8;
const DESKTOP_MONITOR_TILE = { col: 6, row: 0 };

const FILE_ICON_CELL = 32;
const FILE_ICON_SHEET_WIDTH = 192;
const FILE_ICON_SHEET_HEIGHT = 160;
const BUTTON_ICON_CELL = 32;
const BUTTON_ICON_SHEET_WIDTH = 384;
const BUTTON_ICON_SHEET_HEIGHT = 128;
const AD_STRIP_FRAME_COUNT = 23;
const AD_STRIP_FRAME_WIDTH = 140;
const AD_STRIP_FRAME_HEIGHT = 60;
const AD_STRIP_FRAME_DURATION_MS = 150;

const PIXEL_FONT = "'Courier New', 'IBM Plex Mono', monospace";

const PALETTE = {
  border: '#1b1714',
  deepShadow: '#100f0d',
  desktopText: '#f6f3eb',
  face: '#d4d0c8',
  faceMuted: '#c0baae',
  faceSoft: '#dfdbd2',
  highlight: '#fbf8f0',
  noticeInfo: '#dde5f4',
  noticeSuccess: '#d6ead7',
  noticeWarning: '#efe0c5',
  overlay: 'rgba(8, 9, 12, 0.72)',
  panel: '#f2eee5',
  select: '#001f7a',
  selectSoft: '#dfe7ff',
  shadow: '#4a463d',
  terminal: '#111111',
  terminalText: '#f2f0ea',
  title: '#000080',
  titleSoft: '#0f2a91',
  titleText: '#f7f5ef',
  warning: '#8a4e15',
  success: '#175b31',
  text: '#1e1b16',
  subduedText: '#5b564d',
};

const BEVEL_RAISED = `inset 2px 2px 0 ${PALETTE.highlight}, inset -2px -2px 0 ${PALETTE.shadow}, inset 1px 1px 0 #ffffff, inset -1px -1px 0 ${PALETTE.deepShadow}`;
const BEVEL_SUNKEN = `inset 2px 2px 0 ${PALETTE.shadow}, inset -2px -2px 0 ${PALETTE.highlight}, inset 1px 1px 0 ${PALETTE.deepShadow}, inset -1px -1px 0 #ffffff`;
const AD_STRIP_KEYFRAMES = keyframes`
  from {
    background-position: 0% 0%;
  }

  to {
    background-position: 100% 0%;
  }
`;
const ANOMALY_CARD_KEYFRAMES = keyframes`
  0%,
  100% {
    filter: brightness(1) contrast(1);
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  9% {
    filter: brightness(1.22) contrast(1.18);
    transform: translate3d(-1px, 0, 0);
  }

  11% {
    filter: brightness(0.86) contrast(1.28);
    opacity: 0.9;
    transform: translate3d(1px, 0, 0);
  }

  13% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  41% {
    filter: brightness(1.18) contrast(1.22);
  }

  43% {
    filter: brightness(1.38) contrast(1.4);
  }

  45% {
    filter: brightness(0.9) contrast(1.12);
  }
`;
const ANOMALY_GHOST_TEXT_KEYFRAMES = keyframes`
  0%,
  100% {
    opacity: 0.18;
    transform: translate3d(0, 0, 0);
  }

  14% {
    opacity: 0.68;
    transform: translate3d(1px, -1px, 0);
  }

  16% {
    opacity: 0;
    transform: translate3d(-2px, 1px, 0);
  }

  22% {
    opacity: 0.56;
    transform: translate3d(-1px, 0, 0);
  }

  58% {
    opacity: 0.32;
    transform: translate3d(1px, 0, 0);
  }
`;
const ANOMALY_STRIP_KEYFRAMES = keyframes`
  0%,
  100% {
    filter: brightness(1) contrast(1);
    opacity: 1;
  }

  10% {
    filter: brightness(1.5) contrast(1.32) saturate(1.34);
  }

  12% {
    opacity: 0.82;
  }

  14% {
    opacity: 1;
  }

  47% {
    filter: brightness(0.82) contrast(1.26);
  }

  52% {
    filter: brightness(1.36) contrast(1.44);
  }
`;
const DESKTOP_ICON_GLITCH_KEYFRAMES = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    filter: brightness(1) saturate(1);
  }

  14% {
    transform: translate3d(-1px, 0, 0);
    filter: brightness(1.24) saturate(1.18);
  }

  18% {
    transform: translate3d(1px, 0, 0);
    filter: brightness(0.86) saturate(1.34);
  }

  44% {
    transform: translate3d(0, -1px, 0);
    filter: brightness(1.18) saturate(1.22);
  }

  48% {
    transform: translate3d(0, 1px, 0);
    filter: brightness(0.94) saturate(1.28);
  }
`;
const DESKTOP_ICON_PROMPT_KEYFRAMES = keyframes`
  0%,
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  50% {
    opacity: 0.58;
    transform: translate3d(0, -1px, 0);
  }
`;
const DESKTOP_ICON_BEACON_KEYFRAMES = keyframes`
  0%,
  100% {
    box-shadow: ${BEVEL_RAISED}, 0 0 0 1px rgba(111, 236, 255, 0.34), 0 0 12px rgba(255, 117, 219, 0.18);
  }

  50% {
    box-shadow: ${BEVEL_RAISED}, 0 0 0 1px rgba(111, 236, 255, 0.72), 0 0 18px rgba(255, 117, 219, 0.34);
  }
`;
const SHELL_SCANLINE_DRIFT_KEYFRAMES = keyframes`
  0% {
    background-position: 0 0, 0 0;
  }

  100% {
    background-position: 0 160px, 0 40px;
  }
`;
const RETRO_SCROLLBAR_SX = {
  scrollbarColor: `${PALETTE.shadow} ${PALETTE.faceMuted}`,
  scrollbarWidth: 'auto',
  '&::-webkit-scrollbar': {
    width: '14px',
    height: '14px',
  },
  '&::-webkit-scrollbar-button': {
    display: 'block',
    background: PALETTE.face,
    border: `1px solid ${PALETTE.border}`,
    boxShadow: BEVEL_RAISED,
    height: '14px',
    width: '14px',
  },
  '&::-webkit-scrollbar-track': {
    background: PALETTE.faceMuted,
    borderLeft: `1px solid ${PALETTE.border}`,
    borderTop: `1px solid ${PALETTE.border}`,
    boxShadow: BEVEL_SUNKEN,
  },
  '&::-webkit-scrollbar-thumb': {
    background: PALETTE.face,
    border: `1px solid ${PALETTE.border}`,
    boxShadow: BEVEL_RAISED,
  },
  '&::-webkit-scrollbar-corner': {
    background: PALETTE.faceMuted,
  },
};

const FILE_SPRITES = {
  anomaly: { col: 2, row: 2 },
  app: { col: 4, row: 2 },
  archive: { col: 5, row: 0 },
  browser: { col: 5, row: 1 },
  code: { col: 1, row: 3 },
  document: { col: 1, row: 0 },
  download: { col: 3, row: 2 },
  folder: { col: 1, row: 1 },
  image: { col: 3, row: 1 },
  notice: { col: 2, row: 0 },
  relay: { col: 1, row: 3 },
  spreadsheet: { col: 0, row: 4 },
};

const BUTTON_SPRITES = {
  close: { col: 0, row: 0 },
};

const makeAnimatedStripAsset = (relativePath) => ({
  type: 'animated-strip',
  src: makeAssetUrl(relativePath),
  frameCount: AD_STRIP_FRAME_COUNT,
  frameWidth: AD_STRIP_FRAME_WIDTH,
  frameHeight: AD_STRIP_FRAME_HEIGHT,
  frameDurationMs: AD_STRIP_FRAME_DURATION_MS,
});

const AD_STRIP_ASSETS = {
  marketTicker: makeAnimatedStripAsset(
    '/city-v2/tiled/device-shell-art/ads/animated-ads-cyberpunk-pixel-art/1 Ads/5.png'
  ),
  newsTicker: makeAnimatedStripAsset(
    '/city-v2/tiled/device-shell-art/ads/animated-ads-cyberpunk-pixel-art/1 Ads/1.png'
  ),
  hypnoTicker: makeAnimatedStripAsset(
    '/city-v2/tiled/device-shell-art/ads/animated-cyberpunk-ads-pixel-art-pack-2/1 Ads/1.png'
  ),
  noSignalTicker: makeAnimatedStripAsset(
    '/city-v2/tiled/device-shell-art/ads/animated-cyberpunk-ads-pixel-art-pack-2/1 Ads/5.png'
  ),
};

const AD_TILE_ASSETS = {
  futureSignal: {
    banner: makeAssetUrl(
      '/city-v2/tiled/device-shell-art/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/128x64/15.png'
    ),
    icon: makeAssetUrl(
      '/city-v2/tiled/device-shell-art/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/64x64/15.png'
    ),
  },
  streetLife: {
    banner: makeAssetUrl(
      '/city-v2/tiled/device-shell-art/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/128x64/10.png'
    ),
    icon: makeAssetUrl(
      '/city-v2/tiled/device-shell-art/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/64x64/10.png'
    ),
  },
  winsGum: {
    banner: makeAssetUrl(
      '/city-v2/tiled/device-shell-art/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/128x64/1.png'
    ),
    icon: makeAssetUrl(
      '/city-v2/tiled/device-shell-art/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/64x64/1.png'
    ),
  },
};

const ANOMALY_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%?@!';
const DEFAULT_DESKTOP_ICON_PROMPTS = ['PRESS ME', 'CLICK ME', 'RUN ME', 'OPEN ME'];

function getSpriteFromKey(spriteKey, fallback = FILE_SPRITES.document) {
  return FILE_SPRITES[spriteKey] || fallback;
}

function getAdStripAsset(assetKey) {
  return AD_STRIP_ASSETS[assetKey] || null;
}

function getAdTileAsset(assetKey, variant = 'banner') {
  return AD_TILE_ASSETS[assetKey]?.[variant] || null;
}

function buildJumbledText(text, phase) {
  return Array.from(text)
    .map((character, index) => {
      if (!/[A-Za-z0-9]/.test(character)) {
        return character;
      }

      if ((index + phase) % 5 !== 0 && (index * 3 + phase) % 11 !== 0) {
        return character;
      }

      return ANOMALY_GLYPHS[(index * 7 + phase * 13) % ANOMALY_GLYPHS.length];
    })
    .join('');
}

function WindowControlGlyph({ kind }) {
  if (kind === 'minimize') {
    return <Box w="10px" h="2px" bg="currentColor" alignSelf="center" />;
  }

  if (kind === 'restore') {
    return (
      <Box position="relative" w="11px" h="9px">
        <Box
          position="absolute"
          top={0}
          right={0}
          w="8px"
          h="6px"
          border="1px solid currentColor"
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          w="8px"
          h="6px"
          border="1px solid currentColor"
          bg={PALETTE.face}
        />
      </Box>
    );
  }

  return <Box w="10px" h="8px" border="1px solid currentColor" alignSelf="center" />;
}

function WindowControlButton({ kind, isActive = false, onClick }) {
  return (
    <RetroButton minH="24px" minW="28px" px={1.5} py={1} isPrimary={isActive} onClick={onClick}>
      {kind === 'close' ? (
        <ButtonSprite sprite={BUTTON_SPRITES.close} size={11} />
      ) : (
        <WindowControlGlyph kind={kind} />
      )}
    </RetroButton>
  );
}

function SheetSprite({ cellSize, sheet, sheetHeight, sheetWidth, size = 20, sprite }) {
  if (!sprite) {
    return null;
  }

  const scale = size / cellSize;

  return (
    <Box
      flexShrink={0}
      w={`${size}px`}
      h={`${size}px`}
      bgImage={`url(${sheet})`}
      bgPosition={`-${sprite.col * size}px -${sprite.row * size}px`}
      bgRepeat="no-repeat"
      bgSize={`${sheetWidth * scale}px ${sheetHeight * scale}px`}
      sx={{ imageRendering: 'pixelated' }}
    />
  );
}

function FileSprite(props) {
  return (
    <SheetSprite
      cellSize={FILE_ICON_CELL}
      sheet={FILE_ICON_SHEET}
      sheetHeight={FILE_ICON_SHEET_HEIGHT}
      sheetWidth={FILE_ICON_SHEET_WIDTH}
      {...props}
    />
  );
}

function ButtonSprite(props) {
  return (
    <SheetSprite
      cellSize={BUTTON_ICON_CELL}
      sheet={BUTTON_ICON_SHEET}
      sheetHeight={BUTTON_ICON_SHEET_HEIGHT}
      sheetWidth={BUTTON_ICON_SHEET_WIDTH}
      {...props}
    />
  );
}

function AdArtwork({
  asset,
  backgroundPosition = 'center',
  backgroundSize = 'cover',
  dataTestId,
  h,
  w = '100%',
  ...props
}) {
  const assetConfig = typeof asset === 'string' ? { src: asset } : asset || {};
  const { frameCount = 1, frameDurationMs = AD_STRIP_FRAME_DURATION_MS, src } = assetConfig;
  const isAnimatedStrip = assetConfig.type === 'animated-strip' && frameCount > 1;
  const resolvedBackgroundPosition = isAnimatedStrip ? '0% 0%' : backgroundPosition;
  const resolvedBackgroundSize = isAnimatedStrip ? `${frameCount * 100}% 100%` : backgroundSize;
  const animationDurationMs = Math.max(
    frameDurationMs * Math.max(frameCount - 1, 1),
    frameDurationMs
  );

  if (!src) {
    return null;
  }

  return (
    <Box
      data-testid={dataTestId}
      w={w}
      h={h}
      bg="#111318"
      bgImage={`url("${src}")`}
      bgRepeat="no-repeat"
      bgPosition={resolvedBackgroundPosition}
      bgSize={resolvedBackgroundSize}
      animation={
        isAnimatedStrip
          ? `${AD_STRIP_KEYFRAMES} ${animationDurationMs}ms steps(${Math.max(frameCount - 1, 1)}) infinite`
          : undefined
      }
      sx={{
        imageRendering: 'pixelated',
        willChange: isAnimatedStrip ? 'background-position' : 'auto',
      }}
      {...props}
    />
  );
}

function getCreditStatusLabel(status) {
  return PORT_MERIDIAN_CREDIT_STATUS[status]?.label || status;
}

function AnomalousText({ containerProps, dataTestId, text, textProps }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPhase((currentPhase) => (currentPhase + 1) % 17);
    }, 170);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <Box position="relative" minW={0} {...containerProps}>
      <Text
        data-testid={dataTestId ? `${dataTestId}-base` : undefined}
        position="relative"
        zIndex={1}
        textShadow="1px 0 0 rgba(117, 236, 255, 0.45)"
        {...textProps}
      >
        {text}
      </Text>
      <Text
        aria-hidden
        data-testid={dataTestId ? `${dataTestId}-ghost` : undefined}
        position="absolute"
        inset={0}
        zIndex={2}
        pointerEvents="none"
        color="#9ef3ff"
        opacity={0.58}
        textShadow="-1px 0 0 #ff6cd5, 1px 0 0 #5fd9ff"
        animation={`${ANOMALY_GHOST_TEXT_KEYFRAMES} 780ms steps(2, end) infinite`}
        {...textProps}
      >
        {buildJumbledText(text, phase)}
      </Text>
    </Box>
  );
}

function RetroInset({ children, ...props }) {
  return (
    <Box
      bg={PALETTE.panel}
      border="1px solid"
      borderColor={PALETTE.border}
      boxShadow={BEVEL_SUNKEN}
      {...props}
    >
      {children}
    </Box>
  );
}

function RetroButton({ children, isPrimary = false, ...props }) {
  return (
    <Button
      variant="unstyled"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      gap={2}
      minH="36px"
      px={3}
      py={2}
      border="1px solid"
      borderColor={PALETTE.border}
      bg={isPrimary ? PALETTE.title : PALETTE.face}
      color={isPrimary ? PALETTE.titleText : PALETTE.text}
      boxShadow={BEVEL_RAISED}
      fontFamily={PIXEL_FONT}
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0.08em"
      textTransform="uppercase"
      _hover={{ bg: isPrimary ? PALETTE.titleSoft : PALETTE.faceSoft }}
      _active={{ transform: 'translate(1px, 1px)', boxShadow: BEVEL_SUNKEN }}
      _disabled={{
        bg: PALETTE.faceMuted,
        boxShadow: BEVEL_SUNKEN,
        color: PALETTE.subduedText,
        cursor: 'not-allowed',
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function RetroWindow({
  bodyProps,
  children,
  headerActions,
  headerProps,
  subtitle,
  title,
  windowSprite,
  ...props
}) {
  return (
    <Box
      bg={PALETTE.face}
      border="1px solid"
      borderColor={PALETTE.border}
      boxShadow={`${BEVEL_RAISED}, 3px 3px 0 ${PALETTE.deepShadow}`}
      minH={0}
      overflow="hidden"
      {...props}
    >
      <Flex
        align="center"
        gap={2}
        px={2}
        py={1.5}
        bg={PALETTE.title}
        borderBottom="1px solid"
        borderColor={PALETTE.border}
        {...headerProps}
      >
        <FileSprite sprite={windowSprite} size={16} />
        <Text
          color={PALETTE.titleText}
          fontFamily={PIXEL_FONT}
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
          flex="1"
          noOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            color="rgba(247, 245, 239, 0.86)"
            display={{ base: 'none', md: 'block' }}
            fontFamily={PIXEL_FONT}
            fontSize="10px"
            letterSpacing="0.06em"
            textTransform="uppercase"
            noOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
        {headerActions ? <HStack spacing={1}>{headerActions}</HStack> : null}
      </Flex>
      <Box p={{ base: 2.5, md: 3 }} {...bodyProps}>
        {children}
      </Box>
    </Box>
  );
}

function DesktopIconButton({ icon, onActivate }) {
  const isBeckoning = icon.status === 'beckoning';
  const promptPhrases = icon.promptPhrases?.length
    ? icon.promptPhrases
    : DEFAULT_DESKTOP_ICON_PROMPTS;
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    setPromptIndex(0);

    if (!isBeckoning || promptPhrases.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setPromptIndex((currentIndex) => (currentIndex + 1) % promptPhrases.length);
    }, 760);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [icon.id, isBeckoning, promptPhrases]);

  const captionText = isBeckoning ? promptPhrases[promptIndex] : icon.caption;

  return (
    <Button
      data-testid={`desktop-icon-${icon.id}`}
      variant="unstyled"
      h="auto"
      p={0}
      isDisabled={!icon.clickable}
      alignSelf="flex-start"
      onClick={() => {
        if (icon.clickable) {
          onActivate(icon.id);
        }
      }}
      _disabled={{ cursor: 'default', opacity: 0.9 }}
    >
      <VStack
        align="center"
        spacing={2}
        px={2}
        py={2}
        bg={icon.isSelected ? PALETTE.select : 'transparent'}
        boxShadow={icon.isSelected ? BEVEL_SUNKEN : 'none'}
        transition="background 120ms ease"
      >
        <RetroInset
          bg={PALETTE.face}
          p={1.5}
          animation={
            isBeckoning ? `${DESKTOP_ICON_BEACON_KEYFRAMES} 980ms ease-in-out infinite` : undefined
          }
        >
          <Box
            animation={
              isBeckoning
                ? `${DESKTOP_ICON_GLITCH_KEYFRAMES} 920ms steps(2, end) infinite`
                : undefined
            }
            sx={{ transformOrigin: 'center center' }}
          >
            <FileSprite sprite={FILE_SPRITES[icon.sprite] || FILE_SPRITES.document} size={32} />
          </Box>
        </RetroInset>
        <VStack spacing={1}>
          <Text
            color={PALETTE.desktopText}
            fontFamily={PIXEL_FONT}
            fontSize="xs"
            fontWeight="700"
            textAlign="center"
            textShadow={isBeckoning ? '0 0 6px rgba(98, 232, 255, 0.42)' : undefined}
          >
            {icon.label}
          </Text>
          {captionText ? (
            <Text
              color={isBeckoning ? '#ffd8f7' : 'rgba(246, 243, 235, 0.82)'}
              fontFamily={PIXEL_FONT}
              fontSize="10px"
              letterSpacing="0.04em"
              textAlign="center"
              textTransform="uppercase"
              textShadow={
                isBeckoning
                  ? '0 0 7px rgba(255, 111, 211, 0.42), 0 0 3px rgba(111, 236, 255, 0.34)'
                  : undefined
              }
              animation={
                isBeckoning
                  ? `${DESKTOP_ICON_PROMPT_KEYFRAMES} 620ms steps(2, end) infinite`
                  : undefined
              }
            >
              {captionText}
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </Button>
  );
}

function getInitialPopupLayout(position, surfaceSize) {
  const width = Math.min(356, Math.max(284, Math.round(surfaceSize.width * 0.34)));
  const height = Math.min(280, Math.max(248, Math.round(surfaceSize.height * 0.38)));
  const layouts = {
    'bottom-left': { x: 18, y: surfaceSize.height - height - 18 },
    'bottom-right': { x: surfaceSize.width - width - 18, y: surfaceSize.height - height - 18 },
    'center-left': {
      x: 22,
      y: Math.max(18, Math.round(surfaceSize.height * 0.38) - Math.round(height / 2)),
    },
    'center-right': {
      x: surfaceSize.width - width - 22,
      y: Math.max(18, Math.round(surfaceSize.height * 0.4) - Math.round(height / 2)),
    },
    'top-right': { x: surfaceSize.width - width - 18, y: 18 },
  };

  return {
    width,
    height,
    ...(layouts[position] || layouts['top-right']),
  };
}

function clampPopupLayout(layout, surfaceSize) {
  const width = Math.min(layout.width, Math.max(284, surfaceSize.width - 12));
  const height = Math.min(layout.height, Math.max(248, surfaceSize.height - 12));
  const maxX = Math.max(6, surfaceSize.width - width - 6);
  const maxY = Math.max(6, surfaceSize.height - height - 6);

  return {
    width,
    height,
    x: Math.min(Math.max(6, layout.x), maxX),
    y: Math.min(Math.max(6, layout.y), maxY),
  };
}

function BrowserPopup({ isMinimized, onDismiss, onMinimize, popup, surfaceSize, zIndex }) {
  const [layout, setLayout] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (!surfaceSize.width || !surfaceSize.height || layout) {
      return;
    }

    setLayout(getInitialPopupLayout(popup.position, surfaceSize));
  }, [layout, popup.position, surfaceSize]);

  useEffect(() => {
    if (!surfaceSize.width || !surfaceSize.height) {
      return;
    }

    setLayout((currentLayout) => {
      if (!currentLayout) {
        return currentLayout;
      }

      const nextLayout = clampPopupLayout(currentLayout, surfaceSize);
      if (
        nextLayout.x === currentLayout.x &&
        nextLayout.y === currentLayout.y &&
        nextLayout.width === currentLayout.width &&
        nextLayout.height === currentLayout.height
      ) {
        return currentLayout;
      }

      return nextLayout;
    });
  }, [surfaceSize]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', dragStateRef.current?.moveHandler);
      window.removeEventListener('pointerup', dragStateRef.current?.upHandler);
    };
  }, []);

  const popupWindowLayout = isMaximized
    ? clampPopupLayout(
        {
          x: 10,
          y: 10,
          width: Math.max(252, surfaceSize.width - 20),
          height: Math.max(164, surfaceSize.height - 20),
        },
        surfaceSize
      )
    : layout;

  if (!popupWindowLayout || isMinimized) {
    return null;
  }

  const handleDragStart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const startingLayout = layout;
    const originX = event.clientX;
    const originY = event.clientY;

    const moveHandler = (moveEvent) => {
      setLayout(
        clampPopupLayout(
          {
            ...startingLayout,
            x: startingLayout.x + (moveEvent.clientX - originX),
            y: startingLayout.y + (moveEvent.clientY - originY),
          },
          surfaceSize
        )
      );
    };

    const upHandler = () => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      dragStateRef.current = null;
    };

    dragStateRef.current = { moveHandler, upHandler };
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler, { once: true });
  };

  const applyResizeLayout = (elementRef) => {
    setLayout((currentLayout) => {
      if (!currentLayout) {
        return currentLayout;
      }

      return clampPopupLayout(
        {
          ...currentLayout,
          width: elementRef.offsetWidth,
          height: elementRef.offsetHeight,
        },
        surfaceSize
      );
    });
  };

  return (
    <Resizable
      size={{ width: popupWindowLayout.width, height: popupWindowLayout.height }}
      minWidth={284}
      minHeight={248}
      maxWidth={Math.max(284, surfaceSize.width - 8)}
      maxHeight={Math.max(248, surfaceSize.height - 8)}
      enable={
        isMaximized
          ? {
              top: false,
              right: false,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }
          : undefined
      }
      onResize={(event, direction, elementRef) => {
        if (!isMaximized) {
          applyResizeLayout(elementRef);
        }
      }}
      onResizeStop={(event, direction, elementRef) => {
        if (!isMaximized) {
          applyResizeLayout(elementRef);
        }
      }}
      style={{ position: 'absolute', left: popupWindowLayout.x, top: popupWindowLayout.y, zIndex }}
    >
      <RetroWindow
        title={popup.title}
        windowSprite={getSpriteFromKey(popup.sprite, FILE_SPRITES.archive)}
        h="100%"
        display="flex"
        flexDirection="column"
        bodyProps={{ display: 'flex', flex: 1, flexDirection: 'column', p: 0, minH: 0 }}
        headerProps={{
          cursor: isMaximized ? 'default' : 'move',
          onPointerDown: isMaximized ? undefined : handleDragStart,
          userSelect: 'none',
          style: { touchAction: 'none' },
        }}
        headerActions={
          <HStack spacing={1}>
            <WindowControlButton kind="minimize" onClick={() => onMinimize(popup.id)} />
            <WindowControlButton
              kind={isMaximized ? 'restore' : 'maximize'}
              isActive={isMaximized}
              onClick={() => setIsMaximized((currentValue) => !currentValue)}
            />
            <WindowControlButton kind="close" onClick={() => onDismiss(popup.id)} />
          </HStack>
        }
      >
        <Stack
          spacing={2.5}
          p={3}
          flex={1}
          minH={0}
          overflowY="auto"
          overflowX="hidden"
          sx={{
            ...RETRO_SCROLLBAR_SX,
            scrollbarGutter: 'stable',
          }}
        >
          {popup.bannerAsset ? (
            <RetroInset bg={PALETTE.faceSoft} p={1.5}>
              <AdArtwork
                asset={getAdTileAsset(popup.bannerAsset, 'banner')}
                dataTestId={`popup-banner-${popup.id}`}
                h="70px"
                backgroundSize="contain"
              />
            </RetroInset>
          ) : null}
          {popup.adIcons?.length ? (
            <HStack spacing={1.5} flexWrap="wrap">
              {popup.adIcons.map((adIcon) => (
                <RetroInset key={`${popup.id}-${adIcon}`} bg={PALETTE.faceSoft} p={1.5}>
                  <AdArtwork
                    asset={getAdTileAsset(adIcon, 'icon')}
                    h="28px"
                    w="28px"
                    backgroundSize="contain"
                  />
                </RetroInset>
              ))}
            </HStack>
          ) : null}
          <Text
            color={PALETTE.text}
            fontFamily={PIXEL_FONT}
            fontSize="xs"
            lineHeight="1.45"
            whiteSpace="normal"
            overflowWrap="anywhere"
            wordBreak="break-word"
          >
            {popup.body}
          </Text>
          <RetroButton alignSelf="flex-start" mt="auto" onClick={() => onDismiss(popup.id)}>
            {popup.buttonLabel}
          </RetroButton>
        </Stack>
      </RetroWindow>
    </Resizable>
  );
}

function BrowserWindow({
  isMaximized,
  onMinimizeWindow,
  onCloseBrowserWindow,
  onDismissBrowserPopup,
  onFeedItemSelect,
  onMinimizePopup,
  onToggleMaximize,
  popupState,
  snapshot,
}) {
  const popupSurfaceRef = useRef(null);
  const [popupSurfaceSize, setPopupSurfaceSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const popupSurfaceNode = popupSurfaceRef.current;
    if (!popupSurfaceNode) {
      return undefined;
    }

    const updatePopupSurfaceSize = () => {
      setPopupSurfaceSize({
        width: popupSurfaceNode.clientWidth,
        height: popupSurfaceNode.clientHeight,
      });
    };

    updatePopupSurfaceSize();

    const resizeObserver = new ResizeObserver(updatePopupSurfaceSize);
    resizeObserver.observe(popupSurfaceNode);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <RetroWindow
      title={snapshot.browser.windowTitle}
      subtitle={snapshot.browser.tabLabel}
      windowSprite={FILE_SPRITES.browser}
      h="100%"
      display="flex"
      flexDirection="column"
      bodyProps={{ display: 'flex', flex: 1, flexDirection: 'column', minH: 0, p: 2 }}
      headerActions={
        <HStack spacing={1}>
          <WindowControlButton kind="minimize" onClick={onMinimizeWindow} />
          <WindowControlButton
            kind={isMaximized ? 'restore' : 'maximize'}
            isActive={isMaximized}
            onClick={onToggleMaximize}
          />
          <WindowControlButton kind="close" onClick={onCloseBrowserWindow} />
        </HStack>
      }
    >
      <Stack spacing={1.5} flex={1} minH={0} overflow="hidden">
        <HStack align="stretch" spacing={2} minW={0}>
          <RetroButton minW="36px" px={2}>
            <Text as="span">&lt;</Text>
          </RetroButton>
          <RetroButton minW="36px" px={2}>
            <Text as="span">&gt;</Text>
          </RetroButton>
          <RetroInset flex={1} minW={0} px={3} py={2}>
            <HStack spacing={2}>
              <FileSprite sprite={FILE_SPRITES.browser} size={18} />
              <Text color={PALETTE.text} fontFamily={PIXEL_FONT} fontSize="xs" noOfLines={1}>
                {snapshot.browser.address}
              </Text>
            </HStack>
          </RetroInset>
        </HStack>

        <Box position="relative" flex={1} minH={0} ref={popupSurfaceRef} overflow="hidden">
          <RetroInset h="100%" display="flex" flexDirection="column" overflow="hidden" p={0}>
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              minW={0}
              px={3}
              py={2}
              borderBottom="1px solid"
              borderColor={PALETTE.border}
              bg={PALETTE.faceSoft}
            >
              <Text
                color={PALETTE.text}
                fontFamily={PIXEL_FONT}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
              >
                Sponsored apartment intake
              </Text>
              <Text
                color={PALETTE.subduedText}
                fontFamily={PIXEL_FONT}
                fontSize="10px"
                textTransform="uppercase"
              >
                Scrollable local feed
              </Text>
            </Flex>

            <Box
              data-testid="browser-feed-scroll"
              flex={1}
              minH={0}
              overflowY="auto"
              overflowX="hidden"
              p={3}
              pr={2}
              pb={3}
              overscrollBehavior="contain"
              sx={{
                ...RETRO_SCROLLBAR_SX,
                scrollbarGutter: 'stable',
              }}
            >
              <VStack align="stretch" spacing={3}>
                {snapshot.feedItems.map((item) => {
                  const isAnomalous = item.id === snapshot.anomalousFeedItemId;
                  const isActive = item.id === snapshot.activeFeedItemId;

                  return (
                    <Button
                      key={item.id}
                      data-testid={`shell-feed-item-${item.id}`}
                      variant="unstyled"
                      display="block"
                      h="auto"
                      p={0}
                      w="100%"
                      minW={0}
                      onClick={() => onFeedItemSelect(item.id)}
                    >
                      <Stack
                        spacing={0}
                        w="100%"
                        minW={0}
                        position="relative"
                        bg={isActive ? PALETTE.select : isAnomalous ? '#ece3d2' : PALETTE.face}
                        border="1px solid"
                        borderColor={isAnomalous ? '#4e7088' : PALETTE.border}
                        boxShadow={
                          isAnomalous
                            ? `${isActive ? BEVEL_SUNKEN : BEVEL_RAISED}, 0 0 0 1px rgba(122, 224, 255, 0.6), 0 0 12px rgba(255, 108, 213, 0.18)`
                            : isActive
                              ? BEVEL_SUNKEN
                              : BEVEL_RAISED
                        }
                        textAlign="left"
                        animation={
                          isAnomalous
                            ? `${ANOMALY_CARD_KEYFRAMES} 1680ms steps(2, end) infinite`
                            : undefined
                        }
                      >
                        <Flex
                          align={{ base: 'stretch', lg: 'start' }}
                          direction={{ base: 'column', lg: 'row' }}
                          gap={3}
                          w="100%"
                          minW={0}
                          px={3}
                          py={3}
                          minH={{ base: 'auto', lg: '128px' }}
                        >
                          <Flex align="start" gap={3} flex={1} minW={0}>
                            <Box
                              animation={
                                isAnomalous
                                  ? `${ANOMALY_STRIP_KEYFRAMES} 1320ms steps(2, end) infinite`
                                  : undefined
                              }
                            >
                              <RetroInset
                                bg={isActive ? PALETTE.selectSoft : PALETTE.panel}
                                p={1.5}
                              >
                                <AdArtwork
                                  asset={getAdTileAsset(item.bannerAsset, 'icon')}
                                  h="42px"
                                  w="42px"
                                  backgroundSize="contain"
                                />
                              </RetroInset>
                            </Box>
                            <Box flex={1} minW={0} maxW="100%">
                              {isAnomalous ? (
                                <>
                                  <AnomalousText
                                    dataTestId={`anomaly-category-${item.id}`}
                                    text={item.category}
                                    textProps={{
                                      color: isActive ? PALETTE.titleText : PALETTE.subduedText,
                                      fontFamily: PIXEL_FONT,
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      letterSpacing: '0.08em',
                                      textTransform: 'uppercase',
                                      overflowWrap: 'anywhere',
                                      whiteSpace: 'normal',
                                    }}
                                  />
                                  <AnomalousText
                                    containerProps={{ mt: 1 }}
                                    dataTestId={`anomaly-headline-${item.id}`}
                                    text={item.headline}
                                    textProps={{
                                      color: isActive ? PALETTE.titleText : PALETTE.text,
                                      fontFamily: PIXEL_FONT,
                                      fontSize: 'sm',
                                      fontWeight: '700',
                                      lineHeight: '1.4',
                                      whiteSpace: 'normal',
                                      overflowWrap: 'anywhere',
                                      wordBreak: 'break-word',
                                    }}
                                  />
                                  <AnomalousText
                                    containerProps={{ mt: 1.5 }}
                                    dataTestId={`anomaly-body-${item.id}`}
                                    text={item.body}
                                    textProps={{
                                      color: isActive
                                        ? 'rgba(247, 245, 239, 0.88)'
                                        : PALETTE.subduedText,
                                      fontFamily: PIXEL_FONT,
                                      fontSize: 'xs',
                                      lineHeight: '1.5',
                                      whiteSpace: 'normal',
                                      overflowWrap: 'anywhere',
                                      wordBreak: 'break-word',
                                    }}
                                  />
                                </>
                              ) : (
                                <>
                                  <Text
                                    color={isActive ? PALETTE.titleText : PALETTE.subduedText}
                                    fontFamily={PIXEL_FONT}
                                    fontSize="10px"
                                    fontWeight="700"
                                    letterSpacing="0.08em"
                                    textTransform="uppercase"
                                    overflowWrap="anywhere"
                                    whiteSpace="normal"
                                  >
                                    {item.category}
                                  </Text>
                                  <Text
                                    color={isActive ? PALETTE.titleText : PALETTE.text}
                                    fontFamily={PIXEL_FONT}
                                    fontSize="sm"
                                    fontWeight="700"
                                    mt={1}
                                    lineHeight="1.4"
                                    whiteSpace="normal"
                                    overflowWrap="anywhere"
                                    wordBreak="break-word"
                                  >
                                    {item.headline}
                                  </Text>
                                  <Text
                                    color={
                                      isActive ? 'rgba(247, 245, 239, 0.88)' : PALETTE.subduedText
                                    }
                                    fontFamily={PIXEL_FONT}
                                    fontSize="xs"
                                    lineHeight="1.5"
                                    mt={1.5}
                                    whiteSpace="normal"
                                    overflowWrap="anywhere"
                                    wordBreak="break-word"
                                  >
                                    {item.body}
                                  </Text>
                                </>
                              )}
                            </Box>
                          </Flex>

                          {item.stripAsset ? (
                            <Stack
                              spacing={1}
                              flexShrink={0}
                              alignSelf={{ base: 'stretch', lg: 'center' }}
                              w={{ base: '100%', lg: '172px' }}
                              minW={{ base: '100%', lg: '172px' }}
                            >
                              <Text
                                color={isActive ? 'rgba(247, 245, 239, 0.88)' : PALETTE.subduedText}
                                fontFamily={PIXEL_FONT}
                                fontSize="10px"
                                fontWeight="700"
                                letterSpacing="0.08em"
                                textTransform="uppercase"
                              >
                                sponsor loop
                              </Text>
                              <Box
                                animation={
                                  isAnomalous
                                    ? `${ANOMALY_STRIP_KEYFRAMES} 860ms steps(2, end) infinite`
                                    : undefined
                                }
                              >
                                <RetroInset
                                  bg={isActive ? PALETTE.selectSoft : PALETTE.panel}
                                  p={1}
                                >
                                  <AdArtwork
                                    asset={getAdStripAsset(item.stripAsset)}
                                    dataTestId={`feed-strip-${item.id}`}
                                    w="100%"
                                    aspectRatio={`${AD_STRIP_FRAME_WIDTH} / ${AD_STRIP_FRAME_HEIGHT}`}
                                  />
                                </RetroInset>
                              </Box>
                            </Stack>
                          ) : null}
                        </Flex>
                      </Stack>
                    </Button>
                  );
                })}
              </VStack>
            </Box>
          </RetroInset>

          {snapshot.browser.popups.map((popup, index) => (
            <BrowserPopup
              key={popup.id}
              isMinimized={popupState[popup.id]?.minimized}
              popup={popup}
              surfaceSize={popupSurfaceSize}
              zIndex={4 + index}
              onDismiss={onDismissBrowserPopup}
              onMinimize={onMinimizePopup}
            />
          ))}
        </Box>
      </Stack>
    </RetroWindow>
  );
}

function RelayTerminalWindow({ onConfirmTerminalChoice, snapshot }) {
  const showTerminalActions =
    snapshot.terminal.status === 'typing' || snapshot.terminal.status === 'awaiting-confirmation';
  const terminalActionsEnabled = snapshot.terminal.status === 'awaiting-confirmation';
  const keepTerminalExpanded =
    showTerminalActions ||
    snapshot.terminal.status === 'downloading' ||
    snapshot.terminal.status === 'complete';
  const outputScrollRef = useRef(null);

  useEffect(() => {
    const outputScrollNode = outputScrollRef.current;
    if (!outputScrollNode) {
      return;
    }

    outputScrollNode.scrollTop = outputScrollNode.scrollHeight;
  }, [snapshot.terminal.logs, snapshot.terminal.progress, snapshot.terminal.status]);

  return (
    <RetroWindow
      title="Relay Terminal"
      subtitle="Typed command and download handshake"
      windowSprite={FILE_SPRITES.code}
      h="100%"
      display="flex"
      flexDirection="column"
      bodyProps={{ display: 'flex', flex: 1, flexDirection: 'column', minH: 0 }}
    >
      <Stack spacing={3} flex={1} minH={0} overflow="hidden">
        <RetroInset px={3} py={2.5}>
          <Text
            color={PALETTE.subduedText}
            fontFamily={PIXEL_FONT}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Injected command
          </Text>
          <Text
            mt={2}
            color={PALETTE.text}
            fontFamily={PIXEL_FONT}
            fontSize={{ base: 'xs', md: 'sm' }}
            wordBreak="break-all"
          >
            {snapshot.terminal.typedCommand}
            {snapshot.terminal.status === 'typing' ? '_' : ''}
          </Text>
        </RetroInset>

        <Box
          data-testid="relay-terminal-output"
          flex={1}
          minH={keepTerminalExpanded ? '118px' : '96px'}
          bg={PALETTE.terminal}
          border="1px solid"
          borderColor={PALETTE.border}
          boxShadow={BEVEL_SUNKEN}
          px={3}
          py={3}
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Text
            color="rgba(242, 240, 234, 0.76)"
            fontFamily={PIXEL_FONT}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Terminal output
          </Text>
          <Stack
            ref={outputScrollRef}
            mt={2}
            spacing={1.5}
            flex={1}
            minH={0}
            overflowY="auto"
            pr={2}
            sx={{
              ...RETRO_SCROLLBAR_SX,
              scrollbarGutter: 'stable',
            }}
          >
            {snapshot.terminal.logs.map((entry, index) => (
              <Text
                key={`${entry}-${index}`}
                color={PALETTE.terminalText}
                fontFamily={PIXEL_FONT}
                fontSize="xs"
                overflowWrap="anywhere"
                wordBreak="break-word"
              >
                {entry}
              </Text>
            ))}
          </Stack>
        </Box>

        {showTerminalActions ? (
          <HStack
            data-testid="relay-terminal-actions"
            spacing={3}
            align="stretch"
            flexWrap="wrap"
            flexShrink={0}
          >
            <RetroButton
              isPrimary
              isDisabled={!terminalActionsEnabled}
              onClick={() => onConfirmTerminalChoice('yes')}
            >
              Yes, run it
            </RetroButton>
            <RetroButton
              isDisabled={!terminalActionsEnabled}
              onClick={() => onConfirmTerminalChoice('no')}
            >
              No
            </RetroButton>
            <RetroButton
              isDisabled={!terminalActionsEnabled}
              onClick={() => onConfirmTerminalChoice('later')}
            >
              Not now
            </RetroButton>
          </HStack>
        ) : null}

        {snapshot.terminal.status === 'downloading' || snapshot.terminal.status === 'complete' ? (
          <Stack spacing={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <Text color={PALETTE.text} fontFamily={PIXEL_FONT} fontSize="xs" fontWeight="700">
                codegrind.exe transfer
              </Text>
              <Text color={PALETTE.text} fontFamily={PIXEL_FONT} fontSize="xs" fontWeight="700">
                {snapshot.terminal.progress}%
              </Text>
            </Flex>
            <Box
              position="relative"
              h="22px"
              bg={PALETTE.panel}
              border="1px solid"
              borderColor={PALETTE.border}
              boxShadow={BEVEL_SUNKEN}
              overflow="hidden"
            >
              <Box h="100%" w={`${snapshot.terminal.progress}%`} bg={PALETTE.title} />
              <Text
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color={snapshot.terminal.progress > 50 ? PALETTE.titleText : PALETTE.text}
                fontFamily={PIXEL_FONT}
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                Transfer in progress
              </Text>
            </Box>
          </Stack>
        ) : null}
      </Stack>
    </RetroWindow>
  );
}

function MonitorShell({ children, transitionPhase = 'open' }) {
  const backgroundPosition = `${(DESKTOP_MONITOR_TILE.col / (MONITOR_SHEET_COLUMNS - 1)) * 100}% ${(DESKTOP_MONITOR_TILE.row / (MONITOR_SHEET_ROWS - 1)) * 100}%`;
  const monitorTransform =
    transitionPhase === 'open'
      ? 'perspective(1800px) translate3d(0, 0, 0) scale(1) rotateX(0deg)'
      : transitionPhase === 'closing'
        ? 'perspective(1800px) translate3d(0, -36px, 0) scale(1.08) rotateX(-9deg)'
        : 'perspective(1800px) translate3d(0, 62px, 0) scale(0.74) rotateX(14deg)';
  const monitorFilter =
    transitionPhase === 'open'
      ? 'blur(0px) brightness(1) saturate(1)'
      : transitionPhase === 'closing'
        ? 'blur(10px) brightness(0.84) saturate(0.74)'
        : 'blur(20px) brightness(0.74) saturate(0.58)';
  const monitorOpacity =
    transitionPhase === 'open' ? 1 : transitionPhase === 'closing' ? 0.72 : 0.8;

  return (
    <Flex
      align="center"
      justify="center"
      w="100%"
      h="100%"
      px={1}
      py={1}
      opacity={monitorOpacity}
      transform={monitorTransform}
      filter={monitorFilter}
      transition="transform 520ms cubic-bezier(0.16, 0.9, 0.24, 1), filter 520ms cubic-bezier(0.16, 0.9, 0.24, 1), opacity 340ms ease"
      sx={{ transformOrigin: 'center center', willChange: 'transform, filter, opacity' }}
    >
      <Box position="relative" w="100%" h="100%">
        <Box
          position="absolute"
          inset={0}
          filter="drop-shadow(0 18px 24px rgba(0, 0, 0, 0.48))"
          style={{
            backgroundImage: `url("${MONITOR_SHEET}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${MONITOR_SHEET_COLUMNS * 100}% ${MONITOR_SHEET_ROWS * 100}%`,
            backgroundPosition,
            imageRendering: 'pixelated',
          }}
        />

        <Box
          data-city-shell-monitor-screen="true"
          position="absolute"
          top="15.5%"
          right="9.5%"
          bottom="9.5%"
          left="9.5%"
          bg="#05080b"
          borderRadius="4px"
          border="1px solid rgba(5, 5, 5, 0.92)"
          boxShadow="0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 2px rgba(0,0,0,0.68)"
          overflow="hidden"
          zIndex={1}
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

function formatDesktopClock() {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

function DesktopTaskbar({
  isStartMenuOpen,
  items,
  onCloseShell,
  onItemActivate,
  onStartMenuAction,
  onStartToggle,
  startMenuActions = [],
  startMenuDescription = 'Exit the shell and return to the apartment.',
  startMenuTitle = 'Safehouse controls',
}) {
  return (
    <Flex
      position="absolute"
      right={0}
      bottom={0}
      left={0}
      align="center"
      gap={2}
      px={2}
      py={1.5}
      bg={PALETTE.face}
      borderTop="1px solid"
      borderColor={PALETTE.border}
      boxShadow={BEVEL_RAISED}
      zIndex={4}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Box position="relative" flexShrink={0}>
        <RetroButton
          minH="30px"
          px={3}
          minW="92px"
          isPrimary={isStartMenuOpen}
          onClick={onStartToggle}
        >
          <FileSprite sprite={FILE_SPRITES.app} size={16} />
          <Text as="span">Start</Text>
        </RetroButton>

        {isStartMenuOpen ? (
          <Box
            position="absolute"
            left={0}
            bottom="calc(100% + 6px)"
            w="248px"
            bg={PALETTE.face}
            border="1px solid"
            borderColor={PALETTE.border}
            boxShadow={`${BEVEL_RAISED}, 4px 4px 0 ${PALETTE.deepShadow}`}
            p={2}
          >
            <Text
              color={PALETTE.text}
              fontFamily={PIXEL_FONT}
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              {startMenuTitle}
            </Text>
            <Text
              mt={1}
              color={PALETTE.subduedText}
              fontFamily={PIXEL_FONT}
              fontSize="10px"
              lineHeight="1.4"
            >
              {startMenuDescription}
            </Text>
            <RetroButton mt={2} w="100%" justifyContent="flex-start" onClick={onCloseShell}>
              <ButtonSprite sprite={BUTTON_SPRITES.close} size={12} />
              <Text as="span">Exit apartment</Text>
            </RetroButton>
            {startMenuActions.map((action) => (
              <RetroButton
                key={action.id}
                mt={2}
                w="100%"
                justifyContent="flex-start"
                onClick={() => onStartMenuAction?.(action.id)}
              >
                <FileSprite
                  sprite={getSpriteFromKey(action.sprite, FILE_SPRITES.browser)}
                  size={12}
                />
                <Text as="span">{action.label}</Text>
              </RetroButton>
            ))}
          </Box>
        ) : null}
      </Box>

      <HStack
        spacing={2}
        flex={1}
        minW={0}
        overflowX="auto"
        overflowY="hidden"
        sx={RETRO_SCROLLBAR_SX}
      >
        {items.map((windowItem) => (
          <RetroButton
            key={windowItem.id}
            minH="30px"
            px={3}
            maxW="220px"
            isPrimary={windowItem.isActive}
            onClick={() => onItemActivate(windowItem.id)}
          >
            <FileSprite sprite={windowItem.sprite} size={16} />
            <Text as="span" noOfLines={1} overflow="hidden" textOverflow="ellipsis">
              {windowItem.label}
            </Text>
          </RetroButton>
        ))}
      </HStack>

      <RetroInset minW="92px" px={3} py={1.5}>
        <Text
          color={PALETTE.text}
          fontFamily={PIXEL_FONT}
          fontSize="10px"
          fontWeight="700"
          letterSpacing="0.06em"
          textAlign="center"
          textTransform="uppercase"
        >
          {formatDesktopClock()}
        </Text>
      </RetroInset>
    </Flex>
  );
}

function DesktopAmbientAds({ ads }) {
  if (!ads?.length) {
    return null;
  }

  return (
    <VStack position="absolute" top={14} right={4} align="stretch" spacing={3} w="240px" zIndex={1}>
      {ads.map((ad) => (
        <RetroInset key={ad.id} bg="rgba(229, 223, 210, 0.92)" p={2}>
          <AdArtwork
            asset={getAdTileAsset(ad.bannerAsset, 'banner')}
            h="64px"
            backgroundSize="contain"
          />
          <HStack mt={2.5} spacing={2.5} align="start">
            <RetroInset bg={PALETTE.faceSoft} p={1.5}>
              <AdArtwork
                asset={getAdTileAsset(ad.iconAsset, 'icon')}
                h="34px"
                w="34px"
                backgroundSize="contain"
              />
            </RetroInset>
            <Box flex={1} minW={0}>
              <Text
                color={PALETTE.text}
                fontFamily={PIXEL_FONT}
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
                overflowWrap="anywhere"
              >
                {ad.label}
              </Text>
              <Text
                mt={1}
                color={PALETTE.subduedText}
                fontFamily={PIXEL_FONT}
                fontSize="10px"
                lineHeight="1.4"
                overflowWrap="anywhere"
                wordBreak="break-word"
              >
                {ad.body}
              </Text>
            </Box>
          </HStack>
        </RetroInset>
      ))}
    </VStack>
  );
}

function CreditsWindow({ onCloseCreditsWindow }) {
  return (
    <RetroWindow
      title="Port Meridian Credits"
      subtitle="Port Meridian + shell attribution registry"
      windowSprite={FILE_SPRITES.notice}
      h="100%"
      display="flex"
      flexDirection="column"
      headerActions={<WindowControlButton kind="close" onClick={onCloseCreditsWindow} />}
      bodyProps={{ display: 'flex', flex: 1, flexDirection: 'column', minH: 0 }}
    >
      <Stack spacing={3} flex={1} minH={0} overflow="hidden">
        <RetroInset px={3} py={2.5}>
          <Text
            color={PALETTE.text}
            fontFamily={PIXEL_FONT}
            fontSize="xs"
            fontWeight="700"
            lineHeight="1.6"
          >
            {PORT_MERIDIAN_CREDIT_SCOPE}
          </Text>
          <Text
            mt={2}
            color={PALETTE.subduedText}
            fontFamily={PIXEL_FONT}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {PORT_MERIDIAN_CREDIT_SUMMARY.creatorCount} creators //{' '}
            {PORT_MERIDIAN_CREDIT_SUMMARY.packCount} sources //{' '}
            {PORT_MERIDIAN_CREDIT_SUMMARY.activePackCount} in build //{' '}
            {PORT_MERIDIAN_CREDIT_SUMMARY.stagedPackCount} staged
          </Text>
        </RetroInset>

        <Box
          data-testid="project-credits-window"
          flex={1}
          minH={0}
          bg={PALETTE.panel}
          border="1px solid"
          borderColor={PALETTE.border}
          boxShadow={BEVEL_SUNKEN}
          p={3}
          overflow="hidden"
        >
          <Stack
            spacing={3}
            h="100%"
            overflowY="auto"
            pr={2}
            sx={{
              ...RETRO_SCROLLBAR_SX,
              scrollbarGutter: 'stable',
            }}
          >
            {PORT_MERIDIAN_CREDIT_REGISTRY.map((entry) => (
              <RetroInset key={entry.id} px={3} py={2.5}>
                <Text color={PALETTE.text} fontFamily={PIXEL_FONT} fontSize="xs" fontWeight="700">
                  {entry.creator}
                </Text>
                <Stack spacing={2} mt={2}>
                  {entry.items.map((item) => (
                    <Box
                      key={`${entry.id}-${item.title}`}
                      border="1px solid"
                      borderColor={PALETTE.border}
                      bg={PALETTE.faceSoft}
                      boxShadow={BEVEL_SUNKEN}
                      px={2.5}
                      py={2}
                    >
                      <Flex justify="space-between" align="flex-start" gap={3}>
                        <Text
                          color={PALETTE.text}
                          fontFamily={PIXEL_FONT}
                          fontSize="xs"
                          fontWeight="700"
                          lineHeight="1.5"
                        >
                          {item.title}
                        </Text>
                        <Box
                          as="span"
                          px={1.5}
                          py={1}
                          bg={item.status === 'active' ? PALETTE.noticeSuccess : PALETTE.noticeInfo}
                          color={item.status === 'active' ? PALETTE.success : PALETTE.title}
                          border="1px solid"
                          borderColor={PALETTE.border}
                          boxShadow={BEVEL_RAISED}
                          flexShrink={0}
                        >
                          <Text
                            color="inherit"
                            fontFamily={PIXEL_FONT}
                            fontSize="10px"
                            fontWeight="700"
                            letterSpacing="0.08em"
                            lineHeight="1"
                            textTransform="uppercase"
                          >
                            {getCreditStatusLabel(item.status)}
                          </Text>
                        </Box>
                      </Flex>
                      <Text
                        mt={1.5}
                        color={PALETTE.subduedText}
                        fontFamily={PIXEL_FONT}
                        fontSize="11px"
                        lineHeight="1.6"
                      >
                        {item.usage}
                      </Text>
                      {item.details?.length ? (
                        <Text
                          mt={1.5}
                          color={PALETTE.subduedText}
                          fontFamily={PIXEL_FONT}
                          fontSize="10px"
                          lineHeight="1.7"
                        >
                          Items used: {item.details.join(', ')}
                        </Text>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              </RetroInset>
            ))}
          </Stack>
        </Box>
      </Stack>
    </RetroWindow>
  );
}

function DesktopShellRenderer({
  onCloseBrowserWindow,
  onCloseCreditsWindow,
  onClose,
  onConfirmTerminalChoice,
  onDismissBrowserPopup,
  onFeedItemSelect,
  onIconActivate,
  onStartMenuAction,
  shellTransitionPhase = 'open',
  snapshot,
}) {
  const visibleDesktopIcons = snapshot.desktopIcons.filter((icon) => icon.visible);
  const browserIconId = snapshot.desktopIcons.find((icon) => icon.sprite === 'browser')?.id;
  const showTerminalActions =
    snapshot.terminal.status === 'typing' || snapshot.terminal.status === 'awaiting-confirmation';
  const keepTerminalExpanded =
    showTerminalActions ||
    snapshot.terminal.status === 'downloading' ||
    snapshot.terminal.status === 'complete';
  const shellScrimColor =
    shellTransitionPhase === 'open'
      ? PALETTE.overlay
      : shellTransitionPhase === 'entering'
        ? 'rgba(8, 9, 12, 0.16)'
        : 'rgba(8, 9, 12, 0)';
  const shellBackdropFilter =
    shellTransitionPhase === 'open'
      ? 'blur(10px) saturate(1.05)'
      : shellTransitionPhase === 'entering'
        ? 'blur(3px) saturate(0.82)'
        : 'blur(0px) saturate(0.66)';
  const shellSignalSweepTop =
    shellTransitionPhase === 'open' ? '78%' : shellTransitionPhase === 'closing' ? '-12%' : '-26%';
  const shellSignalSweepOpacity =
    shellTransitionPhase === 'open' ? 0.08 : shellTransitionPhase === 'closing' ? 0.34 : 0.88;
  const shellSignalSweepTransform =
    shellTransitionPhase === 'open'
      ? 'scaleY(0.92)'
      : shellTransitionPhase === 'closing'
        ? 'scaleY(0.84)'
        : 'scaleY(1.22)';
  const shellChromaOpacity =
    shellTransitionPhase === 'open' ? 0.12 : shellTransitionPhase === 'closing' ? 0.3 : 0.42;
  const shellChromaTransform =
    shellTransitionPhase === 'open'
      ? 'translateX(0) scaleX(1)'
      : shellTransitionPhase === 'closing'
        ? 'translateX(-1.5%) scaleX(0.97)'
        : 'translateX(1.5%) scaleX(1.04)';
  const shellScanlineOpacity =
    shellTransitionPhase === 'open' ? 0.08 : shellTransitionPhase === 'closing' ? 0.14 : 0.3;
  const shellBloomOpacity =
    shellTransitionPhase === 'open' ? 0.16 : shellTransitionPhase === 'closing' ? 0.24 : 0.36;
  const [isBrowserMinimized, setIsBrowserMinimized] = useState(false);
  const [isBrowserMaximized, setIsBrowserMaximized] = useState(true);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [popupState, setPopupState] = useState({});
  const wallpaperBackground = [
    'linear-gradient(0deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
    snapshot.wallpaper.gradient,
  ].join(', ');

  useEffect(() => {
    if (!snapshot.openWindows.browser) {
      setIsBrowserMinimized(false);
      setIsBrowserMaximized(true);
    }
  }, [snapshot.openWindows.browser]);

  useEffect(() => {
    setPopupState((currentState) => {
      const nextState = {};

      snapshot.browser.popups.forEach((popup) => {
        nextState[popup.id] = currentState[popup.id] || { minimized: false };
      });

      const currentKeys = Object.keys(currentState);
      const nextKeys = Object.keys(nextState);
      const isUnchanged =
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => currentState[key]?.minimized === nextState[key]?.minimized);

      return isUnchanged ? currentState : nextState;
    });
  }, [snapshot.browser.popups]);

  const handleDesktopIconActivate = (iconId) => {
    setIsStartMenuOpen(false);

    if (iconId === browserIconId) {
      setIsBrowserMinimized(false);
      setIsBrowserMaximized(true);
    }

    onIconActivate(iconId);
  };

  const handleBrowserClose = () => {
    setIsStartMenuOpen(false);
    setIsBrowserMinimized(false);
    setIsBrowserMaximized(true);
    onCloseBrowserWindow();
  };

  const handleShellClose = () => {
    setIsStartMenuOpen(false);
    onClose();
  };

  const handleStartMenuAction = (actionId) => {
    setIsStartMenuOpen(false);
    onStartMenuAction?.(actionId);
  };

  const handlePopupMinimize = (popupId) => {
    setPopupState((currentState) => ({
      ...currentState,
      [popupId]: {
        ...(currentState[popupId] || {}),
        minimized: true,
      },
    }));
  };

  const taskbarItems = [
    snapshot.openWindows.browser
      ? {
          id: 'browser',
          isActive: !isBrowserMinimized,
          label: 'CrawlNet',
          sprite: FILE_SPRITES.browser,
        }
      : null,
    ...snapshot.browser.popups.map((popup) => ({
      id: `popup:${popup.id}`,
      isActive: !popupState[popup.id]?.minimized,
      label: popup.taskbarLabel || popup.title,
      sprite: getSpriteFromKey(popup.sprite, FILE_SPRITES.archive),
    })),
    snapshot.openWindows.credits
      ? {
          id: 'credits',
          isActive: true,
          label: 'Project Credits',
          sprite: FILE_SPRITES.document,
        }
      : null,
    snapshot.openWindows.terminal
      ? {
          id: 'terminal',
          isActive: true,
          label: 'Relay Terminal',
          sprite: FILE_SPRITES.code,
        }
      : null,
  ].filter(Boolean);

  const handleTaskbarItemActivate = (itemId) => {
    setIsStartMenuOpen(false);

    if (itemId === 'browser') {
      setIsBrowserMinimized(false);
      setIsBrowserMaximized(true);
      return;
    }

    if (itemId === 'credits' || itemId === 'terminal') {
      return;
    }

    if (!itemId.startsWith('popup:')) {
      return;
    }

    const popupId = itemId.replace('popup:', '');
    setPopupState((currentState) => ({
      ...currentState,
      [popupId]: {
        ...(currentState[popupId] || {}),
        minimized: false,
      },
    }));
  };

  return (
    <Box
      data-testid="city-device-shell-overlay"
      position="absolute"
      inset={0}
      zIndex={12}
      overflow="hidden"
      transition="background-color 280ms cubic-bezier(0.16, 0.9, 0.24, 1), backdrop-filter 420ms cubic-bezier(0.16, 0.9, 0.24, 1)"
      onPointerDown={(event) => event.stopPropagation()}
      sx={{
        backgroundColor: shellScrimColor,
        backdropFilter: shellBackdropFilter,
        willChange: 'background-color, backdrop-filter',
      }}
    >
      <Box position="absolute" inset={0} pointerEvents="none" zIndex={13}>
        <Box
          position="absolute"
          inset={0}
          bgImage="linear-gradient(180deg, rgba(129, 227, 255, 0.1), rgba(129, 227, 255, 0) 28%), repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0 2px, transparent 2px 5px)"
          mixBlendMode="screen"
          opacity={shellScanlineOpacity}
          animation={`${SHELL_SCANLINE_DRIFT_KEYFRAMES} 900ms linear infinite`}
          transition="opacity 260ms ease"
        />
        <Box
          position="absolute"
          inset={0}
          bg="radial-gradient(circle at center, rgba(108, 224, 255, 0.16), transparent 52%), radial-gradient(circle at center, rgba(255, 102, 214, 0.12), transparent 74%)"
          mixBlendMode="screen"
          opacity={shellBloomOpacity}
          transition="opacity 320ms ease"
        />
        <Box
          position="absolute"
          insetX="9%"
          top={shellSignalSweepTop}
          h="32%"
          bg="linear-gradient(180deg, rgba(95, 236, 255, 0), rgba(95, 236, 255, 0.55) 34%, rgba(255, 255, 255, 0.92) 50%, rgba(95, 236, 255, 0) 100%)"
          filter="blur(18px)"
          opacity={shellSignalSweepOpacity}
          transform={shellSignalSweepTransform}
          transition="top 520ms cubic-bezier(0.16, 0.9, 0.24, 1), opacity 360ms ease, transform 520ms cubic-bezier(0.16, 0.9, 0.24, 1)"
        />
        <Box
          position="absolute"
          inset="8% 7%"
          bg="linear-gradient(90deg, rgba(255, 90, 196, 0.2), transparent 28%, transparent 72%, rgba(96, 236, 255, 0.2))"
          mixBlendMode="screen"
          opacity={shellChromaOpacity}
          transform={shellChromaTransform}
          transition="opacity 360ms ease, transform 520ms cubic-bezier(0.16, 0.9, 0.24, 1)"
        />
      </Box>
      <MonitorShell transitionPhase={shellTransitionPhase}>
        <Box
          h="100%"
          bg={PALETTE.faceMuted}
          border="1px solid"
          borderColor={PALETTE.border}
          boxShadow={`${BEVEL_RAISED}, 6px 6px 0 rgba(0, 0, 0, 0.42)`}
          overflow="hidden"
        >
          <Box h="100%" minH={0} p={{ base: 1, md: 1.5 }}>
            <Box
              position="relative"
              h="100%"
              bgImage={wallpaperBackground}
              bgPosition="0 0, 0 0, center"
              bgRepeat="repeat, repeat, no-repeat"
              bgSize="6px 6px, 6px 6px, cover"
              border="1px solid"
              borderColor={PALETTE.border}
              boxShadow={BEVEL_SUNKEN}
              overflow="hidden"
              onPointerDown={() => {
                if (isStartMenuOpen) {
                  setIsStartMenuOpen(false);
                }
              }}
            >
              <Text
                position="absolute"
                top={3}
                left={4}
                color="rgba(246, 243, 235, 0.8)"
                fontFamily={PIXEL_FONT}
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.1em"
                textTransform="uppercase"
                zIndex={1}
              >
                Desktop // {snapshot.wallpaper.label}
              </Text>

              <VStack position="absolute" top={6} left={3} align="start" spacing={3} zIndex={1}>
                {visibleDesktopIcons.map((icon) => (
                  <DesktopIconButton
                    key={icon.id}
                    icon={icon}
                    onActivate={handleDesktopIconActivate}
                  />
                ))}
              </VStack>

              {!snapshot.openWindows.browser ? (
                <DesktopAmbientAds ads={snapshot.desktopAds} />
              ) : null}

              {snapshot.openWindows.browser && !isBrowserMinimized ? (
                <Box
                  position="absolute"
                  top={isBrowserMaximized ? 0 : '8%'}
                  left={isBrowserMaximized ? 0 : '18%'}
                  right={isBrowserMaximized ? 0 : '4%'}
                  bottom={
                    isBrowserMaximized
                      ? '42px'
                      : snapshot.openWindows.terminal
                        ? { base: '39%', lg: '36%' }
                        : '52px'
                  }
                  zIndex={2}
                >
                  <BrowserWindow
                    isMaximized={isBrowserMaximized}
                    onCloseBrowserWindow={handleBrowserClose}
                    onDismissBrowserPopup={onDismissBrowserPopup}
                    onFeedItemSelect={onFeedItemSelect}
                    onMinimizePopup={handlePopupMinimize}
                    onMinimizeWindow={() => setIsBrowserMinimized(true)}
                    onToggleMaximize={() => setIsBrowserMaximized((currentValue) => !currentValue)}
                    popupState={popupState}
                    snapshot={snapshot}
                  />
                </Box>
              ) : null}

              {snapshot.openWindows.terminal ? (
                <Box
                  data-testid="relay-terminal-window"
                  position="absolute"
                  right="4%"
                  bottom={
                    keepTerminalExpanded
                      ? { base: '116px', lg: '98px' }
                      : { base: '84px', lg: '68px' }
                  }
                  w={{ base: 'calc(100% - 12px)', lg: '48%' }}
                  maxW={{ base: 'calc(100% - 12px)', lg: '640px' }}
                  h={keepTerminalExpanded ? { base: '41%', lg: '38%' } : { base: '30%', lg: '28%' }}
                  minW="320px"
                  minH={keepTerminalExpanded ? '320px' : '232px'}
                  zIndex={3}
                >
                  <RelayTerminalWindow
                    onConfirmTerminalChoice={onConfirmTerminalChoice}
                    snapshot={snapshot}
                  />
                </Box>
              ) : null}

              {snapshot.openWindows.credits ? (
                <Box
                  data-testid="project-credits-shell-window"
                  position="absolute"
                  left={{ base: '6px', lg: '8%' }}
                  top={{ base: '54px', lg: '10%' }}
                  w={{ base: 'calc(100% - 12px)', lg: '44%' }}
                  maxW={{ base: 'calc(100% - 12px)', lg: '580px' }}
                  h={{ base: '50%', lg: '60%' }}
                  minH="340px"
                  zIndex={4}
                >
                  <CreditsWindow onCloseCreditsWindow={onCloseCreditsWindow} />
                </Box>
              ) : null}

              <DesktopTaskbar
                isStartMenuOpen={isStartMenuOpen}
                items={taskbarItems}
                onCloseShell={handleShellClose}
                onItemActivate={handleTaskbarItemActivate}
                onStartMenuAction={handleStartMenuAction}
                onStartToggle={() => setIsStartMenuOpen((currentValue) => !currentValue)}
                startMenuActions={snapshot.startMenuActions}
                startMenuDescription={snapshot.startMenuDescription}
                startMenuTitle={snapshot.startMenuTitle}
              />
            </Box>
          </Box>
        </Box>
      </MonitorShell>
    </Box>
  );
}

export default DesktopShellRenderer;
