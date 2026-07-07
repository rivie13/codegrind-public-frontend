import useResponsiveProfile from './useResponsiveProfile';
import { buildResponsiveProfile } from '../utils/web/responsiveProfile';

export const detectCompactLandscapeShellMode = ({
  standaloneOnly = false,
  win = typeof window === 'undefined' ? null : window,
  nav = typeof navigator === 'undefined' ? null : navigator,
} = {}) => {
  const responsiveProfile = buildResponsiveProfile({ win, nav });
  if (!responsiveProfile.isCompactLandscapeShellMode) return false;
  if (!standaloneOnly) return true;

  return responsiveProfile.isStandaloneDisplayMode;
};

const useCompactLandscapeShellMode = (options = {}) => {
  const standaloneOnly = Boolean(options.standaloneOnly);
  const responsiveProfile = useResponsiveProfile();

  return (
    responsiveProfile.isCompactLandscapeShellMode &&
    (!standaloneOnly || responsiveProfile.isStandaloneDisplayMode)
  );
};

export default useCompactLandscapeShellMode;
