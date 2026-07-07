import { PANEL_TYPES } from '../ui/layout/panelTypes';

export const TD_ONBOARDING_STEP_CHANGE_EVENT = 'td-onboarding-step-change';
export const TD_ONBOARDING_REQUEST_STEP_COMPLETE_EVENT = 'td-onboarding-request-step-complete';

const resolveInlineSurfaceForPanel = (panelType) => {
  if (panelType === PANEL_TYPES.PROBLEM) {
    return 'problem';
  }

  if (panelType === PANEL_TYPES.EDITOR) {
    return 'editor';
  }

  if (panelType === PANEL_TYPES.GAME) {
    return 'game';
  }

  return null;
};

const getDesiredFocusedPanels = (step) => {
  const rightPanel = step?.panelFocus?.rightPanel;
  const leftPanel = step?.panelFocus?.leftPanel;

  return [rightPanel, leftPanel].filter(Boolean);
};

export const resolveInlineOnboardingSurface = (step, currentPanels = null) => {
  const desiredPanels = getDesiredFocusedPanels(step);

  if (currentPanels) {
    const visiblePanels = [currentPanels.leftPanel, currentPanels.rightPanel].filter(Boolean);

    for (const panelType of visiblePanels) {
      if (!desiredPanels.includes(panelType)) {
        continue;
      }

      const surface = resolveInlineSurfaceForPanel(panelType);
      if (surface) {
        return surface;
      }
    }
  }

  for (const panelType of desiredPanels) {
    const surface = resolveInlineSurfaceForPanel(panelType);
    if (surface) {
      return surface;
    }
  }

  return null;
};

export const resolveFocusedDesktopSlots = (step, currentPanels = {}) => {
  const desiredPanels = new Set(getDesiredFocusedPanels(step));

  if (!desiredPanels.size) {
    return {
      leftSlotFocused: false,
      rightSlotFocused: false,
    };
  }

  return {
    leftSlotFocused: Boolean(currentPanels.leftPanel && desiredPanels.has(currentPanels.leftPanel)),
    rightSlotFocused: Boolean(
      currentPanels.rightPanel && desiredPanels.has(currentPanels.rightPanel)
    ),
  };
};
