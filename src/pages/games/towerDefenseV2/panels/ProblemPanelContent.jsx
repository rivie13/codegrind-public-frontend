import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Tab, TabList, Tabs, Text } from '@chakra-ui/react';

import { TD_ONBOARDING_REQUEST_STEP_COMPLETE_EVENT } from '../../../../components/towerDefense/onboarding/inlineOnboardingEvents';
import useInlineTowerDefenseOnboardingStep from '../../../../components/towerDefense/onboarding/useInlineTowerDefenseOnboardingStep';
import { TowerDefenseProblemPanel } from '../../../../components/towerDefense/ui';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';
import { buildResponsiveProfile } from '../../../../utils/web/responsiveProfile';
import useGuestFunnel from '../../../../hooks/guest/useGuestFunnel';
const BRIEF_OVERLAY_SCROLL_DISMISS_THRESHOLD_PX = 40;

export default function ProblemPanelContent({
  problem,
  problemDescription,
  currentWave,
  totalWaves,
  isMissionComplete,
  isHomepageDemo,
  autoSwitchRemaining,
  autoSwitchActive,
  showIntroNote,
  problemTabs = [],
  activeProblemIndex = 0,
  onProblemTabChange = null,
  shellTheme = 'default',
  slotSwitcherControl = null,
  slotChrome = null,
  isMobileSlotLayout = false,
}) {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const useCompactMobileChrome = isMobileSlotLayout;
  const autoSwitchLabel = useMemo(() => {
    if (!autoSwitchActive || autoSwitchRemaining === null || autoSwitchRemaining === undefined)
      return null;
    const minutes = Math.floor(autoSwitchRemaining / 60);
    const seconds = autoSwitchRemaining % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [autoSwitchActive, autoSwitchRemaining]);
  const inlineOnboardingStep = useInlineTowerDefenseOnboardingStep('problem');
  const isMissionBriefStep = inlineOnboardingStep?.id === 'mission-objective';
  const [manualContinueUnlocked, setManualContinueUnlocked] = useState(true);
  const [manualContinueRemainingMs, setManualContinueRemainingMs] = useState(0);
  const [scrollGateSatisfied, setScrollGateSatisfied] = useState(false);
  const [briefOverlayDismissed, setBriefOverlayDismissed] = useState(false);

  const funnel = useGuestFunnel();
  const handleProblemClick = () => {
    if (isHomepageDemo) {
      funnel.problemOpened();
    }
  };

  useEffect(() => {
    if (isHomepageDemo) {
      funnel.problemOpened();
    }
  }, [isHomepageDemo, funnel]);

  useEffect(() => {
    setScrollGateSatisfied(false);
    setBriefOverlayDismissed(false);
  }, [inlineOnboardingStep?.id]);

  useEffect(() => {
    if (!inlineOnboardingStep?.requireManualContinue) {
      setManualContinueUnlocked(true);
      setManualContinueRemainingMs(0);
      return undefined;
    }

    const baseDelayMs = Number(inlineOnboardingStep?.manualContinueDelayMs);
    const mobileDelayMs = Number(inlineOnboardingStep?.manualContinueDelayMobileMs);
    const isMobileViewport =
      typeof window !== 'undefined' && buildResponsiveProfile().isHandheldSinglePanelLayout;
    const delayMs =
      isMobileViewport && Number.isFinite(mobileDelayMs) && mobileDelayMs > 0
        ? mobileDelayMs
        : Number.isFinite(baseDelayMs) && baseDelayMs > 0
          ? baseDelayMs
          : 0;

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
  }, [inlineOnboardingStep]);

  const continueButtonLabel = (() => {
    if (!inlineOnboardingStep?.requireManualContinue) {
      return '';
    }

    const requiredScrollProgress = Number(inlineOnboardingStep?.requireScrollProgress || 0);
    const scrollIsRequired = requiredScrollProgress > 0;

    if (inlineOnboardingStep?.lockedActionLabel) {
      if (!manualContinueUnlocked) {
        return inlineOnboardingStep.lockedActionLabel;
      }
    }

    if (scrollIsRequired && !scrollGateSatisfied) {
      return inlineOnboardingStep?.blockedActionLabel || 'Scroll to continue';
    }

    if (manualContinueUnlocked) {
      return inlineOnboardingStep?.actionLabel || 'Continue';
    }

    const remainingSeconds = Math.max(1, Math.ceil(manualContinueRemainingMs / 1000));
    return `Continue in ${remainingSeconds}s`;
  })();

  const requestStepCompletion = () => {
    if (typeof window === 'undefined' || !inlineOnboardingStep?.id) return;

    window.dispatchEvent(
      new CustomEvent(TD_ONBOARDING_REQUEST_STEP_COMPLETE_EVENT, {
        detail: {
          stepId: inlineOnboardingStep.id,
        },
      })
    );
  };

  const handleProblemPanelScrollStateChange = ({
    progress,
    hasScrollableOverflow,
    hasScrolled,
    currentScrollPx,
    source,
  }) => {
    if (!isMissionBriefStep) return;

    const requiredScrollProgress = Number(inlineOnboardingStep?.requireScrollProgress || 0);
    const scrollIsRequired = requiredScrollProgress > 0;
    const normalizedProgress = Number.isFinite(progress) ? progress : 0;
    const normalizedScrollPx = Number.isFinite(currentScrollPx) ? currentScrollPx : 0;
    const hasStartedReading =
      source === 'scroll' &&
      (normalizedScrollPx >= BRIEF_OVERLAY_SCROLL_DISMISS_THRESHOLD_PX ||
        (Boolean(hasScrolled) && normalizedProgress >= 0.04));

    if (hasStartedReading) {
      setBriefOverlayDismissed(true);
      if (isHomepageDemo) {
        funnel.briefScrolled();
      }
    }

    if (!scrollIsRequired) {
      setScrollGateSatisfied(true);
      return;
    }

    const hasSatisfiedRequirement =
      !hasScrollableOverflow || normalizedProgress >= requiredScrollProgress;

    setScrollGateSatisfied(hasSatisfiedRequirement);
  };

  const isContinueEnabled = Boolean(
    manualContinueUnlocked && (!inlineOnboardingStep?.requireScrollProgress || scrollGateSatisfied)
  );
  const retroChromeStripProps = isRetroDesktopTheme
    ? {
        bg: '#d4d0c8',
        borderBottom: '2px solid #5d636e',
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(81, 88, 98, 0.24)',
      }
    : null;
  const retroIntroPanelProps = isRetroDesktopTheme
    ? {
        borderRadius: '0',
        border: '2px solid #5d636e',
        bg: '#ece6db',
        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.74), inset -1px -1px 0 rgba(110, 118, 128, 0.2)',
      }
    : null;
  const retroContinueButtonSx = isRetroDesktopTheme
    ? {
        backgroundImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
        backgroundColor: '#d4d0c8',
        color: '#1f2430',
        borderRadius: '0',
        border: '1px solid rgba(31, 36, 48, 0.35)',
        boxShadow: 'none',
        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
        fontWeight: '700',
        letterSpacing: '0.02em',
        px: 4,
        _hover: {
          backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
          transform: 'translateY(1px)',
        },
        _active: {
          backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
          transform: 'translateY(1px)',
        },
        _disabled: {
          opacity: 0.56,
          cursor: 'not-allowed',
          filter: 'grayscale(0.18)',
        },
      }
    : null;

  return (
    <Box
      h="100%"
      minH="0"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      onClick={handleProblemClick}
    >
      {(slotSwitcherControl || slotChrome) && (
        <Flex
          px={useCompactMobileChrome ? 2 : 3}
          pt={useCompactMobileChrome ? 2 : 3}
          pb={useCompactMobileChrome ? 1.5 : 2}
          justify="space-between"
          align="center"
          gap={useCompactMobileChrome ? 1.5 : 2}
          flexWrap="wrap"
          bg={isRetroDesktopTheme ? retroChromeStripProps.bg : 'rgba(0, 20, 40, 0.6)'}
          borderBottom={
            isRetroDesktopTheme
              ? retroChromeStripProps.borderBottom
              : '1px solid rgba(0, 255, 140, 0.2)'
          }
          boxShadow={isRetroDesktopTheme ? retroChromeStripProps.boxShadow : undefined}
        >
          {slotSwitcherControl}
          {slotChrome}
        </Flex>
      )}
      {/* Removed background non-popup callout banner */}
      {problemTabs.length > 1 && (
        <Box
          px={useCompactMobileChrome ? 2 : 3}
          pt={useCompactMobileChrome ? 2 : 3}
          pb={useCompactMobileChrome ? 1.5 : 2}
          bg={isRetroDesktopTheme ? retroChromeStripProps.bg : 'rgba(0, 20, 40, 0.6)'}
          borderBottom={
            isRetroDesktopTheme
              ? retroChromeStripProps.borderBottom
              : '1px solid rgba(0, 255, 140, 0.2)'
          }
          boxShadow={isRetroDesktopTheme ? retroChromeStripProps.boxShadow : undefined}
        >
          <Tabs
            index={activeProblemIndex}
            onChange={onProblemTabChange || (() => {})}
            variant="unstyled"
            size="sm"
            isFitted
          >
            <TabList gap={2}>
              {problemTabs.map((tab, index) => (
                <Tab
                  key={tab.slug || index}
                  fontFamily={
                    isRetroDesktopTheme
                      ? "'Tahoma', 'MS Sans Serif', sans-serif"
                      : "'Orbitron', sans-serif"
                  }
                  fontSize="xs"
                  color={isRetroDesktopTheme ? '#1d2430' : 'green.200'}
                  bg={isRetroDesktopTheme ? '#ebe4d8' : 'transparent'}
                  border={
                    isRetroDesktopTheme ? '2px solid #6b717c' : '1px solid rgba(0, 255, 140, 0.35)'
                  }
                  borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                  boxShadow={
                    isRetroDesktopTheme
                      ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(109, 115, 125, 0.2)'
                      : undefined
                  }
                  _hover={
                    isRetroDesktopTheme ? { bg: '#f4ede1' } : { bg: 'rgba(0, 255, 140, 0.08)' }
                  }
                  _selected={
                    isRetroDesktopTheme
                      ? {
                          bg: '#faf7f0',
                          color: '#000082',
                          borderColor: '#2d3440',
                          boxShadow:
                            'inset 1px 1px 0 rgba(255, 255, 255, 0.8), inset -1px -1px 0 rgba(83, 91, 100, 0.16)',
                        }
                      : { bg: 'rgba(0, 255, 140, 0.2)', color: 'green.50' }
                  }
                >
                  {tab.title || `Problem ${index + 1}`}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </Box>
      )}
      {showIntroNote && !inlineOnboardingStep && (
        <Box
          mx={useCompactMobileChrome ? 2 : 3}
          mt={useCompactMobileChrome ? 2 : 3}
          mb={2}
          px={4}
          py={3}
          borderRadius={isRetroDesktopTheme ? retroIntroPanelProps.borderRadius : 'md'}
          border={isRetroDesktopTheme ? retroIntroPanelProps.border : '1px solid'}
          borderColor={isRetroDesktopTheme ? undefined : 'rgba(0, 255, 140, 0.4)'}
          bg={isRetroDesktopTheme ? retroIntroPanelProps.bg : 'rgba(0, 255, 140, 0.08)'}
          fontFamily={isRetroDesktopTheme ? retroIntroPanelProps.fontFamily : "'Arial', sans-serif"}
          boxShadow={isRetroDesktopTheme ? retroIntroPanelProps.boxShadow : undefined}
          sx={
            isHomepageDemo && !isRetroDesktopTheme
              ? {
                  animation: 'pulseGlow 2s ease-in-out infinite',
                  '@keyframes pulseGlow': {
                    '0%, 100%': {
                      boxShadow:
                        '0 0 6px rgba(0, 255, 140, 0.3), inset 0 0 6px rgba(0, 255, 140, 0.05)',
                    },
                    '50%': {
                      boxShadow:
                        '0 0 18px rgba(0, 255, 140, 0.7), inset 0 0 12px rgba(0, 255, 140, 0.15)',
                    },
                  },
                }
              : undefined
          }
        >
          <Text color={isRetroDesktopTheme ? '#1e2430' : 'green.200'} fontSize="sm" mb={1}>
            Unlock the editor by using the jack in button and placing Function/Object towers in the
            game to set up the problem in the editor.
          </Text>
          <Text color={isRetroDesktopTheme ? '#404957' : 'green.100'} fontSize="xs">
            Then switch to the Editor slot to solve the problem after unlocking. Use tower defense
            and code to defend against waves of enemies. You can generate code snippets by deploying
            towers, or you can write your own code from scratch to generate towers.
          </Text>
          {autoSwitchLabel && (
            <Text color={isRetroDesktopTheme ? '#000082' : 'cyan.200'} fontSize="xs" mt={2}>
              Auto-switching to the Editor in {autoSwitchLabel}.
            </Text>
          )}
        </Box>
      )}
      <Box flex="1" minH="0" display="flex" flexDirection="column">
        <TowerDefenseProblemPanel
          problem={problem}
          problemDescription={problemDescription}
          currentWave={currentWave}
          totalWaves={totalWaves}
          isMissionComplete={isMissionComplete}
          isDemo={isHomepageDemo}
          shellTheme={shellTheme}
          compactMobileLayout={useCompactMobileChrome}
          onScrollStateChange={handleProblemPanelScrollStateChange}
          tutorialOverlay={
            isMissionBriefStep
              ? {
                  isVisible: true,
                  isDismissed: briefOverlayDismissed,
                  isCompactMobileLayout: useCompactMobileChrome,
                }
              : null
          }
        >
          {isMissionBriefStep && inlineOnboardingStep?.requireManualContinue ? (
            <Flex justify="center" mt={6} pb={4}>
              <Button
                size={useCompactMobileChrome ? 'sm' : 'md'}
                isDisabled={!isContinueEnabled}
                onClick={requestStepCompletion}
                {...(isMissionBriefStep
                  ? {
                      bg: '#39FF14',
                      border: '3px solid #000000',
                      color: '#000000',
                      fontFamily: isRetroDesktopTheme
                        ? "'Tahoma', 'MS Sans Serif', sans-serif"
                        : "'Orbitron', sans-serif",
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      px: useCompactMobileChrome ? 6 : 8,
                      py: useCompactMobileChrome ? 4 : 6,
                      h: 'auto',
                      boxShadow: '6px 6px 0px #000000',
                      sx: {
                        borderRadius: '0',
                        backgroundImage: 'none',
                        fontSize: useCompactMobileChrome ? '14px' : '16px',
                        _hover: {
                          bg: '#FFFFFF',
                          boxShadow: '2px 2px 0px #000000',
                          transform: 'translate(4px, 4px)',
                          backgroundImage: 'none',
                        },
                        _active: {
                          boxShadow: 'none',
                          transform: 'translate(6px, 6px)',
                          backgroundImage: 'none',
                        },
                        _disabled: {
                          opacity: 0.5,
                          bg: '#7F7F7F',
                          color: '#C0C0C0',
                          boxShadow: 'none',
                          backgroundImage: 'none',
                          transform: 'none',
                        },
                      },
                    }
                  : {
                      bg: isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 255, 140, 0.12)',
                      border: isRetroDesktopTheme
                        ? '1px solid rgba(31, 36, 48, 0.35)'
                        : '1px solid rgba(0, 255, 140, 0.55)',
                      color: isRetroDesktopTheme ? '#1f2430' : '#cffff0',
                      fontFamily: isRetroDesktopTheme
                        ? "'Tahoma', 'MS Sans Serif', sans-serif"
                        : "'Orbitron', sans-serif",
                      letterSpacing: isRetroDesktopTheme ? '0.02em' : '0.06em',
                      textTransform: isRetroDesktopTheme ? 'none' : 'uppercase',
                      sx: isRetroDesktopTheme ? retroContinueButtonSx : undefined,
                      _hover: isRetroDesktopTheme
                        ? retroContinueButtonSx._hover
                        : { bg: 'rgba(0, 255, 140, 0.2)' },
                      _active: isRetroDesktopTheme ? retroContinueButtonSx._active : undefined,
                      _disabled: isRetroDesktopTheme ? retroContinueButtonSx._disabled : undefined,
                      px: 6,
                      py: 5,
                      boxShadow: isRetroDesktopTheme
                        ? undefined
                        : '0 0 14px rgba(0, 255, 140, 0.4)',
                    })}
              >
                {continueButtonLabel}
              </Button>
            </Flex>
          ) : null}
        </TowerDefenseProblemPanel>
      </Box>
      {inlineOnboardingStep?.requireManualContinue && !isMissionBriefStep ? (
        <Box
          px={useCompactMobileChrome ? 2 : 3}
          py={useCompactMobileChrome ? 2 : 3}
          borderTop={isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 255, 140, 0.2)'}
          bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 20, 40, 0.55)'}
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(81, 88, 98, 0.24)'
              : undefined
          }
        >
          <Flex justify="flex-end">
            <Button
              size={useCompactMobileChrome ? 'xs' : 'sm'}
              isDisabled={!isContinueEnabled}
              onClick={requestStepCompletion}
              bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 255, 140, 0.12)'}
              border={
                isRetroDesktopTheme
                  ? '1px solid rgba(31, 36, 48, 0.35)'
                  : '1px solid rgba(0, 255, 140, 0.55)'
              }
              color={isRetroDesktopTheme ? '#1f2430' : '#cffff0'}
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              letterSpacing={isRetroDesktopTheme ? '0.02em' : '0.06em'}
              textTransform={isRetroDesktopTheme ? 'none' : 'uppercase'}
              sx={isRetroDesktopTheme ? retroContinueButtonSx : undefined}
              _hover={
                isRetroDesktopTheme
                  ? retroContinueButtonSx._hover
                  : { bg: 'rgba(0, 255, 140, 0.2)' }
              }
              _active={isRetroDesktopTheme ? retroContinueButtonSx._active : undefined}
              _disabled={isRetroDesktopTheme ? retroContinueButtonSx._disabled : undefined}
            >
              {continueButtonLabel}
            </Button>
          </Flex>
        </Box>
      ) : null}
    </Box>
  );
}
