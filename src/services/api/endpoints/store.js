import { fetchWithError } from '../fetcher';

const store = {
  getWallet: async () => fetchWithError('/api/store/wallet', { method: 'GET' }),
  getItems: async () => fetchWithError('/api/store/items', { method: 'GET' }),
  getInventory: async () => fetchWithError('/api/store/inventory', { method: 'GET' }),
  getEquipped: async () => fetchWithError('/api/store/equipped', { method: 'GET' }),
  purchase: async ({ itemSlug }) =>
    fetchWithError('/api/store/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemSlug }),
    }),
  equip: async ({ slot, itemId }) =>
    fetchWithError('/api/store/equip', {
      method: 'POST',
      body: JSON.stringify({ slot, itemId }),
    }),
  unequip: async ({ slot }) =>
    fetchWithError('/api/store/unequip', {
      method: 'POST',
      body: JSON.stringify({ slot }),
    }),
};

export default store;
