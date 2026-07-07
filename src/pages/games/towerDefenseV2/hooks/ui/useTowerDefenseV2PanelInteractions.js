/**
 * Tower Defense V2 - Panel Interactions
 */

import { useCallback } from 'react';
import { PANEL_TYPES } from '../../../../../components/towerDefense/ui/layout/panelTypes';
import useGuestFunnel from '../../../../../hooks/guest/useGuestFunnel';

export default function useTowerDefenseV2PanelInteractions({
  setLeftPanel,
  setRightPanel,
  cancelProblemAutoSwitch,
  setShowProblemIntroNote,
  isHomepageDemo,
}) {
  const funnel = useGuestFunnel();

  const handlePanelChange = useCallback(
    ({ leftPanel: nextLeft, rightPanel: nextRight, reason }) => {
      setLeftPanel(nextLeft);
      setRightPanel(nextRight);

      if (isHomepageDemo) {
        if (nextLeft === PANEL_TYPES.PROBLEM || nextRight === PANEL_TYPES.PROBLEM) {
          funnel.problemOpened();
        }
        if (nextLeft === PANEL_TYPES.EDITOR || nextRight === PANEL_TYPES.EDITOR) {
          funnel.editorOpened();
        }
      }

      if (reason?.startsWith('user')) {
        cancelProblemAutoSwitch();
        setShowProblemIntroNote(false);
      }
    },
    [
      cancelProblemAutoSwitch,
      setLeftPanel,
      setRightPanel,
      setShowProblemIntroNote,
      isHomepageDemo,
      funnel,
    ]
  );

  return { handlePanelChange };
}
