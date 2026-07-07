import { Box, useBreakpointValue } from '@chakra-ui/react';
import ChatPanel from '../../chat/ChatPanel';
import { RetroInset, RetroPanel } from '../../retro/RetroPageShell';

const ChatAssistantPanel = ({ generatedProblem }) => {
  const isMobileChatFocus = useBreakpointValue({ base: true, lg: false }) ?? false;

  if (!generatedProblem?.solution) {
    return null;
  }

  return (
    <Box
      width={{ base: '100%', xl: '42%' }}
      minWidth={{ base: '100%', xl: '350px' }}
      maxWidth={{ base: '100%', xl: '520px' }}
      flexShrink={0}
      display="block"
      alignSelf="stretch"
    >
      <RetroPanel
        fileLabel="assistant.chat"
        title="AI Chat Assistant"
        subtitle="Ask for refinement ideas, edge cases, or follow-up improvements after the draft appears."
        height={{ base: 'min(86dvh, 760px)', lg: 'calc(100vh - 60px)' }}
        maxHeight={{ lg: 'calc(100vh - 60px)' }}
        position={{ base: 'relative', lg: 'sticky' }}
        top={{ lg: '20px' }}
        width="100%"
        bodyProps={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <RetroInset flex="1" overflow="hidden" display="flex" flexDirection="column" minH={0}>
          <ChatPanel
            problemId={`ai-generator-${generatedProblem.titleSlug || Date.now()}`}
            onInputStart={() => {}}
            isDisabled={false}
            draftProblem={generatedProblem}
            isMobileChatFocus={isMobileChatFocus}
          />
        </RetroInset>
      </RetroPanel>
    </Box>
  );
};

export default ChatAssistantPanel;
