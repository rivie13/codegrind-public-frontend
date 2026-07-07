export const HOME_DEMO_BOOT_SEQUENCE_EVENT = 'codegrind-home-demo-boot-sequence-change';

export const readHomeDemoBootSequenceActive = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window._homeDemoBootSequenceActive);
};

export const writeHomeDemoBootSequenceActive = (active) => {
  if (typeof window === 'undefined') return;

  const nextActive = Boolean(active);
  window._homeDemoBootSequenceActive = nextActive;
  document.body?.setAttribute('data-home-demo-boot-sequence-active', nextActive ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent(HOME_DEMO_BOOT_SEQUENCE_EVENT, {
      detail: { active: nextActive },
    })
  );
};
