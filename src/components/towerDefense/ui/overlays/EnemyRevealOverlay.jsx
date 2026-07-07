/**
 * EnemyRevealOverlay.jsx — Retro desktop threat dossier overlay.
 *
 * Shown between waves when a new enemy type appears for the first time.
 * Displays the enemy's codename, stats, special ability, and tactical advice.
 * Blocks game interaction (full-screen backdrop) until dismissed.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Divider,
  useBreakpointValue,
} from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { drawEnemy } from '../../../../game-engine-v2/renderer/enemies';

const RETRO_WINDOW_BG = 'linear-gradient(180deg, #ece8df 0%, #d5d0c8 100%)';
const RETRO_WINDOW_BORDER = '1px solid var(--cg-window-shadow)';
const RETRO_WINDOW_OUTSET = 'var(--cg-window-outset)';
const RETRO_WINDOW_INSET = 'var(--cg-window-inset)';
const RETRO_TITLEBAR_BG = 'linear-gradient(90deg, #0a3ca6 0%, #4b73d1 100%)';

const threatToColor = {
  Low: '#00ff8c',
  'Low-Med': '#88ff00',
  Medium: '#ffcc00',
  High: '#ff8800',
  'Very High': '#ff3366',
  Unknown: '#888888',
};

// ── Stat pill ─────────────────────────────────────────────────────────

function StatPill({ label, value, color = '#00ccff' }) {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.56)"
      border={RETRO_WINDOW_BORDER}
      borderRadius="0"
      boxShadow={RETRO_WINDOW_INSET}
      px={3}
      py={1}
      textAlign="center"
      minW="72px"
    >
      <Text
        fontSize="10px"
        color="var(--cg-muted)"
        textTransform="uppercase"
        letterSpacing="0.08em"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
      >
        {label}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="bold"
        color={color}
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
      >
        {value}
      </Text>
    </Box>
  );
}

// ── Single enemy card ─────────────────────────────────────────────────

function EnemyVisualPreview({ enemy, frameSize = 36, canvasSize = 34 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let rafId = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const baseSize = Math.max(14, Math.min(22, Number(enemy.size) || 16));

    const render = (timestamp) => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const renderer = {
        ctx,
        glowPhase: timestamp * 0.002,
        settings: { glowEffects: true },
      };

      drawEnemy(
        renderer,
        {
          id: `overlay-preview-${enemy.type}`,
          isActive: true,
          x: width / 2,
          y: height / 2,
          type: enemy.type,
          health: Number(enemy.health) || 1,
          maxHealth: Number(enemy.health) || 1,
          size: baseSize,
          color: enemy.color,
          isHit: Math.sin(timestamp * 0.01) > 0.94,
          isSlowed: false,
          isFrozen: false,
          isBoss: enemy.type === 'spaceComplex',
          hijackedTowerId:
            enemy.type === 'hijacker' && Math.sin(timestamp * 0.003) > 0.3 ? 'overlay-tower' : null,
          headingAngle: -Math.PI / 10,
          spawnTime: timestamp,
        },
        'normal'
      );

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [enemy.color, enemy.health, enemy.size, enemy.type]);

  return (
    <Box
      w={`${frameSize}px`}
      h={`${frameSize}px`}
      borderRadius="0"
      bg="rgba(255, 255, 255, 0.52)"
      border={RETRO_WINDOW_BORDER}
      boxShadow={RETRO_WINDOW_INSET}
      display="grid"
      placeItems="center"
      flexShrink={0}
    >
      <canvas ref={canvasRef} width={canvasSize} height={canvasSize} style={{ display: 'block' }} />
    </Box>
  );
}

function EnemyCard({ enemy }) {
  const threatColor = threatToColor[enemy.threat] || '#888';

  return (
    <Box
      bg="rgba(255, 255, 255, 0.52)"
      border={RETRO_WINDOW_BORDER}
      borderRadius="0"
      boxShadow={RETRO_WINDOW_OUTSET}
      p={4}
      position="relative"
      overflow="hidden"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <HStack spacing={3}>
          <EnemyVisualPreview enemy={enemy} />
          <Box>
            <Text
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize="md"
              fontWeight="bold"
              color={enemy.color}
              lineHeight={1.2}
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              {enemy.codename}
            </Text>
            <Text
              fontSize="xs"
              color="var(--cg-muted)"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            >
              type: {enemy.type}
            </Text>
          </Box>
        </HStack>

        <Badge
          bg="rgba(255, 255, 255, 0.58)"
          color={threatColor}
          border={RETRO_WINDOW_BORDER}
          boxShadow={RETRO_WINDOW_INSET}
          px={2}
          py={0.5}
          borderRadius="0"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="10px"
          textTransform="uppercase"
        >
          {enemy.threat} Threat
        </Badge>
      </Flex>

      {/* Description */}
      <Text
        fontSize="sm"
        color="var(--cg-text)"
        mb={3}
        lineHeight={1.55}
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
      >
        {enemy.description}
      </Text>

      {/* Stats */}
      <HStack spacing={2} mb={3} flexWrap="wrap">
        <StatPill label="HP" value={enemy.health} color={enemy.color} />
        <StatPill
          label="Speed"
          value={enemy.speed > 0.002 ? 'Fast' : enemy.speed > 0.001 ? 'Med' : 'Slow'}
          color={enemy.color}
        />
        <StatPill label="Reward" value={`${enemy.reward}₿`} color="#00ff8c" />
      </HStack>

      {/* Special ability callout */}
      {enemy.special && (
        <Box
          bg="rgba(246, 213, 213, 0.68)"
          border="1px solid #b86a6a"
          borderRadius="0"
          boxShadow={RETRO_WINDOW_INSET}
          p={2}
          mb={3}
        >
          <HStack spacing={1} mb={1}>
            <WarningTwoIcon color="#7d1d1d" boxSize={3} />
            <Text
              fontSize="xs"
              color="#7d1d1d"
              fontWeight="bold"
              textTransform="uppercase"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            >
              Special Trait
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            color="var(--cg-text)"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          >
            {enemy.special.ignoreSlow && 'Ignores slow and freeze effects. '}
            {enemy.special.kind === 'tower-hijack' &&
              `Hijacks nearest tower within ${enemy.special.hijackRange} range. `}
            {enemy.special.kind === 'aura-buffer' &&
              `Buffs nearby enemies: +${Math.round((enemy.special.speedMultiplier - 1) * 100)}% speed, ${Math.round((1 - enemy.special.damageTakenMultiplier) * 100)}% damage reduction within ${enemy.special.buffRadius} range. `}
            {enemy.special.kind === 'path-shaper' &&
              `Shortens path by ${Math.round(enemy.special.shortenPercent * 100)}% if it reaches the end. `}
          </Text>
        </Box>
      )}

      {/* Tactical advice */}
      {enemy.tactic && (
        <Box
          bg="rgba(223, 231, 245, 0.78)"
          border="1px solid #7e9ab8"
          borderRadius="0"
          boxShadow={RETRO_WINDOW_INSET}
          p={2}
        >
          <Text
            fontSize="xs"
            color="#0a3ca6"
            fontWeight="bold"
            textTransform="uppercase"
            mb={1}
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          >
            Counterplay
          </Text>
          <Text
            fontSize="xs"
            color="var(--cg-text)"
            lineHeight={1.45}
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          >
            {enemy.tactic}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function MobileEnemyRevealOverlay({ reveal, onDismiss }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [reveal?.waveNumber, reveal?.playerLevel, reveal?.enemies]);

  if (!reveal) return null;

  const { waveNumber, enemies, playerLevel } = reveal;
  const totalEnemies = enemies.length;
  const currentEnemy = enemies[Math.min(activeIndex, totalEnemies - 1)];
  const threatColor = threatToColor[currentEnemy?.threat] || currentEnemy?.color || '#ff3366';
  const isLastEnemy = activeIndex >= totalEnemies - 1;

  return (
    <>
      <motion.div
        key="enemy-reveal-mobile-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(23, 26, 34, 0.58)',
          backdropFilter: 'blur(2px)',
          zIndex: 1400,
        }}
      />

      <motion.div
        key="enemy-reveal-mobile-sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 290 }}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1401,
          padding: '0 12px calc(env(safe-area-inset-bottom) + 12px)',
        }}
      >
        <Box
          bg={RETRO_WINDOW_BG}
          border={RETRO_WINDOW_BORDER}
          borderRadius="0"
          boxShadow={`${RETRO_WINDOW_OUTSET}, 0 -14px 24px rgba(0, 0, 0, 0.18)`}
          overflow="hidden"
        >
          <Box px={4} pt={0} pb={2}>
            <Box bg={RETRO_TITLEBAR_BG} mx={-4} px={4} py={3} mb={3}>
              <Text
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="white"
              >
                enemy.dossier
              </Text>
            </Box>

            <Flex align="center" justify="space-between" gap={3} mb={3}>
              <Box>
                <HStack spacing={2} mb={1}>
                  <WarningTwoIcon color="#7d1d1d" boxSize={4} />
                  <Text
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="xs"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="#7d1d1d"
                  >
                    New Enemy Dossier
                  </Text>
                </HStack>
                <Text
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="lg"
                  fontWeight="bold"
                  color="var(--cg-text)"
                  lineHeight={1.15}
                  textTransform="uppercase"
                >
                  {currentEnemy?.codename || 'Enemy Unlocked'}
                </Text>
                <Text
                  fontSize="xs"
                  color="var(--cg-muted)"
                  mt={1}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  Wave {waveNumber}
                  {Number.isFinite(Number(playerLevel)) ? ` · Level ${playerLevel}` : ''}
                </Text>
              </Box>

              <Badge
                bg="rgba(255, 255, 255, 0.58)"
                color={threatColor}
                border={RETRO_WINDOW_BORDER}
                boxShadow={RETRO_WINDOW_INSET}
                borderRadius="0"
                px={3}
                py={1}
                fontSize="10px"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                textTransform="uppercase"
                flexShrink={0}
              >
                {activeIndex + 1} / {totalEnemies}
              </Badge>
            </Flex>

            <Flex
              align="center"
              justify="space-between"
              gap={3}
              p={3}
              mb={3}
              borderRadius="0"
              bg="rgba(255, 255, 255, 0.38)"
              border={RETRO_WINDOW_BORDER}
              boxShadow={RETRO_WINDOW_INSET}
            >
              <HStack spacing={3} align="center">
                {currentEnemy ? (
                  <EnemyVisualPreview enemy={currentEnemy} frameSize={56} canvasSize={52} />
                ) : null}
                <Box>
                  <Text
                    color="var(--cg-text)"
                    fontSize="sm"
                    fontWeight="700"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    textTransform="uppercase"
                  >
                    {currentEnemy?.type}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="var(--cg-muted)"
                    mt={1}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    {currentEnemy?.description}
                  </Text>
                </Box>
              </HStack>
            </Flex>

            <HStack spacing={2} mb={3} align="stretch">
              <StatPill label="HP" value={currentEnemy?.health} color={currentEnemy?.color} />
              <StatPill
                label="Speed"
                value={
                  currentEnemy?.speed > 0.002
                    ? 'Fast'
                    : currentEnemy?.speed > 0.001
                      ? 'Med'
                      : 'Slow'
                }
                color={currentEnemy?.color}
              />
              <StatPill label="Reward" value={`${currentEnemy?.reward || 0}₿`} color="#00ff8c" />
            </HStack>

            {currentEnemy?.special ? (
              <Box
                mb={3}
                p={3}
                borderRadius="0"
                bg="rgba(246, 213, 213, 0.68)"
                border="1px solid #b86a6a"
                boxShadow={RETRO_WINDOW_INSET}
              >
                <Text
                  fontSize="10px"
                  color="#7d1d1d"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  mb={1}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  Special Trait
                </Text>
                <Text
                  fontSize="xs"
                  color="var(--cg-text)"
                  lineHeight={1.45}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  {currentEnemy.special.ignoreSlow && 'Ignores slow and freeze effects. '}
                  {currentEnemy.special.kind === 'tower-hijack' &&
                    `Hijacks the nearest tower within ${currentEnemy.special.hijackRange} range. `}
                  {currentEnemy.special.kind === 'aura-buffer' &&
                    `Empowers nearby enemies with extra speed and defense inside ${currentEnemy.special.buffRadius} range. `}
                  {currentEnemy.special.kind === 'path-shaper' &&
                    `Shortens the path by ${Math.round(currentEnemy.special.shortenPercent * 100)}% if it leaks through. `}
                </Text>
              </Box>
            ) : null}

            {currentEnemy?.tactic ? (
              <Box
                mb={3}
                p={3}
                borderRadius="0"
                bg="rgba(223, 231, 245, 0.78)"
                border="1px solid #7e9ab8"
                boxShadow={RETRO_WINDOW_INSET}
              >
                <Text
                  fontSize="10px"
                  color="#0a3ca6"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  mb={1}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  Counterplay
                </Text>
                <Text
                  fontSize="xs"
                  color="var(--cg-text)"
                  lineHeight={1.45}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  {currentEnemy.tactic}
                </Text>
              </Box>
            ) : null}

            <Flex gap={2}>
              {totalEnemies > 1 ? (
                <Button
                  onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
                  isDisabled={activeIndex === 0}
                  flex={1}
                  bg="var(--cg-window-face)"
                  color="var(--cg-text)"
                  border={RETRO_WINDOW_BORDER}
                  borderRadius="0"
                  boxShadow={RETRO_WINDOW_OUTSET}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  _hover={{ bg: 'var(--cg-window-face-strong)' }}
                  _disabled={{ opacity: 0.45, cursor: 'not-allowed', boxShadow: 'none' }}
                >
                  Previous
                </Button>
              ) : null}

              <Button
                onClick={() => {
                  if (isLastEnemy) {
                    onDismiss?.();
                    return;
                  }
                  setActiveIndex((current) => Math.min(totalEnemies - 1, current + 1));
                }}
                flex={totalEnemies > 1 ? 1.3 : 1}
                bg="var(--cg-window-face)"
                color="#0a3ca6"
                border={RETRO_WINDOW_BORDER}
                borderRadius="0"
                boxShadow={RETRO_WINDOW_OUTSET}
                _hover={{
                  bg: 'var(--cg-window-face-strong)',
                }}
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              >
                {isLastEnemy ? 'Launch Wave' : 'Next Threat'}
              </Button>
            </Flex>
          </Box>
        </Box>
      </motion.div>
    </>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────

export default function EnemyRevealOverlay({ reveal, onDismiss, preferMobileLayout = false }) {
  const navOffset = '50px';
  const isBreakpointMobileOverlay = useBreakpointValue({ base: true, lg: false }) ?? false;
  const isMobileOverlay = preferMobileLayout || isBreakpointMobileOverlay;
  const footerOffset =
    useBreakpointValue({ base: 'calc(56px + env(safe-area-inset-bottom))', lg: '60px' }) || '60px';
  const overlayTop = isMobileOverlay ? '0px' : navOffset;
  const overlayBottom = isMobileOverlay ? '0px' : footerOffset;

  if (!reveal) return null;

  const { waveNumber, enemies, playerLevel } = reveal;
  const multiple = enemies.length > 1;

  return (
    <AnimatePresence>
      {reveal &&
        (isMobileOverlay ? (
          <MobileEnemyRevealOverlay reveal={reveal} onDismiss={onDismiss} />
        ) : (
          <>
            {/* Backdrop */}
            <motion.div
              key="enemy-reveal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed',
                top: overlayTop,
                right: 0,
                bottom: overlayBottom,
                left: 0,
                background: 'rgba(23, 26, 34, 0.58)',
                zIndex: 1400,
              }}
              onClick={onDismiss}
            />

            {/* Panel */}
            <motion.div
              key="enemy-reveal-panel"
              initial={isMobileOverlay ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
              animate={isMobileOverlay ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
              exit={isMobileOverlay ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: overlayTop,
                right: isMobileOverlay ? 'auto' : 0,
                left: isMobileOverlay ? 0 : 'auto',
                bottom: overlayBottom,
                width: isMobileOverlay ? '100vw' : 'min(420px, 92vw)',
                zIndex: 1401,
                overflowY: 'auto',
              }}
            >
              <Box
                h={isMobileOverlay ? '100dvh' : '100%'}
                bg={RETRO_WINDOW_BG}
                borderLeft={isMobileOverlay ? 'none' : RETRO_WINDOW_BORDER}
                borderTop={isMobileOverlay ? RETRO_WINDOW_BORDER : 'none'}
                borderRadius={isMobileOverlay ? 0 : undefined}
                px={isMobileOverlay ? 4 : 5}
                pt={isMobileOverlay ? 'calc(env(safe-area-inset-top) + 14px)' : 0}
                pb={isMobileOverlay ? 'calc(env(safe-area-inset-bottom) + 14px)' : 6}
                display="flex"
                flexDirection="column"
              >
                {/* Header */}
                <Box bg={RETRO_TITLEBAR_BG} mx={isMobileOverlay ? -4 : -5} px={4} py={3} mb={4}>
                  <HStack spacing={2}>
                    <WarningTwoIcon color="white" boxSize={4} />
                    <Text
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      fontSize="xs"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="white"
                      fontWeight="700"
                    >
                      Enemy Dossier
                    </Text>
                  </HStack>
                </Box>

                <Text
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="lg"
                  fontWeight="bold"
                  color="var(--cg-text)"
                  mb={1}
                  textTransform="uppercase"
                >
                  {multiple ? `${enemies.length} Dossiers Updated` : 'Threat Dossier Updated'}
                </Text>

                <Text
                  fontSize="sm"
                  color="var(--cg-muted)"
                  mb={4}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  lineHeight="1.6"
                >
                  {Number.isFinite(Number(playerLevel))
                    ? `Level ${playerLevel} access granted. `
                    : ''}
                  Wave {waveNumber} can now deploy{' '}
                  {multiple ? 'new enemy classes' : 'a new enemy class'}. Review the dossier
                  {multiple ? 's' : ''} before you resume the round.
                </Text>

                <Divider borderColor="rgba(79, 79, 79, 0.26)" mb={4} />

                {/* Enemy cards */}
                <VStack spacing={4} flex={1} overflowY="auto" pb={4}>
                  {enemies.map((enemy) => (
                    <EnemyCard key={enemy.type} enemy={enemy} />
                  ))}
                </VStack>

                {/* Dismiss */}
                <Button
                  onClick={onDismiss}
                  bg="var(--cg-window-face)"
                  color="#0a3ca6"
                  border={RETRO_WINDOW_BORDER}
                  borderRadius="0"
                  boxShadow={RETRO_WINDOW_OUTSET}
                  _hover={{
                    bg: 'var(--cg-window-face-strong)',
                  }}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  size="md"
                  w="100%"
                  mt={3}
                  flexShrink={0}
                >
                  {multiple ? 'Acknowledge and Launch' : 'Acknowledge and Launch'}
                </Button>
              </Box>
            </motion.div>
          </>
        ))}
    </AnimatePresence>
  );
}
