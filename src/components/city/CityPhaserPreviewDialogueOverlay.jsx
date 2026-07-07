import { Box, Flex, Text } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { APARTMENT_PREVIEW_ADVANCE_EVENT } from '../../city-phaser/district01/previewBootEvents';
import audioManager from '../../utils/audio/AudioManager';
import getAssetUrl from '../../utils/assets/assetUrl';

const UI_FONT = "'Tahoma', 'MS Sans Serif', sans-serif";
const TYPEWRITER_SOUND_SRC = getAssetUrl('/audio/freesound_community-keyboard-typing-5997.mp3');
const DEFAULT_SOUND_EFFECTS_VOLUME = 0.17;
const TYPEWRITER_AUDIO_PROFILES = {
  default: {
    playbackRate: 1,
    volume: 0.16,
  },
  fixer: {
    playbackRate: 0.84,
    volume: 0.14,
  },
  sysadmin: {
    playbackRate: 1.04,
    volume: 0.16,
  },
};
const TYPEWRITER_DELAY_MULTIPLIERS = {
  default: 1,
  fixer: 1.08,
  sysadmin: 0.96,
};

const getTypewriterDelay = (character, typingProfile = 'default') => {
  let baseDelay = 15;

  if (character === '.' || character === '!' || character === '?') {
    baseDelay = 58;
  } else if (character === ',' || character === ';' || character === ':') {
    baseDelay = 42;
  } else if (character === ' ' || character === '\n') {
    baseDelay = 18;
  }

  return Math.round(baseDelay * (TYPEWRITER_DELAY_MULTIPLIERS[typingProfile] || 1));
};

export default function CityPhaserPreviewDialogueOverlay({
  dialogueState,
  hidden = false,
  zIndex = 6,
}) {
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => typeof window !== 'undefined' && (window.innerWidth < 1366 || window.innerHeight <= 768)
  );
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(true);
  const typingTimeoutRef = useRef(null);
  const typingAudioRef = useRef(null);
  const fullTextRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncViewportMode = () => {
      setIsCompactViewport(window.innerWidth < 1366 || window.innerHeight <= 768);
    };

    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    window.addEventListener('orientationchange', syncViewportMode);

    return () => {
      window.removeEventListener('resize', syncViewportMode);
      window.removeEventListener('orientationchange', syncViewportMode);
    };
  }, []);

  useEffect(() => {
    let removeRetryListeners = null;

    const clearTypingAudioRetry = () => {
      if (!removeRetryListeners) {
        return;
      }

      removeRetryListeners();
      removeRetryListeners = null;
    };

    const stopTypingAudio = () => {
      clearTypingAudioRetry();

      if (!typingAudioRef.current) {
        return;
      }

      typingAudioRef.current.pause();
      typingAudioRef.current.currentTime = 0;
      typingAudioRef.current = null;
    };

    const createTypingAudio = (typingProfile) => {
      const audioSettings = audioManager.getSettings?.() || {};

      if (audioSettings.soundEffectsEnabled === false) {
        return null;
      }

      const typingAudio = new Audio(TYPEWRITER_SOUND_SRC);
      const configuredVolume = TYPEWRITER_AUDIO_PROFILES[typingProfile]?.volume || 0.16;
      const baseVolume =
        Number.isFinite(audioSettings.soundEffectsVolume) && audioSettings.soundEffectsVolume >= 0
          ? audioSettings.soundEffectsVolume
          : DEFAULT_SOUND_EFFECTS_VOLUME;

      typingAudio.loop = true;
      typingAudio.volume = Math.min(
        1,
        (configuredVolume / DEFAULT_SOUND_EFFECTS_VOLUME) * baseVolume
      );
      typingAudio.preload = 'auto';
      typingAudio.playsInline = true;
      typingAudio.playbackRate = TYPEWRITER_AUDIO_PROFILES[typingProfile]?.playbackRate || 1;
      if ('preservesPitch' in typingAudio) {
        typingAudio.preservesPitch = false;
      }
      if ('mozPreservesPitch' in typingAudio) {
        typingAudio.mozPreservesPitch = false;
      }
      if ('webkitPreservesPitch' in typingAudio) {
        typingAudio.webkitPreservesPitch = false;
      }

      return typingAudio;
    };

    const startTypingAudio = (typingProfile, cancelledRef) => {
      const typingAudio = createTypingAudio(typingProfile);

      if (!typingAudio) {
        stopTypingAudio();
        return;
      }

      if (typingAudioRef.current && typingAudioRef.current !== typingAudio) {
        try {
          typingAudioRef.current.pause();
          typingAudioRef.current.currentTime = 0;
        } catch {
          // Best effort cleanup only.
        }
      }

      typingAudioRef.current = typingAudio;

      const playPromise = typingAudio.play();

      if (!playPromise || typeof playPromise.then !== 'function') {
        return;
      }

      playPromise.catch((error) => {
        if (cancelledRef.cancelled) {
          return;
        }

        if (error?.name !== 'NotAllowedError' || typeof document === 'undefined') {
          stopTypingAudio();
          return;
        }

        if (removeRetryListeners) {
          return;
        }

        const retryTypingAudio = () => {
          clearTypingAudioRetry();

          if (cancelledRef.cancelled) {
            return;
          }

          startTypingAudio(typingProfile, cancelledRef);
        };

        document.addEventListener('click', retryTypingAudio, { capture: true, once: true });
        document.addEventListener('pointerdown', retryTypingAudio, {
          capture: true,
          once: true,
        });
        document.addEventListener('touchstart', retryTypingAudio, {
          capture: true,
          once: true,
        });
        document.addEventListener('keyup', retryTypingAudio, { capture: true, once: true });

        removeRetryListeners = () => {
          document.removeEventListener('click', retryTypingAudio, true);
          document.removeEventListener('pointerdown', retryTypingAudio, true);
          document.removeEventListener('touchstart', retryTypingAudio, true);
          document.removeEventListener('keyup', retryTypingAudio, true);
        };
      });
    };

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (hidden || !dialogueState?.text) {
      fullTextRef.current = '';
      setDisplayText('');
      setIsTypingComplete(true);
      stopTypingAudio();
      return undefined;
    }

    const fullText = dialogueState.text;
    const typewriterEnabled = dialogueState.typewriterEnabled !== false;
    const typingProfile = dialogueState.typingProfile || 'default';
    fullTextRef.current = fullText;

    if (!typewriterEnabled) {
      setDisplayText(fullText);
      setIsTypingComplete(true);
      stopTypingAudio();
      return undefined;
    }

    setDisplayText('');
    setIsTypingComplete(false);

    const cancelledRef = { cancelled: false };

    try {
      startTypingAudio(typingProfile, cancelledRef);
    } catch {
      typingAudioRef.current = null;
    }

    const revealCharacter = (nextIndex) => {
      if (cancelledRef.cancelled) {
        return;
      }

      setDisplayText(fullText.slice(0, nextIndex));

      if (nextIndex >= fullText.length) {
        setIsTypingComplete(true);
        stopTypingAudio();
        return;
      }

      typingTimeoutRef.current = window.setTimeout(
        () => {
          revealCharacter(nextIndex + 1);
        },
        getTypewriterDelay(fullText.charAt(nextIndex - 1), typingProfile)
      );
    };

    typingTimeoutRef.current = window.setTimeout(() => {
      revealCharacter(1);
    }, 90);

    return () => {
      cancelledRef.cancelled = true;
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      stopTypingAudio();
    };
  }, [
    dialogueState?.text,
    dialogueState?.title,
    dialogueState?.typewriterEnabled,
    dialogueState?.typingProfile,
    hidden,
  ]);

  if (hidden || !dialogueState) {
    return null;
  }

  const handleAdvance = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isTypingComplete) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (typingAudioRef.current) {
        typingAudioRef.current.pause();
        typingAudioRef.current.currentTime = 0;
        typingAudioRef.current = null;
      }

      setDisplayText(fullTextRef.current);
      setIsTypingComplete(true);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_ADVANCE_EVENT));
  };

  const swallowPointerEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const dialogueMetaFontSize = isCompactViewport ? '10px' : 'var(--cg-font-size-meta)';
  const dialogueBodyFontSize = isCompactViewport ? '12px' : 'var(--cg-font-size-copy-strong)';
  const dialogueUiFontSize = isCompactViewport ? '11px' : 'var(--cg-font-size-ui)';

  return (
    <Box inset="0" pointerEvents="none" position="absolute" zIndex={zIndex}>
      <Box
        data-testid="city-preview-dialogue-overlay"
        position="absolute"
        left="50%"
        bottom={
          isCompactViewport
            ? 'calc(12px + env(safe-area-inset-bottom))'
            : 'calc(18px + env(safe-area-inset-bottom))'
        }
        transform="translateX(-50%)"
        width={isCompactViewport ? 'calc(100vw - 24px)' : 'min(520px, calc(100vw - 48px))'}
        maxWidth={isCompactViewport ? 'calc(100vw - 24px)' : '520px'}
        pointerEvents="auto"
        onPointerDown={swallowPointerEvent}
        onMouseDown={swallowPointerEvent}
        border="1px solid #6f6f6f"
        bg="rgba(212, 208, 200, 0.94)"
        boxShadow="0 12px 22px rgba(0, 0, 0, 0.28), inset 1px 1px 0 rgba(255, 255, 255, 0.82), inset -1px -1px 0 rgba(104, 104, 104, 0.34)"
        sx={{
          '@keyframes retroPreviewDialogueIn': {
            from: {
              opacity: 0,
              transform: 'translate(-50%, 8px)',
            },
            to: {
              opacity: 1,
              transform: 'translate(-50%, 0)',
            },
          },
          animation: 'retroPreviewDialogueIn 180ms steps(2, end)',
        }}
      >
        <Flex
          align="center"
          gap={2}
          px={3}
          pt={2.5}
          pb={1.5}
          wrap="wrap"
          borderBottom="1px solid rgba(104, 104, 104, 0.34)"
        >
          {dialogueState.accentLabel ? (
            <Box bg="#000080" color="#f5f7ff" px={2} py={1}>
              <Text
                fontFamily={UI_FONT}
                fontSize={dialogueMetaFontSize}
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                {dialogueState.accentLabel}
              </Text>
            </Box>
          ) : null}

          {dialogueState.title ? (
            <Text
              color="#1b1b1b"
              fontFamily={UI_FONT}
              fontSize={dialogueBodyFontSize}
              fontWeight="700"
              lineHeight="1.25"
              flex="1 1 180px"
              minW={0}
            >
              {dialogueState.title}
            </Text>
          ) : null}

          {dialogueState.statusLabel ? (
            <Text
              color="#000080"
              fontFamily={UI_FONT}
              fontSize={dialogueMetaFontSize}
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
              whiteSpace="nowrap"
            >
              {dialogueState.statusLabel}
            </Text>
          ) : null}
        </Flex>

        <Box px={3} pt={2.5} pb={2}>
          <Box maxH={isCompactViewport ? 'min(34vh, 220px)' : 'min(30vh, 240px)'} overflowY="auto">
            <Text
              color="#161616"
              fontFamily={UI_FONT}
              fontSize={dialogueBodyFontSize}
              fontWeight="700"
              lineHeight="1.5"
              whiteSpace="pre-wrap"
            >
              {displayText}
            </Text>

            {dialogueState.footer ? (
              <Text
                mt={2.5}
                pt={2.5}
                borderTop="1px solid rgba(104, 104, 104, 0.3)"
                color="#333333"
                fontFamily={UI_FONT}
                fontSize={dialogueUiFontSize}
                fontWeight="700"
                lineHeight="1.4"
              >
                {dialogueState.footer}
              </Text>
            ) : null}
          </Box>

          {dialogueState.nextActionLabel ? (
            <Flex justify="flex-end" mt={3}>
              <Box
                as="button"
                type="button"
                onPointerDown={swallowPointerEvent}
                onMouseDown={swallowPointerEvent}
                onClick={handleAdvance}
                px={3}
                py={1.5}
                border="1px solid #6f6f6f"
                bg={isTypingComplete ? '#d4d0c8' : '#c6c1b7'}
                boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.84), inset -1px -1px 0 rgba(104, 104, 104, 0.38)"
                _hover={{ bg: isTypingComplete ? '#e3dfd6' : '#d1cbc0' }}
                _active={{
                  bg: '#c6c1b7',
                  boxShadow:
                    'inset -1px -1px 0 rgba(255, 255, 255, 0.84), inset 1px 1px 0 rgba(104, 104, 104, 0.45)',
                }}
              >
                <Text
                  color="#171717"
                  fontFamily={UI_FONT}
                  fontSize={dialogueUiFontSize}
                  fontWeight="700"
                  letterSpacing="0.04em"
                >
                  {isTypingComplete ? dialogueState.nextActionLabel : 'Finish'}
                </Text>
              </Box>
            </Flex>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
