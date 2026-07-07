import { useContext } from 'react';
import { ResponsiveContext, useResponsiveProfileState } from '../contexts/ResponsiveContext';

export default function useResponsiveProfile() {
  const contextValue = useContext(ResponsiveContext);
  const fallbackProfile = useResponsiveProfileState(contextValue == null);

  return contextValue ?? fallbackProfile;
}
