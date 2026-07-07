import {
  Box,
  Button,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';

const challenges = [
  {
    id: 'autoTimer',
    label: 'Auto Timer',
    description: 'Start the timer as soon as you enter the workspace.',
  },
  {
    id: 'noAI',
    label: 'No AI Assistant',
    description: 'Disable AI chat help for the entire run.',
  },
  {
    id: 'randomChars',
    label: 'Random Characters',
    description: 'Scatter junk characters into the editor while you code.',
  },
  {
    id: 'matrixBomb',
    label: 'Matrix Bomb',
    description:
      'Flood the editor with shifting characters so you can only read one line clearly at a time.',
  },
  {
    id: 'timeAttack',
    label: 'Time Attack',
    description: 'Race the clock. Easy gets 15 minutes, Medium 30, and Hard 45.',
  },
];

const RETRO_ACTION_BUTTON_PROPS = {
  border: '1px solid var(--cg-window-shadow)',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontWeight: '700',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  _hover: {
    bg: 'var(--cg-window-face-strong)',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translate(1px, 1px)',
  },
  _focusVisible: {
    boxShadow: 'var(--cg-window-inset)',
  },
};

const ChallengeModal = ({ isOpen, onClose, onConfirm, problem }) => {
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const toast = useToast();

  // Check if at least one challenge is selected
  const isValid = selectedChallenges.length > 0;

  const handleChallengeChange = (id, isChecked) => {
    if (isChecked) {
      // If autoTimer is being selected and timeAttack is already selected
      if (id === 'autoTimer' && selectedChallenges.includes('timeAttack')) {
        toast({
          title: 'Challenge Conflict',
          description: 'Auto Timer and Time Attack cannot be selected together.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // If timeAttack is being selected and autoTimer is already selected
      if (id === 'timeAttack' && selectedChallenges.includes('autoTimer')) {
        toast({
          title: 'Challenge Conflict',
          description: 'Time Attack and Auto Timer cannot be selected together.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSelectedChallenges((prev) => [...prev, id]);
    } else {
      setSelectedChallenges((prev) => prev.filter((challengeId) => challengeId !== id));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="rgba(23, 26, 34, 0.62)" backdropFilter="blur(2px)" />
      <ModalContent
        bg="linear-gradient(180deg, #ece8df 0%, #d5d0c8 100%)"
        color="var(--cg-text)"
        borderWidth="1px"
        borderColor="var(--cg-window-shadow)"
        borderRadius="0"
        boxShadow="var(--cg-window-outset), 20px 20px 0 rgba(0, 0, 0, 0.18)"
        position="relative"
        overflow="hidden"
        maxW="min(640px, calc(100vw - 32px))"
      >
        <ModalHeader
          bg="linear-gradient(90deg, #0a3ca6 0%, #4b73d1 100%)"
          color="white"
          borderBottomWidth="1px"
          borderColor="rgba(9, 39, 98, 0.45)"
          py={3}
          px={4}
        >
          <Flex direction="column" gap={0.5}>
            <Text
              fontSize="xs"
              fontWeight="700"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              {problem?.title ? `${problem.title}.challenge` : 'workspace.challenge'}
            </Text>
            <Text
              fontSize="lg"
              fontWeight="700"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              Select Your Challenges
            </Text>
          </Flex>
        </ModalHeader>
        <ModalBody py={6}>
          <VStack align="start" spacing={4}>
            <Text
              color="var(--cg-text)"
              fontSize="sm"
              mb={2}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              lineHeight="1.6"
            >
              Pick at least one modifier before you launch the run. Each selection changes how the
              workspace fights back.
            </Text>

            {challenges.map((challenge) => (
              <Flex
                key={challenge.id}
                p={3}
                w="100%"
                borderWidth="1px"
                borderColor="var(--cg-window-shadow)"
                borderRadius="0"
                bg="rgba(255, 255, 255, 0.34)"
                boxShadow="var(--cg-window-inset)"
                _hover={{
                  bg: 'rgba(255, 255, 255, 0.48)',
                }}
              >
                <Checkbox
                  colorScheme="blue"
                  size="lg"
                  isChecked={selectedChallenges.includes(challenge.id)}
                  sx={{
                    '.chakra-checkbox__control': {
                      borderColor: 'var(--cg-window-shadow)',
                      borderRadius: '0',
                      boxShadow: 'var(--cg-window-outset)',
                      bg: 'var(--cg-window-face)',
                      _checked: {
                        bg: '#0a3ca6',
                        borderColor: '#0a3ca6',
                        color: 'white',
                      },
                    },
                  }}
                  onChange={(e) => handleChallengeChange(challenge.id, e.target.checked)}
                >
                  <VStack align="start" spacing={0} ml={2}>
                    <Text
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      color="var(--cg-text)"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="0.04em"
                    >
                      {challenge.label}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="var(--cg-muted)"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      lineHeight="1.55"
                    >
                      {challenge.description}
                    </Text>
                  </VStack>
                </Checkbox>
              </Flex>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter
          borderTopWidth="1px"
          borderColor="rgba(79, 79, 79, 0.28)"
          pt={4}
          bg="rgba(236, 232, 223, 0.62)"
        >
          <Button
            mr={3}
            onClick={onClose}
            bg="var(--cg-window-face)"
            color="var(--cg-text)"
            {...RETRO_ACTION_BUTTON_PROPS}
            fontSize="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedChallenges)}
            isDisabled={!isValid}
            bg="var(--cg-window-face)"
            color="#0a3ca6"
            {...RETRO_ACTION_BUTTON_PROPS}
            _disabled={{
              opacity: 0.4,
              cursor: 'not-allowed',
              boxShadow: 'none',
              _hover: { bg: 'var(--cg-window-face)' },
            }}
            fontSize="sm"
          >
            Start Challenge
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChallengeModal;
