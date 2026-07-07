import { useEffect, useState } from 'react';

import { keyframes } from '@emotion/react';
import {
  Box,
  Flex,
  Grid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from '@chakra-ui/react';
import { resolveHandheldPhoneShellLayout } from './phoneShellLayout';
import getAssetUrl from '../../utils/assets/assetUrl';

const UI_FONT = "'Tahoma', 'MS Sans Serif', sans-serif";
const DEVICE_ART_ROOT = '/city-v2/tiled/device-shell-art';
const ICON_ROOT = `${DEVICE_ART_ROOT}/1-bit_Pixel_Icons/Sprites`;
const WINDOW_FACE = '#d4d0c8';
const WINDOW_LIGHT = '#ffffff';
const WINDOW_SHADOW = '#6f6f6f';
const WINDOW_DARK = '#2d2d2d';
const WINDOW_BLUE = '#000080';
const WINDOW_BODY = '#f3f1eb';
const DEFAULT_PHONE_FRAME_SRC = `${DEVICE_ART_ROOT}/Pixelized_Phone_2/Pixelized_Phone_2/Model_02/Black/front.png`;
const PHONE_SCREEN_CHROME = {
  default: {
    bottom: '4.2%',
    left: '5.3%',
    radius: '18px',
    right: '5.3%',
    top: '5.6%',
  },
  model02: {
    bottom: '14.88%',
    left: '6.25%',
    radius: '8px',
    right: '6.25%',
    top: '8.6%',
  },
};
const STATUS_ICON_SRC = {
  battery: `${ICON_ROOT}/Software_Battery_Power_Level_3_Full.png`,
  calendar: `${ICON_ROOT}/Software_Calendar_Dates_Organizer_Month_1.png`,
  exit: `${ICON_ROOT}/Software_Exit_Quit_Doorway_Button.png`,
  mail: `${ICON_ROOT}/Software_Email_Mailbox_Unread_New_Messages.png`,
  ping: `${ICON_ROOT}/Travel_Bell_Notification_Ringing.png`,
  signal: `${ICON_ROOT}/Software_Mobile_Carrier_Signal_4_Full.png`,
  wifi: `${ICON_ROOT}/Software_WiFi_Wireless_Signal_3.png`,
};
const PHONE_APP_ART = {
  'anomaly-log': {
    accent: '#7a2b68',
    asset: `${ICON_ROOT}/Software_Notepad_Wordpad_Text_Editor.png`,
  },
  clusters: {
    accent: '#7a2b68',
    asset: `${ICON_ROOT}/Map_Markers_Scanner_Sweep_Radar_Detection.png`,
  },
  collectibles: {
    accent: '#7a2b68',
    asset: `${ICON_ROOT}/Software_Internet_Download_Save_to_Disk.png`,
  },
  'crawlnet-browser': {
    accent: '#2452b3',
    asset: `${ICON_ROOT}/Platforms_RSS_Feed_1.png`,
  },
  learning: {
    accent: '#1e6680',
    asset: `${ICON_ROOT}/Tools_Crafting_Books_Manual_Documentation_Reading.png`,
  },
  leaderboards: {
    accent: '#834f0b',
    asset: `${ICON_ROOT}/Software_Statistics_Stats_Graphs_Growth.png`,
  },
  objective: {
    accent: '#0a3ca6',
    asset: `${ICON_ROOT}/Software_Clipbaord_List_File_Copy_Paste.png`,
  },
  profile: {
    accent: '#6c4a9f',
    asset: `${ICON_ROOT}/Travel_Person_People_Two.png`,
  },
  resume: {
    accent: '#8b2d2d',
    asset: `${ICON_ROOT}/Software_Exit_Quit_Doorway_Button.png`,
  },
  settings: {
    accent: '#505050',
    asset: `${ICON_ROOT}/Software_Options_Settings_Cogwheel_Gear_Mechanics.png`,
  },
  travel: {
    accent: '#246a2a',
    asset: `${ICON_ROOT}/Map_Markers_Travel_Map_Folded.png`,
  },
  tunnel: {
    accent: '#2f7a41',
    asset: `${ICON_ROOT}/Travel_Roadway_Tunnel_2.png`,
  },
};
const PHONE_HOME_DECORATIVE_SHORTCUTS = {
  default: [
    {
      accent: '#1e6680',
      asset: `${ICON_ROOT}/Software_Email_Mailbox_Unread_New_Messages.png`,
      caption: 'Unread',
      id: 'mail-shortcut',
      label: 'Mail',
    },
    {
      accent: '#2f7a41',
      asset: `${ICON_ROOT}/Software_Telephone_Call_Handset_Signal_Ringing.png`,
      caption: 'Calls',
      id: 'calls-shortcut',
      label: 'Calls',
    },
    {
      accent: '#8f6b1d',
      asset: `${ICON_ROOT}/Software_File_Folder_Directory_Explorer.png`,
      caption: 'Cache',
      id: 'files-shortcut',
      label: 'Files',
    },
    {
      accent: '#0f6a6c',
      asset: `${ICON_ROOT}/Map_Markers_Travel_Map_Folded.png`,
      caption: 'Route',
      id: 'route-shortcut',
      label: 'Route',
    },
    {
      accent: '#7a2b68',
      asset: `${ICON_ROOT}/Media_Camera_Photo_Shoot_1.png`,
      caption: 'Still',
      id: 'camera-shortcut',
      label: 'Camera',
    },
    {
      accent: '#505050',
      asset: `${ICON_ROOT}/Software_Options_Settings_Cogwheel_Gear_Mechanics.png`,
      caption: 'Audio',
      id: 'prefs-shortcut',
      label: 'Prefs',
    },
  ],
};
const AD_STRIP_FRAME_COUNT = 23;
const AD_STRIP_FRAME_WIDTH = 140;
const AD_STRIP_FRAME_HEIGHT = 60;
const AD_STRIP_FRAME_DURATION_MS = 150;
const ANOMALY_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%?@!';
const PHONE_STATUS_BATTERY_UNAVAILABLE_LABEL = 'N/A';

const PHONE_STATUS_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});
const PHONE_STATUS_WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});
const PHONE_STATUS_DAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
});
const PHONE_STATUS_MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
});

const makeAssetUrl = (relativePath) => {
  if (!relativePath) {
    return relativePath;
  }

  return encodeURI(getAssetUrl(relativePath));
};

const normalizePhoneStatusDatePart = (value) =>
  String(value || '')
    .replace(/\./g, '')
    .toLocaleUpperCase();

const formatPhoneStatusTime = (date) => PHONE_STATUS_TIME_FORMATTER.format(date);

const formatPhoneStatusDate = (date) => {
  const weekday = normalizePhoneStatusDatePart(PHONE_STATUS_WEEKDAY_FORMATTER.format(date));
  const day = PHONE_STATUS_DAY_FORMATTER.format(date);
  const month = normalizePhoneStatusDatePart(PHONE_STATUS_MONTH_FORMATTER.format(date));

  return `${weekday} ${day} ${month}`;
};

const formatPhoneBatteryLabel = (batteryLevel) => {
  if (typeof batteryLevel !== 'number' || Number.isNaN(batteryLevel)) {
    return PHONE_STATUS_BATTERY_UNAVAILABLE_LABEL;
  }

  const clampedLevel = Math.min(Math.max(batteryLevel, 0), 1);
  return `${Math.round(clampedLevel * 100)}%`;
};

const getMsUntilNextMinute = () => {
  const elapsedMs = Date.now() % 60000;

  return elapsedMs === 0 ? 60000 : 60000 - elapsedMs;
};

const makeAnimatedStripAsset = (relativePath) => ({
  frameCount: AD_STRIP_FRAME_COUNT,
  frameDurationMs: AD_STRIP_FRAME_DURATION_MS,
  src: makeAssetUrl(relativePath),
  type: 'animated-strip',
});

const AD_STRIP_ASSETS = {
  hypnoTicker: makeAnimatedStripAsset(
    `${DEVICE_ART_ROOT}/ads/animated-cyberpunk-ads-pixel-art-pack-2/1 Ads/1.png`
  ),
  marketTicker: makeAnimatedStripAsset(
    `${DEVICE_ART_ROOT}/ads/animated-ads-cyberpunk-pixel-art/1 Ads/5.png`
  ),
  newsTicker: makeAnimatedStripAsset(
    `${DEVICE_ART_ROOT}/ads/animated-ads-cyberpunk-pixel-art/1 Ads/1.png`
  ),
  noSignalTicker: makeAnimatedStripAsset(
    `${DEVICE_ART_ROOT}/ads/animated-cyberpunk-ads-pixel-art-pack-2/1 Ads/5.png`
  ),
};

const AD_TILE_ASSETS = {
  futureSignal: {
    banner: makeAssetUrl(
      `${DEVICE_ART_ROOT}/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/128x64/15.png`
    ),
    icon: makeAssetUrl(
      `${DEVICE_ART_ROOT}/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/64x64/15.png`
    ),
  },
  streetLife: {
    banner: makeAssetUrl(
      `${DEVICE_ART_ROOT}/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/128x64/10.png`
    ),
    icon: makeAssetUrl(
      `${DEVICE_ART_ROOT}/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/64x64/10.png`
    ),
  },
  winsGum: {
    banner: makeAssetUrl(
      `${DEVICE_ART_ROOT}/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/128x64/1.png`
    ),
    icon: makeAssetUrl(
      `${DEVICE_ART_ROOT}/ads/Free Billboards and Advertising Cyberpunk Theme/1 Ad/64x64/1.png`
    ),
  },
};

const AD_STRIP_KEYFRAMES = keyframes`
  from {
    background-position: 0% 0%;
  }

  to {
    background-position: 100% 0%;
  }
`;

const PHONE_ANOMALY_CARD_KEYFRAMES = keyframes`
  0%,
  100% {
    transform: translateX(0);
    filter: drop-shadow(0 0 0 rgba(95, 217, 255, 0));
  }

  25% {
    transform: translateX(-1px);
  }

  50% {
    transform: translateX(1px);
    filter: drop-shadow(1px 0 0 rgba(95, 217, 255, 0.4));
  }

  75% {
    transform: translateX(-1px);
    filter: drop-shadow(-1px 0 0 rgba(255, 108, 213, 0.28));
  }
`;

const PHONE_ANOMALY_GHOST_KEYFRAMES = keyframes`
  0%,
  100% {
    opacity: 0.3;
    transform: translate3d(0, 0, 0);
  }

  20% {
    opacity: 0.72;
    transform: translate3d(-1px, 0, 0);
  }

  40% {
    opacity: 0.44;
    transform: translate3d(1px, -1px, 0);
  }

  60% {
    opacity: 0.68;
    transform: translate3d(-1px, 1px, 0);
  }

  80% {
    opacity: 0.5;
    transform: translate3d(1px, 0, 0);
  }
`;

const PHONE_ANOMALY_SCAN_KEYFRAMES = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-140%);
  }

  35% {
    opacity: 0.18;
  }

  100% {
    opacity: 0;
    transform: translateY(180%);
  }
`;

const getShellMotionStyle = (transitionPhase) => {
  switch (transitionPhase) {
    case 'entering':
      return {
        opacity: 0,
        transform: 'translateY(12px) scale(0.985)',
      };
    case 'closing':
      return {
        opacity: 0,
        transform: 'translateY(18px) scale(0.98)',
      };
    case 'open':
    default:
      return {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      };
  }
};

const getPhoneWallpaperSx = (phoneMode) => {
  if (phoneMode === 'intro' || phoneMode === 'hub') {
    return {
      backgroundColor: '#97a1b0',
      backgroundImage:
        'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(122, 133, 149, 0.16) 58%, rgba(70, 77, 92, 0.14)), linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 0 1px, transparent 1px)',
      backgroundSize: 'auto, 18px 18px, 18px 18px',
    };
  }

  return {
    backgroundColor: '#102038',
    backgroundImage:
      'radial-gradient(circle at 20% 18%, rgba(88, 180, 255, 0.24), transparent 22%), linear-gradient(180deg, rgba(12, 18, 34, 0.88), rgba(12, 18, 34, 0.46)), linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 0 1px, transparent 1px)',
    backgroundSize: 'auto, auto, 18px 18px, 18px 18px',
  };
};

const getStatusButtonSx = () => ({
  border: `1px solid ${WINDOW_SHADOW}`,
  bg: WINDOW_FACE,
  boxShadow: `inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`,
  color: WINDOW_DARK,
  fontFamily: UI_FONT,
  fontSize: '9px',
  fontWeight: '700',
  letterSpacing: '0.04em',
  px: 2,
  py: 1,
  textTransform: 'uppercase',
});

const getHomePanelSx = (background) => ({
  border: `1px solid ${WINDOW_SHADOW}`,
  bg: background,
  borderRadius: '4px',
  boxShadow: `inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`,
});

const resolveNotificationAction = ({ note, onAppActivate, onClose }) => {
  if (note?.appId) {
    return () => onAppActivate?.(note.appId);
  }

  if (note?.action === 'close-shell') {
    return () => onClose?.();
  }

  return undefined;
};

const getPhoneScreenChrome = (phoneFrameSrc) => {
  if (phoneFrameSrc.includes('/Model_02/')) {
    return PHONE_SCREEN_CHROME.model02;
  }

  return PHONE_SCREEN_CHROME.default;
};

const rotatePhoneScreenChrome = (phoneScreenChrome) => ({
  bottom: phoneScreenChrome.right,
  left: phoneScreenChrome.bottom,
  radius: phoneScreenChrome.radius,
  right: phoneScreenChrome.top,
  top: phoneScreenChrome.left,
});

const getPhoneAppArt = (appId) => PHONE_APP_ART[appId] || null;

const getAdStripAsset = (assetKey) => AD_STRIP_ASSETS[assetKey] || null;

const getAdTileAsset = (assetKey, variant = 'banner') =>
  AD_TILE_ASSETS[assetKey]?.[variant] || null;

const buildJumbledText = (text, phase) =>
  Array.from(text)
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

const getViewportMetrics = () => {
  if (typeof window === 'undefined') {
    return {
      height: 844,
      width: 390,
    };
  }

  const visualViewport = window.visualViewport;

  return {
    height: Math.max(Math.round(visualViewport?.height || window.innerHeight || 844), 1),
    width: Math.max(Math.round(visualViewport?.width || window.innerWidth || 390), 1),
  };
};

const usePhoneStatusLabels = (snapshot) => {
  const [now, setNow] = useState(() => new Date());
  const [batteryLevel, setBatteryLevel] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (snapshot?.phoneStatusTimeLabel && snapshot?.phoneStatusDateLabel) {
      return undefined;
    }

    let minuteIntervalId = null;

    const syncClock = () => {
      setNow(new Date());
    };

    const minuteTimeoutId = window.setTimeout(() => {
      syncClock();
      minuteIntervalId = window.setInterval(syncClock, 60000);
    }, getMsUntilNextMinute());

    return () => {
      window.clearTimeout(minuteTimeoutId);

      if (minuteIntervalId) {
        window.clearInterval(minuteIntervalId);
      }
    };
  }, [snapshot?.phoneStatusDateLabel, snapshot?.phoneStatusTimeLabel]);

  useEffect(() => {
    if (snapshot?.phoneBatteryLabel) {
      return undefined;
    }

    if (typeof navigator === 'undefined' || typeof navigator.getBattery !== 'function') {
      return undefined;
    }

    let isCancelled = false;
    let batteryManager = null;

    const syncBatteryLevel = () => {
      if (isCancelled) {
        return;
      }

      setBatteryLevel(typeof batteryManager?.level === 'number' ? batteryManager.level : null);
    };

    const connectBatteryManager = async () => {
      try {
        batteryManager = await navigator.getBattery();

        if (isCancelled) {
          return;
        }

        syncBatteryLevel();
        batteryManager.addEventListener?.('levelchange', syncBatteryLevel);
        batteryManager.addEventListener?.('chargingchange', syncBatteryLevel);
      } catch {
        if (!isCancelled) {
          setBatteryLevel(null);
        }
      }
    };

    void connectBatteryManager();

    return () => {
      isCancelled = true;
      batteryManager?.removeEventListener?.('levelchange', syncBatteryLevel);
      batteryManager?.removeEventListener?.('chargingchange', syncBatteryLevel);
    };
  }, [snapshot?.phoneBatteryLabel]);

  return {
    statusBatteryLabel: snapshot?.phoneBatteryLabel || formatPhoneBatteryLabel(batteryLevel),
    statusDateLabel: snapshot?.phoneStatusDateLabel || formatPhoneStatusDate(now),
    statusTimeLabel: snapshot?.phoneStatusTimeLabel || formatPhoneStatusTime(now),
  };
};

function PhoneTunnelTerminalWindow({ isLandscapeReady, onConfirmTerminalChoice, snapshot }) {
  const outputScrollRef = useState(() => ({ current: null }))[0];
  const tunnelState = snapshot?.introTunnel || {
    logs: [],
    progress: 0,
    status: 'hidden',
    typedCommand: '',
  };
  const showTerminalActions =
    tunnelState.status === 'typing' || tunnelState.status === 'awaiting-confirmation';
  const terminalActionsEnabled = tunnelState.status === 'awaiting-confirmation';

  useEffect(() => {
    if (!outputScrollRef.current) {
      return;
    }

    outputScrollRef.current.scrollTop = outputScrollRef.current.scrollHeight;
  }, [outputScrollRef, tunnelState.logs, tunnelState.progress, tunnelState.status]);

  if (!isLandscapeReady) {
    return (
      <Box display="flex" flexDirection="column" gap={3}>
        <Box
          border={`2px solid ${WINDOW_SHADOW}`}
          bg={WINDOW_BODY}
          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
          px={3}
          py={3}
        >
          <Text
            color={WINDOW_BLUE}
            fontFamily={UI_FONT}
            fontSize="10px"
            fontWeight="700"
            textTransform="uppercase"
          >
            Tunnel guard
          </Text>
          <Text
            mt={1}
            color={WINDOW_DARK}
            fontFamily={UI_FONT}
            fontSize="12px"
            fontWeight="700"
            lineHeight="1.5"
          >
            Rotate to landscape. The handheld tunnel terminal only becomes readable in landscape
            mode.
          </Text>
        </Box>

        <Box
          border={`2px solid ${WINDOW_SHADOW}`}
          bg="#f7f7f7"
          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
          px={3}
          py={3}
        >
          <Text
            color={WINDOW_BLUE}
            fontFamily={UI_FONT}
            fontSize="10px"
            fontWeight="700"
            textTransform="uppercase"
          >
            Active note
          </Text>
          <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.5">
            {snapshot.launchNote}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3} minH="100%">
      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg={WINDOW_BODY}
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Injected command
        </Text>
        <Text
          mt={1.5}
          color={WINDOW_DARK}
          fontFamily={UI_FONT}
          fontSize="11px"
          fontWeight="700"
          wordBreak="break-all"
        >
          {tunnelState.typedCommand}
          {tunnelState.status === 'typing' ? '_' : ''}
        </Text>
      </Box>

      <Box
        flex="1"
        minH="160px"
        bg="#06080f"
        border={`2px solid ${WINDOW_SHADOW}`}
        boxShadow={`inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.6)`}
        px={3}
        py={3}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Text
          color="rgba(245, 247, 255, 0.76)"
          fontFamily={UI_FONT}
          fontSize="9px"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Terminal output
        </Text>
        <Box
          ref={(node) => {
            outputScrollRef.current = node;
          }}
          mt={2}
          flex="1"
          minH={0}
          overflowY="auto"
          pr={2}
          sx={{
            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#6f6f6f',
              border: '1px solid #ffffff',
            },
            '&::-webkit-scrollbar-track': {
              background: '#d4d0c8',
            },
            scrollbarColor: '#6f6f6f #d4d0c8',
            scrollbarWidth: 'thin',
          }}
        >
          {tunnelState.logs.map((entry, index) => (
            <Text
              key={`${entry}-${index}`}
              color="#8bf6c2"
              fontFamily={UI_FONT}
              fontSize="10px"
              lineHeight="1.45"
              wordBreak="break-word"
            >
              {entry}
            </Text>
          ))}
        </Box>
      </Box>

      {showTerminalActions ? (
        <Flex gap={2} flexWrap="wrap">
          <Box
            as="button"
            type="button"
            onClick={() => onConfirmTerminalChoice?.('yes')}
            disabled={!terminalActionsEnabled}
            {...getStatusButtonSx()}
          >
            Yes, run it
          </Box>
          <Box
            as="button"
            type="button"
            onClick={() => onConfirmTerminalChoice?.('no')}
            disabled={!terminalActionsEnabled}
            {...getStatusButtonSx()}
          >
            No
          </Box>
          <Box
            as="button"
            type="button"
            onClick={() => onConfirmTerminalChoice?.('later')}
            disabled={!terminalActionsEnabled}
            {...getStatusButtonSx()}
          >
            Not now
          </Box>
        </Flex>
      ) : null}

      {tunnelState.status === 'downloading' || tunnelState.status === 'complete' ? (
        <Box display="flex" flexDirection="column" gap={2}>
          <Flex align="center" justify="space-between" gap={3}>
            <Text color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="10px" fontWeight="700">
              codegrind.exe transfer
            </Text>
            <Text color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="10px" fontWeight="700">
              {tunnelState.progress}%
            </Text>
          </Flex>
          <Box
            position="relative"
            h="22px"
            bg={WINDOW_FACE}
            border={`1px solid ${WINDOW_SHADOW}`}
            boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
            overflow="hidden"
          >
            <Box
              position="absolute"
              insetY={0}
              left={0}
              w={`${tunnelState.progress}%`}
              bg={WINDOW_BLUE}
            />
            <Text
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color={tunnelState.progress > 50 ? '#f5f7ff' : WINDOW_DARK}
              fontFamily={UI_FONT}
              fontSize="9px"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Transfer in progress
            </Text>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function PixelArtImage({ alt = '', boxSize = '16px', src, ...props }) {
  if (!src) {
    return null;
  }

  return (
    <Box
      as="img"
      src={makeAssetUrl(src)}
      alt={alt}
      w={boxSize}
      h={boxSize}
      draggable={false}
      userSelect="none"
      sx={{ imageRendering: 'pixelated' }}
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

function PhoneAnomalousText({ containerProps, text, textProps }) {
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
      <Text position="relative" zIndex={1} {...textProps}>
        {text}
      </Text>
      <Text
        aria-hidden
        position="absolute"
        inset={0}
        zIndex={2}
        pointerEvents="none"
        color="#9ef3ff"
        opacity={0.56}
        textShadow="-1px 0 0 #ff6cd5, 1px 0 0 #5fd9ff"
        animation={`${PHONE_ANOMALY_GHOST_KEYFRAMES} 780ms steps(2, end) infinite`}
        {...textProps}
      >
        {buildJumbledText(text, phase)}
      </Text>
      <Box
        aria-hidden
        position="absolute"
        insetX={0}
        top="50%"
        h="6px"
        zIndex={3}
        pointerEvents="none"
        bg="linear-gradient(90deg, rgba(95, 217, 255, 0), rgba(95, 217, 255, 0.45), rgba(255, 108, 213, 0.35), rgba(95, 217, 255, 0))"
        mixBlendMode="screen"
        animation={`${PHONE_ANOMALY_SCAN_KEYFRAMES} 1240ms linear infinite`}
      />
    </Box>
  );
}

function PhoneShortcutTile({ compact = false, entry }) {
  const isCloseAction = entry.action === 'close-shell';
  const isAnomalousProgram = entry.sourceId === 'codegrind-exe';
  const iconSize = compact ? '18px' : '20px';
  const tileSize = compact ? '34px' : '36px';
  const labelFontSize = compact && isCloseAction ? '7px' : compact ? '7.5px' : '8px';
  const WrapperTag = entry.onClick ? 'button' : 'div';

  return (
    <Box
      as={WrapperTag}
      type={entry.onClick ? 'button' : undefined}
      onClick={entry.onClick}
      disabled={entry.disabled}
      data-phone-home-app={entry.sourceId}
      opacity={entry.disabled ? 0.46 : 1}
      cursor={entry.onClick && !entry.disabled ? 'pointer' : 'default'}
      textAlign="center"
      minW={compact ? (isCloseAction ? '62px' : '58px') : '60px'}
      px={compact ? 1 : 0.5}
      py={0.5}
      bg="transparent"
      color="#10151d"
    >
      <Flex direction="column" align="center" gap={compact ? 1 : 1.5}>
        <Flex
          align="center"
          justify="center"
          w={tileSize}
          h={tileSize}
          border={`1px solid ${WINDOW_SHADOW}`}
          bg={entry.accent}
          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 rgba(0, 0, 0, 0.32)`}
          animation={
            isAnomalousProgram
              ? `${PHONE_ANOMALY_CARD_KEYFRAMES} 1120ms steps(2, end) infinite`
              : undefined
          }
        >
          <PixelArtImage src={entry.asset} boxSize={iconSize} alt="" />
        </Flex>
        <Box
          minW={0}
          maxW={compact ? '68px' : '78px'}
          px={compact ? 1 : 1.25}
          py={compact ? 0.75 : 0.85}
          border={`1px solid ${WINDOW_SHADOW}`}
          bg="rgba(243, 241, 235, 0.94)"
          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 rgba(111, 111, 111, 0.92)`}
        >
          <Text
            color={isAnomalousProgram ? WINDOW_BLUE : '#0f1724'}
            fontFamily={UI_FONT}
            fontSize={labelFontSize}
            fontWeight="700"
            lineHeight="1.15"
            noOfLines={2}
            whiteSpace="normal"
            textShadow={isAnomalousProgram ? '-1px 0 0 rgba(255, 108, 213, 0.32)' : undefined}
          >
            {entry.label}
          </Text>
          {entry.caption ? (
            <Text
              mt={0.5}
              color="rgba(15, 23, 36, 0.7)"
              fontFamily={UI_FONT}
              fontSize="7px"
              fontWeight="700"
              letterSpacing="0.06em"
              textTransform="uppercase"
              noOfLines={1}
            >
              {entry.caption}
            </Text>
          ) : null}
        </Box>
      </Flex>
    </Box>
  );
}

function PhoneGameSettingsWindow({
  availableTracks,
  currentTrack,
  onControlSideChange,
  onToggleHud,
  onToggleMusic,
  onToggleRouteGuide,
  onTrackSelect,
  onVolumeChange,
  selectedTrackId,
  settingsState,
}) {
  const resolvedSettings = settingsState || {
    controlSide: 'right',
    hudEnabled: true,
    musicEnabled: true,
    musicVolume: 0.5,
    routeGuideEnabled: true,
  };
  const resolvedTracks = Array.isArray(availableTracks) ? availableTracks : [];
  const resolvedSelectedTrackId =
    typeof selectedTrackId === 'string' && selectedTrackId.trim()
      ? selectedTrackId.trim()
      : currentTrack?.id || '';
  const musicVolumePercent = Math.round((resolvedSettings.musicVolume || 0) * 100);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg={WINDOW_BODY}
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Music
        </Text>
        <Text
          mt={1}
          color={WINDOW_DARK}
          fontFamily={UI_FONT}
          fontSize="11px"
          fontWeight="700"
          lineHeight="1.5"
        >
          Toggle city music, adjust the playback volume, and pick the track you want on the handheld
          shell.
        </Text>

        <Box
          mt={3}
          border={`1px solid ${WINDOW_SHADOW}`}
          bg="#f7f7f7"
          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
          px={2.5}
          py={2}
        >
          <Text
            color={WINDOW_BLUE}
            fontFamily={UI_FONT}
            fontSize="9px"
            fontWeight="700"
            letterSpacing="0.06em"
            textTransform="uppercase"
          >
            Current Song
          </Text>
          <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" fontWeight="700">
            {currentTrack?.title || 'No track selected'}
          </Text>
          <Text mt={0.5} color="rgba(45,45,45,0.78)" fontFamily={UI_FONT} fontSize="10px">
            {currentTrack?.artist || 'Choose a song from the list below.'}
          </Text>
        </Box>

        <Flex mt={3} align="center" justify="space-between" gap={3} flexWrap="wrap">
          <Box as="button" type="button" onClick={onToggleMusic} {...getStatusButtonSx()}>
            Music {resolvedSettings.musicEnabled ? 'On' : 'Off'}
          </Box>
          <Text
            color={WINDOW_DARK}
            fontFamily={UI_FONT}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.06em"
            textTransform="uppercase"
          >
            Volume {musicVolumePercent}%
          </Text>
        </Flex>

        <Box mt={3} px={1} opacity={resolvedSettings.musicEnabled ? 1 : 0.58}>
          <Slider
            aria-label="Phone music volume"
            colorScheme="blue"
            isDisabled={!resolvedSettings.musicEnabled}
            max={1}
            min={0}
            step={0.01}
            value={resolvedSettings.musicVolume}
            onChange={onVolumeChange}
          >
            <SliderTrack bg="#c5c1b9" border={`1px solid ${WINDOW_SHADOW}`}>
              <SliderFilledTrack bg={WINDOW_BLUE} />
            </SliderTrack>
            <SliderThumb boxSize={4} bg={WINDOW_FACE} border={`1px solid ${WINDOW_SHADOW}`} />
          </Slider>
        </Box>

        <Box
          mt={3}
          border={`1px solid ${WINDOW_SHADOW}`}
          bg="#f7f7f7"
          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
          px={2.5}
          py={2}
        >
          <Text
            color={WINDOW_BLUE}
            fontFamily={UI_FONT}
            fontSize="9px"
            fontWeight="700"
            letterSpacing="0.06em"
            textTransform="uppercase"
          >
            Choose Song
          </Text>
          <Box mt={2} display="flex" flexDirection="column" gap={1.5} maxH="140px" overflowY="auto">
            {resolvedTracks.length > 0 ? (
              resolvedTracks.map((track) => {
                const isSelected = track.id === resolvedSelectedTrackId;

                return (
                  <Box
                    key={track.id}
                    as="button"
                    type="button"
                    display="flex"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    gap={3}
                    width="100%"
                    px={2}
                    py={1.5}
                    border={`1px solid ${WINDOW_SHADOW}`}
                    bg={isSelected ? '#dfe7ff' : WINDOW_FACE}
                    boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                    color={WINDOW_DARK}
                    fontFamily={UI_FONT}
                    textAlign="left"
                    onClick={() => onTrackSelect?.(track.id)}
                    aria-pressed={isSelected}
                    aria-label={`Play ${track.title}`}
                  >
                    <Box minW="0">
                      <Text fontSize="10px" fontWeight="700" lineHeight="1.3" noOfLines={1}>
                        {track.title}
                      </Text>
                      <Text
                        mt={0.5}
                        color="rgba(45,45,45,0.74)"
                        fontSize="9px"
                        lineHeight="1.3"
                        noOfLines={1}
                      >
                        {track.artist || 'Port Meridian audio'}
                      </Text>
                    </Box>
                    <Text
                      color={isSelected ? WINDOW_BLUE : 'rgba(45,45,45,0.62)'}
                      fontSize="8px"
                      fontWeight="700"
                      letterSpacing="0.06em"
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                    >
                      {isSelected ? 'Live' : 'Queue'}
                    </Text>
                  </Box>
                );
              })
            ) : (
              <Text color="rgba(45,45,45,0.78)" fontFamily={UI_FONT} fontSize="10px">
                No tracks are available yet.
              </Text>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg="#f7f7f7"
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Display Aids
        </Text>
        <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.5">
          Toggle the objective HUD and the route guide independently. The route guide also controls
          the live map line inside the phone.
        </Text>

        <Flex mt={3} gap={2} flexWrap="wrap">
          <Box as="button" type="button" onClick={onToggleHud} {...getStatusButtonSx()}>
            HUD {resolvedSettings.hudEnabled === false ? 'Off' : 'On'}
          </Box>
          <Box as="button" type="button" onClick={onToggleRouteGuide} {...getStatusButtonSx()}>
            Route Guide {resolvedSettings.routeGuideEnabled === false ? 'Off' : 'On'}
          </Box>
        </Flex>
      </Box>

      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg="#f7f7f7"
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Touch Controls
        </Text>
        <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.5">
          Pick which side gets the D-pad. The phone and interact buttons move to the opposite side
          automatically.
        </Text>

        <Flex mt={3} gap={2} flexWrap="wrap">
          <Box
            as="button"
            type="button"
            aria-pressed={resolvedSettings.controlSide === 'left'}
            onClick={() => onControlSideChange?.('left')}
            {...getStatusButtonSx()}
            bg={resolvedSettings.controlSide === 'left' ? '#c6d9f5' : WINDOW_FACE}
          >
            D-pad Left
          </Box>
          <Box
            as="button"
            type="button"
            aria-pressed={resolvedSettings.controlSide === 'right'}
            onClick={() => onControlSideChange?.('right')}
            {...getStatusButtonSx()}
            bg={resolvedSettings.controlSide === 'right' ? '#c6d9f5' : WINDOW_FACE}
          >
            D-pad Right
          </Box>
        </Flex>
      </Box>

      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg="#f7f7f7"
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Keyboard Help
        </Text>
        <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.5">
          If desktop WASD or the arrow keys stop moving the room, click back into the preview and
          check for browser shortcut extensions. Vimium and similar tools can capture D or the arrow
          keys before the safehouse preview sees them.
        </Text>
      </Box>
    </Box>
  );
}

const getWorldMarkers = (worldState) =>
  Array.isArray(worldState?.markers) ? worldState.markers : [];

const getWorldMarker = (worldState, pointId) => {
  if (typeof pointId !== 'string' || !pointId.trim()) {
    return null;
  }

  return getWorldMarkers(worldState).find((marker) => marker.id === pointId) || null;
};

const getMapMarkerTone = ({ isObjective, isWaypoint, marker }) => {
  if (isWaypoint) {
    return '#ffd34f';
  }

  if (isObjective) {
    return '#5fd9ff';
  }

  switch (marker?.kind) {
    case 'home':
      return '#c7a7ff';
    case 'learning':
      return '#7fe3ff';
    case 'clusters':
      return '#ef9cff';
    case 'store':
      return '#91f3a1';
    case 'travel':
      return '#f3c46a';
    default:
      return '#d4d0c8';
  }
};

function PhoneObjectiveWindow({ activeWaypointId, objectiveState, onPhoneAction, worldState }) {
  const objectiveMarker = getWorldMarker(worldState, objectiveState?.targetPointId);
  const targetLabel = objectiveState?.targetLabel || objectiveMarker?.label || null;
  const isObjectivePinned =
    Boolean(objectiveState?.targetPointId) && activeWaypointId === objectiveState.targetPointId;

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg={WINDOW_BODY}
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          {objectiveState?.statusLabel || 'Objective'}
        </Text>
        <Text
          mt={1.5}
          color={WINDOW_DARK}
          fontFamily={UI_FONT}
          fontSize="13px"
          fontWeight="700"
          lineHeight="1.45"
        >
          {objectiveState?.title || 'Objective Brief'}
        </Text>
        <Text mt={2} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="12px" lineHeight="1.55">
          {objectiveState?.text}
        </Text>
      </Box>

      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg="#f7f7f7"
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Field link
        </Text>
        <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.55">
          {targetLabel
            ? `${targetLabel} is the current target.`
            : 'No authored target is pinned for this objective yet.'}
          {objectiveState?.footer ? ` ${objectiveState.footer}` : ''}
        </Text>
        {objectiveState?.hotkey ? (
          <Text
            mt={2}
            color={WINDOW_DARK}
            fontFamily={UI_FONT}
            fontSize="10px"
            fontWeight="700"
            textTransform="uppercase"
          >
            Hotkey: {objectiveState.hotkey}
          </Text>
        ) : null}
      </Box>

      {objectiveState?.targetPointId ? (
        <Flex gap={2} flexWrap="wrap">
          <Box
            as="button"
            type="button"
            onClick={() =>
              onPhoneAction?.({
                appId: 'objective',
                id: 'pin-objective',
                label: isObjectivePinned ? 'Unpin Objective' : 'Pin Objective',
                type: 'set-waypoint',
                waypoint: {
                  pointId: isObjectivePinned ? null : objectiveState.targetPointId,
                },
              })
            }
            {...getStatusButtonSx()}
          >
            {isObjectivePinned ? 'Unpin Objective' : 'Pin Objective'}
          </Box>
          {objectiveMarker?.targetPath ? (
            <Box
              as="button"
              type="button"
              onClick={() =>
                onPhoneAction?.({
                  appId: 'objective',
                  id: `open-${objectiveMarker.id}`,
                  label: `Open ${objectiveMarker.label}`,
                  programId: objectiveMarker.label,
                  targetPath: objectiveMarker.targetPath,
                  type: 'launch-program',
                })
              }
              {...getStatusButtonSx()}
            >
              Open {objectiveMarker.label}
            </Box>
          ) : null}
        </Flex>
      ) : null}
    </Box>
  );
}

function PhoneGameMapWindow({
  activeWaypointId,
  onPhoneAction,
  routeGuideEnabled = true,
  worldState,
}) {
  const markers = getWorldMarkers(worldState);
  const activeWaypointMarker = getWorldMarker(worldState, activeWaypointId);
  const hasRouteGuide = Boolean(routeGuideEnabled && worldState?.player && activeWaypointMarker);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg={WINDOW_BODY}
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          {worldState?.locationLabel || 'District Map'}
        </Text>
        <Box
          mt={2.5}
          position="relative"
          h="188px"
          border={`2px solid ${WINDOW_SHADOW}`}
          bg="#09101d"
          boxShadow={`inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.55)`}
          overflow="hidden"
        >
          <Box
            position="absolute"
            inset={0}
            backgroundImage="linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 0 1px, transparent 1px), radial-gradient(circle at 18% 18%, rgba(95, 217, 255, 0.18), transparent 24%)"
            backgroundSize="20px 20px, 20px 20px, auto"
          />

          {hasRouteGuide ? (
            <Box
              as="svg"
              position="absolute"
              inset={0}
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              pointerEvents="none"
              zIndex={2}
            >
              <defs>
                <marker
                  id="phone-map-route-arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="4.2"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="#ffd34f" opacity="0.95" />
                </marker>
              </defs>
              <line
                x1={worldState.player.xPercent}
                y1={worldState.player.yPercent}
                x2={activeWaypointMarker.xPercent}
                y2={activeWaypointMarker.yPercent}
                stroke="rgba(255, 211, 79, 0.28)"
                strokeWidth="2.4"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={worldState.player.xPercent}
                y1={worldState.player.yPercent}
                x2={activeWaypointMarker.xPercent}
                y2={activeWaypointMarker.yPercent}
                stroke="#ffd34f"
                strokeDasharray="2.8 2.2"
                strokeLinecap="round"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
                markerEnd="url(#phone-map-route-arrow)"
              />
            </Box>
          ) : null}

          {markers.map((marker) => {
            const isObjective = marker.id === worldState?.objectivePointId;
            const isWaypoint = marker.id === activeWaypointId;
            const markerTone = getMapMarkerTone({ isObjective, isWaypoint, marker });

            return (
              <Box
                key={marker.id}
                position="absolute"
                left={`${marker.xPercent}%`}
                top={`${marker.yPercent}%`}
                transform="translate(-50%, -50%)"
                textAlign="center"
                zIndex={isWaypoint ? 4 : 3}
              >
                <Box
                  mx="auto"
                  h="12px"
                  w="12px"
                  border={`1px solid ${WINDOW_LIGHT}`}
                  borderRadius={marker.kind === 'travel' ? '2px' : '999px'}
                  bg={markerTone}
                  boxShadow={
                    isWaypoint
                      ? '0 0 0 2px rgba(255, 211, 79, 0.35)'
                      : isObjective
                        ? '0 0 0 2px rgba(95, 217, 255, 0.22)'
                        : 'none'
                  }
                />
              </Box>
            );
          })}

          {worldState?.player ? (
            <Box
              position="absolute"
              left={`${worldState.player.xPercent}%`}
              top={`${worldState.player.yPercent}%`}
              transform="translate(-50%, -50%)"
              textAlign="center"
              zIndex={5}
            >
              <Box
                mx="auto"
                h="12px"
                w="12px"
                border={`1px solid ${WINDOW_DARK}`}
                bg={WINDOW_LIGHT}
                boxShadow="0 0 0 2px rgba(0, 0, 0, 0.2)"
              />
              <Text
                mt="2px"
                color={WINDOW_LIGHT}
                fontFamily={UI_FONT}
                fontSize="7px"
                fontWeight="700"
                letterSpacing="0.04em"
                textTransform="uppercase"
                whiteSpace="nowrap"
              >
                You
              </Text>
            </Box>
          ) : null}
        </Box>
      </Box>

      <Box
        border={`2px solid ${WINDOW_SHADOW}`}
        bg="#f7f7f7"
        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
        px={3}
        py={3}
      >
        <Text
          color={WINDOW_BLUE}
          fontFamily={UI_FONT}
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
        >
          Field link
        </Text>
        <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.55">
          Current area: {worldState?.locationLabel || 'Unknown location'}.
          {activeWaypointMarker
            ? ` Route pinned to ${activeWaypointMarker.label}.`
            : ' No waypoint pinned yet.'}
        </Text>
      </Box>

      {markers.map((marker) => {
        const isObjective = marker.id === worldState?.objectivePointId;
        const isWaypoint = marker.id === activeWaypointId;

        return (
          <Box
            key={`${marker.id}-row`}
            border={`2px solid ${WINDOW_SHADOW}`}
            bg={isWaypoint ? '#fff4c7' : WINDOW_BODY}
            boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
            px={3}
            py={3}
          >
            <Text
              color={WINDOW_BLUE}
              fontFamily={UI_FONT}
              fontSize="10px"
              fontWeight="700"
              textTransform="uppercase"
            >
              {marker.label}
            </Text>
            <Text mt={1} color={WINDOW_DARK} fontFamily={UI_FONT} fontSize="11px" lineHeight="1.55">
              {isObjective
                ? 'Objective target.'
                : marker.targetPath
                  ? 'Linked route available from this marker.'
                  : 'Waypoint marker available for this location.'}
            </Text>
            <Flex mt={2} gap={2} flexWrap="wrap">
              <Box
                as="button"
                type="button"
                onClick={() =>
                  onPhoneAction?.({
                    appId: 'travel',
                    id: `pin-${marker.id}`,
                    label: isWaypoint ? `Unpin ${marker.label}` : `Pin ${marker.label}`,
                    type: 'set-waypoint',
                    waypoint: {
                      pointId: isWaypoint ? null : marker.id,
                    },
                  })
                }
                {...getStatusButtonSx()}
              >
                {isWaypoint ? `Unpin ${marker.label}` : `Pin ${marker.label}`}
              </Box>
              {marker.targetPath ? (
                <Box
                  as="button"
                  type="button"
                  onClick={() =>
                    onPhoneAction?.({
                      appId: 'travel',
                      id: `open-${marker.id}`,
                      label: `Open ${marker.label}`,
                      programId: marker.label,
                      targetPath: marker.targetPath,
                      type: 'launch-program',
                    })
                  }
                  {...getStatusButtonSx()}
                >
                  Open {marker.label}
                </Box>
              ) : null}
            </Flex>
          </Box>
        );
      })}
    </Box>
  );
}

function PhoneShellRenderer({
  onAppActivate,
  onClose,
  onConfirmTerminalChoice,
  onPhoneAction,
  onPhoneControlSideChange,
  onPhoneHudToggle,
  onPhoneTrackSelect,
  onPhoneMusicToggle,
  onPhoneMusicVolumeChange,
  onPhoneRouteGuideToggle,
  phoneAvailableTracks,
  phoneCurrentTrack,
  onFeedItemSelect,
  onHome,
  phoneGameSettings,
  phoneSelectedTrackId,
  shellTransitionPhase,
  snapshot,
  onTunnelReady,
}) {
  const [viewportMetrics, setViewportMetrics] = useState(() => getViewportMetrics());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncViewportMetrics = () => {
      setViewportMetrics(getViewportMetrics());
    };

    const visualViewport = window.visualViewport;

    syncViewportMetrics();
    window.addEventListener('resize', syncViewportMetrics);
    window.addEventListener('orientationchange', syncViewportMetrics);
    visualViewport?.addEventListener('resize', syncViewportMetrics);
    visualViewport?.addEventListener('scroll', syncViewportMetrics);

    return () => {
      window.removeEventListener('resize', syncViewportMetrics);
      window.removeEventListener('orientationchange', syncViewportMetrics);
      visualViewport?.removeEventListener('resize', syncViewportMetrics);
      visualViewport?.removeEventListener('scroll', syncViewportMetrics);
    };
  }, []);

  const isDesktopOverlay = snapshot.deviceClass === 'desktop';
  const shouldRotateLandscapePhone =
    !isDesktopOverlay && viewportMetrics.width > viewportMetrics.height;
  const phoneFrameSrc = snapshot.phoneHardwareFrameSrc || DEFAULT_PHONE_FRAME_SRC;
  const phoneOverlaySrc = phoneFrameSrc.includes('/front.png')
    ? phoneFrameSrc.replace('/front.png', '/empty.png')
    : phoneFrameSrc;
  const phoneScreenChrome = getPhoneScreenChrome(phoneFrameSrc);
  const orientedPhoneScreenChrome = shouldRotateLandscapePhone
    ? rotatePhoneScreenChrome(phoneScreenChrome)
    : phoneScreenChrome;
  const phoneApps = Array.isArray(snapshot.phoneApps) ? snapshot.phoneApps : [];
  const activeApp = phoneApps.find((app) => app.id === snapshot.activePhoneAppId) || null;
  const isHomeView = snapshot.phoneView !== 'app' || !activeApp;
  const homeNotifications = Array.isArray(snapshot.phoneHomeNotifications)
    ? snapshot.phoneHomeNotifications
    : [];
  const primaryNotification = homeNotifications[0] || null;
  const feedItems = Array.isArray(snapshot.feedItems) ? snapshot.feedItems : [];
  const activeFeedItem =
    feedItems.find((item) => item.id === snapshot.activeFeedItemId) || feedItems[0] || null;
  const { statusBatteryLabel, statusDateLabel, statusTimeLabel } = usePhoneStatusLabels(snapshot);
  const showSignalFeed =
    !isHomeView &&
    activeApp?.id === 'crawlnet-browser' &&
    snapshot.signalFeedReady &&
    feedItems.length > 0;
  const isIntroTunnelTerminal = activeApp?.id === 'tunnel' && snapshot?.introTunnel;
  const isLandscapeTunnelTerminalReady = isIntroTunnelTerminal && shouldRotateLandscapePhone;
  const notificationAction = primaryNotification
    ? resolveNotificationAction({ note: primaryNotification, onAppActivate, onClose })
    : undefined;
  const createShortcutEntry = (app) => ({
    action: app.action,
    accent: getPhoneAppArt(app.id)?.accent || '#0a3ca6',
    asset: getPhoneAppArt(app.id)?.asset || STATUS_ICON_SRC.mail,
    caption: app.badge,
    disabled: app.disabled,
    dockOrder: Number.isFinite(app.dockOrder) ? app.dockOrder : null,
    id: app.id,
    label: app.label,
    onClick: () => onAppActivate?.(app.id),
    showOnHome: app.showOnHome !== false,
    sourceId: app.id,
  });
  const appEntries = phoneApps.map(createShortcutEntry);
  const interactiveEntries = appEntries.filter((entry) => entry.action !== 'close-shell');
  const closeActionEntry = appEntries.find((entry) => entry.action === 'close-shell') || null;
  const decorativeShortcuts = Array.isArray(snapshot.phoneDecorativeShortcuts)
    ? snapshot.phoneDecorativeShortcuts
    : PHONE_HOME_DECORATIVE_SHORTCUTS[snapshot.phoneMode] ||
      PHONE_HOME_DECORATIVE_SHORTCUTS.default;
  const explicitDockEntries = appEntries
    .filter((entry) => Number.isFinite(entry.dockOrder))
    .sort((leftEntry, rightEntry) => leftEntry.dockOrder - rightEntry.dockOrder)
    .slice(0, 4);
  const hasExplicitDockEntries = explicitDockEntries.length > 0;
  const dockEntries = hasExplicitDockEntries
    ? explicitDockEntries
    : [
        ...interactiveEntries.slice(0, 3),
        ...(closeActionEntry
          ? [closeActionEntry]
          : decorativeShortcuts
              .slice(0, 1)
              .map((entry) => ({ ...entry, sourceId: undefined, showOnHome: false }))),
      ].slice(0, 4);
  const dockEntryIds = new Set(dockEntries.map((entry) => entry.id));
  const dockEntrySourceIds = new Set(
    dockEntries.map((entry) => entry.sourceId).filter((sourceId) => Boolean(sourceId))
  );
  const desktopEntries = [
    ...interactiveEntries.filter((entry) => {
      if (!entry.showOnHome) {
        return false;
      }

      return !dockEntrySourceIds.has(entry.sourceId);
    }),
    ...decorativeShortcuts
      .filter((entry) => !dockEntryIds.has(entry.id))
      .map((entry) => ({ ...entry, sourceId: undefined })),
  ].slice(0, 8);
  const statusCarrierLabel = snapshot.phoneMode === 'intro' ? 'SAFEHOUSE' : 'PORT MERIDIAN';
  const homeHint = snapshot.phoneHomeHint || 'Tap an app to open it.';
  const footerCopy = isHomeView ? homeHint : snapshot.footerHint;
  const appWindowTitle = activeApp?.windowTitle || activeApp?.label || snapshot.title;
  const showHomeButton = !isIntroTunnelTerminal || snapshot?.introTunnel?.status === 'complete';
  const appCards = Array.isArray(activeApp?.cards) ? activeApp.cards : [];
  const appActions = Array.isArray(activeApp?.actions) ? activeApp.actions : [];
  const objectiveState = snapshot.phoneObjectiveState || null;
  const worldState = snapshot.phoneWorldState || null;
  const activeWaypointId = snapshot.activeWaypointId || worldState?.activeWaypointId || null;
  const phoneArtWidth = 160;
  const phoneArtHeight = 336;
  const isLandscapeHomeLayout = shouldRotateLandscapePhone && isHomeView;
  const shouldUseCompactHomeTiles =
    isLandscapeHomeLayout || (!isDesktopOverlay && snapshot.phoneMode === 'hub');
  const homeContentPaddingX = isLandscapeHomeLayout ? 2 : 2.5;
  const homeContentPaddingY = shouldUseCompactHomeTiles ? 2 : isLandscapeHomeLayout ? 2 : 2.5;
  const homeContentGap = shouldUseCompactHomeTiles ? 2 : isLandscapeHomeLayout ? 2 : 2.5;
  const homeDesktopColumns = isLandscapeHomeLayout
    ? `repeat(${Math.max(Math.min(desktopEntries.length, 6), 1)}, minmax(0, 1fr))`
    : isDesktopOverlay
      ? 'repeat(3, minmax(0, 1fr))'
      : 'repeat(4, minmax(0, 1fr))';
  const handheldShellLayout = resolveHandheldPhoneShellLayout({
    height: viewportMetrics.height,
    phoneArtHeight,
    phoneArtWidth,
    shouldRotateLandscapePhone,
    width: viewportMetrics.width,
  });

  useEffect(() => {
    if (!isLandscapeTunnelTerminalReady) {
      return;
    }

    onTunnelReady?.();
  }, [isLandscapeTunnelTerminalReady, onTunnelReady]);

  return (
    <Box
      position={isDesktopOverlay ? 'absolute' : 'fixed'}
      inset="0"
      zIndex={12}
      bg={isDesktopOverlay ? 'rgba(7, 11, 18, 0.76)' : '#0d0d0d'}
      display="flex"
      alignItems={isDesktopOverlay ? 'flex-start' : 'center'}
      justifyContent="center"
      px={isDesktopOverlay ? 6 : 0}
      py={isDesktopOverlay ? 6 : 0}
      overflowX="hidden"
      overflowY={isDesktopOverlay ? 'auto' : 'hidden'}
    >
      <Box
        data-city-phone-shell="true"
        data-phone-shell-orientation={shouldRotateLandscapePhone ? 'landscape' : 'portrait'}
        position="relative"
        h={isDesktopOverlay ? 'min(88vh, 720px)' : handheldShellLayout.shellHeight}
        w={isDesktopOverlay ? undefined : handheldShellLayout.shellWidth}
        maxH={isDesktopOverlay ? '100%' : undefined}
        maxW={isDesktopOverlay ? '100%' : undefined}
        aspectRatio={isDesktopOverlay ? '160 / 336' : undefined}
        overflow={isDesktopOverlay ? 'visible' : 'hidden'}
        transition="opacity 180ms ease, transform 180ms ease"
        {...getShellMotionStyle(shellTransitionPhase)}
      >
        <Box
          data-phone-screen-surface="true"
          data-phone-screen-orientation={shouldRotateLandscapePhone ? 'landscape' : 'portrait'}
          position="absolute"
          top={orientedPhoneScreenChrome.top}
          right={orientedPhoneScreenChrome.right}
          bottom={orientedPhoneScreenChrome.bottom}
          left={orientedPhoneScreenChrome.left}
          zIndex={1}
          overflow="hidden"
          borderRadius={orientedPhoneScreenChrome.radius}
          bg="#0c1018"
          transition="top 180ms ease, right 180ms ease, bottom 180ms ease, left 180ms ease, border-radius 180ms ease"
        >
          <Box
            h="100%"
            display="flex"
            flexDirection="column"
            sx={getPhoneWallpaperSx(snapshot.phoneMode)}
          >
            <Box
              data-phone-home-layout={isLandscapeHomeLayout ? 'landscape' : 'portrait'}
              h="100%"
              display="flex"
              flexDirection="column"
              px={homeContentPaddingX}
              py={homeContentPaddingY}
              gap={homeContentGap}
              overflowX="hidden"
              overflowY={isDesktopOverlay || isLandscapeHomeLayout ? 'auto' : 'hidden'}
              transition="padding 180ms ease, gap 180ms ease, filter 180ms ease, transform 180ms ease, opacity 180ms ease"
              filter={isHomeView ? 'none' : 'saturate(0.92)'}
              opacity={isHomeView ? 1 : 0.98}
              transform={isHomeView ? 'scale(1)' : 'scale(0.994)'}
              sx={
                isDesktopOverlay || isLandscapeHomeLayout
                  ? {
                      '&::-webkit-scrollbar': {
                        width: '10px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#6f6f6f',
                        border: '1px solid #ffffff',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#d4d0c8',
                      },
                      scrollbarColor: '#6f6f6f #d4d0c8',
                      scrollbarWidth: 'thin',
                    }
                  : undefined
              }
            >
              <Flex align="center" justify="space-between" px="2px">
                <Text
                  color="#f5f7ff"
                  fontFamily={UI_FONT}
                  fontSize={isLandscapeHomeLayout ? '12px' : '14px'}
                  fontWeight="700"
                  letterSpacing="0.02em"
                >
                  {statusTimeLabel}
                </Text>
                <Flex align="center" gap={1.5}>
                  {homeNotifications.length > 0 ? (
                    <PixelArtImage src={STATUS_ICON_SRC.ping} boxSize="11px" />
                  ) : null}
                  <PixelArtImage src={STATUS_ICON_SRC.signal} boxSize="11px" />
                  <PixelArtImage src={STATUS_ICON_SRC.wifi} boxSize="11px" />
                  <PixelArtImage src={STATUS_ICON_SRC.battery} boxSize="11px" />
                  <Text
                    color="#f5f7ff"
                    fontFamily={UI_FONT}
                    fontSize="8px"
                    fontWeight="700"
                    letterSpacing="0.04em"
                  >
                    {statusBatteryLabel}
                  </Text>
                </Flex>
              </Flex>

              <Grid templateColumns="minmax(0, 1.7fr) minmax(72px, 1fr)" gap={2}>
                <Box {...getHomePanelSx(WINDOW_FACE)} overflow="hidden">
                  <Flex
                    align="center"
                    justify="space-between"
                    gap={2}
                    px={2}
                    py={1}
                    bg={WINDOW_BLUE}
                  >
                    <Flex align="center" gap={1}>
                      <PixelArtImage src={STATUS_ICON_SRC.calendar} boxSize="11px" />
                      <Text
                        color="#f5f7ff"
                        fontFamily={UI_FONT}
                        fontSize="8px"
                        fontWeight="700"
                        letterSpacing="0.08em"
                        textTransform="uppercase"
                      >
                        Today
                      </Text>
                    </Flex>
                    <Text
                      color="#d9e7ff"
                      fontFamily={UI_FONT}
                      fontSize="7px"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      noOfLines={1}
                    >
                      {statusDateLabel}
                    </Text>
                  </Flex>
                  <Box px={2.5} py={2.5}>
                    <Text
                      color="#09111d"
                      fontFamily={UI_FONT}
                      fontSize={isLandscapeHomeLayout ? '18px' : '22px'}
                      fontWeight="700"
                      lineHeight="1"
                    >
                      {statusTimeLabel}
                    </Text>
                    <Text
                      mt={1.5}
                      color="#09111d"
                      fontFamily={UI_FONT}
                      fontSize="8px"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                    >
                      {snapshot.phoneHomeTitle}
                    </Text>
                    <Text
                      mt={1.5}
                      color="rgba(9, 17, 29, 0.78)"
                      fontFamily={UI_FONT}
                      fontSize="8px"
                      lineHeight="1.45"
                      noOfLines={isLandscapeHomeLayout ? 1 : 2}
                    >
                      {homeHint}
                    </Text>
                  </Box>
                </Box>

                <Box {...getHomePanelSx(WINDOW_FACE)} overflow="hidden">
                  <Flex align="center" gap={1} px={2} py={1} bg="#2d5b74">
                    <PixelArtImage
                      src={
                        homeNotifications.length > 0 ? STATUS_ICON_SRC.ping : STATUS_ICON_SRC.mail
                      }
                      boxSize="11px"
                    />
                    <Text
                      color="#f5f7ff"
                      fontFamily={UI_FONT}
                      fontSize="8px"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                    >
                      Signals
                    </Text>
                  </Flex>
                  <Box px={2} py={2.5}>
                    <Text
                      color="#09111d"
                      fontFamily={UI_FONT}
                      fontSize="18px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      {homeNotifications.length}
                    </Text>
                    <Text
                      mt={1}
                      color="#09111d"
                      fontFamily={UI_FONT}
                      fontSize="8px"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                    >
                      {homeNotifications.length > 0 ? 'Unread ping' : 'Quiet line'}
                    </Text>
                    <Text
                      mt={1.5}
                      color="rgba(9, 17, 29, 0.72)"
                      fontFamily={UI_FONT}
                      fontSize="7px"
                      lineHeight="1.35"
                      noOfLines={1}
                    >
                      {primaryNotification ? primaryNotification.title : statusCarrierLabel}
                    </Text>
                  </Box>
                </Box>
              </Grid>

              <Box data-phone-home-notifications="true">
                {primaryNotification ? (
                  <Box
                    as={notificationAction ? 'button' : 'div'}
                    type={notificationAction ? 'button' : undefined}
                    data-phone-home-notification={primaryNotification.id}
                    onClick={notificationAction}
                    textAlign="left"
                    w="100%"
                    {...getHomePanelSx(WINDOW_FACE)}
                    overflow="hidden"
                  >
                    <Flex align="center" justify="space-between" gap={2} px={2} py={1} bg="#4b6688">
                      <Flex align="center" gap={1.5} minW={0}>
                        <PixelArtImage src={STATUS_ICON_SRC.ping} boxSize="11px" />
                        <Text
                          color="#f5f7ff"
                          fontFamily={UI_FONT}
                          fontSize="8px"
                          fontWeight="700"
                          letterSpacing="0.06em"
                          textTransform="uppercase"
                          noOfLines={1}
                        >
                          {primaryNotification.title}
                        </Text>
                      </Flex>
                      {primaryNotification.actionLabel ? (
                        <Box
                          flexShrink={0}
                          px={2}
                          py={0.5}
                          border={`1px solid ${WINDOW_SHADOW}`}
                          bg={WINDOW_FACE}
                          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                        >
                          <Text
                            color="#09111d"
                            fontFamily={UI_FONT}
                            fontSize="7px"
                            fontWeight="700"
                            letterSpacing="0.08em"
                            textTransform="uppercase"
                          >
                            {primaryNotification.actionLabel}
                          </Text>
                        </Box>
                      ) : null}
                    </Flex>

                    <Flex align="start" gap={2} px={2.5} py={2.5}>
                      <Flex
                        align="center"
                        justify="center"
                        flexShrink={0}
                        w="34px"
                        h="34px"
                        border={`1px solid ${WINDOW_SHADOW}`}
                        bg={
                          getPhoneAppArt(primaryNotification.appId || 'crawlnet-browser')?.accent ||
                          '#2452b3'
                        }
                        boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 rgba(0, 0, 0, 0.32)`}
                      >
                        <PixelArtImage
                          src={
                            getPhoneAppArt(primaryNotification.appId || 'crawlnet-browser')?.asset
                          }
                          boxSize="18px"
                        />
                      </Flex>
                      <Text
                        color="rgba(9, 17, 29, 0.76)"
                        fontFamily={UI_FONT}
                        fontSize="8px"
                        lineHeight="1.45"
                        noOfLines={isLandscapeHomeLayout ? 1 : 2}
                      >
                        {primaryNotification.message}
                      </Text>
                    </Flex>
                  </Box>
                ) : null}
              </Box>

              <Grid
                data-phone-home-grid="true"
                templateColumns={homeDesktopColumns}
                gap={shouldUseCompactHomeTiles ? 1.5 : 2}
                flex={isLandscapeHomeLayout ? '0 0 auto' : '1 1 auto'}
                minH={0}
                alignContent="start"
                overflowX="hidden"
                overflowY={
                  !isDesktopOverlay && isHomeView && !isLandscapeHomeLayout ? 'auto' : 'visible'
                }
                pb={1}
                sx={
                  !isDesktopOverlay && isHomeView && !isLandscapeHomeLayout
                    ? {
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#6f6f6f',
                          border: '1px solid #ffffff',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(212, 208, 200, 0.94)',
                        },
                        scrollbarColor: '#6f6f6f rgba(212, 208, 200, 0.94)',
                        scrollbarWidth: 'thin',
                      }
                    : undefined
                }
              >
                {desktopEntries.map((entry) => (
                  <PhoneShortcutTile
                    key={entry.id}
                    entry={entry}
                    compact={shouldUseCompactHomeTiles}
                  />
                ))}
              </Grid>

              <Box
                data-phone-dock-layout={isLandscapeHomeLayout ? 'landscape' : 'portrait'}
                mt="auto"
                px={isLandscapeHomeLayout ? 1.5 : 2}
                py={isLandscapeHomeLayout ? 1.5 : 2}
                flexShrink={0}
                {...getHomePanelSx('rgba(207, 212, 220, 0.94)')}
              >
                <Flex align="end" justify="space-between" gap={1}>
                  {dockEntries.map((entry) => (
                    <PhoneShortcutTile key={entry.id} entry={entry} compact />
                  ))}
                </Flex>
              </Box>
            </Box>

            {activeApp ? (
              <Box
                position="absolute"
                inset="0"
                zIndex={3}
                px={3}
                py={3}
                bg={isHomeView ? 'rgba(7, 11, 18, 0)' : 'rgba(7, 11, 18, 0.18)'}
                opacity={isHomeView ? 0 : 1}
                pointerEvents={isHomeView ? 'none' : 'auto'}
                transform={isHomeView ? 'translateY(14px) scale(0.985)' : 'translateY(0) scale(1)'}
                transition="opacity 180ms ease, transform 180ms ease, background-color 180ms ease"
              >
                <Box
                  data-phone-app-window="true"
                  border={`2px solid ${WINDOW_SHADOW}`}
                  bg={WINDOW_FACE}
                  boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                  h="100%"
                  display="flex"
                  flexDirection="column"
                  overflow="hidden"
                >
                  <Flex
                    align="center"
                    justify="space-between"
                    gap={3}
                    px={3}
                    py={2}
                    bg="linear-gradient(90deg, #000080 0%, #0a3ca6 100%)"
                    borderBottom={`1px solid ${WINDOW_SHADOW}`}
                  >
                    <Box minW={0}>
                      <Text
                        color="#f5f7ff"
                        fontFamily={UI_FONT}
                        fontSize="12px"
                        fontWeight="700"
                        noOfLines={1}
                      >
                        {appWindowTitle}
                      </Text>
                      {activeApp?.badge ? (
                        <Text
                          color="rgba(245, 247, 255, 0.84)"
                          fontFamily={UI_FONT}
                          fontSize="9px"
                          fontWeight="700"
                          letterSpacing="0.04em"
                          textTransform="uppercase"
                        >
                          {activeApp.badge}
                        </Text>
                      ) : null}
                    </Box>

                    <Flex align="center" gap={2} flexShrink={0}>
                      <Text
                        color="#eef4ff"
                        fontFamily={UI_FONT}
                        fontSize="9px"
                        fontWeight="700"
                        letterSpacing="0.06em"
                      >
                        {statusTimeLabel}
                      </Text>
                      {showHomeButton ? (
                        <Box as="button" type="button" onClick={onHome} {...getStatusButtonSx()}>
                          Home
                        </Box>
                      ) : null}
                    </Flex>
                  </Flex>

                  <Box flex="1" minH={0} overflow="auto" px={3} py={3}>
                    {showSignalFeed ? (
                      <Box display="flex" flexDirection="column" gap={3}>
                        <Box
                          border={`2px solid ${WINDOW_SHADOW}`}
                          bg={WINDOW_BODY}
                          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                          px={3}
                          py={3}
                        >
                          <Flex align="start" gap={3}>
                            {activeFeedItem?.bannerAsset ? (
                              <Box
                                flexShrink={0}
                                w="96px"
                                border={`1px solid ${WINDOW_SHADOW}`}
                                bg="#10131a"
                                boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                                p={1}
                              >
                                <AdArtwork
                                  asset={getAdTileAsset(activeFeedItem.bannerAsset, 'banner')}
                                  h="42px"
                                  w="100%"
                                  backgroundSize="cover"
                                />
                              </Box>
                            ) : null}
                            <Box flex="1" minW={0}>
                              <Text
                                color={WINDOW_BLUE}
                                fontFamily={UI_FONT}
                                fontSize="10px"
                                fontWeight="700"
                                textTransform="uppercase"
                              >
                                Signal Feed
                              </Text>
                              <Text
                                mt={1}
                                color={WINDOW_DARK}
                                fontFamily={UI_FONT}
                                fontSize="11px"
                                fontWeight="700"
                                lineHeight="1.45"
                              >
                                Sponsored junk is crowding the screen. The crooked listing keeps
                                tearing through the noise.
                              </Text>
                            </Box>
                          </Flex>
                        </Box>

                        {feedItems.map((item) => {
                          const isAnomalous = item.id === snapshot.anomalousFeedItemId;
                          const isActiveFeedItem = item.id === snapshot.activeFeedItemId;
                          const bannerAsset = getAdTileAsset(item.bannerAsset, 'banner');
                          const iconAsset = getAdTileAsset(item.bannerAsset, 'icon');
                          const handleFeedItemSelect = onFeedItemSelect
                            ? () => onFeedItemSelect(item.id)
                            : undefined;

                          return (
                            <Box
                              key={item.id}
                              as={handleFeedItemSelect ? 'button' : 'div'}
                              type={handleFeedItemSelect ? 'button' : undefined}
                              data-phone-shell-feed-item={item.id}
                              onClick={handleFeedItemSelect}
                              textAlign="left"
                              w="100%"
                              border={`2px solid ${isAnomalous ? WINDOW_BLUE : WINDOW_SHADOW}`}
                              bg={
                                isActiveFeedItem ? '#dcecff' : isAnomalous ? '#ece3d2' : '#f7f7f7'
                              }
                              boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                              px={3}
                              py={3}
                              animation={
                                isAnomalous
                                  ? `${PHONE_ANOMALY_CARD_KEYFRAMES} 1120ms steps(2, end) infinite`
                                  : undefined
                              }
                            >
                              {bannerAsset ? (
                                <Box
                                  mb={2.5}
                                  border={`1px solid ${WINDOW_SHADOW}`}
                                  bg="#10131a"
                                  boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                                  p={1}
                                >
                                  <AdArtwork
                                    asset={bannerAsset}
                                    h="42px"
                                    w="100%"
                                    backgroundSize="cover"
                                  />
                                </Box>
                              ) : null}

                              <Flex align="start" gap={3}>
                                {iconAsset ? (
                                  <Box
                                    flexShrink={0}
                                    border={`1px solid ${WINDOW_SHADOW}`}
                                    bg={isActiveFeedItem ? '#e8f2ff' : '#ede7dd'}
                                    boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                                    p={1.5}
                                  >
                                    <AdArtwork
                                      asset={iconAsset}
                                      h="34px"
                                      w="34px"
                                      backgroundSize="contain"
                                    />
                                  </Box>
                                ) : null}

                                <Box flex="1" minW={0}>
                                  <Flex align="center" justify="space-between" gap={3}>
                                    <Text
                                      color={WINDOW_BLUE}
                                      fontFamily={UI_FONT}
                                      fontSize="10px"
                                      fontWeight="700"
                                      textTransform="uppercase"
                                    >
                                      {item.category}
                                    </Text>
                                    {isAnomalous ? (
                                      <Text
                                        border={`1px solid ${WINDOW_SHADOW}`}
                                        bg="#efebe4"
                                        color={WINDOW_BLUE}
                                        fontFamily={UI_FONT}
                                        fontSize="9px"
                                        fontWeight="700"
                                        letterSpacing="0.04em"
                                        px={2}
                                        py={0.5}
                                        textTransform="uppercase"
                                      >
                                        {isActiveFeedItem ? 'Signal ready' : 'Signal'}
                                      </Text>
                                    ) : null}
                                  </Flex>

                                  {isAnomalous ? (
                                    <PhoneAnomalousText
                                      containerProps={{ mt: 2 }}
                                      text={item.headline}
                                      textProps={{
                                        color: WINDOW_DARK,
                                        fontFamily: UI_FONT,
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        lineHeight: '1.45',
                                      }}
                                    />
                                  ) : (
                                    <Text
                                      mt={2}
                                      color={WINDOW_DARK}
                                      fontFamily={UI_FONT}
                                      fontSize="12px"
                                      fontWeight="700"
                                      lineHeight="1.45"
                                    >
                                      {item.headline}
                                    </Text>
                                  )}

                                  <Text
                                    mt={2}
                                    color={WINDOW_DARK}
                                    fontFamily={UI_FONT}
                                    fontSize="11px"
                                    lineHeight="1.5"
                                  >
                                    {item.body}
                                  </Text>
                                </Box>
                              </Flex>

                              {item.stripAsset ? (
                                <Box
                                  mt={2.5}
                                  border={`1px solid ${WINDOW_SHADOW}`}
                                  bg="#10131a"
                                  boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                                  p={1}
                                >
                                  <AdArtwork
                                    asset={getAdStripAsset(item.stripAsset)}
                                    w="100%"
                                    aspectRatio={`${AD_STRIP_FRAME_WIDTH} / ${AD_STRIP_FRAME_HEIGHT}`}
                                  />
                                </Box>
                              ) : null}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : isIntroTunnelTerminal ? (
                      <PhoneTunnelTerminalWindow
                        isLandscapeReady={isLandscapeTunnelTerminalReady}
                        onConfirmTerminalChoice={onConfirmTerminalChoice}
                        snapshot={snapshot}
                      />
                    ) : activeApp?.id === 'objective' && objectiveState ? (
                      <PhoneObjectiveWindow
                        activeWaypointId={activeWaypointId}
                        objectiveState={objectiveState}
                        onPhoneAction={onPhoneAction}
                        worldState={worldState}
                      />
                    ) : activeApp?.id === 'travel' && worldState ? (
                      <PhoneGameMapWindow
                        activeWaypointId={activeWaypointId}
                        onPhoneAction={onPhoneAction}
                        routeGuideEnabled={phoneGameSettings?.routeGuideEnabled !== false}
                        worldState={worldState}
                      />
                    ) : activeApp?.id === 'settings' ? (
                      <PhoneGameSettingsWindow
                        availableTracks={phoneAvailableTracks}
                        currentTrack={phoneCurrentTrack}
                        onControlSideChange={onPhoneControlSideChange}
                        onToggleHud={onPhoneHudToggle}
                        onTrackSelect={onPhoneTrackSelect}
                        onToggleMusic={onPhoneMusicToggle}
                        onToggleRouteGuide={onPhoneRouteGuideToggle}
                        onVolumeChange={onPhoneMusicVolumeChange}
                        selectedTrackId={phoneSelectedTrackId}
                        settingsState={phoneGameSettings}
                      />
                    ) : appCards.length > 0 || appActions.length > 0 ? (
                      <Box display="flex" flexDirection="column" gap={3}>
                        {appCards.map((card, index) => (
                          <Box
                            key={`${card.title || 'card'}-${index}`}
                            border={`2px solid ${WINDOW_SHADOW}`}
                            bg={index === 0 ? WINDOW_BODY : '#f7f7f7'}
                            boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                            px={3}
                            py={3}
                          >
                            {card.eyebrow ? (
                              <Text
                                color="rgba(10, 60, 166, 0.82)"
                                fontFamily={UI_FONT}
                                fontSize="9px"
                                fontWeight="700"
                                letterSpacing="0.08em"
                                textTransform="uppercase"
                              >
                                {card.eyebrow}
                              </Text>
                            ) : null}
                            <Text
                              color={WINDOW_BLUE}
                              fontFamily={UI_FONT}
                              fontSize="10px"
                              fontWeight="700"
                              textTransform="uppercase"
                            >
                              {card.title}
                            </Text>
                            {card.imageSrc ? (
                              <Box
                                mt={2}
                                border={`1px solid ${WINDOW_SHADOW}`}
                                bg="#11161f"
                                boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                                display="inline-flex"
                                p={1}
                              >
                                <Box
                                  as="img"
                                  src={card.imageSrc}
                                  alt={card.imageAlt || card.title || 'App card image'}
                                  display="block"
                                  h="112px"
                                  maxW="100%"
                                  objectFit="cover"
                                />
                              </Box>
                            ) : null}
                            <Text
                              mt={card.imageSrc ? 2 : 1}
                              color={WINDOW_DARK}
                              fontFamily={UI_FONT}
                              fontSize="12px"
                              fontWeight={index === 0 ? '700' : '400'}
                              lineHeight="1.5"
                            >
                              {card.body}
                            </Text>
                            {card.footer ? (
                              <Text
                                mt={2}
                                color="rgba(45, 45, 45, 0.78)"
                                fontFamily={UI_FONT}
                                fontSize="10px"
                                lineHeight="1.45"
                              >
                                {card.footer}
                              </Text>
                            ) : null}
                          </Box>
                        ))}

                        {appActions.length > 0 ? (
                          <Flex gap={2} flexWrap="wrap">
                            {appActions.map((action) => (
                              <Box
                                key={action.id || action.label}
                                as="button"
                                type="button"
                                onClick={() => onPhoneAction?.(action)}
                                {...getStatusButtonSx()}
                              >
                                {action.label}
                              </Box>
                            ))}
                          </Flex>
                        ) : null}
                      </Box>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={3}>
                        <Box
                          border={`2px solid ${WINDOW_SHADOW}`}
                          bg={WINDOW_BODY}
                          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                          px={3}
                          py={3}
                        >
                          <Text
                            color={WINDOW_BLUE}
                            fontFamily={UI_FONT}
                            fontSize="10px"
                            fontWeight="700"
                            textTransform="uppercase"
                          >
                            {activeApp?.label}
                          </Text>
                          <Text
                            mt={1}
                            color={WINDOW_DARK}
                            fontFamily={UI_FONT}
                            fontSize="12px"
                            fontWeight="700"
                            lineHeight="1.5"
                          >
                            {activeApp?.detail}
                          </Text>
                        </Box>

                        <Box
                          border={`2px solid ${WINDOW_SHADOW}`}
                          bg="#f7f7f7"
                          boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                          px={3}
                          py={3}
                        >
                          <Text
                            color={WINDOW_BLUE}
                            fontFamily={UI_FONT}
                            fontSize="10px"
                            fontWeight="700"
                            textTransform="uppercase"
                          >
                            Active Note
                          </Text>
                          <Text
                            mt={1}
                            color={WINDOW_DARK}
                            fontFamily={UI_FONT}
                            fontSize="11px"
                            lineHeight="1.5"
                          >
                            {snapshot.launchNote}
                          </Text>
                        </Box>

                        {snapshot.notifications?.[0] ? (
                          <Box
                            border={`2px solid ${WINDOW_SHADOW}`}
                            bg="#f7f7f7"
                            boxShadow={`inset 1px 1px 0 ${WINDOW_LIGHT}, inset -1px -1px 0 ${WINDOW_SHADOW}`}
                            px={3}
                            py={3}
                          >
                            <Text
                              color={WINDOW_BLUE}
                              fontFamily={UI_FONT}
                              fontSize="10px"
                              fontWeight="700"
                              textTransform="uppercase"
                            >
                              {snapshot.notifications[0].title}
                            </Text>
                            <Text
                              mt={1}
                              color={WINDOW_DARK}
                              fontFamily={UI_FONT}
                              fontSize="11px"
                              fontWeight="700"
                              lineHeight="1.5"
                            >
                              {snapshot.notifications[0].message}
                            </Text>
                          </Box>
                        ) : null}
                      </Box>
                    )}
                  </Box>

                  <Box borderTop={`1px solid ${WINDOW_SHADOW}`} px={3} py={2}>
                    <Text
                      color={WINDOW_DARK}
                      fontFamily={UI_FONT}
                      fontSize="10px"
                      fontWeight="700"
                      lineHeight="1.45"
                    >
                      {footerCopy}
                    </Text>
                  </Box>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box
          as="img"
          src={makeAssetUrl(phoneOverlaySrc)}
          alt=""
          aria-hidden="true"
          position="absolute"
          top="50%"
          left="50%"
          zIndex={2}
          w={isDesktopOverlay ? '100%' : handheldShellLayout.frameWidth}
          h={isDesktopOverlay ? '100%' : handheldShellLayout.frameHeight}
          objectFit={isDesktopOverlay ? 'contain' : 'fill'}
          transform={
            shouldRotateLandscapePhone
              ? 'translate(-50%, -50%) rotate(90deg)'
              : 'translate(-50%, -50%)'
          }
          transformOrigin="center center"
          transition="transform 180ms ease"
          pointerEvents="none"
          userSelect="none"
          draggable={false}
          imageRendering="pixelated"
        />
      </Box>
    </Box>
  );
}

export default PhoneShellRenderer;
