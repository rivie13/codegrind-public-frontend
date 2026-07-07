/**
 * Tower Defense Game V2 - Page State Hook
 *
 * Extracts the TowerDefenseV2Page logic into a reusable hook to keep the page component lean.
 */

import useTowerDefenseV2GameState from './useTowerDefenseV2GameState';
import useTowerDefenseV2PanelLayout from './useTowerDefenseV2PanelLayout';

export default function useTowerDefenseV2PageState({
  isDemo = false,
  demoTitleSlug = null,
  learningPathTitleSlug = null,
  learningPathSlug = null,
  learningPathOnboarding = false,
  learningTowerConfig = null,
  learningPathMeta = null,
  learningIsCapstone = false,
  embeddedShellTheme = 'retro-desktop',
  allowEmbeddedHandheldPageScroll = false,
  desktopShellSizingMode = 'embedded',
  onEmbeddedVictory = null,
  onEmbeddedLearningXp = null,
  demoLaunchStartTime = null,
}) {
  const { panelLayoutProps, ...state } = useTowerDefenseV2GameState({
    isDemo,
    demoTitleSlug,
    learningPathTitleSlug,
    learningPathSlug,
    learningPathOnboarding,
    learningTowerConfig,
    learningPathMeta,
    learningIsCapstone,
    embeddedShellTheme,
    onEmbeddedVictory,
    onEmbeddedLearningXp,
    demoLaunchStartTime,
  });

  const layout = useTowerDefenseV2PanelLayout({
    ...panelLayoutProps,
    shellTheme: embeddedShellTheme,
    allowEmbeddedHandheldPageScroll,
    desktopShellSizingMode,
  });

  return {
    ...state,
    layout,
  };
}
