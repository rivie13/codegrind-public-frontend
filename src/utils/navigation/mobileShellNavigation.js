export const COMPACT_MOBILE_SHELL_QUERY_PARAM = 'cgMobileShell';
export const COMPACT_MOBILE_SHELL_QUERY_VALUE = 'compact';
export const COMPACT_MOBILE_SHELL_BOOTSTRAP_STORAGE_KEY =
  'codegrind-compact-mobile-shell-bootstrap-v1';

const getNavigationBaseOrigin = () => {
  if (typeof window !== 'undefined' && typeof window.location?.origin === 'string') {
    return window.location.origin;
  }

  return 'https://codegrind.local';
};

export const buildCompactMobileShellPath = (targetPath = '/') => {
  const normalizedTargetPath = typeof targetPath === 'string' ? targetPath.trim() : '';

  if (!normalizedTargetPath) {
    return '/';
  }

  try {
    const resolvedUrl = new URL(normalizedTargetPath, getNavigationBaseOrigin());
    resolvedUrl.searchParams.set(
      COMPACT_MOBILE_SHELL_QUERY_PARAM,
      COMPACT_MOBILE_SHELL_QUERY_VALUE
    );

    return /^https?:\/\//i.test(normalizedTargetPath)
      ? resolvedUrl.toString()
      : `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return normalizedTargetPath;
  }
};

export const hasCompactMobileShellQuery = (search = '') => {
  const normalizedSearch = String(search || '');
  const params = new URLSearchParams(
    normalizedSearch.startsWith('?') ? normalizedSearch.slice(1) : normalizedSearch
  );

  return params.get(COMPACT_MOBILE_SHELL_QUERY_PARAM) === COMPACT_MOBILE_SHELL_QUERY_VALUE;
};

export const readCompactMobileShellBootstrap = (
  win = typeof window === 'undefined' ? null : window
) => {
  if (!win) {
    return false;
  }

  try {
    return win.sessionStorage.getItem(COMPACT_MOBILE_SHELL_BOOTSTRAP_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const persistCompactMobileShellBootstrap = (
  win = typeof window === 'undefined' ? null : window
) => {
  if (!win) {
    return;
  }

  try {
    win.sessionStorage.setItem(COMPACT_MOBILE_SHELL_BOOTSTRAP_STORAGE_KEY, '1');
  } catch {
    // Ignore storage failures (private mode, policy restrictions, etc.).
  }
};

export const clearCompactMobileShellBootstrap = (
  win = typeof window === 'undefined' ? null : window
) => {
  if (!win) {
    return;
  }

  try {
    win.sessionStorage.removeItem(COMPACT_MOBILE_SHELL_BOOTSTRAP_STORAGE_KEY);
  } catch {
    // Ignore storage failures (private mode, policy restrictions, etc.).
  }
};

export const hasCompactMobileShellBootstrap = ({
  search = typeof window === 'undefined' ? '' : window.location?.search || '',
  win = typeof window === 'undefined' ? null : window,
} = {}) => {
  return hasCompactMobileShellQuery(search) || readCompactMobileShellBootstrap(win);
};

export const captureCompactMobileShellBootstrap = ({
  search = typeof window === 'undefined' ? '' : window.location?.search || '',
  win = typeof window === 'undefined' ? null : window,
} = {}) => {
  if (hasCompactMobileShellQuery(search)) {
    persistCompactMobileShellBootstrap(win);
    return true;
  }

  return readCompactMobileShellBootstrap(win);
};

export const stripCompactMobileShellQuery = (search = '') => {
  const normalizedSearch = String(search || '');
  const params = new URLSearchParams(
    normalizedSearch.startsWith('?') ? normalizedSearch.slice(1) : normalizedSearch
  );

  params.delete(COMPACT_MOBILE_SHELL_QUERY_PARAM);

  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : '';
};
