import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import payments from './payments';

describe('payments endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
  });

  describe('createCheckoutSession', () => {
    it('calls POST /api/payments/create-checkout-session', async () => {
      await payments.createCheckoutSession('pro', 'monthly');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/payments/create-checkout-session',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends tier and interval in body', async () => {
      await payments.createCheckoutSession('elite', 'yearly');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({ tier: 'elite', interval: 'yearly' });
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ url: 'https://stripe.example.com/checkout' });
      const result = await payments.createCheckoutSession('pro', 'monthly');
      expect(result.url).toBe('https://stripe.example.com/checkout');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('stripe error'));
      await expect(payments.createCheckoutSession('pro', 'monthly')).rejects.toThrow(
        'stripe error'
      );
    });
  });

  describe('createPortalSession', () => {
    it('calls POST /api/payments/create-portal-session', async () => {
      await payments.createPortalSession();
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/payments/create-portal-session',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ url: 'https://portal.stripe.com/test' });
      const result = await payments.createPortalSession();
      expect(result.url).toBe('https://portal.stripe.com/test');
    });
  });
});
