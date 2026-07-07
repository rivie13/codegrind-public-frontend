import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('prepareRecaptcha', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'site-key-123');
    document.head.innerHTML = '';
    delete window.grecaptcha;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    document.head.innerHTML = '';
    delete window.grecaptcha;
  });

  it('resolves immediately when the script tag already finished loading', async () => {
    const script = document.createElement('script');
    script.id = 'codegrind-recaptcha-enterprise';
    script.dataset.recaptchaStatus = 'loaded';
    Object.defineProperty(script, 'readyState', {
      configurable: true,
      value: 'complete',
    });
    document.head.appendChild(script);

    const { prepareRecaptcha } = await import('./recaptchaService.js');

    await expect(prepareRecaptcha()).resolves.toBeNull();
  });

  it('appends the enterprise script with the site key and badge location', async () => {
    const { prepareRecaptcha } = await import('./recaptchaService.js');

    const pending = prepareRecaptcha();
    const script = document.getElementById('codegrind-recaptcha-enterprise');

    expect(script).not.toBeNull();
    expect(script.src).toContain(
      'https://www.google.com/recaptcha/enterprise.js?render=site-key-123'
    );
    expect(script.src).toContain('badge=bottomright');

    window.grecaptcha = {
      enterprise: {
        ready: vi.fn(),
        execute: vi.fn(),
      },
    };

    script.onload();

    await expect(pending).resolves.toBe(window.grecaptcha.enterprise);
  });

  it('retries execute once when Google returns BROWSER_ERROR', async () => {
    const ready = vi.fn((callback) => callback());
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('BROWSER_ERROR'))
      .mockResolvedValueOnce('token-after-retry');

    window.grecaptcha = {
      enterprise: {
        ready,
        execute,
      },
    };

    const { executeRecaptchaAction } = await import('./recaptchaService.js');

    await expect(executeRecaptchaAction('login_google')).resolves.toBe('token-after-retry');
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenNthCalledWith(1, 'site-key-123', { action: 'login_google' });
    expect(execute).toHaveBeenNthCalledWith(2, 'site-key-123', { action: 'login_google' });
  });
});
