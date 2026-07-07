/**
 * LearningWaveOverlay.jsx — Slide-in teaching overlay shown between TD waves.
 *
 * Displays learn-node content (text + code examples) in a cyberpunk panel
 * that slides in from the right. Player dismisses with "Got it" to proceed
 * to the next wave.
 *
 * Visual style matches TutorialPopup cyberpunk aesthetic.
 */

import { Box, Button, Code, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { FiBookOpen, FiChevronRight } from 'react-icons/fi';

const MotionBox = motion(Box);

/* ── Animations ─────────────────────────────────────────────────── */

const scanLine = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 0.6; }
  100% { transform: translateX(100%); opacity: 0; }
`;

/* ── Section renderers ─────────────────────────────────────────── */

function TextSection({ section }) {
  return (
    <VStack align="start" spacing={2} w="100%">
      {section.title && (
        <Text
          color="#00FFFF"
          fontSize="sm"
          fontWeight="bold"
          fontFamily="mono"
          letterSpacing="wide"
          textTransform="uppercase"
        >
          {section.title}
        </Text>
      )}
      {section.paragraphs?.map((p, i) => (
        <Text key={i} color="gray.200" fontSize="sm" lineHeight="1.6">
          {p}
        </Text>
      ))}
      {section.bullets?.length > 0 && (
        <VStack align="start" spacing={1} pl={3} w="100%">
          {section.bullets.map((b, i) => (
            <HStack key={i} spacing={2} align="start">
              <Box w="4px" h="4px" borderRadius="full" bg="#00FF8C" mt="8px" flexShrink={0} />
              <Text color="gray.300" fontSize="xs" lineHeight="1.5">
                {b}
              </Text>
            </HStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

function ExampleSection({ section }) {
  return (
    <VStack align="start" spacing={2} w="100%">
      {section.title && (
        <Text
          color="#FFD700"
          fontSize="sm"
          fontWeight="bold"
          fontFamily="mono"
          letterSpacing="wide"
        >
          {section.title}
        </Text>
      )}
      {section.code && (
        <Box
          w="100%"
          bg="#0a0c10"
          border="1px solid #1d1f24"
          borderRadius="md"
          px={3}
          py={2}
          position="relative"
          overflow="hidden"
        >
          {/* Scan line decoration */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            height="1px"
            animation={`${scanLine} 3s ease-in-out infinite`}
            bg="linear-gradient(90deg, transparent, #00FFFF, transparent)"
          />
          <Code
            display="block"
            whiteSpace="pre-wrap"
            bg="transparent"
            color="#00FF8C"
            fontSize="xs"
            fontFamily="'Fira Code', 'Cascadia Code', monospace"
            lineHeight="1.7"
          >
            {section.code}
          </Code>
        </Box>
      )}
      {section.note && (
        <Text color="gray.400" fontSize="xs" fontStyle="italic">
          {section.note}
        </Text>
      )}
    </VStack>
  );
}

/* ── Main overlay ──────────────────────────────────────────────── */

export default function LearningWaveOverlay({ overlay, onDismiss }) {
  if (!overlay) return null;

  const { sections, shownSoFar = 0, total = 0 } = overlay;
  const progress = total > 0 ? Math.round(((shownSoFar + sections.length) / total) * 100) : 0;

  return (
    <AnimatePresence>
      {overlay && (
        <>
          {/* Backdrop */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            position="fixed"
            inset="0"
            bg="blackAlpha.600"
            zIndex={1500}
            onClick={onDismiss}
          />

          {/* Slide-in panel */}
          <MotionBox
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            position="fixed"
            top="50%"
            right="16px"
            transform="translateY(-50%)"
            w={{ base: '90vw', md: '380px' }}
            maxH="80vh"
            overflowY="auto"
            bg="rgba(8, 10, 16, 0.97)"
            border="1px solid"
            borderColor="#00FFFF33"
            borderRadius="lg"
            boxShadow="0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 60px rgba(0, 255, 255, 0.03)"
            zIndex={1501}
            sx={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bg: '#00FFFF33', borderRadius: '2px' },
            }}
          >
            {/* Header bar */}
            <Flex
              align="center"
              justify="space-between"
              px={4}
              py={3}
              borderBottom="1px solid #1d1f24"
              position="sticky"
              top="0"
              bg="rgba(8, 10, 16, 0.98)"
              zIndex={1}
            >
              <HStack spacing={2}>
                <Box as={FiBookOpen} color="#00FFFF" boxSize={4} />
                <Text
                  color="#00FFFF"
                  fontSize="xs"
                  fontFamily="mono"
                  fontWeight="bold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  Intel Briefing
                </Text>
              </HStack>
              {total > 0 && (
                <Text color="gray.500" fontSize="10px" fontFamily="mono">
                  {progress}% loaded
                </Text>
              )}
            </Flex>

            {/* Progress bar */}
            {total > 0 && (
              <Box px={4} pt={2}>
                <Box h="2px" bg="#1d1f24" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${progress}%`}
                    bg="linear-gradient(90deg, #00FFFF, #00FF8C)"
                    transition="width 0.5s ease"
                    borderRadius="full"
                    boxShadow="0 0 6px #00FFFF"
                  />
                </Box>
              </Box>
            )}

            {/* Content sections */}
            <VStack align="start" spacing={4} px={4} py={4}>
              {sections.map((section) => {
                if (section.type === 'example') {
                  return <ExampleSection key={section.id} section={section} />;
                }
                return <TextSection key={section.id} section={section} />;
              })}
            </VStack>

            {/* Dismiss button */}
            <Box px={4} pb={4} position="sticky" bottom="0" bg="rgba(8, 10, 16, 0.98)">
              <Button
                w="100%"
                size="sm"
                bg="#00FF8C15"
                color="#00FF8C"
                border="1px solid #00FF8C44"
                borderRadius="md"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="wider"
                textTransform="uppercase"
                rightIcon={<FiChevronRight />}
                onClick={onDismiss}
                _hover={{
                  bg: '#00FF8C25',
                  borderColor: '#00FF8C88',
                  boxShadow: '0 0 12px rgba(0, 255, 140, 0.2)',
                }}
              >
                Got it — Start Wave
              </Button>
            </Box>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
}
