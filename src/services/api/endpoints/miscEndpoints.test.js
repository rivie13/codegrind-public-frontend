import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { fetchWithError } from '../fetcher';
import achievements from './achievements';
import admin from './admin';
import chat from './chat';
import learningProblems from './learningProblems';
import scores from './scores';

describe('misc endpoint wrappers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('covers achievements endpoints', async () => {
    achievements.getAvailable();
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/achievements/available');

    achievements.getUserAchievements('u7');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/achievements/user/u7');

    achievements.createTestAchievement('u7');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/achievements/test-create', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'u7',
        title: 'Test Achievement',
        description: 'This is a test achievement created for testing purposes',
        icon: '🧪',
      }),
    });
  });

  it('covers learning problem code execution wrapper', () => {
    learningProblems.getById('intro-arrays');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/learning-problems/intro-arrays');

    learningProblems.runCode('print(1)', 'intro-arrays', 'python', true);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/learning-problems/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'print(1)',
        titleSlug: 'intro-arrays',
        language: 'python',
        outputOnly: true,
      }),
    });
  });

  it('covers admin preview query construction', async () => {
    await admin.getSuccessModalPreview();
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/admin/success-modal-preview?type=problem&variant=level-up'
    );

    await admin.getSuccessModalPreview({ type: 'tower-defense', variant: 'perfect' });
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/admin/success-modal-preview?type=tower-defense&variant=perfect'
    );
  });

  it('covers scores endpoint wrappers', () => {
    scores.update('u2', 'p4', 444, 99, 'AI');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/scores/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u2',
        problemId: 'p4',
        newScore: 444,
        newTime: 99,
        problemType: 'AI',
      }),
    });

    scores.get('u2', 'p4');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/scores/u2/p4/CODEGRIND');

    scores.getBulk('u2', ['p1', 'p2'], 'CODEGRIND');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/scores/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u2',
        problemIds: ['p1', 'p2'],
        problemType: 'CODEGRIND',
      }),
    });
  });

  it('covers chat endpoint wrappers for OpenRouter backend mode', async () => {
    await chat.sendMessage('u1', 'problem-1', 'hello', 'guided', { language: 'python' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/chat/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u1',
        problemId: 'problem-1',
        message: 'hello',
        assistanceLevel: 'guided',
        context: { language: 'python' },
      }),
    });

    chat.getUsage(null, 'problem-1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/chat/guest/problem-1');

    chat.resetUsage('u1', 'problem-1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/chat/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', problemId: 'problem-1' }),
    });

    chat.incrementCount('u1', 'problem-1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/chat/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', problemId: 'problem-1' }),
    });

    fetchWithError
      .mockResolvedValueOnce({ proofToken: 'proof-rewarded' })
      .mockResolvedValueOnce({ ok: true });

    await chat.addCredit('u1', 'problem-1', 'rewarded');
    expect(fetchWithError).toHaveBeenNthCalledWith(
      5,
      '/api/auth/ad-proof?placement=chat-credit&adType=rewarded'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(6, '/api/chat/add-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u1',
        problemId: 'problem-1',
        adType: 'rewarded',
        adProofToken: 'proof-rewarded',
      }),
    });
  });
});
