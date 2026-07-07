import { keyframes } from '@emotion/react';

export const CODEGRIND_LOGO_TEXT = 'CodeGrind';
export const CODEGRIND_LOGO_TYPE_INTERVAL_MS = 115;
export const CODEGRIND_LOGO_GLITCH_ARM_DELAY_MS = 240;
export const CODEGRIND_LOGO_GLITCH_ANIMATION_DURATION_MS = 2150;
export const CODEGRIND_LOGO_GLITCH_TEXT_SHADOW =
  '0.045em 0 0 rgba(255, 203, 72, 0.92), -0.045em -0.025em 0 rgba(255, 91, 224, 0.6), 0 0 0 transparent';
export const CODEGRIND_LOGO_IDLE_TEXT_SHADOW =
  '0.032em 0 0 rgba(255, 203, 72, 0.82), -0.032em -0.018em 0 rgba(255, 91, 224, 0.5), 0 0 0 transparent';

export const codegrindLogoGlitchAnimation = keyframes`
  0%, 14% {
    text-shadow:
      0.045em 0 0 rgba(255, 203, 72, 0.92),
      -0.045em -0.025em 0 rgba(255, 91, 224, 0.6),
      0 0 0 transparent;
  }
  15%, 49% {
    text-shadow:
      -0.045em -0.025em 0 rgba(255, 203, 72, 0.92),
      0.025em 0.025em 0 rgba(255, 91, 224, 0.6),
      0 0 0 transparent;
  }
  50%, 99% {
    text-shadow:
      0.025em 0.05em 0 rgba(255, 203, 72, 0.92),
      0.05em 0 0 rgba(255, 91, 224, 0.6),
      0 0 0 transparent;
  }
  100% {
    text-shadow:
      -0.025em 0 0 rgba(255, 203, 72, 0.92),
      -0.025em -0.025em 0 rgba(255, 91, 224, 0.6),
      0 0 0 transparent;
  }
`;

export const codegrindLogoCursorBlink = keyframes`
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
`;
