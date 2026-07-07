import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async ({
  hostname = 'app.codegrind.online',
  origin = 'https://app.codegrind.online',
  env = {},
} = {}) => {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();

  vi.stubGlobal('window', {
    location: {
      hostname,
      origin,
    },
  });

  vi.stubEnv('VITE_API_URL', env.VITE_API_URL || '');
  vi.stubEnv('VITE_AI_SERVER_URL', env.VITE_AI_SERVER_URL || '');
  vi.stubEnv('VITE_JUDGE0_API_URL', env.VITE_JUDGE0_API_URL || '');

  return import('./config');
};

describe('api/config', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('resolves API URL for dev/local/cloudflare/default hostnames', async () => {
    const dev = await loadConfig({
      hostname: 'dev.codegrind.online',
      origin: 'http://dev.codegrind.online',
      env: { VITE_API_URL: '' },
    });
    expect(dev.getApiUrl()).toBe('http://dev.codegrind.online:3000');

    const local = await loadConfig({
      hostname: 'localhost',
      origin: 'http://localhost:5173',
      env: { VITE_API_URL: '' },
    });
    expect(local.getApiUrl()).toBe('http://localhost:3000');

    const tunnel = await loadConfig({
      hostname: 'abc.trycloudflare.com',
      origin: 'https://abc.trycloudflare.com',
      env: { VITE_API_URL: '' },
    });
    expect(tunnel.getApiUrl()).toBe('https://abc.trycloudflare.com');

    const prod = await loadConfig({
      hostname: 'app.codegrind.online',
      origin: 'https://app.codegrind.online',
      env: { VITE_API_URL: '' },
    });
    expect(prod.getApiUrl()).toBe('https://api.codegrind.online');
  });

  it('prefers configured API URL overrides when provided', async () => {
    const mod = await loadConfig({
      hostname: 'localhost',
      env: { VITE_API_URL: 'https://api.override.test' },
    });

    expect(mod.getApiUrl()).toBe('https://api.override.test');
    expect(mod.API_URL).toBe('https://api.override.test');
  });

  it('reads AI server URL from env flags', async () => {
    const mod = await loadConfig({
      hostname: 'app.codegrind.online',
      env: {
        VITE_AI_SERVER_URL: 'https://ai.override.test',
      },
    });

    expect(mod.getAiServerUrl()).toBe('https://ai.override.test');
    expect(mod.AI_SERVER_URL).toBe('https://ai.override.test');
  });

  it('resolves Judge0 URL for dev/local/default cases and env overrides', async () => {
    const dev = await loadConfig({
      hostname: 'dev.codegrind.online',
      env: { VITE_JUDGE0_API_URL: '' },
    });
    expect(dev.getJudge0Url()).toBe('http://dev.codegrind.online:2358');

    const local = await loadConfig({
      hostname: '127.0.0.1',
      env: { VITE_JUDGE0_API_URL: '' },
    });
    expect(local.getJudge0Url()).toBe('http://localhost:2358');

    const defaultProd = await loadConfig({
      hostname: 'app.codegrind.online',
      env: { VITE_JUDGE0_API_URL: '' },
    });
    expect(defaultProd.getJudge0Url()).toBe('https://judge0.codegrind.online');

    const overridden = await loadConfig({
      hostname: 'app.codegrind.online',
      env: { VITE_JUDGE0_API_URL: 'https://judge0.override.test' },
    });
    expect(overridden.getJudge0Url()).toBe('https://judge0.override.test');
    expect(overridden.JUDGE0_API_URL).toBe('https://judge0.override.test');
  });
});
