import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import { FaClock } from 'react-icons/fa';

import BugReportButton from '../../../../components/feedback/BugReportButton';
import RateLimitIndicator from '../../../../components/towerDefense/ui/overlays/RateLimitIndicator';
import AIGenerationProgress from '../../../../components/towerDefense/ui/overlays/AIGenerationProgress';
import { SettingsButton } from '../../../../components/towerDefense/ui';
import {
  RETRO_PANEL_ICON_ASSETS,
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';
import { buildResponsiveProfile } from '../../../../utils/web/responsiveProfile';
const RETRO_PROBLEM_ICON_ASSET = RETRO_PANEL_ICON_ASSETS.problem;

const createRetroButtonProps = () => ({
  bgImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
  bg: '#d4d0c8',
  color: '#1f2430',
  border: '1px solid rgba(31, 36, 48, 0.35)',
  borderRadius: '0',
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontWeight: '700',
  boxShadow: 'none',
  _hover: {
    bgImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
    bg: '#d4d0c8',
  },
  _active: {
    bgImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
    bg: '#d4d0c8',
  },
});

const chipStyles = {
  bg: 'rgba(0, 0, 0, 0.34)',
  border: '1px solid',
  borderColor: 'rgba(0, 255, 255, 0.24)',
  borderRadius: 'md',
  px: 3,
  py: 2,
  minH: '40px',
  display: 'flex',
  alignItems: 'center',
};

const retroChipStyles = {
  bg: '#d4d0c8',
  border: '2px solid',
  borderColor: '#5d636e',
  borderRadius: '0',
  px: 3,
  py: 2,
  minH: '40px',
  display: 'flex',
  alignItems: 'center',
  boxShadow: 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)',
};

const detectCompactLandscapeViewport = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isHandheldCompactLandscape;
};

const detectMobileEditorViewport = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isHandheldSinglePanelLayout;
};

const useCompactLandscapeViewport = () => {
  const [isCompactLandscape, setIsCompactLandscape] = useState(() =>
    detectCompactLandscapeViewport()
  );

  useEffect(() => {
    const handleViewportChange = () => {
      setIsCompactLandscape(detectCompactLandscapeViewport());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  return isCompactLandscape;
};

const useMobileEditorViewport = () => {
  const [isMobileEditorViewport, setIsMobileEditorViewport] = useState(() =>
    detectMobileEditorViewport()
  );

  useEffect(() => {
    const handleViewportChange = () => {
      setIsMobileEditorViewport(detectMobileEditorViewport());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  return isMobileEditorViewport;
};

export function GamePanelSlotChrome({
  formattedTime,
  onResetGame,
  gameSettings = null,
  onGameSettingsChange = null,
  canEditGameSettings = false,
  difficultyMinimums = null,
  shellTheme = 'default',
}) {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const timerChipStyles = isRetroDesktopTheme ? retroChipStyles : chipStyles;

  return (
    <HStack spacing={2} flexWrap="wrap" justify="flex-end">
      <HStack spacing={2} sx={timerChipStyles}>
        <FaClock color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'} />
        <Text
          color={isRetroDesktopTheme ? '#1f2430' : 'cyan.300'}
          fontFamily={
            isRetroDesktopTheme
              ? "'Tahoma', 'MS Sans Serif', sans-serif"
              : "'Share Tech Mono', 'JetBrains Mono', monospace"
          }
          fontSize="sm"
          letterSpacing="0.12em"
          minW="70px"
          textAlign="center"
          fontWeight={isRetroDesktopTheme ? '700' : undefined}
        >
          {formattedTime}
        </Text>
      </HStack>

      <Button
        size="sm"
        variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
        colorScheme={isRetroDesktopTheme ? undefined : 'red'}
        onClick={onResetGame}
        data-tutorial="reset-button"
        {...(isRetroDesktopTheme ? createRetroButtonProps() : {})}
      >
        Reset
      </Button>

      <SettingsButton
        gameSettings={gameSettings}
        onGameSettingsChange={onGameSettingsChange}
        canEditGameSettings={canEditGameSettings}
        difficultyMinimums={difficultyMinimums}
        buttonProps={{
          size: 'sm',
          minW: '32px',
          h: '32px',
          px: 0,
          ...(isRetroDesktopTheme ? createRetroButtonProps() : {}),
        }}
      />
    </HStack>
  );
}

export function EditorPanelSlotChrome({
  isAnyActionInProgress,
  currentActionType,
  shellTheme = 'default',
}) {
  const isCompactLandscape = useCompactLandscapeViewport();
  const isMobileEditorViewport = useMobileEditorViewport();
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const rateLimitChipStyles = isRetroDesktopTheme
    ? {
        ...retroChipStyles,
        px: isCompactLandscape ? 2 : retroChipStyles.px,
        py: isCompactLandscape ? 1.5 : retroChipStyles.py,
        minH: isCompactLandscape ? '34px' : retroChipStyles.minH,
        flexShrink: 0,
      }
    : {
        ...chipStyles,
        px: isCompactLandscape ? 2 : chipStyles.px,
        py: isCompactLandscape ? 1.5 : chipStyles.py,
        minH: isCompactLandscape ? '34px' : chipStyles.minH,
        flexShrink: 0,
      };

  return (
    <HStack
      spacing={isCompactLandscape ? 1.5 : 2}
      flexWrap="wrap"
      justify="flex-end"
      align="stretch"
      w="100%"
      maxW={isCompactLandscape ? '100%' : undefined}
    >
      <Box sx={rateLimitChipStyles}>
        <RateLimitIndicator shellTheme={shellTheme} />
      </Box>

      {!isMobileEditorViewport && (
        <Box
          bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 20, 40, 0.78)'}
          px={isCompactLandscape ? 2 : 3}
          py={isCompactLandscape ? 1.5 : 2}
          borderRadius={isRetroDesktopTheme ? '0' : 'md'}
          border={isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 255, 255, 0.4)'}
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
              : isAnyActionInProgress
                ? '0 0 10px rgba(0, 255, 255, 0.45)'
                : '0 0 5px rgba(0, 255, 255, 0.18)'
          }
          transition="box-shadow 0.3s ease"
          minW={isCompactLandscape ? '0' : '180px'}
          flex={isCompactLandscape ? '1 1 220px' : undefined}
        >
          <Text
            color={isRetroDesktopTheme ? '#1f2430' : '#0ff'}
            fontFamily={
              isRetroDesktopTheme
                ? "'Tahoma', 'MS Sans Serif', sans-serif"
                : "'Orbitron', sans-serif"
            }
            fontWeight="bold"
            fontSize={isCompactLandscape ? '0.66rem' : '0.72rem'}
            letterSpacing="0.1em"
          >
            {isRetroDesktopTheme ? 'BUILD QUEUE' : 'NEURAL SYNTHESIS'}:{' '}
            {isAnyActionInProgress ? currentActionType : 'READY'}
          </Text>
          <AIGenerationProgress
            isGenerating={isAnyActionInProgress}
            towerType={currentActionType}
            compact={true}
            shellTheme={shellTheme}
          />
        </Box>
      )}
    </HStack>
  );
}

export function ProblemPanelSlotChrome({
  isLearningMode = false,
  formattedTime,
  currentActionType,
  shellTheme = 'default',
}) {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  return (
    <HStack spacing={2} flexWrap="wrap" justify="flex-end">
      {isRetroDesktopTheme ? (
        <HStack
          spacing={2}
          px={2.5}
          py={1.5}
          bg="#d4d0c8"
          border="2px solid #5d636e"
          borderRadius="0"
          boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)"
        >
          <Box
            as="img"
            src={RETRO_PROBLEM_ICON_ASSET}
            alt=""
            aria-hidden="true"
            w="16px"
            h="16px"
            imageRendering="pixelated"
          />
          <Text
            color="#1f2430"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {isLearningMode ? 'Lesson File' : 'Mission File'}
          </Text>
        </HStack>
      ) : null}

      <BugReportButton
        pageType="tower-defense"
        pageContext={{
          mode: isLearningMode ? 'learning' : 'standard',
          formattedTime,
        }}
        clientState={{
          actionState: currentActionType,
        }}
        buttonLabel="Report Bug"
        buttonProps={{
          size: 'sm',
          ...(isRetroDesktopTheme
            ? createRetroButtonProps()
            : {
                bg: 'transparent',
                color: '#ffcc00',
                border: '1px solid #ffcc00',
                _hover: { bg: 'rgba(255, 204, 0, 0.1)' },
              }),
        }}
      />
    </HStack>
  );
}

export default function PanelActions() {
  return null;
}
