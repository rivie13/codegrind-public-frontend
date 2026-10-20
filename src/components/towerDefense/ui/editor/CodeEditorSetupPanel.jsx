import { Box, Flex, Text } from '@chakra-ui/react';
import React from 'react';

const CodeEditorSetupPanel = ({
  showTerminal,
  terminalHeight,
  effectiveCodeGenerated = false,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  if (effectiveCodeGenerated) return null;

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      height={showTerminal ? `calc(100% - ${terminalHeight})` : '100%'}
      minHeight="0"
      flex="1"
      maxHeight="100%"
      overflowY="auto"
      bg={isRetroDesktopTheme ? '#d4d0c8' : '#050510'}
      color={isRetroDesktopTheme ? '#1f2430' : '#00ccff'}
      p={{ base: 3, md: 6 }}
      m="0"
      data-testid="code-editor-locked-setup"
    >
      <Box width="min(100%, 560px)" textAlign="center">
        <Text
          fontSize="sm"
          fontFamily={
            isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : "'Orbitron', sans-serif"
          }
          fontWeight="700"
          letterSpacing="0.02em"
        >
          Deploy a Function tower in the Game panel to unlock this workspace.
        </Text>
      </Box>
    </Flex>
  );
};

export default CodeEditorSetupPanel;
