import { fetchWithError } from '../fetcher';

const profile = {
  getPublicProfile: async (userId) => fetchWithError(`/api/profile/${userId}`)
};

export default profile;
