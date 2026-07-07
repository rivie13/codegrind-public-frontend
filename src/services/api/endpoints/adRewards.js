import { fetchWithError } from '../fetcher';

export const requestAdProofToken = async (placement, adType = 'short') => {
  const params = new URLSearchParams({
    placement,
    adType,
  });

  const data = await fetchWithError(`/api/auth/ad-proof?${params.toString()}`);
  return data?.proofToken;
};
