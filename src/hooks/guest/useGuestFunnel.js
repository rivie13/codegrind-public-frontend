/**
 * useGuestFunnel.js — Fires Azure Monitor funnel events for the guest
 * trial conversion flow: demo → path → trial problems → signup wall → signup.
 *
 * Events are fire-and-forget; failures never affect UX.
 * Each step is deduplicated per page-session via a local Set so
 * rapidly re-rendered components don't spam the backend.
 *
 * Usage:
 *   const funnel = useGuestFunnel();
 *   funnel.demoStarted();              // homepage demo begins
 *   funnel.demoCompleted();            // demo TD round ends
 *   funnel.pathChosen('beginner');      // user picks a learning path
 *   funnel.trialProblemStarted(slug);   // guest opens a problem
 *   funnel.trialProblemSolved(slug);    // guest solves it
 *   funnel.signupWallShown();           // wall modal fires
 *   funnel.signupWallConverted();       // user clicks "Sign Up"
 *   funnel.signupCompleted();           // OAuth succeeds
 */

import { useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackGuestFunnelStep } from '../../services/guestFunnelService';

export default function useGuestFunnel() {
  const { isAuthenticated } = useAuth();
  const sentRef = useRef(new Set());

  /**
   * Internal: only fire if user is NOT authenticated and step hasn't
   * been sent in this hook instance's lifetime (and session).
   */
  const fire = useCallback(
    (step, metadata = {}) => {
      if (isAuthenticated) return Promise.resolve(null);
      const key = `${step}:${metadata.slug || metadata.path || metadata.stepId || metadata.towerType || ''}`;

      let alreadySent = false;
      try {
        const sessionKey = 'cg_guest_funnel_sent_steps';
        const raw = sessionStorage.getItem(sessionKey);
        const sent = raw ? JSON.parse(raw) : [];
        if (sent.includes(key)) {
          alreadySent = true;
        } else {
          sent.push(key);
          sessionStorage.setItem(sessionKey, JSON.stringify(sent));
        }
      } catch {
        if (sentRef.current.has(key)) {
          alreadySent = true;
        } else {
          sentRef.current.add(key);
        }
      }

      if (alreadySent) return Promise.resolve(null);
      return trackGuestFunnelStep(step, metadata);
    },
    [isAuthenticated]
  );

  const demoLoadingStarted = useCallback(
    (type, metadata = {}) => fire('demo_loading_started', type ? { type, ...metadata } : metadata),
    [fire]
  );
  const demoStarted = useCallback(
    (type, metadata = {}) => fire('demo_started', type ? { type, ...metadata } : metadata),
    [fire]
  );
  const briefScrolled = useCallback(() => fire('brief_scrolled'), [fire]);
  const problemOpened = useCallback(() => {
    try {
      sessionStorage.setItem('cg_problem_opened', 'true');
    } catch {
      // ignore
    }
    return fire('problem_opened');
  }, [fire]);
  const editorOpened = useCallback(() => {
    try {
      sessionStorage.setItem('cg_editor_opened', 'true');
    } catch {
      // ignore
    }
    return fire('editor_opened');
  }, [fire]);
  const firstKeystroke = useCallback(() => fire('first_keystroke'), [fire]);
  const firstRun = useCallback(() => fire('first_run'), [fire]);
  const firstSuccess = useCallback(() => fire('first_success'), [fire]);
  const tutorialStepReached = useCallback(
    (stepId) => {
      try {
        sessionStorage.setItem('cg_last_tutorial_step', stepId);
      } catch {
        // ignore
      }
      return fire('tutorial_step_reached', { stepId });
    },
    [fire]
  );
  const tutorialStepCompleted = useCallback(
    (stepId) => {
      try {
        sessionStorage.setItem('cg_last_tutorial_step', stepId);
      } catch {
        // ignore
      }
      return fire('tutorial_step_completed', { stepId });
    },
    [fire]
  );
  const demoCompleted = useCallback(() => fire('demo_completed'), [fire]);
  const pathChosen = useCallback((path) => fire('path_chosen', { path }), [fire]);
  const trialProblemStarted = useCallback(
    (slug) => fire('trial_problem_started', { slug }),
    [fire]
  );
  const trialProblemSolved = useCallback((slug) => fire('trial_problem_solved', { slug }), [fire]);
  const signupWallShown = useCallback(() => fire('signup_wall_shown'), [fire]);
  const signupWallConverted = useCallback(() => fire('signup_wall_converted'), [fire]);
  const signupCompleted = useCallback(() => fire('signup_completed'), [fire]);

  const towerHovered = useCallback(
    (towerType) => fire('tower_hovered', { towerType: String(towerType) }),
    [fire]
  );
  const towerSelected = useCallback(
    (towerType) => fire('tower_selected', { towerType: String(towerType) }),
    [fire]
  );
  const homepageReached = useCallback(
    (metadata = {}) => fire('homepage_reached', metadata),
    [fire]
  );
  const demoProblemLoaded = useCallback(
    (metadata = {}) => fire('demo_problem_loaded', metadata),
    [fire]
  );
  const beginDemoClicked = useCallback(
    (metadata = {}) => fire('begin_demo_clicked', metadata),
    [fire]
  );

  const guestSessionEnded = useCallback(
    (stats = {}) => {
      const cleanStats = {};
      for (const key of Object.keys(stats)) {
        if (stats[key] !== undefined && stats[key] !== null) {
          cleanStats[key] = String(stats[key]);
        }
      }
      return fire('guest_session_ended', cleanStats);
    },
    [fire]
  );

  const engineZoneEntered = useCallback(
    (metadata = {}) => fire('engine_zone_entered', metadata),
    [fire]
  );
  const engineInteractionAttempt = useCallback(
    (metadata = {}) => fire('engine_interaction_attempt', metadata),
    [fire]
  );
  const engineTerminalFound = useCallback(
    (metadata = {}) => fire('engine_terminal_found', metadata),
    [fire]
  );
  const engineFramerateDrop = useCallback(
    (metadata = {}) => fire('engine_framerate_drop', metadata),
    [fire]
  );
  const webglContextLost = useCallback(
    (metadata = {}) => fire('webgl_context_lost', metadata),
    [fire]
  );
  const postPathUiRendered = useCallback(
    (metadata = {}) => fire('post_path_ui_rendered', metadata),
    [fire]
  );

  return useMemo(
    () => ({
      homepageReached,
      demoProblemLoaded,
      beginDemoClicked,
      demoLoadingStarted,
      demoStarted,
      briefScrolled,
      problemOpened,
      editorOpened,
      firstKeystroke,
      firstRun,
      firstSuccess,
      tutorialStepReached,
      tutorialStepCompleted,
      demoCompleted,
      pathChosen,
      trialProblemStarted,
      trialProblemSolved,
      signupWallShown,
      signupWallConverted,
      signupCompleted,
      towerHovered,
      towerSelected,
      guestSessionEnded,
      engineZoneEntered,
      engineInteractionAttempt,
      engineTerminalFound,
      engineFramerateDrop,
      webglContextLost,
      postPathUiRendered,
    }),
    [
      homepageReached,
      demoProblemLoaded,
      beginDemoClicked,
      demoLoadingStarted,
      demoStarted,
      briefScrolled,
      problemOpened,
      editorOpened,
      firstKeystroke,
      firstRun,
      firstSuccess,
      tutorialStepReached,
      tutorialStepCompleted,
      demoCompleted,
      pathChosen,
      trialProblemStarted,
      trialProblemSolved,
      signupWallShown,
      signupWallConverted,
      signupCompleted,
      towerHovered,
      towerSelected,
      guestSessionEnded,
      engineZoneEntered,
      engineInteractionAttempt,
      engineTerminalFound,
      engineFramerateDrop,
      webglContextLost,
      postPathUiRendered,
    ]
  );
}
