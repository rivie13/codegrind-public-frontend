import { beforeEach, describe, expect, it } from 'vitest';
import { createCookie, eraseCookie, readCookie } from './cookieUtils';

const clearAllCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const [name] = cookie.split('=');
    const trimmed = name?.trim();
    if (!trimmed) return;
    document.cookie = `${trimmed}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
};

describe('cookieUtils', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  it('creates a cookie and reads it back', () => {
    createCookie('session', 'abc123', 1);
    expect(readCookie('session')).toBe('abc123');
  });

  it('reads the correct value when multiple cookies exist', () => {
    createCookie('first', '1', 1);
    createCookie('second', '2', 1);

    expect(readCookie('second')).toBe('2');
    expect(readCookie('missing')).toBeNull();
  });

  it('erases a cookie by writing an expired value', () => {
    createCookie('token', 'secret', 1);
    eraseCookie('token');

    expect(readCookie('token')).toBeNull();
  });
});
