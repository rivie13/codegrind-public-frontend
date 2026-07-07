import { buildResponsiveProfile } from './responsiveProfile';

const detectPhoneFriendlyEditorMode = ({
  win = typeof window === 'undefined' ? null : window,
  nav = typeof navigator === 'undefined' ? null : navigator,
} = {}) => buildResponsiveProfile({ win, nav }).isPhoneEditorMode;

export default detectPhoneFriendlyEditorMode;
