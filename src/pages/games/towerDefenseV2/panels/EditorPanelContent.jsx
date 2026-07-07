import React from 'react';
import { Box, Button, HStack, Tab, TabList, Tabs } from '@chakra-ui/react';

import { CodeEditorPanel } from '../../../../components/towerDefense/ui';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';
import useGuestFunnel from '../../../../hooks/guest/useGuestFunnel';

export default function EditorPanelContent({
  initialCodeGenerated,
  gameState,
  playerLost,
  playerWon,
  initialLives,
  language,
  code,
  terminalOutput,
  terminalRef,
  terminalResetKey,
  codeSubmitted,
  codeSubmissionSuccess,
  selectedTowerType,
  isTowerPlacementMode,
  onLanguageChange,
  onCodeChange,
  onCodeLineCommitted,
  onStartWave,
  onResetGame,
  onCancelPlacement,
  problemTitle,
  difficulty,
  isDemo,
  onTerminalCommand,
  terminalInputEnabled,
  terminalInputPlaceholder,
  terminalInputDisabledReason,
  isLearningMode = false,
  lockedLearningLanguage = null,
  problemTabs = [],
  activeProblemIndex = 0,
  onProblemTabChange = null,
  // Refine Solution controls
  shouldShowVerificationControls = false,
  onRefineSolution,
  isRefining = false,
  canRefineSolution = false,
  refinementLimitReached = false,
  onShowAdModal,
  isWatchingAd = false,
  isMobileSlotLayout = false,
  slotSwitcherControl = null,
  slotChrome = null,
  shellTheme = 'default',
  isHomepageDemo = false,
  functionTowerPlaced = false,
}) {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  const funnel = useGuestFunnel();
  const hasTypedRef = React.useRef(false);

  React.useEffect(() => {
    if (isHomepageDemo) {
      funnel.editorOpened();
    }
  }, [isHomepageDemo, funnel]);

  const handleCodeChange = (newCode) => {
    if (isHomepageDemo && !hasTypedRef.current) {
      hasTypedRef.current = true;
      funnel.firstKeystroke();
    }
    onCodeChange?.(newCode);
  };
  const retroButtonSx = isRetroDesktopTheme
    ? {
        backgroundImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
        backgroundColor: '#d4d0c8',
        color: '#1f2430',
        borderRadius: '0',
        border: '1px solid rgba(31, 36, 48, 0.35)',
        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
        fontWeight: '700',
        letterSpacing: '0.02em',
        px: 4,
      }
    : null;

  const headerSlotChrome = shouldShowVerificationControls ? (
    <HStack spacing={2} align="center" flexWrap="wrap" justify="flex-end">
      {slotChrome}
      <Button
        size="sm"
        colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
        variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
        onClick={onRefineSolution}
        isLoading={isRefining}
        isDisabled={!canRefineSolution}
        boxShadow={isRetroDesktopTheme ? 'none' : '0 0 18px rgba(153, 102, 255, 0.65)'}
        _hover={
          isRetroDesktopTheme
            ? {
                backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
                transform: 'translateY(1px)',
              }
            : { boxShadow: '0 0 28px rgba(153, 102, 255, 0.95)', transform: 'scale(1.03)' }
        }
        _active={
          isRetroDesktopTheme
            ? {
                backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
                transform: 'translateY(1px)',
              }
            : undefined
        }
        fontFamily={
          isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : "'Orbitron', monospace"
        }
        sx={isRetroDesktopTheme ? retroButtonSx : undefined}
      >
        Refine Solution
      </Button>
      {refinementLimitReached && (
        <Button
          size="sm"
          colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
          variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
          onClick={onShowAdModal}
          isLoading={isWatchingAd}
          boxShadow={isRetroDesktopTheme ? 'none' : '0 0 18px rgba(153, 102, 255, 0.65)'}
          _hover={
            isRetroDesktopTheme
              ? {
                  backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
                  transform: 'translateY(1px)',
                }
              : { boxShadow: '0 0 28px rgba(153, 102, 255, 0.95)', transform: 'scale(1.03)' }
          }
          _active={
            isRetroDesktopTheme
              ? {
                  backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
                  transform: 'translateY(1px)',
                }
              : undefined
          }
          fontFamily={
            isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : "'Orbitron', monospace"
          }
          sx={isRetroDesktopTheme ? retroButtonSx : undefined}
        >
          Watch Ad to Refine
        </Button>
      )}
    </HStack>
  ) : (
    slotChrome
  );

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      {problemTabs.length > 1 && (
        <Box
          px={3}
          pt={3}
          pb={2}
          bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 20, 40, 0.6)'}
          borderBottom={
            isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 255, 140, 0.2)'
          }
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(81, 88, 98, 0.24)'
              : undefined
          }
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
                  color={isRetroDesktopTheme ? '#1d2430' : 'cyan.200'}
                  bg={isRetroDesktopTheme ? '#ebe4d8' : 'transparent'}
                  border={
                    isRetroDesktopTheme ? '2px solid #6b717c' : '1px solid rgba(0, 255, 255, 0.35)'
                  }
                  borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                  boxShadow={
                    isRetroDesktopTheme
                      ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(109, 115, 125, 0.2)'
                      : undefined
                  }
                  _hover={
                    isRetroDesktopTheme ? { bg: '#f4ede1' } : { bg: 'rgba(0, 255, 255, 0.08)' }
                  }
                  _selected={
                    isRetroDesktopTheme
                      ? {
                          bg: '#faf7f0',
                          color: '#000082',
                          borderColor: '#2d3440',
                        }
                      : { bg: 'rgba(0, 255, 255, 0.2)', color: 'cyan.50' }
                  }
                >
                  {tab.title || `Problem ${index + 1}`}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </Box>
      )}
      <Box flex="1" minH="0" display="flex" flexDirection="column">
        <CodeEditorPanel
          initialCodeGenerated={initialCodeGenerated}
          playerLost={playerLost}
          playerWon={playerWon}
          initialLives={initialLives}
          language={language}
          code={code}
          showTerminal={true}
          terminalOutput={terminalOutput}
          terminalAnimating={false}
          terminalRef={terminalRef}
          terminalResetKey={terminalResetKey}
          codeSubmitted={codeSubmitted}
          codeSubmissionSuccess={codeSubmissionSuccess}
          canSubmitSolution={shouldShowVerificationControls}
          currentWave={gameState.wave}
          lives={gameState.lives}
          selectedTowerType={selectedTowerType}
          isTowerPlacementMode={isTowerPlacementMode}
          onLanguageChange={onLanguageChange}
          onCodeChange={handleCodeChange}
          onCodeLineCommitted={onCodeLineCommitted}
          isLearningMode={isLearningMode}
          lockedLearningLanguage={lockedLearningLanguage}
          onStartWave={onStartWave}
          onResetGame={onResetGame}
          onCancelTowerPlacement={onCancelPlacement}
          gameStatus={gameState.status}
          problemTitle={problemTitle}
          difficulty={difficulty}
          isDemo={isDemo}
          strictCodeGate={true}
          onTerminalCommand={onTerminalCommand}
          terminalInputEnabled={terminalInputEnabled}
          terminalInputPlaceholder={terminalInputPlaceholder}
          terminalInputDisabledReason={terminalInputDisabledReason}
          isMobileSlotLayout={isMobileSlotLayout}
          slotSwitcherControl={slotSwitcherControl}
          slotChrome={headerSlotChrome}
          shellTheme={shellTheme}
          isHomepageDemo={isHomepageDemo}
          functionTowerPlaced={functionTowerPlaced}
        />
      </Box>
    </Box>
  );
}
