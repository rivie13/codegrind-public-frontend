import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import { requestAdProofToken } from './adRewards';

describe('requestAdProofToken', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ proofToken: 'tok-abc123' });
  });

  it('calls GET /api/auth/ad-proof with placement and adType params', async () => {
    await requestAdProofToken('chat-credit', 'short');
    const [url] = fetchWithError.mock.calls[0];
    expect(url).toContain('/api/auth/ad-proof');
    expect(url).toContain('placement=chat-credit');
    expect(url).toContain('adType=short');
  });

  it('returns the proofToken from the response', async () => {
    const token = await requestAdProofToken('chat-credit', 'short');
    expect(token).toBe('tok-abc123');
  });

  it('defaults adType to short', async () => {
    await requestAdProofToken('tower-credit');
    const [url] = fetchWithError.mock.calls[0];
    expect(url).toContain('adType=short');
  });

  it('returns undefined when response has no proofToken', async () => {
    fetchWithError.mockResolvedValue({});
    const token = await requestAdProofToken('test', 'short');
    expect(token).toBeUndefined();
  });

  it('propagates errors', async () => {
    fetchWithError.mockRejectedValue(new Error('auth error'));
    await expect(requestAdProofToken('chat-credit', 'short')).rejects.toThrow('auth error');
  });
});
