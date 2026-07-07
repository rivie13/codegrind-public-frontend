import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import createDeviceShellController from '../../city-shell/createDeviceShellController';
import DesktopShellRenderer from './DesktopShellRenderer';
import PhoneShellRenderer from './PhoneShellRenderer';

const SHELL_TRANSITION_MS = 460;

function CityDeviceShellHost({
  onClose,
  onPhoneControlSideChange,
  onPhoneHudToggle,
  onPhoneTrackSelect,
  onPhoneMusicToggle,
  onPhoneMusicVolumeChange,
  onPhoneRouteGuideToggle,
  phoneAvailableTracks,
  phoneCurrentTrack,
  phoneGameSettings,
  phoneSelectedTrackId,
  request,
}) {
  const [controller, setController] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [renderedRequest, setRenderedRequest] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [transitionPhase, setTransitionPhase] = useState('closed');
  const closeTimeoutRef = useRef(null);
  const openFrameRef = useRef(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (openFrameRef.current) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (request) {
      if (!renderedRequest || renderedRequest.requestId !== request.requestId) {
        setRenderedRequest(request);
      }

      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      isClosingRef.current = false;
      setTransitionPhase('entering');
      return;
    }

    if (isClosingRef.current) {
      setRenderedRequest(null);
      setTransitionPhase('closed');
      isClosingRef.current = false;
      return;
    }

    setRenderedRequest(null);
    setTransitionPhase('closed');
  }, [renderedRequest, request]);

  useEffect(() => {
    if (!renderedRequest || transitionPhase !== 'entering') {
      return undefined;
    }

    openFrameRef.current = window.requestAnimationFrame(() => {
      setTransitionPhase('open');
    });

    return () => {
      if (openFrameRef.current) {
        window.cancelAnimationFrame(openFrameRef.current);
        openFrameRef.current = null;
      }
    };
  }, [renderedRequest, transitionPhase]);

  useEffect(() => {
    if (!renderedRequest) {
      setController(null);
      setErrorMessage('');
      setSnapshot(null);
      return undefined;
    }

    try {
      const nextController = createDeviceShellController(renderedRequest);
      setController(nextController);
      setErrorMessage('');

      const unsubscribe = nextController.subscribe((nextSnapshot) => {
        setSnapshot(nextSnapshot);
      });

      return () => {
        unsubscribe();
        nextController.destroy();
      };
    } catch (error) {
      setController(null);
      setSnapshot(null);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to mount device shell.');
      return undefined;
    }
  }, [renderedRequest]);

  const handleStartClose = useCallback(() => {
    if (!renderedRequest || isClosingRef.current) {
      return;
    }

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    isClosingRef.current = true;
    setTransitionPhase('closing');
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, SHELL_TRANSITION_MS);
  }, [onClose, renderedRequest]);

  useEffect(() => {
    if (!renderedRequest) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      handleStartClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleStartClose, renderedRequest]);

  if (!renderedRequest) {
    return null;
  }

  if (errorMessage) {
    return (
      <Box
        position="absolute"
        inset={4}
        zIndex={12}
        borderRadius="24px"
        bg="rgba(7, 11, 18, 0.92)"
        border="1px solid rgba(248, 113, 113, 0.28)"
        px={5}
        py={4}
      >
        <Text color="red.200" fontSize="sm">
          {errorMessage}
        </Text>
      </Box>
    );
  }

  if (!controller || !snapshot) {
    return null;
  }

  if (snapshot.shellFamilyId === 'phone') {
    return (
      <PhoneShellRenderer
        shellTransitionPhase={transitionPhase}
        snapshot={snapshot}
        onAppActivate={(appId) => controller.activatePhoneApp?.(appId)}
        onPhoneAction={(action) => controller.runPhoneAction?.(action)}
        onConfirmTerminalChoice={(choice) => controller.respondToTunnelConfirmation?.(choice)}
        onFeedItemSelect={(itemId) => controller.selectFeedItem?.(itemId)}
        onHome={() => controller.returnToPhoneHome?.()}
        onPhoneControlSideChange={onPhoneControlSideChange}
        onPhoneHudToggle={onPhoneHudToggle}
        onPhoneTrackSelect={onPhoneTrackSelect}
        onPhoneMusicToggle={onPhoneMusicToggle}
        onPhoneMusicVolumeChange={onPhoneMusicVolumeChange}
        onPhoneRouteGuideToggle={onPhoneRouteGuideToggle}
        onClose={handleStartClose}
        onTunnelReady={() => controller.enterTunnelTerminal?.()}
        phoneAvailableTracks={phoneAvailableTracks}
        phoneCurrentTrack={phoneCurrentTrack}
        phoneGameSettings={phoneGameSettings}
        phoneSelectedTrackId={phoneSelectedTrackId}
      />
    );
  }

  return (
    <DesktopShellRenderer
      shellTransitionPhase={transitionPhase}
      snapshot={snapshot}
      onClose={handleStartClose}
      onCloseBrowserWindow={() => controller.closeBrowserWindow?.()}
      onCloseCreditsWindow={() => controller.closeCreditsWindow?.()}
      onDismissBrowserPopup={(popupId) => controller.dismissBrowserPopup?.(popupId)}
      onFeedItemSelect={(itemId) => controller.selectFeedItem(itemId)}
      onConfirmTerminalChoice={(choice) => controller.respondToConfirmation(choice)}
      onIconActivate={(iconId) => controller.activateDesktopIcon(iconId)}
      onStartMenuAction={(actionId) => controller.activateStartMenuAction?.(actionId)}
    />
  );
}

export default CityDeviceShellHost;
