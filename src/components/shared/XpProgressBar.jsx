/**
 * XpProgressBar — shared component for the animated XP progress bar
 * with dramatic level-up visual FX (shake, flash, glow, celebration card).
 *
 * Designed to be paired with the `useXpLevelUpAnimation` hook which
 * provides all the animation state this component displays.
 */

import { Box, HStack, Progress, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

/* ── keyframes ──────────────────────────────────────────────────────────── */

/** Celebration card pulsing green glow */
const levelUpPulse = keyframes`
  0%   { box-shadow: 0 0 8px rgba(0, 255, 140, 0.3); }
  50%  { box-shadow: 0 0 24px rgba(0, 255, 140, 0.7); }
  100% { box-shadow: 0 0 8px rgba(0, 255, 140, 0.3); }
`;

/** Level text scale pop */
const levelUpEmphasis = keyframes`
  0%   { transform: scale(1);   text-shadow: 0 0 0 transparent; }
  40%  { transform: scale(1.14); text-shadow: 0 0 12px rgba(0,255,140,0.7); }
  100% { transform: scale(1);   text-shadow: 0 0 0 transparent; }
`;

/** Bar container shake on level-up impact */
const barShake = keyframes`
  0%   { transform: translateX(0); }
  15%  { transform: translateX(-3px); }
  30%  { transform: translateX(3px); }
  45%  { transform: translateX(-2px); }
  60%  { transform: translateX(2px); }
  80%  { transform: translateX(-1px); }
  100% { transform: translateX(0); }
`;

/** White flash overlay that fades out */
const barFlash = keyframes`
  0%   { opacity: 1; }
  100% { opacity: 0; }
`;

/** Full-bar glow intensify when bar hits 100 % */
const fullBarGlow = keyframes`
  0%   { box-shadow: 0 0 14px rgba(0, 255, 140, 0.35); }
  50%  { box-shadow: 0 0 28px rgba(0, 255, 140, 0.8), 0 0 40px rgba(0, 212, 255, 0.4); }
  100% { box-shadow: 0 0 14px rgba(0, 255, 140, 0.35); }
`;

const MotionBox = motion(Box);

/**
 * @param {object} props
 * @param {number}  props.animatedXpProgress     — current bar % (animated)
 * @param {string}  props.progressTransition     — CSS transition for the bar
 * @param {boolean} props.barFullGlow            — show pulsing glow at 100 %
 * @param {boolean} props.barFlashActive         — show white flash overlay
 * @param {boolean} props.barShakeActive         — shake the bar wrapper
 * @param {boolean} props.showLevelUpCelebration — show the celebration card
 * @param {boolean} props.levelUpEmphasisActive  — level text emphasis animation
 * @param {number}  props.displayLevel           — level number to show
 * @param {string}  props.displayRoleName        — role name to show
 * @param {object}  props.animatedXpDisplay      — { into, toNext, remaining }
 * @param {number}  props.newLevel               — new level (for celebration text)
 * @param {string}  props.newRoleName            — new role (for celebration text)
 * @param {boolean} props.roleChanged            — show role-change line in celebration
 * @param {number}  props.totalXpGained          — +XP number shown in header
 * @param {boolean} props.prefersReducedMotion   — skip animations
 * @param {string}  props.maxW                   — optional max width (default "520px")
 */
export default function XpProgressBar({
  animatedXpProgress = 0,
  progressTransition = 'width 1.2s ease',
  barFullGlow: barFullGlowActive = false,
  barFlashActive: barFlashOn = false,
  barShakeActive: barShakeOn = false,
  showLevelUpCelebration = false,
  levelUpEmphasisActive = false,
  displayLevel = 1,
  displayRoleName = 'Greenhorn',
  animatedXpDisplay = { into: 0, toNext: 0, remaining: null },
  newLevel,
  newRoleName,
  roleChanged = false,
  totalXpGained = 0,
  prefersReducedMotion = false,
  maxW = '520px',
  theme = 'default',
}) {
  const isRetroDesktopTheme = theme === 'retro-desktop';

  /* ── Dynamic bar styles ── */
  const barGradient = isRetroDesktopTheme
    ? barFullGlowActive
      ? 'linear-gradient(90deg, #0a2c9a 0%, #1084d0 45%, #ffffff 62%, #0f6f17 100%)'
      : 'linear-gradient(90deg, #0a2c9a 0%, #1084d0 55%, #0f6f17 100%)'
    : barFullGlowActive
      ? 'linear-gradient(90deg, #00FF8C 0%, #7DFFCE 40%, #FFFFFF 60%, #00FF8C 100%)'
      : 'linear-gradient(90deg, #00D4FF 0%, #00FF8C 100%)';

  const barShadow = isRetroDesktopTheme
    ? barFullGlowActive
      ? 'inset 1px 1px 0 rgba(255,255,255,0.38), inset -1px -1px 0 rgba(64,64,64,0.34)'
      : 'none'
    : barFullGlowActive
      ? '0 0 28px rgba(0, 255, 140, 0.8), 0 0 48px rgba(0, 212, 255, 0.5)'
      : '0 0 14px rgba(0, 255, 140, 0.35)';

  return (
    <>
      {/* Level label row */}
      <HStack
        justify="space-between"
        p={2}
        bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 0, 0, 0.3)'}
        borderRadius={isRetroDesktopTheme ? '0' : 'md'}
        border={isRetroDesktopTheme ? '2px solid #5d636e' : 'none'}
        boxShadow={
          isRetroDesktopTheme
            ? 'inset 1px 1px 0 rgba(255,255,255,0.68), inset -1px -1px 0 rgba(64,64,64,0.24)'
            : 'none'
        }
      >
        <Text
          color={
            isRetroDesktopTheme
              ? levelUpEmphasisActive
                ? '#0f6f17'
                : '#1f2430'
              : levelUpEmphasisActive
                ? '#00FF8C'
                : 'rgba(255, 255, 255, 0.9)'
          }
          fontSize="sm"
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          fontWeight={levelUpEmphasisActive ? 'bold' : 'normal'}
          animation={
            levelUpEmphasisActive && !prefersReducedMotion ? `${levelUpEmphasis} 1s ease` : 'none'
          }
          transition="color 0.3s ease"
        >
          Level {displayLevel} • {displayRoleName}
        </Text>
        <Text
          color={isRetroDesktopTheme ? '#0f6f17' : '#00ff8c'}
          fontWeight="bold"
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          fontSize="sm"
        >
          +{totalXpGained} XP
        </Text>
      </HStack>

      {/* Level-up celebration card */}
      <AnimatePresence>
        {showLevelUpCelebration && newLevel && (
          <MotionBox
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260, mass: 0.8 }}
            p={3}
            bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 255, 140, 0.12)'}
            borderRadius={isRetroDesktopTheme ? '0' : 'md'}
            border={isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 255, 140, 0.35)'}
            boxShadow={
              isRetroDesktopTheme
                ? 'inset 1px 1px 0 rgba(255,255,255,0.68), inset -1px -1px 0 rgba(64,64,64,0.24)'
                : 'none'
            }
            animation={!prefersReducedMotion ? `${levelUpPulse} 1.8s ease-in-out 2` : 'none'}
          >
            <Text
              color={isRetroDesktopTheme ? '#0f6f17' : '#00ff8c'}
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              fontSize="sm"
              fontWeight="bold"
            >
              LEVEL UP: {newLevel}
            </Text>
            <Text
              color={isRetroDesktopTheme ? '#1f2430' : 'rgba(255,255,255,0.85)'}
              fontFamily={
                isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'
              }
              fontSize="xs"
            >
              You are now level {newLevel}.
            </Text>
            {roleChanged && newRoleName && (
              <Text
                color={isRetroDesktopTheme ? '#0a2c9a' : '#00FFFC'}
                fontFamily={
                  isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'
                }
                fontSize="xs"
                mt={1}
              >
                NEW ROLE UNLOCKED: {newRoleName}
              </Text>
            )}
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Progress bar with shake + flash overlay */}
      <Box maxW={maxW} w="100%">
        <Box
          position="relative"
          animation={barShakeOn && !prefersReducedMotion ? `${barShake} 0.4s ease` : 'none'}
        >
          <Progress
            value={animatedXpProgress}
            size="xs"
            bg={isRetroDesktopTheme ? '#b7b4ac' : 'rgba(0, 0, 0, 0.4)'}
            borderRadius={isRetroDesktopTheme ? '0' : 'full'}
            sx={{
              border: isRetroDesktopTheme ? '1px solid #5d636e' : undefined,
              '& > div': {
                background: barGradient,
                boxShadow: barShadow,
                transition: prefersReducedMotion ? 'none' : progressTransition,
                ...(barFullGlowActive && !prefersReducedMotion
                  ? isRetroDesktopTheme
                    ? {}
                    : { animation: `${fullBarGlow} 0.6s ease-in-out infinite` }
                  : {}),
              },
            }}
          />

          {/* White flash overlay on impact */}
          {barFlashOn && !prefersReducedMotion && (
            <Box
              position="absolute"
              inset={0}
              borderRadius="full"
              bg="white"
              animation={`${barFlash} 0.4s ease-out forwards`}
              pointerEvents="none"
            />
          )}
        </Box>

        <HStack
          justify="space-between"
          mt={2}
          fontSize="xs"
          color={isRetroDesktopTheme ? '#3b4250' : 'rgba(255, 255, 255, 0.8)'}
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
        >
          <Text>
            {animatedXpDisplay.into}/{animatedXpDisplay.toNext} XP
          </Text>
          {animatedXpDisplay.remaining !== null && (
            <Text>{animatedXpDisplay.remaining} XP to next level</Text>
          )}
        </HStack>
      </Box>
    </>
  );
}
