import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const WINDOW_OUTSET = 'inset 1px 1px 0 var(--home-retro-border-light), inset 2px 2px 0 var(--home-retro-border-lighter), inset -1px -1px 0 var(--home-retro-border-dark), inset -2px -2px 0 var(--home-retro-border-mid)';

export default function QualifierFunnel({ question, onAnswer, progress }) {
  if (!question) return null;
  return (
    <Box width="100%" maxW="720px" mx="auto" bg="var(--home-retro-surface)" boxShadow={WINDOW_OUTSET} overflow="hidden">
      <HStack justify="space-between" px={4} py={2.5} bg="linear-gradient(90deg, var(--home-retro-title-start) 0%, var(--home-retro-title-end) 100%)">
        <Text color="white" fontFamily="var(--cg-font-retro-display)" fontSize="xs" fontWeight="700" textTransform="uppercase">
          qualifier.exe
        </Text>
        <Text color="rgba(255,255,255,0.92)" fontFamily="var(--cg-font-retro-display)" fontSize="xs">
          {progress.done + 1} / {progress.total}
        </Text>
      </HStack>
      <Box p={{ base: 5, md: 6 }} bg="var(--home-retro-surface-strong)">
        <Text color="var(--home-retro-text)" fontFamily="var(--cg-font-retro-display)" fontSize={{ base: 'md', md: 'lg' }} fontWeight="700" mb={4} textAlign="center">
          {question.title}
        </Text>
        <VStack spacing={3} align="stretch">
          {question.options.map((opt) => (
            <Button
              key={opt.value}
              onClick={() => onAnswer(opt.value)}
              width="100%"
              minH="44px"
              bg="var(--home-retro-surface)"
              color="var(--home-retro-text)"
              borderRadius="0"
              boxShadow={WINDOW_OUTSET}
              fontFamily="var(--cg-font-retro-display)"
              fontSize="sm"
              whiteSpace="normal"
              textAlign="center"
              lineHeight="1.3"
              py={2}
              _hover={{ bg: 'var(--home-retro-surface-shell)' }}
              _active={{ boxShadow: 'inset 1px 1px 0 var(--home-retro-border-dark), inset 2px 2px 0 var(--home-retro-border-mid)', transform: 'translate(1px,1px)' }}
            >
              {opt.label}
            </Button>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
