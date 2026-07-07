import { Box, Spinner, Text } from '@chakra-ui/react';
import BottomBannerAd from '../../ads/BottomBannerAd';

const TerminalOutput = ({
  terminalRef,
  terminalContent,
  isLoading,
  showCursor,
  shouldShowAd,
  adSlotId,
  terminalGlitchClass
}) => {
  return (
    <Box
      ref={terminalRef}
      p={4}
      pb={0}
      overflowY="auto"
      overflowX="hidden"
      flex="1"
      className={`terminal-content terminal-scrollable cyberpunk-terminal ${terminalGlitchClass}`}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1a1a1a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#333',
          borderRadius: '4px',
        },
        'scrollBehavior': 'smooth'
      }}
    >
      {isLoading ? (
        <Box display="flex" alignItems="center" gap={3} justifyContent="flex-start" mb={2}>
          <Spinner color="#00ff00" size="sm" thickness="2px" speed="0.8s" />
          <Text color="#00ccff">Initializing neural interface...</Text>
        </Box>
      ) : null}

      <Box position="relative" className="terminal-text-container">
        {terminalContent}

        {!isLoading && (
          <Box
            as="span"
            display="inline-block"
            opacity={showCursor ? 1 : 0}
            position="relative"
            verticalAlign="middle"
            color="#00ff00"
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

export default TerminalOutput;
