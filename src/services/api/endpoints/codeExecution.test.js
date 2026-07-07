import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import codeExecution from './codeExecution';

describe('codeExecution endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('gets rate limit status', () => {
    codeExecution.getRateLimitStatus();

    expect(fetchWithError).toHaveBeenCalledWith('/api/code-execution/rate-limit-status');
  });

  it('triggers Judge0 prewarm without blocking the editor load path', () => {
    codeExecution.prewarm();

    expect(fetchWithError).toHaveBeenCalledWith('/api/prewarm', {
      method: 'POST',
    });
  });

  it('adds ad credit with default and explicit ad types', async () => {
    fetchWithError
      .mockResolvedValueOnce({ proofToken: 'proof-short' })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ proofToken: 'proof-long' })
      .mockResolvedValueOnce({ ok: true });

    await codeExecution.addCredit();
    expect(fetchWithError).toHaveBeenNthCalledWith(
      1,
      '/api/auth/ad-proof?placement=code-execution-credit&adType=short'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/code-execution/add-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType: 'short', adProofToken: 'proof-short' }),
    });

    await codeExecution.addCredit('long');
    expect(fetchWithError).toHaveBeenNthCalledWith(
      3,
      '/api/auth/ad-proof?placement=code-execution-credit&adType=long'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(4, '/api/code-execution/add-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType: 'long', adProofToken: 'proof-long' }),
    });
  });
});
