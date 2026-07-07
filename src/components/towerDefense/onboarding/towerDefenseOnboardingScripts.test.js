import { describe, expect, it } from 'vitest';
import { getHomepageDemoOnboardingScript } from './towerDefenseOnboardingScripts';

describe('getHomepageDemoOnboardingScript', () => {
  it('requires manual continue for the mission objective beat and preserves readability', () => {
    const script = getHomepageDemoOnboardingScript('python');
    const missionObjectiveStep = script.steps.find((step) => step.id === 'mission-objective');

    expect(missionObjectiveStep).toBeTruthy();
    expect(missionObjectiveStep.requireManualContinue).toBe(true);
    expect(missionObjectiveStep.requireScrollProgress).toBe(0.35);
    expect(missionObjectiveStep.manualContinueDelayMs).toBe(5200);
    expect(missionObjectiveStep.manualContinueDelayMobileMs).toBe(6200);
    expect(missionObjectiveStep.blockedActionLabel).toBe('SCROLL THE BRIEF');
    expect(missionObjectiveStep.actionLabel).toBe('I READ THE BRIEF');
    expect(missionObjectiveStep.preserveFocusReadability).toBe(true);
    expect(missionObjectiveStep.preferMobileTicker).toBe(true);
    expect(missionObjectiveStep.autoAdvanceAfter).toBeUndefined();
    expect(missionObjectiveStep.autoAdvanceAfterMobile).toBeUndefined();
  });

  it('returns a mobile-specific write-code hint with explicit answer text', () => {
    const script = getHomepageDemoOnboardingScript('python');
    const writeCodeStep = script.steps.find((step) => step.id === 'write-code');
    const inspectFunctionTowerStep = script.steps.find(
      (step) => step.id === 'inspect-function-tower'
    );
    const mobileContext = { isMobileSinglePanelLayout: true };

    expect(writeCodeStep).toBeTruthy();
    expect(inspectFunctionTowerStep).toBeTruthy();
    expect(writeCodeStep.placement(mobileContext)).toBe('top');
    expect(writeCodeStep.message(mobileContext)).toContain('Replace pass');
    expect(writeCodeStep.subtext(mobileContext)).toContain('Delete pass');
    expect(writeCodeStep.answerLabel(mobileContext)).toBe('TYPE THIS ANSWER');
    expect(writeCodeStep.answerCode(mobileContext)).toBe(script.config.answer);
    expect(writeCodeStep.preferMobileTicker).toBe(true);
    expect(inspectFunctionTowerStep.message(mobileContext)).toContain('tap once for range');
    expect(inspectFunctionTowerStep.subtext(mobileContext)).toContain(
      'Tap once, then tap the same tower again'
    );
    expect(inspectFunctionTowerStep.subtext({ isMobileSinglePanelLayout: false })).toContain(
      'range ring and upgrade menu'
    );
    expect(inspectFunctionTowerStep.preferMobileTicker).toBe(true);
    expect(
      inspectFunctionTowerStep.completeWhen({
        isMobileSinglePanelLayout: false,
        selectedTower: { type: 'Function' },
        towerInspectionRangeShown: true,
        towerInspectionDetailsOpened: false,
        towerInspectionAdvanceReady: false,
      })
    ).toBe(false);
    expect(
      inspectFunctionTowerStep.completeWhen({
        isMobileSinglePanelLayout: false,
        selectedTower: { type: 'Function' },
        towerInspectionRangeShown: true,
        towerInspectionDetailsOpened: false,
        towerInspectionAdvanceReady: true,
      })
    ).toBe(true);
    expect(
      inspectFunctionTowerStep.completeWhen({
        isMobileSinglePanelLayout: true,
        selectedTower: { type: 'Function' },
        towerInspectionRangeShown: true,
        towerInspectionDetailsOpened: true,
        towerInspectionAdvanceReady: false,
      })
    ).toBe(false);
    expect(
      inspectFunctionTowerStep.completeWhen({
        isMobileSinglePanelLayout: true,
        selectedTower: { type: 'Function' },
        towerInspectionRangeShown: true,
        towerInspectionDetailsOpened: true,
        towerInspectionAdvanceReady: true,
      })
    ).toBe(true);
  });

  it('returns the explore-tower-upgrade step gated on FUNCTION tower selection', () => {
    const script = getHomepageDemoOnboardingScript('python');
    const step = script.steps.find((s) => s.id === 'explore-tower-upgrade');

    expect(step).toBeTruthy();
    expect(step.targetSelector).toBe("[data-tutorial='tower-upgrade-panel']");
    expect(step.placement).toBe('right');
    expect(step.highlightKey).toBe('upgrade-panel');
    expect(step.actionLabel).toBe('I SEE IT');
    expect(step.autoAdvanceAfter).toBe(5000);
    expect(step.autoAdvanceAfterMobile).toBe(7000);
    expect(step.preferMobileTicker).toBe(true);
    expect(step.title).toBe('LEARN YOUR TOWER');

    // showWhen: returns true only when a FUNCTION tower is selected
    expect(step.showWhen({ selectedTower: null })).toBe(false);
    expect(step.showWhen({ selectedTower: { type: 'LOG' } })).toBe(false);
    expect(step.showWhen({ selectedTower: { type: 'Function' } })).toBe(true);
    expect(step.showWhen({ selectedTower: { towerType: 'FUNCTION' } })).toBe(true);

    // completeWhen: requires manual completion
    expect(step.completeWhen({}, {})).toBe(false);
    expect(step.completeWhen({}, { 'explore-tower-upgrade': true })).toBe(true);
  });

  it('keeps desktop ghost-text guidance and inline answer block for reference', () => {
    const script = getHomepageDemoOnboardingScript('python');
    const writeCodeStep = script.steps.find((step) => step.id === 'write-code');
    const desktopContext = { isMobileSinglePanelLayout: false };

    expect(writeCodeStep).toBeTruthy();
    expect(writeCodeStep.placement(desktopContext)).toBe('left');
    expect(writeCodeStep.message(desktopContext)).toContain('press Tab');
    expect(writeCodeStep.answerCode(desktopContext)).toBe(script.config.answer);
    expect(writeCodeStep.answerLabel(desktopContext)).toBe('TYPE THIS UNDER TODO COMMENT');
  });

  it('holds the interwave non-code flow on tower selection until burst or blast is armed', () => {
    const script = getHomepageDemoOnboardingScript('python');
    const interwaveToolsStep = script.steps.find((step) => step.id === 'interwave-tools');
    const placeNonCodeStep = script.steps.find((step) => step.id === 'interwave-place-non-code');

    expect(interwaveToolsStep).toBeTruthy();
    expect(placeNonCodeStep).toBeTruthy();
    expect(interwaveToolsStep.preferMobileTicker).toBe(true);
    expect(interwaveToolsStep.targetSelector({ isMobileSinglePanelLayout: false })).toBe(
      "[data-tutorial='tower-burst-turret']"
    );
    expect(
      interwaveToolsStep.targetSelector({
        isMobileSinglePanelLayout: true,
        mobileDockExpanded: false,
      })
    ).toBe("[data-tutorial='mobile-td-toggle']");
    expect(
      interwaveToolsStep.targetSelector({
        isMobileSinglePanelLayout: true,
        mobileDockExpanded: true,
      })
    ).toBe("[data-tutorial='tower-burst-turret']");
    expect(placeNonCodeStep.preferMobileTicker).toBe(true);

    expect(
      interwaveToolsStep.completeWhen({
        selectedTowerType: 'BURSTTURRET',
        gameState: { towers: [] },
      })
    ).toBe(true);

    expect(
      interwaveToolsStep.completeWhen({
        selectedTowerType: 'FUNCTION',
        gameState: { towers: [] },
      })
    ).toBe(false);

    expect(
      placeNonCodeStep.showWhen(
        {
          gameState: { status: 'wave-complete', wave: 2, towers: [] },
          codeSubmitted: false,
          selectedTowerType: 'BLASTTURRET',
        },
        { 'interwave-tools': false }
      )
    ).toBe(true);
  });

  it('keeps slot switching readable while verify still uses ticker mode', () => {
    const script = getHomepageDemoOnboardingScript('python');
    const verifyStep = script.steps.find((step) => step.id === 'verify-solution');
    const slotSwitchStep = script.steps.find((step) => step.id === 'interwave-slot-switch-assign');
    const startWaveStep = script.steps.find((step) => step.id === 'start-wave');
    const finalWaveLockStep = script.steps.find((step) => step.id === 'final-wave-lock');

    expect(verifyStep).toBeTruthy();
    expect(slotSwitchStep).toBeTruthy();
    expect(startWaveStep).toBeTruthy();
    expect(finalWaveLockStep).toBeTruthy();

    expect(verifyStep.preferMobileTicker).toBe(true);
    expect(slotSwitchStep.preserveFocusReadability).toBe(true);
    expect(slotSwitchStep.targetSelector({ isMobileSinglePanelLayout: false })).toBe(
      "[data-tutorial-role='panel-switcher']"
    );
    expect(slotSwitchStep.message({ isMobileSinglePanelLayout: false })).toContain(
      'click one of the unselected window chips'
    );
    expect(slotSwitchStep.message({ isMobileSinglePanelLayout: true })).toContain(
      'tap one of the unselected window buttons'
    );
    expect(startWaveStep.targetSelector).toBe("[data-tutorial='game-start-wave-button']");
    expect(finalWaveLockStep.kind).toBe('transmission');
    expect(finalWaveLockStep.preferMobileTicker).toBeUndefined();
    expect(
      slotSwitchStep.completeWhen({
        slotSwitchLayoutChanged: false,
        slotSwitchAdvanceReady: true,
      })
    ).toBe(false);
    expect(
      slotSwitchStep.completeWhen({
        slotSwitchLayoutChanged: true,
        slotSwitchAdvanceReady: true,
      })
    ).toBe(true);
  });
});
