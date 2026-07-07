/**
 * GuestSignupWall.jsx — Modal shown when a guest exhausts their free trial access.
 *
 * Displays the guest's accomplishments and strongly encourages signup.
 * Takes the funnel approach: "Look what you've done — save it by signing up!"
 *
 * Two views:
 *   1. "wall" — stats + CTA  (default)
 *   2. "signup" — inline AuthForms so the user never leaves the page
 *
 * The modal is closeable, but first shows a warning that content will be locked.
 */

import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiAward,
  FiCode,
  FiShield,
  FiTarget,
  FiZap,
} from 'react-icons/fi';
import AuthForms from '../auth/AuthForms';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';
import { fetchWithError } from '../../services/api/fetcher';

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";
const RETRO_PANEL_PROPS = {
  bg: '#efebe7',
  border: '2px solid #5d636e',
  borderRadius: '0',
  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)',
};
const RETRO_PRIMARY_BUTTON_PROPS = {
  bg: '#d4d0c8',
  color: '#0f6f17',
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: UI_FONT_FAMILY,
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  _hover: {
    bg: '#efebe7',
    color: '#0f6f17',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
};
const RETRO_GHOST_BUTTON_PROPS = {
  bg: '#d4d0c8',
  color: '#0a2c9a',
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: UI_FONT_FAMILY,
  _hover: {
    bg: '#efebe7',
    color: '#0a2c9a',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
};

function StatBadge({ icon, label, value, color }) {
  return (
    <HStack
      bg="#efebe7"
      border="1px solid #7f7f7f"
      borderRadius="0"
      boxShadow="var(--cg-window-inset)"
      px={3}
      py={2}
      spacing={2}
    >
      <Box as={icon} color={color} boxSize={4} />
      <VStack spacing={0} align="start">
        <Text
          color={color}
          fontSize="lg"
          fontWeight="700"
          fontFamily={UI_FONT_FAMILY}
          lineHeight={1}
        >
          {value}
        </Text>
        <Text
          color="#4a5160"
          fontSize="10px"
          textTransform="uppercase"
          letterSpacing="0.08em"
          fontFamily={UI_FONT_FAMILY}
        >
          {label}
        </Text>
      </VStack>
    </HStack>
  );
}

export default function GuestSignupWall({ isOpen, onClose, activitySummary, trialTrack = null }) {
  const { signupWallShown, signupWallConverted } = useGuestFunnel();
  const wasOpenRef = useRef(false);

  // "wall" | "signup" | "confirmClose"
  const [view, setView] = useState('wall');
  const [persistedDataPacketsEarned, setPersistedDataPacketsEarned] = useState(null);

  const inferredTrack =
    trialTrack ||
    (Number(activitySummary?.learningTrialSolvedCount || 0) > 0
      ? 'beginner'
      : Number(activitySummary?.clusterTrialSolvedCount || 0) > 0
        ? 'pro'
        : null);

  const isBeginnerTrial = inferredTrack === 'beginner';
  const earnedTransferPackets =
    Number.isFinite(persistedDataPacketsEarned) && persistedDataPacketsEarned >= 0
      ? persistedDataPacketsEarned
      : 0;
  const signupBonusPackets = 200;
  const totalStartingPackets = earnedTransferPackets + signupBonusPackets;
  const wallTitle = isBeginnerTrial ? 'Free Module 0 Complete' : 'Free Trial Complete';
  const wallDescription = isBeginnerTrial
    ? "You've completed the free Beginner Module 0 for your selected language. Sign up to unlock every module and every language."
    : "You've used your 3 free pro-cluster problem attempts. Sign up to continue with unlimited access.";
  const leaderboardCarryoverCopy = isBeginnerTrial
    ? 'Create your account now and your guest XP, progress, and qualifying scores from this session will carry over to your account and onto eligible leaderboards.'
    : 'Create your account now and the guest XP and scores you earned in this session will carry over to your account and onto eligible leaderboards.';

  // Reset view whenever the modal opens
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setView('wall');
      signupWallShown();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, signupWallShown]);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    (async () => {
      try {
        const serverProgress = await fetchWithError('/api/guest/progress', { method: 'GET' });
        const serverDataPacketsEarned = Number(serverProgress?.dataPacketsEarned);
        if (
          isCancelled ||
          !Number.isFinite(serverDataPacketsEarned) ||
          serverDataPacketsEarned < 0
        ) {
          return;
        }
        setPersistedDataPacketsEarned(Math.floor(serverDataPacketsEarned));
      } catch {
        // Best effort only; the wall falls back to zero until guest progress can be read.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  const handleSignup = useCallback(() => {
    signupWallConverted();
    setView('signup');
  }, [signupWallConverted]);

  const handleRequestClose = useCallback(() => {
    if (view === 'confirmClose') {
      // User already saw the warning — actually close
      onClose?.();
    } else {
      setView('confirmClose');
    }
  }, [view, onClose]);

  const handleBackToWall = useCallback(() => setView('wall'), []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={view === 'confirmClose'}
      size={view === 'signup' ? 'lg' : 'md'}
    >
      <ModalOverlay bg="rgba(9, 18, 34, 0.32)" backdropFilter="blur(2px)" />
      <ModalContent
        className="cg-panel-window"
        bg="#d4d0c8"
        borderRadius="0"
        color="#1f2430"
        overflow="hidden"
        mx={4}
      >
        <Box className="cg-titlebar" px={4} py={2} position="relative">
          <Text
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
            fontFamily={UI_FONT_FAMILY}
          >
            guest_trial_resume.exe
          </Text>
        </Box>
        <ModalCloseButton
          top={0}
          right={1}
          color="#f5f7ff"
          borderRadius="0"
          _hover={{ bg: 'rgba(255,255,255,0.18)', color: '#ffffff' }}
          _active={{ bg: 'rgba(0,0,0,0.18)' }}
        />
        <ModalBody p={6} bg="#d4d0c8">
          {/* ── View: Wall (default) ── */}
          {view === 'wall' && (
            <VStack spacing={5} align="center">
              <Box as={FiShield} color="#0a2c9a" boxSize={10} />
              <VStack spacing={1}>
                <Text
                  color="#0a2c9a"
                  fontSize="lg"
                  fontFamily={UI_FONT_FAMILY}
                  fontWeight="700"
                  textAlign="center"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  {wallTitle}
                </Text>
                <Text color="#1f2430" fontSize="sm" textAlign="center" fontFamily={UI_FONT_FAMILY}>
                  {wallDescription}
                </Text>
              </VStack>

              {/* Stats grid */}
              {activitySummary && (
                <Flex wrap="wrap" gap={2} justify="center">
                  {activitySummary.problemsAttemptedCount > 0 && (
                    <StatBadge
                      icon={FiCode}
                      label="Problems"
                      value={activitySummary.problemsAttemptedCount}
                      color="#0f6f17"
                    />
                  )}
                  {activitySummary.tdGamesPlayed > 0 && (
                    <StatBadge
                      icon={FiTarget}
                      label="TD Games"
                      value={activitySummary.tdGamesPlayed}
                      color="#FFD700"
                    />
                  )}
                  {activitySummary.problemsSolvedCount > 0 && (
                    <StatBadge
                      icon={FiZap}
                      label="Solved"
                      value={activitySummary.problemsSolvedCount}
                      color="#00CCFF"
                    />
                  )}
                </Flex>
              )}

              <Box w="100%" {...RETRO_PANEL_PROPS} px={4} py={3}>
                <HStack spacing={3} align="start">
                  <Box as={FiAward} color="#6f5600" boxSize={5} mt={0.5} flexShrink={0} />
                  <VStack spacing={1} align="start">
                    <Text
                      color="#6f5600"
                      fontSize="xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      fontFamily={UI_FONT_FAMILY}
                    >
                      LEADERBOARD CARRYOVER
                    </Text>
                    <Text
                      color="#1f2430"
                      fontSize="sm"
                      lineHeight="tall"
                      fontFamily={UI_FONT_FAMILY}
                    >
                      {leaderboardCarryoverCopy}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <Box w="100%" {...RETRO_PANEL_PROPS} px={4} py={3}>
                <VStack spacing={1} align="start">
                  <Text
                    color="#0a2c9a"
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.08em"
                    fontFamily={UI_FONT_FAMILY}
                  >
                    DATA PACKETS EARNED
                  </Text>
                  <Text color="#1f2430" fontSize="sm" lineHeight="tall" fontFamily={UI_FONT_FAMILY}>
                    You&apos;ll start with a minimum of{' '}
                    <Text as="span" color="#0f6f17" fontWeight="700">
                      +{totalStartingPackets} total Data Packets
                    </Text>{' '}
                    when you sign up:{' '}
                    <Text as="span" color="#0f6f17" fontWeight="700">
                      +{earnedTransferPackets} guest transfer
                    </Text>{' '}
                    and a one-time{' '}
                    <Text as="span" color="#6f5600" fontWeight="700">
                      +{signupBonusPackets} signup bonus
                    </Text>
                    .
                  </Text>
                  <Text color="#3b4250" fontSize="xs" lineHeight="tall" fontFamily={UI_FONT_FAMILY}>
                    Data Packets are used in the store to unlock cosmetics and profile flair after
                    you create your account.
                  </Text>
                </VStack>
              </Box>

              {/* CTA */}
              <Button w="100%" size="lg" {...RETRO_PRIMARY_BUTTON_PROPS} onClick={handleSignup}>
                Sign Up For Free
              </Button>

              <Text color="#4a5160" fontSize="xs" textAlign="center" fontFamily={UI_FONT_FAMILY}>
                All CodeGrind content and future updates will always be free. Free accounts also
                include 25 code executions/day, 15 AI code snippet generations/day and 8 AI
                chats/day.
              </Text>
            </VStack>
          )}

          {/* ── View: Inline signup form ── */}
          {view === 'signup' && (
            <VStack spacing={4} align="stretch">
              <Button
                size="sm"
                {...RETRO_GHOST_BUTTON_PROPS}
                leftIcon={<FiArrowLeft />}
                alignSelf="flex-start"
                onClick={handleBackToWall}
              >
                Back
              </Button>
              <AuthForms defaultIsLogin={false} />
            </VStack>
          )}

          {/* ── View: Close-confirmation warning ── */}
          {view === 'confirmClose' && (
            <VStack spacing={5} align="center" py={2}>
              <Box as={FiAlertTriangle} color="#6f5600" boxSize={10} />
              <VStack spacing={2}>
                <Text
                  color="#6f5600"
                  fontSize="lg"
                  fontFamily={UI_FONT_FAMILY}
                  fontWeight="700"
                  textAlign="center"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Are you sure?
                </Text>
                <Text
                  color="#1f2430"
                  fontSize="sm"
                  textAlign="center"
                  lineHeight="tall"
                  fontFamily={UI_FONT_FAMILY}
                >
                  Leaving without signing up will{' '}
                  <Text as="span" color="#8f1f1f" fontWeight="700">
                    lock you out of all content
                  </Text>
                  . Creating an account is completely free and takes seconds.
                </Text>
              </VStack>

              <VStack spacing={2} w="100%">
                <Button w="100%" size="lg" {...RETRO_PRIMARY_BUTTON_PROPS} onClick={handleSignup}>
                  Sign Up For Free
                </Button>

                <Button
                  w="100%"
                  size="md"
                  {...RETRO_GHOST_BUTTON_PROPS}
                  fontSize="xs"
                  textTransform="uppercase"
                  onClick={() => onClose?.()}
                >
                  Leave anyway
                </Button>
              </VStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
