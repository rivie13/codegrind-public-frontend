import { PANEL_TYPES } from './panelTypes';

export const resolveMobilePanelSizing = ({
  isMobileChatFocus,
  isCompactMobileLandscape,
  usePageScrollMobileShell = false,
}) => {
  if (isCompactMobileLandscape) {
    return {
      height: 'var(--td-mobile-stage-height, auto)',
      minHeight: 'var(--td-mobile-stage-min-height, 0px)',
    };
  }

  if (usePageScrollMobileShell) {
    return {
      height: isMobileChatFocus ? 'min(76dvh, 620px)' : 'clamp(320px, 68dvh, 560px)',
      minHeight: isMobileChatFocus ? '340px' : '320px',
    };
  }

  return {
    height: isMobileChatFocus ? 'calc(100dvh - 120px)' : 'min(86dvh, 920px)',
    minHeight: '520px',
  };
};

export const shouldUseFixedHeightMobilePanel = ({ activePanel, isCompactMobileLandscape }) =>
  Boolean(isCompactMobileLandscape) &&
  (activePanel === PANEL_TYPES.EDITOR || activePanel === PANEL_TYPES.CHAT);

export default resolveMobilePanelSizing;
