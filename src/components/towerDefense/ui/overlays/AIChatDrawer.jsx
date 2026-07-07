import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { FaRobot } from 'react-icons/fa';
import TowerDefenseChatPanel from '../panels/TowerDefenseChatPanel';

const AIChatDrawer = forwardRef(({ isOpen, onClose, problem, isDemo = false }, ref) => {
  const [isMobileViewport] = useMediaQuery('(max-width: 768px)');

  // Function to normalize problem ID for correct identification
  const getNormalizedProblemId = () => {
    if (!problem) return null;

    // Already has ai- prefix
    if (problem.id && typeof problem.id === 'string' && problem.id.startsWith('ai-')) {
      return problem.id;
    }

    // AI problem needs prefix
    if (problem.isAIProblem && problem.id) {
      return `ai-${problem.id}`;
    }

    // Use questionId or titleSlug for standard problems
    return problem.questionId || problem.titleSlug || problem.id;
  };

  // Get the normalized problem ID once when the drawer opens or problem changes
  const normalizedProblemId = getNormalizedProblemId();

  // Create a ref for the chat panel
  const chatPanelRef = useRef(null);

  // Forward the clearChatHistory method
  useImperativeHandle(
    ref,
    () => ({
      clearChatHistory: () => {
        if (chatPanelRef.current) {
          return chatPanelRef.current.clearChatHistory();
        }
        return false;
      },
    }),
    []
  );

  return (
    <>
      {isOpen && (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
          <DrawerOverlay backgroundColor="rgba(0,0,0,0.7)" backdropFilter="blur(2px)" />
          <DrawerContent
            bg="#0a0a14"
            color="white"
            borderLeft={{ base: 'none', md: '1px solid' }}
            boxShadow="0 0 20px rgba(128, 0, 255, 0.3)"
            maxWidth={{ base: '100vw', md: '72vw', lg: '50vw' }}
            width={{ base: '100vw', md: '72vw', lg: '50vw' }}
          >
            <DrawerCloseButton
              color="purple.400"
              _hover={{
                color: 'purple.300',
                bg: 'rgba(128, 0, 255, 0.2)',
              }}
            />
            <DrawerHeader
              borderBottom="1px solid"
              borderColor="purple.900"
              bgGradient="linear(to-r, #0a0024, #1a0033)"
            >
              <Flex alignItems="center" gap={2}>
                <FaRobot
                  color="#a855f7"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.7))',
                  }}
                />
                <Text
                  bgGradient="linear(to-r, purple.400, pink.400)"
                  bgClip="text"
                  fontFamily="'Orbitron', sans-serif"
                  textShadow="0 0 5px #a855f7"
                  letterSpacing="1px"
                  fontSize="lg"
                >
                  Hack Assistant
                </Text>
              </Flex>
            </DrawerHeader>
            <DrawerBody
              sx={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(26, 0, 51, 0.3)',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(168, 85, 247, 0.5)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: 'rgba(168, 85, 247, 0.8)',
                },
              }}
            >
              {problem && normalizedProblemId && (
                <TowerDefenseChatPanel
                  ref={chatPanelRef}
                  problemId={normalizedProblemId}
                  onInputStart={() => {}}
                  isDisabled={false}
                  isDemo={isDemo}
                  isMobileChatFocus={isMobileViewport}
                />
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
});

export default AIChatDrawer;
