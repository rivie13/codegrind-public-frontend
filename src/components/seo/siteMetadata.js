export const SITE_ORIGIN = 'https://codegrind.online';
export const SITE_NAME = 'CodeGrind';
export const SITE_LOGO_PATH = '/logo.svg';

export const normalizeSitePath = (path = '/') => {
  if (!path || path === '/') return '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.replace(/\/+$/, '') || '/';
};

export const buildCanonicalUrl = (path = '/') => {
  const normalizedPath = normalizeSitePath(path);
  return normalizedPath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${normalizedPath}`;
};

export const buildAbsoluteUrl = (path = '/') => {
  if (!path) return `${SITE_ORIGIN}/`;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
};
