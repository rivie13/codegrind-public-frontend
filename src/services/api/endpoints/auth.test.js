import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../csrf', () => ({
  fetchCsrfToken: vi.fn(),
}));

vi.mock('../base', () => ({
  getBaseUrl: vi.fn(() => 'http://api.example.test/api'),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { fetchCsrfToken } from '../csrf';
import { fetchWithError } from '../fetcher';
import auth from './auth';

describe('auth endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('handles login side effects and stores backup user values', async () => {
    fetchWithError.mockResolvedValue({
      user: { id: 7, isEmailVerified: true },
    });
    fetchCsrfToken.mockResolvedValue('fresh-token');

    const result = await auth.login('riven', 'secret');

    expect(fetchWithError).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'riven', password: 'secret' }),
    });
    expect(fetchCsrfToken).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('user_id')).toBe('7');
    expect(localStorage.getItem('email_verified')).toBe('true');
    expect(localStorage.getItem('last_login')).toBeTruthy();
    expect(localStorage.getItem('auth_provider')).toBe('local');
    expect(result).toEqual({ user: { id: 7, isEmailVerified: true } });
  });

  it('includes the reCAPTCHA token when login options provide one', async () => {
    fetchWithError.mockResolvedValue({ user: { id: 3, isEmailVerified: false } });
    fetchCsrfToken.mockResolvedValue('fresh-token');

    await auth.login('riven', 'secret', { recaptchaToken: 'token-123' });

    expect(fetchWithError).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'riven',
        password: 'secret',
        recaptchaToken: 'token-123',
      }),
    });
  });

  it('does not store backup values when login response has no user id', async () => {
    fetchWithError.mockResolvedValue({ user: { id: null } });
    fetchCsrfToken.mockResolvedValue('fresh-token');

    await auth.login('user', 'pw');

    expect(localStorage.getItem('user_id')).toBeNull();
    expect(localStorage.getItem('email_verified')).toBeNull();
    expect(localStorage.getItem('last_login')).toBeNull();
  });

  it('handles logout side effects and clears local storage', async () => {
    localStorage.setItem('user_id', '1');
    localStorage.setItem('email_verified', 'false');
    localStorage.setItem('last_login', 'x');
    localStorage.setItem('auth_provider', 'google');
    fetchWithError.mockResolvedValue({
      ok: true,
      providerLogoutUrl: 'https://api.example.test/.auth/logout',
    });
    fetchCsrfToken.mockResolvedValue('fresh-token');

    const result = await auth.logout();

    expect(fetchWithError).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google' }),
    });
    expect(fetchCsrfToken).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('user_id')).toBeNull();
    expect(localStorage.getItem('email_verified')).toBeNull();
    expect(localStorage.getItem('last_login')).toBeNull();
    expect(localStorage.getItem('auth_provider')).toBeNull();
    expect(result).toEqual({
      ok: true,
      providerLogoutUrl: 'https://api.example.test/.auth/logout',
    });
  });

  it('wraps profile and auth CRUD endpoints with expected methods', async () => {
    await auth.getUserProfile('u1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/user/u1');

    await auth.updateProfile({ username: 'new-name' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: 'new-name' }),
    });

    await auth.deleteAccount();
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/delete-account', {
      method: 'DELETE',
      credentials: 'include',
    });

    await auth.register({ username: 'new-user' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'new-user' }),
    });
  });

  it('includes the reCAPTCHA token for register and oauth start requests', async () => {
    await auth.register({ username: 'new-user' }, { recaptchaToken: 'register-token' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'new-user', recaptchaToken: 'register-token' }),
    });

    fetchWithError.mockResolvedValueOnce({ url: 'https://oauth.example.test' });
    await auth.startOAuth('google', 'login', { recaptchaToken: 'oauth-token' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/oauth/start', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'google',
        intent: 'login',
        recaptchaToken: 'oauth-token',
      }),
    });
    expect(localStorage.getItem('auth_provider')).toBe('google');
  });

  it('includes the compact mobile shell hint for oauth starts when requested', async () => {
    fetchWithError.mockResolvedValueOnce({ url: 'https://oauth.example.test' });

    await auth.startOAuth('discord', 'login', { compactMobileShell: true });

    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/oauth/start', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'discord',
        intent: 'login',
        compactMobileShell: true,
      }),
    });
    expect(localStorage.getItem('auth_provider')).toBe('discord');
  });

  it('checks session endpoint', async () => {
    await auth.check();
    expect(fetchWithError).toHaveBeenCalledWith('/api/auth/check');
  });

  it('calls verification endpoints and propagates failures', async () => {
    fetchWithError.mockResolvedValueOnce({ ok: true });
    await expect(auth.verifyEmail('token-1')).resolves.toEqual({ ok: true });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/verify-email?token=token-1');

    fetchWithError.mockResolvedValueOnce({ ok: true });
    await expect(auth.resendVerificationEmail()).resolves.toEqual({ ok: true });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/resend-verification', {
      method: 'POST',
    });

    fetchWithError.mockResolvedValueOnce({ ok: true });
    await expect(auth.resendVerificationEmail('a+b@example.com')).resolves.toEqual({ ok: true });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/resend-verification-by-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'a+b@example.com' }),
    });

    fetchWithError.mockResolvedValueOnce({ ok: true });
    await expect(auth.verifyEmailChange('token-2', 'a+b@example.com')).resolves.toEqual({
      ok: true,
    });
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/auth/verify-email-change?token=token-2&email=a%2Bb%40example.com'
    );

    fetchWithError.mockResolvedValueOnce({ ok: true });
    await expect(auth.cancelEmailChange('token-3')).resolves.toEqual({ ok: true });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/auth/cancel-email-change?token=token-3');

    fetchWithError.mockRejectedValueOnce(new Error('verify failed'));
    await expect(auth.verifyEmail('bad')).rejects.toThrow('verify failed');
  });
});
