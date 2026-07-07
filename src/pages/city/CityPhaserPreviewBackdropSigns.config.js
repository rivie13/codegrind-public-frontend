import { toAssetPath } from '../../city-phaser/district01/loadExternalTiledMap';

const buildWindowViewFramePaths = (relativeDirectory, filePrefix, frameCount) =>
  Array.from({ length: frameCount }, (_, frameIndex) =>
    encodeURI(
      toAssetPath(
        `city-v2/tiled/Pixel Art Sign Pack - Animated/Pixel Art Sign Pack - Animated/${relativeDirectory}/${filePrefix}${String(
          frameIndex
        ).padStart(3, '0')}.png`
      )
    )
  );

const flattenFrameSources = (signOverlays) =>
  Array.from(new Set(signOverlays.flatMap((signOverlay) => signOverlay.frames || [])));

export const WINDOW_VIEW_SIGN_OVERLAYS = [
  {
    filter: 'drop-shadow(0 0 9px rgba(104, 248, 255, 0.42))',
    frameDelayMs: 86,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      height: 0.15,
      x: 0.022,
      y: 0.576,
    },
    frames: buildWindowViewFramePaths('Sign 17/TEAL', 'Sign 17 Glow - TEAL_', 49),
    id: 'sign-17-teal-left-edge',
    opacity: 0.84,
    transform: 'rotate(-3deg)',
  },
  {
    filter: 'drop-shadow(0 0 8px rgba(120, 255, 174, 0.42))',
    frameDelayMs: 120,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      width: 0.053,
      x: 0.217,
      y: 0.528,
    },
    frames: buildWindowViewFramePaths('Sign 13/GREEN', 'Sign 13 Glow - GREEN_', 13),
    id: 'sign-13-green',
    transform: 'rotate(-8deg)',
  },
  {
    filter: 'drop-shadow(0 0 10px rgba(255, 98, 175, 0.38))',
    frameDelayMs: 105,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      width: 0.054,
      x: 0.349,
      y: 0.541,
    },
    frames: buildWindowViewFramePaths('Sign 10/PINK', 'Sign 10 Glow - PINK_', 23),
    id: 'sign-10-pink',
    transform: 'rotate(-2deg)',
  },
  {
    filter: 'drop-shadow(0 0 10px rgba(104, 248, 255, 0.42))',
    frameDelayMs: 95,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      height: 0.145,
      x: 0.553,
      y: 0.191,
    },
    frames: buildWindowViewFramePaths('Sign 7/TEAL', 'Sign 7 Glow - TEAL_', 19),
    id: 'sign-7-teal',
    transform: 'rotate(1deg)',
  },
  {
    filter: 'drop-shadow(0 0 10px rgba(120, 255, 174, 0.38))',
    frameDelayMs: 96,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      width: 0.061,
      x: 0.529,
      y: 0.593,
    },
    frames: buildWindowViewFramePaths('Sign 16/GREEN', 'Sign 16 Glow - GREEN_', 38),
    id: 'sign-16-green-center-tower',
    opacity: 0.82,
    transform: 'rotate(-1deg)',
  },
  {
    filter: 'drop-shadow(0 0 8px rgba(255, 171, 87, 0.42))',
    frameDelayMs: 94,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.72,
      height: 0.047,
      x: 0.778,
      y: 0.607,
    },
    frames: buildWindowViewFramePaths('Sign 2/ORANGE', 'Sign 2 Glow - ORANGE_', 48),
    id: 'sign-2-orange-right-roof',
    opacity: 0.9,
    transform: 'rotate(-1deg)',
  },
  {
    filter: 'drop-shadow(0 0 10px rgba(255, 98, 175, 0.38))',
    frameDelayMs: 88,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      height: 0.176,
      x: 0.944,
      y: 0.55,
    },
    frames: buildWindowViewFramePaths('Sign 17/PINK', 'Sign 17 Glow - PINK_', 49),
    id: 'sign-17-pink-right-facade',
    opacity: 0.84,
    transform: 'rotate(2deg)',
  },
  {
    filter: 'drop-shadow(0 0 8px rgba(116, 196, 255, 0.42))',
    frameDelayMs: 98,
    framePlacement: {
      anchorX: 0.5,
      anchorY: 0.5,
      height: 0.064,
      x: 0.977,
      y: 0.782,
    },
    frames: buildWindowViewFramePaths('Sign 3/BLUE', 'Sign 3  Glow - BLUE_', 42),
    id: 'sign-3-blue-right-bottom',
    opacity: 0.88,
    transform: 'rotate(2deg)',
  },
];

export const WINDOW_VIEW_SIGN_FRAME_SOURCES = flattenFrameSources(WINDOW_VIEW_SIGN_OVERLAYS);
