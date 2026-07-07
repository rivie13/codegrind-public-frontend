/**
 * PathChoiceModal - Shown after the homepage Hello World demo is beaten.
 *
 * Asks the guest "Are you a beginner or a pro?" to route them
 * to the appropriate track:
 *   - Beginner -> Learning Paths (/learning)
 *   - Pro      -> Interview Clusters (/games/clusters)
 *
 * Part of the guest free-trial funnel (3 solved problems):
 *   1. Hello World demo (homepage)
 *   2-3. Two more solved problems in the chosen track
 *
 * ── Level-Up Animation Timeline (when level increases) ──────────────────────
 *   140ms   Phase 1 bar: previousXpProgress → 100 %, progress-bar sound
 *   ~1500ms Bar hits 100 %, brief hold w/ full-bar glow,
 *           level-up-begin sound plays ("you leveled up!")
 *   ~1750ms THUD — level-up-thud sound, bar flashes white, level text
 *           flips to new level, celebration box appears
 *   ~2150ms Bar resets to 0 % (instant, hidden by flash)
 *   ~2350ms Phase 2 bar: 0 → new xpProgress, progress-bar sound again
 *   ~3300ms Emphasis animation ends
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';
import { api } from '../../services/api';
import { getGuestXpSummaryFromTotalXp } from '../../hooks/guest/useGuestProgress';
import { useAutoScrollIntoView } from '../../hooks/useMobileXpScroll';
import audioManager from '../../utils/audio/AudioManager';
import audioService from '../../utils/audio/AudioService';
import DataPacketsEarnedBadge from '../shared/DataPacketsEarnedBadge';
import SocialShareButtons from '../shared/SocialShareButtons';
import XpProgressBar from '../shared/XpProgressBar';
import { normalizeDataPacketsPayload } from '../../utils/economy/dataPackets';
import {
  buildProgressTransition,
  getProgressTransitionDuration,
  getXpNumbersForPercent,
} from '../../utils/game/xpAnimation';
import {
  APARTMENT_CITY_ENTRY_STATE_HUB,
  APARTMENT_CITY_ENTRY_STATE_PARAM,
  PATH_CHOICE_CITY_ENTRY,
} from '../../utils/navigation/apartmentEntryState';
import { restoreFullscreenFromIntent } from '../../utils/mobile/fullscreenState';

const MotionBox = motion(Box);

export const normalizeModalXpSummary = (summary) => {
  const totalXp = Number(summary?.xp);
  if (!Number.isFinite(totalXp) || totalXp < 0) {
    return getGuestXpSummaryFromTotalXp(0);
  }

  const normalized = getGuestXpSummaryFromTotalXp(totalXp);
  return {
    ...normalized,
    roleName: summary?.roleName || normalized.roleName,
  };
};

/* ── constants ──────────────────────────────────────────────────────────── */

const TRACKS = {
  beginner: {
    chip: 'CONTINUE FROM HERE',
    label: 'I NEED TO BUILD THE SKILLS',
    sublabel:
      'Stay on the shared starting point. You are switching careers, learning from the ground up, and trying to become the kind of operator this city cannot ignore. Pick a language and keep climbing from Hello World. ',
    sublabelHighlight:
      'Recommended for users who are learning how to code for the first time or still building foundational skills.',
    route: '/learning/python-path',
    color: '#0f6f17',
  },
  pro: {
    chip: 'FAST-FORWARD',
    label: 'I ALREADY HAVE THE SKILLS',
    sublabel:
      'Jump to the later chapter where you already put in the work and the hiring machine still locks you out. Start on the interview-prep side, trace the gatekeepers, and force your way into the room anyway. ',
    sublabelHighlight:
      'Recommended for users who already have coding experience and/or a CS degree and want to fast-track their learning.',
    route: '/games/clusters',
    color: '#b31773',
  },
};

const LANGUAGES = [
  {
    code: 'python',
    pathId: 'python-path',
    route: '/learning/python-path',
    label: 'PYTHON',
    sublabel:
      'Easiest learning curve. Reads almost like English. The go-to for AI, data science, and automation. Best first language.',
    tag: 'RECOMMENDED FOR BEGINNERS',
    available: true,
  },
  {
    code: 'javascript',
    pathId: 'javascript-path',
    route: '/learning/javascript-path',
    label: 'JAVASCRIPT',
    sublabel:
      'Language of the web. Every browser runs it. Instant visual feedback. Great if you want to build things people actually use.',
    tag: 'GREAT FOR WEB & APPS',
    available: true,
  },
  {
    code: 'java',
    pathId: 'java-path',
    route: '/learning/java-path',
    label: 'JAVA',
    sublabel:
      'Strict, structured, and battle-tested. Used in enterprise systems, Android, and big tech interviews. Discipline breeds mastery.',
    tag: 'GREAT FOR INTERVIEWS',
    available: true,
  },
];

const FALLBACK_DEMO_HIGHLIGHTS = [
  'Validated your solution with live test cases.',
  'Cleared the onboarding defense waves and protected your base.',
  'Unlocked the branch where you either keep building skills or fast-forward to interview prep.',
];

const MIN_DISMISS_LOCK_MS = 5000;

/* ── component ──────────────────────────────────────────────────────────── */

export default function PathChoiceModal({
  isOpen,
  onClose,
  onLaunchCityTarget = null,
  demoSummary = null,
  selectedTrack = null,
  selectedLearningPath = null,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const guest = useGuestProgressCtx();
  const funnel = useGuestFunnel();
  const prefersReducedMotion = usePrefersReducedMotion();
  const gainAnimationRef = useRef(null);
  const xpSectionRef = useRef(null);
  const modalBodyRef = useRef(null);

  const highlights =
    Array.isArray(demoSummary?.highlights) && demoSummary.highlights.length > 0
      ? demoSummary.highlights
      : FALLBACK_DEMO_HIGHLIGHTS;

  const xpGained = Math.max(0, Number(demoSummary?.xpGained || 0));
  const dataPacketAward = useMemo(
    () =>
      normalizeDataPacketsPayload(demoSummary?.dataPackets, {
        fallbackXpAmount: xpGained,
        fallbackIsExact: !isAuthenticated,
      }),
    [demoSummary?.dataPackets, isAuthenticated, xpGained]
  );
  const currentXpSummary =
    (isAuthenticated && demoSummary?.xpSummary
      ? normalizeModalXpSummary(demoSummary.xpSummary)
      : null) ||
    guest?.xpSummary ||
    getGuestXpSummaryFromTotalXp(0);
  const previousXpSummary = useMemo(
    () =>
      (demoSummary?.previousXpSummary
        ? normalizeModalXpSummary(demoSummary.previousXpSummary)
        : null) || getGuestXpSummaryFromTotalXp(Math.max(0, currentXpSummary.xp - xpGained)),
    [currentXpSummary.xp, demoSummary?.previousXpSummary, xpGained]
  );

  // ── XP animation state ──
  const [animatedXpGain, setAnimatedXpGain] = useState(0);
  const [animatedXpProgress, setAnimatedXpProgress] = useState(0);
  const [progressTransition, setProgressTransition] = useState('width 1.2s ease');
  const [xpDisplayMode, setXpDisplayMode] = useState('current');
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [levelUpEmphasisActive, setLevelUpEmphasisActive] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(previousXpSummary.level || 1);
  const [displayRoleName, setDisplayRoleName] = useState(previousXpSummary.roleName || 'Greenhorn');
  const [step, setStep] = useState('track');
  const [isDismissLocked, setIsDismissLocked] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Visual FX states for the bar transition
  const [barFullGlow, setBarFullGlow] = useState(false);
  const [barFlashActive, setBarFlashActive] = useState(false);
  const [barShakeActive, setBarShakeActive] = useState(false);
  const [showDataPacketsAward, setShowDataPacketsAward] = useState(false);

  const levelIncreased = currentXpSummary.level > previousXpSummary.level;
  const previousXpProgress = previousXpSummary.progressPercent || 0;
  const xpProgress = currentXpSummary.progressPercent || 0;

  // ── Initialize audio system (loads sound effects into audioManager) ──
  useEffect(() => {
    if (!isOpen) return;
    audioService.initialize();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsDismissLocked(true);
      setIsNavigating(false);
      return undefined;
    }

    setIsDismissLocked(true);
    const lockTimer = window.setTimeout(() => {
      setIsDismissLocked(false);
    }, MIN_DISMISS_LOCK_MS);

    return () => {
      window.clearTimeout(lockTimer);
    };
  }, [isOpen]);

  // Numeric readout synced to the animated bar position
  const xpDisplay =
    levelIncreased && xpDisplayMode === 'previous'
      ? {
          into: previousXpSummary.xpIntoLevel,
          toNext: previousXpSummary.xpToNextLevel,
          remaining: Math.max(0, previousXpSummary.xpToNextLevel - previousXpSummary.xpIntoLevel),
        }
      : {
          into: currentXpSummary.xpIntoLevel,
          toNext: currentXpSummary.xpToNextLevel,
          remaining: currentXpSummary.xpRemainingToNextLevel,
        };
  const animatedXpDisplay = getXpNumbersForPercent({
    percent: animatedXpProgress,
    toNext: xpDisplay.toNext,
    showRemaining: true,
  });

  useEffect(() => {
    if (!isOpen || !dataPacketAward) {
      setShowDataPacketsAward(false);
      return undefined;
    }

    if (prefersReducedMotion) {
      setShowDataPacketsAward(true);
      return undefined;
    }

    const phase1Duration = levelIncreased
      ? getProgressTransitionDuration({ fromPercent: previousXpProgress, toPercent: 100 })
      : 0;
    const phase2Duration = getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress });

    const revealDelay = levelIncreased
      ? 1090 + phase1Duration + phase2Duration + 120
      : 140 + phase2Duration + 120;

    setShowDataPacketsAward(false);
    const timer = setTimeout(() => setShowDataPacketsAward(true), revealDelay);
    return () => clearTimeout(timer);
  }, [
    dataPacketAward,
    isOpen,
    levelIncreased,
    prefersReducedMotion,
    previousXpProgress,
    xpProgress,
  ]);

  // ── Two-phase XP bar animation + sound effects ──
  useEffect(() => {
    if (!isOpen) return undefined;
    const timers = [];
    const skipFx = prefersReducedMotion;

    // Reset visual FX
    setBarFullGlow(false);
    setBarFlashActive(false);
    setBarShakeActive(false);

    if (levelIncreased) {
      /* ────────────────────── LEVEL-UP PATH ────────────────────── */

      // Start from old level
      setShowLevelUpCelebration(false);
      setDisplayLevel(previousXpSummary.level);
      setDisplayRoleName(previousXpSummary.roleName || 'Greenhorn');
      setXpDisplayMode('previous');
      setLevelUpEmphasisActive(false);

      // Phase 1: fill bar  previousXpProgress → 100 %
      const phase1Duration = getProgressTransitionDuration({
        fromPercent: previousXpProgress,
        toPercent: 100,
      });
      setProgressTransition(buildProgressTransition(phase1Duration));
      setAnimatedXpProgress(previousXpProgress);
      timers.push(setTimeout(() => setAnimatedXpProgress(100), 140));

      // Play progress-bar sound with the fill
      if (!skipFx) {
        timers.push(setTimeout(() => audioManager.playSoundEffect('progress-bar'), 140));
      }

      // ~phase1Duration + 140: bar is full.  Hold at 100 % with glow.
      const fullAt = 140 + phase1Duration;

      // Bar-full glow effect (pulsing at 100 %) + level-up sound
      timers.push(
        setTimeout(() => {
          setBarFullGlow(true);
          if (!skipFx) audioManager.playSoundEffect('level-up-begin');
        }, fullAt)
      );

      // ── IMPACT MOMENT (fullAt + 250ms) ──
      const impactAt = fullAt + 250;

      timers.push(
        setTimeout(() => {
          // THUD sound — deep impact on bar explosion
          if (!skipFx) audioManager.playSoundEffect('level-up-thud');

          // White flash over the bar
          setBarFlashActive(true);
          // Shake the bar container
          setBarShakeActive(true);
          // Kill the full-bar glow
          setBarFullGlow(false);

          // Flip level / role display
          setDisplayLevel(currentXpSummary.level);
          setDisplayRoleName(currentXpSummary.roleName || 'Greenhorn');
          setXpDisplayMode('current');

          // Show celebration card
          setShowLevelUpCelebration(true);
          setLevelUpEmphasisActive(true);
        }, impactAt)
      );

      // End shake + flash after 400ms
      timers.push(
        setTimeout(() => {
          setBarShakeActive(false);
          setBarFlashActive(false);
        }, impactAt + 400)
      );

      // ── Reset bar to 0 % instantly (hidden behind flash) ──
      const resetAt = impactAt + 200;
      timers.push(
        setTimeout(() => {
          setProgressTransition('none');
          setAnimatedXpProgress(0);
        }, resetAt)
      );

      // ── Phase 2: new bar fills 0 → xpProgress ──
      const phase2Start = impactAt + 500;
      timers.push(
        setTimeout(() => {
          setProgressTransition(
            buildProgressTransition(
              getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress })
            )
          );
          setAnimatedXpProgress(xpProgress);

          // Play progress-bar sound for the second fill
          if (!skipFx) {
            audioManager.playSoundEffect('progress-bar');
          }
        }, phase2Start)
      );

      // End emphasis after phase 2 finishes
      const phase2Duration = getProgressTransitionDuration({
        fromPercent: 0,
        toPercent: xpProgress,
      });
      timers.push(
        setTimeout(() => setLevelUpEmphasisActive(false), phase2Start + phase2Duration + 200)
      );
    } else {
      /* ────────────────────── NO LEVEL-UP PATH ─────────────────── */
      setShowLevelUpCelebration(false);
      setDisplayLevel(currentXpSummary.level);
      setDisplayRoleName(currentXpSummary.roleName || 'Greenhorn');
      setXpDisplayMode('current');
      setAnimatedXpProgress(0);
      setProgressTransition(
        buildProgressTransition(
          getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress })
        )
      );
      timers.push(setTimeout(() => setAnimatedXpProgress(xpProgress), 140));

      if (xpGained > 0 && !skipFx) {
        timers.push(setTimeout(() => audioManager.playSoundEffect('progress-bar'), 140));
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [
    currentXpSummary.level,
    currentXpSummary.roleName,
    isOpen,
    levelIncreased,
    prefersReducedMotion,
    previousXpProgress,
    previousXpSummary.level,
    previousXpSummary.roleName,
    xpGained,
    xpProgress,
  ]);

  // ── Animated +XP counting number ──
  useEffect(() => {
    if (!isOpen) return undefined;
    if (gainAnimationRef.current) {
      cancelAnimationFrame(gainAnimationRef.current);
      gainAnimationRef.current = null;
    }
    if (prefersReducedMotion) {
      setAnimatedXpGain(xpGained);
      return undefined;
    }
    setAnimatedXpGain(0);
    const startTime = performance.now();
    const duration = 900;
    const tick = (now) => {
      const pct = Math.min(1, (now - startTime) / duration);
      setAnimatedXpGain(Math.round(xpGained * pct));
      if (pct < 1) {
        gainAnimationRef.current = requestAnimationFrame(tick);
      } else {
        gainAnimationRef.current = null;
      }
    };
    gainAnimationRef.current = requestAnimationFrame(tick);
    return () => {
      if (gainAnimationRef.current) {
        cancelAnimationFrame(gainAnimationRef.current);
        gainAnimationRef.current = null;
      }
    };
  }, [isOpen, prefersReducedMotion, xpGained]);

  const isReturningGuest = Boolean(selectedTrack);
  const lockedLearningPathId =
    selectedLearningPath || guest?.selectedTrialLearningPath || guest?.progress?.trialLearningPath;
  const remainingProTrialProblems = Math.max(0, Number(guest?.clusterFreeProblemsRemaining ?? 2));

  // When the guest already chose a track, only show that track's button
  const visibleTracks = isReturningGuest
    ? Object.entries(TRACKS).filter(([key]) => key === selectedTrack)
    : Object.entries(TRACKS);
  const unlockedAchievements = Array.isArray(demoSummary?.unlockedAchievements)
    ? demoSummary.unlockedAchievements
    : [];

  const closeAndReset = useCallback(() => {
    audioManager.stopAllSoundEffects();
    setStep('track');
    onClose();
  }, [onClose]);

  const handleDismissRequest = useCallback(() => {
    if (isDismissLocked) return;
    closeAndReset();
  }, [closeAndReset, isDismissLocked]);

  const handleTrackClick = (key) => {
    if (key === 'beginner' && (!isReturningGuest || !lockedLearningPathId)) {
      setStep('language');
    } else {
      handleChoice(key, { learningPathId: lockedLearningPathId });
    }
  };

  const handleChoice = async (trackKey, options = {}) => {
    if (isNavigating) return;
    setIsNavigating(true);

    const track = TRACKS[trackKey];
    const selectedLanguage = LANGUAGES.find(
      (language) => language.pathId === options.learningPathId
    );
    const beginnerRoute = selectedLanguage?.route || track?.route;

    funnel.pathChosen(trackKey);
    closeAndReset();

    if (!isAuthenticated) {
      if (guest?.recordPathChoice) {
        guest.recordPathChoice(trackKey);
      } else {
        // Fallback for contexts where provider is absent.
        try {
          const raw = localStorage.getItem('codegrind_guest_progress');
          const blob = raw ? JSON.parse(raw) : {};
          if (!blob.pathChoice) {
            blob.pathChoice = trackKey;
            blob.pathChosenAt = new Date().toISOString();
          }
          if (trackKey === 'beginner' && options.learningPathId && !blob.trialLearningPath) {
            blob.trialLearningPath = options.learningPathId;
          }
          localStorage.setItem('codegrind_guest_progress', JSON.stringify(blob));
        } catch {
          // Best effort
        }
      }

      if (trackKey === 'beginner' && options.learningPathId && guest?.recordTrialLearningPath) {
        guest.recordTrialLearningPath(options.learningPathId);
      }

      // Mark Mission 1 (Hello Print) as complete now that the guest has
      // finished the home-page demo AND confirmed a path choice.
      if (guest?.recordLpNodeCompleted) {
        guest.recordLpNodeCompleted('py-m0-tower-hello', {
          pathId: 'python-path',
          nodeType: 'tower',
          nodeTitle: 'Mission 1: Hello Print',
          moduleId: 'py-m0-hello',
          moduleTitle: 'Hello World',
        });
      }
    } else {
      try {
        await api.city.savePathChoice({
          selectedTrialLearningPath:
            trackKey === 'beginner' ? options.learningPathId || null : null,
          selectedTrialTrack: trackKey,
        });
      } catch {
        // Keep the city handoff responsive even if the persistence call fails.
      }
    }

    closeAndReset();

    const cityParams = new URLSearchParams({
      scene: 'apartment-room-01',
      entry: PATH_CHOICE_CITY_ENTRY,
      track: trackKey,
    });

    if (trackKey === 'beginner' && options.learningPathId) {
      cityParams.set('learningPath', options.learningPathId);
    }

    cityParams.set(APARTMENT_CITY_ENTRY_STATE_PARAM, APARTMENT_CITY_ENTRY_STATE_HUB);
    cityParams.set('fallback', trackKey === 'beginner' ? beginnerRoute : track.route);
    const cityTargetPath = `/city?${cityParams.toString()}`;

    if (typeof onLaunchCityTarget === 'function') {
      await onLaunchCityTarget(cityTargetPath);
      return;
    }

    await restoreFullscreenFromIntent();
    navigate(cityTargetPath);
  };

  useAutoScrollIntoView(xpSectionRef, {
    isOpen,
    enabled: true,
    delayMs: 320,
    repeatDelayMs: 520,
    block: 'center',
    containerRef: modalBodyRef,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismissRequest}
      size="xl"
      initialFocusRef={xpSectionRef}
      closeOnOverlayClick={false}
      closeOnEsc={!isDismissLocked}
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="rgba(12, 12, 12, 0.62)" />
      <ModalContent
        bg="transparent"
        boxShadow="none"
        maxW={{ base: '96vw', md: '680px' }}
        maxH={{ base: 'calc(100dvh - 1.5rem)', md: 'calc(100dvh - 2rem)' }}
        mx={4}
        my={{ base: 3, md: 4 }}
      >
        <ModalBody ref={modalBodyRef} p={0}>
          <Box
            bg="#d4d0c8"
            border="2px solid #10131c"
            overflow="hidden"
            position="relative"
            boxShadow="var(--cg-window-outset), 14px 14px 0 rgba(0, 0, 0, 0.18)"
          >
            <Box
              px={{ base: 4, md: 5 }}
              py={2.5}
              bg="linear-gradient(180deg, #0b2ba8 0%, #081a77 100%)"
              borderBottom="1px solid #060d45"
            >
              <HStack justify="space-between" align="center" spacing={4}>
                <Box minW={0}>
                  <Text
                    color="#f4f7ff"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                  >
                    Mission Complete - Hello World
                  </Text>
                  <Heading
                    as="h2"
                    size="sm"
                    mt={1}
                    color="#ffffff"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontWeight="700"
                  >
                    Demo Recap
                  </Heading>
                </Box>
                <HStack spacing={1.5} flexShrink={0}>
                  <Box w="12px" h="12px" border="1px solid #d9dcff" bg="#c7d1ff" />
                  <Box w="12px" h="12px" border="1px solid #d9dcff" bg="#c7d1ff" />
                  <Box w="12px" h="12px" border="1px solid #d9dcff" bg="#c7d1ff" />
                </HStack>
              </HStack>
            </Box>

            <VStack
              spacing={4}
              px={{ base: 4, md: 5 }}
              pt={{ base: 4, md: 6 }}
              pb={3}
              align="stretch"
              bg="linear-gradient(180deg, #ebe7dd 0%, #d4d0c8 100%)"
            >
              <Box
                bg="#efebe7"
                border="1px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                px={4}
                py={3}
              >
                <Text
                  color="#0a2c9a"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  mb={2}
                >
                  Routing Status
                </Text>
                <Text
                  color="#1f2430"
                  fontSize="sm"
                  lineHeight="1.65"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  {isReturningGuest ? (
                    <>Nice clear. You earned repeat XP and can jump straight back into your path.</>
                  ) : (
                    <>
                      Nice clear. Everyone starts with the same{' '}
                      <Text as="span" color="#0a2c9a" fontWeight="700">
                        Hello World breach
                      </Text>{' '}
                      . From here you can keep building through{' '}
                      <Text as="span" color="#0a2c9a" fontWeight="700">
                        Beginner Module 0
                      </Text>{' '}
                      or fast-forward into the later interview-prep chapter with{' '}
                      <Text as="span" color="#0a2c9a" fontWeight="700">
                        {remainingProTrialProblems} pro cluster trial solves
                      </Text>{' '}
                      ready.
                    </>
                  )}
                </Text>
              </Box>

              <Box
                order={{ base: 1, md: 0 }}
                bg="#efebe7"
                border="1px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                px={4}
                py={3}
              >
                <Text
                  color="#0a2c9a"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  mb={2}
                  textTransform="uppercase"
                >
                  What You Just Did
                </Text>
                <VStack spacing={2} align="stretch">
                  {highlights.map((line) => (
                    <Text
                      key={line}
                      color="#1f2430"
                      fontSize="sm"
                      lineHeight="1.6"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      - {line}
                    </Text>
                  ))}
                </VStack>
              </Box>

              {/* ── XP PROGRESS SECTION ── */}
              <Box
                ref={xpSectionRef}
                tabIndex={-1}
                data-testid="path-choice-xp-section"
                order={{ base: -1, md: 0 }}
                bg="#efebe7"
                border="1px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                px={4}
                py={3}
                scrollMarginTop="12px"
              >
                <HStack justify="space-between" mb={3} align="center">
                  <Text
                    color="#0a2c9a"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="11px"
                    fontWeight="700"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                  >
                    Guest XP Progress
                  </Text>
                  {levelIncreased && !showLevelUpCelebration && (
                    <Badge
                      bg="#f7f3e8"
                      color="#0f6f17"
                      border="1px solid #7f7f7f"
                      borderRadius="0"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      fontWeight="700"
                    >
                      Level Up
                    </Badge>
                  )}
                </HStack>

                <XpProgressBar
                  animatedXpProgress={animatedXpProgress}
                  progressTransition={progressTransition}
                  barFullGlow={barFullGlow}
                  barFlashActive={barFlashActive}
                  barShakeActive={barShakeActive}
                  showLevelUpCelebration={showLevelUpCelebration}
                  levelUpEmphasisActive={levelUpEmphasisActive}
                  displayLevel={displayLevel}
                  displayRoleName={displayRoleName}
                  animatedXpDisplay={animatedXpDisplay}
                  newLevel={currentXpSummary.level}
                  newRoleName={currentXpSummary.roleName}
                  roleChanged={previousXpSummary.roleName !== currentXpSummary.roleName}
                  totalXpGained={animatedXpGain}
                  prefersReducedMotion={prefersReducedMotion}
                  theme="retro-desktop"
                  maxW="100%"
                />

                {unlockedAchievements.length > 0 && (
                  <HStack spacing={2} mt={3} flexWrap="wrap" align="flex-start">
                    {unlockedAchievements.map((achievement) => (
                      <Badge
                        key={achievement.id}
                        bg="#f7f3e8"
                        color="#5d2e8c"
                        border="1px solid #7f7f7f"
                        borderRadius="0"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                        px={2}
                        py={1}
                      >
                        {achievement.title}
                      </Badge>
                    ))}
                  </HStack>
                )}
                {showDataPacketsAward && (
                  <Box mt={3}>
                    <DataPacketsEarnedBadge
                      dataPackets={dataPacketAward}
                      title="DATA PACKETS"
                      theme="retro-desktop"
                    />
                  </Box>
                )}
              </Box>

              <Box
                bg="#efebe7"
                border="1px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                px={4}
                py={3}
              >
                <SocialShareButtons
                  url={window.location.origin}
                  text="I just beat the CodeGrind demo and unlocked my coding path. Come try it! 🚀 #CodeGrind #coding"
                  label="Share your demo win"
                  surface="path_choice_completion"
                  theme="retro-desktop"
                />
              </Box>
            </VStack>

            <Box px={{ base: 4, md: 5 }} pt={4}>
              <Text
                color="#1f2430"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                fontSize="sm"
                letterSpacing="0.08em"
                fontWeight="700"
                textTransform="uppercase"
              >
                {isReturningGuest
                  ? 'Continue your path'
                  : step === 'language'
                    ? 'Choose your language'
                    : 'Choose your next chapter'}
              </Text>
            </Box>

            <AnimatePresence mode="wait">
              {step === 'track' ? (
                <MotionBox
                  key="track-step"
                  w="100%"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                >
                  <VStack spacing={4} px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }}>
                    {visibleTracks.map(([key, track], index) => (
                      <MotionBox
                        key={key}
                        w="100%"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.12, duration: 0.35 }}
                      >
                        <Button
                          w="100%"
                          h="auto"
                          py={5}
                          px={6}
                          bg="#d4d0c8"
                          border="1px solid"
                          borderColor="#7f7f7f"
                          borderRadius="0"
                          boxShadow="var(--cg-window-outset)"
                          _hover={{
                            bg: '#efebe7',
                            borderColor: '#5d636e',
                          }}
                          _active={{
                            boxShadow: 'var(--cg-window-inset)',
                            transform: 'translateY(1px)',
                          }}
                          transition="all 0.25s ease"
                          onClick={() => handleTrackClick(key)}
                          display="flex"
                          flexDirection="column"
                          alignItems="flex-start"
                          textAlign="left"
                          whiteSpace="normal"
                          position="relative"
                          overflow="hidden"
                          gap={1}
                        >
                          <Badge
                            bg="#f7f3e8"
                            color={track.color}
                            border="1px solid #7f7f7f"
                            borderRadius="0"
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            fontWeight="700"
                            letterSpacing="0.08em"
                            fontSize="10px"
                          >
                            {track.chip}
                          </Badge>
                          <Text
                            color={track.color}
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            fontSize={{ base: 'sm', md: 'md' }}
                            fontWeight="bold"
                            letterSpacing="0.1em"
                          >
                            {track.label}
                          </Text>
                          <Text
                            color="#3b4250"
                            fontSize="xs"
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            lineHeight="1.5"
                          >
                            {track.sublabel}
                          </Text>
                          {track.sublabelHighlight && (
                            <Text
                              color={track.color}
                              fontSize={{ base: 'sm', md: 'sm' }}
                              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                              fontWeight="800"
                              lineHeight="1.55"
                            >
                              {track.sublabelHighlight}
                            </Text>
                          )}
                        </Button>
                      </MotionBox>
                    ))}
                  </VStack>
                </MotionBox>
              ) : (
                <MotionBox
                  key="language-step"
                  w="100%"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22 }}
                >
                  <VStack spacing={3} px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }}>
                    <Box w="100%">
                      <Box
                        as="button"
                        onClick={() => setStep('track')}
                        color="#0a2c9a"
                        fontSize="xs"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                        fontWeight="700"
                        letterSpacing="0.06em"
                        _hover={{ color: '#081a77' }}
                        transition="color 0.2s ease"
                        bg="transparent"
                        border="none"
                        cursor="pointer"
                        pb={3}
                        display="block"
                      >
                        ← BACK
                      </Box>
                    </Box>

                    {LANGUAGES.map((lang, index) => (
                      <MotionBox
                        key={lang.code}
                        w="100%"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 + index * 0.07, duration: 0.28 }}
                      >
                        <Button
                          w="100%"
                          h="auto"
                          py={4}
                          px={6}
                          bg={lang.available ? '#d4d0c8' : '#c7c2b8'}
                          border="1px solid"
                          borderColor={lang.available ? '#7f7f7f' : '#9f9b94'}
                          borderRadius="0"
                          boxShadow={lang.available ? 'var(--cg-window-outset)' : 'none'}
                          _hover={
                            lang.available
                              ? {
                                  bg: '#efebe7',
                                  borderColor: '#5d636e',
                                }
                              : {}
                          }
                          _active={lang.available ? { boxShadow: 'var(--cg-window-inset)' } : {}}
                          transition="all 0.25s ease"
                          onClick={() =>
                            lang.available &&
                            handleChoice('beginner', {
                              learningPathId: lang.pathId,
                            })
                          }
                          cursor={lang.available ? 'pointer' : 'default'}
                          opacity={lang.available ? 1 : 0.4}
                          display="flex"
                          flexDirection="column"
                          alignItems="flex-start"
                          textAlign="left"
                          whiteSpace="normal"
                          gap={1.5}
                        >
                          <HStack justify="space-between" w="100%" align="center">
                            <Text
                              color={lang.available ? '#0f6f17' : '#61656f'}
                              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                              fontSize="sm"
                              fontWeight="bold"
                              letterSpacing="0.1em"
                            >
                              {lang.label}
                            </Text>
                            {lang.tag && lang.available && (
                              <Badge
                                bg="#f7f3e8"
                                color="#0f6f17"
                                border="1px solid #7f7f7f"
                                borderRadius="0"
                                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                                fontWeight="700"
                                letterSpacing="0.06em"
                                fontSize="9px"
                                flexShrink={0}
                              >
                                {lang.tag}
                              </Badge>
                            )}
                            {!lang.available && (
                              <Badge
                                bg="#ddd8ce"
                                color="#61656f"
                                border="1px solid #9f9b94"
                                borderRadius="0"
                                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                                fontWeight="700"
                                letterSpacing="0.06em"
                                fontSize="9px"
                                flexShrink={0}
                              >
                                COMING SOON
                              </Badge>
                            )}
                          </HStack>
                          <Text
                            color="#3b4250"
                            fontSize="xs"
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            lineHeight="1.5"
                          >
                            {lang.sublabel}
                          </Text>
                        </Button>
                      </MotionBox>
                    ))}

                    <MotionBox
                      w="100%"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45, duration: 0.3 }}
                    >
                      <Box
                        bg="#efebe7"
                        border="1px solid #7f7f7f"
                        boxShadow="var(--cg-window-inset)"
                        px={4}
                        py={3}
                        textAlign="center"
                      >
                        <Text
                          color="#1f2430"
                          fontSize="xs"
                          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                          lineHeight="1.6"
                        >
                          Guest trial locks you to one language.{' '}
                          <Box as="span" color="#0a2c9a" fontWeight="700">
                            Sign up free
                          </Box>{' '}
                          to unlock all 4 paths, save your progress, and switch languages anytime.
                        </Text>
                      </Box>
                    </MotionBox>
                  </VStack>
                </MotionBox>
              )}
            </AnimatePresence>

            <Box
              px={{ base: 4, md: 5 }}
              pb={6}
              pt={2}
              textAlign="center"
              borderTop="1px solid #a7a39b"
            >
              <Text
                color="#4f5665"
                fontSize="xs"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              >
                {isReturningGuest
                  ? 'Sign up to unlock both tracks, save your progress, and earn full XP.'
                  : 'Guest trial is single-track and single-language. Sign up to unlock everything and sync progress.'}
              </Text>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
