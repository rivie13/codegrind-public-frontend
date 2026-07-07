import { beforeEach, describe, expect, it } from 'vitest';

import {
  captureCompactMobileShellBootstrap,
  clearCompactMobileShellBootstrap,
  hasCompactMobileShellBootstrap,
  persistCompactMobileShellBootstrap,
  readCompactMobileShellBootstrap,
} from './mobileShellNavigation';

describe('mobileShellNavigation bootstrap helpers', () => {
  beforeEach(() => {
    clearCompactMobileShellBootstrap(window);
  });

  it('treats the OAuth compact shell query as a handheld bootstrap override', () => {
    expect(
      hasCompactMobileShellBootstrap({
        search: '?cgMobileShell=compact',
        win: window,
      })
    ).toBe(true);
  });

  it('persists the bootstrap override for the current tab when the query is present', () => {
    expect(readCompactMobileShellBootstrap(window)).toBe(false);

    expect(
      captureCompactMobileShellBootstrap({
        search: '?cgMobileShell=compact',
        win: window,
      })
    ).toBe(true);

    expect(readCompactMobileShellBootstrap(window)).toBe(true);
  });

  it('reuses the persisted bootstrap override after the query has been stripped', () => {
    persistCompactMobileShellBootstrap(window);

    expect(
      hasCompactMobileShellBootstrap({
        search: '',
        win: window,
      })
    ).toBe(true);
  });
});
