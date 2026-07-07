import { isStandaloneCityRoute } from '../navigation/standaloneCityRoute';

export const shouldHydrateRoot = ({ hasPrerenderedMarkup = false, pathname = '' } = {}) => {
  if (!hasPrerenderedMarkup) {
    return false;
  }

  const normalizedPathname = typeof pathname === 'string' ? pathname.trim() : '';

  if (!normalizedPathname) {
    return false;
  }

  // The homepage is prerendered for SEO, but it reads browser-only launch state and
  // responsive profile data during the first client render. Mount it client-side so we
  // do not trip React hydration mismatches in production.
  if (normalizedPathname === '/' || isStandaloneCityRoute(normalizedPathname)) {
    return false;
  }

  return true;
};
