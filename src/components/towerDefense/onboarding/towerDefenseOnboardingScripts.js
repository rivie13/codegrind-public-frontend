import { PANEL_TYPES } from '../ui/layout/panelTypes';

// WRITE CODE callout waits this long after the Editor flips on screen so the
// player watches the game defend first.
const LITE_CODE_CALLOUT_DELAY_MS = 6200;

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
        id: 'lite-code',
        kind: 'callout',
        title: 'WRITE CODE',
        message:
          'This is where you write code. Your Hello Print solution is already in the editor — the tower runs it to defend your base.',
        targetSelector: "[data-tutorial='code-editor']",
        placement: 'top',
        highlightKey: 'code-editor',
        panelFocus: { rightPanel: PANEL_TYPES.EDITOR },
        // Shown once the Editor has been on screen a while (the demo flips
        // to it ~2.5s after wave 1 starts so the player watches the game
        // first, then this waits so they can look at the code). Lingers
        // after the wave ends so it can be read instead of vanishing.
        // NOTE: the engine pre-increments wave on completion, so
        // wave-complete with wave N means wave N-1 just finished.
        showWhen: ({ gameState, rightPanel, editorShownAt, codeLingerDone }) => {
          const s = gameState?.status;
          const wave = gameState?.wave || 1;
          const total = gameState?.totalWaves || wave;
          if (s === 'wave-complete') {
            const justFinished = wave - 1;
            if (justFinished < 1 || justFinished >= total) return false;
            return codeLingerDone !== true;
          }
          if (s !== 'playing' || wave >= total) return false;
          if (!rightPanel) return true;
          if (rightPanel !== PANEL_TYPES.EDITOR) return false;
          if (!Number.isFinite(editorShownAt)) return true;
          return Date.now() - editorShownAt >= LITE_CODE_CALLOUT_DELAY_MS;
        },
        completeWhen: ({ gameState, codeLingerDone }) => {
          const s = gameState?.status;
          const wave = gameState?.wave || 1;
          const total = gameState?.totalWaves || wave;
          if (s === 'wave-complete') {
            const justFinished = wave - 1;
            if (justFinished >= total) return true;
            return codeLingerDone === true;
          }
          if (wave > 1) return true;
          return s === 'level-complete' || s === 'game-over';
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
        // Submit waits a short beat after the wave ends (submitReady flips
        // ~2s after wave-complete) so the player registers the win first.
        // During the final wave itself it shows immediately if unsubmitted.
        showWhen: ({ gameState, submitReady }) => {
          const s = gameState?.status;
          if (s === 'wave-complete') return submitReady !== false;
          const wave = gameState?.wave || 1;
          const total = gameState?.totalWaves || wave;
          return s === 'playing' && wave >= total;
        },
        completeWhen: ({ codeSubmitted, verifyAttemptInProgress }) =>
          Boolean(codeSubmitted || verifyAttemptInProgress),
      },
    ],
  };
}
