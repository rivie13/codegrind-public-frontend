import React, { createContext, useEffect, useState } from 'react';
import { RESPONSIVE_MEDIA_QUERIES, buildResponsiveProfile } from '../utils/web/responsiveProfile';

export const ResponsiveContext = createContext(null);

export const useResponsiveProfileState = (enabled = true) => {
  const [profile, setProfile] = useState(() => buildResponsiveProfile());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const evaluate = () => {
      setProfile(buildResponsiveProfile());
    };

    evaluate();

    const visualViewport = window.visualViewport || null;

    window.addEventListener('resize', evaluate);
    window.addEventListener('orientationchange', evaluate);
    visualViewport?.addEventListener?.('resize', evaluate);
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', evaluate);
    }

    if (typeof window.matchMedia !== 'function') {
      return () => {
        window.removeEventListener('resize', evaluate);
        window.removeEventListener('orientationchange', evaluate);
        visualViewport?.removeEventListener?.('resize', evaluate);
        if (typeof document !== 'undefined') {
          document.removeEventListener('fullscreenchange', evaluate);
        }
      };
    }

    const mediaQueries = RESPONSIVE_MEDIA_QUERIES.map((query) => window.matchMedia(query));
    mediaQueries.forEach((mq) => mq.addEventListener('change', evaluate));

    return () => {
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', evaluate);
      visualViewport?.removeEventListener?.('resize', evaluate);
      if (typeof document !== 'undefined') {
        document.removeEventListener('fullscreenchange', evaluate);
      }
      mediaQueries.forEach((mq) => mq.removeEventListener('change', evaluate));
    };
  }, [enabled]);

  return profile;
};

export const ResponsiveProvider = ({ children }) => {
  const profile = useResponsiveProfileState();

  return <ResponsiveContext.Provider value={profile}>{children}</ResponsiveContext.Provider>;
};

export default ResponsiveProvider;
