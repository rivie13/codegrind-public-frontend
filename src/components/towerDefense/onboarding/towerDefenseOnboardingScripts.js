import { PANEL_TYPES } from '../ui/layout/panelTypes';

export function getHomepageLiteOnboardingScript() {
  return {
    version: 'v7-homepage-lite',
    steps: [
      {
        id: 'mission-objective',
        kind: 'callout',
        title: 'READ THE BRIEF',
        message:
          'THIS IS WHERE YOU READ THE MISSION BRIEF. The problem panel shows the coding problem you are solving.',
        panelFocus: { rightPanel: PANEL_TYPES.PROBLEM },
        requireManualContinue: true,
        actionLabel: 'I READ THE BRIEF',
      },
      {
        id: 'lite-start-wave',
        kind: 'callout',
        title: 'START WAVE',
        message: 'Press Start Wave. Watch the tower defend your code against enemies.',
        targetSelector: "[data-tutorial='game-start-wave-button']",
        placement: 'top',
        highlightKey: 'start-wave',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        completeWhen: ({ gameState }) => {
          const s = gameState?.status;
          return s === 'playing' || s === 'wave-complete';
        },
      },
      {
        id: 'lite-submit',
        kind: 'callout',
        title: 'SUBMIT',
        message:
          'Press Submit when ready. Submitting your code checks for correctness. The final wave difficulty is determined by your code being right or wrong.',
        targetSelector: "[data-tutorial='verify-button']",
        placement: 'top',
        highlightKey: 'start-wave',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        showWhen: ({ gameState }) => {
          const s = gameState?.status;
          return s === 'playing' || s === 'wave-complete';
        },
        completeWhen: ({ codeSubmitted, verifyAttemptInProgress }) =>
          Boolean(codeSubmitted || verifyAttemptInProgress),
      },
    ],
  };
}
