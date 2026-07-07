import {
  Box,
  Button,
  HStack,
  Stack,
  Text,
  VStack,
  usePrefersReducedMotion,
  Collapse,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCompactLandscapeShellMode from '../../hooks/useCompactLandscapeShellMode';
import AnimatedLogo from './AnimatedLogo';

const MotionBox = motion(Box);
const WINDOW_OUTSET =
  'inset 1px 1px 0 var(--home-retro-border-light), inset 2px 2px 0 var(--home-retro-border-lighter), inset -1px -1px 0 var(--home-retro-border-dark), inset -2px -2px 0 var(--home-retro-border-mid)';
const WINDOW_INSET =
  'inset 1px 1px 0 var(--home-retro-border-dark), inset 2px 2px 0 var(--home-retro-border-mid), inset -1px -1px 0 var(--home-retro-border-light), inset -2px -2px 0 var(--home-retro-border-lighter)';
const ACTIVE_TITLE_BAR =
  'linear-gradient(90deg, var(--home-retro-title-start) 0%, var(--home-retro-title-end) 100%)';

const HERO_LEAD = 'CodeGrind: The Tower Defense Code Trainer';
const HERO_DESCRIPTION =
  'Write real code to power your defenses. Stop system breaches by solving real Python, JavaScript and Java problems inside a tactical strategy game.';

const HERO_FEATURES = [
  {
    title: 'Choose Your Track',
    text: 'Jump straight into the beginner path to learn the fundamentals, or deploy directly into elite interview prep zones. You choose where you start.',
  },
  {
    title: 'Code to Defend',
    text: 'No passive reading. Deploy function towers and write real, working code to power up and optimize your defensive grid in real time.',
  },
  {
    title: 'Smart AI Assistance',
    text: 'Use integrated AI to assist with your logic, then verify and refine the output to build true software mastery.',
  },
];

const WindowControls = () => (
  <HStack spacing={1}>
    {['_', '□', '×'].map((label) => (
      <Box
        key={label}
        w="18px"
        h="16px"
        bg="var(--home-retro-surface)"
        boxShadow={WINDOW_OUTSET}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          color="var(--home-retro-text)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="10px"
          fontWeight="700"
          lineHeight="1"
        >
          {label}
        </Text>
      </Box>
    ))}
  </HStack>
);

const RetroWindow = ({ title, children, rightLabel = 'online' }) => (
  <Box
    width="100%"
    borderRadius="0"
    overflow="hidden"
    bg="var(--home-retro-surface)"
    boxShadow={WINDOW_OUTSET}
  >
    <HStack
      justify="space-between"
      px={{ base: 3, md: 4 }}
      py={{ base: 2, md: 2.5 }}
      bg={ACTIVE_TITLE_BAR}
    >
      <HStack spacing={3} minW={0}>
        <Text
          color="white"
          fontFamily="var(--cg-font-retro-display)"
          fontSize={{ base: 'xs', md: 'sm' }}
          letterSpacing="0.04em"
          textTransform="uppercase"
          noOfLines={1}
        >
          {title}
        </Text>
      </HStack>
      <Text
        color="rgba(255, 255, 255, 0.92)"
        fontFamily="var(--cg-font-retro-terminal)"
        fontSize={{ base: 'xs', md: 'sm' }}
        letterSpacing="0.02em"
        lineHeight="1"
        textTransform="uppercase"
      >
        {rightLabel}
      </Text>
    </HStack>
    <Box p={{ base: 4, md: 5 }} bg="var(--home-retro-surface-strong)">
      {children}
    </Box>
  </Box>
);

const RetroButton = ({ children, ...props }) => (
  <Button
    borderRadius="0"
    bg="var(--home-retro-surface)"
    color="var(--home-retro-text)"
    boxShadow={WINDOW_OUTSET}
    fontFamily="var(--cg-font-retro-display)"
    fontWeight="700"
    letterSpacing="0.04em"
    textTransform="uppercase"
    _hover={{ bg: 'var(--home-retro-surface-shell)' }}
    _active={{
      boxShadow: WINDOW_INSET,
      bg: 'var(--home-retro-surface-muted)',
      transform: 'translate(1px, 1px)',
    }}
    _disabled={{
      opacity: 0.7,
      color: 'var(--home-retro-text-muted)',
      boxShadow: WINDOW_INSET,
      cursor: 'not-allowed',
    }}
    {...props}
  >
    {children}
  </Button>
);

const TaskbarButton = ({ children, minW = 'auto' }) => (
  <Box minW={minW} px={3} py={1.5} bg="var(--home-retro-surface)" boxShadow={WINDOW_OUTSET}>
    <Text
      color="var(--home-retro-text)"
      fontFamily="var(--cg-font-retro-display)"
      fontSize={{ base: 'xs', md: 'sm' }}
      fontWeight="700"
      lineHeight="1"
      textTransform="uppercase"
    >
      {children}
    </Text>
  </Box>
);

const RotatePhonePrompt = ({ isCompactLandscapeShellMode, prefersReducedMotion }) => (
  <Box
    width="100%"
    maxW="420px"
    borderRadius="0"
    bg="var(--home-retro-surface)"
    boxShadow={WINDOW_OUTSET}
    overflow="hidden"
  >
    <Box px={{ base: 4, md: 5 }} py={{ base: 2.5, md: 3 }} bg={ACTIVE_TITLE_BAR}>
      <Text
        color="white"
        fontFamily="var(--cg-font-retro-display)"
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="700"
        letterSpacing="0.04em"
        textTransform="uppercase"
      >
        rotate-screen.exe
      </Text>
    </Box>
    <Box px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }} bg="var(--home-retro-surface-strong)">
      <VStack spacing={3.5} textAlign="center">
        <Box px={3} py={1.5} bg="var(--home-retro-surface-shell)" boxShadow={WINDOW_INSET}>
          <Text color="var(--home-retro-title-start)" fontSize="sm" textTransform="uppercase">
            Landscape Required
          </Text>
        </Box>

        <Box
          position="relative"
          h="104px"
          w="144px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="var(--home-retro-surface-shell)"
          boxShadow={WINDOW_INSET}
        >
          <MotionBox
            aria-hidden="true"
            animate={
              prefersReducedMotion
                ? { rotate: 90, scale: 1 }
                : { rotate: [0, 0, 90, 90, 0], scale: [1, 1, 1.02, 1.02, 1] }
            }
            transition={{
              duration: 2.8,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.45,
              times: [0, 0.34, 0.56, 0.82, 1],
            }}
            transformOrigin="center center"
          >
            <Box
              w="54px"
              h="88px"
              bg="var(--home-retro-surface)"
              boxShadow={WINDOW_OUTSET}
              position="relative"
            >
              <Box
                position="absolute"
                top="7px"
                left="50%"
                transform="translateX(-50%)"
                w="18px"
                h="3px"
                bg="var(--home-retro-border-mid)"
              />
              <Box
                position="absolute"
                inset="12px 8px 12px"
                bg="linear-gradient(180deg, rgba(10, 44, 154, 0.18) 0%, rgba(16, 132, 208, 0.08) 100%)"
                boxShadow={WINDOW_INSET}
              />
            </Box>
          </MotionBox>

          <Text
            position="absolute"
            bottom="10px"
            left="50%"
            transform="translateX(-50%)"
            color="var(--home-retro-text-muted)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            letterSpacing="0.05em"
            textTransform="uppercase"
          >
            rotate device
          </Text>
        </Box>

        <VStack spacing={1.5}>
          <Text
            color="var(--home-retro-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize={{ base: 'sm', md: isCompactLandscapeShellMode ? 'sm' : 'md' }}
            fontWeight="bold"
            letterSpacing="0.04em"
            textTransform="uppercase"
          >
            Turn your phone sideways to start the live demo.
          </Text>
          <Text
            color="var(--home-retro-text-muted)"
            fontFamily="var(--cg-font-retro-terminal)"
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight="1.6"
            maxW="340px"
          >
            The playable preview uses the wider layout for controls, map visibility, and
            device-shell interaction. Rotate to landscape, then tap Begin Demo.
          </Text>
        </VStack>
      </VStack>
    </Box>
  </Box>
);

const HomeHeroSection = ({
  variant = 'overlay',
  revealPhase = 'prelaunch',
  canBegin = false,
  requiresLandscapeForDemo = false,
  onBeginDemo,
  onSignIn,
  isAuthenticated = false,
  user = null,
}) => {
  const navigate = useNavigate();
  const isOverlay = variant === 'overlay';
  const isPrelaunch = revealPhase === 'prelaunch';
  const isCompactLandscapeShellMode = useCompactLandscapeShellMode();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isSecondaryExpanded, setIsSecondaryExpanded] = useState(false);

  const overlayMinHeight = isCompactLandscapeShellMode
    ? 'calc(100dvh - 122px - env(safe-area-inset-bottom))'
    : { base: '78vh', md: '84vh' };
  const overlayPaddingY = isCompactLandscapeShellMode ? 3 : { base: 6, md: 10 };
  const heroSpacing = isCompactLandscapeShellMode ? 3 : { base: 4, md: 6 };
  const ctaButtonSize = isCompactLandscapeShellMode ? 'md' : 'lg';
  const heroStatusFontSize = isCompactLandscapeShellMode ? '2xs' : { base: 'xs', md: 'sm' };

  if (!isOverlay) {
    return (
      <MotionBox
        px={{ base: 5, md: 8 }}
        pb={{ base: 3, md: 4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <RetroWindow title="home-status.exe" rightLabel="city demo ready">
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={{ base: 5, lg: 7 }}
            align="center"
          >
            <MotionBox
              animate={{ scale: 0.78 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              transformOrigin="center top"
            >
              <AnimatedLogo />
            </MotionBox>

            <VStack
              flex="1"
              align={{ base: 'center', lg: 'flex-start' }}
              spacing={3}
              textAlign={{ base: 'center', lg: 'left' }}
            >
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="700"
                color="var(--home-retro-title-start)"
                fontFamily="var(--cg-font-retro-display)"
                letterSpacing="0.04em"
                textTransform="uppercase"
              >
                {HERO_LEAD}
              </Text>
              <Text
                as="h2"
                color="var(--home-retro-text)"
                fontFamily="var(--cg-font-retro-terminal)"
                fontSize={{ base: 'lg', md: 'xl' }}
                lineHeight="1.35"
              >
                {HERO_DESCRIPTION}
              </Text>
              <Box width="100%" maxW="680px">
                <HStack justify="space-between" align="center" mb={2}>
                  <Text
                    color="var(--home-retro-text-muted)"
                    fontFamily="var(--cg-font-retro-terminal)"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="1.7"
                    noOfLines={isSecondaryExpanded ? undefined : 1}
                  >
                    •{' '}
                    <Box as="span" fontWeight="bold" color="var(--home-retro-text)">
                      {HERO_FEATURES[0].title}:
                    </Box>{' '}
                    {HERO_FEATURES[0].text}
                  </Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsSecondaryExpanded(!isSecondaryExpanded)}
                    color="var(--home-retro-title-start)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.04em"
                    textTransform="uppercase"
                    _hover={{ bg: 'var(--home-retro-surface-shell)' }}
                  >
                    {isSecondaryExpanded ? 'Show Less' : 'Learn More'}
                  </Button>
                </HStack>
                <Collapse in={isSecondaryExpanded}>
                  <VStack align="stretch" spacing={3} mt={2}>
                    {HERO_FEATURES.map((feature) => (
                      <Text
                        key={feature.title}
                        color="var(--home-retro-text-muted)"
                        fontFamily="var(--cg-font-retro-terminal)"
                        fontSize={{ base: 'sm', md: 'md' }}
                        lineHeight="1.7"
                      >
                        •{' '}
                        <Box as="span" fontWeight="bold" color="var(--home-retro-text)">
                          {feature.title}:
                        </Box>{' '}
                        {feature.text}
                      </Text>
                    ))}
                  </VStack>
                </Collapse>
              </Box>
            </VStack>
          </Stack>
        </RetroWindow>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      py={overlayPaddingY}
      px={{ base: 5, md: 8 }}
      position="relative"
      minH={overlayMinHeight}
      display="flex"
      alignItems="center"
      justifyContent="center"
      initial={{ opacity: 0 }}
      animate={{ opacity: revealPhase === 'launching' ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <VStack spacing={heroSpacing} width="100%" maxW="1240px" justifyContent="center">
        <Box
          width="100%"
          borderRadius="0"
          overflow="hidden"
          bg="var(--home-retro-surface)"
          boxShadow={WINDOW_OUTSET}
          position="relative"
        >
          <HStack
            justify="space-between"
            px={{ base: 4, md: 5 }}
            py={{ base: 2.5, md: 3 }}
            bg={ACTIVE_TITLE_BAR}
          >
            <HStack spacing={3} minW={0}>
              <Text
                color="white"
                fontFamily="var(--cg-font-retro-display)"
                fontSize={{ base: 'xs', md: 'sm' }}
                letterSpacing="0.04em"
                textTransform="uppercase"
                noOfLines={1}
              >
                C:\CODEGRIND\DESKTOP\HOME.EXE
              </Text>
            </HStack>
            <HStack spacing={{ base: 2, md: 3 }}>
              <Text
                color="rgba(255, 255, 255, 0.92)"
                fontFamily="var(--cg-font-retro-display)"
                fontSize={{ base: 'xs', md: 'sm' }}
                lineHeight="1"
                textTransform="uppercase"
              >
                {requiresLandscapeForDemo ? 'portrait lock' : 'active window'}
              </Text>
              <WindowControls />
            </HStack>
          </HStack>

          <Stack
            direction="column"
            spacing={{ base: 4, xl: 5 }}
            p={{ base: 3, md: 4, xl: 5 }}
            align="stretch"
            bg="var(--home-retro-surface-strong)"
          >
            <MotionBox
              width="100%"
              initial={{
                y: prefersReducedMotion ? 0 : -20,
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.98,
              }}
              animate={{
                scale: 1,
                y: 0,
                opacity: 1,
              }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              transformOrigin="center center"
            >
              <RetroWindow title="brand.mdl" rightLabel="display ready">
                <VStack align="stretch" spacing={{ base: 4, md: 5 }} maxW="860px" mx="auto">
                  <Box
                    alignSelf="stretch"
                    px={{ base: 3, md: 4 }}
                    py={{ base: 4, md: 5 }}
                    bg="var(--home-retro-surface-shell)"
                    boxShadow={WINDOW_INSET}
                  >
                    <AnimatedLogo />
                  </Box>

                  <VStack align="stretch" spacing={4} textAlign={{ base: 'center', lg: 'left' }}>
                    <Text
                      color="var(--home-retro-title-start)"
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize={{ base: 'sm', md: 'lg' }}
                      fontWeight="700"
                      letterSpacing="0.04em"
                      textTransform="uppercase"
                    >
                      {HERO_LEAD}
                    </Text>

                    <Text
                      color="var(--home-retro-text)"
                      fontFamily="var(--cg-font-retro-terminal)"
                      fontSize={{ base: 'md', md: 'lg' }}
                      lineHeight="1.7"
                    >
                      {HERO_DESCRIPTION}
                    </Text>

                    <HStack justify={{ base: 'center', lg: 'flex-start' }} pt={1}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsSecondaryExpanded(!isSecondaryExpanded)}
                        color="var(--home-retro-title-start)"
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize="xs"
                        fontWeight="700"
                        letterSpacing="0.04em"
                        textTransform="uppercase"
                        _hover={{ bg: 'var(--home-retro-surface-shell)' }}
                        _active={{ bg: 'var(--home-retro-surface-muted)' }}
                        leftIcon={
                          <span
                            style={{
                              display: 'inline-block',
                              transform: isSecondaryExpanded ? 'rotate(90deg)' : 'none',
                              transition: 'transform 0.15s ease-out',
                            }}
                          >
                            ▶
                          </span>
                        }
                      >
                        {isSecondaryExpanded ? 'Hide Details' : 'Show Details / How It Works'}
                      </Button>
                    </HStack>

                    <Collapse in={isSecondaryExpanded}>
                      <VStack align="stretch" spacing={4} pt={2}>
                        {HERO_FEATURES.map((feature) => (
                          <Text
                            key={feature.title}
                            color="var(--home-retro-text-muted)"
                            fontFamily="var(--cg-font-retro-terminal)"
                            fontSize={{ base: 'sm', md: 'md' }}
                            lineHeight="1.75"
                          >
                            •{' '}
                            <Box as="span" fontWeight="bold" color="var(--home-retro-text)">
                              {feature.title}:
                            </Box>{' '}
                            {feature.text}
                          </Text>
                        ))}
                      </VStack>
                    </Collapse>
                  </VStack>

                  {requiresLandscapeForDemo ? (
                    <Box alignSelf="center" width="100%" maxW="420px">
                      <RotatePhonePrompt
                        isCompactLandscapeShellMode={isCompactLandscapeShellMode}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </Box>
                  ) : null}

                  <AnimatePresence mode="wait">
                    {isPrelaunch ? (
                      <MotionBox
                        key="hero-begin"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: canBegin ? 1 : 0.72, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <Box
                          px={{ base: 4, md: 5 }}
                          py={{ base: 4, md: 5 }}
                          bg="var(--home-retro-surface)"
                          boxShadow={WINDOW_OUTSET}
                        >
                          <VStack align="stretch" spacing={3.5}>
                            <Box
                              py={2.5}
                              bg="var(--home-retro-surface-shell)"
                              boxShadow={WINDOW_INSET}
                            >
                              <Text
                                color="var(--home-retro-title-start)"
                                fontFamily="var(--cg-font-retro-display)"
                                fontSize={heroStatusFontSize}
                                fontWeight="700"
                                letterSpacing="0.04em"
                                textTransform="uppercase"
                                textAlign="center"
                              >
                                {user?.onboardingComplete
                                  ? 'Onboarding complete. Choose safehouse or profile to resume.'
                                  : requiresLandscapeForDemo
                                    ? 'Rotate to landscape to unlock the playable demo.'
                                    : 'Press Begin Demo to boot the game when you are set.'}
                              </Text>
                            </Box>

                            <Text
                              color="var(--home-retro-text-muted)"
                              fontFamily="var(--cg-font-retro-terminal)"
                              fontSize={{ base: 'sm', md: 'md' }}
                              lineHeight="1.6"
                              textAlign="center"
                            >
                              {user?.onboardingComplete
                                ? 'C:\\> cd safehouse && start'
                                : 'C:\\> run city --live'}
                            </Text>

                            <Stack
                              direction={{ base: 'column', md: 'row' }}
                              spacing={3}
                              justify="center"
                              align="center"
                            >
                              {user?.onboardingComplete ? (
                                <>
                                  <RetroButton
                                    size={ctaButtonSize}
                                    onClick={() => navigate('/city')}
                                    px={isCompactLandscapeShellMode ? 7 : 10}
                                    minW={{ base: '100%', md: '230px' }}
                                    bg="var(--home-retro-surface-shell)"
                                    color="var(--home-retro-title-start)"
                                  >
                                    Go to Safehouse
                                  </RetroButton>
                                  <RetroButton
                                    size={ctaButtonSize}
                                    onClick={() => navigate('/profile')}
                                    px={isCompactLandscapeShellMode ? 7 : 10}
                                    minW={{ base: '100%', md: '230px' }}
                                  >
                                    Go to Profile
                                  </RetroButton>
                                </>
                              ) : (
                                <>
                                  <RetroButton
                                    size={ctaButtonSize}
                                    onClick={onBeginDemo}
                                    isDisabled={!canBegin}
                                    px={isCompactLandscapeShellMode ? 7 : 10}
                                    minW={{ base: '100%', md: '230px' }}
                                    bg="var(--home-retro-surface-shell)"
                                    color="var(--home-retro-title-start)"
                                  >
                                    Begin Demo
                                  </RetroButton>
                                  {!isAuthenticated && onSignIn ? (
                                    <RetroButton
                                      size={ctaButtonSize}
                                      onClick={onSignIn}
                                      px={isCompactLandscapeShellMode ? 7 : 10}
                                      minW={{ base: '100%', md: '230px' }}
                                    >
                                      Sign In
                                    </RetroButton>
                                  ) : null}
                                </>
                              )}
                            </Stack>

                            <Text
                              color={
                                user?.onboardingComplete
                                  ? 'var(--home-retro-accent-green)'
                                  : requiresLandscapeForDemo
                                    ? 'var(--home-retro-accent-amber)'
                                    : 'var(--home-retro-accent-green)'
                              }
                              fontFamily="var(--cg-font-retro-terminal)"
                              fontSize={{ base: 'sm', md: 'md' }}
                              lineHeight="1.6"
                              textAlign="center"
                            >
                              {user?.onboardingComplete
                                ? 'Onboarding complete. Safehouse and profile ready.'
                                : requiresLandscapeForDemo
                                  ? 'Demo launch stays disabled until your phone is in landscape mode.'
                                  : 'Press begin demo to select your character and load into the world.'}
                            </Text>
                          </VStack>
                        </Box>
                      </MotionBox>
                    ) : null}
                  </AnimatePresence>
                </VStack>
              </RetroWindow>
            </MotionBox>
          </Stack>

          <HStack
            px={{ base: 4, md: 5 }}
            py={{ base: 3, md: 3.5 }}
            spacing={{ base: 2, md: 3 }}
            flexWrap="wrap"
            borderTop="1px solid var(--home-retro-border-mid)"
            bg="var(--home-retro-surface-muted)"
          >
            <TaskbarButton minW={{ base: '92px', md: '104px' }}>Start</TaskbarButton>
            {['home.exe', 'city.exe', 'notes.txt'].map((entryLabel) => (
              <TaskbarButton key={entryLabel}>{entryLabel}</TaskbarButton>
            ))}
            <Box
              ml="auto"
              px={3}
              py={1.5}
              bg="var(--home-retro-surface-shell)"
              boxShadow={WINDOW_INSET}
            >
              <Text
                color="var(--home-retro-text)"
                fontFamily="var(--cg-font-retro-display)"
                fontSize={{ base: 'xs', md: 'sm' }}
                lineHeight="1"
                textTransform="uppercase"
              >
                public demo ready
              </Text>
            </Box>
          </HStack>
        </Box>
      </VStack>
    </MotionBox>
  );
};

export default HomeHeroSection;
