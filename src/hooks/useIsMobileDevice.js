import useResponsiveProfile from './useResponsiveProfile';

export default function useIsMobileDevice() {
  const responsiveProfile = useResponsiveProfile();

  return responsiveProfile.isHandheldLayout;
}
