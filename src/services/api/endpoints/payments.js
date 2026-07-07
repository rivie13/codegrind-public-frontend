import { fetchWithError } from '../fetcher';

const payments = {
  createCheckoutSession: async (tier, interval) =>
    fetchWithError('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, interval })
    }),
  createPortalSession: async () =>
    fetchWithError('/api/payments/create-portal-session', {
      method: 'POST'
    })
};

export default payments;
