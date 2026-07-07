import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import getAssetUrl from '../../utils/assets/assetUrl';
import AudioService from '../../utils/audio/AudioService';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';

const TowerDefenseV2Page = lazy(() => import('../games/towerDefenseV2/TowerDefenseV2Page'));

/**
 * HomepageTDDemo — renders the REAL tower defense onboarding level
 * (the same one from the Learning Path "Hello Print" mission)
 * embedded on the homepage via the `embedded` flag (no PageTemplate / ads).
 */

const ONBOARDING_TOWER_CONFIG = {
  allowedTowers: ['Function', 'Object', 'BurstTurret', 'BlastTurret', 'Log'],
  waves: 2,
  problems: 1,
  multiTab: false,
  learningProblemSlug: 'lp-m0-td-hello-print',
  onboardingId: 'lp-m0-onboarding',
};

const LEARNING_PATH_META = {
  pathId: 'python-path',
  nodeId: 'py-m0-tower-hello',
  moduleId: 'py-m0-hello',
};

const MotionBox = motion(Box);
const RETRO_DISPLAY_FONT = 'var(--cg-font-retro-display)';
const RETRO_TERMINAL_FONT = 'var(--cg-font-retro-terminal)';
const BOOT_TIMELINE_MS = {
  stage1: 1800,
  stage2: 4200,
  stage3: 7300,
  dismiss: 9800,
};
const BOOT_INTRO_LINES = [
  '> codegrind://demo-shell',
  '> stack: react + chakra + framer-motion + node + postgres',
  '> initializing game intro runtime...',
];
const BOOT_INTRO_PRODUCTION_LINE = '> A Riviera Sperduto Production';
const BOOT_INTRO_LINE_REVEAL_MS = 980;
const BOOT_INTRO_PRODUCTION_DELAY_MS = 240;
const BOOT_INTRO_PRODUCTION_TYPE_MS = 1150;
const BOOT_INTRO_PRODUCTION_HOLD_MS = 950;
const BOOT_INTRO_BOOTLINE = '> run codegrind.exe';
const BOOT_INTRO_BOOTLINE_DELAY_MS = 240;
const BOOT_INTRO_BOOTLINE_TYPE_MS = 980;
const BOOT_INTRO_BOOTLINE_HOLD_MS = 0;
const BOOT_INTRO_BEEP_DURATION_MS = 220;
const BOOT_INTRO_BEEP_FALLBACK_SRC = getAssetUrl(
  '/audio/generated_sound_effects/event_sound_effects/cyberpunk_buttonclick.wav'
);
const BOOT_INTRO_PRODUCTION_TYPED_DONE_MS =
  BOOT_INTRO_LINES.length * BOOT_INTRO_LINE_REVEAL_MS +
  BOOT_INTRO_PRODUCTION_DELAY_MS +
  BOOT_INTRO_PRODUCTION_TYPE_MS;
const BOOT_INTRO_BOOTLINE_START_MS =
  BOOT_INTRO_PRODUCTION_TYPED_DONE_MS +
  BOOT_INTRO_PRODUCTION_HOLD_MS +
  BOOT_INTRO_BOOTLINE_DELAY_MS;
const BOOT_INTRO_BOOTLINE_TYPED_DONE_MS =
  BOOT_INTRO_BOOTLINE_START_MS + BOOT_INTRO_BOOTLINE_TYPE_MS;
const BOOT_INTRO_TOTAL_MS = BOOT_INTRO_BOOTLINE_TYPED_DONE_MS + BOOT_INTRO_BOOTLINE_HOLD_MS;
const BOOT_INTRO_TYPING_AUDIO_SRC = getAssetUrl(
  '/audio/freesound_community-keyboard-typing-5997.mp3'
);
const BOOT_AUDIO_FALLBACK_MS = 12000;
const BOOT_OVERLAY_EXIT_MS = 600;

const ASCII_LOGO_LINES = [
  '   CCC    OOO   DDDD   EEEE   GGG   RRRR   III   N   N  DDDD ',
  '  C      O   O  D   D  E     G      R   R   I    NN  N  D   D',
  '  C      O   O  D   D  EEE   G  GG  RRRR    I    N N N  D   D',
  '  C      O   O  D   D  E     G   G  R  R    I    N  NN  D   D',
  '   CCC    OOO   DDDD   EEEE   GGG   R   R  III   N   N  DDDD ',
  '                         C O D E G R I N D                        ',
  '                 breach interface :: retro future stack           ',
];

const BOOT_TRACE_LINES = [
  '[ AUTH ] guest_operator granted shell access',
  '[ BUS  ] display rails synchronized',
  '[ SLOT ] game matrix linked to mission feed',
  '[ CODE ] synthesis cache waking from standby',
  '[ GRID ] tower placement lattice calibrated',
  '[ COMM ] operator chatter uplink stable',
];

const BOOT_SEQUENCE = [
  { id: 'paint', label: 'Painting terminal surface', detail: 'Routing display buses...' },
  { id: 'split', label: 'Splitting slot matrices', detail: 'Allocating breach surfaces...' },
  { id: 'warm', label: 'Warming control rails', detail: 'Synth indicators coming online...' },
  { id: 'revealed', label: 'Mission feed online', detail: 'Demo live.' },
];

const BOOT_MODULES = [
  {
    id: 'game',
    top: { base: '10%', md: '10%' },
    left: '4%',
    width: { base: '92%', md: '46%' },
    height: { base: '33%', md: '62%' },
    accent: 'rgba(36, 106, 42, 0.28)',
    glow: 'rgba(36, 106, 42, 0.14)',
  },
  {
    id: 'inventory',
    top: { base: '46%', md: '10%' },
    left: { base: '4%', md: '52%' },
    width: { base: '92%', md: '20%' },
    height: { base: '18%', md: '62%' },
    accent: 'rgba(0, 0, 128, 0.28)',
    glow: 'rgba(0, 0, 128, 0.12)',
  },
  {
    id: 'brief',
    top: { base: '68%', md: '10%' },
    right: '4%',
    width: { base: '92%', md: '24%' },
    height: { base: '18%', md: '62%' },
    accent: 'rgba(118, 81, 0, 0.28)',
    glow: 'rgba(118, 81, 0, 0.12)',
  },
  {
    id: 'command',
    left: '4%',
    right: '4%',
    bottom: '8%',
    height: { base: '14%', md: '14%' },
    accent: 'rgba(0, 0, 128, 0.3)',
    glow: 'rgba(0, 0, 128, 0.12)',
  },
];

const getTypedProgress = (value, progress) => {
  if (!value) return '';

  const visibleLength = Math.max(1, Math.floor(value.length * progress));
  return value.slice(0, visibleLength);
};

const getTypedLines = (lines, progress) => {
  if (!Array.isArray(lines) || !lines.length) {
    return [];
  }

  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);
  const visibleChars = Math.max(0, Math.floor(totalChars * progress));
  let remainingChars = visibleChars;

  return lines.map((line) => {
    if (remainingChars <= 0) {
      return '';
    }

    const visibleLine = line.slice(0, remainingChars);
    remainingChars -= line.length;
    return visibleLine;
  });
};

/**
 * Memo-fenced wrapper for TowerDefenseV2Page.  Defined at module level so it
 * is never recreated.  It only re-renders when `bootUiReady` or `revealPhase`
 * change — not every 40 ms when the intro timer ticks.
 */
const TDGameSection = React.memo(function TDGameSection({
  bootUiReady,
  revealPhase,
  onboardingComplete,
  embeddedShellTheme = 'retro-desktop',
  allowEmbeddedHandheldPageScroll = false,
  onVictory,
  onLearningXp,
  onReady,
  onEmbeddedChatFocusChange,
  demoLaunchStartTime = null,
}) {
  const isDemoVisible = bootUiReady;
  const useViewportRetroShell = embeddedShellTheme === 'retro-desktop';
  const useScrollableHandheldRetroShell = useViewportRetroShell && allowEmbeddedHandheldPageScroll;
  return (
    <MotionBox
      initial={false}
      animate={{
        opacity: isDemoVisible ? 1 : 0,
        scale: isDemoVisible ? 1 : 0.988,
        y: isDemoVisible && revealPhase === 'launching' ? 12 : 0,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      minH={useViewportRetroShell ? '100dvh' : 'inherit'}
      h={useViewportRetroShell && !useScrollableHandheldRetroShell ? '100dvh' : undefined}
      display="flex"
      flexDirection="column"
      visibility={isDemoVisible ? 'visible' : 'hidden'}
    >
      <Suspense
        fallback={
          <Box
            minH={useViewportRetroShell ? '100dvh' : 'inherit'}
            h={useViewportRetroShell && !useScrollableHandheldRetroShell ? '100dvh' : undefined}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={4}
          >
            <Spinner size="xl" color="#00ff8c" thickness="3px" />
            <Text color="gray.500" fontFamily="monospace" fontSize="sm">
              Loading tower defense...
            </Text>
          </Box>
        }
      >
        <TowerDefenseV2Page
          learningPathTitleSlug="lp-m0-td-hello-print"
          learningPathOnboarding={!onboardingComplete}
          learningTowerConfig={ONBOARDING_TOWER_CONFIG}
          learningPathSlug="python-path"
          learningIsCapstone={false}
          learningPathMeta={LEARNING_PATH_META}
          embedded
          embeddedBootSequenceActive={!bootUiReady}
          embeddedShellTheme={embeddedShellTheme}
          allowEmbeddedHandheldPageScroll={allowEmbeddedHandheldPageScroll}
          onEmbeddedVictory={onVictory}
          onEmbeddedLearningXp={onLearningXp}
          onEmbeddedReady={onReady}
          onEmbeddedChatFocusChange={onEmbeddedChatFocusChange}
          demoLaunchStartTime={demoLaunchStartTime}
        />
      </Suspense>
    </MotionBox>
  );
});

const playBeep = () => {
  try {
    const beepAudio = new Audio(BOOT_INTRO_BEEP_FALLBACK_SRC);
    beepAudio.volume = 0.62;
    beepAudio.preload = 'auto';
    beepAudio.playsInline = true;
    beepAudio.currentTime = 0;
    beepAudio.play().catch(() => {});
  } catch {
    // best effort — ignore backup beep playback errors
  }
};

const HomepageTDDemo = ({
  bootPrepDelayMs = 0,
  revealPhase = 'active',
  overlayMode = 'viewport',
  embeddedShellTheme = 'retro-desktop',
  allowEmbeddedHandheldPageScroll = false,
  skipBootSequence = false,
  onVictory,
  onReady,
  onLearningXp,
  onBootStateChange,
  onEmbeddedChatFocusChange,
  preinitTypingAudio,
  demoLaunchStartTime = null,
}) => {
  const { user } = useAuth();
  const funnel = useGuestFunnel();

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('cg_demo_start_time')) {
        sessionStorage.setItem('cg_demo_start_time', String(Date.now()));
      }
    } catch {
      // ignore
    }

    const handleSessionEnd = () => {
      try {
        const startTime = sessionStorage.getItem('cg_demo_start_time');
        const duration = startTime ? Date.now() - Number(startTime) : 0;

        funnel.guestSessionEnded({
          lastTutorialStep: sessionStorage.getItem('cg_last_tutorial_step') || 'none',
          demoDuration: String(duration),
          editorOpened: sessionStorage.getItem('cg_editor_opened') || 'false',
          problemOpened: sessionStorage.getItem('cg_problem_opened') || 'false',
        });
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', handleSessionEnd);
    window.addEventListener('pagehide', handleSessionEnd);

    return () => {
      window.removeEventListener('beforeunload', handleSessionEnd);
      window.removeEventListener('pagehide', handleSessionEnd);
      handleSessionEnd();
    };
  }, [funnel]);
  const [bootIntroElapsedMs, setBootIntroElapsedMs] = useState(
    skipBootSequence ? BOOT_INTRO_TOTAL_MS : 0
  );
  const [bootIntroComplete, setBootIntroComplete] = useState(skipBootSequence);
  const [bootStageIndex, setBootStageIndex] = useState(skipBootSequence ? 3 : 0);
  const [typedProgress, setTypedProgress] = useState(0);
  const [bootDrawProgress, setBootDrawProgress] = useState(skipBootSequence ? 1 : 0);
  const [bootTimelineComplete, setBootTimelineComplete] = useState(skipBootSequence);
  const [bootAudioComplete, setBootAudioComplete] = useState(skipBootSequence);
  const [introTypingAudioStarted, setIntroTypingAudioStarted] = useState(skipBootSequence);
  const [introTypingFinished, setIntroTypingFinished] = useState(skipBootSequence);
  const [bootUiReady, setBootUiReady] = useState(skipBootSequence);
  const [isBootPrepComplete, setIsBootPrepComplete] = useState(
    () => skipBootSequence || bootPrepDelayMs <= 0
  );
  const introTypingAudioRef = useRef(null);
  const introTypingRetryCleanupRef = useRef(null);
  const bootIntroTransitionStartedRef = useRef(false);
  const bootIntroTransitionTimerRef = useRef(null);
  const bootDismissed = bootTimelineComplete && bootAudioComplete;

  // Stable callback refs — let TDGameSection memo never break on prop change
  const onVictoryRef = useRef(onVictory);
  const onReadyRef = useRef(onReady);
  const onLearningXpRef = useRef(onLearningXp);
  const onEmbeddedChatFocusChangeRef = useRef(onEmbeddedChatFocusChange);
  onVictoryRef.current = onVictory;
  onReadyRef.current = onReady;
  onLearningXpRef.current = onLearningXp;
  onEmbeddedChatFocusChangeRef.current = onEmbeddedChatFocusChange;
  const stableOnVictory = React.useCallback((...args) => onVictoryRef.current?.(...args), []);
  const stableOnReady = React.useCallback((...args) => onReadyRef.current?.(...args), []);
  const stableOnLearningXp = React.useCallback((...args) => onLearningXpRef.current?.(...args), []);
  const stableOnEmbeddedChatFocusChange = React.useCallback(
    (...args) => onEmbeddedChatFocusChangeRef.current?.(...args),
    []
  );

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (bootPrepDelayMs <= 0) {
      setIsBootPrepComplete(true);
      return undefined;
    }

    setIsBootPrepComplete(false);

    const timerId = window.setTimeout(() => {
      setIsBootPrepComplete(true);
    }, bootPrepDelayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [bootPrepDelayMs, skipBootSequence]);

  useEffect(() => {
    if (skipBootSequence) return undefined;
    setBootIntroElapsedMs(0);
    setBootIntroComplete(false);
    setBootStageIndex(0);
    setBootDrawProgress(0);
    setBootTimelineComplete(false);
    setBootAudioComplete(false);
    setIntroTypingAudioStarted(false);
    setIntroTypingFinished(false);
    setBootUiReady(false);
    bootIntroTransitionStartedRef.current = false;

    if (bootIntroTransitionTimerRef.current) {
      window.clearTimeout(bootIntroTransitionTimerRef.current);
      bootIntroTransitionTimerRef.current = null;
    }

    let fallbackAudioMs = BOOT_AUDIO_FALLBACK_MS;
    let audioFallbackTimerId = window.setTimeout(() => setBootAudioComplete(true), fallbackAudioMs);

    const scheduleAudioFallback = (durationMs) => {
      if (audioFallbackTimerId) {
        window.clearTimeout(audioFallbackTimerId);
      }
      audioFallbackTimerId = window.setTimeout(() => setBootAudioComplete(true), durationMs);
    };

    const handleBootAudioStart = (event) => {
      const candidateMs = Number(event?.detail?.maxWaitMs);
      if (Number.isFinite(candidateMs) && candidateMs > 0) {
        fallbackAudioMs = candidateMs;
        scheduleAudioFallback(fallbackAudioMs);
      }
    };

    const handleBootAudioEnd = () => {
      setBootAudioComplete(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('home-demo-boot-audio-start', handleBootAudioStart);
      window.addEventListener('home-demo-boot-audio-end', handleBootAudioEnd);
    }

    return () => {
      if (audioFallbackTimerId) {
        window.clearTimeout(audioFallbackTimerId);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('home-demo-boot-audio-start', handleBootAudioStart);
        window.removeEventListener('home-demo-boot-audio-end', handleBootAudioEnd);
      }
    };
  }, [skipBootSequence]);

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (!introTypingAudioStarted) {
      return undefined;
    }

    const introStart = window.performance.now();
    const intervalId = window.setInterval(() => {
      const elapsedMs = window.performance.now() - introStart;
      const capped = Math.min(elapsedMs, BOOT_INTRO_TOTAL_MS);
      setBootIntroElapsedMs(capped);
      if (elapsedMs < BOOT_INTRO_TOTAL_MS) {
        return;
      }
      window.clearInterval(intervalId);
      setIntroTypingFinished(true);
    }, 40);
    return () => window.clearInterval(intervalId);
  }, [introTypingAudioStarted, skipBootSequence]);

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (!bootIntroComplete) {
      return undefined;
    }

    const timers = [
      window.setTimeout(() => setBootStageIndex(1), BOOT_TIMELINE_MS.stage1),
      window.setTimeout(() => setBootStageIndex(2), BOOT_TIMELINE_MS.stage2),
      window.setTimeout(() => setBootStageIndex(3), BOOT_TIMELINE_MS.stage3),
      window.setTimeout(() => setBootTimelineComplete(true), BOOT_TIMELINE_MS.dismiss),
    ];

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [bootIntroComplete, skipBootSequence]);

  const activeBootStage = useMemo(
    () => BOOT_SEQUENCE[Math.min(bootStageIndex, BOOT_SEQUENCE.length - 1)],
    [bootStageIndex]
  );

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (!bootIntroComplete) {
      return undefined;
    }

    setTypedProgress(0);

    const typingDurationMs = activeBootStage.id === 'revealed' ? 2600 : 1500;
    const start = window.performance.now();
    const intervalId = window.setInterval(() => {
      const progress = Math.min(1, (window.performance.now() - start) / typingDurationMs);
      setTypedProgress(progress);
      if (progress >= 1) window.clearInterval(intervalId);
    }, 40);
    return () => window.clearInterval(intervalId);
  }, [activeBootStage, bootIntroComplete, skipBootSequence]);

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (!bootIntroComplete) {
      return undefined;
    }

    const drawDurationMs = Math.max(1200, BOOT_TIMELINE_MS.dismiss - 450);
    const start = window.performance.now();
    const intervalId = window.setInterval(() => {
      const progress = Math.min(1, (window.performance.now() - start) / drawDurationMs);
      setBootDrawProgress(progress);
      if (progress >= 1) window.clearInterval(intervalId);
    }, 40);
    return () => window.clearInterval(intervalId);
  }, [bootIntroComplete, skipBootSequence]);

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (!bootDismissed) {
      setBootUiReady(false);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setBootUiReady(true);
    }, BOOT_OVERLAY_EXIT_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [bootDismissed, skipBootSequence]);

  useEffect(() => {
    onBootStateChange?.(bootUiReady);
  }, [bootUiReady, onBootStateChange]);

  const showBootWarmupHold = !isBootPrepComplete && !bootIntroComplete;
  const introTypingActive =
    isBootPrepComplete &&
    !bootIntroComplete &&
    bootIntroElapsedMs < BOOT_INTRO_BOOTLINE_TYPED_DONE_MS;

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!introTypingAudioRef.current) {
      // Prefer the pre-created element started synchronously in the click
      // handler — this ensures audio plays even on browsers that have already
      // cleared the user-activation window by the time effects fire.
      if (preinitTypingAudio?.current) {
        introTypingAudioRef.current = preinitTypingAudio.current;
      } else {
        const introTypingAudio = new Audio(BOOT_INTRO_TYPING_AUDIO_SRC);
        introTypingAudio.loop = true;
        introTypingAudio.preload = 'auto';
        introTypingAudio.volume = 0.34;
        introTypingAudioRef.current = introTypingAudio;
      }
    }

    const introTypingAudio = introTypingAudioRef.current;

    const clearRetryListeners = () => {
      if (!introTypingRetryCleanupRef.current) return;
      introTypingRetryCleanupRef.current();
      introTypingRetryCleanupRef.current = null;
    };

    const attachRetryListeners = () => {
      clearRetryListeners();

      const retryPlay = () => {
        const maybeRetryPromise = introTypingAudio.play();
        if (maybeRetryPromise?.then) {
          maybeRetryPromise
            .then(() => {
              setIntroTypingAudioStarted(true);
              clearRetryListeners();
            })
            .catch(() => {
              // Keep listeners attached until a successful user-driven play occurs.
            });
          return;
        }

        clearRetryListeners();
      };

      const options = { passive: true };
      window.addEventListener('pointerdown', retryPlay, options);
      window.addEventListener('touchstart', retryPlay, options);
      window.addEventListener('keydown', retryPlay);

      introTypingRetryCleanupRef.current = () => {
        window.removeEventListener('pointerdown', retryPlay, options);
        window.removeEventListener('touchstart', retryPlay, options);
        window.removeEventListener('keydown', retryPlay);
      };
    };

    if (introTypingActive) {
      // If already playing (started by Home's click handler), skip the play
      // call to avoid a redundant promise and potential Safari quirk.
      if (introTypingAudio.paused) {
        const maybePlayPromise = introTypingAudio.play();
        if (maybePlayPromise?.then) {
          maybePlayPromise
            .then(() => {
              setIntroTypingAudioStarted(true);
              clearRetryListeners();
            })
            .catch(() => {
              attachRetryListeners();
            });
        } else {
          setIntroTypingAudioStarted(true);
        }
      } else {
        setIntroTypingAudioStarted(true);
        clearRetryListeners();
      }
      return undefined;
    }

    clearRetryListeners();
    introTypingAudio.pause();
    introTypingAudio.currentTime = 0;
    return undefined;
  }, [introTypingActive, preinitTypingAudio, skipBootSequence]);

  useEffect(
    () => () => {
      if (bootIntroTransitionTimerRef.current) {
        window.clearTimeout(bootIntroTransitionTimerRef.current);
        bootIntroTransitionTimerRef.current = null;
      }

      if (introTypingRetryCleanupRef.current) {
        introTypingRetryCleanupRef.current();
        introTypingRetryCleanupRef.current = null;
      }

      if (!introTypingAudioRef.current) {
        return;
      }

      introTypingAudioRef.current.pause();
      introTypingAudioRef.current.currentTime = 0;
      introTypingAudioRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (skipBootSequence) return undefined;
    if (!introTypingFinished || introTypingActive) {
      return;
    }

    if (bootIntroTransitionStartedRef.current) {
      return;
    }

    bootIntroTransitionStartedRef.current = true;
    playBeep();

    bootIntroTransitionTimerRef.current = window.setTimeout(() => {
      setBootIntroComplete(true);
      AudioService.playBeginDemoSequence().catch(() => {
        // Best effort: visual timeline fallback still completes boot state.
      });
    }, BOOT_INTRO_BEEP_DURATION_MS);
  }, [introTypingFinished, introTypingActive, skipBootSequence]);

  const isContainedOverlay = overlayMode === 'container';
  const isRetroDesktopTheme = embeddedShellTheme === 'retro-desktop';
  const demoMinHeight = isContainedOverlay
    ? '100%'
    : isRetroDesktopTheme
      ? '100dvh'
      : bootUiReady
        ? 'auto'
        : {
            base: '72vh',
            lg: '66vh',
          };
  const bootOverlayStage = bootDismissed
    ? 'dismissed'
    : showBootWarmupHold
      ? 'warmup'
      : !bootIntroComplete
        ? 'intro'
        : 'timeline';

  const bootProgress = bootStageIndex / (BOOT_SEQUENCE.length - 1);
  const typedLabel = getTypedProgress(activeBootStage.label, typedProgress);
  const typedDetail = getTypedProgress(activeBootStage.detail, Math.min(1, typedProgress * 1.18));
  const typedSystemLine = getTypedProgress(
    `SYS_PWR ${Math.round(bootProgress * 100)
      .toString()
      .padStart(3, '0')}% :: SLOT_GRID PRIMED`,
    Math.min(1, Math.max(typedProgress, bootDrawProgress) * 1.24)
  );
  const typedAsciiLogo = getTypedLines(ASCII_LOGO_LINES, Math.min(1, bootDrawProgress * 1.08));
  const typedBootTrace = getTypedLines(BOOT_TRACE_LINES, Math.min(1, bootDrawProgress * 1.22));
  const introProductionStartMs =
    BOOT_INTRO_LINES.length * BOOT_INTRO_LINE_REVEAL_MS + BOOT_INTRO_PRODUCTION_DELAY_MS;
  const introLineProgress = BOOT_INTRO_LINES.map((_, index) => {
    const lineStartMs = index * BOOT_INTRO_LINE_REVEAL_MS;
    return Math.min(1, Math.max(0, (bootIntroElapsedMs - lineStartMs) / BOOT_INTRO_LINE_REVEAL_MS));
  });
  const introTypedLines = BOOT_INTRO_LINES.map((line, index) => {
    return getTypedProgress(line, introLineProgress[index]);
  });
  const introProductionProgress = Math.min(
    1,
    Math.max(0, (bootIntroElapsedMs - introProductionStartMs) / BOOT_INTRO_PRODUCTION_TYPE_MS)
  );
  const typedProductionLine = getTypedProgress(BOOT_INTRO_PRODUCTION_LINE, introProductionProgress);
  const introBootlineProgress = Math.min(
    1,
    Math.max(0, (bootIntroElapsedMs - BOOT_INTRO_BOOTLINE_START_MS) / BOOT_INTRO_BOOTLINE_TYPE_MS)
  );
  const typedBootline = getTypedProgress(BOOT_INTRO_BOOTLINE, introBootlineProgress);
  const introActiveLineIndex = introLineProgress.findIndex(
    (progress) => progress > 0 && progress < 1
  );
  const showIntroCursorOnProduction = introActiveLineIndex === -1 && introProductionProgress < 1;
  const showIntroCursorOnBootline =
    introActiveLineIndex === -1 && introProductionProgress >= 1 && introBootlineProgress < 1;
  return (
    <Box
      w="100%"
      h={
        isContainedOverlay
          ? '100%'
          : isRetroDesktopTheme && !allowEmbeddedHandheldPageScroll
            ? '100dvh'
            : undefined
      }
      minH={demoMinHeight}
      position="relative"
      display="flex"
      flexDirection="column"
      overflow={isContainedOverlay ? 'hidden' : 'visible'}
      data-boot-overlay-stage={bootOverlayStage}
      data-tutorial="homepage-demo-root"
    >
      <TDGameSection
        bootUiReady={bootUiReady}
        revealPhase={revealPhase}
        onboardingComplete={user?.onboardingComplete}
        embeddedShellTheme={embeddedShellTheme}
        allowEmbeddedHandheldPageScroll={allowEmbeddedHandheldPageScroll}
        onVictory={stableOnVictory}
        onLearningXp={stableOnLearningXp}
        onReady={stableOnReady}
        onEmbeddedChatFocusChange={stableOnEmbeddedChatFocusChange}
        demoLaunchStartTime={demoLaunchStartTime}
      />

      <AnimatePresence>
        {!bootDismissed &&
          (showBootWarmupHold ? (
            <MotionBox
              key="homepage-demo-boot-warmup"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              position={isContainedOverlay ? 'absolute' : 'fixed'}
              inset={0}
              zIndex={1200}
              pointerEvents="none"
              bg="#020702"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset={0}
                opacity={0.08}
                bgImage="linear-gradient(transparent 0%, rgba(0,255,120,0.18) 49%, transparent 100%)"
                bgSize="100% 3px"
              />
              <Box
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={{ base: 4, sm: 5, md: 8 }}
                py={{ base: 6, md: 8 }}
              >
                <VStack
                  spacing={2}
                  color="#7dff9e"
                  fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
                  textAlign="center"
                  textShadow="0 0 8px rgba(125,255,158,0.26)"
                >
                  <Text
                    fontSize={{ base: '13px', md: '17px' }}
                    letterSpacing="0.04em"
                    textTransform="uppercase"
                  >
                    Stabilizing demo shell...
                  </Text>
                  <Text fontSize={{ base: '11px', md: '13px' }} opacity={0.82}>
                    Holding the boot sequence until the mission surface settles.
                  </Text>
                </VStack>
              </Box>
            </MotionBox>
          ) : !bootIntroComplete ? (
            <MotionBox
              key="homepage-demo-boot-intro"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              position={isContainedOverlay ? 'absolute' : 'fixed'}
              inset={0}
              zIndex={1200}
              pointerEvents="none"
              bg="#020702"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset={0}
                opacity={0.1}
                bgImage="linear-gradient(transparent 0%, rgba(0,255,120,0.22) 49%, transparent 100%)"
                bgSize="100% 3px"
              />
              <Box
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={{ base: 4, sm: 5, md: 8 }}
                py={{ base: 6, md: 8 }}
              >
                <Box
                  w="100%"
                  maxW="980px"
                  color="#7dff9e"
                  fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
                  fontSize={{ base: '13px', md: '17px' }}
                  lineHeight="1.7"
                  letterSpacing="0.02em"
                  textShadow="0 0 8px rgba(125,255,158,0.26)"
                >
                  {introTypedLines.map((line, index) => (
                    <Text key={`intro-line-${index}`} whiteSpace="pre-wrap" minH="1.7em">
                      {line}
                      <Box
                        as="span"
                        opacity={introActiveLineIndex === index ? 1 : 0}
                        color="#c8ffd4"
                      >
                        ▌
                      </Box>
                    </Text>
                  ))}

                  <Text whiteSpace="pre-wrap" minH="1.7em" mt={1}>
                    {typedProductionLine}
                    <Box as="span" opacity={showIntroCursorOnProduction ? 1 : 0} color="#c8ffd4">
                      ▌
                    </Box>
                  </Text>

                  {introBootlineProgress > 0 && (
                    <Text whiteSpace="pre-wrap" minH="1.7em">
                      {typedBootline}
                      <Box as="span" opacity={showIntroCursorOnBootline ? 1 : 0} color="#c8ffd4">
                        ▌
                      </Box>
                    </Text>
                  )}
                </Box>
              </Box>
            </MotionBox>
          ) : (
            <MotionBox
              key="homepage-demo-boot"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              position={isContainedOverlay ? 'absolute' : 'fixed'}
              inset={0}
              zIndex={1200}
              pointerEvents="none"
              bg="linear-gradient(180deg, rgba(18, 82, 95, 0.98) 0%, rgba(10, 59, 72, 0.96) 100%)"
              boxShadow="inset 0 0 0 2px rgba(0, 0, 0, 0.32)"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset={0}
                opacity={0.12}
                bgImage="linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)"
                bgSize="26px 26px"
              />
              <Box
                position="absolute"
                inset={0}
                bg="radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 35%, transparent 72%)"
                opacity={0.28}
              />
              <Box
                position="absolute"
                inset={0}
                opacity={0.08}
                bg="repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px)"
              />
              <Box
                position="absolute"
                top="10%"
                left="4%"
                right="4%"
                height="1px"
                bg="rgba(255,255,255,0.3)"
                boxShadow="0 0 12px rgba(255,255,255,0.12)"
                opacity={0.55}
              />
              <MotionBox
                position="absolute"
                left={0}
                right={0}
                h="2px"
                bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)"
                boxShadow="0 0 12px rgba(255,255,255,0.22)"
                animate={{ top: ['8%', '82%'] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
              />

              <Box
                position="absolute"
                top={{ base: '7%', md: '8%' }}
                left="50%"
                transform="translateX(-50%)"
                w={{ base: '94%', md: '92%' }}
                maxW="980px"
                zIndex={5}
                overflow="hidden"
                bg="var(--cg-window-face)"
                border="2px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-outset), 16px 16px 0 rgba(0, 0, 0, 0.18)"
              >
                <Box
                  px={{ base: 3, md: 4 }}
                  py={2}
                  bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
                  borderBottom="1px solid rgba(17,17,17,0.72)"
                >
                  <Text
                    color="var(--cg-header-text)"
                    fontFamily={RETRO_DISPLAY_FONT}
                    fontSize={{ base: '12px', md: '13px' }}
                    fontWeight="700"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                  >
                    demo_boot.exe
                  </Text>
                </Box>

                <VStack
                  align="center"
                  spacing={2}
                  px={{ base: 5, md: 6 }}
                  py={{ base: 4, md: 5 }}
                  bg="rgba(255,255,255,0.14)"
                  textAlign="center"
                >
                  <Text
                    color="var(--cg-link)"
                    fontSize={{ base: 'lg', md: '2xl' }}
                    fontFamily={RETRO_DISPLAY_FONT}
                    fontWeight="700"
                    letterSpacing="0.18em"
                    textTransform="uppercase"
                  >
                    Codegrind Boot Sequence
                  </Text>
                  <Box
                    as="pre"
                    m={0}
                    color="var(--cg-text)"
                    fontFamily={RETRO_TERMINAL_FONT}
                    fontSize={{ base: '9px', md: '15px' }}
                    lineHeight={{ base: '1.2', md: '1.18' }}
                    letterSpacing="0.08em"
                    whiteSpace="pre"
                    opacity={0.98}
                    sx={{ display: 'inline-block' }}
                  >
                    {typedAsciiLogo.join('\n')}
                  </Box>
                  <Text
                    color="var(--cg-text)"
                    fontFamily={RETRO_TERMINAL_FONT}
                    fontSize={{ base: 'sm', md: 'md' }}
                    minH={{ base: '20px', md: '24px' }}
                  >
                    {typedLabel}
                    <Box as="span" opacity={typedProgress < 1 ? 1 : 0.35}>
                      _
                    </Box>
                  </Text>
                  <Text
                    color="var(--cg-muted)"
                    fontFamily={RETRO_TERMINAL_FONT}
                    fontSize="xs"
                    minH="16px"
                  >
                    {typedDetail}
                  </Text>
                  <Text
                    color="var(--cg-muted)"
                    fontFamily={RETRO_DISPLAY_FONT}
                    fontSize="10px"
                    letterSpacing="0.18em"
                    textTransform="uppercase"
                  >
                    {typedSystemLine}
                  </Text>
                </VStack>
              </Box>

              <MotionBox
                position="absolute"
                top={{ base: '22%', md: '26%' }}
                left={{ base: '4%', md: '4%' }}
                right={{ base: '4%', md: '4%' }}
                bottom={{ base: '7%', md: '7%' }}
                zIndex={2}
                border="2px solid rgba(0, 0, 0, 0.4)"
                bg="rgba(8, 32, 40, 0.3)"
                animate={{
                  clipPath: ['inset(0 100% 100% 0)', 'inset(0 0% 42% 0)', 'inset(0 0% 0% 0)'],
                  opacity: [0.4, 0.92, 1],
                  filter: ['brightness(1.22)', 'brightness(0.96)', 'brightness(1)'],
                }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <MotionBox
                  position="absolute"
                  inset={0}
                  bg="linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,255,255,0.04) 22%, rgba(0,0,0,0) 100%)"
                  animate={{
                    clipPath: ['inset(0 0 100% 0)', 'inset(0 0 52% 0)', 'inset(0 0 0 0)'],
                    opacity: [0.8, 0.45, 0],
                  }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
                {BOOT_MODULES.map((module, index) => {
                  const revealThreshold = index === 0 ? 0 : index < 3 ? 1 : 2;
                  const label = `${module.id.toUpperCase()}_SURFACE`;

                  return (
                    <MotionBox
                      key={module.id}
                      position="absolute"
                      {...module}
                      border="2px solid var(--cg-window-shadow)"
                      bg="rgba(214, 209, 200, 0.12)"
                      boxShadow={`var(--cg-window-outset), inset 0 0 0 1px ${module.glow}`}
                      initial={false}
                      animate={{
                        opacity: bootStageIndex >= revealThreshold ? [0.22, 0.98, 0.78] : 0.08,
                        scale: bootStageIndex >= revealThreshold ? [0.985, 1.01, 1] : 0.96,
                        clipPath:
                          bootStageIndex >= revealThreshold
                            ? ['inset(0 0 100% 0)', 'inset(0 0 24% 0)', 'inset(0 0 0 0)']
                            : 'inset(0 0 100% 0)',
                        filter:
                          bootStageIndex >= revealThreshold
                            ? ['brightness(0.7)', 'brightness(1.18)', 'brightness(0.96)']
                            : 'brightness(0.55)',
                      }}
                      transition={{ duration: 0.7 + index * 0.14, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        height="22px"
                        bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
                        borderBottom="1px solid rgba(17,17,17,0.72)"
                      />
                      <Text
                        position="absolute"
                        top="4px"
                        left="10px"
                        color="var(--cg-header-text)"
                        fontFamily={RETRO_DISPLAY_FONT}
                        fontSize={{ base: '9px', md: '10px' }}
                        fontWeight="700"
                        letterSpacing="0.12em"
                      >
                        {label}
                      </Text>
                      <Box
                        as="pre"
                        position="absolute"
                        left="12px"
                        right="12px"
                        bottom="12px"
                        m={0}
                        color="var(--cg-text)"
                        fontFamily={RETRO_TERMINAL_FONT}
                        fontSize={{ base: '8px', md: '10px' }}
                        lineHeight="1.2"
                        whiteSpace="pre-wrap"
                      >
                        {`> mount ${module.id}\n> sync rails\n> status: ${bootStageIndex >= revealThreshold ? 'ONLINE' : 'STANDBY'}`}
                      </Box>
                      <Box
                        position="absolute"
                        inset={0}
                        bg={`linear-gradient(180deg, transparent 0%, ${module.glow} 100%)`}
                        opacity={0.18}
                      />
                    </MotionBox>
                  );
                })}

                <Box
                  position="absolute"
                  top="16px"
                  right={{ base: '16px', md: '18px' }}
                  width={{ base: '44%', md: '28%' }}
                  overflow="hidden"
                  bg="var(--cg-window-face)"
                  border="2px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset), 8px 8px 0 rgba(0, 0, 0, 0.12)"
                >
                  <Box
                    px={3}
                    py={2}
                    bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
                    borderBottom="1px solid rgba(17,17,17,0.72)"
                  >
                    <Text
                      color="var(--cg-header-text)"
                      fontFamily={RETRO_DISPLAY_FONT}
                      fontSize={{ base: '9px', md: '10px' }}
                      fontWeight="700"
                      letterSpacing="0.18em"
                      textTransform="uppercase"
                    >
                      boot trace
                    </Text>
                  </Box>
                  <VStack align="stretch" spacing={1} px={3} py={3} bg="rgba(255,255,255,0.14)">
                    {typedBootTrace.map((line, index) => (
                      <Text
                        key={`boot-trace-${index}`}
                        color={index <= bootStageIndex + 1 ? 'var(--cg-text)' : 'var(--cg-muted)'}
                        fontFamily={RETRO_TERMINAL_FONT}
                        fontSize={{ base: '9px', md: '11px' }}
                        lineHeight="1.35"
                        minH={{ base: '12px', md: '14px' }}
                      >
                        {line}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              </MotionBox>
            </MotionBox>
          ))}
      </AnimatePresence>
    </Box>
  );
};

export default HomepageTDDemo;
