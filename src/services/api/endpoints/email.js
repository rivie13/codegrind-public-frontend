import { fetchWithError } from '../fetcher';

const email = {
  submitBugReport: (payload) =>
    fetchWithError('/api/email/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

export default email;
