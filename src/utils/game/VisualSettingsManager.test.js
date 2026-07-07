import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadManager = async () => {
  vi.resetModules();
  const mod = await import('./VisualSettingsManager');
  return mod.default;
};

describe('VisualSettingsManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes defaults and applies an auto quality preset', async () => {
    const manager = await loadManager();
    const settings = manager.getSettings();

    expect(settings.qualityPreset).toBeDefined();
    expect(settings.maxProjectiles).toBeGreaterThan(0);
    expect(settings.aiCodeSnippetGeneration).toBe(true);
    expect(settings.aiSnippetModel).toBe(null);
  });

  it('loads saved settings and merges missing ai flags', async () => {
    localStorage.setItem(
      'towerDefenseVisualSettings',
      JSON.stringify({
        qualityPreset: 'custom',
        renderScale: 1.2,
      })
    );

    const manager = await loadManager();
    const settings = manager.getSettings();

    expect(settings.qualityPreset).toBe('custom');
    expect(settings.renderScale).toBe(1.2);
    expect(settings.aiCodeSnippetGeneration).toBe(true);
    expect(settings.aiCodeSnippetBeta).toBe(true);
    expect(settings.aiSnippetModel).toBe(null);
  });

  it('applies quality presets and persists via custom event', async () => {
    const manager = await loadManager();
    const listener = vi.fn();
    window.addEventListener('td-settings-changed', listener);

    const minimal = manager.applyQualityPreset('minimal');
    expect(minimal.qualityPreset).toBe('minimal');
    expect(minimal.particleEffects).toBe(false);
    expect(minimal.projectileTrails).toBe(false);

    expect(listener).toHaveBeenCalled();
    expect(localStorage.getItem('towerDefenseVisualSettings')).toContain(
      '"qualityPreset":"minimal"'
    );
  });

  it('updates custom settings and clamps values where needed', async () => {
    const manager = await loadManager();

    manager.updateRenderScale(10);
    manager.updateEffectsSettings(77, false, 0.25);
    manager.updateProjectileVisuals(0.8, true, false, true, 0.9, true, 1.1);
    manager.updateSpecialEffects(true, false, true);
    manager.updateTerminalVisuals(true, 0.4, true, 0.9);
    manager.updateEditorMatrixSettings(true, 0.5, 0, 20);
    manager.updateCanvasGlitchSettings(true, 0.4, false, 0.2, true, 0.1);
    manager.updateTerminalScrolling(false, 'manual');
    manager.updateAICodeSnippetGeneration(false);
    manager.updateAIBasicSnippetFallback(true);
    manager.updateAISnippetModel('gpt-4.1');

    const settings = manager.getSettings();
    expect(settings.renderScale).toBe(1.5);
    expect(settings.maxProjectiles).toBe(77);
    expect(settings.terminalScrollFrequency).toBe('manual');
    expect(settings.editorMatrixVisibleLinesMin).toBe(1);
    expect(settings.editorMatrixVisibleLinesMax).toBe(20);
    expect(settings.aiCodeSnippetGeneration).toBe(false);
    expect(settings.aiBasicSnippetFallbackEnabled).toBe(true);
    expect(settings.aiSnippetModel).toBe('gpt-4.1');
    expect(settings.qualityPreset).toBe('custom');
  });

  it('computes scaling factor and visual getters', async () => {
    const manager = await loadManager();
    manager.settings.renderScale = 1;
    manager.settings.isHighResScreen = true;
    manager.settings.isUltrawide = true;
    manager.settings.projectileComplexity = 0.5;
    manager.settings.projectileTrails = false;
    manager.settings.explosionSize = 1.2;
    manager.settings.projectileDuration = 0.85;
    manager.settings.maxProjectiles = 42;

    expect(manager.getScalingFactor()).toBeCloseTo(0.72, 5);
    expect(manager.getProjectileComplexity()).toBe(0.5);
    expect(manager.shouldShowProjectileTrails()).toBe(false);
    expect(manager.getExplosionSizeMultiplier()).toBe(1.2);
    expect(manager.getProjectileDurationMultiplier()).toBe(0.85);
    expect(manager.getMaxProjectiles()).toBe(42);
  });
});
