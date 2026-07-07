import { fetchWithError } from '../fetcher';

const discord = {
  updateSolveOptIn: (optInSolveAnnouncements) =>
    fetchWithError('/api/discord/opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optInSolveAnnouncements })
    }),
  unlink: () =>
    fetchWithError('/api/discord/oauth/unlink', {
      method: 'DELETE'
    })
};

export default discord;
