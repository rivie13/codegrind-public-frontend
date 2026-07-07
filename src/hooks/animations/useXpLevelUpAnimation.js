/**
 * useXpLevelUpAnimation — shared two-phase XP bar animation + sound FX
 *
 * Centralises the dramatic level-up choreography used by every modal that
 * shows an XP progress bar so the timing / FX / sounds are consistent.
 *
 * ── Level-Up Animation Timeline ──────────────────────────────────────────
 *   140ms   Phase 1 bar: previousXpProgress → 100 %, progress-bar sound
 *   ~full   Bar hits 100 %, brief hold w/ full-bar glow,
 *           level-up-begin sound plays
 *   +250ms  THUD — level-up-thud sound, bar flashes white, level text
 *           flips to new level, celebration box appears
 *   +400ms  Shake + flash end
 *   +200ms  Bar resets to 0 % (instant, hidden by flash)
 *   +500ms  Phase 2 bar: 0 → new xpProgress, progress-bar sound again
 *   +dur    Emphasis animation ends
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import audioManager from '../../utils/audio/AudioManager';
import {
  buildProgressTransition,
  getProgressTransitionDuration,
  getXpNumbersForPercent,
} from '../../utils/game/xpAnimation';

/**
 * @param {object} opts
 * @param {boolean}  opts.isOpen                 — modal visibility (triggers animation)
 * @param {boolean}  opts.hasLevelUp             — did the user level up?
 * @param {number}   opts.previousXpProgress     — old bar % (0-100)
 * @param {number}   opts.xpProgress             — new bar % (0-100)
 * @param {number}   opts.previousLevel          — level before the gain
 * @param {string}   opts.previousRoleName       — role name before the gain
 * @param {number}   opts.newLevel               — level after the gain
 * @param {string}   opts.newRoleName            — role name after the gain
 * @param {boolean}  opts.roleChanged            — did the role change?
 * @param {number}   opts.xpGained               — total XP gained (used for sound trigger)
 * @param {boolean}  opts.prefersReducedMotion    — skip visual FX
 * @param {number}   opts.previousXpIntoLevel    — XP into the old level
 * @param {number}   opts.previousXpToNextLevel  — XP to next from old level
 * @param {number}   opts.currentXpIntoLevel     — XP into the new level
 * @param {number}   opts.currentXpToNextLevel   — XP to next from current level
 * @param {number|null} opts.currentXpRemaining  — XP remaining to next level (for display)
 * @param {boolean}  opts.hasXpData              — whether XP data exists at all
 */
export default function useXpLevelUpAnimation({
  isOpen = false,
  hasLevelUp = false,
  previousXpProgress = 0,
  xpProgress = 0,
  previousLevel = 1,
  previousRoleName = 'Greenhorn',
  newLevel = 1,
  newRoleName = 'Greenhorn',
  _roleChanged = false,
  xpGained = 0,
  prefersReducedMotion = false,
  previousXpIntoLevel = 0,
  previousXpToNextLevel = 0,
  currentXpIntoLevel = 0,
  currentXpToNextLevel = 0,
  currentXpRemaining = null,
  hasXpData = true,
} = {}) {
  // ── Animation state ──
  const [animatedXpProgress, setAnimatedXpProgress] = useState(0);
  const [progressTransition, setProgressTransition] = useState('width 1.2s ease');
  const [xpDisplayMode, setXpDisplayMode] = useState('current');
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [levelUpEmphasisActive, setLevelUpEmphasisActive] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(previousLevel);
  const [displayRoleName, setDisplayRoleName] = useState(previousRoleName);

  // Visual FX states
  const [barFullGlow, setBarFullGlow] = useState(false);
  const [barFlashActive, setBarFlashActive] = useState(false);
  const [barShakeActive, setBarShakeActive] = useState(false);

  // Numeric readout synced to the animated bar position
  const xpDisplay =
    hasLevelUp && xpDisplayMode === 'previous'
      ? {
          into: previousXpIntoLevel,
          toNext: previousXpToNextLevel,
          remaining: Math.max(0, previousXpToNextLevel - previousXpIntoLevel),
        }
      : {
          into: currentXpIntoLevel,
          toNext: currentXpToNextLevel,
          remaining:
            currentXpRemaining !== null && currentXpRemaining !== undefined
              ? currentXpRemaining
              : hasXpData
                ? Math.max(0, currentXpToNextLevel - currentXpIntoLevel)
                : null,
        };

  const animatedXpDisplay = getXpNumbersForPercent({
    percent: animatedXpProgress,
    toNext: xpDisplay.toNext,
    showRemaining: hasXpData,
  });

  // ── Two-phase animation + sound choreography ──
  useEffect(() => {
    if (!isOpen || !hasXpData) return undefined;
    const timers = [];
    const skipFx = prefersReducedMotion;

    // Reset visual FX
    setBarFullGlow(false);
    setBarFlashActive(false);
    setBarShakeActive(false);

    if (hasLevelUp) {
      /* ───────────────── LEVEL-UP PATH ───────────────── */

      setShowLevelUpCelebration(false);
      setDisplayLevel(previousLevel);
      setDisplayRoleName(previousRoleName);
      setXpDisplayMode('previous');
      setLevelUpEmphasisActive(false);

      // Phase 1: fill bar previousXpProgress → 100 %
      const phase1Duration = getProgressTransitionDuration({
        fromPercent: previousXpProgress,
        toPercent: 100,
      });
      setProgressTransition(buildProgressTransition(phase1Duration));
      setAnimatedXpProgress(previousXpProgress);
      timers.push(setTimeout(() => setAnimatedXpProgress(100), 140));

      // Play progress-bar sound with the fill
      if (!skipFx) {
        timers.push(setTimeout(() => audioManager.playSoundEffect('progress-bar'), 140));
      }

      // Bar is full at ~phase1Duration + 140.  Hold at 100 % with glow.
      const fullAt = 140 + phase1Duration;

      // Bar-full glow effect + level-up announcement sound
      timers.push(
        setTimeout(() => {
          setBarFullGlow(true);
          if (!skipFx) audioManager.playSoundEffect('level-up-begin');
        }, fullAt)
      );

      // ── IMPACT (fullAt + 250ms) ──
      const impactAt = fullAt + 250;

      timers.push(
        setTimeout(() => {
          if (!skipFx) audioManager.playSoundEffect('level-up-thud');

          setBarFlashActive(true);
          setBarShakeActive(true);
          setBarFullGlow(false);

          setDisplayLevel(newLevel);
          setDisplayRoleName(newRoleName);
          setXpDisplayMode('current');

          setShowLevelUpCelebration(true);
          setLevelUpEmphasisActive(true);
        }, impactAt)
      );

      // End shake + flash after 400ms
      timers.push(
        setTimeout(() => {
          setBarShakeActive(false);
          setBarFlashActive(false);
        }, impactAt + 400)
      );

      // Reset bar to 0 % instantly (hidden behind flash)
      const resetAt = impactAt + 200;
      timers.push(
        setTimeout(() => {
          setProgressTransition('none');
          setAnimatedXpProgress(0);
        }, resetAt)
      );

      // Phase 2: 0 → xpProgress
      const phase2Start = impactAt + 500;
      timers.push(
        setTimeout(() => {
          setProgressTransition(
            buildProgressTransition(
              getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress })
            )
          );
          setAnimatedXpProgress(xpProgress);

          if (!skipFx) audioManager.playSoundEffect('progress-bar');
        }, phase2Start)
      );

      // End emphasis after phase 2 finishes
      const phase2Duration = getProgressTransitionDuration({
        fromPercent: 0,
        toPercent: xpProgress,
      });
      timers.push(
        setTimeout(() => setLevelUpEmphasisActive(false), phase2Start + phase2Duration + 200)
      );
    } else {
      /* ───────────────── NO LEVEL-UP PATH ───────────────── */

      setShowLevelUpCelebration(false);
      setDisplayLevel(newLevel || previousLevel);
      setDisplayRoleName(newRoleName || previousRoleName);
      setXpDisplayMode('current');
      setAnimatedXpProgress(0);
      setProgressTransition(
        buildProgressTransition(
          getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress })
        )
      );
      timers.push(setTimeout(() => setAnimatedXpProgress(xpProgress), 140));

      if (xpGained > 0 && !skipFx) {
        timers.push(setTimeout(() => audioManager.playSoundEffect('progress-bar'), 140));
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [
    hasLevelUp,
    hasXpData,
    isOpen,
    newLevel,
    newRoleName,
    prefersReducedMotion,
    previousLevel,
    previousRoleName,
    previousXpProgress,
    xpGained,
    xpProgress,
  ]);

  return {
    animatedXpProgress,
    progressTransition,
    showLevelUpCelebration,
    levelUpEmphasisActive,
    displayLevel,
    displayRoleName,
    xpDisplayMode,
    barFullGlow,
    barFlashActive,
    barShakeActive,
    animatedXpDisplay,
  };
}
