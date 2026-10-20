import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  FaBook,
  FaChevronDown,
  FaChevronRight,
  FaCode,
  FaComments,
  FaGamepad,
} from 'react-icons/fa';
import { releaseScreenOrientation } from '../../../utils/mobile/screenOrientation';
import { buildResponsiveProfile } from '../../../utils/web/responsiveProfile';
import { RETRO_DESKTOP_BADGE_ASSET } from '../../../utils/assets/towerDefenseAssetUrls';
import {
  readTowerDefenseShellVisible,
  writeTowerDefenseShellVisible,
} from '../../../utils/ui/towerDefenseShellVisibility';

const PANEL_META = {
  game: { icon: FaGamepad, label: 'Game', color: '#00ff8c' },
  editor: { icon: FaCode, label: 'Editor', color: '#00ccff' },
  chat: { icon: FaComments, label: 'Chat', color: '#9966ff' },
  problem: { icon: FaBook, label: 'Problem', color: '#ff9900' },
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
  captionBg: 'linear-gradient(90deg, #000080 0%, #0a3ca6 100%)',
  taskbarChipBg: '#d4d0c8',
};
const RETRO_DESKTOP_STAGE_MIN_HEIGHT_EMBEDDED = '420px';
const RETRO_DESKTOP_STAGE_MIN_HEIGHT_STANDALONE = 'clamp(620px, 80vh, 1000px)';

export const resolveRetroDesktopStageMinHeight = (desktopShellSizingMode = 'embedded') =>
  desktopShellSizingMode === 'standalone'
    ? RETRO_DESKTOP_STAGE_MIN_HEIGHT_STANDALONE
    : RETRO_DESKTOP_STAGE_MIN_HEIGHT_EMBEDDED;

const getClientX = (event) => {
  if (typeof event?.clientX === 'number') return event.clientX;
  if (event?.touches?.length) return event.touches[0].clientX;
  if (event?.changedTouches?.length) return event.changedTouches[0].clientX;
  return null;
};

const detectMobileLayout = () => {
  if (typeof window === 'undefined') return false;
  return buildResponsiveProfile().isHandheldSinglePanelLayout;
};

const detectHandheldRuntimeDevice = () => {
  if (typeof window === 'undefined') return false;
  return buildResponsiveProfile().isHandheldDevice;
};

const getClientY = (event) => {
  if (typeof event?.clientY === 'number') return event.clientY;
  if (event?.touches?.length) return event.touches[0].clientY;
  if (event?.changedTouches?.length) return event.changedTouches[0].clientY;
  return null;
};

function CollapsiblePanel({
  panelKey,
  title,
  meta,
  open,
  onToggle,
  chrome,
  children,
  shellTheme,
  defaultOpenHeight = 320,
  maxOpenHeight = 720,
  resizeHandlePosition = 'bottom',
  overlayBody = false,
}) {
  const isRetro = shellTheme === 'retro-desktop';
  const Icon = meta?.icon;
  const OpenIcon = open ? FaChevronDown : FaChevronRight;
  const [openHeight, setOpenHeight] = useState(defaultOpenHeight);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ y: 0, height: defaultOpenHeight });

  const handleVerticalResizeStart = useCallback(
    (event) => {
      if (event?.cancelable) event.preventDefault();
      const clientY = getClientY(event);
      if (clientY === null) return;
      resizingRef.current = true;
      resizeStartRef.current = { y: clientY, height: openHeight };
    },
    [openHeight]
  );

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerMove = (event) => {
      if (!resizingRef.current) return;
      const clientY = getClientY(event);
      if (clientY === null) return;
      if (event?.type === 'touchmove' && event.cancelable) event.preventDefault();
      const delta =
        resizeHandlePosition === 'top'
          ? resizeStartRef.current.y - clientY
          : clientY - resizeStartRef.current.y;
      setOpenHeight(Math.min(maxOpenHeight, Math.max(160, resizeStartRef.current.height + delta)));
    };
    const handlePointerUp = () => {
      resizingRef.current = false;
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
  }, [open, maxOpenHeight, resizeHandlePosition]);

  const resizeHandle = (
    <Box
      data-collapsible-resize-handle={panelKey}
      h="10px"
      cursor="row-resize"
      flexShrink={0}
      bg={isRetro ? '#b6b0a4' : 'rgba(255,255,255,0.06)'}
      borderTop={isRetro ? '1px solid #7b7468' : '1px solid rgba(255,255,255,0.1)'}
      borderBottom={
        resizeHandlePosition === 'top'
          ? isRetro
            ? '2px solid #686868'
            : '1px solid rgba(255,255,255,0.1)'
          : undefined
      }
      onMouseDown={handleVerticalResizeStart}
      onTouchStart={handleVerticalResizeStart}
      onDoubleClick={() => setOpenHeight(defaultOpenHeight)}
      sx={{ touchAction: 'none' }}
      _hover={{ bg: isRetro ? '#c0baaf' : 'rgba(255,255,255,0.12)' }}
      title="Drag to resize"
    >
      <Box w="36px" h="2px" mx="auto" mt="4px" bg={isRetro ? '#4d4d4d' : 'rgba(255,255,255,0.4)'} />
    </Box>
  );

  const clampedOpenHeight = Math.min(openHeight, maxOpenHeight);
  const overlayBodyActive = open && overlayBody;

  return (
    <Box
      data-collapsible-panel={panelKey}
      data-collapsible-open={open ? 'true' : 'false'}
      bg={isRetro ? '#d4d0c8' : 'rgba(0, 10, 20, 0.5)'}
      borderRadius={isRetro ? '0' : 'md'}
      border={isRetro ? '2px solid' : '1px solid'}
      borderColor={isRetro ? '#686868' : `${meta?.color || '#00ccff'}44`}
      overflow={overlayBodyActive ? 'visible' : 'hidden'}
      position="relative"
      display="flex"
      flexDirection="column"
      flexShrink={0}
      zIndex={overlayBodyActive ? 6 : undefined}
      boxShadow={
        isRetro
          ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(110, 110, 110, 0.34), 0 10px 20px rgba(0, 0, 0, 0.14)'
          : undefined
      }
    >
      <Button
        variant="unstyled"
        onClick={onToggle}
        data-tutorial={`${panelKey}-collapsible-toggle`}
        aria-expanded={open}
        display="flex"
        alignItems="center"
        w="100%"
        px={3}
        py={2}
        bg={isRetro ? '#c8c2b8' : 'rgba(255,255,255,0.04)'}
        borderBottom={
          open ? (isRetro ? '2px solid #686868' : '1px solid rgba(255,255,255,0.1)') : 'none'
        }
      >
        <HStack spacing={2} flex="1" justify="flex-start">
          <Box as={OpenIcon} boxSize="12px" color={isRetro ? '#151515' : meta?.color} />
          {Icon ? <Box as={Icon} color={isRetro ? '#0a3ca6' : meta?.color} /> : null}
          <Text
            color={isRetro ? '#151515' : '#f5f7ff'}
            fontFamily={isRetro ? "'Tahoma', 'MS Sans Serif', sans-serif" : undefined}
            fontSize="sm"
            fontWeight="700"
            letterSpacing="0.04em"
            textTransform={isRetro ? 'uppercase' : 'none'}
          >
            {title || meta?.label || panelKey}
          </Text>
        </HStack>
        <Text
          color={isRetro ? 'rgba(21,21,21,0.6)' : 'gray.500'}
          fontSize="xs"
          fontFamily="monospace"
        >
          {open ? 'hide' : 'show'}
        </Text>
      </Button>
      {open ? (
        overlayBodyActive ? (
          <>
            <Box
              data-collapsible-resize-handle={panelKey}
              position="absolute"
              left={0}
              right={0}
              bottom={`calc(100% + ${clampedOpenHeight}px)`}
              h="10px"
              cursor="row-resize"
              bg={isRetro ? '#b6b0a4' : 'rgba(255,255,255,0.06)'}
              borderTop={isRetro ? '1px solid #7b7468' : '1px solid rgba(255,255,255,0.1)'}
              borderBottom={isRetro ? '2px solid #686868' : '1px solid rgba(255,255,255,0.1)'}
              onMouseDown={handleVerticalResizeStart}
              onTouchStart={handleVerticalResizeStart}
              onDoubleClick={() => setOpenHeight(defaultOpenHeight)}
              sx={{ touchAction: 'none' }}
              _hover={{ bg: isRetro ? '#c0baaf' : 'rgba(255,255,255,0.12)' }}
              title="Drag to resize"
              zIndex={7}
            >
              <Box
                w="36px"
                h="2px"
                mx="auto"
                mt="4px"
                bg={isRetro ? '#4d4d4d' : 'rgba(255,255,255,0.4)'}
              />
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              minH="0"
              position="absolute"
              data-overlay-body={panelKey}
              left={0}
              right={0}
              bottom="100%"
              height={`${clampedOpenHeight}px`}
              overflowY="auto"
              overflowX="hidden"
              bg={isRetro ? '#d4d0c8' : 'rgba(0, 10, 20, 0.97)'}
              borderTop={isRetro ? '2px solid #686868' : '1px solid rgba(255,255,255,0.1)'}
              zIndex={6}
            >
              {chrome}
              {children}
            </Box>
          </>
        ) : (
          <>
            {resizeHandlePosition === 'top' ? resizeHandle : null}
            <Box
              display="flex"
              flexDirection="column"
              minH="0"
              height={`${clampedOpenHeight}px`}
              overflowY="auto"
              overflowX="hidden"
            >
              {chrome}
              {children}
            </Box>
            {resizeHandlePosition === 'top' ? null : resizeHandle}
          </>
        )
      ) : null}
    </Box>
  );
}

export default function TowerDefenseV2Layout({
  gameContent,
  editorContent,
  chatContent,
  problemContent,
  shellTheme = 'default',
  allowEmbeddedHandheldPageScroll = false,
  desktopShellSizingMode = 'embedded',
  isGamePanelBlurred = false,
  problemOpen: controlledProblemOpen,
  chatOpen: controlledChatOpen,
  defaultProblemOpen = true,
  defaultChatOpen = false,
  onProblemOpenChange,
  onChatOpenChange,
}) {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const retroDesktopStageMinHeight = resolveRetroDesktopStageMinHeight(desktopShellSizingMode);

  const [leftWidthPercent, setLeftWidthPercent] = useState(50);
  const [isMobileLayout, setIsMobileLayout] = useState(() => detectMobileLayout());
  const [isHandheldRuntimeDevice, setIsHandheldRuntimeDevice] = useState(() =>
    detectHandheldRuntimeDevice()
  );
  const [internalProblemOpen, setInternalProblemOpen] = useState(defaultProblemOpen);
  const [internalChatOpen, setInternalChatOpen] = useState(defaultChatOpen);
  const [stageHeight, setStageHeight] = useState(0);
  const stageRef = useRef(null);
  const isResizingRef = useRef(false);
  const leftContainerRef = useRef(null);
  const chatFocusShellVisibilityRef = useRef(null);
  const lastOrientationRequestRef = useRef(null);

  const problemOpen = controlledProblemOpen ?? internalProblemOpen;
  const chatOpen = controlledChatOpen ?? internalChatOpen;

  const setProblemOpen = useCallback(
    (next) => {
      if (controlledProblemOpen === undefined) setInternalProblemOpen(next);
      if (onProblemOpenChange) onProblemOpenChange(next);
    },
    [controlledProblemOpen, onProblemOpenChange]
  );

  const setChatOpen = useCallback(
    (next) => {
      if (controlledChatOpen === undefined) setInternalChatOpen(next);
      if (onChatOpenChange) onChatOpenChange(next);
    },
    [controlledChatOpen, onChatOpenChange]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const element = stageRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const updateStageHeight = () => {
      setStageHeight(element.getBoundingClientRect().height || 0);
    };
    updateStageHeight();
    const observer = new ResizeObserver(updateStageHeight);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const maxCollapsibleHeight = stageHeight > 0 ? Math.max(220, stageHeight - 320) : 720;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleViewportChange = () => {
      setIsMobileLayout(detectMobileLayout());
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
    if (typeof window === 'undefined') return undefined;
    const handleFocusChatPanel = () => setChatOpen(true);
    window.addEventListener('td-focus-chat-panel', handleFocusChatPanel);
    return () => window.removeEventListener('td-focus-chat-panel', handleFocusChatPanel);
  }, [setChatOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!isMobileLayout) {
      if (chatFocusShellVisibilityRef.current !== null) {
        writeTowerDefenseShellVisible(Boolean(chatFocusShellVisibilityRef.current));
        chatFocusShellVisibilityRef.current = null;
      }
      return undefined;
    }
    if (chatOpen && chatContent) {
      if (chatFocusShellVisibilityRef.current === null) {
        chatFocusShellVisibilityRef.current = readTowerDefenseShellVisible();
      }
      writeTowerDefenseShellVisible(false);
      if (lastOrientationRequestRef.current !== 'released') {
        lastOrientationRequestRef.current = 'released';
        void releaseScreenOrientation();
      }
      return undefined;
    }
    if (chatFocusShellVisibilityRef.current !== null) {
      writeTowerDefenseShellVisible(Boolean(chatFocusShellVisibilityRef.current));
      chatFocusShellVisibilityRef.current = null;
    }
    if (lastOrientationRequestRef.current !== 'released') {
      lastOrientationRequestRef.current = 'released';
      void releaseScreenOrientation();
    }
    return undefined;
  }, [chatOpen, chatContent, isMobileLayout]);

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

  const handleResizeStart = useCallback((event) => {
    if (event?.cancelable) event.preventDefault();
    isResizingRef.current = true;
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isResizingRef.current) return;
      const clientX = getClientX(event);
      if (clientX === null) return;
      if (event?.type === 'touchmove' && event.cancelable) event.preventDefault();
      const container = leftContainerRef.current?.parentElement?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nextPercent = ((clientX - rect.left) / rect.width) * 100;
      setLeftWidthPercent(Math.min(80, Math.max(20, nextPercent)));
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

  const withMobileProp = useCallback(
    (element) =>
      isValidElement(element)
        ? cloneElement(element, { isMobileSlotLayout: isMobileLayout })
        : element,
    [isMobileLayout]
  );

  const useScrollableHandheldRetroShell =
    allowEmbeddedHandheldPageScroll && isRetroDesktopTheme && isMobileLayout;

  const panelBoxSx = (color) => ({
    bg: isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelBg : 'rgba(0, 10, 20, 0.5)',
    borderRadius: isRetroDesktopTheme ? '0' : 'md',
    border: isRetroDesktopTheme ? '2px solid' : '1px solid',
    borderColor: isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelBorder : `${color}44`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: isRetroDesktopTheme ? RETRO_DESKTOP_THEME.panelShadow : undefined,
  });

  const renderGamePanel = (extraSx) => (
    <Box
      data-fixed-panel="game"
      flex="1"
      minH="0"
      sx={{
        ...panelBoxSx(PANEL_META.game.color),
        transition:
          'border-color 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease, filter 0.5s ease',
        filter: isGamePanelBlurred ? 'blur(5px) opacity(0.6)' : 'none',
        opacity: isGamePanelBlurred ? 0.6 : 1,
        pointerEvents: isGamePanelBlurred ? 'none' : 'auto',
        ...(extraSx || {}),
      }}
    >
      {withMobileProp(gameContent)}
    </Box>
  );

  const renderEditorPanel = () => (
    <Box data-fixed-panel="editor" flex="1" minH="0" sx={panelBoxSx(PANEL_META.editor.color)}>
      {withMobileProp(editorContent)}
    </Box>
  );

  const renderProblemCollapsible = () =>
    problemContent ? (
      <CollapsiblePanel
        panelKey="problem"
        title="Mission File"
        meta={PANEL_META.problem}
        open={problemOpen}
        onToggle={() => setProblemOpen(!problemOpen)}
        chrome={null}
        shellTheme={shellTheme}
        defaultOpenHeight={400}
        maxOpenHeight={maxCollapsibleHeight}
      >
        {withMobileProp(problemContent)}
      </CollapsiblePanel>
    ) : null;

  const renderChatCollapsible = () =>
    chatContent ? (
      <CollapsiblePanel
        panelKey="chat"
        title="Squad Chat"
        meta={PANEL_META.chat}
        open={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        chrome={null}
        shellTheme={shellTheme}
        defaultOpenHeight={280}
        maxOpenHeight={maxCollapsibleHeight}
        resizeHandlePosition="top"
        overlayBody={!isMobileLayout}
      >
        {chatContent}
      </CollapsiblePanel>
    ) : null;

  const retroDesktopHeader = isRetroDesktopTheme ? (
    <Flex
      direction="column"
      gap={0}
      mb={0}
      borderRadius="0"
      border="2px solid"
      borderColor={RETRO_DESKTOP_THEME.shellBorder}
      bg={RETRO_DESKTOP_THEME.taskbarChipBg}
      boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.32)"
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
      </Flex>
    </Flex>
  ) : null;

  if (isMobileLayout) {
    return (
      <Box
        data-runtime-shell-theme={shellTheme}
        data-runtime-shell-mode="mobile"
        bg={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBg : '#101820'}
        p={isRetroDesktopTheme ? 2 : 4}
        overflowY={useScrollableHandheldRetroShell ? 'auto' : 'visible'}
        overflowX="hidden"
        display="flex"
        flexDirection="column"
        gap={3}
        flex={isRetroDesktopTheme ? '1 1 auto' : undefined}
        minH={isRetroDesktopTheme ? 0 : '100%'}
        h={isRetroDesktopTheme ? '100%' : undefined}
        border={isRetroDesktopTheme ? '2px solid' : undefined}
        borderColor={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBorder : undefined}
        boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellShadow : undefined}
      >
        {retroDesktopHeader}
        <Box
          ref={leftContainerRef}
          data-fixed-panel-slot="game-stack"
          minH="300px"
          display="flex"
          flexDirection="column"
        >
          {renderGamePanel()}
        </Box>
        {renderProblemCollapsible()}
        <Box minH="300px" display="flex" flexDirection="column">
          {renderEditorPanel()}
        </Box>
        {renderChatCollapsible()}
      </Box>
    );
  }

  return (
    <Box
      data-runtime-shell-theme={shellTheme}
      data-runtime-shell-mode="desktop"
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
      border={isRetroDesktopTheme ? '2px solid' : undefined}
      borderColor={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellBorder : undefined}
      boxShadow={isRetroDesktopTheme ? RETRO_DESKTOP_THEME.shellShadow : undefined}
      justifyContent={isRetroDesktopTheme ? 'space-between' : undefined}
    >
      {retroDesktopHeader}
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
          ref={stageRef}
          data-td-stage="workspace"
          gap={isRetroDesktopTheme ? 2.5 : 4}
          flex={desktopShellSizingMode === 'standalone' ? 'none' : '1'}
          minH={0}
          h={
            desktopShellSizingMode === 'standalone'
              ? //even in retro mode, we seem to be in standalone always.... - 70 px is what got me to 'proper height' of the content on the page
                //question is why? and how do we clean it up?
                'clamp(620px, calc(100dvh - 70px), 1200px)'
              : isRetroDesktopTheme
                ? retroDesktopStageMinHeight
                : 'clamp(620px, 80vh, 1000px)'
          }
          overflow="hidden"
        >
          <Box
            flex="0 0 auto"
            width={`${leftWidthPercent}%`}
            display="flex"
            flexDirection="column"
            gap={isRetroDesktopTheme ? 2 : 3}
            minW="240px"
            minH={300}
          >
            <Box
              ref={leftContainerRef}
              data-fixed-panel-slot="left"
              flex="1"
              minH="0"
              display="flex"
              flexDirection="column"
            >
              {renderGamePanel()}
            </Box>
            {renderChatCollapsible()}
          </Box>
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
          <Box
            flex="1"
            minW="240px"
            display="flex"
            flexDirection="column"
            gap={isRetroDesktopTheme ? 2 : 3}
            minH={0}
          >
            {renderProblemCollapsible()}
            {renderEditorPanel()}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
