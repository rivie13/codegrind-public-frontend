import { afterEach, describe, expect, it } from 'vitest';
import { readHomeDemoShellHidden, setHomeDemoShellHidden } from './homeDemoShellVisibility';

describe('homeDemoShellVisibility', () => {
  afterEach(() => {
    setHomeDemoShellHidden(false);
  });

  it('persists the hidden state for the next page load', () => {
    expect(readHomeDemoShellHidden()).toBe(false);

    setHomeDemoShellHidden(true);

    expect(readHomeDemoShellHidden()).toBe(true);
    expect(window.sessionStorage.getItem('codegrind-home-demo-shell-hidden')).toBe('true');
    expect(document.body.getAttribute('data-home-demo-shell-hidden')).toBe('true');

    setHomeDemoShellHidden(false);

    expect(readHomeDemoShellHidden()).toBe(false);
    expect(window.sessionStorage.getItem('codegrind-home-demo-shell-hidden')).toBeNull();
    expect(document.body.getAttribute('data-home-demo-shell-hidden')).toBe('false');
  });
});
