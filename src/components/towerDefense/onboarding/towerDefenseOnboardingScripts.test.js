import { describe, expect, it } from 'vitest';
import { getHomepageLiteOnboardingScript } from './towerDefenseOnboardingScripts';

describe('getHomepageLiteOnboardingScript', () => {
  it('is a 3-step flow in order: brief → start-wave → submit', () => {
    const script = getHomepageLiteOnboardingScript('python');

    expect(script.steps.map((step) => step.id)).toEqual([
      'mission-objective',
      'lite-start-wave',
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

  it('shows lite-submit only after the wave starts and completes on submit', () => {
    const script = getHomepageLiteOnboardingScript('python');
    const submitStep = script.steps.find((step) => step.id === 'lite-submit');

    expect(submitStep.targetSelector).toBe("[data-tutorial='verify-button']");
    expect(submitStep.showWhen({ gameState: { status: 'ready', wave: 1 } })).toBe(false);
    expect(submitStep.showWhen({ gameState: { status: 'playing', wave: 1 } })).toBe(true);
    expect(submitStep.showWhen({ gameState: { status: 'wave-complete', wave: 1 } })).toBe(true);
    expect(submitStep.completeWhen({})).toBe(false);
    expect(submitStep.completeWhen({ codeSubmitted: true })).toBe(true);
    expect(submitStep.completeWhen({ verifyAttemptInProgress: true })).toBe(true);
  });
});
