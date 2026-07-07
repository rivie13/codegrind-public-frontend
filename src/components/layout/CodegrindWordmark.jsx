import { Box, Text, usePrefersReducedMotion } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  CODEGRIND_LOGO_GLITCH_ANIMATION_DURATION_MS,
  CODEGRIND_LOGO_GLITCH_ARM_DELAY_MS,
  CODEGRIND_LOGO_GLITCH_TEXT_SHADOW,
  CODEGRIND_LOGO_IDLE_TEXT_SHADOW,
  CODEGRIND_LOGO_TEXT,
  CODEGRIND_LOGO_TYPE_INTERVAL_MS,
  codegrindLogoCursorBlink,
  codegrindLogoGlitchAnimation,
} from './codegrindLogoAnimation';

const LOGO_CYCLE_RESET_DELAY_MS = 420;

const defaultContainerProps = {
  minH: { base: '56px', sm: '72px', md: '112px' },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  width: '100%',
  px: 2,
};

const defaultTextProps = {
  as: 'h1',
  fontSize: { base: '4xl', sm: '5xl', md: '6xl' },
  fontWeight: '800',
  color: '#00e8ff',
  textAlign: 'center',
  fontFamily: "'Orbitron', var(--cg-font-retro-display)",
  lineHeight: '0.92',
  letterSpacing: { base: '0.015em', md: '0.02em' },
  zIndex: 2,
  userSelect: 'none',
  mx: 'auto',
};

const defaultCursorProps = {
  color: '#24d2ff',
  ml: { base: 0.5, md: 1 },
};

const CodegrindWordmark = React.memo(function CodegrindWordmark({
  loop = false,
  animationEnabled = true,
  cycleResetDelayMs = LOGO_CYCLE_RESET_DELAY_MS,
  containerProps = {},
  textProps = {},
  cursorProps = {},
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animationEnabled && !prefersReducedMotion;
  const [typedLength, setTypedLength] = useState(shouldAnimate ? 0 : CODEGRIND_LOGO_TEXT.length);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setTypedLength(CODEGRIND_LOGO_TEXT.length);
      setIsGlitching(false);
      return undefined;
    }

    let timeoutId;
    let cancelled = false;

    const startCycle = () => {
      if (cancelled) {
        return;
      }

      setTypedLength(0);
      setIsGlitching(false);

      let nextIndex = 0;

      const typeNextCharacter = () => {
        if (cancelled) {
          return;
        }

        nextIndex += 1;
        setTypedLength(nextIndex);

        if (nextIndex < CODEGRIND_LOGO_TEXT.length) {
          timeoutId = window.setTimeout(typeNextCharacter, CODEGRIND_LOGO_TYPE_INTERVAL_MS);
          return;
        }

        timeoutId = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          setIsGlitching(true);

          if (!loop) {
            return;
          }

          timeoutId = window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            setIsGlitching(false);
            timeoutId = window.setTimeout(startCycle, cycleResetDelayMs);
          }, CODEGRIND_LOGO_GLITCH_ANIMATION_DURATION_MS);
        }, CODEGRIND_LOGO_GLITCH_ARM_DELAY_MS);
      };

      timeoutId = window.setTimeout(typeNextCharacter, CODEGRIND_LOGO_TYPE_INTERVAL_MS);
    };

    startCycle();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [cycleResetDelayMs, loop, shouldAnimate]);

  const typedLogoText = CODEGRIND_LOGO_TEXT.slice(0, typedLength);
  const showCursor = shouldAnimate && !isGlitching && typedLength < CODEGRIND_LOGO_TEXT.length;

  return (
    <Box {...defaultContainerProps} {...containerProps}>
      <Text
        animation={isGlitching ? `${codegrindLogoGlitchAnimation} 2.15s linear infinite` : 'none'}
        textShadow={
          isGlitching ? CODEGRIND_LOGO_GLITCH_TEXT_SHADOW : CODEGRIND_LOGO_IDLE_TEXT_SHADOW
        }
        {...defaultTextProps}
        {...textProps}
      >
        {typedLogoText}
        {showCursor ? (
          <Text
            as="span"
            animation={`${codegrindLogoCursorBlink} 0.9s steps(1, end) infinite`}
            {...defaultCursorProps}
            {...cursorProps}
          >
            |
          </Text>
        ) : null}
      </Text>
    </Box>
  );
});

export default CodegrindWordmark;
