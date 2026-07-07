import { Box } from '@chakra-ui/react';
import TerminalHeader from './TerminalHeader';
import TerminalHistory from './TerminalHistory';
import TerminalInput from './TerminalInput';
import useTerminalState from './useTerminalState';
import '../../editor/Terminal.css';
import './TowerDefenseTerminal.css';

const TerminalContainer = (props) => {
  const {
    isResizable = true,
    terminalHeight = '100%',
    onCommandSubmit = null,
    shellTheme = 'default',
  } = props;
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  const {
    shouldShowAd,
    showCursor,
    terminalRef,
    terminalContentRef,
    terminalContainerRef,
    initialHeight,
    handleResizeStart,
    commandInput,
    handleInputChange,
    handleKeyDown,
    displayedText,
    isSmallScreen,
    getTerminalGlitchClass,
    isLoading,
    adSlotId,
    inputEnabled,
    inputPlaceholder,
    inputDisabledReason,
  } = useTerminalState(props);

  return (
    <Box
      ref={terminalContainerRef}
      className="terminal-container"
      height={isResizable ? `${initialHeight}px` : terminalHeight}
      position="relative"
      marginBottom="0"
      paddingBottom="0"
    >
      {isResizable && (
        <Box
          className="custom-handle"
          position="absolute"
          top="0"
          left="0"
          right="0"
          zIndex="15"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          cursor="row-resize"
          touchAction="none"
        >
          <Box className="handle-bar" />
        </Box>
      )}

      <Box
        bg={isRetroDesktopTheme ? '#f4efe6' : 'black'}
        color={isRetroDesktopTheme ? '#1f2430' : '#00ff00'}
        fontFamily={isRetroDesktopTheme ? "'Courier New', monospace" : 'monospace'}
        fontSize="sm"
        height="100%"
        minH="0"
        position="relative"
        display="flex"
        flexDirection="column"
        className={isRetroDesktopTheme ? 'retro-desktop-terminal terminal-no-glitch' : undefined}
      >
        <TerminalHeader shellTheme={shellTheme} />

        <TerminalHistory
          terminalRef={terminalRef}
          terminalContentRef={terminalContentRef}
          displayedText={displayedText}
          isSmallScreen={isSmallScreen}
          isLoading={isLoading}
          showCursor={showCursor}
          shouldShowAd={shouldShowAd}
          adSlotId={adSlotId}
          terminalGlitchClass={getTerminalGlitchClass()}
          shellTheme={shellTheme}
        />

        {onCommandSubmit && (
          <Box
            borderTop={`1px solid ${isRetroDesktopTheme ? '#7d828a' : '#0f4667'}`}
            px={3}
            py={2}
            bg={isRetroDesktopTheme ? '#ece6da' : 'black'}
            flexShrink={0}
            boxShadow={
              isRetroDesktopTheme
                ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.66), inset -1px -1px 0 rgba(104, 104, 104, 0.24)'
                : inputEnabled
                  ? '0 0 18px rgba(0, 255, 140, 0.6), 0 0 36px rgba(0, 255, 140, 0.25), inset 0 0 10px rgba(0, 255, 140, 0.3)'
                  : undefined
            }
            borderColor={
              isRetroDesktopTheme ? '#7d828a' : inputEnabled ? 'rgba(0, 255, 140, 0.55)' : undefined
            }
          >
            <TerminalInput
              inputEnabled={inputEnabled}
              inputPlaceholder={inputPlaceholder}
              inputDisabledReason={inputDisabledReason}
              commandInput={commandInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              shellTheme={shellTheme}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TerminalContainer;
