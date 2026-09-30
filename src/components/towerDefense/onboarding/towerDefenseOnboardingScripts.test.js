import { describe, expect, it } from 'vitest';
import { getHomepageLiteOnboardingScript } from './towerDefenseOnboardingScripts';

describe('getHomepageLiteOnboardingScript', () => {
  it('is a 4-step flow in order: brief → start-wave → code → submit', () => {
    const script = getHomepageLiteOnboardingScript('python');

    expect(script.steps.map((step) => step.id)).toEqual([
      'mission-objective',
      'lite-start-wave',
      'lite-code',
      'lite-submit',
    ]);
  });

  it('requires manual continue for the mission objective beat', () => {
    const script = getHomepageLiteOnboardingScript('python');
    const missionObjectiveStep = script.steps.find((step) => step.id === 'mission-objective');

    expect(missionObjectiveStep).toBeTruthy();
    expect(missionObjectiveStep.requireManualContinue).toBe(true);
    expect(missionObjectiveStep.actionLabel).toBe('I READ THE BRIEF');
  });

  it('does not autocomplete lite-start-wave on fresh READY wave-1 state (no skip)', () => {
    const script = getHomepageLiteOnboardingScript('python');
    const startWaveStep = script.steps.find((step) => step.id === 'lite-start-wave');

    expect(startWaveStep.targetSelector).toBe("[data-tutorial='game-start-wave-button']");
    expect(startWaveStep.completeWhen({ gameState: { status: 'ready', wave: 1 } })).toBe(false);
    expect(startWaveStep.completeWhen({ gameState: { status: 'playing', wave: 1 } })).toBe(true);
    expect(startWaveStep.completeWhen({ gameState: { status: 'wave-complete', wave: 1 } })).toBe(
      true
    );
  });

  it('shows lite-code only while wave 1 runs and completes at wave-complete', () => {
    const script = getHomepageLiteOnboardingScript('python');
    const codeStep = script.steps.find((step) => step.id === 'lite-code');

    expect(codeStep.targetSelector).toBe("[data-tutorial='code-editor']");
    expect(codeStep.showWhen({ gameState: { status: 'ready', wave: 1 } })).toBe(false);
    // Editor not on screen yet (game-only beat right after START WAVE).
    expect(
      codeStep.showWhen({
        gameState: { status: 'playing', wave: 1, totalWaves: 2 },
        rightPanel: 'problem',
      })
    ).toBe(false);
    // Editor just flipped: still inside the 20s look-at-the-code wait.
    expect(
      codeStep.showWhen({
        gameState: { status: 'playing', wave: 1, totalWaves: 2 },
        rightPanel: 'editor',
        editorShownAt: Date.now() - 1000,
      })
    ).toBe(false);
    expect(
      codeStep.showWhen({
        gameState: { status: 'playing', wave: 1, totalWaves: 2 },
        rightPanel: 'editor',
        editorShownAt: Date.now() - 21000,
      })
    ).toBe(true);
    expect(codeStep.showWhen({ gameState: { status: 'playing', wave: 2, totalWaves: 2 } })).toBe(
      false
    );
    expect(codeStep.completeWhen({ gameState: { status: 'ready', wave: 1 } })).toBe(false);
    expect(codeStep.completeWhen({ gameState: { status: 'playing', wave: 1 } })).toBe(false);
    // Engine pre-increments wave on completion: wave-complete with wave 2
    // means wave 1 just finished — the callout lingers so it can be read.
    expect(
      codeStep.showWhen({
        gameState: { status: 'wave-complete', wave: 2, totalWaves: 2 },
        codeLingerDone: false,
      })
    ).toBe(true);
    expect(
      codeStep.completeWhen({
        gameState: { status: 'wave-complete', wave: 2 },
        codeLingerDone: false,
      })
    ).toBe(false);
    expect(
      codeStep.showWhen({
        gameState: { status: 'wave-complete', wave: 2, totalWaves: 2 },
        codeLingerDone: true,
      })
    ).toBe(false);
    expect(
      codeStep.completeWhen({
        gameState: { status: 'wave-complete', wave: 2 },
        codeLingerDone: true,
      })
    ).toBe(true);
    expect(codeStep.completeWhen({ gameState: { status: 'playing', wave: 2 } })).toBe(true);
  });

  it('shows lite-submit only at wave-complete or during the final wave, and completes on submit', () => {
    const script = getHomepageLiteOnboardingScript('python');
    const submitStep = script.steps.find((step) => step.id === 'lite-submit');

    expect(submitStep.targetSelector).toBe("[data-tutorial='verify-button']");
    expect(submitStep.showWhen({ gameState: { status: 'ready', wave: 1 } })).toBe(false);
    expect(submitStep.showWhen({ gameState: { status: 'playing', wave: 1, totalWaves: 2 } })).toBe(
      false
    );
    // Wave just completed (engine pre-increments: wave 2 means wave 1 just
    // finished): submit waits out its short beat first.
    expect(
      submitStep.showWhen({
        gameState: { status: 'wave-complete', wave: 2, totalWaves: 2 },
        submitReady: false,
      })
    ).toBe(false);
    expect(
      submitStep.showWhen({
        gameState: { status: 'wave-complete', wave: 2, totalWaves: 2 },
        submitReady: true,
      })
    ).toBe(true);
    expect(submitStep.showWhen({ gameState: { status: 'playing', wave: 2, totalWaves: 2 } })).toBe(
      true
    );
    expect(submitStep.completeWhen({})).toBe(false);
    expect(submitStep.completeWhen({ codeSubmitted: true })).toBe(true);
    expect(submitStep.completeWhen({ verifyAttemptInProgress: true })).toBe(true);
  });
});
