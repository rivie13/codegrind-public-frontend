import { useCallback, useEffect, useMemo, useState } from 'react';
import visualSettingsManager from '../../../../../utils/game/VisualSettingsManager';
import { validateGameSettings } from '../../../../../utils/problems/difficultyConfig';

export default function useTowerDefenseV2SettingsState({
  activeTitleSlug,
  learningPathOnboarding,
  problemDifficulty,
  learningTowerConfig = null
}) {
  const resolveAiCodeSnippetsEnabled = useCallback((visualSettings) => {
    return visualSettings.aiCodeSnippetGeneration !== false;
  }, []);

  const [gameSettings, setGameSettings] = useState(() => {
    const visualSettings = visualSettingsManager.getSettings();
    const overrideWaves = Number.isFinite(learningTowerConfig?.waves)
      ? Math.max(1, Math.floor(learningTowerConfig.waves))
      : null;
    return {
      startingCredits: null,
      startingLives: null,
      enemyHealthMultiplier: 1,
      enemySpeedMultiplier: 1,
      totalWaves: overrideWaves,
      hardcoreMode: false,
      aiChatEnabled: true,
      aiCodeSnippetsEnabled: resolveAiCodeSnippetsEnabled(visualSettings),
      towerSelectorEnabled: true,
      deployableMenuEnabled: true,
      autoStartWaves: false
    };
  });
  const [settingsLocked, setSettingsLocked] = useState(false);

  useEffect(() => {
    setSettingsLocked(false);
  }, [activeTitleSlug]);

  useEffect(() => {
    const overrideWaves = Number.isFinite(learningTowerConfig?.waves)
      ? Math.max(1, Math.floor(learningTowerConfig.waves))
      : null;
    const visualSettings = visualSettingsManager.getSettings();
    setGameSettings((prev) => ({
      ...prev,
      totalWaves: overrideWaves ?? prev.totalWaves,
      aiChatEnabled: prev.aiChatEnabled,
      aiCodeSnippetsEnabled: resolveAiCodeSnippetsEnabled(visualSettings),
      deployableMenuEnabled: prev.deployableMenuEnabled
    }));
  }, [activeTitleSlug, learningPathOnboarding, learningTowerConfig?.waves, resolveAiCodeSnippetsEnabled]);

  const validatedGameSettings = useMemo(
    () => validateGameSettings(gameSettings, problemDifficulty, {
      allowLowerTotalWaves: Boolean(learningTowerConfig?.waves)
    }),
    [gameSettings, learningTowerConfig?.waves, problemDifficulty]
  );

  const handleGameSettingsChange = useCallback((updates) => {
    setGameSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const lockGameSettings = useCallback(() => {
    setSettingsLocked(true);
  }, []);

  useEffect(() => {
    const enabled = validatedGameSettings.aiCodeSnippetsEnabled !== false;
    visualSettingsManager.updateAICodeSnippetGeneration(enabled);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('td-ai-snippet-setting-changed', {
        detail: { enabled }
      }));
    }
  }, [validatedGameSettings.aiCodeSnippetsEnabled]);

  return {
    gameSettings,
    handleGameSettingsChange,
    lockGameSettings,
    setSettingsLocked,
    settingsLocked,
    validatedGameSettings
  };
}
