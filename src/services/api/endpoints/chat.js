import { fetchWithError } from '../fetcher';
import { requestAdProofToken } from './adRewards';

const chat = {
  sendMessage: async (
    userId,
    problemId,
    message,
    assistanceLevel,
    context = null,
    model = null
  ) => {
    return fetchWithError('/api/chat/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        problemId,
        message,
        assistanceLevel,
        context,
        ...(model && { model }),
      }),
    });
  },

  getUsage: (userId, problemId) => {
    const resolvedUserId = userId || 'guest';
    return fetchWithError(`/api/chat/${resolvedUserId}/${problemId}`);
  },

  resetUsage: (userId, problemId) =>
    fetchWithError('/api/chat/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemId }),
    }),

  incrementCount: (userId, problemId) =>
    fetchWithError('/api/chat/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemId }),
    }),

  addCredit: async (userId, problemId, adType) => {
    const resolvedAdType = adType || 'short';
    const adProofToken = await requestAdProofToken('chat-credit', resolvedAdType);
    return fetchWithError('/api/chat/add-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemId, adType: resolvedAdType, adProofToken }),
    });
  },
};

export default chat;
