import { createContext, useContext } from 'react';

export const SiteRouteTransitionContext = createContext({
  startRouteTransition: null,
});

export const useSiteRouteTransition = () => useContext(SiteRouteTransitionContext);
