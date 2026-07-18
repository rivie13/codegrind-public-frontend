const DEFAULT_PROD_ASSET_BASE_URL = '';
const DEV_IMAGE_BASE_PATH = '/src/pages/images';
const CITY_TILED_ALIAS_PREFIX = '/city-v2/tiled';
const VITE_ENV = import.meta.env || {};
const normalizeBase = (base) => (base || '').replace(/\/+$/, '');
const DEV_SOUND_BASE_PATH = normalizeBase(VITE_ENV.VITE_SOUND_PROJECT_ROOT_URL);
const DEV_TILED_BASE_PATH = normalizeBase(VITE_ENV.VITE_TILED_PROJECT_ROOT_URL);
const isCityTiledAliasPath = (normalizedPath) =>
  normalizedPath === CITY_TILED_ALIAS_PREFIX ||
  normalizedPath.startsWith(`${CITY_TILED_ALIAS_PREFIX}/`);
const stripAliasPrefix = (normalizedPath, aliasPrefix) =>
  normalizedPath === aliasPrefix ? '' : normalizedPath.slice(aliasPrefix.length);

const resolveAssetBaseUrl = () => {
  const envBase = VITE_ENV.VITE_ASSET_BASE_URL;
  if (envBase) {
    return normalizeBase(envBase);
  }

  if (VITE_ENV.PROD) {
    return DEFAULT_PROD_ASSET_BASE_URL;
  }

  return '';
};

const resolveSoundBaseUrl = () => {
  const envSoundBase = VITE_ENV.VITE_SOUND_BASE_URL;
  if (envSoundBase) {
    return normalizeBase(envSoundBase);
  }
  return '';
};

const ASSET_BASE_URL = resolveAssetBaseUrl();
const SOUND_BASE_URL = resolveSoundBaseUrl();

const getAssetUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (VITE_ENV.PROD && isCityTiledAliasPath(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('/audio/')) {
    if (SOUND_BASE_URL) {
      let resolved = `${SOUND_BASE_URL}${normalizedPath.replace('/audio', '/sound')}`;
      if (resolved.includes('cloudinary.com') && !/\/v\d+/.test(resolved)) {
        resolved = resolved.replace('/video/upload/', '/video/upload/v1/');
      }
      return resolved;
    }
    if (ASSET_BASE_URL) {
      if (ASSET_BASE_URL.includes('cloudinary.com')) {
        let videoBaseUrl = ASSET_BASE_URL.replace('/image/upload', '/video/upload');
        if (!/\/v\d+/.test(videoBaseUrl)) {
          videoBaseUrl = videoBaseUrl.replace('/video/upload', '/video/upload/v1');
        }
        return `${videoBaseUrl}${normalizedPath.replace('/audio', '/sound')}`;
      }
      return `${ASSET_BASE_URL}${normalizedPath.replace('/audio', '/sound')}`;
    }
    if (!VITE_ENV.PROD && DEV_SOUND_BASE_PATH) {
      return `${DEV_SOUND_BASE_PATH}${normalizedPath.replace('/audio', '')}`;
    }
  }

  if (!ASSET_BASE_URL && !VITE_ENV.PROD && normalizedPath.startsWith('/images/')) {
    return `${DEV_IMAGE_BASE_PATH}${normalizedPath.replace('/images', '')}`;
  }
  if (
    !ASSET_BASE_URL &&
    !VITE_ENV.PROD &&
    DEV_TILED_BASE_PATH &&
    isCityTiledAliasPath(normalizedPath)
  ) {
    return `${DEV_TILED_BASE_PATH}${stripAliasPrefix(normalizedPath, CITY_TILED_ALIAS_PREFIX)}`;
  }
  if (!ASSET_BASE_URL) {
    return normalizedPath;
  }

  if (ASSET_BASE_URL.includes('cloudinary.com') && !normalizedPath.startsWith('/audio/')) {
    const ext = normalizedPath.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
    if (!isImage) {
      const rawBaseUrl = ASSET_BASE_URL.replace('/image/upload', '/raw/upload');
      return `${rawBaseUrl}${normalizedPath}`;
    }
    // Inject version v1 for image assets on Cloudinary
    let imageBaseUrl = ASSET_BASE_URL;
    if (!/\/v\d+/.test(imageBaseUrl)) {
      imageBaseUrl = imageBaseUrl.replace('/image/upload', '/image/upload/v1');
    }
    return `${imageBaseUrl}${normalizedPath}`;
  }

  return `${ASSET_BASE_URL}${normalizedPath}`;
};

export default getAssetUrl;
