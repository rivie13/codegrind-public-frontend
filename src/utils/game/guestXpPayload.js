/**
 * guestXpPayload.js
 *
 * Builds XP payloads in the same shape as the server returns,
 * so that all success modals (SuccessModal, TowerDefenseSuccessModal,
 * PathChoiceModal) can consume guest XP data identically to
 * authenticated XP data — including level-up detection, progress
 * bar animations, and sound effects.
 */

import { getGuestXpSummaryFromTotalXp } from '../../hooks/guest/useGuestProgress';

/**
 * Build a guest XP payload that mirrors the server response shape:
 *   { summary, awards, levelUp }
 *
 * @param {Object} opts
 * @param {number} opts.previousTotalXp - Total guest XP *before* this action
 * @param {number} opts.currentTotalXp  - Total guest XP *after* this action
 * @param {string} [opts.reason]        - XP award reason label (e.g. 'problem_solve')
 * @returns {{ summary: Object, awards: Array, levelUp: Object|null }}
 */
export function buildGuestXpPayload({ previousTotalXp, currentTotalXp, reason = 'problem_solve' }) {
  const prevXp = Math.max(0, Number(previousTotalXp) || 0);
  const curXp = Math.max(0, Number(currentTotalXp) || 0);
  const xpGained = Math.max(0, curXp - prevXp);

  const prevSummary = getGuestXpSummaryFromTotalXp(prevXp);
  const curSummary = getGuestXpSummaryFromTotalXp(curXp);

  const summary = {
    xp: curSummary.xp,
    level: curSummary.level,
    roleName: curSummary.roleName,
    xpIntoLevel: curSummary.xpIntoLevel,
    xpToNextLevel: curSummary.xpToNextLevel,
    progressPercent: curSummary.progressPercent,
    xpRemainingToNextLevel: curSummary.xpRemainingToNextLevel,
  };

  const awards = xpGained > 0 ? [{ reason, amount: xpGained, label: reason }] : [];

  let levelUp = null;
  if (curSummary.level > prevSummary.level) {
    levelUp = {
      previousLevel: prevSummary.level,
      newLevel: curSummary.level,
      previousRoleName: prevSummary.roleName,
      newRoleName: curSummary.roleName,
      roleChanged: prevSummary.roleName !== curSummary.roleName,
      previousXpIntoLevel: prevSummary.xpIntoLevel,
      previousXpToNextLevel: prevSummary.xpToNextLevel,
    };
  }

  return { summary, awards, levelUp };
}

export default buildGuestXpPayload;
