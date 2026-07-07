import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import audioManager from '../../../utils/audio/AudioManager';
import audioService from '../../../utils/audio/AudioService';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../utils/assets/towerDefenseAssetUrls';
import visualSettingsManager from '../../../utils/game/VisualSettingsManager';
import {
  DEFAULT_GAME_SETTINGS,
  HARDCORE_GAME_SETTINGS,
} from '../../../utils/problems/difficultyConfig';
import {
  AISettingsSection,
  TutorialControlsSection,
  SettingsAccordionSections,
  MusicSettingsSection,
} from './SettingsMenuSections';

const TD_OPEN_SETTINGS_PENDING_KEY = 'td-open-settings-menu';

/**
 * SettingsMenu component for Tower Defense game
 * Provides audio and visual settings controls
 */
const SettingsMenu = ({
  isOpen,
  onClose,
  buttonRef,
  gameSettings,
  onGameSettingsChange,
  canEditGameSettings = false,
  difficultyMinimums,
}) => {
  // Audio settings state
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEffectsVolume, setSoundEffectsVolume] = useState(0.17);
  const [musicVolume, setMusicVolume] = useState(0.14);

  // Current track info
  const [currentTrack, setCurrentTrack] = useState(null);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState('');

  // Visual settings state
  const [qualityPreset, setQualityPreset] = useState('auto');
  const [renderScale, setRenderScale] = useState(1.0);
  const [maxProjectiles, setMaxProjectiles] = useState(100);
  const [particleEffects, setParticleEffects] = useState(true);
  const [particleIntensity, setParticleIntensity] = useState(0.7);

  // Projectile specific settings
  const [projectileComplexity, setProjectileComplexity] = useState(1.0);
  const [projectileTrails, setProjectileTrails] = useState(true);
  const [projectileGlow, setProjectileGlow] = useState(true);
  const [projectileAnimations, setProjectileAnimations] = useState(true);
  const [explosionSize, setExplosionSize] = useState(1.0);
  const [explosionParticles, setExplosionParticles] = useState(true);
  const [projectileDuration, setProjectileDuration] = useState(1.0);

  // Terminal settings
  const [terminalGlitchEnabled, setTerminalGlitchEnabled] = useState(true);
  const [terminalGlitchIntensity, setTerminalGlitchIntensity] = useState(0.8);
  const [terminalTypingEnabled, setTerminalTypingEnabled] = useState(true);
  const [terminalTypingSpeed, setTerminalTypingSpeed] = useState(0.7);

  // Editor matrix settings
  const [editorMatrixEnabled, setEditorMatrixEnabled] = useState(true);
  const [editorMatrixIntensity, setEditorMatrixIntensity] = useState(0.7);
  const [editorMatrixVisibleLinesMin, setEditorMatrixVisibleLinesMin] = useState(1);
  const [editorMatrixVisibleLinesMax, setEditorMatrixVisibleLinesMax] = useState(12);

  // Canvas glitch settings
  const [canvasGlitchEnabled, setCanvasGlitchEnabled] = useState(true);
  const [canvasGlitchIntensity, setCanvasGlitchIntensity] = useState(0.6);
  const [canvasFlickerEnabled, setCanvasFlickerEnabled] = useState(true);
  const [canvasFlickerIntensity, setCanvasFlickerIntensity] = useState(0.6);
  const [canvasFlashEnabled, setCanvasFlashEnabled] = useState(true);
  const [canvasFlashIntensity, setCanvasFlashIntensity] = useState(0.5);

  // Terminal scrolling settings
  const [terminalForceScroll, setTerminalForceScroll] = useState(true);
  const [terminalScrollFrequency, setTerminalScrollFrequency] = useState('every');

  // Special effects
  const [explosionEffects, setExplosionEffects] = useState(true);
  const [hitEffects, setHitEffects] = useState(true);
  const [combatText, setCombatText] = useState(true);

  // AI Code Snippet Generation
  const [aiCodeSnippetGeneration, setAICodeSnippetGeneration] = useState(true);
  const [basicSnippetFallbackEnabled, setBasicSnippetFallbackEnabled] = useState(false);
  const [showSnippetAdPrompt, setShowSnippetAdPrompt] = useState(true);
  const [selectedSnippetModel, setSelectedSnippetModel] = useState(null);
  const snippetAdPromptKey = 'td_snippet_ad_prompt_opt_out';

  const showGameSettings = Boolean(gameSettings && onGameSettingsChange && difficultyMinimums);
  const startingCreditsValue = gameSettings?.startingCredits ?? difficultyMinimums?.initialCredits;
  const startingLivesValue = gameSettings?.startingLives ?? difficultyMinimums?.initialLives;
  const enemyHealthValue =
    gameSettings?.enemyHealthMultiplier ?? difficultyMinimums?.baseEnemyHealth ?? 1;
  const enemySpeedValue =
    gameSettings?.enemySpeedMultiplier ?? difficultyMinimums?.baseEnemySpeed ?? 1;
  const totalWavesValue = gameSettings?.totalWaves ?? difficultyMinimums?.totalWaves;
  const hardcoreModeValue = Boolean(gameSettings?.hardcoreMode);
  const aiChatEnabledValue = gameSettings?.aiChatEnabled ?? DEFAULT_GAME_SETTINGS.aiChatEnabled;
  const aiCodeSnippetsEnabledValue =
    gameSettings?.aiCodeSnippetsEnabled ?? DEFAULT_GAME_SETTINGS.aiCodeSnippetsEnabled;
  const towerSelectorEnabledValue =
    gameSettings?.towerSelectorEnabled ?? DEFAULT_GAME_SETTINGS.towerSelectorEnabled;
  const deployableMenuEnabledValue =
    gameSettings?.deployableMenuEnabled ?? DEFAULT_GAME_SETTINGS.deployableMenuEnabled;
  const autoStartWavesValue = gameSettings?.autoStartWaves ?? DEFAULT_GAME_SETTINGS.autoStartWaves;

  const isHardcorePreset = (settings = {}) =>
    Object.entries(HARDCORE_GAME_SETTINGS).every(([key, value]) => {
      const current = settings[key] ?? DEFAULT_GAME_SETTINGS[key];
      return current === value;
    });

  const applySettingsUpdate = (updates) => {
    if (!onGameSettingsChange) return;
    const merged = { ...gameSettings, ...updates };
    if (merged.hardcoreMode && !isHardcorePreset(merged)) {
      onGameSettingsChange({ ...updates, hardcoreMode: false });
      return;
    }
    onGameSettingsChange(updates);
  };

  const refreshAvailableTracks = (track) => {
    const excludeIds = track?.id ? [track.id] : [];
    setAvailableTracks(
      audioService.getSelectableTracks({
        limit: 15,
        excludeIds,
      })
    );
  };

  // Load current settings on mount
  useEffect(() => {
    // Load audio settings
    const audioSettings = audioManager.getSettings();
    setSoundEffectsEnabled(audioSettings.soundEffectsEnabled);
    setMusicEnabled(audioSettings.musicEnabled);
    setSoundEffectsVolume(audioSettings.soundEffectsVolume);
    setMusicVolume(audioSettings.musicVolume);

    // Get current track
    const activeTrack = audioService.getCurrentTrack();
    setCurrentTrack(activeTrack);

    // Get available tracks (random sample)
    refreshAvailableTracks(activeTrack);

    // Load visual settings
    const visualSettings = visualSettingsManager.getSettings();
    setQualityPreset(visualSettings.qualityPreset);
    setRenderScale(visualSettings.renderScale);
    setMaxProjectiles(visualSettings.maxProjectiles);
    setParticleEffects(visualSettings.particleEffects);
    setParticleIntensity(visualSettings.particleIntensity);

    // Load projectile settings
    setProjectileComplexity(visualSettings.projectileComplexity);
    setProjectileTrails(visualSettings.projectileTrails);
    setProjectileGlow(visualSettings.projectileGlow);
    setProjectileAnimations(visualSettings.projectileAnimations);
    setExplosionSize(visualSettings.explosionSize);
    setExplosionParticles(visualSettings.explosionParticles);
    setProjectileDuration(visualSettings.projectileDuration);

    // Load terminal settings
    setTerminalGlitchEnabled(visualSettings.terminalGlitchEnabled);
    setTerminalGlitchIntensity(visualSettings.terminalGlitchIntensity);
    setTerminalTypingEnabled(visualSettings.terminalTypingEnabled);
    setTerminalTypingSpeed(visualSettings.terminalTypingSpeed);

    // Load editor matrix settings
    setEditorMatrixEnabled(visualSettings.editorMatrixEnabled);
    setEditorMatrixIntensity(visualSettings.editorMatrixIntensity);
    setEditorMatrixVisibleLinesMin(visualSettings.editorMatrixVisibleLinesMin ?? 1);
    setEditorMatrixVisibleLinesMax(visualSettings.editorMatrixVisibleLinesMax ?? 5);

    // Load canvas glitch settings
    setCanvasGlitchEnabled(visualSettings.canvasGlitchEnabled);
    setCanvasGlitchIntensity(visualSettings.canvasGlitchIntensity);
    setCanvasFlickerEnabled(visualSettings.canvasFlickerEnabled ?? true);
    setCanvasFlickerIntensity(visualSettings.canvasFlickerIntensity ?? 0.6);
    setCanvasFlashEnabled(visualSettings.canvasFlashEnabled ?? true);
    setCanvasFlashIntensity(visualSettings.canvasFlashIntensity ?? 0.5);

    // Load terminal scrolling settings
    setTerminalForceScroll(visualSettings.terminalForceScroll);
    setTerminalScrollFrequency(visualSettings.terminalScrollFrequency);

    // Load special effects settings
    setExplosionEffects(visualSettings.explosionEffects);
    setHitEffects(visualSettings.hitEffects);
    setCombatText(visualSettings.combatText !== undefined ? visualSettings.combatText : true);

    // Load AI code snippet generation setting
    setAICodeSnippetGeneration(
      visualSettings.aiCodeSnippetGeneration !== undefined
        ? visualSettings.aiCodeSnippetGeneration
        : true
    );
    setBasicSnippetFallbackEnabled(visualSettings.aiBasicSnippetFallbackEnabled === true);
    setSelectedSnippetModel(
      typeof visualSettings.aiSnippetModel === 'string' && visualSettings.aiSnippetModel.trim()
        ? visualSettings.aiSnippetModel
        : null
    );

    try {
      const promptHidden = localStorage.getItem(snippetAdPromptKey) === 'true';
      setShowSnippetAdPrompt(!promptHidden);
    } catch {
      setShowSnippetAdPrompt(true);
    }

    // Add listener for track changes
    const handleTrackChange = (event) => {
      setCurrentTrack(event.detail);
      refreshAvailableTracks(event.detail);
    };

    window.addEventListener('td-track-changed', handleTrackChange);

    return () => {
      window.removeEventListener('td-track-changed', handleTrackChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!showGameSettings) return;
    if (typeof gameSettings?.aiCodeSnippetsEnabled === 'boolean') {
      const nextValue = gameSettings.aiCodeSnippetsEnabled;
      setAICodeSnippetGeneration(nextValue);
      visualSettingsManager.updateAICodeSnippetGeneration(nextValue);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('td-ai-snippet-setting-changed', {
            detail: { enabled: nextValue },
          })
        );
      }
    }
  }, [gameSettings?.aiCodeSnippetsEnabled, showGameSettings]);

  // Update sound effects settings
  const handleSoundEffectsToggle = () => {
    const newValue = !soundEffectsEnabled;
    setSoundEffectsEnabled(newValue);
    audioManager.updateSoundEffectsSettings(newValue, soundEffectsVolume);

    // Play button click sound
    audioManager.playSoundEffect('button-click');

    // Play a test sound if enabling sound effects
    if (newValue) {
      setTimeout(() => {
        audioManager.playSoundEffect('ui-hover');
      }, 300);
    }
  };

  // Update music settings
  const handleMusicToggle = () => {
    const newValue = !musicEnabled;
    setSoundEffectsEnabled(soundEffectsEnabled); // Ensure sound effects state is preserved
    setMusicEnabled(newValue);
    audioManager.updateMusicSettings(newValue, musicVolume);
    audioManager.playSoundEffect('button-click');

    // If enabling music, restart playing the current track or default gameplay music
    if (newValue) {
      if (currentTrack) {
        audioService.playBackgroundMusic('default', currentTrack.id);
      } else {
        audioService.playBackgroundMusic('random');
      }
    }
  };

  // Update sound effects volume
  const handleSoundEffectsVolumeChange = (value) => {
    setSoundEffectsVolume(value);
    audioManager.updateSoundEffectsSettings(soundEffectsEnabled, value);

    // Play a test sound when adjusting volume
    if (soundEffectsEnabled && value > 0) {
      // Throttle sound playing during slider drag
      if (Math.round(value * 100) % 10 === 0) {
        audioManager.playSoundEffect('ui-hover');
      }
    }
  };

  // Update music volume
  const handleMusicVolumeChange = (value) => {
    setMusicVolume(value);
    audioManager.updateMusicSettings(musicEnabled, value);
  };

  // Apply quality preset
  const handleQualityPresetChange = (preset) => {
    const settings = visualSettingsManager.applyQualityPreset(preset);
    setQualityPreset(settings.qualityPreset);

    // Update all settings from the preset
    setRenderScale(settings.renderScale);
    setMaxProjectiles(settings.maxProjectiles);
    setParticleEffects(settings.particleEffects);
    setParticleIntensity(settings.particleIntensity);

    // Update projectile settings
    setProjectileComplexity(settings.projectileComplexity);
    setProjectileTrails(settings.projectileTrails);
    setProjectileGlow(settings.projectileGlow);
    setProjectileAnimations(settings.projectileAnimations);
    setExplosionSize(settings.explosionSize);
    setExplosionParticles(settings.explosionParticles);
    setProjectileDuration(settings.projectileDuration);

    // Update terminal settings
    setTerminalGlitchEnabled(settings.terminalGlitchEnabled);
    setTerminalGlitchIntensity(settings.terminalGlitchIntensity);
    setTerminalTypingEnabled(settings.terminalTypingEnabled);
    setTerminalTypingSpeed(settings.terminalTypingSpeed);

    // Update editor matrix settings
    setEditorMatrixEnabled(settings.editorMatrixEnabled);
    setEditorMatrixIntensity(settings.editorMatrixIntensity);
    setEditorMatrixVisibleLinesMin(settings.editorMatrixVisibleLinesMin ?? 1);
    setEditorMatrixVisibleLinesMax(settings.editorMatrixVisibleLinesMax ?? 5);

    // Update canvas glitch settings
    setCanvasGlitchEnabled(settings.canvasGlitchEnabled);
    setCanvasGlitchIntensity(settings.canvasGlitchIntensity);
    setCanvasFlickerEnabled(settings.canvasFlickerEnabled ?? true);
    setCanvasFlickerIntensity(settings.canvasFlickerIntensity ?? 0.6);
    setCanvasFlashEnabled(settings.canvasFlashEnabled ?? true);
    setCanvasFlashIntensity(settings.canvasFlashIntensity ?? 0.5);

    // Update terminal scrolling settings
    setTerminalForceScroll(settings.terminalForceScroll);
    setTerminalScrollFrequency(settings.terminalScrollFrequency);

    // Update special effects settings
    setExplosionEffects(settings.explosionEffects);
    setHitEffects(settings.hitEffects);
    setCombatText(settings.combatText !== undefined ? settings.combatText : true);

    // Play sound effect
    audioManager.playSoundEffect('button-click');
  };

  // Update render scale
  const handleRenderScaleChange = (value) => {
    setRenderScale(value);
    visualSettingsManager.updateRenderScale(value);
    setQualityPreset('custom');
  };

  // Update projectile settings
  const handleProjectileSettingsChange = () => {
    visualSettingsManager.updateProjectileVisuals(
      projectileComplexity,
      projectileTrails,
      projectileGlow,
      projectileAnimations,
      explosionSize,
      explosionParticles,
      projectileDuration
    );

    visualSettingsManager.updateEffectsSettings(maxProjectiles, particleEffects, particleIntensity);

    setQualityPreset('custom');
  };

  // Update special effects
  const handleSpecialEffectsChange = () => {
    visualSettingsManager.updateSpecialEffects(explosionEffects, hitEffects, combatText);

    setQualityPreset('custom');
  };

  const syncAICodeSnippetSetting = (nextValue, { updateGameSettings = false } = {}) => {
    setAICodeSnippetGeneration(nextValue);
    visualSettingsManager.updateAICodeSnippetGeneration(nextValue);

    if (updateGameSettings && showGameSettings && onGameSettingsChange) {
      applySettingsUpdate({ aiCodeSnippetsEnabled: nextValue });
    }

    // Play sound effect for feedback
    audioManager.playSoundEffect('ui-hover');

    // Trigger event to update components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('td-ai-snippet-setting-changed', {
          detail: { enabled: nextValue },
        })
      );
    }
  };

  // Update AI code snippet generation setting
  const handleAICodeSnippetToggle = () => {
    const newValue = !aiCodeSnippetGeneration;
    //console.log(`[DEBUG] AI Code Snippet setting toggled to: ${newValue}`);
    syncAICodeSnippetSetting(newValue, {
      updateGameSettings: showGameSettings && canEditGameSettings,
    });
  };

  const handleBasicSnippetFallbackToggle = () => {
    const newValue = !basicSnippetFallbackEnabled;
    setBasicSnippetFallbackEnabled(newValue);
    visualSettingsManager.updateAIBasicSnippetFallback(newValue);
    audioManager.playSoundEffect('ui-hover');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('td-basic-snippet-setting-changed', {
          detail: { enabled: newValue },
        })
      );
    }
  };

  const handleSnippetModelChange = (modelId) => {
    const nextModel = typeof modelId === 'string' && modelId.trim() ? modelId.trim() : null;
    setSelectedSnippetModel(nextModel);
    visualSettingsManager.updateAISnippetModel(nextModel);
    audioManager.playSoundEffect('ui-hover');
  };

  const handleSnippetAdPromptToggle = () => {
    const nextValue = !showSnippetAdPrompt;
    setShowSnippetAdPrompt(nextValue);
    try {
      localStorage.setItem(snippetAdPromptKey, String(!nextValue));
      window.dispatchEvent(
        new CustomEvent('td-snippet-ad-prompt-changed', {
          detail: { hidden: !nextValue },
        })
      );
    } catch {
      // Ignore storage errors
    }
    audioManager.playSoundEffect('ui-hover');
  };

  // Handle track selection
  const handleTrackSelect = (trackId) => {
    setSelectedTrackId(trackId);
    if (trackId) {
      audioService.playBackgroundMusic('default', trackId);
      const nextTrack = audioService.findTrackById?.(trackId) || null;
      refreshAvailableTracks(nextTrack);
    }
    audioManager.playSoundEffect('button-click');
  };

  const retroDrawerBodySx = {
    '&::-webkit-scrollbar': {
      width: '12px',
      backgroundColor: '#d4d0c8',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#7f7f7f',
      borderRadius: '0',
      border: '2px solid #d4d0c8',
      '&:hover': {
        backgroundColor: '#5d636e',
      },
    },
    '.td-settings-panel': {
      bg: '#efebe7',
      border: '2px solid #5d636e',
      boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)',
      p: 3,
      mb: 4,
    },
    '.td-settings-panel:last-of-type': {
      mb: 0,
    },
    '.td-settings-panel .chakra-heading, .td-settings-panel .chakra-text, .td-settings-panel .chakra-form__label, .td-settings-panel .chakra-badge, .td-settings-panel label, .td-settings-panel p, .td-settings-panel span':
      {
        color: '#1f2430 !important',
        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif !important",
        textShadow: 'none !important',
      },
    '.td-settings-panel .chakra-heading': {
      color: '#0a2c9a !important',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      borderColor: '#7f7f7f !important',
    },
    '.td-settings-panel a': {
      color: '#0a2c9a !important',
      textDecoration: 'underline',
    },
    '.td-settings-panel svg, .td-settings-panel .chakra-icon': {
      color: '#0a2c9a',
      stroke: '#0a2c9a',
    },
    '.td-settings-panel .chakra-accordion__button': {
      bg: '#d4d0c8 !important',
      color: '#1f2430 !important',
      border: '2px solid #7f7f7f !important',
      borderRadius: '0 !important',
      boxShadow:
        'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22) !important',
    },
    '.td-settings-panel .chakra-accordion__button:hover': {
      bg: '#efebe7 !important',
    },
    '.td-settings-panel .chakra-accordion__button[aria-expanded="true"]': {
      bg: 'linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%) !important',
      color: '#ffffff !important',
    },
    '.td-settings-panel .chakra-accordion__button[aria-expanded="true"] svg, .td-settings-panel .chakra-accordion__button[aria-expanded="true"] .chakra-icon':
      {
        color: '#ffffff !important',
        stroke: '#ffffff !important',
      },
    '.td-settings-panel .chakra-accordion__panel': {
      bg: '#efebe7 !important',
      border: '2px solid #7f7f7f !important',
      borderTop: 'none !important',
      borderRadius: '0 !important',
      padding: '16px !important',
    },
    '.td-settings-panel .chakra-divider': {
      borderColor: '#7f7f7f !important',
    },
    '.td-settings-panel .chakra-badge': {
      bg: '#d4d0c8 !important',
      border: '1px solid #7f7f7f !important',
      borderRadius: '0 !important',
      fontWeight: '700',
    },
    '.td-settings-panel .chakra-button': {
      bgImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '100% 100%',
      bg: '#d4d0c8 !important',
      color: '#1f2430 !important',
      borderRadius: '0 !important',
      border: '1px solid rgba(31, 36, 48, 0.35) !important',
      boxShadow: 'none !important',
      fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif !important",
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    '.td-settings-panel .chakra-button:hover': {
      bgImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
      transform: 'translateY(1px)',
      bg: '#d4d0c8 !important',
    },
    '.td-settings-panel .chakra-switch__track': {
      bg: '#b7b4ac !important',
      border: '2px solid #5d636e !important',
      borderRadius: '0 !important',
      boxShadow:
        'inset 1px 1px 0 rgba(255,255,255,0.5), inset -1px -1px 0 rgba(64,64,64,0.25) !important',
    },
    '.td-settings-panel .chakra-switch__track[data-checked]': {
      bg: '#0f6f17 !important',
      borderColor: '#335b34 !important',
    },
    '.td-settings-panel .chakra-switch__thumb': {
      bg: '#efebe7 !important',
      border: '1px solid #5d636e !important',
      borderRadius: '0 !important',
    },
    '.td-settings-panel .chakra-slider__track': {
      bg: '#b7b4ac !important',
      border: '1px solid #7f7f7f !important',
      borderRadius: '0 !important',
    },
    '.td-settings-panel .chakra-slider__filled-track': {
      bg: '#0a2c9a !important',
    },
    '.td-settings-panel .chakra-slider__thumb': {
      bg: '#d4d0c8 !important',
      border: '2px solid #5d636e !important',
      borderRadius: '0 !important',
      boxShadow:
        'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22) !important',
    },
    '.td-settings-panel select, .td-settings-panel option, .td-settings-panel optgroup': {
      background: '#efebe7 !important',
      color: '#1f2430 !important',
      fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif !important",
    },
    '.td-settings-panel select': {
      border: '2px solid #5d636e !important',
      borderRadius: '0 !important',
    },
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={() => {
        //console.log("Drawer close triggered");
        audioManager.playSoundEffect('button-click');
        onClose();
      }}
      finalFocusRef={buttonRef}
      size="md"
    >
      <DrawerOverlay bg="rgba(9, 18, 34, 0.28)" backdropFilter="blur(2px)" />
      <DrawerContent
        className="cg-panel-window"
        bg="#d4d0c8"
        color="#1f2430"
        borderLeft="2px solid #5d636e"
        boxShadow="var(--cg-window-outset), 12px 12px 0 rgba(0, 0, 0, 0.16)"
      >
        <DrawerCloseButton
          zIndex={9000}
          color="#1f2430"
          borderRadius="0"
          border="1px solid #5d636e"
          bg="#d4d0c8"
          _hover={{
            bg: '#efebe7',
            transform: 'translateY(1px)',
          }}
          onClick={() => {
            audioManager.playSoundEffect('button-click');
            onClose();
          }}
        />
        <DrawerHeader
          className="cg-titlebar"
          borderBottomWidth="2px"
          borderColor="#5d636e"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          color="#ffffff"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          <Flex align="center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '10px' }}
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Tower Defense Control Panel
          </Flex>
        </DrawerHeader>

        <DrawerBody bg="#d4d0c8" sx={retroDrawerBodySx}>
          <Box className="td-settings-panel">
            <AISettingsSection
              aiCodeSnippetGeneration={aiCodeSnippetGeneration}
              basicSnippetFallbackEnabled={basicSnippetFallbackEnabled}
              showSnippetAdPrompt={showSnippetAdPrompt}
              handleAICodeSnippetToggle={handleAICodeSnippetToggle}
              handleBasicSnippetFallbackToggle={handleBasicSnippetFallbackToggle}
              handleSnippetAdPromptToggle={handleSnippetAdPromptToggle}
              selectedSnippetModel={selectedSnippetModel}
              handleSnippetModelChange={handleSnippetModelChange}
              isSnippetToggleDisabled={showGameSettings && !canEditGameSettings}
            />
          </Box>

          <Box className="td-settings-panel">
            <TutorialControlsSection onClose={onClose} />
          </Box>

          <Box className="td-settings-panel">
            <SettingsAccordionSections
              showGameSettings={showGameSettings}
              gameplayProps={{
                canEditGameSettings,
                difficultyMinimums,
                startingCreditsValue,
                startingLivesValue,
                enemyHealthValue,
                enemySpeedValue,
                totalWavesValue,
                hardcoreModeValue,
                aiChatEnabledValue,
                aiCodeSnippetsEnabledValue,
                towerSelectorEnabledValue,
                deployableMenuEnabledValue,
                autoStartWavesValue,
                applySettingsUpdate,
                syncAICodeSnippetSetting,
                onGameSettingsChange,
                HARDCORE_GAME_SETTINGS,
              }}
              audioProps={{
                soundEffectsEnabled,
                soundEffectsVolume,
                handleSoundEffectsToggle,
                handleSoundEffectsVolumeChange,
              }}
              visualProps={{
                qualityPreset,
                renderScale,
                handleQualityPresetChange,
                handleRenderScaleChange,
                maxProjectiles,
                setMaxProjectiles,
                particleEffects,
                setParticleEffects,
                particleIntensity,
                setParticleIntensity,
                projectileComplexity,
                setProjectileComplexity,
                projectileTrails,
                setProjectileTrails,
                projectileGlow,
                setProjectileGlow,
                projectileAnimations,
                setProjectileAnimations,
                explosionSize,
                setExplosionSize,
                explosionParticles,
                setExplosionParticles,
                projectileDuration,
                setProjectileDuration,
                explosionEffects,
                setExplosionEffects,
                hitEffects,
                setHitEffects,
                combatText,
                setCombatText,
                handleProjectileSettingsChange,
                handleSpecialEffectsChange,
              }}
              terminalProps={{
                terminalGlitchEnabled,
                setTerminalGlitchEnabled,
                terminalGlitchIntensity,
                setTerminalGlitchIntensity,
                terminalTypingEnabled,
                setTerminalTypingEnabled,
                terminalTypingSpeed,
                setTerminalTypingSpeed,
                editorMatrixEnabled,
                setEditorMatrixEnabled,
                editorMatrixIntensity,
                setEditorMatrixIntensity,
                editorMatrixVisibleLinesMin,
                setEditorMatrixVisibleLinesMin,
                editorMatrixVisibleLinesMax,
                setEditorMatrixVisibleLinesMax,
                canvasGlitchEnabled,
                setCanvasGlitchEnabled,
                canvasGlitchIntensity,
                setCanvasGlitchIntensity,
                canvasFlickerEnabled,
                setCanvasFlickerEnabled,
                canvasFlickerIntensity,
                setCanvasFlickerIntensity,
                canvasFlashEnabled,
                setCanvasFlashEnabled,
                canvasFlashIntensity,
                setCanvasFlashIntensity,
                terminalForceScroll,
                setTerminalForceScroll,
                terminalScrollFrequency,
                setTerminalScrollFrequency,
                setQualityPreset,
              }}
            />
          </Box>

          <Box className="td-settings-panel">
            <MusicSettingsSection
              currentTrack={currentTrack}
              availableTracks={availableTracks}
              selectedTrackId={selectedTrackId}
              musicEnabled={musicEnabled}
              musicVolume={musicVolume}
              handleMusicToggle={handleMusicToggle}
              handleMusicVolumeChange={handleMusicVolumeChange}
              handleTrackSelect={handleTrackSelect}
            />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

/**
 * Settings Button component that opens the settings drawer
 */
const SettingsButton = ({
  gameSettings,
  onGameSettingsChange,
  canEditGameSettings,
  difficultyMinimums,
  buttonProps = {},
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef();

  useEffect(() => {
    const handleOpenRequest = () => {
      onOpen();
    };

    window.addEventListener('td-open-settings-menu', handleOpenRequest);

    try {
      if (sessionStorage.getItem(TD_OPEN_SETTINGS_PENDING_KEY) === '1') {
        sessionStorage.removeItem(TD_OPEN_SETTINGS_PENDING_KEY);
        onOpen();
      }
    } catch {
      // Ignore storage access errors.
    }

    return () => {
      window.removeEventListener('td-open-settings-menu', handleOpenRequest);
    };
  }, [onOpen]);

  return (
    <>
      <IconButton
        ref={btnRef}
        icon={<SettingsIcon />}
        title="Game Settings"
        onMouseEnter={() => audioManager.playSoundEffect('ui-hover')}
        onClick={() => {
          audioManager.playSoundEffect('button-click');
          onOpen();
        }}
        aria-label="Game Settings"
        variant="ghost"
        colorScheme="cyan"
        size="md"
        data-tutorial="settings-button"
        {...buttonProps}
      />
      <SettingsMenu
        isOpen={isOpen}
        onClose={onClose}
        buttonRef={btnRef}
        gameSettings={gameSettings}
        onGameSettingsChange={onGameSettingsChange}
        canEditGameSettings={canEditGameSettings}
        difficultyMinimums={difficultyMinimums}
      />
    </>
  );
};

// Settings gear icon component
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export { SettingsButton, SettingsMenu };
export default SettingsButton;
