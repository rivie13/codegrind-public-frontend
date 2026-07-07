import {
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import React from 'react';
import audioManager from '../../../../utils/audio/AudioManager';

const codexSections = [
  {
    title: 'Mission Loop',
    lines: [
      '1. Read the problem panel first. That is the mission objective.',
      '2. Jack In to move from briefing mode to live run mode.',
      '3. Place towers, then use the editor and terminal to shape your solution.',
      '4. Survive waves and verify before final wave to clear the level.',
    ],
  },
  {
    title: 'Wave Rules',
    lines: [
      'Wave 1 is your first systems check. Keep setup simple and readable.',
      'Before final wave, verification is required for a true clear.',
      'Once final wave starts, new tower buys lock. Upgrades and deployables stay available.',
    ],
  },
  {
    title: 'Panel and Slot Rules',
    lines: [
      'Use slot controls to switch between Game, Problem, Editor, and Chat surfaces.',
      'During active combat, the slot showing live gameplay may be temporarily locked.',
      'Keep problem, code, and combat visible in a rhythm that matches your play style.',
    ],
  },
  {
    title: 'Quick Tactical Notes',
    lines: [
      'Ghost text can be accepted with Tab when suggestions appear in the editor.',
      'Running tests is useful but should be treated as a resource decision.',
      'If a wave is stable, expand with upgrades or deployables before the final check.',
    ],
  },
];

const TutorialControlsSection = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleOpenCodex = () => {
    audioManager.playSoundEffect('button-click');
    onOpen();
  };

  return (
    <Box mb={6}>
      <Heading
        as="h3"
        size="md"
        mb={3}
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        color="#0a2c9a"
        borderBottom="1px solid"
        borderColor="#7f7f7f"
        pb={2}
        position="relative"
        letterSpacing="0.08em"
        textTransform="uppercase"
        sx={{
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: '0',
            left: '25%',
            width: '50%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #1084d0, transparent)',
          },
        }}
      >
        <Flex align="center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a2c9a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '8px' }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          TUTORIAL CONTROLS
        </Flex>
      </Heading>

      <Box
        p={3}
        bg="#efebe7"
        borderWidth="2px"
        borderColor="#7f7f7f"
        borderRadius="0"
        boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
      >
        <VStack spacing={3} align="stretch">
          <Button
            bg="#d4d0c8"
            border="1px solid rgba(31, 36, 48, 0.35)"
            borderRadius="0"
            color="#1f2430"
            _hover={{ bg: '#efebe7', transform: 'translateY(1px)' }}
            onClick={handleOpenCodex}
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            letterSpacing="0.06em"
            size="md"
            fontWeight="bold"
            textTransform="uppercase"
          >
            Open Tutorial Codex
          </Button>

          <Text fontSize="sm" color="#3b4250" fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
            Quick-reference tactical guide for mission flow, wave rules, slot behavior, and
            verification checks.
          </Text>
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
        <ModalOverlay bg="rgba(9, 18, 34, 0.28)" backdropFilter="blur(2px)" />
        <ModalContent
          className="cg-panel-window"
          bg="#d4d0c8"
          border="2px solid"
          borderColor="#5d636e"
          borderRadius="0"
          boxShadow="var(--cg-window-outset), 12px 12px 0 rgba(0,0,0,0.16)"
        >
          <ModalHeader
            className="cg-titlebar"
            color="#ffffff"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            letterSpacing="0.08em"
            textTransform="uppercase"
            borderBottom="2px solid"
            borderColor="#5d636e"
          >
            Tutorial Codex
          </ModalHeader>
          <ModalCloseButton color="#1f2430" />
          <ModalBody py={5} bg="#d4d0c8">
            <VStack spacing={4} align="stretch">
              {codexSections.map((section) => (
                <Box
                  key={section.title}
                  p={4}
                  borderWidth="2px"
                  borderColor="#7f7f7f"
                  borderRadius="0"
                  bg="#efebe7"
                  boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
                >
                  <Heading
                    as="h4"
                    size="sm"
                    color="#0a2c9a"
                    mb={2}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                  >
                    {section.title}
                  </Heading>
                  <VStack align="stretch" spacing={1}>
                    {section.lines.map((line) => (
                      <Text
                        key={line}
                        fontSize="sm"
                        color="#1f2430"
                        lineHeight="1.5"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      >
                        {line}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TutorialControlsSection;
