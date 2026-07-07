import { beforeEach, describe, expect, it } from 'vitest';

import {
  MOBILE_SHELL_VISIBILITY_STORAGE_KEY,
  readMobileShellVisible,
  writeMobileShellVisible,
} from './mobileShellVisibility';

describe('mobileShellVisibility', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to the site shell when no preference is stored', () => {
    expect(readMobileShellVisible()).toBe(true);
  });

  it('prefers an explicit stored choice over the default shell state', () => {
    window.localStorage.setItem(MOBILE_SHELL_VISIBILITY_STORAGE_KEY, '1');

    expect(readMobileShellVisible()).toBe(true);

    writeMobileShellVisible(false);

    expect(readMobileShellVisible()).toBe(false);
  });
});
