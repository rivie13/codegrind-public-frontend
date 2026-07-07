export const WORKSPACE_SHELL_VISIBILITY_STORAGE_KEY = 'codegrind-workspace-shell-visible-v1';
export const WORKSPACE_SHELL_VISIBILITY_EVENT = 'codegrind-workspace-shell-visibility-change';

export const readWorkspaceShellVisible = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(WORKSPACE_SHELL_VISIBILITY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeWorkspaceShellVisible = (visible) => {
  if (typeof window === 'undefined') return;

  const normalizedVisible = Boolean(visible);

  try {
    window.localStorage.setItem(
      WORKSPACE_SHELL_VISIBILITY_STORAGE_KEY,
      normalizedVisible ? '1' : '0'
    );
  } catch {
    // Ignore storage write failures (private mode, policy restrictions, etc.).
  }

  window.dispatchEvent(
    new CustomEvent(WORKSPACE_SHELL_VISIBILITY_EVENT, {
      detail: { visible: normalizedVisible },
    })
  );
};
