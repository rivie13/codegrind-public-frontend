import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RETRO_TUTORIAL_ICON_ASSET,
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../utils/assets/towerDefenseAssetUrls';
import { buildResponsiveProfile } from '../../../utils/web/responsiveProfile';

const CALLOUT_WIDTH = 360;
const DEFAULT_CALLOUT_HEIGHT = 160;
const UI_FONT = "'Tahoma', 'MS Sans Serif', sans-serif";
const CODE_FONT = "'Fira Code', 'Cascadia Code', monospace";
const VIEWPORT_PADDING = 12;
const TOP_SAFE_OFFSET = 72;
const BOTTOM_SAFE_OFFSET = 84;
const TARGET_FRAME_PADDING = 8;
const CALLOUT_GAP = 6;
const MOBILE_TICKER_DEFAULT_TOP = 0;
const MOBILE_TICKER_ESTIMATED_HEIGHT = 74;
const MOBILE_TICKER_TARGET_GAP = 10;
const RETRO_ONBOARDING_THEME = {
  surface: '#d4d0c8',
  border: '#686868',
  titleBar: 'linear-gradient(90deg, #000080 0%, #0a3ca6 100%)',
  text: '#181818',
  secondaryText: '#3f3f3f',
  accent: '#000080',
  hintSurface: '#f7f2e8',
  hintBorder: '#8c867b',
  warningSurface: '#f1e2bf',
  warningBorder: '#9f7b29',
  inset:
    'inset 1px 1px 0 rgba(255, 255, 255, 0.82), inset -1px -1px 0 rgba(104, 104, 104, 0.34), 0 10px 20px rgba(0, 0, 0, 0.16)',
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getRetroButtonSx = ({ compact = false } = {}) => ({
  borderRadius: '0',
  border: '1px solid #6f6f6f',
  backgroundImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
  bg: '#d4d0c8',
  color: '#151515',
  fontFamily: UI_FONT,
  fontSize: compact ? '11px' : '12px',
  fontWeight: '700',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  boxShadow:
    'inset 1px 1px 0 rgba(255, 255, 255, 0.78), inset -1px -1px 0 rgba(104, 104, 104, 0.32), 0 2px 4px rgba(0, 0, 0, 0.1)',
  px: compact ? 3 : 4,
  _hover: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    bg: '#ece7de',
  },
  _active: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    bg: '#ece7de',
  },
  _disabled: {
    opacity: 0.72,
    color: '#5f5f5f',
  },
});

const getHighContrastButtonSx = ({ compact = false, stepId } = {}) => {
  const isHighContrast = stepId === 'mission-objective' || stepId === 'life-loss-warning';
  if (!isHighContrast) {
    return getRetroButtonSx({ compact });
  }
  const neonColor = stepId === 'mission-objective' ? '#39FF14' : '#FF007F';
  return {
    borderRadius: '0',
    border: '3px solid #000000',
    bg: neonColor,
    color: '#000000',
    fontFamily: UI_FONT,
    fontSize: compact ? '12px' : '14px',
    fontWeight: '900',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    boxShadow: '5px 5px 0px #000000',
    px: compact ? 5 : 7,
    py: compact ? 2.5 : 4.5,
    h: 'auto',
    _hover: {
      bg: '#FFFFFF',
      boxShadow: '2px 2px 0px #000000',
      transform: 'translate(3px, 3px)',
    },
    _active: {
      boxShadow: 'none',
      transform: 'translate(5px, 5px)',
    },
    _disabled: {
      opacity: 0.5,
      bg: '#7F7F7F',
      color: '#C0C0C0',
      boxShadow: 'none',
    },
  };
};

function RetroWindowTitleBar({ title, label = 'Tutorial', compact = false }) {
  return (
    <Flex
      align="center"
      gap={2}
      px={compact ? 2 : 3}
      py={compact ? 1 : 1.5}
      bg={RETRO_ONBOARDING_THEME.titleBar}
      borderBottom="1px solid #081a77"
    >
      <Box
        as="img"
        src={RETRO_TUTORIAL_ICON_ASSET}
        alt=""
        aria-hidden="true"
        w={compact ? '12px' : '14px'}
        h={compact ? '12px' : '14px'}
        imageRendering="pixelated"
        flexShrink={0}
      />
      <Text
        color="#f5f7ff"
        fontFamily={UI_FONT}
        fontSize={compact ? '11px' : '12px'}
        fontWeight="700"
        letterSpacing="0.04em"
        noOfLines={1}
      >
        {title}
      </Text>
      <Text
        ml="auto"
        color="rgba(245, 247, 255, 0.85)"
        fontFamily={UI_FONT}
        fontSize={compact ? '9px' : '10px'}
        fontWeight="700"
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        {label}
      </Text>
    </Flex>
  );
}

function RetroWindowFrame({ title, label, compact = false, children }) {
  return (
    <Box
      overflow="hidden"
      bg={RETRO_ONBOARDING_THEME.surface}
      border="2px solid"
      borderColor={RETRO_ONBOARDING_THEME.border}
      boxShadow={RETRO_ONBOARDING_THEME.inset}
    >
      <RetroWindowTitleBar title={title} label={label} compact={compact} />
      <Box px={compact ? 2.5 : 3.5} py={compact ? 2 : 3}>
        {children}
      </Box>
    </Box>
  );
}

const getManualContinueDelayMs = (step) => {
  if (!step?.requireManualContinue) return 0;

  const baseDelayMs = Number(step?.manualContinueDelayMs);
  if (!Number.isFinite(baseDelayMs) || baseDelayMs <= 0) {
    return 0;
  }

  if (typeof window === 'undefined' || !buildResponsiveProfile().isHandheldSinglePanelLayout) {
    return baseDelayMs;
  }

  const mobileDelayMs = Number(step?.manualContinueDelayMobileMs);
  if (Number.isFinite(mobileDelayMs) && mobileDelayMs > 0) {
    return mobileDelayMs;
  }

  return baseDelayMs;
};

const isCompactWriteCodeStep = (step) => {
  if (!step || step.id !== 'write-code' || typeof window === 'undefined') {
    return false;
  }

  return buildResponsiveProfile().isHandheldSinglePanelLayout;
};

const shouldUseTickerCallout = (step) => {
  if (!step || step.kind !== 'callout' || typeof window === 'undefined') {
    return false;
  }

  if (
    step.placement === 'center' ||
    (typeof step.placement === 'function' && step.placement() === 'center')
  ) {
    return false;
  }

  const responsiveProfile = buildResponsiveProfile();
  const stepId = String(step.id || '');
  const targetSelector = String(step.targetSelector || '');
  const hasTargetFocus = Boolean(step.targetSelector);
  const usesPanelFocus = Boolean(step.panelFocus);
  const prefersMobileTicker = Boolean(step.preferMobileTicker);
  const isPanelSwitcherTarget =
    stepId === 'interwave-slot-switch' ||
    targetSelector.includes("[data-tutorial-role='panel-switcher']") ||
    targetSelector.includes('[data-tutorial-role="panel-switcher"]') ||
    targetSelector.includes("[data-tutorial='slot-switch-taskbar']") ||
    targetSelector.includes('[data-tutorial="slot-switch-taskbar"]');

  if (isPanelSwitcherTarget && responsiveProfile.isHandheldLayout) {
    return true;
  }

  if (prefersMobileTicker && responsiveProfile.isHandheldSinglePanelLayout) {
    return true;
  }

  return (
    responsiveProfile.isHandheldSinglePanelLayout &&
    (hasTargetFocus || usesPanelFocus || prefersMobileTicker)
  );
};

const isPanelSwitcherStep = (step) => {
  if (!step) return false;

  const stepId = String(step.id || '');
  if (stepId === 'interwave-slot-switch') return true;

  const targetSelector = String(step.targetSelector || '');
  return (
    targetSelector.includes("[data-tutorial-role='panel-switcher']") ||
    targetSelector.includes('[data-tutorial-role="panel-switcher"]') ||
    targetSelector.includes("[data-tutorial='slot-switch-taskbar']") ||
    targetSelector.includes('[data-tutorial="slot-switch-taskbar"]')
  );
};

const normalizeTargetRect = (rect) => {
  if (!rect) return null;

  return rect;
};

const getPreferredPlacements = (placement = 'bottom') => {
  switch (placement) {
    case 'top':
      return ['top', 'bottom', 'right', 'left'];
    case 'left':
      return ['left', 'right', 'bottom', 'top'];
    case 'right':
      return ['right', 'left', 'bottom', 'top'];
    case 'bottom':
    default:
      return ['bottom', 'top', 'right', 'left'];
  }
};

const getPlacementPosition = ({ rect, placement, width, height, gap }) => {
  const visualLeft = rect.left - TARGET_FRAME_PADDING;
  const visualRight = rect.right + TARGET_FRAME_PADDING;
  const visualTop = rect.top - TARGET_FRAME_PADDING;
  const visualBottom = rect.bottom + TARGET_FRAME_PADDING;
  const targetCenterX = (visualLeft + visualRight) / 2;
  const targetCenterY = (visualTop + visualBottom) / 2;

  switch (placement) {
    case 'top':
      return {
        top: visualTop - height - gap,
        left: targetCenterX - width / 2,
      };
    case 'left':
      return {
        top: targetCenterY - height / 2,
        left: visualLeft - width - gap,
      };
    case 'right':
      return {
        top: targetCenterY - height / 2,
        left: visualRight + gap,
      };
    case 'bottom':
    default:
      return {
        top: visualBottom + gap,
        left: targetCenterX - width / 2,
      };
  }
};

const placementFitsViewport = ({
  position,
  width,
  height,
  viewportWidth,
  viewportHeight,
  safeTop,
  safeBottom,
}) => {
  return (
    position.left >= VIEWPORT_PADDING &&
    position.left + width <= viewportWidth - VIEWPORT_PADDING &&
    position.top >= safeTop &&
    position.top + height <= viewportHeight - safeBottom
  );
};

const clampPositionToViewport = ({
  position,
  width,
  height,
  viewportWidth,
  viewportHeight,
  safeTop,
  safeBottom,
}) => ({
  top: clamp(position.top, safeTop, viewportHeight - safeBottom - height),
  left: clamp(position.left, VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING),
});

const getPlacementPenalty = ({ rawPosition, clampedPosition }) => {
  return (
    Math.abs(rawPosition.top - clampedPosition.top) +
    Math.abs(rawPosition.left - clampedPosition.left)
  );
};

const getBubbleStyle = (
  rect,
  placement = 'bottom',
  bubbleHeight = DEFAULT_CALLOUT_HEIGHT,
  gapOverride = CALLOUT_GAP,
  compactWriteCode = false
) => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
  const width = Math.min(CALLOUT_WIDTH, viewportWidth - VIEWPORT_PADDING * 2);
  const safeTop = TOP_SAFE_OFFSET;
  const safeBottom = BOTTOM_SAFE_OFFSET;

  if (placement === 'center' || (typeof placement === 'function' && placement() === 'center')) {
    const leftVal = Math.max(VIEWPORT_PADDING, (viewportWidth - width) / 2);
    const topVal = Math.max(safeTop, (viewportHeight - bubbleHeight) / 2);
    return {
      style: {
        top: `${topVal}px`,
        left: `${leftVal}px`,
        width: `${width}px`,
      },
      resolvedPlacement: 'center',
      left: leftVal,
      top: topVal,
      width: width,
    };
  }

  if (compactWriteCode) {
    const compactWidth = Math.min(300, viewportWidth - VIEWPORT_PADDING * 2);
    const leftVal = Math.max(VIEWPORT_PADDING, viewportWidth - compactWidth - VIEWPORT_PADDING);
    const topVal = safeTop + 8;
    return {
      style: {
        top: `${topVal}px`,
        left: `${leftVal}px`,
        width: `${compactWidth}px`,
      },
      resolvedPlacement: 'top',
      left: leftVal,
      top: topVal,
      width: compactWidth,
    };
  }

  if (!rect) {
    const leftVal = Math.max(VIEWPORT_PADDING, (viewportWidth - width) / 2);
    const topVal = safeTop + 24;
    return {
      style: {
        top: `${topVal}px`,
        left: `${leftVal}px`,
        width: `${width}px`,
      },
      resolvedPlacement: 'bottom',
      left: leftVal,
      top: topVal,
      width: width,
    };
  }

  // Force close positioning: standardize gap to 10px so directed arrow works properly
  const gap = 10;
  const preferredPlacements = getPreferredPlacements(placement);
  let bestFallback = null;

  for (const candidate of preferredPlacements) {
    const rawPosition = getPlacementPosition({
      rect,
      placement: candidate,
      width,
      height: bubbleHeight,
      gap,
    });

    const clampedPosition = clampPositionToViewport({
      position: rawPosition,
      width,
      height: bubbleHeight,
      viewportWidth,
      viewportHeight,
      safeTop,
      safeBottom,
    });

    if (
      placementFitsViewport({
        position: rawPosition,
        width,
        height: bubbleHeight,
        viewportWidth,
        viewportHeight,
        safeTop,
        safeBottom,
      })
    ) {
      return {
        style: {
          top: `${rawPosition.top}px`,
          left: `${rawPosition.left}px`,
          width: `${width}px`,
        },
        resolvedPlacement: candidate,
        left: rawPosition.left,
        top: rawPosition.top,
        width: width,
      };
    }

    const penalty = getPlacementPenalty({
      rawPosition,
      clampedPosition,
    });

    if (!bestFallback || penalty < bestFallback.penalty) {
      bestFallback = {
        penalty,
        placement: candidate,
        position: clampedPosition,
      };
    }
  }

  const fallbackPlacement = bestFallback?.placement || placement;
  const fallbackPosition =
    bestFallback?.position ||
    clampPositionToViewport({
      position: getPlacementPosition({
        rect,
        placement: fallbackPlacement,
        width,
        height: bubbleHeight,
        gap,
      }),
      width,
      height: bubbleHeight,
      viewportWidth,
      viewportHeight,
      safeTop,
      safeBottom,
    });

  return {
    style: {
      top: `${fallbackPosition.top}px`,
      left: `${fallbackPosition.left}px`,
      width: `${width}px`,
    },
    resolvedPlacement: fallbackPlacement,
    left: fallbackPosition.left,
    top: fallbackPosition.top,
    width: width,
  };
};

const getTransmissionStyle = (rect) => {
  if (!rect) {
    return {
      top: '0px',
      left: '0px',
      width: '100vw',
      height: '100vh',
    };
  }

  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
};

const getBackdropFrameStyle = (rect) => {
  if (!rect) {
    return {
      top: '0px',
      left: '0px',
      width: '100vw',
      height: '100vh',
      borderRadius: '0px',
    };
  }

  return {
    top: `${Math.max(0, rect.top - 12)}px`,
    left: `${Math.max(0, rect.left - 12)}px`,
    width: `${rect.width + 24}px`,
    height: `${rect.height + 24}px`,
    borderRadius: '0px',
  };
};

const getMobileTickerTopOffset = (rect, step) => {
  if (typeof window === 'undefined') {
    return MOBILE_TICKER_DEFAULT_TOP;
  }

  const viewportHeight = window.innerHeight || 900;
  const maxTop = Math.max(
    MOBILE_TICKER_DEFAULT_TOP,
    viewportHeight - BOTTOM_SAFE_OFFSET - MOBILE_TICKER_ESTIMATED_HEIGHT
  );

  if (!rect) {
    if (isPanelSwitcherStep(step)) {
      return maxTop;
    }

    return MOBILE_TICKER_DEFAULT_TOP;
  }

  const highlightedTop = rect.top - TARGET_FRAME_PADDING;
  const highlightedBottom = rect.bottom + TARGET_FRAME_PADDING;
  const defaultTickerBottom = MOBILE_TICKER_DEFAULT_TOP + MOBILE_TICKER_ESTIMATED_HEIGHT;

  if (isPanelSwitcherStep(step)) {
    return clamp(highlightedBottom + MOBILE_TICKER_TARGET_GAP, MOBILE_TICKER_DEFAULT_TOP, maxTop);
  }

  if (highlightedTop >= defaultTickerBottom + MOBILE_TICKER_TARGET_GAP) {
    return MOBILE_TICKER_DEFAULT_TOP;
  }

  return clamp(highlightedBottom + MOBILE_TICKER_TARGET_GAP, MOBILE_TICKER_DEFAULT_TOP, maxTop);
};

function TypedText({
  text,
  color = RETRO_ONBOARDING_THEME.text,
  fontSize = 'sm',
  fontWeight = 'normal',
  fontFamily = UI_FONT,
}) {
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    const nextText = String(text || '');
    setVisibleText('');
    if (!nextText) return undefined;

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(nextText.slice(0, index));
      if (index >= nextText.length) {
        window.clearInterval(timer);
      }
    }, 12);

    return () => {
      window.clearInterval(timer);
    };
  }, [text]);

  return (
    <Text
      color={color}
      fontSize={fontSize}
      fontWeight={fontWeight}
      lineHeight="1.6"
      fontFamily={fontFamily}
    >
      {visibleText}
    </Text>
  );
}

export default function TowerDefenseOnboardingOverlay({ step, targetRect, onCompleteStep }) {
  const bubbleRef = useRef(null);
  const [bubbleHeight, setBubbleHeight] = useState(DEFAULT_CALLOUT_HEIGHT);
  const [manualContinueUnlocked, setManualContinueUnlocked] = useState(true);
  const [manualContinueRemainingMs, setManualContinueRemainingMs] = useState(0);
  const normalizedTargetRect = useMemo(() => normalizeTargetRect(targetRect), [targetRect]);
  const compactWriteCodeStep = isCompactWriteCodeStep(step);
  const tickerCallout = shouldUseTickerCallout(step);
  const hasInlineAnswerCode =
    step?.id === 'write-code' &&
    typeof step?.answerCode === 'string' &&
    step.answerCode.trim().length > 0;
  const useCompactWriteCodeLayout = hasInlineAnswerCode;
  const compactWriteCodeTickerText = useMemo(() => {
    if (!compactWriteCodeStep) return '';

    const message = typeof step?.message === 'string' ? step.message : '';
    const subtext = typeof step?.subtext === 'string' ? step.subtext : '';
    const answerCode =
      typeof step?.answerCode === 'string' && step.answerCode.trim().length > 0
        ? step.answerCode.replace(/\s+/g, ' ').trim()
        : '';

    return [step?.title, message, subtext, answerCode].filter(Boolean).join('   //   ');
  }, [compactWriteCodeStep, step?.answerCode, step?.message, step?.subtext, step?.title]);
  const tickerText = useMemo(() => {
    if (!tickerCallout) return '';

    const message = typeof step?.message === 'string' ? step.message : '';
    const subtext = typeof step?.subtext === 'string' ? step.subtext : '';
    const answerCode =
      typeof step?.answerCode === 'string' && step.answerCode.trim().length > 0
        ? step.answerCode.replace(/\s+/g, ' ').trim()
        : '';

    return [message, subtext, answerCode].filter(Boolean).join('   //   ');
  }, [tickerCallout, step?.answerCode, step?.message, step?.subtext]);
  const requiresManualContinue =
    Boolean(step?.requireManualContinue) || step?.id === 'life-loss-warning';
  const preserveFocusReadability = Boolean(step?.preserveFocusReadability);

  useEffect(() => {
    if (!step || !requiresManualContinue || !manualContinueUnlocked) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onCompleteStep(step.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [step, requiresManualContinue, manualContinueUnlocked, onCompleteStep]);

  useEffect(() => {
    if (!requiresManualContinue) {
      setManualContinueUnlocked(true);
      setManualContinueRemainingMs(0);
      return undefined;
    }

    const delayMs = getManualContinueDelayMs(step);
    if (!delayMs) {
      setManualContinueUnlocked(true);
      setManualContinueRemainingMs(0);
      return undefined;
    }

    setManualContinueUnlocked(false);
    setManualContinueRemainingMs(delayMs);

    const unlockTimerId = window.setTimeout(() => {
      setManualContinueUnlocked(true);
      setManualContinueRemainingMs(0);
    }, delayMs);

    const countdownTimerId = window.setInterval(() => {
      setManualContinueRemainingMs((currentValue) => Math.max(0, currentValue - 100));
    }, 100);

    return () => {
      window.clearTimeout(unlockTimerId);
      window.clearInterval(countdownTimerId);
    };
  }, [requiresManualContinue, step]);

  const continueButtonLabel = useMemo(() => {
    if (step?.actionDisabled && step?.lockedActionLabel) {
      return step.lockedActionLabel;
    }

    if (manualContinueUnlocked) {
      return step?.actionLabel || 'Continue';
    }

    if (step?.lockedActionLabel) {
      return step.lockedActionLabel;
    }

    const remainingSeconds = Math.max(1, Math.ceil(manualContinueRemainingMs / 1000));
    return `Continue in ${remainingSeconds}s`;
  }, [
    manualContinueRemainingMs,
    manualContinueUnlocked,
    step?.actionLabel,
    step?.lockedActionLabel,
    step?.actionDisabled,
  ]);

  const isContinueButtonDisabled = !manualContinueUnlocked || Boolean(step?.actionDisabled);

  useEffect(() => {
    if (!step || step.kind === 'concept-card' || step.kind === 'transmission') {
      setBubbleHeight(DEFAULT_CALLOUT_HEIGHT);
      return undefined;
    }

    const element = bubbleRef.current;
    if (!element) return undefined;

    const updateBubbleHeight = () => {
      const rect = element.getBoundingClientRect();
      const nextHeight = rect.height || element.clientHeight || 0;
      if (!nextHeight) return;

      setBubbleHeight((currentHeight) => {
        const roundedCurrent = Math.round(currentHeight);
        const roundedNext = Math.round(nextHeight);
        return roundedCurrent === roundedNext ? currentHeight : nextHeight;
      });
    };

    if (typeof ResizeObserver === 'undefined') {
      updateBubbleHeight();
      window.addEventListener('resize', updateBubbleHeight);
      return () => {
        window.removeEventListener('resize', updateBubbleHeight);
      };
    }

    const observer = new ResizeObserver(updateBubbleHeight);
    observer.observe(element);
    updateBubbleHeight();

    return () => {
      observer.disconnect();
    };
  }, [step]);

  const {
    style: bubbleStyle,
    resolvedPlacement,
    left: bubbleLeft,
    top: bubbleTop,
    width: bubbleWidth,
  } = useMemo(
    () =>
      getBubbleStyle(
        normalizedTargetRect,
        step?.placement,
        bubbleHeight,
        step?.calloutGap,
        useCompactWriteCodeLayout
      ),
    [bubbleHeight, normalizedTargetRect, step, useCompactWriteCodeLayout]
  );
  const transmissionStyle = useMemo(
    () => getTransmissionStyle(normalizedTargetRect),
    [normalizedTargetRect]
  );
  const backdropFrameStyle = useMemo(
    () => getBackdropFrameStyle(normalizedTargetRect),
    [normalizedTargetRect]
  );
  const clipPath = useMemo(() => {
    if (!normalizedTargetRect || preserveFocusReadability) return 'none';
    const sTop = Math.max(0, normalizedTargetRect.top - 12);
    const sLeft = Math.max(0, normalizedTargetRect.left - 12);
    const sBottom = sTop + normalizedTargetRect.height + 24;
    const sRight = sLeft + normalizedTargetRect.width + 24;
    return `polygon(0px 0px, 0px 100%, ${sLeft}px 100%, ${sLeft}px ${sTop}px, ${sRight}px ${sTop}px, ${sRight}px ${sBottom}px, ${sLeft}px ${sBottom}px, ${sLeft}px 100%, 100% 100%, 100% 0px)`;
  }, [normalizedTargetRect, preserveFocusReadability]);
  const mobileTickerTopOffset = useMemo(
    () => getMobileTickerTopOffset(normalizedTargetRect, step),
    [normalizedTargetRect, step]
  );

  const renderArrow = () => {
    if (!normalizedTargetRect || !resolvedPlacement) return null;

    const targetCenterX = (normalizedTargetRect.left + normalizedTargetRect.right) / 2;
    const targetCenterY = (normalizedTargetRect.top + normalizedTargetRect.bottom) / 2;
    const bLeft = bubbleLeft || 0;
    const bTop = bubbleTop || 0;
    const bWidth = bubbleWidth || CALLOUT_WIDTH;

    if (resolvedPlacement === 'top') {
      const arrowLeft = clamp(targetCenterX - bLeft - 8, 12, bWidth - 28);
      return (
        <Box
          position="absolute"
          bottom="-10px"
          left={`${arrowLeft}px`}
          w="16px"
          h="10px"
          zIndex={10002}
        >
          <svg width="16" height="10" viewBox="0 0 16 10">
            <path
              d="M 0 0 L 8 10 L 16 0"
              fill={RETRO_ONBOARDING_THEME.surface}
              stroke={RETRO_ONBOARDING_THEME.border}
              strokeWidth="2"
            />
          </svg>
        </Box>
      );
    }

    if (resolvedPlacement === 'bottom') {
      const arrowLeft = clamp(targetCenterX - bLeft - 8, 12, bWidth - 28);
      return (
        <Box
          position="absolute"
          top="-10px"
          left={`${arrowLeft}px`}
          w="16px"
          h="10px"
          zIndex={10002}
        >
          <svg width="16" height="10" viewBox="0 0 16 10">
            <path
              d="M 0 10 L 8 0 L 16 10"
              fill="#000080"
              stroke={RETRO_ONBOARDING_THEME.border}
              strokeWidth="2"
            />
          </svg>
        </Box>
      );
    }

    if (resolvedPlacement === 'left') {
      const arrowTop = clamp(targetCenterY - bTop - 8, 12, bubbleHeight - 28);
      return (
        <Box
          position="absolute"
          right="-10px"
          top={`${arrowTop}px`}
          w="10px"
          h="16px"
          zIndex={10002}
        >
          <svg width="10" height="16" viewBox="0 0 10 16">
            <path
              d="M 0 0 L 10 8 L 0 16"
              fill={RETRO_ONBOARDING_THEME.surface}
              stroke={RETRO_ONBOARDING_THEME.border}
              strokeWidth="2"
            />
          </svg>
        </Box>
      );
    }

    if (resolvedPlacement === 'right') {
      const arrowTop = clamp(targetCenterY - bTop - 8, 12, bubbleHeight - 28);
      return (
        <Box
          position="absolute"
          left="-10px"
          top={`${arrowTop}px`}
          w="10px"
          h="16px"
          zIndex={10002}
        >
          <svg width="10" height="16" viewBox="0 0 10 16">
            <path
              d="M 10 0 L 0 8 L 10 16"
              fill={RETRO_ONBOARDING_THEME.surface}
              stroke={RETRO_ONBOARDING_THEME.border}
              strokeWidth="2"
            />
          </svg>
        </Box>
      );
    }

    return null;
  };

  if (!step) return null;

  return (
    <AnimatePresence mode="wait">
      {step.kind === 'concept-card' ? (
        <>
          <motion.div
            key={`${step.id}-backdrop`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9999,
            }}
          />
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
          >
            <Box w="420px" maxW="90vw">
              <RetroWindowFrame title={step.title} label="Briefing">
                <VStack spacing={4} align="stretch">
                  {step.icon ? (
                    <Text
                      fontSize="3xl"
                      mb={1}
                      textAlign="center"
                      color={RETRO_ONBOARDING_THEME.accent}
                    >
                      {step.icon}
                    </Text>
                  ) : null}

                  {step.bullets?.length ? (
                    <VStack spacing={2} align="stretch" pl={2}>
                      {step.bullets.map((bullet, index) => (
                        <Box
                          key={`${step.id}-bullet-${index}`}
                          display="flex"
                          gap={2}
                          alignItems="flex-start"
                        >
                          <Text
                            color={RETRO_ONBOARDING_THEME.accent}
                            fontSize="sm"
                            mt="1px"
                            flexShrink={0}
                          >
                            ■
                          </Text>
                          <Text
                            color={RETRO_ONBOARDING_THEME.text}
                            fontSize="sm"
                            fontFamily={UI_FONT}
                          >
                            {bullet}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : null}

                  {step.example ? (
                    <Box
                      bg={RETRO_ONBOARDING_THEME.hintSurface}
                      border="1px solid"
                      borderColor={RETRO_ONBOARDING_THEME.hintBorder}
                      p={3}
                      fontFamily={CODE_FONT}
                    >
                      <Text
                        color={RETRO_ONBOARDING_THEME.accent}
                        fontSize="xs"
                        mb={1}
                        opacity={0.88}
                        fontFamily={UI_FONT}
                      >
                        Example:
                      </Text>
                      <Text color={RETRO_ONBOARDING_THEME.text} fontSize="sm" whiteSpace="pre-wrap">
                        {step.example}
                      </Text>
                      {step.exampleOutput ? (
                        <>
                          <Text
                            color={RETRO_ONBOARDING_THEME.accent}
                            fontSize="xs"
                            mt={2}
                            mb={1}
                            opacity={0.88}
                            fontFamily={UI_FONT}
                          >
                            Output:
                          </Text>
                          <Text color="#4b3705" fontSize="sm">
                            {step.exampleOutput}
                          </Text>
                        </>
                      ) : null}
                    </Box>
                  ) : null}

                  {step.answerCode ? (
                    <Box
                      bg={RETRO_ONBOARDING_THEME.hintSurface}
                      border="1px solid"
                      borderColor={RETRO_ONBOARDING_THEME.hintBorder}
                      p={3}
                      fontFamily={CODE_FONT}
                    >
                      <Text
                        color={RETRO_ONBOARDING_THEME.accent}
                        fontSize="xs"
                        mb={1}
                        opacity={0.9}
                        fontFamily={UI_FONT}
                      >
                        {step.answerLabel || 'Type this:'}
                      </Text>
                      <Text color={RETRO_ONBOARDING_THEME.text} fontSize="sm" whiteSpace="pre-wrap">
                        {step.answerCode}
                      </Text>
                    </Box>
                  ) : null}

                  {step.missionReasonBody ? (
                    <Box
                      bg={RETRO_ONBOARDING_THEME.warningSurface}
                      border="1px solid"
                      borderColor={RETRO_ONBOARDING_THEME.warningBorder}
                      p={3}
                    >
                      <Text
                        color="#5c4708"
                        fontSize="xs"
                        mb={1}
                        opacity={0.95}
                        fontFamily={UI_FONT}
                      >
                        {step.missionReasonTitle || 'Why this matters'}
                      </Text>
                      <Text color={RETRO_ONBOARDING_THEME.text} fontSize="xs" fontFamily={UI_FONT}>
                        {step.missionReasonBody}
                      </Text>
                    </Box>
                  ) : null}

                  <Button
                    onClick={() => onCompleteStep(step.id)}
                    isDisabled={isContinueButtonDisabled}
                    fontSize="sm"
                    size="lg"
                    mt={2}
                    sx={getHighContrastButtonSx({ stepId: step.id })}
                  >
                    {step.actionLabel || 'Continue'}
                  </Button>
                </VStack>
              </RetroWindowFrame>
            </Box>
          </motion.div>
        </>
      ) : step.kind === 'transmission' ? (
        <>
          <motion.div
            key={`${step.id}-dim`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{
              position: 'fixed',
              inset: 0,
              background:
                step.presentation === 'minimal-transmission'
                  ? 'rgba(2, 8, 16, 0.12)'
                  : 'rgba(2, 8, 16, 0.42)',
              backdropFilter: step.presentation === 'minimal-transmission' ? 'none' : 'blur(1px)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          />
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'fixed',
              zIndex: 10001,
              pointerEvents: 'none',
              ...transmissionStyle,
            }}
          >
            <Box
              position="absolute"
              top={step.presentation === 'minimal-transmission' ? '10%' : '8%'}
              left="5%"
              right={step.presentation === 'minimal-transmission' ? '36%' : '28%'}
            >
              <RetroWindowFrame
                title={step.title}
                label={step.presentation === 'minimal-transmission' ? 'Signal' : 'Transmission'}
              >
                <TypedText
                  text={step.message}
                  color={RETRO_ONBOARDING_THEME.text}
                  fontSize={step.presentation === 'minimal-transmission' ? 'sm' : 'md'}
                />
              </RetroWindowFrame>
            </Box>
          </motion.div>
        </>
      ) : (
        <>
          <motion.div
            key={`${step.id}-dim`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: preserveFocusReadability ? 'rgba(2, 8, 16, 0.1)' : 'rgba(2, 8, 16, 0.38)',
              backdropFilter: preserveFocusReadability ? 'none' : 'blur(4px)',
              zIndex: 9997,
              pointerEvents: 'none',
              clipPath: clipPath,
            }}
          />

          {normalizedTargetRect && !preserveFocusReadability ? (
            <motion.div
              key={`${step.id}-spotlight`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              style={{
                position: 'fixed',
                pointerEvents: 'none',
                zIndex: 9998,
                background: 'transparent',
                boxShadow: '0 0 0 9999px rgba(2, 8, 16, 0.50)',
                ...backdropFrameStyle,
              }}
            />
          ) : null}

          {normalizedTargetRect ? (
            <motion.div
              key={`${step.id}-frame`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: `${normalizedTargetRect.top - 8}px`,
                left: `${normalizedTargetRect.left - 8}px`,
                width: `${normalizedTargetRect.width + 16}px`,
                height: `${normalizedTargetRect.height + 16}px`,
                borderRadius: '0px',
                border: '2px solid rgba(0, 255, 140, 0.85)',
                boxShadow:
                  'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(104, 104, 104, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.72)',
                pointerEvents: 'none',
                zIndex: 9998,
              }}
            />
          ) : null}

          {tickerCallout ? (
            <motion.div
              key={`${step.id}-ticker-strip`}
              data-tutorial="onboarding-mobile-ticker-strip"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: `${mobileTickerTopOffset}px`,
                left: 0,
                right: 0,
                zIndex: 10002,
                pointerEvents: requiresManualContinue ? 'auto' : 'none',
              }}
            >
              <Box position="relative" minH="58px">
                <RetroWindowFrame title={step.title} label="Ticker" compact>
                  <Text
                    color={RETRO_ONBOARDING_THEME.text}
                    fontSize="12px"
                    lineHeight="1.35"
                    fontFamily={UI_FONT}
                  >
                    {tickerText || compactWriteCodeTickerText}
                  </Text>
                  {requiresManualContinue ? (
                    <Flex justify="flex-end" mt={2}>
                      <Button
                        size="xs"
                        isDisabled={isContinueButtonDisabled}
                        onClick={() => onCompleteStep(step.id)}
                        sx={getHighContrastButtonSx({ compact: true, stepId: step.id })}
                      >
                        {continueButtonLabel}
                      </Button>
                    </Flex>
                  ) : null}
                </RetroWindowFrame>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key={step.id}
              ref={bubbleRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              style={{
                position: 'fixed',
                zIndex: 10001,
                pointerEvents: requiresManualContinue ? 'auto' : 'none',
                ...bubbleStyle,
              }}
            >
              <RetroWindowFrame
                title={step.title}
                label="Callout"
                compact={useCompactWriteCodeLayout}
              >
                {useCompactWriteCodeLayout ? (
                  <Text
                    color={RETRO_ONBOARDING_THEME.text}
                    fontSize="sm"
                    lineHeight="1.5"
                    fontFamily={UI_FONT}
                  >
                    {step.message}
                  </Text>
                ) : (
                  <TypedText text={step.message} fontSize="clamp(0.98rem, 1.2vw, 1.18rem)" />
                )}
                {step.subtext ? (
                  <Box mt={3}>
                    {useCompactWriteCodeLayout ? (
                      <Text
                        color={RETRO_ONBOARDING_THEME.secondaryText}
                        fontSize="xs"
                        lineHeight="1.5"
                        fontFamily={UI_FONT}
                      >
                        {step.subtext}
                      </Text>
                    ) : (
                      <TypedText
                        text={step.subtext}
                        color={RETRO_ONBOARDING_THEME.secondaryText}
                        fontSize="xs"
                      />
                    )}
                  </Box>
                ) : null}
                {step.answerCode ? (
                  <Box
                    mt={3}
                    px={3}
                    py={2}
                    bg={RETRO_ONBOARDING_THEME.hintSurface}
                    border="1px solid"
                    borderColor={RETRO_ONBOARDING_THEME.hintBorder}
                  >
                    <Text
                      color={RETRO_ONBOARDING_THEME.accent}
                      fontSize="2xs"
                      mb={1}
                      letterSpacing="0.08em"
                      fontFamily={UI_FONT}
                    >
                      {step.answerLabel || 'TYPE THIS ANSWER'}
                    </Text>
                    <Text
                      color={RETRO_ONBOARDING_THEME.text}
                      fontSize={compactWriteCodeStep ? 'xs' : 'sm'}
                      lineHeight={compactWriteCodeStep ? '1.35' : '1.45'}
                      fontFamily={CODE_FONT}
                      whiteSpace="pre-wrap"
                    >
                      {step.answerCode}
                    </Text>
                  </Box>
                ) : null}
                {requiresManualContinue ? (
                  <Flex justify="flex-end" mt={3}>
                    <Button
                      size="sm"
                      isDisabled={isContinueButtonDisabled}
                      onClick={() => onCompleteStep(step.id)}
                      sx={getHighContrastButtonSx({ stepId: step.id })}
                    >
                      {continueButtonLabel}
                    </Button>
                  </Flex>
                ) : null}
              </RetroWindowFrame>
              {renderArrow()}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
