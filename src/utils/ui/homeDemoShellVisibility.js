export const HOME_DEMO_SHELL_VISIBILITY_EVENT = 'codegrind-home-demo-shell-visibility-change';

const HOME_DEMO_SHELL_HIDDEN_KEY = 'codegrind-home-demo-shell-hidden';
const HOME_DEMO_SHELL_HIDDEN_ATTR = 'data-home-demo-shell-hidden';

export const readHomeDemoShellHidden = () => {
  if (typeof window === 'undefined') return false;

  if (typeof window._homeDemoShellHidden === 'boolean') {
    return window._homeDemoShellHidden;
  }

  const bodyValue = document.body?.getAttribute(HOME_DEMO_SHELL_HIDDEN_ATTR);
  if (bodyValue === 'true' || bodyValue === 'false') {
    return bodyValue === 'true';
  }

  try {
    return window.sessionStorage.getItem(HOME_DEMO_SHELL_HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setHomeDemoShellHidden = (hidden) => {
  if (typeof window === 'undefined') return;

  const nextHidden = Boolean(hidden);

  window._homeDemoShellHidden = nextHidden;
  document.body?.setAttribute(HOME_DEMO_SHELL_HIDDEN_ATTR, nextHidden ? 'true' : 'false');

  try {
    if (nextHidden) {
      window.sessionStorage.setItem(HOME_DEMO_SHELL_HIDDEN_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(HOME_DEMO_SHELL_HIDDEN_KEY);
    }
  } catch {
    // Best effort only.
  }

  window.dispatchEvent(
    new CustomEvent(HOME_DEMO_SHELL_VISIBILITY_EVENT, {
      detail: { hidden: nextHidden },
    })
  );
};
