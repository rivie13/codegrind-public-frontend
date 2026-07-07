import { describe, expect, it, vi } from 'vitest';

const loadBaseModule = async (apiUrl) => {
  vi.resetModules();
  vi.doMock('./config', () => ({
    API_URL: apiUrl,
  }));
  return import('./base');
};

describe('api/base', () => {
  it('normalizes API base URL when origin lacks /api suffix', async () => {
    const mod = await loadBaseModule('https://api.example.test');

    expect(mod.getBaseUrl()).toBe('https://api.example.test/api');
    expect(mod.getApiBaseUrl()).toBe('https://api.example.test/api');
    expect(mod.getApiOrigin()).toBe('https://api.example.test');
  });

  it('keeps existing /api suffix unchanged', async () => {
    const mod = await loadBaseModule('https://api.example.test/api');

    expect(mod.getBaseUrl()).toBe('https://api.example.test/api');
    expect(mod.getApiBaseUrl()).toBe('https://api.example.test/api');
    expect(mod.getApiOrigin()).toBe('https://api.example.test/api');
  });
});
