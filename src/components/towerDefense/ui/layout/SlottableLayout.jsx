/**
 * SlottableLayout - Swappable Container Panel System
 *
 * A layout system with two fixed containers that can display different content
 * based on which button is "slotted" into them.
 *
 * REUSES: All content panels (CodeEditorPanel, ProblemDrawer, etc.) are existing components.
 * This file ONLY handles the slot/drag logic and container layout.
 */

import { Box, Button, Flex, HStack, Text, Tooltip, useToast, VStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { FaBook, FaCode, FaComments, FaGamepad } from 'react-icons/fa';
import { resolveMobilePanelSizing, shouldUseFixedHeightMobilePanel } from './mobilePanelSizing';
import { PANEL_TYPES } from './panelTypes';
import {
  resolveFocusedDesktopSlots,
  TD_ONBOARDING_STEP_CHANGE_EVENT,
} from '../../onboarding/inlineOnboardingEvents';
import { releaseScreenOrientation } from '../../../../utils/mobile/screenOrientation';
import { buildResponsiveProfile } from '../../../../utils/web/responsiveProfile';
import {
  RETRO_DESKTOP_BADGE_ASSET,
  RETRO_PANEL_ICON_ASSETS,
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';
import {
  readTowerDefenseShellVisible,
  writeTowerDefenseShellVisible,
} from '../../../../utils/ui/towerDefenseShellVisibility';

// Slot button glow animation
const slotGlow = keyframes`
  0% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 15px currentColor; }
  100% { box-shadow: 0 0 5px currentColor; }
`;

const panelFocusPulse = keyframes`
  0% {
    box-shadow: 0 0 0 rgba(0, 255, 255, 0), 0 0 22px rgba(0, 255, 255, 0.12), inset 0 0 22px rgba(0, 255, 255, 0.05);
  }
  50% {
    box-shadow: 0 0 0 rgba(0, 255, 255, 0), 0 0 40px rgba(0, 255, 255, 0.22), inset 0 0 30px rgba(0, 255, 255, 0.08);
  }
  100% {
    box-shadow: 0 0 0 rgba(0, 255, 255, 0), 0 0 22px rgba(0, 255, 255, 0.12), inset 0 0 22px rgba(0, 255, 255, 0.05);
  }
`;

// Panel configurations
const PANEL_CONFIG = {
  [PANEL_TYPES.GAME]: {
    icon: FaGamepad,
    label: 'Game',
    color: '#00ff8c',
    shortLabel: '🎮',
  },
  [PANEL_TYPES.EDITOR]: {
    icon: FaCode,
    label: 'Editor',
    color: '#00ccff',
    shortLabel: '📝',
  },
  [PANEL_TYPES.CHAT]: {
    icon: FaComments,
    label: 'Chat',
    color: '#9966ff',
    shortLabel: '💬',
  },
  [PANEL_TYPES.PROBLEM]: {
    icon: FaBook,
    label: 'Problem',
    color: '#ff9900',
    shortLabel: '📖',
  },
};

const RETRO_DESKTOP_THEME = {
  panelBg: '#d4d0c8',
  panelBorder: '#686868',
  panelShadow:
    'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(110, 110, 110, 0.34), 0 10px 20px rgba(0, 0, 0, 0.14)',
  shellBg: 'linear-gradient(180deg, #008080 0%, #0a6d70 100%)',
  shellGrid: 'none',
  shellGridSize: 'auto',
  shellBorder: '#161616',
  shellShadow:
    'inset 2px 2px 0 rgba(255, 255, 255, 0.18), inset -2px -2px 0 rgba(0, 0, 0, 0.22), 0 26px 38px rgba(0, 0, 0, 0.16)',
  titleText: '#f5f7ff',
  subtitleText: 'rgba(255, 255, 255, 0.82)',
  captionBg: 'linear-gradient(90deg, #000080 0%, #0a3ca6 100%)',
  taskbarBg: 'linear-gradient(180deg, #dedbd4 0%, #c8c3b9 100%)',
  taskbarBorder: '#161616',
  taskbarText: '#151515',
  taskbarChipBg: '#d4d0c8',
  taskbarChipBorder: '#6f6f6f',
  taskbarInset:
    'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.32)',
};
const RETRO_DESKTOP_STAGE_MIN_HEIGHT_EMBEDDED = '420px';
const RETRO_DESKTOP_STAGE_MIN_HEIGHT_STANDALONE = 'clamp(620px, 80vh, 1000px)';
const TASKBAR_DRAG_DATA_KEY = 'application/x-codegrind-taskbar-side';

export const resolveRetroDesktopStageMinHeight = (desktopShellSizingMode = 'embedded') =>
  desktopShellSizingMode === 'standalone'
    ? RETRO_DESKTOP_STAGE_MIN_HEIGHT_STANDALONE
    : RETRO_DESKTOP_STAGE_MIN_HEIGHT_EMBEDDED;

const getClientX = (event) => {
  if (typeof event?.clientX === 'number') {
    return event.clientX;
  }

  if (event?.touches?.length) {
    return event.touches[0].clientX;
  }

  if (event?.changedTouches?.length) {
    return event.changedTouches[0].clientX;
  }

  return null;
};

const detectMobileSlotLayout = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isHandheldSinglePanelLayout;
};

const detectCompactMobileLandscapeViewport = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isHandheldCompactLandscape;
};

const detectHandheldRuntimeDevice = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isHandheldDevice;
};

/**
 * ContainerSlot - The notch/slot indicator above each container
 */
const ContainerSlot = ({
  label,
  activePanel,
  onClick,
  isLocked = false,
  lockReason = '',
  isBriefStep = false,
}) => {
  const config = activePanel ? PANEL_CONFIG[activePanel] : null;
  const Icon = config?.icon;
  const tooltipLabel = isLocked
    ? lockReason || 'This slot is locked while an active wave is running.'
    : 'Click to cycle this slot through the available panels';

  return (
    <Tooltip label={tooltipLabel}>
      <Button
        size="sm"
        variant="outline"
        leftIcon={Icon ? <Icon /> : undefined}
        onClick={onClick}
        aria-disabled={isLocked}
        data-tutorial={`slot-${label.toLowerCase()}`}
        data-learning-slot={label.toLowerCase()}
        data-tutorial-role="panel-switcher"
        sx={{
          minW: '160px',
          justifyContent: 'flex-start',
          color: config ? config.color : 'gray.400',
          bg: config ? `${config.color}16` : 'rgba(255,255,255,0.05)',
          borderColor: config ? config.color : 'rgba(255,255,255,0.2)',
          fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          animation: config ? `${slotGlow} 2s infinite` : 'none',
          _hover: {
            bg: isLocked
              ? 'rgba(80, 18, 18, 0.35)'
              : config
                ? `${config.color}28`
                : 'rgba(255,255,255,0.1)',
            borderColor: isLocked
              ? 'rgba(255, 102, 102, 0.55)'
              : config
                ? config.color
                : 'rgba(255,255,255,0.4)',
            transform: isLocked ? 'none' : 'translateY(-1px)',
          },
          ...(isLocked
            ? {
                opacity: 0.7,
                cursor: 'not-allowed',
                borderColor: isBriefStep ? 'rgba(0, 255, 140, 0.2)' : 'rgba(255, 102, 102, 0.55)',
                color: isBriefStep ? 'rgba(0, 255, 140, 0.4)' : 'rgba(255, 170, 170, 0.92)',
                bg: isBriefStep ? 'rgba(0, 20, 40, 0.4)' : 'rgba(80, 18, 18, 0.35)',
                filter: isBriefStep ? 'blur(2px)' : 'none',
              }
            : {}),
          _disabled: {
            opacity: 0.7,
            cursor: 'not-allowed',
            borderColor: 'rgba(255, 102, 102, 0.55)',
            color: 'rgba(255, 170, 170, 0.92)',
            bg: 'rgba(80, 18, 18, 0.35)',
          },
        }}
      >
        {label}: {config ? config.label : 'Empty'}
      </Button>
    </Tooltip>
  );
};

const TaskbarSideBadge = ({
  slot,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  isLocked = false,
  lockReason = '',
}) => {
  const slotLabel = slot === 'right' ? 'RIGHT' : 'LEFT';
  const badgeLabel = slot === 'right' ? 'R' : 'L';
  const tooltipLabel = isLocked
    ? lockReason || 'This slot is locked while an active wave is running.'
    : `Drag ${badgeLabel} onto a window, or click ${badgeLabel} and then click a window to assign the ${slotLabel.toLowerCase()} desktop slot.`;

  return (
    <Tooltip label={tooltipLabel}>
      <Button
        data-tutorial-role="side-badge"
        variant="unstyled"
        aria-label={`${slotLabel} side badge`}
        aria-pressed={isSelected}
        isDisabled={isLocked}
        onClick={onClick}
        draggable={!isLocked}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        sx={{
          minW: { base: '84px', md: '96px' },
          minH: '48px',
          borderRadius: '0',
          border: `2px solid ${RETRO_DESKTOP_THEME.taskbarChipBorder}`,
          boxShadow: `${RETRO_DESKTOP_THEME.taskbarInset}, 0 6px 10px rgba(0, 0, 0, 0.12)`,
          bg: isSelected ? '#ece7de' : '#d8d3c9',
          color: RETRO_DESKTOP_THEME.taskbarText,
          px: 2.5,
          py: 2,
          textAlign: 'left',
          transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease',
          _hover: {
            bg: isSelected ? '#f3efe7' : '#ece9e1',
            transform: isLocked ? 'none' : 'translateY(1px)',
            boxShadow: `${RETRO_DESKTOP_THEME.taskbarInset}, 0 4px 8px rgba(0, 0, 0, 0.1)`,
          },
          _disabled: {
            opacity: 0.66,
            cursor: 'not-allowed',
          },
        }}
      >
        <VStack align="stretch" spacing={1}>
          <HStack justify="space-between" spacing={1}>
            <Text
              color={RETRO_DESKTOP_THEME.taskbarText}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize="11px"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              {badgeLabel}
            </Text>
            {isLocked ? (
              <Box
                px={1}
                py={0.5}
                border="1px solid #7d4747"
                bg="#ead3d3"
                boxShadow={RETRO_DESKTOP_THEME.taskbarInset}
              >
                <Text
                  color="#7d1d1d"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="9px"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Locked
                </Text>
              </Box>
            ) : null}
          </HStack>
          <Text
            color="#2f2f2f"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="10px"
            fontWeight="700"
            lineHeight="1.2"
            noOfLines={1}
          >
            {slotLabel}
          </Text>
        </VStack>
      </Button>
    </Tooltip>
  );
};

const TaskbarPanelButton = ({
  panelType,
  assignmentLabels = [],
  activeSide = null,
  isDropTarget = false,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}) => {
  const config = panelType ? PANEL_CONFIG[panelType] : null;
  const Icon = config?.icon;
  const retroIconSrc = panelType ? RETRO_PANEL_ICON_ASSETS[panelType] || null : null;
  const isActive = assignmentLabels.length > 0;
  const activeSideLabel = activeSide === 'right' ? 'RIGHT' : activeSide === 'left' ? 'LEFT' : null;
  const tooltipLabel = activeSideLabel
    ? isActive
      ? `${config?.label || panelType} is open on ${assignmentLabels.join(' / ')}. Drop ${activeSideLabel} here or click to assign it to the ${activeSideLabel} slot.`
      : `Drop ${activeSideLabel} here or click to assign ${config?.label || panelType} to the ${activeSideLabel} slot.`
    : `${config?.label || panelType} is open on ${assignmentLabels.join(' / ') || 'the taskbar'}. Choose a side badge first.`;
  const assignmentBadge = assignmentLabels[0] || null;

  return (
    <Tooltip label={tooltipLabel}>
      <Button
        variant="unstyled"
        aria-label={`${config?.label || panelType} window`}
        aria-pressed={isActive}
        onClick={onClick}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        data-tutorial-role="panel-switcher"
        data-tutorial={`desktop-slot-${String(panelType || '').toLowerCase()}`}
        data-learning-slot={String(panelType || '').toLowerCase()}
        sx={{
          minW: { base: '164px', md: '176px' },
          minH: '50px',
          flex: '0 0 auto',
          borderRadius: '0',
          border: `2px solid ${isDropTarget ? '#0a3ca6' : RETRO_DESKTOP_THEME.taskbarChipBorder}`,
          boxShadow: isDropTarget
            ? `inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.72), 0 0 12px rgba(10, 60, 166, 0.22)`
            : `${RETRO_DESKTOP_THEME.taskbarInset}, 0 6px 10px rgba(0, 0, 0, 0.12)`,
          bg: isActive ? '#ebe7de' : RETRO_DESKTOP_THEME.taskbarChipBg,
          color: RETRO_DESKTOP_THEME.taskbarText,
          px: 2.5,
          py: 2,
          textAlign: 'left',
          transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease',
          overflow: 'hidden',
          _hover: {
            bg: isActive ? '#f4f0e8' : '#ece9e1',
            transform: 'translateY(1px)',
            boxShadow: isDropTarget
              ? `inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.72), 0 0 12px rgba(10, 60, 166, 0.22)`
              : `${RETRO_DESKTOP_THEME.taskbarInset}, 0 4px 8px rgba(0, 0, 0, 0.1)`,
          },
        }}
      >
        <Flex align="center" gap={2.5}>
          <Box
            minW="32px"
            h="32px"
            display="grid"
            placeItems="center"
            borderRadius="0"
            bg="#c8c2b7"
            border={`1px solid ${RETRO_DESKTOP_THEME.taskbarChipBorder}`}
            boxShadow={RETRO_DESKTOP_THEME.taskbarInset}
          >
            {retroIconSrc ? (
              <Box
                as="img"
                src={retroIconSrc}
                alt=""
                aria-hidden="true"
                flexShrink={0}
                w="16px"
                h="16px"
                imageRendering="pixelated"
              />
            ) : Icon ? (
              <Box as={Icon} color={config?.color || '#6f5b48'} flexShrink={0} />
            ) : null}
          </Box>

          <Flex direction="column" gap={1} minW={0} flex={1}>
            <Text
              color={RETRO_DESKTOP_THEME.taskbarText}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize="var(--cg-font-size-ui)"
              fontWeight="700"
              letterSpacing="0.04em"
              lineHeight="1.15"
              noOfLines={1}
            >
              {config ? config.label : panelType}
            </Text>
            <Text
              color="rgba(21, 21, 21, 0.72)"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize="var(--cg-font-size-micro)"
              letterSpacing="0.04em"
              lineHeight="1.15"
              noOfLines={1}
            >
              {activeSideLabel
                ? `Drop ${activeSideLabel}`
                : isActive
                  ? `Open on ${assignmentLabels.join(' / ')}`
                  : 'Choose L or R'}
            </Text>
          </Flex>

          {assignmentBadge ? (
            <Box
              flexShrink={0}
              px={1.25}
              py={0.5}
              border="1px solid #5b6373"
              bg={assignmentBadge === 'RIGHT' ? '#ddd7ef' : '#d7e0ef'}
              boxShadow={RETRO_DESKTOP_THEME.taskbarInset}
            >
              <Text
                color="#253040"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                fontSize="var(--cg-font-size-micro)"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
                textAlign="center"
              >
                {assignmentBadge}
              </Text>
            </Box>
          ) : null}
        </Flex>
      </Button>
    </Tooltip>
  );
};

/**
 * SlottableLayout - Main layout component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.gameContent - Canvas/game content
 * @param {React.ReactNode} props.editorContent - Code editor content
 * @param {React.ReactNode} props.chatContent - AI chat content
 * @param {React.ReactNode} props.problemContent - Problem description content
 * @param {React.ReactNode} props.header - Optional custom header content
 * @param {React.ReactNode} props.actionBar - Action buttons (Jack In, Start Wave, etc.)
 * @param {string} props.defaultLeftPanel - Default panel for left container
 * @param {string} props.defaultRightPanel - Default panel for right container
 * @param {Record<string, React.ReactNode>} props.panelChromeByType - Optional slot chrome keyed by panel type
 * @param {string} props.shellTheme - Optional embedded shell theme variant
 */
function SlottableLayout({
  gameContent,
  editorContent,
  chatContent,
  problemContent,
  header,
  actionBar,
  panelChromeByType,
  defaultLeftPanel = PANEL_TYPES.GAME,
  defaultRightPanel = PANEL_TYPES.EDITOR,
  hiddenPanels = [],
  leftPanel: controlledLeftPanel,
  rightPanel: controlledRightPanel,
  onPanelChange,
  lockedSlots = null,
  shellTheme = 'default',
  allowEmbeddedHandheldPageScroll = false,
  desktopShellSizingMode = 'embedded',
  isGamePanelBlurred = false,
}) {
  const toast = useToast();

  // Track which panel is in which container
  const [leftPanelState, setLeftPanelState] = useState(defaultLeftPanel);
  const [rightPanelState, setRightPanelState] = useState(defaultRightPanel);
  const leftPanel = controlledLeftPanel ?? leftPanelState;
  const rightPanel = controlledRightPanel ?? rightPanelState;
  const [leftWidthPercent, setLeftWidthPercent] = useState(50);
  const [desktopTaskbarTarget, setDesktopTaskbarTarget] = useState(null);
  const [desktopTaskbarDragSide, setDesktopTaskbarDragSide] = useState(null);
  const [desktopTaskbarDropTarget, setDesktopTaskbarDropTarget] = useState(null);
  const [isMobileLayout, setIsMobileLayout] = useState(() => detectMobileSlotLayout());
  const [isCompactMobileLandscape, setIsCompactMobileLandscape] = useState(() =>
    detectCompactMobileLandscapeViewport()
  );
  const [isHandheldRuntimeDevice, setIsHandheldRuntimeDevice] = useState(() =>
    detectHandheldRuntimeDevice()
  );
  const [mobileActivePanel, setMobileActivePanel] = useState(
    defaultLeftPanel ?? defaultRightPanel ?? null
  );
  const [activeOnboardingStep, setActiveOnboardingStep] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.__tdInlineOnboardingStepDetail?.step || null;
  });
  const isBriefStep = activeOnboardingStep?.id === 'mission-objective';
  const isResizingRef = useRef(false);
  const mobilePreviousNonChatPanelRef = useRef(defaultLeftPanel ?? defaultRightPanel ?? null);
  const chatFocusShellVisibilityRef = useRef(null);
  const lastOrientationRequestRef = useRef(null);
  const desktopPanelSnapshotRef = useRef({
    leftPanel: defaultLeftPanel,
    rightPanel: defaultRightPanel,
  });
  const wasMobileLayoutRef = useRef(isMobileLayout);

  const availablePanels = useMemo(
    () => Object.values(PANEL_TYPES).filter((panelType) => !hiddenPanels.includes(panelType)),
    [hiddenPanels]
  );
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const retroDesktopStageMinHeight = resolveRetroDesktopStageMinHeight(desktopShellSizingMode);

  const panelContentByType = useMemo(
    () => ({
      [PANEL_TYPES.GAME]: gameContent,
      [PANEL_TYPES.EDITOR]: editorContent,
      [PANEL_TYPES.CHAT]: chatContent,
      [PANEL_TYPES.PROBLEM]: problemContent,
    }),
    [chatContent, editorContent, gameContent, problemContent]
  );

  const normalizePanels = useCallback((nextLeft, nextRight, reason) => {
    if (nextLeft && nextRight && nextLeft === nextRight) {
      const preferRight = typeof reason === 'string' && reason.includes('right');
      return preferRight
        ? { leftPanel: null, rightPanel: nextRight }
        : { leftPanel: nextLeft, rightPanel: null };
    }
    return { leftPanel: nextLeft, rightPanel: nextRight };
  }, []);

  const updatePanels = useCallback(
    (nextLeft, nextRight, reason) => {
      const normalized = normalizePanels(nextLeft, nextRight, reason);
      if (controlledLeftPanel === undefined) {
        setLeftPanelState(normalized.leftPanel);
      }
      if (controlledRightPanel === undefined) {
        setRightPanelState(normalized.rightPanel);
      }
      if (onPanelChange) {
        onPanelChange({
          leftPanel: normalized.leftPanel,
          rightPanel: normalized.rightPanel,
          reason,
        });
      }
    },
    [controlledLeftPanel, controlledRightPanel, onPanelChange, normalizePanels]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnboardingStepChange = (event) => {
      setActiveOnboardingStep(event?.detail?.step || null);
    };

    window.addEventListener(TD_ONBOARDING_STEP_CHANGE_EVENT, handleOnboardingStepChange);

    return () => {
      window.removeEventListener(TD_ONBOARDING_STEP_CHANGE_EVENT, handleOnboardingStepChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewportChange = () => {
      setIsMobileLayout(detectMobileSlotLayout());
      setIsCompactMobileLandscape(detectCompactMobileLandscapeViewport());
      setIsHandheldRuntimeDevice(detectHandheldRuntimeDevice());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    const isControlledLayout =
      controlledLeftPanel !== undefined || controlledRightPanel !== undefined;

    setMobileActivePanel((previous) => {
      if (isControlledLayout) {
        if (leftPanel && availablePanels.includes(leftPanel)) return leftPanel;
        if (rightPanel && availablePanels.includes(rightPanel)) return rightPanel;
      }
      if (previous && availablePanels.includes(previous)) return previous;
      if (leftPanel && availablePanels.includes(leftPanel)) return leftPanel;
      if (rightPanel && availablePanels.includes(rightPanel)) return rightPanel;
      return availablePanels[0] ?? null;
    });
  }, [availablePanels, controlledLeftPanel, controlledRightPanel, leftPanel, rightPanel]);

  useEffect(() => {
    if (!mobileActivePanel || mobileActivePanel === PANEL_TYPES.CHAT) return;
    mobilePreviousNonChatPanelRef.current = mobileActivePanel;
  }, [mobileActivePanel]);

  useEffect(() => {
    if (!availablePanels.length) return;

    if (isMobileLayout && !wasMobileLayoutRef.current) {
      desktopPanelSnapshotRef.current = { leftPanel, rightPanel };

      const nextMobilePanel =
        (leftPanel && availablePanels.includes(leftPanel) && leftPanel) ||
        (rightPanel && availablePanels.includes(rightPanel) && rightPanel) ||
        availablePanels[0] ||
        null;

      if (nextMobilePanel && (leftPanel !== nextMobilePanel || rightPanel !== null)) {
        updatePanels(nextMobilePanel, null, 'system-mobile-enter');
      }
      setMobileActivePanel(nextMobilePanel);
    }

    if (!isMobileLayout && wasMobileLayoutRef.current) {
      const snapshot = desktopPanelSnapshotRef.current;
      const restoredLeft =
        snapshot.leftPanel && availablePanels.includes(snapshot.leftPanel)
          ? snapshot.leftPanel
          : (availablePanels[0] ?? null);
      const restoredRight =
        snapshot.rightPanel &&
        availablePanels.includes(snapshot.rightPanel) &&
        snapshot.rightPanel !== restoredLeft
          ? snapshot.rightPanel
          : (availablePanels.find((panelType) => panelType !== restoredLeft) ?? null);

      if (leftPanel !== restoredLeft || rightPanel !== restoredRight) {
        updatePanels(restoredLeft, restoredRight, 'system-mobile-exit');
      }
    }

    wasMobileLayoutRef.current = isMobileLayout;
  }, [availablePanels, isMobileLayout, leftPanel, rightPanel, updatePanels]);

  const getNextAvailablePanel = useCallback(
    (currentPanel, excludePanel) => {
      if (!availablePanels.length) return null;
      const currentIndex = availablePanels.indexOf(currentPanel);
      const startIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availablePanels.length;
      for (let offset = 0; offset < availablePanels.length; offset += 1) {
        const idx = (startIndex + offset) % availablePanels.length;
        const candidate = availablePanels[idx];
        if (candidate !== excludePanel) return candidate;
      }
      return null;
    },
    [availablePanels]
  );

  const effectiveMobilePanel =
    (mobileActivePanel && availablePanels.includes(mobileActivePanel) && mobileActivePanel) ||
    availablePanels[0] ||
    null;
  const isMobileChatFocus = isMobileLayout && effectiveMobilePanel === PANEL_TYPES.CHAT;
  const { leftSlotFocused, rightSlotFocused } = useMemo(
    () =>
      isMobileLayout
        ? {
            leftSlotFocused: false,
            rightSlotFocused: false,
          }
        : resolveFocusedDesktopSlots(activeOnboardingStep, {
            leftPanel,
            rightPanel,
          }),
    [activeOnboardingStep, isMobileLayout, leftPanel, rightPanel]
  );
  const preserveDesktopSlotReadability =
    !isMobileLayout && Boolean(activeOnboardingStep?.preserveFocusReadability);
  const hasDesktopPanelFocus = Boolean(leftSlotFocused || rightSlotFocused);
  const leftSlotDimmed =
    !preserveDesktopSlotReadability && hasDesktopPanelFocus && !leftSlotFocused;
  const rightSlotDimmed =
    !preserveDesktopSlotReadability && hasDesktopPanelFocus && !rightSlotFocused;

  const buildPanelShellSx = (isFocused, isDimmed, panelType) => {
    const panelColor = isRetroDesktopTheme
      ? '#0a3ca6'
      : panelType
        ? PANEL_CONFIG[panelType]?.color || '#00ccff'
        : '#00ccff';

    const isBlurredGame = isGamePanelBlurred && panelType === PANEL_TYPES.GAME;

    return {
      transition:
        'border-color 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease, transform 0.22s ease, filter 0.5s ease',
      transform: isFocused ? 'translateY(-1px)' : 'none',
      filter: isBlurredGame
        ? 'blur(5px) opacity(0.6)'
        : isDimmed
          ? 'saturate(0.42) brightness(0.42)'
          : 'none',
      opacity: isBlurredGame ? 0.6 : isDimmed ? 0.5 : 1,
      pointerEvents: isBlurredGame ? 'none' : isDimmed ? 'none' : 'auto',
      borderColor: isFocused ? `${panelColor}aa` : undefined,
      animation: isFocused ? `${panelFocusPulse} 1.9s ease-in-out infinite` : 'none',
      '&::after': isDimmed
        ? {
            content: '""',
            position: 'absolute',
            inset: 0,
            bg: 'rgba(0, 2, 10, 0.58)',
            pointerEvents: 'none',
            zIndex: 2,
          }
        : undefined,
    };
  };

  // Handle clicking on a container slot to cycle or clear
  const isLeftSlotLocked = Boolean(lockedSlots?.left);
  const isRightSlotLocked = Boolean(lockedSlots?.right);

  const showSlotLockedToast = useCallback(
    (slot) => {
      const slotLabel = slot === 'right' ? 'Right' : 'Left';
      toast({
        id: `td-slot-lock-toast-${slotLabel.toLowerCase()}`,
        title: `${slotLabel} Slot Locked`,
        description:
          'Active combat is running in this slot. Wait for the wave to end before reassigning it.',
        status: 'warning',
        duration: 2600,
        isClosable: true,
        position: 'top',
      });
    },
    [toast]
  );

  const handleLeftSlotClick = useCallback(() => {
    if (isLeftSlotLocked) {
      showSlotLockedToast('left');
      return;
    }
    const nextLeft = getNextAvailablePanel(leftPanel, rightPanel);
    updatePanels(nextLeft, rightPanel, 'user-left-slot-cycle');
  }, [
    getNextAvailablePanel,
    isLeftSlotLocked,
    leftPanel,
    rightPanel,
    showSlotLockedToast,
    updatePanels,
  ]);

  const handleRightSlotClick = useCallback(() => {
    if (isRightSlotLocked) {
      showSlotLockedToast('right');
      return;
    }
    const nextRight = getNextAvailablePanel(rightPanel, leftPanel);
    updatePanels(leftPanel, nextRight, 'user-right-slot-cycle');
  }, [
    getNextAvailablePanel,
    isRightSlotLocked,
    leftPanel,
    rightPanel,
    showSlotLockedToast,
    updatePanels,
  ]);

  const assignPanelToDesktopSlot = useCallback(
    (panelType, requestedDestination) => {
      if (!panelType) return;
      if (requestedDestination !== 'left' && requestedDestination !== 'right') return;

      const destination = requestedDestination === 'right' ? 'right' : 'left';
      const sourceSlot =
        leftPanel === panelType ? 'left' : rightPanel === panelType ? 'right' : null;

      if (sourceSlot === destination) {
        return;
      }

      if (destination === 'left' && isLeftSlotLocked) {
        showSlotLockedToast('left');
        return;
      }

      if (destination === 'right' && isRightSlotLocked) {
        showSlotLockedToast('right');
        return;
      }

      if (sourceSlot === 'left' && isLeftSlotLocked) {
        showSlotLockedToast('left');
        return;
      }

      if (sourceSlot === 'right' && isRightSlotLocked) {
        showSlotLockedToast('right');
        return;
      }

      const currentLeft = leftPanel;
      const currentRight = rightPanel;
      let nextLeft = currentLeft;
      let nextRight = currentRight;

      if (destination === 'left') {
        nextLeft = panelType;
        if (sourceSlot === 'right') {
          nextRight = currentLeft;
        }
      } else {
        nextRight = panelType;
        if (sourceSlot === 'left') {
          nextLeft = currentRight;
        }
      }

      updatePanels(nextLeft, nextRight, `user-taskbar-assign-${destination}`);
    },
    [isLeftSlotLocked, isRightSlotLocked, leftPanel, rightPanel, showSlotLockedToast, updatePanels]
  );

  const clearDesktopTaskbarSelection = useCallback(() => {
    setDesktopTaskbarTarget(null);
    setDesktopTaskbarDragSide(null);
    setDesktopTaskbarDropTarget(null);
  }, []);

  const handleTaskbarSideBadgeClick = useCallback(
    (slot) => {
      if (slot === 'left' && isLeftSlotLocked) {
        showSlotLockedToast('left');
        return;
      }

      if (slot === 'right' && isRightSlotLocked) {
        showSlotLockedToast('right');
        return;
      }

      setDesktopTaskbarTarget((currentTarget) => (currentTarget === slot ? null : slot));
      setDesktopTaskbarDragSide(null);
      setDesktopTaskbarDropTarget(null);
    },
    [isLeftSlotLocked, isRightSlotLocked, showSlotLockedToast]
  );

  const handleTaskbarSideDragStart = useCallback(
    (slot, event) => {
      if (slot === 'left' && isLeftSlotLocked) {
        showSlotLockedToast('left');
        return;
      }

      if (slot === 'right' && isRightSlotLocked) {
        showSlotLockedToast('right');
        return;
      }

      setDesktopTaskbarTarget(slot);
      setDesktopTaskbarDragSide(slot);
      setDesktopTaskbarDropTarget(null);

      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(TASKBAR_DRAG_DATA_KEY, slot);
        event.dataTransfer.setData('text/plain', slot);
      }
    },
    [isLeftSlotLocked, isRightSlotLocked, showSlotLockedToast]
  );

  const handleTaskbarSideDragEnd = useCallback(() => {
    setDesktopTaskbarDragSide(null);
    setDesktopTaskbarDropTarget(null);
  }, []);

  const resolveRequestedTaskbarSide = useCallback(
    (event) => {
      const transferSide =
        event?.dataTransfer?.getData(TASKBAR_DRAG_DATA_KEY) ||
        event?.dataTransfer?.getData('text/plain');

      if (transferSide === 'left' || transferSide === 'right') {
        return transferSide;
      }

      return desktopTaskbarTarget;
    },
    [desktopTaskbarTarget]
  );

  const handleTaskbarPanelClick = useCallback(
    (panelType) => {
      if (!desktopTaskbarTarget) {
        toast({
          id: 'td-taskbar-side-select',
          title: 'Choose A Side',
          description: 'Drag L or R onto a window, or click a side badge first.',
          status: 'info',
          duration: 1800,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      assignPanelToDesktopSlot(panelType, desktopTaskbarTarget);
      clearDesktopTaskbarSelection();
    },
    [assignPanelToDesktopSlot, clearDesktopTaskbarSelection, desktopTaskbarTarget, toast]
  );

  const handleTaskbarPanelDragEnter = useCallback((panelType) => {
    setDesktopTaskbarDropTarget(panelType);
  }, []);

  const handleTaskbarPanelDragLeave = useCallback((panelType) => {
    setDesktopTaskbarDropTarget((currentTarget) =>
      currentTarget === panelType ? null : currentTarget
    );
  }, []);

  const handleTaskbarPanelDragOver = useCallback(
    (event, panelType) => {
      const requestedSide = resolveRequestedTaskbarSide(event);
      if (!requestedSide) {
        return;
      }

      event.preventDefault();
      if (event?.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      setDesktopTaskbarDropTarget(panelType);
    },
    [resolveRequestedTaskbarSide]
  );

  const handleTaskbarPanelDrop = useCallback(
    (event, panelType) => {
      const requestedSide = resolveRequestedTaskbarSide(event);
      if (!requestedSide) {
        return;
      }

      event.preventDefault();
      assignPanelToDesktopSlot(panelType, requestedSide);
      clearDesktopTaskbarSelection();
    },
    [assignPanelToDesktopSlot, clearDesktopTaskbarSelection, resolveRequestedTaskbarSide]
  );

  const handleMobilePanelSwitch = useCallback(
    (nextPanel) => {
      if (!nextPanel || nextPanel === mobileActivePanel) return;

      const gameSlotLocked =
        (lockedSlots?.left && leftPanel === PANEL_TYPES.GAME) ||
        (lockedSlots?.right && rightPanel === PANEL_TYPES.GAME);

      if (gameSlotLocked && nextPanel !== PANEL_TYPES.GAME) {
        toast({
          id: 'td-slot-lock-toast',
          title: 'Game Slot Locked',
          description:
            'Active combat is running in this slot. Wait for the wave to end before switching away from Game view.',
          status: 'warning',
          duration: 2600,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      if (nextPanel !== PANEL_TYPES.CHAT) {
        mobilePreviousNonChatPanelRef.current = nextPanel;
      }

      setMobileActivePanel(nextPanel);
      updatePanels(nextPanel, null, 'user-mobile-panel-switch');
    },
    [leftPanel, lockedSlots, mobileActivePanel, rightPanel, toast, updatePanels]
  );

  useEffect(() => {
    if (leftPanel && hiddenPanels.includes(leftPanel)) {
      updatePanels(null, rightPanel, 'system-hidden');
    }
    if (rightPanel && hiddenPanels.includes(rightPanel)) {
      updatePanels(leftPanel, null, 'system-hidden');
    }
  }, [hiddenPanels, leftPanel, rightPanel, updatePanels]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleFocusChatPanel = () => {
      if (isMobileLayout) {
        handleMobilePanelSwitch(PANEL_TYPES.CHAT);
      } else {
        updatePanels(PANEL_TYPES.EDITOR, PANEL_TYPES.CHAT, 'user-focus-chat-panel');
      }
    };

    window.addEventListener('td-focus-chat-panel', handleFocusChatPanel);
    return () => {
      window.removeEventListener('td-focus-chat-panel', handleFocusChatPanel);
    };
  }, [isMobileLayout, handleMobilePanelSwitch, updatePanels]);

  useEffect(() => {
    if (leftPanel && rightPanel && leftPanel === rightPanel) {
      const normalized = normalizePanels(leftPanel, rightPanel, 'system-dedupe');
      if (normalized.leftPanel !== leftPanel || normalized.rightPanel !== rightPanel) {
        if (controlledLeftPanel === undefined) {
          setLeftPanelState(normalized.leftPanel);
        }
        if (controlledRightPanel === undefined) {
          setRightPanelState(normalized.rightPanel);
        }
        if (onPanelChange) {
          onPanelChange({
            leftPanel: normalized.leftPanel,
            rightPanel: normalized.rightPanel,
            reason: 'system-dedupe',
          });
        }
      }
    }
  }, [
    leftPanel,
    rightPanel,
    controlledLeftPanel,
    controlledRightPanel,
    onPanelChange,
    normalizePanels,
  ]);

  useEffect(() => {
    if (!isMobileLayout) {
      if (chatFocusShellVisibilityRef.current !== null) {
        writeTowerDefenseShellVisible(Boolean(chatFocusShellVisibilityRef.current));
        chatFocusShellVisibilityRef.current = null;
      }
      return;
    }

    if (isMobileChatFocus) {
      if (chatFocusShellVisibilityRef.current === null) {
        chatFocusShellVisibilityRef.current = readTowerDefenseShellVisible();
      }

      writeTowerDefenseShellVisible(false);

      if (lastOrientationRequestRef.current !== 'released') {
        lastOrientationRequestRef.current = 'released';
        void releaseScreenOrientation();
      }
      return;
    }

    if (chatFocusShellVisibilityRef.current !== null) {
      writeTowerDefenseShellVisible(Boolean(chatFocusShellVisibilityRef.current));
      chatFocusShellVisibilityRef.current = null;
    }

    if (lastOrientationRequestRef.current !== 'released') {
      lastOrientationRequestRef.current = 'released';
      void releaseScreenOrientation();
    }
  }, [isMobileChatFocus, isMobileLayout]);

  useEffect(
    () => () => {
      if (chatFocusShellVisibilityRef.current !== null) {
        writeTowerDefenseShellVisible(Boolean(chatFocusShellVisibilityRef.current));
        chatFocusShellVisibilityRef.current = null;
      }
      lastOrientationRequestRef.current = null;
    },
    []
  );

  // Determine which container each panel is in (for portals)
  const getPanelContainer = useCallback(
    (panelType) => {
      if (leftPanel === panelType) return 'LEFT';
      if (rightPanel === panelType) return 'RIGHT';
      return null;
    },
    [leftPanel, rightPanel]
  );

  // Refs for container elements (used for portals)
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);

  // Use state to track when containers are mounted (triggers re-render)
  const [, forceUpdate] = useState(0);

  // Callback refs to trigger re-render when containers are ready
  const leftContainerCallback = useCallback((node) => {
    leftContainerRef.current = node;
    if (node) forceUpdate((n) => n + 1);
  }, []);

  const rightContainerCallback = useCallback((node) => {
    rightContainerRef.current = node;
    if (node) forceUpdate((n) => n + 1);
  }, []);

  const handleResizeStart = useCallback((event) => {
    if (event?.cancelable) {
      event.preventDefault();
    }
    isResizingRef.current = true;
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isResizingRef.current) return;

      const clientX = getClientX(event);
      if (clientX === null) return;

      if (event?.type === 'touchmove' && event.cancelable) {
        event.preventDefault();
      }

      const container = leftContainerRef.current?.parentElement?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const nextPercent = (relativeX / rect.width) * 100;
      const clamped = Math.min(80, Math.max(20, nextPercent));
      setLeftWidthPercent(clamped);
    };

    const handlePointerUp = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, []);

  const renderSlotControl = (label, activePanel, onClick) => {
    const isLocked = label === 'LEFT' ? isLeftSlotLocked : isRightSlotLocked;
    return (
      <ContainerSlot
        label={label}
        activePanel={activePanel}
        onClick={onClick}
        isLocked={isLocked || isBriefStep}
        isBriefStep={isBriefStep}
        lockReason={
          isBriefStep
            ? 'This slot is locked during onboarding brief reading.'
            : 'Active combat is running in this slot. Wait for the wave to end before reassigning it.'
        }
      />
    );
  };

  const mobilePanelLocked =
    (lockedSlots?.left && leftPanel === PANEL_TYPES.GAME) ||
    (lockedSlots?.right && rightPanel === PANEL_TYPES.GAME);
  const useScrollableHandheldRetroShell =
    allowEmbeddedHandheldPageScroll && isRetroDesktopTheme && isMobileLayout;
  const useCompactMobilePanelGrid = isRetroDesktopTheme && isCompactMobileLandscape;

  const renderMobilePanelSwitcher = (activePanel) => (
    <Flex
      data-mobile-panel-switcher-layout={useCompactMobilePanelGrid ? 'compact-grid' : 'default'}
      gap={isCompactMobileLandscape ? 1.5 : 2}
      wrap={useCompactMobilePanelGrid ? 'wrap' : isCompactMobileLandscape ? 'nowrap' : 'wrap'}
      align="center"
      justify="flex-start"
      overflowX={
        useCompactMobilePanelGrid ? 'visible' : isCompactMobileLandscape ? 'auto' : 'visible'
      }
      pb={isCompactMobileLandscape ? 1 : 0}
      sx={
        isCompactMobileLandscape && !useCompactMobilePanelGrid
          ? {
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }
          : undefined
      }
      filter={isBriefStep ? 'blur(3px)' : undefined}
      pointerEvents={isBriefStep ? 'none' : undefined}
      opacity={isBriefStep ? 0.65 : undefined}
      userSelect={isBriefStep ? 'none' : undefined}
      transition="filter 0.3s ease, opacity 0.3s ease"
    >
      {availablePanels.map((panelType) => {
        const config = PANEL_CONFIG[panelType];
        const Icon = config?.icon;
        const retroIconSrc = RETRO_PANEL_ICON_ASSETS[panelType] || null;
        const isActive = panelType === activePanel;
        const isDisabled = mobilePanelLocked && panelType !== PANEL_TYPES.GAME;

        if (isRetroDesktopTheme) {
          return (
            <Button
              key={panelType}
              variant="unstyled"
              isDisabled={isDisabled}
              onClick={() => handleMobilePanelSwitch(panelType)}
              data-tutorial-role="panel-switcher"
              data-tutorial={`mobile-slot-${String(panelType || '').toLowerCase()}`}
              data-learning-slot="mobile"
              sx={{
                flex: useCompactMobilePanelGrid ? '1 1 calc(50% - 6px)' : '0 0 auto',
                flexShrink: 0,
                maxW: useCompactMobilePanelGrid ? 'calc(50% - 6px)' : 'none',
                minW: useCompactMobilePanelGrid
                  ? 'calc(50% - 6px)'
                  : isCompactMobileLandscape
                    ? { base: 'calc(50% - 6px)', md: '138px' }
                    : { base: 'calc(50% - 4px)', md: '156px' },
                borderRadius: '0',
                border: `2px solid ${RETRO_DESKTOP_THEME.taskbarChipBorder}`,
                bg: isActive ? '#ebe7de' : RETRO_DESKTOP_THEME.taskbarChipBg,
                boxShadow: `${RETRO_DESKTOP_THEME.taskbarInset}, 0 6px 10px rgba(0, 0, 0, 0.12)`,
                px: isCompactMobileLandscape ? 2 : 3,
                py: isCompactMobileLandscape ? 1.75 : 2.5,
                color: RETRO_DESKTOP_THEME.taskbarText,
                textAlign: 'left',
                transition: 'transform 140ms ease, background-color 140ms ease',
                _hover: {
                  bg: isActive ? '#f4f0e8' : '#ebe7de',
                  transform: isDisabled ? 'none' : 'translateY(1px)',
                },
                _disabled: {
                  opacity: 0.55,
                  cursor: 'not-allowed',
                },
              }}
            >
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  {retroIconSrc ? (
                    <Box
                      as="img"
                      src={retroIconSrc}
                      alt=""
                      aria-hidden="true"
                      w="18px"
                      h="18px"
                      imageRendering="pixelated"
                    />
                  ) : Icon ? (
                    <Box as={Icon} color={config?.color || '#6f5b48'} />
                  ) : null}
                  <Text
                    color={RETRO_DESKTOP_THEME.taskbarText}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize={isCompactMobileLandscape ? '11px' : 'xs'}
                    fontWeight="700"
                    letterSpacing="0.04em"
                  >
                    {config?.label || panelType}
                  </Text>
                </HStack>
                <Text
                  color="rgba(21, 21, 21, 0.68)"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={isCompactMobileLandscape ? '9px' : '10px'}
                  letterSpacing="0.04em"
                >
                  {isActive ? 'panel active' : 'open panel'}
                </Text>
              </VStack>
            </Button>
          );
        }

        return (
          <Button
            key={panelType}
            size={isCompactMobileLandscape ? 'xs' : 'sm'}
            variant={isActive ? 'solid' : 'outline'}
            colorScheme={isActive ? 'cyan' : 'gray'}
            leftIcon={Icon ? <Icon /> : undefined}
            isDisabled={isDisabled}
            onClick={() => handleMobilePanelSwitch(panelType)}
            data-tutorial-role="panel-switcher"
            data-tutorial={`mobile-slot-${String(panelType || '').toLowerCase()}`}
            data-learning-slot="mobile"
            fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
            letterSpacing="0.06em"
            textTransform="uppercase"
            flexShrink={0}
            whiteSpace="nowrap"
          >
            {config?.label || panelType}
          </Button>
        );
      })}
    </Flex>
  );

  const retroDesktopHeader = isRetroDesktopTheme ? (
    <Flex
      direction="column"
      gap={0}
      mb={0}
      borderRadius="0"
      border="2px solid"
      borderColor={RETRO_DESKTOP_THEME.shellBorder}
      bg={RETRO_DESKTOP_THEME.taskbarChipBg}
      boxShadow={RETRO_DESKTOP_THEME.taskbarInset}
    >
      <Flex
        align="center"
        justify="space-between"
        px={2}
        py={1.5}
        bg={RETRO_DESKTOP_THEME.captionBg}
        borderBottom="1px solid #161616"
      >
        <HStack spacing={2} align="center">
          <HStack spacing={2} align="center">
            <Box
              as="img"
              src={RETRO_DESKTOP_BADGE_ASSET}
              alt=""
              aria-hidden="true"
              w="16px"
              h="16px"
              imageRendering="pixelated"
              flexShrink={0}
            />
            <Text
              color={RETRO_DESKTOP_THEME.titleText}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="700"
              letterSpacing="0.03em"
            >
              {isHandheldRuntimeDevice ? 'CodeGrind Mobile Runtime' : 'CodeGrind Desktop Runtime'}
            </Text>
          </HStack>
        </HStack>
        <HStack spacing={1}>
          {['_', '[]', 'X'].map((symbol) => (
            <Box
              key={symbol}
              as="span"
              display="grid"
              placeItems="center"
              w="20px"
              h="20px"
              bgImage={`url(${RETRO_WINDOW_BUTTON_ASSET})`}
              bgRepeat="no-repeat"
              bgPosition="center"
              bgSize="100% 100%"
              color="#151515"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize="10px"
              fontWeight="700"
              lineHeight="1"
              imageRendering="pixelated"
            >
              {symbol}
            </Box>
          ))}
        </HStack>
      </Flex>
      <Flex
        align={{ base: 'start', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={2}
        px={{ base: 3, md: 4 }}
        py={{ base: 2.5, md: 3 }}
      >
        <Text
          color="#1a1a1a"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="xs"
          letterSpacing="0.04em"
          textTransform="uppercase"
        >
          Tower defense mission workspace
        </Text>

        <Text
          color="#3f3f3f"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="xs"
          letterSpacing="0.04em"
        >
          Retro shell active
        </Text>
      </Flex>
    </Flex>
  ) : null;

  const retroDesktopTaskbar = isRetroDesktopTheme ? (
    <Flex
      data-tutorial="slot-switch-taskbar"
      mt={0}
      px={isCompactMobileLandscape ? { base: 1.5, md: 2 } : { base: 2.5, md: 3 }}
      py={isCompactMobileLandscape ? { base: 1.5, md: 2 } : { base: 2, md: 2.5 }}
      borderRadius="0"
      border="2px solid"
      borderColor={RETRO_DESKTOP_THEME.taskbarBorder}
      bg={RETRO_DESKTOP_THEME.taskbarBg}
      boxShadow={`${RETRO_DESKTOP_THEME.taskbarInset}, 0 10px 16px rgba(0, 0, 0, 0.12)`}
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'stretch', md: 'center' }}
      gap={2.5}
      wrap={{ base: 'wrap', md: 'nowrap' }}
      overflowX={{ base: 'visible', md: 'auto' }}
      flex="0 0 auto"
      filter={isBriefStep ? 'blur(3px)' : undefined}
      pointerEvents={isBriefStep ? 'none' : undefined}
      opacity={isBriefStep ? 0.65 : undefined}
      userSelect={isBriefStep ? 'none' : undefined}
      transition="filter 0.3s ease, opacity 0.3s ease"
    >
      <Box
        minW={{ base: '0', md: '140px' }}
        px={2.5}
        py={2}
        border="2px solid"
        borderColor={RETRO_DESKTOP_THEME.taskbarChipBorder}
        bg="#e7e2d8"
        boxShadow={RETRO_DESKTOP_THEME.taskbarInset}
        flexShrink={0}
      >
        <Text
          color={RETRO_DESKTOP_THEME.taskbarText}
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="10px"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Taskbar
        </Text>
        <Text
          mt={1}
          color="rgba(21, 21, 21, 0.72)"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="10px"
          letterSpacing="0.04em"
        >
          Pick L or R, then a window
        </Text>
      </Box>

      <HStack data-tutorial="slot-side-badges" spacing={1.5} align="stretch">
        <TaskbarSideBadge
          slot="left"
          isSelected={desktopTaskbarTarget === 'left'}
          onClick={() => handleTaskbarSideBadgeClick('left')}
          onDragStart={(event) => handleTaskbarSideDragStart('left', event)}
          onDragEnd={handleTaskbarSideDragEnd}
          isLocked={isLeftSlotLocked}
          lockReason="Active combat is running in this slot. Wait for the wave to end before reassigning it."
        />
        <TaskbarSideBadge
          slot="right"
          isSelected={desktopTaskbarTarget === 'right'}
          onClick={() => handleTaskbarSideBadgeClick('right')}
          onDragStart={(event) => handleTaskbarSideDragStart('right', event)}
          onDragEnd={handleTaskbarSideDragEnd}
          isLocked={isRightSlotLocked}
          lockReason="Active combat is running in this slot. Wait for the wave to end before reassigning it."
        />
      </HStack>

      <Flex flex={1} gap={1.5} wrap={{ base: 'wrap', md: 'nowrap' }} minW={0}>
        {availablePanels.map((panelType) => {
          const assignmentLabels = [
            leftPanel === panelType ? 'LEFT' : null,
            rightPanel === panelType ? 'RIGHT' : null,
          ].filter(Boolean);

          return (
            <TaskbarPanelButton
              key={panelType}
              panelType={panelType}
              assignmentLabels={assignmentLabels}
              activeSide={desktopTaskbarDragSide || desktopTaskbarTarget}
              isDropTarget={desktopTaskbarDropTarget === panelType}
              onClick={() => handleTaskbarPanelClick(panelType)}
              onDragEnter={() => handleTaskbarPanelDragEnter(panelType)}
              onDragLeave={() => handleTaskbarPanelDragLeave(panelType)}
              onDragOver={(event) => handleTaskbarPanelDragOver(event, panelType)}
              onDrop={(event) => handleTaskbarPanelDrop(event, panelType)}
            />
          );
        })}
      </Flex>
    </Flex>
  ) : null;

  const retroMobileTaskbar = isRetroDesktopTheme ? (
    <Flex
      data-tutorial="slot-switch-taskbar"
      mt={0}
      px={{ base: 2.5, md: 3 }}
      py={{ base: 2, md: 2.5 }}
      borderRadius="0"
      border="2px solid"
      borderColor={RETRO_DESKTOP_THEME.taskbarBorder}
      bg={RETRO_DESKTOP_THEME.taskbarBg}
      boxShadow={`${RETRO_DESKTOP_THEME.taskbarInset}, 0 10px 16px rgba(0, 0, 0, 0.12)`}
      direction="column"
      align="stretch"
      gap={2.5}
      flex="0 0 auto"
      filter={isBriefStep ? 'blur(3px)' : undefined}
      pointerEvents={isBriefStep ? 'none' : undefined}
      opacity={isBriefStep ? 0.65 : undefined}
      userSelect={isBriefStep ? 'none' : undefined}
      transition="filter 0.3s ease, opacity 0.3s ease"
    >
      <Box
        px={isCompactMobileLandscape ? 2 : 2.5}
        py={isCompactMobileLandscape ? 1.5 : 2}
        border="2px solid"
        borderColor={RETRO_DESKTOP_THEME.taskbarChipBorder}
        bg="#e7e2d8"
        boxShadow={RETRO_DESKTOP_THEME.taskbarInset}
      >
        <Text
          color={RETRO_DESKTOP_THEME.taskbarText}
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize={isCompactMobileLandscape ? '9px' : '10px'}
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Taskbar
        </Text>
        {!isCompactMobileLandscape ? (
          <Text
            mt={1}
            color="rgba(21, 21, 21, 0.72)"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="10px"
            letterSpacing="0.04em"
          >
            Tap a window below to swap the active mobile panel
          </Text>
        ) : null}
      </Box>

      {renderMobilePanelSwitcher(effectiveMobilePanel)}
    </Flex>
  ) : null;

  // Helper to render panel content into the correct container via portal
  const renderPanelPortal = (panelType, content) => {
    if (hiddenPanels.includes(panelType)) return null;
    const container = getPanelContainer(panelType);
    const targetRef =
      container === 'LEFT' ? leftContainerRef : container === 'RIGHT' ? rightContainerRef : null;

    if (!targetRef?.current) {
      // Container not ready yet or panel not assigned - render hidden but mounted
      return (
        <Box
          key={panelType}
          position="fixed"
          top="-9999px"
          left="-9999px"
          visibility="hidden"
          pointerEvents="none"
          w="1px"
          h="1px"
          overflow="hidden"
          aria-hidden="true"
        >
          {content}
        </Box>
      );
    }

    const slotLabel = container === 'LEFT' ? 'LEFT' : 'RIGHT';
    const slotClickHandler = container === 'LEFT' ? handleLeftSlotClick : handleRightSlotClick;
    const portalOverflow = panelType === PANEL_TYPES.GAME ? 'hidden' : 'auto';
    const enhancedContent = isValidElement(content)
      ? cloneElement(content, {
          slotSwitcherControl: isRetroDesktopTheme
            ? null
            : renderSlotControl(slotLabel, panelType, slotClickHandler),
          slotChrome: panelChromeByType?.[panelType] ?? null,
          slotLabel,
          isMobileSlotLayout: false,
        })
      : content;

    // Portal the content into the target container
    return createPortal(
      <Box
        key={panelType}
        flex="1"
        display="flex"
        flexDirection="column"
        minH="0"
        overflow={portalOverflow}
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
      >
        {enhancedContent}
      </Box>,
      targetRef.current
    );
  };

  const { height: mobilePanelHeight, minHeight: mobilePanelMinHeight } = resolveMobilePanelSizing({
    isMobileChatFocus,
    isCompactMobileLandscape,
    usePageScrollMobileShell: useScrollableHandheldRetroShell,
  });

  if (isMobileLayout) {
    const activePanel = effectiveMobilePanel;
    const activeMobilePanelNeedsFixedHeight = shouldUseFixedHeightMobilePanel({
      activePanel,
      isCompactMobileLandscape,
    });
    const activeMobilePanelHeight = activeMobilePanelNeedsFixedHeight
      ? 'var(--td-mobile-stage-min-height, 100dvh)'
      : mobilePanelHeight;
    const activeMobilePanelMinHeight = activeMobilePanelNeedsFixedHeight
      ? 'var(--td-mobile-stage-min-height, 0px)'
      : mobilePanelMinHeight;

    const activeContent = activePanel ? panelContentByType[activePanel] : null;
    const mobileEnhancedContent = isValidElement(activeContent)
      ? cloneElement(activeContent, {
          slotSwitcherControl: null,
          slotChrome: isMobileChatFocus ? null : (panelChromeByType?.[activePanel] ?? null),
          slotLabel: 'MOBILE',
          isMobileSlotLayout: true,
          isMobileChatFocus,
        })
      : activeContent;

    const preferredChatExitPanel =
      (mobilePreviousNonChatPanelRef.current &&
        mobilePreviousNonChatPanelRef.current !== PANEL_TYPES.CHAT &&
        availablePanels.includes(mobilePreviousNonChatPanelRef.current) &&
        mobilePreviousNonChatPanelRef.current) ||
      (availablePanels.find((panelType) => panelType !== PANEL_TYPES.CHAT) ?? null);

    return (
      <Box
        bg={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBg : '#101820'}
        bgImage={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellGrid : undefined}
        bgSize={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellGridSize : undefined}
        p={isCompactMobileLandscape ? 1 : { base: 2, md: 4 }}
        minH={
          isRetroDesktopTheme
            ? 'calc(100dvh - 16px)'
            : isCompactMobileLandscape
              ? mobilePanelMinHeight
              : undefined
        }
        overflowY="visible"
        overflowX="hidden"
        borderRadius={isRetroDesktopTheme ? '0' : undefined}
        border={isRetroDesktopTheme ? '2px solid' : undefined}
        borderColor={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBorder : undefined}
        boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellShadow : undefined}
        display="flex"
        flexDirection="column"
        h={
          isRetroDesktopTheme && !useScrollableHandheldRetroShell
            ? 'calc(100dvh - 16px)'
            : undefined
        }
        data-mobile-runtime-scroll-mode={
          isMobileLayout ? (useScrollableHandheldRetroShell ? 'page' : 'viewport') : undefined
        }
      >
        {header}

        {actionBar && <Box mb={3}>{actionBar}</Box>}
        {retroDesktopHeader}

        <Flex
          direction="column"
          gap={isCompactMobileLandscape ? 2 : isMobileChatFocus ? 2 : 3}
          h={
            isRetroDesktopTheme && !useScrollableHandheldRetroShell
              ? undefined
              : activeMobilePanelHeight
          }
          minH={isRetroDesktopTheme ? '0' : activeMobilePanelMinHeight}
          flex={
            isRetroDesktopTheme
              ? useScrollableHandheldRetroShell
                ? '0 0 auto'
                : '1 1 auto'
              : isCompactMobileLandscape
                ? '0 0 auto'
                : undefined
          }
        >
          {!isRetroDesktopTheme && isMobileChatFocus ? (
            <Flex
              px={2}
              py={2}
              align="center"
              justify="space-between"
              gap={2}
              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
              border={
                isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(153, 102, 255, 0.34)'
              }
              bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(20, 6, 30, 0.9)'}
              boxShadow={
                isRetroDesktopTheme
                  ? 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)'
                  : 'none'
              }
            >
              <Button
                size="xs"
                variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                colorScheme={isRetroDesktopTheme ? undefined : 'cyan'}
                onClick={() =>
                  preferredChatExitPanel && handleMobilePanelSwitch(preferredChatExitPanel)
                }
                isDisabled={!preferredChatExitPanel}
                fontFamily={
                  isRetroDesktopTheme
                    ? "'Tahoma', 'MS Sans Serif', sans-serif"
                    : "'Orbitron', sans-serif"
                }
                letterSpacing="0.06em"
                textTransform="uppercase"
                sx={
                  isRetroDesktopTheme
                    ? {
                        minW: '68px',
                        borderRadius: '0',
                        border: `2px solid ${RETRO_DESKTOP_THEME.taskbarChipBorder}`,
                        bg: RETRO_DESKTOP_THEME.taskbarChipBg,
                        backgroundImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: '100% 100%',
                        color: RETRO_DESKTOP_THEME.taskbarText,
                        px: 2,
                        py: 1.5,
                        boxShadow: RETRO_DESKTOP_THEME.taskbarInset,
                        _hover: {
                          backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
                          bg: '#ece9e1',
                          transform: 'translateY(1px)',
                        },
                        _disabled: {
                          opacity: 0.55,
                          cursor: 'not-allowed',
                        },
                      }
                    : undefined
                }
              >
                Back
              </Button>

              <Text
                color={isRetroDesktopTheme ? '#0a2c9a' : '#d9b7ff'}
                fontSize="xs"
                fontFamily={
                  isRetroDesktopTheme
                    ? "'Tahoma', 'MS Sans Serif', sans-serif"
                    : "'Orbitron', sans-serif"
                }
                letterSpacing="0.1em"
                textTransform="uppercase"
                fontWeight={isRetroDesktopTheme ? '700' : undefined}
              >
                AI Chat Focus
              </Text>

              <HStack spacing={1}>
                {availablePanels
                  .filter((panelType) => panelType !== PANEL_TYPES.CHAT)
                  .slice(0, 2)
                  .map((panelType) => (
                    <Button
                      key={`chat-focus-${panelType}`}
                      size="xs"
                      variant={isRetroDesktopTheme ? 'unstyled' : 'ghost'}
                      colorScheme={isRetroDesktopTheme ? undefined : 'gray'}
                      onClick={() => handleMobilePanelSwitch(panelType)}
                      sx={
                        isRetroDesktopTheme
                          ? {
                              minW: '72px',
                              borderRadius: '0',
                              border: `2px solid ${RETRO_DESKTOP_THEME.taskbarChipBorder}`,
                              bg: '#ece9e1',
                              backgroundImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center',
                              backgroundSize: '100% 100%',
                              color: RETRO_DESKTOP_THEME.taskbarText,
                              px: 2,
                              py: 1.5,
                              fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                              fontWeight: '700',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              _hover: {
                                backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
                                bg: '#f4f0e8',
                                transform: 'translateY(1px)',
                              },
                            }
                          : undefined
                      }
                    >
                      {isRetroDesktopTheme && RETRO_PANEL_ICON_ASSETS[panelType] ? (
                        <HStack spacing={1.5}>
                          <Box
                            as="img"
                            src={RETRO_PANEL_ICON_ASSETS[panelType]}
                            alt=""
                            aria-hidden="true"
                            w="14px"
                            h="14px"
                            imageRendering="pixelated"
                          />
                          <Text
                            color={RETRO_DESKTOP_THEME.taskbarText}
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            fontSize="10px"
                            fontWeight="700"
                            textTransform="uppercase"
                            letterSpacing="0.04em"
                          >
                            {PANEL_CONFIG[panelType]?.label || panelType}
                          </Text>
                        </HStack>
                      ) : (
                        PANEL_CONFIG[panelType]?.label || panelType
                      )}
                    </Button>
                  ))}
              </HStack>
            </Flex>
          ) : !isRetroDesktopTheme ? (
            renderMobilePanelSwitcher(activePanel)
          ) : null}

          <Box
            flex={useScrollableHandheldRetroShell ? '0 0 auto' : '1'}
            h={
              isRetroDesktopTheme
                ? useScrollableHandheldRetroShell
                  ? activeMobilePanelHeight
                  : undefined
                : activeMobilePanelNeedsFixedHeight
                  ? '100%'
                  : undefined
            }
            minH={useScrollableHandheldRetroShell ? activeMobilePanelMinHeight : '0'}
            maxH={useScrollableHandheldRetroShell ? activeMobilePanelHeight : undefined}
            w="100%"
            mx={isMobileChatFocus && !isCompactMobileLandscape ? 'auto' : undefined}
            maxW={isMobileChatFocus && !isCompactMobileLandscape ? '560px' : undefined}
            bg={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelBg : 'rgba(0, 10, 20, 0.5)'}
            borderRadius={isRetroDesktopTheme ? '0' : 'md'}
            border={isRetroDesktopTheme ? '2px solid' : '1px solid'}
            borderColor={
              isRetroDesktopTheme
                ? RETRO_DESKTOP_THEME.panelBorder
                : activePanel
                  ? `${PANEL_CONFIG[activePanel]?.color}44`
                  : 'rgba(255,255,255,0.1)'
            }
            overflow="hidden"
            display="flex"
            flexDirection="column"
            position="relative"
            boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelShadow : undefined}
          >
            {mobileEnhancedContent || (
              <Flex
                h="100%"
                align="center"
                justify="center"
                color="gray.500"
                fontFamily="monospace"
                px={4}
                textAlign="center"
              >
                No panel available for this viewport.
              </Flex>
            )}
          </Box>

          {isRetroDesktopTheme ? retroMobileTaskbar : null}
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      data-runtime-shell-theme={shellTheme}
      data-runtime-shell-mode={isMobileLayout ? 'mobile' : 'desktop'}
      bg={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBg : '#101820'}
      bgImage={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellGrid : undefined}
      bgSize={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellGridSize : undefined}
      p={isRetroDesktopTheme ? 2 : 4}
      overflowY="visible"
      overflowX="hidden"
      display="flex"
      flexDirection="column"
      flex={isRetroDesktopTheme ? '1 1 auto' : undefined}
      minH={isRetroDesktopTheme ? 0 : '100%'}
      h={isRetroDesktopTheme ? '100%' : undefined}
      borderRadius={isRetroDesktopTheme ? '0' : undefined}
      border={isRetroDesktopTheme ? '2px solid' : undefined}
      borderColor={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBorder : undefined}
      boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellShadow : undefined}
      justifyContent={isRetroDesktopTheme ? 'space-between' : undefined}
    >
      {/* Header */}
      {header}

      {/* Action Bar */}
      {actionBar && <Box mb={3}>{actionBar}</Box>}

      {retroDesktopHeader}

      {/* Container Slots and Panels */}
      <Box
        flex={isRetroDesktopTheme ? '1 1 auto' : undefined}
        display="flex"
        flexDirection="column"
        gap={isRetroDesktopTheme ? 2 : 0}
        minH={0}
        p={isRetroDesktopTheme ? 2 : 0}
        bg={isRetroDesktopTheme ? 'linear-gradient(180deg, #c8c2b8 0%, #b6b0a4 100%)' : undefined}
        border={isRetroDesktopTheme ? '2px solid' : undefined}
        borderColor={isRetroDesktopTheme ? '#6a6a6a' : undefined}
        boxShadow={
          isRetroDesktopTheme
            ? 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(72,72,72,0.24)'
            : undefined
        }
      >
        <Flex
          gap={isRetroDesktopTheme ? 2.5 : 4}
          flex="1" // 1. Force the row to consume all available vertical space
          minH={isRetroDesktopTheme ? retroDesktopStageMinHeight : 0}
          // 2. Remove the 'auto' height so we don't break percentage math down the tree
          h={isRetroDesktopTheme ? undefined : 'clamp(620px, 80vh, 1000px)'}
          sx={{
            '@media (max-height: 800px)': {
              height: isRetroDesktopTheme ? undefined : '900px',
            },
          }}
        >
          {/* Left Container */}
          <Box
            flex="0 0 auto"
            width={`${leftWidthPercent}%`}
            display="flex"
            flexDirection="column"
            minW="240px"
            // 3. REMOVED h="100%" - Let the parent Flex row stretch this naturally
            minH={300}
          >
            <Box
              ref={leftContainerCallback}
              data-desktop-panel-slot="left"
              flex="1"
              minH="0" // 4. Critical: Allows inner flex items to scroll instead of overflowing
              bg={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelBg : 'rgba(0, 10, 20, 0.5)'}
              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
              // ... keep your existing borders, sx, and empty state logic here ...
              border={isRetroDesktopTheme ? '2px solid' : '1px solid'}
              borderColor={
                isRetroDesktopTheme
                  ? RETRO_DESKTOP_THEME.panelBorder
                  : leftPanel
                    ? PANEL_CONFIG[leftPanel]?.color + '44'
                    : 'rgba(255,255,255,0.1)'
              }
              overflow="hidden"
              display="flex"
              flexDirection="column"
              position="relative"
              boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelShadow : undefined}
              sx={buildPanelShellSx(leftSlotFocused, leftSlotDimmed, leftPanel)}
            >
              {/* Empty state */}
              {!leftPanel && (
                <Flex
                  h="100%"
                  align="center"
                  justify="center"
                  color="gray.600"
                  fontFamily="monospace"
                  direction="column"
                  gap={3}
                >
                  <Box>Click the slot switcher inside this panel to load content here</Box>
                  {renderSlotControl('LEFT', leftPanel, handleLeftSlotClick)}
                </Flex>
              )}
            </Box>
          </Box>
          {/* Resize Handle */}
          <Box
            width={isRetroDesktopTheme ? '10px' : '6px'}
            cursor="col-resize"
            position="relative"
            bg={isRetroDesktopTheme ? '#b6b0a4' : 'rgba(0, 255, 255, 0.08)'}
            borderRadius={isRetroDesktopTheme ? '0' : 'full'}
            borderLeft={isRetroDesktopTheme ? '1px solid #ddd8cf' : undefined}
            borderRight={isRetroDesktopTheme ? '1px solid #7b7468' : undefined}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            onDoubleClick={() => setLeftWidthPercent(50)}
            sx={{ touchAction: 'none' }}
            _hover={{
              bg: isRetroDesktopTheme ? '#c0baaf' : 'rgba(0, 255, 255, 0.25)',
            }}
          >
            <Flex
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              direction="column"
              gap="4px"
            >
              <Box
                width="2px"
                height="18px"
                bg={isRetroDesktopTheme ? '#4d4d4d' : 'rgba(0, 255, 255, 0.6)'}
                borderRadius={isRetroDesktopTheme ? '0' : 'full'}
              />
              <Box
                width="2px"
                height="18px"
                bg={isRetroDesktopTheme ? '#4d4d4d' : 'rgba(0, 255, 255, 0.6)'}
                borderRadius={isRetroDesktopTheme ? '0' : 'full'}
              />
            </Flex>
          </Box>

          {/* Right Container */}
          <Box
            flex="1" // Cleaner than 1 1 auto
            minW="240px"
            display="flex"
            flexDirection="column"
            // 5. REMOVED h="100%" here as well
            minH={0}
          >
            <Box
              ref={rightContainerCallback}
              data-desktop-panel-slot="right"
              flex="1"
              minH="0"
              bg={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelBg : 'rgba(0, 10, 20, 0.5)'}
              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
              // ... keep your existing borders, sx, and empty state logic here ...
              border={isRetroDesktopTheme ? '2px solid' : '1px solid'}
              borderColor={
                isRetroDesktopTheme
                  ? RETRO_DESKTOP_THEME.panelBorder
                  : rightPanel
                    ? PANEL_CONFIG[rightPanel]?.color + '44'
                    : 'rgba(255,255,255,0.1)'
              }
              overflow="hidden"
              display="flex"
              flexDirection="column"
              position="relative"
              boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelShadow : undefined}
              sx={buildPanelShellSx(rightSlotFocused, rightSlotDimmed, rightPanel)}
            >
              {/* Empty state */}
              {!rightPanel && (
                <Flex
                  h="100%"
                  align="center"
                  justify="center"
                  color="gray.600"
                  fontFamily="monospace"
                  direction="column"
                  gap={3}
                >
                  <Box>Click the slot switcher inside this panel to load content here</Box>
                  {renderSlotControl('RIGHT', rightPanel, handleRightSlotClick)}
                </Flex>
              )}
            </Box>
          </Box>
        </Flex>

        {isRetroDesktopTheme ? retroDesktopTaskbar : null}
      </Box>

      {/* 
        Panel content rendered via portals - each panel is rendered ONCE
        and portaled into whichever container it's assigned to.
        Panels not assigned to any container are rendered hidden to preserve state.
      */}
      {renderPanelPortal(PANEL_TYPES.GAME, panelContentByType[PANEL_TYPES.GAME])}
      {renderPanelPortal(PANEL_TYPES.EDITOR, panelContentByType[PANEL_TYPES.EDITOR])}
      {renderPanelPortal(PANEL_TYPES.CHAT, panelContentByType[PANEL_TYPES.CHAT])}
      {renderPanelPortal(PANEL_TYPES.PROBLEM, panelContentByType[PANEL_TYPES.PROBLEM])}
    </Box>
  );
}

export default SlottableLayout;
