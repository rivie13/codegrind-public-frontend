/**
 * DashboardWelcomeModal.jsx — First-visit onboarding modal for the dashboard.
 *
 * Shows once per user (tracked via localStorage) to introduce the dashboard
 * and highlight the shepherding system (NextObjectiveWidget).
 */

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowRight, FiBookOpen, FiCompass, FiGrid, FiTarget, FiZap } from 'react-icons/fi';

const LS_KEY = 'dashboard_welcome_seen';

function buildStorageKey(userId) {
  return `${LS_KEY}_${String(userId).trim()}`;
}

function hasSeenWelcome(userId) {
  if (!userId) return true;

  try {
    return localStorage.getItem(buildStorageKey(userId)) === 'true';
  } catch {
    // If storage is unavailable, fail safe by not showing repeatedly.
    return true;
  }
}

function markWelcomeSeen(userId) {
  if (!userId) return;

  try {
    localStorage.setItem(buildStorageKey(userId), 'true');
  } catch {
    // Best effort only.
  }
}

const FEATURES = [
  {
    icon: FiCompass,
    color: 'var(--cg-link)',
    title: 'Your Next Objective',
    description:
      "The dashboard always shows your next recommended action — whether it's continuing a lesson, tackling a cluster, or trying a new mode.",
  },
  {
    icon: FiBookOpen,
    color: 'var(--cg-accent-green)',
    title: 'Learning Path Tracking',
    description:
      'See your progress through structured learning paths with lessons, practice problems, and tower defense challenges.',
  },
  {
    icon: FiGrid,
    color: 'var(--cg-accent-red)',
    title: 'Cluster Progress',
    description:
      "Track which problem clusters you've completed and find new ones to sharpen specific skills.",
  },
  {
    icon: FiZap,
    color: 'var(--cg-accent-amber)',
    title: 'Stats & Achievements',
    description: 'View your solve stats, streaks, and unlocked achievements all in one place.',
  },
];

const DashboardWelcomeModal = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 = welcome, 1 = features

  useEffect(() => {
    if (!userId) return;

    if (hasSeenWelcome(userId)) return;

    // Small delay so the dashboard renders first.
    // markWelcomeSeen is called inside the timer so that if the component
    // unmounts before the timer fires (e.g. redirect after registration),
    // the localStorage key is NOT set and the modal will show on next visit.
    const timer = setTimeout(() => {
      markWelcomeSeen(userId);
      setIsOpen(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [userId]);

  const handleDismiss = useCallback(() => {
    markWelcomeSeen(userId);
    setIsOpen(false);
  }, [userId]);

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else {
      handleDismiss();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} isCentered size="lg" motionPreset="none">
      <ModalOverlay bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="var(--cg-window-face)"
        border="2px solid var(--cg-window-shadow)"
        borderRadius="0"
        overflow="hidden"
        boxShadow="var(--cg-window-outset), 18px 18px 0 rgba(0,0,0,0.24)"
        mx={4}
      >
        <Box
          bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
          color="var(--cg-header-text)"
          px={4}
          py={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          borderBottom="1px solid var(--cg-window-shadow)"
        >
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
            dashboard_tour.exe
          </Text>
          <Button
            size="xs"
            minW="28px"
            h="24px"
            onClick={handleDismiss}
            color="var(--cg-header-text)"
          >
            X
          </Button>
        </Box>

        <ModalBody py={8} px={6} bg="rgba(255,255,255,0.14)">
          {step === 0 ? (
            <VStack spacing={5} textAlign="center">
              <HStack spacing={3}>
                <Box as={FiTarget} color="var(--cg-accent-amber)" boxSize={6} />
                <Box as={FiCompass} color="var(--cg-link)" boxSize={8} />
                <Box as={FiZap} color="var(--cg-accent-green)" boxSize={6} />
              </HStack>

              <VStack spacing={2}>
                <Heading size="lg" color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
                  Welcome to Your Dashboard
                </Heading>
                <Text
                  color="var(--cg-muted)"
                  fontSize="sm"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  A guided command center for practice, progress, and review.
                </Text>
              </VStack>

              <Text
                color="var(--cg-text)"
                fontSize="sm"
                lineHeight="1.7"
                maxW="420px"
                fontFamily="var(--cg-font-retro-display)"
              >
                This is your command center. Every time you log in, your dashboard will tell you{' '}
                <Text as="span" color="var(--cg-link)" fontWeight="bold">
                  exactly what to do next
                </Text>{' '}
                — no guesswork needed. You can also track your progress, stats, and achievements all
                in one place. Your code submissions are stored here too, so you can review and learn
                from them whenever you want.
              </Text>

              <Box
                bg="var(--cg-panel-shell)"
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-inset)"
                borderRadius="0"
                p={4}
                w="100%"
              >
                <HStack spacing={3} align="start">
                  <Box as={FiCompass} color="var(--cg-link)" boxSize={5} mt={0.5} flexShrink={0} />
                  <VStack align="start" spacing={1}>
                    <Text
                      color="var(--cg-link)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                      fontWeight="bold"
                      letterSpacing="wider"
                      textTransform="uppercase"
                    >
                      YOUR NEXT OBJECTIVE
                    </Text>
                    <Text color="var(--cg-text)" fontSize="xs" lineHeight="1.5">
                      Look for the big card labeled NEXT OBJECTIVE with a DO THIS NEXT badge at the
                      top of your dashboard — it tracks your progress and always recommends your
                      next step.
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <HStack spacing={3} pt={2} w="100%">
                <Button flex={1} size="sm" variant="ghost" onClick={handleDismiss}>
                  Skip
                </Button>
                <Button
                  flex={2}
                  size="sm"
                  rightIcon={<FiArrowRight />}
                  onClick={handleNext}
                  color="var(--cg-link)"
                >
                  See What&apos;s Here
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack spacing={5}>
              <VStack spacing={1} textAlign="center">
                <Text
                  color="var(--cg-link)"
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                  fontWeight="bold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  DASHBOARD OVERVIEW
                </Text>
                <Heading size="md" color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
                  Everything You Need
                </Heading>
              </VStack>

              <VStack spacing={3} w="100%">
                {FEATURES.map((feature, i) => (
                  <Flex
                    key={i}
                    bg="var(--cg-panel-shell)"
                    border="1px solid var(--cg-window-shadow)"
                    boxShadow="var(--cg-window-inset)"
                    borderRadius="0"
                    p={3}
                    w="100%"
                    align="start"
                    gap={3}
                    _hover={{ bg: 'rgba(255,255,255,0.3)' }}
                    transition="background 0.2s"
                  >
                    <Box
                      as={feature.icon}
                      color={feature.color}
                      boxSize={4}
                      mt={0.5}
                      flexShrink={0}
                    />
                    <VStack align="start" spacing={0.5}>
                      <Text
                        color={feature.color}
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        fontWeight="bold"
                        letterSpacing="wider"
                      >
                        {feature.title.toUpperCase()}
                      </Text>
                      <Text color="var(--cg-text)" fontSize="xs" lineHeight="1.5">
                        {feature.description}
                      </Text>
                    </VStack>
                  </Flex>
                ))}
              </VStack>

              <Button w="100%" size="sm" onClick={handleDismiss} color="var(--cg-link)">
                Got It - Let&apos;s Go
              </Button>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DashboardWelcomeModal;
