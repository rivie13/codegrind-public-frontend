import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';

import {
  getPlayerCharacterPreviewSpriteStyle,
  PLAYER_CHARACTER_PREVIEW_INTERVAL_MS,
  PLAYER_CHARACTER_PRESETS,
} from '../../player-character/playerCharacterPresets';

const WINDOW_OUTSET =
  'inset 1px 1px 0 #ffffff, inset 2px 2px 0 #f3f0ea, inset -1px -1px 0 #636363, inset -2px -2px 0 #8e8e8e';
const WINDOW_INSET =
  'inset 1px 1px 0 #636363, inset 2px 2px 0 #8e8e8e, inset -1px -1px 0 #ffffff, inset -2px -2px 0 #f3f0ea';

function PlayerCharacterPreviewSprite({ preset }) {
  const previewFrameIndices = preset.previewFrameIndices;
  const [currentFrameIndex, setCurrentFrameIndex] = React.useState(previewFrameIndices[0]);

  React.useEffect(() => {
    setCurrentFrameIndex(previewFrameIndices[0]);

    if (previewFrameIndices.length <= 1 || typeof window === 'undefined') {
      return undefined;
    }

    let nextFrameOffset = 0;
    const intervalId = window.setInterval(() => {
      nextFrameOffset = (nextFrameOffset + 1) % previewFrameIndices.length;
      setCurrentFrameIndex(previewFrameIndices[nextFrameOffset]);
    }, PLAYER_CHARACTER_PREVIEW_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [previewFrameIndices]);

  return (
    <Box
      aria-hidden="true"
      data-testid={`player-character-preview-${preset.id}`}
      style={getPlayerCharacterPreviewSpriteStyle(preset, { frameIndex: currentFrameIndex })}
    />
  );
}

export default function PlayerCharacterSelectModal({
  isOpen,
  onClose,
  onConfirm,
  onSelectCharacter,
  selectedPlayerCharacterId = null,
}) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(40, 52, 68, 0.28)" />
      <ModalContent
        bg="#d4d0c8"
        borderRadius="0"
        color="#1f2430"
        overflow="hidden"
        boxShadow="0 0 0 1px #7f7f7f"
      >
        <ModalHeader
          bg="linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%)"
          color="#f5f7ff"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          fontWeight="700"
          letterSpacing="0.08em"
          py={2}
          px={4}
          textTransform="uppercase"
        >
          Select Your City Character
        </ModalHeader>
        <ModalCloseButton
          color="#f5f7ff"
          top={0}
          right={3}
          borderRadius="0"
          _hover={{ bg: 'rgba(255,255,255,0.12)' }}
          _active={{ bg: 'rgba(0,0,0,0.12)' }}
        />
        <ModalBody bg="#d4d0c8" px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
          <VStack align="stretch" spacing={4}>
            <Box bg="#efebe7" border="1px solid #7f7f7f" boxShadow={WINDOW_INSET} p={4}>
              <Text
                color="#0a2c9a"
                fontFamily="var(--cg-font-retro-display)"
                fontSize="sm"
                fontWeight="700"
                letterSpacing="0.06em"
                mb={2}
                textTransform="uppercase"
              >
                Pick your character
              </Text>
              <Text
                color="#1f2430"
                fontFamily="var(--cg-font-retro-terminal)"
                fontSize="sm"
                lineHeight="1.7"
              >
                Your character selection can not be changed, but you can customize your character's
                outfit and hair in the store. Character choice is purely for cosmetic purposes only.
                You choose how you want to look like.
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              {PLAYER_CHARACTER_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPlayerCharacterId;

                return (
                  <Button
                    key={preset.id}
                    h="auto"
                    minH="196px"
                    onClick={() => onSelectCharacter?.(preset.id)}
                    px={4}
                    py={4}
                    borderRadius="0"
                    whiteSpace="normal"
                    textAlign="center"
                    bg={isSelected ? '#c9d7ff' : '#efebe7'}
                    border="1px solid"
                    borderColor={isSelected ? '#0a2c9a' : '#7f7f7f'}
                    boxShadow={isSelected ? WINDOW_INSET : WINDOW_OUTSET}
                    _hover={{ bg: isSelected ? '#d8e2ff' : '#f7f3ee' }}
                    _active={{ boxShadow: WINDOW_INSET, bg: '#d8d3cb' }}
                  >
                    <VStack spacing={3} width="100%">
                      <Box
                        bg={isSelected ? '#d9e4ff' : '#d4d0c8'}
                        border="1px solid #7f7f7f"
                        boxShadow={WINDOW_INSET}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minH="116px"
                        px={3}
                        py={4}
                        width="100%"
                      >
                        <PlayerCharacterPreviewSprite preset={preset} />
                      </Box>
                      <VStack spacing={1} width="100%">
                        <Text
                          color="#1f2430"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="sm"
                          fontWeight="700"
                          letterSpacing="0.06em"
                          textTransform="uppercase"
                        >
                          {preset.label}
                        </Text>
                        <Text
                          color={isSelected ? '#0a2c9a' : '#565e6b'}
                          fontFamily="var(--cg-font-retro-terminal)"
                          fontSize="xs"
                          lineHeight="1.6"
                        >
                          {isSelected ? 'Selected' : 'Not Selected'}
                        </Text>
                      </VStack>
                    </VStack>
                  </Button>
                );
              })}
            </SimpleGrid>
          </VStack>
        </ModalBody>
        <ModalFooter bg="#d4d0c8" borderTop="1px solid #b1aea8" px={5} py={4}>
          <HStack justify="space-between" width="100%" spacing={3}>
            <HStack spacing={3}>
              <Button
                borderRadius="0"
                bg="#efebe7"
                boxShadow={WINDOW_OUTSET}
                color="#1f2430"
                fontFamily="var(--cg-font-retro-display)"
                onClick={onClose}
                px={5}
                textTransform="uppercase"
                _active={{ boxShadow: WINDOW_INSET, transform: 'translate(1px, 1px)' }}
                _hover={{ bg: '#f7f3ee' }}
              >
                Cancel
              </Button>
              <Button
                borderRadius="0"
                bg="#0a2c9a"
                boxShadow={WINDOW_OUTSET}
                color="#f5f7ff"
                fontFamily="var(--cg-font-retro-display)"
                isDisabled={!selectedPlayerCharacterId || isConfirming}
                isLoading={isConfirming}
                onClick={async () => {
                  setIsConfirming(true);
                  try {
                    await onConfirm?.(selectedPlayerCharacterId);
                  } finally {
                    setIsConfirming(false);
                  }
                }}
                px={5}
                textTransform="uppercase"
                _active={{ boxShadow: WINDOW_INSET, transform: 'translate(1px, 1px)' }}
                _disabled={{ bg: '#8c93a7', color: '#e8ebf2', boxShadow: WINDOW_INSET }}
                _hover={{ bg: '#1038bf' }}
              >
                Start Demo
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
