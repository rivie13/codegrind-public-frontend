export const CITY_RETURN_STATE_STORAGE_KEY = 'codegrind-city-return-state-v1';
export const CITY_RETURN_STATE_EVENT = 'codegrind-city-return-state-change';

const CITY_ROUTE_PATTERN = /^\/city(?:\/|$)/;
const CITY_RETURN_ROUTE_PATTERNS = [
  /^\/games\/?$/,
  /^\/games\/clusters(?:\/[^/]+)?\/?$/,
  /^\/learning\/?$/,
  /^\/learning\/[^/]+\/?$/,
  /^\/profile(?:\/.*)?$/,
  /^\/leaderboards\/?$/,
  /^\/store\/?$/,
];

const normalizePathname = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeSearch = (value) => {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('?') ? trimmed : `?${trimmed}`;
};

export const isCityRoute = (pathname) => CITY_ROUTE_PATTERN.test(normalizePathname(pathname));

export const shouldRenderSiteNavigation = ({ pathname = '', isGlobalShellVisible = true } = {}) =>
  Boolean(isGlobalShellVisible) && !isCityRoute(pathname);

export const shouldOfferCityReturn = (pathname) => {
  const normalizedPathname = normalizePathname(pathname);
  return CITY_RETURN_ROUTE_PATTERNS.some((pattern) => pattern.test(normalizedPathname));
};

export const normalizeCityReturnState = (rawState) => {
  if (!rawState || typeof rawState !== 'object') return null;

  const pathname = normalizePathname(rawState.pathname);
  if (!isCityRoute(pathname)) return null;

  return {
    pathname,
    search: normalizeSearch(rawState.search),
  };
};

export const buildCityReturnState = (locationLike) =>
  normalizeCityReturnState({
    pathname: locationLike?.pathname || '/city',
    search: locationLike?.search || '',
  });

export const getCityReturnHref = (cityReturnState) => {
  const normalizedState = normalizeCityReturnState(cityReturnState);
  if (!normalizedState) return '/city';

  return `${normalizedState.pathname}${normalizedState.search}`;
};

export const readCityReturnState = () => {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(CITY_RETURN_STATE_STORAGE_KEY);
    if (!rawValue) return null;

    return normalizeCityReturnState(JSON.parse(rawValue));
  } catch {
    return null;
  }
};

export const writeCityReturnState = (cityReturnState) => {
  if (typeof window === 'undefined') return;

  const normalizedState = normalizeCityReturnState(cityReturnState);

  try {
    if (normalizedState) {
      window.localStorage.setItem(CITY_RETURN_STATE_STORAGE_KEY, JSON.stringify(normalizedState));
    } else {
      window.localStorage.removeItem(CITY_RETURN_STATE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write failures (private mode, policy restrictions, etc.).
  }

  window.dispatchEvent(
    new CustomEvent(CITY_RETURN_STATE_EVENT, {
      detail: { state: normalizedState },
    })
  );
};
