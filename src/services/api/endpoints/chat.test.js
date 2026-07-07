import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('./adRewards', () => ({
  requestAdProofToken: vi.fn().mockResolvedValue('proof-token-xyz'),
}));

import { fetchWithError } from '../fetcher';
import { requestAdProofToken } from './adRewards';
import chat from './chat';

describe('chat endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ message: 'ok' });
    requestAdProofToken.mockResolvedValue('proof-token-xyz');
  });

  describe('sendMessage', () => {
    it('calls POST /api/chat/openrouter', async () => {
      await chat.sendMessage('u1', 'p1', 'hello', 'minimal');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/chat/openrouter',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends all fields in body', async () => {
      await chat.sendMessage('u1', 'p1', 'hello', 'minimal', { code: 'x' }, 'openrouter/free');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.userId).toBe('u1');
      expect(body.problemId).toBe('p1');
      expect(body.message).toBe('hello');
      expect(body.assistanceLevel).toBe('minimal');
      expect(body.context).toEqual({ code: 'x' });
      expect(body.model).toBe('openrouter/free');
    });

    it('omits model from body when not provided', async () => {
      await chat.sendMessage('u1', 'p1', 'hello', 'minimal');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).not.toHaveProperty('model');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('rate limited'));
      await expect(chat.sendMessage('u1', 'p1', 'hi', 'minimal')).rejects.toThrow('rate limited');
    });
  });

  describe('getUsage', () => {
    it('calls GET /api/chat/:userId/:problemId', async () => {
      await chat.getUsage('u1', 'p1');
      expect(fetchWithError).toHaveBeenCalledWith('/api/chat/u1/p1');
    });

    it('uses "guest" when userId is falsy', async () => {
      await chat.getUsage(null, 'p1');
      expect(fetchWithError).toHaveBeenCalledWith('/api/chat/guest/p1');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ used: 2, limit: 5 });
      const result = await chat.getUsage('u1', 'p1');
      expect(result).toEqual({ used: 2, limit: 5 });
    });
  });

  describe('resetUsage', () => {
    it('calls POST /api/chat/reset', async () => {
      await chat.resetUsage('u1', 'p1');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/chat/reset',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends userId and problemId in body', async () => {
      await chat.resetUsage('u1', 'p1');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({ userId: 'u1', problemId: 'p1' });
    });
  });

  describe('incrementCount', () => {
    it('calls POST /api/chat/increment', async () => {
      await chat.incrementCount('u1', 'p1');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/chat/increment',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends userId and problemId in body', async () => {
      await chat.incrementCount('u1', 'p1');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({ userId: 'u1', problemId: 'p1' });
    });
  });

  describe('addCredit', () => {
    it('calls requestAdProofToken before posting', async () => {
      await chat.addCredit('u1', 'p1', 'short');
      expect(requestAdProofToken).toHaveBeenCalledWith('chat-credit', 'short');
    });

    it('calls POST /api/chat/add-credit', async () => {
      await chat.addCredit('u1', 'p1', 'short');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/chat/add-credit',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('includes adProofToken in body', async () => {
      await chat.addCredit('u1', 'p1', 'short');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.adProofToken).toBe('proof-token-xyz');
    });

    it('defaults adType to short when not provided', async () => {
      await chat.addCredit('u1', 'p1', null);
      expect(requestAdProofToken).toHaveBeenCalledWith('chat-credit', 'short');
    });
  });
});
