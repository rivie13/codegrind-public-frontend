import { INTRO_OVERLAY_DEPTH } from '../apartmentPreviewScene.constants';

const INTRO_LAYOUT_REQUIRED_KEYS = [
  'introBackdropMatte',
  'introCityTint',
  'introLetterboxTop',
  'introLetterboxBottom',
];

const WINDOW_VIEW_OVERLAY_KEYS = [
  'windowViewHeaderShadow',
  'windowViewHeaderBackground',
  'windowViewHeaderTitleBar',
  'windowViewHeaderTitle',
  'windowViewHeaderBody',
  'windowViewBackButtonShadow',
  'windowViewBackButtonBackground',
  'windowViewBackButtonText',
  'windowViewBackButtonHitArea',
];

const LOADING_OVERLAY_DEPTH = INTRO_OVERLAY_DEPTH + 10;
const LOADING_OVERLAY_KEYS = [
  'loadingOverlayBackdrop',
  'loadingOverlayGrid',
  'loadingOverlayShadow',
  'loadingOverlayWindow',
  'loadingOverlayTitleBar',
  'loadingOverlayKicker',
  'loadingOverlayLocation',
  'loadingOverlayDetail',
  'loadingOverlayStatusDot',
  'loadingOverlayStatusLabel',
  'loadingOverlayProgressTrack',
  'loadingOverlayProgressFill',
  'loadingOverlayFooter',
];

const LOADING_OVERLAY_TITLE_STYLE = {
  color: '#10151d',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '34px',
  fontStyle: 'bold',
};

const LOADING_OVERLAY_DETAIL_STYLE = {
  color: '#202020',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '12px',
  fontStyle: 'bold',
  wordWrap: { width: 520 },
};

const LOADING_OVERLAY_FOOTER_STYLE = {
  color: '#202020',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
  wordWrap: { width: 520 },
};

const isLiveSceneNode = (node) => Boolean(node && !node.destroyed && node.scene);

const resolveLiveSceneNode = (scene, key) => {
  const node = scene[key];

  if (!isLiveSceneNode(node)) {
    scene[key] = null;
    return null;
  }

  return node;
};

const resolveLiveSceneNodes = (scene, keys, options = {}) => {
  const resolvedNodes = {};
  let hasMissingNode = false;

  for (const key of keys) {
    const node = resolveLiveSceneNode(scene, key);

    if (!node) {
      hasMissingNode = true;
      continue;
    }

    resolvedNodes[key] = node;
  }

  if (hasMissingNode) {
    if (options.resetArrayKey) {
      scene[options.resetArrayKey] = [];
    }
    return null;
  }

  if (options.resetArrayKey) {
    scene[options.resetArrayKey] = keys.map((key) => resolvedNodes[key]);
  }

  return resolvedNodes;
};

export {
  INTRO_LAYOUT_REQUIRED_KEYS,
  WINDOW_VIEW_OVERLAY_KEYS,
  LOADING_OVERLAY_DEPTH,
  LOADING_OVERLAY_KEYS,
  LOADING_OVERLAY_TITLE_STYLE,
  LOADING_OVERLAY_DETAIL_STYLE,
  LOADING_OVERLAY_FOOTER_STYLE,
  isLiveSceneNode,
  resolveLiveSceneNode,
  resolveLiveSceneNodes,
};
