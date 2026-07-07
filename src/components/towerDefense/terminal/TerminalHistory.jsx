import { Box, Spinner, Text } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import BottomBannerAd from '../../ads/BottomBannerAd';
import { formatResponsiveASCII, getLineClassName } from './utils/terminalFormatting';
import TerminalLine from './TerminalLine';

const TerminalHistory = ({
  terminalRef,
  terminalContentRef,
  displayedText,
  isSmallScreen,
  isLoading,
  showCursor,
  shouldShowAd,
  adSlotId,
  terminalGlitchClass,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  const setTerminalNode = useCallback(
    (node) => {
      if (terminalRef) {
        terminalRef.current = node;
      }
      if (terminalContentRef) {
        terminalContentRef.current = node;
      }
    },
    [terminalContentRef, terminalRef]
  );

  const terminalLines = useMemo(() => {
    if (!displayedText) return [];

    if (Array.isArray(displayedText)) {
      return displayedText.map((item, index) => {
        const content =
          typeof item === 'string'
            ? item
            : typeof item?.text === 'string'
              ? item.text
              : typeof item?.message === 'string'
                ? item.message
                : '';
        const className =
          typeof item === 'object' && item.className ? item.className : 'terminal-line';

        return (
          <TerminalLine
            key={`terminal-line-${index}`}
            content={content}
            className={className}
            isSmallScreen={isSmallScreen}
          />
        );
      });
    }

    if (typeof displayedText === 'string') {
      return displayedText.split('\n').map((line, index) => {
        const processedLine = formatResponsiveASCII(line, isSmallScreen);
        const className = getLineClassName(line);

        return (
          <TerminalLine
            key={`terminal-line-${index}`}
            content={processedLine}
            className={className}
            isSmallScreen={isSmallScreen}
          />
        );
      });
    }

    return [];
  }, [displayedText, isSmallScreen]);

  return (
    <Box
      ref={setTerminalNode}
      p={4}
      pb={0}
      overflowY="auto"
      overflowX="hidden"
      flex="1"
      minH="0"
      className={`terminal-content terminal-scrollable ${isRetroDesktopTheme ? 'retro-desktop-terminal terminal-no-glitch' : `cyberpunk-terminal ${terminalGlitchClass}`}`}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: isRetroDesktopTheme ? '#d4d0c8' : '#1a1a1a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: isRetroDesktopTheme ? '#8b8b8b' : '#333',
          borderRadius: '4px',
        },
        scrollBehavior: 'smooth',
      }}
    >
      {isLoading ? (
        <Box display="flex" alignItems="center" gap={3} justifyContent="flex-start" mb={2}>
          <Spinner
            color={isRetroDesktopTheme ? '#000080' : '#00ff00'}
            size="sm"
            thickness="2px"
            speed="0.8s"
          />
          <Text color={isRetroDesktopTheme ? '#3d4654' : '#00ccff'}>
            {isRetroDesktopTheme
              ? 'Preparing desktop workspace...'
              : 'Initializing neural interface...'}
          </Text>
        </Box>
      ) : null}

      <Box position="relative" className="terminal-text-container">
        {terminalLines}

        {!isLoading && (
          <Box
            as="span"
            display="inline-block"
            opacity={showCursor ? 1 : 0}
            position="relative"
            verticalAlign="middle"
            color={isRetroDesktopTheme ? '#000080' : '#00ff00'}
            className="terminal-cursor-blink"
          >
            █
          </Box>
        )}
      </Box>

      {shouldShowAd && (
        <Box
          position="relative"
          width="100%"
          minHeight="90px"
          mt={0}
          mb={0}
          pb={0}
          className="terminal-ad-container"
        >
          <BottomBannerAd slotId={adSlotId} />
        </Box>
      )}
    </Box>
  );
};

export default TerminalHistory;
