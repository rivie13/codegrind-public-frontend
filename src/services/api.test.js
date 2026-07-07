import { describe, expect, it, vi } from 'vitest';

const loadApiModule = async () => {
  vi.resetModules();

  const endpoints = {
    achievements: { id: 'achievements' },
    admin: { id: 'admin' },
    aiProblems: { id: 'aiProblems' },
    analysis: { analyzeSubmission: vi.fn(), getUsage: vi.fn() },
    auth: { id: 'auth' },
    chat: { id: 'chat' },
    city: { id: 'city' },
    codeExecution: { id: 'codeExecution' },
    discord: { id: 'discord' },
    email: { id: 'email' },
    leaderboards: { id: 'leaderboards' },
    learningPath: { id: 'learningPath' },
    learningProblems: { id: 'learningProblems' },
    models: { getAvailable: vi.fn() },
    payments: { id: 'payments' },
    problems: { id: 'problems' },
    profile: { id: 'profile' },
    scores: { id: 'scores' },
    store: { id: 'store' },
    submissions: { id: 'submissions' },
    towerDefense: { id: 'towerDefense' },
  };

  const getApiBaseUrl = vi.fn(() => 'https://api.example.test/api');
  const getApiOrigin = vi.fn(() => 'https://api.example.test');
  class VmStartingError extends Error {}

  vi.doMock('./api/base', () => ({
    getApiBaseUrl,
    getApiOrigin,
  }));

  vi.doMock('./api/fetcher', () => ({
    VmStartingError,
  }));

  vi.doMock('./api/endpoints/achievements', () => ({ default: endpoints.achievements }));
  vi.doMock('./api/endpoints/admin', () => ({ default: endpoints.admin }));
  vi.doMock('./api/endpoints/aiProblems', () => ({ default: endpoints.aiProblems }));
  vi.doMock('./api/endpoints/analysis', () => ({ default: endpoints.analysis }));
  vi.doMock('./api/endpoints/auth', () => ({ default: endpoints.auth }));
  vi.doMock('./api/endpoints/chat', () => ({ default: endpoints.chat }));
  vi.doMock('./api/endpoints/city', () => ({ default: endpoints.city }));
  vi.doMock('./api/endpoints/codeExecution', () => ({ default: endpoints.codeExecution }));
  vi.doMock('./api/endpoints/discord', () => ({ default: endpoints.discord }));
  vi.doMock('./api/endpoints/email', () => ({ default: endpoints.email }));
  vi.doMock('./api/endpoints/leaderboards', () => ({ default: endpoints.leaderboards }));
  vi.doMock('./api/endpoints/learningPath', () => ({ default: endpoints.learningPath }));
  vi.doMock('./api/endpoints/learningProblems', () => ({ default: endpoints.learningProblems }));
  vi.doMock('./api/endpoints/models', () => ({ default: endpoints.models }));
  vi.doMock('./api/endpoints/payments', () => ({ default: endpoints.payments }));
  vi.doMock('./api/endpoints/problems', () => ({ default: endpoints.problems }));
  vi.doMock('./api/endpoints/profile', () => ({ default: endpoints.profile }));
  vi.doMock('./api/endpoints/scores', () => ({ default: endpoints.scores }));
  vi.doMock('./api/endpoints/store', () => ({ default: endpoints.store }));
  vi.doMock('./api/endpoints/submissions', () => ({ default: endpoints.submissions }));
  vi.doMock('./api/endpoints/towerDefense', () => ({ default: endpoints.towerDefense }));

  const mod = await import('./api');

  return {
    mod,
    endpoints,
    getApiBaseUrl,
    getApiOrigin,
    VmStartingError,
  };
};

describe('services/api module', () => {
  it('exports a composed api object and re-exports base/fetcher helpers', async () => {
    const { mod, endpoints, VmStartingError } = await loadApiModule();

    expect(mod.api).toEqual({
      admin: endpoints.admin,
      analysis: endpoints.analysis,
      discord: endpoints.discord,
      email: endpoints.email,
      models: endpoints.models,
      problems: endpoints.problems,
      scores: endpoints.scores,
      chat: endpoints.chat,
      city: endpoints.city,
      codeExecution: endpoints.codeExecution,
      submissions: endpoints.submissions,
      auth: endpoints.auth,
      profile: endpoints.profile,
      payments: endpoints.payments,
      leaderboards: endpoints.leaderboards,
      aiProblems: endpoints.aiProblems,
      towerDefense: endpoints.towerDefense,
      achievements: endpoints.achievements,
      learningPath: endpoints.learningPath,
      learningProblems: endpoints.learningProblems,
      store: endpoints.store,
    });

    expect(mod.default).toBe(mod.api);
    expect(mod.VmStartingError).toBe(VmStartingError);
    expect(mod.getApiBaseUrl()).toBe('https://api.example.test/api');
    expect(mod.getApiOrigin()).toBe('https://api.example.test');
  });
});
