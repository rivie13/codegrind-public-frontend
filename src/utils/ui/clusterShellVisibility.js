export const CLUSTER_SHELL_VISIBILITY_STORAGE_KEY = 'codegrind-cluster-shell-visible-v1';
export const CLUSTER_SHELL_VISIBILITY_EVENT = 'codegrind-cluster-shell-visibility-change';

export const readClusterShellVisible = () => {
  if (typeof window === 'undefined') return true;

  try {
    const storedValue = window.localStorage.getItem(CLUSTER_SHELL_VISIBILITY_STORAGE_KEY);
    if (storedValue === null) return true;
    return storedValue === '1';
  } catch {
    return true;
  }
};

export const writeClusterShellVisible = (visible) => {
  if (typeof window === 'undefined') return;

  const normalizedVisible = Boolean(visible);

  try {
    window.localStorage.setItem(
      CLUSTER_SHELL_VISIBILITY_STORAGE_KEY,
      normalizedVisible ? '1' : '0'
    );
  } catch {
    // Ignore storage failures (private mode, policy restrictions, etc.).
  }

  window.dispatchEvent(
    new CustomEvent(CLUSTER_SHELL_VISIBILITY_EVENT, {
      detail: { visible: normalizedVisible },
    })
  );
};
