/**
 * VisualSettingsManager - Manages visual settings for the Tower Defense game
 * Handles settings for rendering quality, animation effects, and terminal visual effects
 */

class VisualSettingsManager {
  constructor() {
    // Default visual settings
    this.defaultSettings = {
      // General rendering settings
      renderScale: 1.0, // Scale of game elements (0.5 to 1.5)
      qualityPreset: 'auto', // 'high', 'medium', 'low', 'minimal', 'auto' (based on screen)

      // Game effect settings
      maxProjectiles: 100, // Maximum number of projectiles at once
      particleEffects: true, // Enable particle effects
      particleIntensity: 0.7, // Particle effect intensity (0 to 1)

      // Projectile specific settings
      projectileComplexity: 1.0, // Level of visual complexity for projectiles (0.2 to 1.0)
      projectileTrails: true, // Show projectile trails
      projectileGlow: true, // Show projectile glow effects
      projectileAnimations: true, // Enable projectile animations
      explosionSize: 1.0, // Size multiplier for explosions (0.5 to 1.5)
      explosionParticles: true, // Show particles in explosions
      projectileDuration: 1.0, // Projectile animation duration multiplier (0.5 to 1.5)

      // Terminal visual settings
      terminalGlitchEnabled: true, // Enable terminal glitch effects
      terminalGlitchIntensity: 0.8, // Intensity of glitch effects (0 to 1)
      terminalTypingEnabled: true, // Enable typing animation in terminal
      terminalTypingSpeed: 0.4, // Speed of typing animation (0.4 to 1.5) - lower value is normal speed

      // Editor visual settings (matrix bomb style effect)
      editorMatrixEnabled: true, // Enable editor matrix obfuscation
      editorMatrixIntensity: 0.7, // Intensity of editor matrix effect (0 to 1)
      editorMatrixVisibleLinesMin: 1, // Minimum visible lines at lowest lives
      editorMatrixVisibleLinesMax: 12, // Maximum visible lines at higher lives

      // Canvas visual settings
      canvasGlitchEnabled: true, // Enable canvas glitch effects
      canvasGlitchIntensity: 0.6, // Intensity of canvas glitch effects (0 to 1)
      canvasFlickerEnabled: true, // Enable canvas flicker overlay
      canvasFlickerIntensity: 0.6, // Intensity of canvas flicker overlay (0 to 1)
      canvasFlashEnabled: true, // Enable canvas flash overlay
      canvasFlashIntensity: 0.5, // Intensity of canvas flash overlay (0 to 1)

      // Terminal scrolling settings
      terminalForceScroll: true, // Enable automatic scrolling to bottom for new messages
      terminalScrollFrequency: 'every', // When to force scroll: 'every' (every message), 'batch' (after batch), 'manual' (user controlled)

      // Special effects toggles
      explosionEffects: true, // Show explosion effects
      hitEffects: true, // Show hit effects
      combatText: true, // Show combat text (damage/status popups)

      // AI Code Snippet Generation setting
      aiCodeSnippetGeneration: true, // Enable AI-powered code snippet generation
      aiCodeSnippetBeta: true, // Indicates that AI snippet generation is in beta
      aiBasicSnippetFallbackEnabled: false, // Allow basic snippets when AI quota is exhausted (opt-in)
      aiSnippetModel: null, // Optional snippet model override (null = backend default)

      // Store high-res detection for reference
      isHighResScreen:
        typeof window !== 'undefined' &&
        window.screen &&
        (window.screen.width > 1920 || window.screen.height > 1080),

      isUltrawide:
        typeof window !== 'undefined' &&
        window.screen &&
        window.screen.width / window.screen.height > 2.0,
    };

    // Load settings from localStorage if available
    this.settings = this.loadSettings();

    // Apply default quality preset based on screen if set to auto
    if (this.settings.qualityPreset === 'auto') {
      this.applyAutoQualityPreset();
    }
  }

  /**
   * Load settings from localStorage, or use defaults if not found
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('towerDefenseVisualSettings');
      if (savedSettings) {
        const mergedSettings = { ...this.defaultSettings, ...JSON.parse(savedSettings) };
        if (typeof mergedSettings.aiCodeSnippetGeneration !== 'boolean') {
          mergedSettings.aiCodeSnippetGeneration = true;
        }
        if (typeof mergedSettings.aiCodeSnippetBeta !== 'boolean') {
          mergedSettings.aiCodeSnippetBeta = true;
        }
        if (
          mergedSettings.aiSnippetModel !== null &&
          typeof mergedSettings.aiSnippetModel !== 'string'
        ) {
          mergedSettings.aiSnippetModel = null;
        }
        return mergedSettings;
      }
    } catch (error) {
      console.error('Error loading visual settings:', error);
    }
    return { ...this.defaultSettings };
  }

  /**
   * Save current settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('towerDefenseVisualSettings', JSON.stringify(this.settings));

      // Dispatch a custom event to notify components that settings have changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('td-settings-changed', {
            detail: { ...this.settings },
          })
        );
      }
    } catch (error) {
      console.error('Error saving visual settings:', error);
    }
  }

  /**
   * Get current visual settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Apply auto quality preset based on device capabilities
   */
  applyAutoQualityPreset() {
    // Apply appropriate preset based on screen resolution
    if (this.settings.isHighResScreen) {
      this.applyQualityPreset('medium'); // High res screens need some optimization
    } else if (this.settings.isUltrawide) {
      this.applyQualityPreset('medium'); // Ultrawide screens get medium settings
    } else {
      this.applyQualityPreset('high'); // Default to high for other devices
    }
  }

  /**
   * Apply predefined quality preset
   */
  applyQualityPreset(preset) {
    // Store the selected preset
    this.settings.qualityPreset = preset;

    switch (preset) {
      case 'high':
        this.settings.renderScale = 1.0;
        this.settings.maxProjectiles = 100;
        this.settings.particleEffects = true;
        this.settings.particleIntensity = 1.0;
        this.settings.projectileComplexity = 1.0;
        this.settings.projectileTrails = true;
        this.settings.projectileGlow = true;
        this.settings.projectileAnimations = true;
        this.settings.explosionSize = 1.0;
        this.settings.explosionParticles = true;
        this.settings.projectileDuration = 1.0;
        this.settings.terminalGlitchEnabled = true;
        this.settings.terminalGlitchIntensity = 1.0;
        this.settings.terminalTypingEnabled = true;
        this.settings.terminalTypingSpeed = 1.2; // Faster typing speed
        this.settings.terminalForceScroll = true;
        this.settings.terminalScrollFrequency = 'every';
        this.settings.explosionEffects = true;
        this.settings.hitEffects = true;
        this.settings.combatText = true;
        this.settings.editorMatrixEnabled = true;
        this.settings.editorMatrixIntensity = 0.8;
        this.settings.editorMatrixVisibleLinesMin = 1;
        this.settings.editorMatrixVisibleLinesMax = 12;
        this.settings.canvasGlitchEnabled = true;
        this.settings.canvasGlitchIntensity = 0.7;
        this.settings.canvasFlickerEnabled = true;
        this.settings.canvasFlickerIntensity = 0.7;
        this.settings.canvasFlashEnabled = true;
        this.settings.canvasFlashIntensity = 0.6;
        break;

      case 'medium':
        this.settings.renderScale = 0.9;
        this.settings.maxProjectiles = 50;
        this.settings.particleEffects = true;
        this.settings.particleIntensity = 0.7;
        this.settings.projectileComplexity = 0.7;
        this.settings.projectileTrails = true;
        this.settings.projectileGlow = true;
        this.settings.projectileAnimations = true;
        this.settings.explosionSize = 0.8;
        this.settings.explosionParticles = true;
        this.settings.projectileDuration = 0.9;
        this.settings.terminalGlitchEnabled = true;
        this.settings.terminalGlitchIntensity = 0.7;
        this.settings.terminalTypingEnabled = true;
        this.settings.terminalTypingSpeed = 1.0; // Medium typing speed
        this.settings.terminalForceScroll = true;
        this.settings.terminalScrollFrequency = 'every';
        this.settings.explosionEffects = true;
        this.settings.hitEffects = true;
        this.settings.combatText = true;
        this.settings.editorMatrixEnabled = true;
        this.settings.editorMatrixIntensity = 0.6;
        this.settings.editorMatrixVisibleLinesMin = 1;
        this.settings.editorMatrixVisibleLinesMax = 12;
        this.settings.canvasGlitchEnabled = true;
        this.settings.canvasGlitchIntensity = 0.5;
        this.settings.canvasFlickerEnabled = true;
        this.settings.canvasFlickerIntensity = 0.5;
        this.settings.canvasFlashEnabled = true;
        this.settings.canvasFlashIntensity = 0.45;
        break;

      case 'low':
        this.settings.renderScale = 0.8;
        this.settings.maxProjectiles = 20;
        this.settings.particleEffects = true;
        this.settings.particleIntensity = 0.4;
        this.settings.projectileComplexity = 0.4;
        this.settings.projectileTrails = false;
        this.settings.projectileGlow = true;
        this.settings.projectileAnimations = false;
        this.settings.explosionSize = 0.6;
        this.settings.explosionParticles = false;
        this.settings.projectileDuration = 0.8;
        this.settings.terminalGlitchEnabled = true;
        this.settings.terminalGlitchIntensity = 0.4;
        this.settings.terminalTypingEnabled = true;
        this.settings.terminalTypingSpeed = 0.8; // Faster typing speed
        this.settings.terminalForceScroll = true;
        this.settings.terminalScrollFrequency = 'batch';
        this.settings.explosionEffects = false;
        this.settings.hitEffects = true;
        this.settings.combatText = true;
        this.settings.editorMatrixEnabled = true;
        this.settings.editorMatrixIntensity = 0.4;
        this.settings.editorMatrixVisibleLinesMin = 1;
        this.settings.editorMatrixVisibleLinesMax = 12;
        this.settings.canvasGlitchEnabled = true;
        this.settings.canvasGlitchIntensity = 0.35;
        this.settings.canvasFlickerEnabled = true;
        this.settings.canvasFlickerIntensity = 0.35;
        this.settings.canvasFlashEnabled = true;
        this.settings.canvasFlashIntensity = 0.3;
        break;

      case 'minimal':
        this.settings.renderScale = 0.7;
        this.settings.maxProjectiles = 10;
        this.settings.particleEffects = false;
        this.settings.particleIntensity = 0;
        this.settings.projectileComplexity = 0.2;
        this.settings.projectileTrails = false;
        this.settings.projectileGlow = false;
        this.settings.projectileAnimations = false;
        this.settings.explosionSize = 0.4;
        this.settings.explosionParticles = false;
        this.settings.projectileDuration = 0.7;
        this.settings.terminalGlitchEnabled = false;
        this.settings.terminalGlitchIntensity = 0;
        this.settings.terminalTypingEnabled = false;
        this.settings.terminalTypingSpeed = 0.6; // We still increase this for when typing is enabled
        this.settings.terminalForceScroll = true;
        this.settings.terminalScrollFrequency = 'batch';
        this.settings.explosionEffects = false;
        this.settings.hitEffects = false;
        this.settings.combatText = false;
        this.settings.editorMatrixEnabled = false;
        this.settings.editorMatrixIntensity = 0;
        this.settings.editorMatrixVisibleLinesMin = 1;
        this.settings.editorMatrixVisibleLinesMax = 12;
        this.settings.canvasGlitchEnabled = false;
        this.settings.canvasGlitchIntensity = 0;
        this.settings.canvasFlickerEnabled = false;
        this.settings.canvasFlickerIntensity = 0;
        this.settings.canvasFlashEnabled = false;
        this.settings.canvasFlashIntensity = 0;
        break;

      case 'auto':
      default:
        // Just trigger the auto-detection again
        this.applyAutoQualityPreset();
        break;
    }

    // Save the applied settings
    this.saveSettings();

    // Return the settings for immediate use
    return this.getSettings();
  }

  /**
   * Update render scale setting
   */
  updateRenderScale(scale) {
    this.settings.renderScale = Math.max(0.5, Math.min(1.5, scale));
    this.settings.qualityPreset = 'custom'; // Switch to custom preset when manually changing
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update projectile and particle settings
   */
  updateEffectsSettings(maxProjectiles, particleEffects, particleIntensity) {
    this.settings.maxProjectiles = maxProjectiles;
    this.settings.particleEffects = particleEffects;
    this.settings.particleIntensity = particleIntensity;
    this.settings.qualityPreset = 'custom';
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update projectile visual settings
   */
  updateProjectileVisuals(
    complexity,
    trails,
    glow,
    animations,
    explosionSize,
    explosionParticles,
    duration
  ) {
    this.settings.projectileComplexity = complexity;
    this.settings.projectileTrails = trails;
    this.settings.projectileGlow = glow;
    this.settings.projectileAnimations = animations;
    this.settings.explosionSize = explosionSize;
    this.settings.explosionParticles = explosionParticles;
    this.settings.projectileDuration = duration;
    this.settings.qualityPreset = 'custom';
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update special effects toggles
   */
  updateSpecialEffects(explosionEffects, hitEffects, combatText) {
    this.settings.explosionEffects = explosionEffects;
    this.settings.hitEffects = hitEffects;
    if (typeof combatText === 'boolean') {
      this.settings.combatText = combatText;
    }
    this.settings.qualityPreset = 'custom';
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update terminal visual settings
   */
  updateTerminalVisuals(glitchEnabled, glitchIntensity, typingEnabled, typingSpeed) {
    // Ensure boolean values are properly stored as booleans
    this.settings.terminalGlitchEnabled = glitchEnabled === true;
    this.settings.terminalGlitchIntensity = glitchIntensity;
    this.settings.terminalTypingEnabled = typingEnabled === true;
    this.settings.terminalTypingSpeed = typingSpeed;
    this.settings.qualityPreset = 'custom';

    // Debug logging to verify settings (uncomment if needed)
    //console.log("Updated terminal settings:", {
    //  glitchEnabled: this.settings.terminalGlitchEnabled,
    //  glitchIntensity: this.settings.terminalGlitchIntensity
    //});

    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update editor matrix effect settings
   */
  updateEditorMatrixSettings(enabled, intensity, visibleLinesMin, visibleLinesMax) {
    this.settings.editorMatrixEnabled = enabled === true;
    this.settings.editorMatrixIntensity = intensity;
    if (Number.isFinite(visibleLinesMin)) {
      this.settings.editorMatrixVisibleLinesMin = Math.max(1, Math.floor(visibleLinesMin));
    }
    if (Number.isFinite(visibleLinesMax)) {
      this.settings.editorMatrixVisibleLinesMax = Math.max(1, Math.floor(visibleLinesMax));
    }
    this.settings.qualityPreset = 'custom';
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update canvas glitch effect settings
   */
  updateCanvasGlitchSettings(
    enabled,
    intensity,
    flickerEnabled,
    flickerIntensity,
    flashEnabled,
    flashIntensity
  ) {
    this.settings.canvasGlitchEnabled = enabled === true;
    this.settings.canvasGlitchIntensity = intensity;
    if (typeof flickerEnabled === 'boolean') {
      this.settings.canvasFlickerEnabled = flickerEnabled;
    }
    if (Number.isFinite(flickerIntensity)) {
      this.settings.canvasFlickerIntensity = flickerIntensity;
    }
    if (typeof flashEnabled === 'boolean') {
      this.settings.canvasFlashEnabled = flashEnabled;
    }
    if (Number.isFinite(flashIntensity)) {
      this.settings.canvasFlashIntensity = flashIntensity;
    }
    this.settings.qualityPreset = 'custom';
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update terminal scrolling settings
   */
  updateTerminalScrolling(forceScroll, frequency) {
    this.settings.terminalForceScroll = forceScroll;
    this.settings.terminalScrollFrequency = frequency;
    this.settings.qualityPreset = 'custom';
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update AI code snippet generation setting
   */
  updateAICodeSnippetGeneration(enabled) {
    this.settings.aiCodeSnippetGeneration = enabled;
    // Make sure the beta flag is always present
    this.settings.aiCodeSnippetBeta = true;
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update basic snippet fallback setting
   */
  updateAIBasicSnippetFallback(enabled) {
    this.settings.aiBasicSnippetFallbackEnabled = enabled;
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Update AI snippet model preference
   */
  updateAISnippetModel(modelId) {
    this.settings.aiSnippetModel =
      typeof modelId === 'string' && modelId.trim() ? modelId.trim() : null;
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Get current scaling factor based on settings and device
   */
  getScalingFactor() {
    // Base scaling factor from settings
    let factor = this.settings.renderScale;

    // Apply high-res screen adjustment if needed
    if (this.settings.isHighResScreen) {
      factor *= 0.8; // Reduce size by 20% on high-res screens
    }

    // Apply ultrawide adjustment if needed
    if (this.settings.isUltrawide) {
      factor *= 0.9; // Reduce size by another 10% on ultrawide
    }

    return factor;
  }

  /**
   * Get projectile visual complexity level
   * Used to determine whether to create detailed projectiles or simplified ones
   */
  getProjectileComplexity() {
    return this.settings.projectileComplexity;
  }

  /**
   * Check if projectile trails should be shown
   */
  shouldShowProjectileTrails() {
    return this.settings.projectileTrails;
  }

  /**
   * Get explosion size multiplier
   */
  getExplosionSizeMultiplier() {
    return this.settings.explosionSize;
  }

  /**
   * Get projectile duration multiplier
   * Affects how long projectiles stay on screen
   */
  getProjectileDurationMultiplier() {
    return this.settings.projectileDuration;
  }

  /**
   * Get maximum allowed projectiles
   */
  getMaxProjectiles() {
    return this.settings.maxProjectiles;
  }
}

// Create a singleton instance
const visualSettingsManager = new VisualSettingsManager();

export default visualSettingsManager;
