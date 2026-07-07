import React from 'react';
import { PANEL_TYPES } from '../../../components/towerDefense/ui/layout/panelTypes';
import SlottableLayout from '../../../components/towerDefense/ui/layout/SlottableLayout';
import { EditorPanelSlotChrome, GamePanelSlotChrome, ProblemPanelSlotChrome } from './panels';

export default function TowerDefenseV2Layout({
  gameContent,
  editorContent,
  chatContent,
  problemContent,
  hiddenPanels,
  leftPanel,
  rightPanel,
  onPanelChange,
  panelActionsProps,
  defaultLeftPanel,
  defaultRightPanel,
  lockedSlots,
  shellTheme = 'default',
  allowEmbeddedHandheldPageScroll = false,
  desktopShellSizingMode = 'embedded',
  isGamePanelBlurred = false,
}) {
  const panelChromeByType = {
    [PANEL_TYPES.GAME]: <GamePanelSlotChrome {...panelActionsProps} shellTheme={shellTheme} />,
    [PANEL_TYPES.EDITOR]: <EditorPanelSlotChrome {...panelActionsProps} shellTheme={shellTheme} />,
    [PANEL_TYPES.PROBLEM]: (
      <ProblemPanelSlotChrome {...panelActionsProps} shellTheme={shellTheme} />
    ),
  };

  return (
    <SlottableLayout
      header={null}
      gameContent={gameContent}
      editorContent={editorContent}
      chatContent={chatContent}
      problemContent={problemContent}
      hiddenPanels={hiddenPanels}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      onPanelChange={onPanelChange}
      panelChromeByType={panelChromeByType}
      defaultLeftPanel={defaultLeftPanel}
      defaultRightPanel={defaultRightPanel}
      lockedSlots={lockedSlots}
      shellTheme={shellTheme}
      allowEmbeddedHandheldPageScroll={allowEmbeddedHandheldPageScroll}
      desktopShellSizingMode={desktopShellSizingMode}
      isGamePanelBlurred={isGamePanelBlurred}
    />
  );
}
