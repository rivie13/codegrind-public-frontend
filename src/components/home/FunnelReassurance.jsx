import { Box, Button, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const WINDOW_OUTSET = 'inset 1px 1px 0 var(--home-retro-border-light), inset 2px 2px 0 var(--home-retro-border-lighter), inset -1px -1px 0 var(--home-retro-border-dark), inset -2px -2px 0 var(--home-retro-border-mid)';

export default function FunnelReassurance({ reassurance, onContinue }) {
  if (!reassurance) return null;
  return (
    <Box width="100%" maxW="720px" mx="auto" bg="var(--home-retro-surface)" boxShadow={WINDOW_OUTSET} overflow="hidden">
      <Box px={4} py={2.5} bg="linear-gradient(90deg, var(--home-retro-title-start) 0%, var(--home-retro-title-end) 100%)">
        <Text color="white" fontFamily="var(--cg-font-retro-display)" fontSize="xs" fontWeight="700" textTransform="uppercase">
          Your answer: {reassurance.value}
        </Text>
      </Box>
      <Box p={{ base: 5, md: 6 }} bg="var(--home-retro-surface-strong)">
        <VStack spacing={4} textAlign="center">
          <Text color="var(--home-retro-text)" fontFamily="var(--cg-font-retro-terminal)" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.7">
            {reassurance.text}
          </Text>
          <Button
            onClick={onContinue}
            size="lg"
            bg="var(--home-retro-surface)"
            color="var(--home-retro-text)"
            borderRadius="0"
            boxShadow={WINDOW_OUTSET}
            fontFamily="var(--cg-font-retro-display)"
            _hover={{ bg: 'var(--home-retro-surface-shell)' }}
          >
            Continue
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
