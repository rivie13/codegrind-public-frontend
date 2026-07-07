export const MOBILE_SHELL_VISIBILITY_STORAGE_KEY = 'codegrind-mobile-shell-visible-v1';
export const MOBILE_SHELL_VISIBILITY_EVENT = 'codegrind-mobile-shell-visibility-change';

export const readMobileShellVisible = () => {
  const defaultVisible = true;

  if (typeof window === 'undefined') return defaultVisible;

  try {
    const storedValue = window.localStorage.getItem(MOBILE_SHELL_VISIBILITY_STORAGE_KEY);
    if (storedValue === null) return defaultVisible;
    return storedValue === '1';
  } catch {
    return defaultVisible;
  }
};

export const writeMobileShellVisible = (visible) => {
  if (typeof window === 'undefined') return;

  const normalizedVisible = Boolean(visible);

  try {
    window.localStorage.setItem(MOBILE_SHELL_VISIBILITY_STORAGE_KEY, normalizedVisible ? '1' : '0');
  } catch {
    // Ignore storage failures (private mode, policy restrictions, etc.).
  }

  window.dispatchEvent(
    new CustomEvent(MOBILE_SHELL_VISIBILITY_EVENT, {
      detail: { visible: normalizedVisible },
    })
  );
};
