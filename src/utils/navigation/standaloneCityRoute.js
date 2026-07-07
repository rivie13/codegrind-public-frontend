const STANDALONE_CITY_ROUTE_PATTERN = /^\/city(?:\/(?:phaser-preview)?)?\/?$/;

const normalizePathname = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

export const isStandaloneCityRoute = (pathname) =>
  STANDALONE_CITY_ROUTE_PATTERN.test(normalizePathname(pathname));
