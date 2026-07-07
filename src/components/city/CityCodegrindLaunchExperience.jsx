import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import RetroDesktopBootScreen from './RetroDesktopBootScreen';
import {
  resolveLaunchNavigationInstruction,
  resolveSameOriginNavigationTarget,
} from './cityCodegrindLaunchNavigation';
import { buildCompactMobileShellPath } from '../../utils/navigation/mobileShellNavigation';
import { writePendingAppLaunch } from '../../utils/navigation/pendingAppLaunch';
import { setHomeDemoShellHidden } from '../../utils/ui/homeDemoShellVisibility';

const TRANSITION_MS = 1040;
const SHELL_COVER_MS = 320;

const scanlineDrift = keyframes`
  0% { transform: translateY(-18%); }
  100% { transform: translateY(18%); }
`;

const DEFAULT_TERMINAL_ROWS = [
  { token: 'Restore', text: 'Save the return path to the apartment' },
  { token: 'Open', text: 'Bring the apartment desktop back online' },
  { token: 'Resume', text: 'Pick up where you left off after the page turns' },
];

const getFallbackLaunchRect = () => {
  if (typeof window === 'undefined') {
    return {
      height: 540,
      left: 220,
      top: 120,
      width: 960,
    };
  }

  const width = Math.max(360, Math.round(window.innerWidth * 0.64));
  const height = Math.max(240, Math.round(window.innerHeight * 0.56));

  return {
    height,
    left: Math.round((window.innerWidth - width) / 2),
    top: Math.round((window.innerHeight - height) / 2),
    width,
  };
};

const normalizeLaunchRect = (sourceRect) => {
  if (!sourceRect) {
    return getFallbackLaunchRect();
  }

  return {
    height: Math.max(160, Math.round(sourceRect.height || 0)),
    left: Math.round(sourceRect.left || 0),
    top: Math.round(sourceRect.top || 0),
    width: Math.max(220, Math.round(sourceRect.width || 0)),
  };
};

function CityCodegrindLaunchExperience({
  description = 'Please wait while CodeGrind changes pages and carries you back into the apartment.',
  footerText = 'The transfer continues automatically.',
  onShellCovered,
  overlayPosition = 'absolute',
  overlayZIndex = 18,
  headline = 'launching from safehouse terminal',
  progressLabel,
  sourceRect,
  statusLabel = 'returning to apartment',
  subheadline = 'opening next screen',
  targetPath = '/',
  targetLaunchRequest = null,
  terminalRows = DEFAULT_TERMINAL_ROWS,
  windowTitle = 'codegrind.exe',
  windowStatusLabel = 'run',
}) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitionSettled, setIsTransitionSettled] = useState(false);
  const hasNavigatedRef = useRef(false);
  const launchRect = useMemo(() => normalizeLaunchRect(sourceRect), [sourceRect]);
  const resolvedTargetPath = useMemo(() => {
    if (targetLaunchRequest?.deviceClass === 'phone') {
      return buildCompactMobileShellPath(targetPath);
    }

    return targetPath;
  }, [targetLaunchRequest, targetPath]);
  const sameOriginTargetPath = useMemo(
    () => resolveSameOriginNavigationTarget(resolvedTargetPath),
    [resolvedTargetPath]
  );
  const launchNavigationInstruction = useMemo(
    () =>
      resolveLaunchNavigationInstruction({
        sameOriginTargetPath,
        targetLaunchRequest,
        targetPath,
      }),
    [sameOriginTargetPath, targetLaunchRequest, targetPath]
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsExpanded(true);
    });
    const settleTimerId = window.setTimeout(() => {
      setIsTransitionSettled(true);
    }, TRANSITION_MS);
    const shellCoveredTimerId = window.setTimeout(() => {
      onShellCovered?.();
    }, SHELL_COVER_MS);
    const navigateTimerId = window.setTimeout(() => {
      if (hasNavigatedRef.current) {
        return;
      }

      hasNavigatedRef.current = true;
      setHomeDemoShellHidden(targetLaunchRequest?.type === 'home-demo');
      if (targetLaunchRequest) {
        writePendingAppLaunch(targetLaunchRequest);
      }

      if (launchNavigationInstruction.mode === 'spa') {
        navigate(launchNavigationInstruction.target);
        return;
      }

      window.location.assign(launchNavigationInstruction.target);
    }, TRANSITION_MS);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(settleTimerId);
      window.clearTimeout(shellCoveredTimerId);
      window.clearTimeout(navigateTimerId);
    };
  }, [launchNavigationInstruction, navigate, onShellCovered, targetLaunchRequest]);

  return (
    <Box
      position={overlayPosition}
      inset={0}
      zIndex={overlayZIndex}
      overflow="hidden"
      pointerEvents="auto"
    >
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, rgba(11, 20, 30, 0.94), rgba(5, 8, 13, 1))"
        opacity={isExpanded ? 1 : 0}
        transition="opacity 240ms ease"
      />

      <Box
        position="absolute"
        top={isExpanded ? 0 : `${launchRect.top}px`}
        left={isExpanded ? 0 : `${launchRect.left}px`}
        width={isExpanded ? '100%' : `${launchRect.width}px`}
        height={isExpanded ? '100%' : `${launchRect.height}px`}
        borderRadius={isExpanded ? '0px' : '18px'}
        overflow="hidden"
        bg="#0b151d"
        boxShadow={
          isExpanded
            ? '0 0 0 rgba(0, 0, 0, 0)'
            : '0 28px 68px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(186, 198, 220, 0.18)'
        }
        filter={isExpanded ? 'blur(0px) saturate(1)' : 'blur(0.2px) saturate(0.96)'}
        transition={[
          `top ${TRANSITION_MS}ms cubic-bezier(0.16, 0.9, 0.24, 1)`,
          `left ${TRANSITION_MS}ms cubic-bezier(0.16, 0.9, 0.24, 1)`,
          `width ${TRANSITION_MS}ms cubic-bezier(0.16, 0.9, 0.24, 1)`,
          `height ${TRANSITION_MS}ms cubic-bezier(0.16, 0.9, 0.24, 1)`,
          `border-radius ${TRANSITION_MS}ms cubic-bezier(0.16, 0.9, 0.24, 1)`,
          'box-shadow 320ms ease',
          `filter ${TRANSITION_MS}ms cubic-bezier(0.16, 0.9, 0.24, 1)`,
        ].join(', ')}
        sx={{ willChange: 'top, left, width, height, border-radius, filter, box-shadow' }}
      >
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))"
          mixBlendMode="screen"
          opacity={isTransitionSettled ? 0.06 : 0.12}
          animation={`${scanlineDrift} 880ms linear infinite`}
        />

        <Box
          position="absolute"
          inset={0}
          opacity={isTransitionSettled ? 1 : 0.96}
          transition="opacity 180ms ease"
        >
          <RetroDesktopBootScreen
            description={description}
            footerText={subheadline || footerText}
            isProgressComplete={isTransitionSettled}
            kicker="Apartment transfer"
            progressLabel={progressLabel || statusLabel}
            terminalRows={terminalRows}
            title={headline}
            windowStatusLabel={windowStatusLabel}
            windowTitle={windowTitle}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default CityCodegrindLaunchExperience;
