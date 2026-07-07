// Mirror of backend dataPacketRules.js constants — used for client-side estimation only.
// The backend is always authoritative; these are for UI display when exact values aren't returned.
const XP_TO_DP_RATIO = 1.8; // mid-range of per-reason ratioOverrides (1.8 = ai_solve first solve)
const MIN_PER_EVENT = 5;
const MAX_PER_EVENT = 200; // reflects typical solve cap

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const estimateDataPacketsFromXp = (xpAmount) => {
  const numericXp = toFiniteNumber(xpAmount);
  if (!numericXp || numericXp <= 0) return 0;
  const estimated = Math.floor(numericXp * XP_TO_DP_RATIO);
  return Math.min(MAX_PER_EVENT, Math.max(MIN_PER_EVENT, estimated));
};

const normalizeAwards = (rawAwards) => {
  if (!Array.isArray(rawAwards)) return [];
  return rawAwards
    .map((award) => {
      const amount = toFiniteNumber(award?.amount);
      if (!amount || amount <= 0) return null;
      return {
        reason: award?.reason || 'data_packet_award',
        amount,
      };
    })
    .filter(Boolean);
};

export const normalizeDataPacketsPayload = (
  rawPayload,
  { fallbackXpAmount = 0, fallbackIsExact = false } = {}
) => {
  const payload = rawPayload || null;
  const normalizedAwards = normalizeAwards(payload?.awards);

  if (normalizedAwards.length === 0) {
    const amount = toFiniteNumber(payload?.amount);
    if (amount && amount > 0) {
      normalizedAwards.push({ reason: payload?.reason || 'data_packet_award', amount });
    }
  }

  const totalEarned = normalizedAwards.reduce((sum, award) => sum + award.amount, 0);
  const walletBalance =
    toFiniteNumber(payload?.wallet?.balance) ??
    toFiniteNumber(payload?.newBalance) ??
    toFiniteNumber(payload?.balance);

  if (totalEarned > 0 || walletBalance !== null) {
    return {
      awards: normalizedAwards,
      totalEarned,
      walletBalance,
      isEstimated: false,
    };
  }

  void fallbackXpAmount;
  void fallbackIsExact;
  return null;
};
