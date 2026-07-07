import React from 'react';
import { Box, Flex } from '@chakra-ui/react';

import { TowerDefenseChatPanel } from '../../../../components/towerDefense/ui';

export default function ChatPanelContent({
  chatPanelRef,
  problemId,
  activeTitleSlug,
  shouldLoadUsage = true,
  hasProblemError,
  isDemo,
  problem,
  problemDescription,
  language,
  code,
  terminalOutput,
  isLearningMode = false,
  isMobileChatFocus = false,
  slotSwitcherControl = null,
  slotChrome = null,
  shellTheme = 'default',
}) {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  return (
    <Box h="100%" flex="1" minH="0" display="flex" flexDirection="column" overflow="hidden">
      {(slotSwitcherControl || slotChrome) && (
        <Flex
          px={3}
          pt={3}
          pb={2}
          bg={isRetroDesktopTheme ? '#c8c3b9' : 'rgba(0, 20, 40, 0.6)'}
          borderBottom={
            isRetroDesktopTheme ? '2px solid #6a6a6a' : '1px solid rgba(153, 102, 255, 0.25)'
          }
          justify="space-between"
          align="center"
          gap={2}
          flexWrap="wrap"
        >
          {slotSwitcherControl}
          {slotChrome}
        </Flex>
      )}
      <Box flex="1" minH="0" display="flex" overflow="hidden">
        <TowerDefenseChatPanel
          ref={chatPanelRef}
          problemId={problemId}
          onInputStart={() => {}}
          shouldLoadUsage={shouldLoadUsage}
          isDisabled={!activeTitleSlug || (Boolean(hasProblemError) && !isDemo)}
          problem={problem}
          problemDescription={problemDescription}
          language={language}
          code={code}
          terminalOutput={terminalOutput}
          isLearningMode={isLearningMode}
          isMobileChatFocus={isMobileChatFocus}
          shellTheme={shellTheme}
        />
      </Box>
    </Box>
  );
}
