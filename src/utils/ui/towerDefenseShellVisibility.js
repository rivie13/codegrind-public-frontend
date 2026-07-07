export const TOWER_DEFENSE_SHELL_VISIBILITY_STORAGE_KEY = 'codegrind-td-shell-visible-v1';
export const TOWER_DEFENSE_SHELL_VISIBILITY_EVENT =
  'codegrind-tower-defense-shell-visibility-change';

export const readTowerDefenseShellVisible = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(TOWER_DEFENSE_SHELL_VISIBILITY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeTowerDefenseShellVisible = (visible) => {
  if (typeof window === 'undefined') return;

  const normalizedVisible = Boolean(visible);

  try {
    window.localStorage.setItem(
      TOWER_DEFENSE_SHELL_VISIBILITY_STORAGE_KEY,
      normalizedVisible ? '1' : '0'
    );
  } catch {
    // Ignore storage failures (private mode, policy restrictions, etc.).
  }

  window.dispatchEvent(
    new CustomEvent(TOWER_DEFENSE_SHELL_VISIBILITY_EVENT, {
      detail: { visible: normalizedVisible },
    })
  );
};
