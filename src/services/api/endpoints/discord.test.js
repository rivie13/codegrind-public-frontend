import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import discord from './discord';

describe('discord endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ ok: true });
  });

  describe('updateSolveOptIn', () => {
    it('calls POST /api/discord/opt-in', async () => {
      await discord.updateSolveOptIn(true);
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/discord/opt-in',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends optInSolveAnnouncements in body', async () => {
      await discord.updateSolveOptIn(false);
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({ optInSolveAnnouncements: false });
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ updated: true });
      const result = await discord.updateSolveOptIn(true);
      expect(result).toEqual({ updated: true });
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('discord error'));
      await expect(discord.updateSolveOptIn(true)).rejects.toThrow('discord error');
    });
  });

  describe('unlink', () => {
    it('calls DELETE /api/discord/oauth/unlink', async () => {
      await discord.unlink();
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/discord/oauth/unlink',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ unlinked: true });
      const result = await discord.unlink();
      expect(result).toEqual({ unlinked: true });
    });
  });
});
