import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import discord from './discord';
import payments from './payments';
import profile from './profile';

describe('account/billing endpoint wrappers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls discord opt-in and unlink endpoints with expected request payloads', async () => {
    await discord.updateSolveOptIn(true);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/discord/opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optInSolveAnnouncements: true }),
    });

    await discord.unlink();
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/discord/oauth/unlink', {
      method: 'DELETE',
    });
  });

  it('calls payment endpoints with tier/interval and portal creation requests', async () => {
    await payments.createCheckoutSession('PREMIUM', 'monthly');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'PREMIUM', interval: 'monthly' }),
    });

    await payments.createPortalSession();
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/payments/create-portal-session', {
      method: 'POST',
    });
  });

  it('fetches public profile by user id', async () => {
    await profile.getPublicProfile('user-42');
    expect(fetchWithError).toHaveBeenCalledWith('/api/profile/user-42');
  });
});
