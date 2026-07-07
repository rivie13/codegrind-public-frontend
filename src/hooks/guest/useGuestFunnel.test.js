import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadHook = async ({ isAuthenticated = false } = {}) => {
  vi.resetModules();

  const trackGuestFunnelStep = vi.fn();

  vi.doMock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated }),
  }));

  vi.doMock('../../services/guestFunnelService', () => ({
    trackGuestFunnelStep,
  }));

  const mod = await import('./useGuestFunnel');
  const hook = renderHook(() => mod.default());

  return { hook, trackGuestFunnelStep };
};

describe('useGuestFunnel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  it('fires each step once per unique key for guest users', async () => {
    const { hook, trackGuestFunnelStep } = await loadHook({ isAuthenticated: false });

    act(() => {
      hook.result.current.homepageReached();
      hook.result.current.homepageReached();
      hook.result.current.beginDemoClicked({ source: 'hero' });
      hook.result.current.beginDemoClicked({ source: 'hero' });
      hook.result.current.demoLoadingStarted('quick');
      hook.result.current.demoLoadingStarted('quick');
      hook.result.current.demoStarted('quick', { durationMs: '1250' });
      hook.result.current.demoStarted('quick', { durationMs: '1250' });
      hook.result.current.briefScrolled();
      hook.result.current.briefScrolled();
      hook.result.current.problemOpened();
      hook.result.current.problemOpened();
      hook.result.current.editorOpened();
      hook.result.current.editorOpened();
      hook.result.current.firstKeystroke();
      hook.result.current.firstKeystroke();
      hook.result.current.firstRun();
      hook.result.current.firstRun();
      hook.result.current.firstSuccess();
      hook.result.current.firstSuccess();
      hook.result.current.tutorialStepReached('mission-objective');
      hook.result.current.tutorialStepReached('mission-objective');
      hook.result.current.tutorialStepReached('jack-in');
      hook.result.current.tutorialStepCompleted('mission-objective');
      hook.result.current.tutorialStepCompleted('mission-objective');
      hook.result.current.demoCompleted();
      hook.result.current.pathChosen('beginner');
      hook.result.current.pathChosen('beginner');
      hook.result.current.pathChosen('advanced');
      hook.result.current.trialProblemStarted('two-sum');
      hook.result.current.trialProblemStarted('two-sum');
      hook.result.current.trialProblemStarted('valid-parentheses');
      hook.result.current.trialProblemSolved('two-sum');
      hook.result.current.signupWallShown();
      hook.result.current.signupWallShown();
      hook.result.current.signupWallConverted();
      hook.result.current.signupCompleted();
    });

    expect(trackGuestFunnelStep.mock.calls).toEqual([
      ['homepage_reached', {}],
      ['begin_demo_clicked', { source: 'hero' }],
      ['demo_loading_started', { type: 'quick' }],
      ['demo_started', { type: 'quick', durationMs: '1250' }],
      ['brief_scrolled', {}],
      ['problem_opened', {}],
      ['editor_opened', {}],
      ['first_keystroke', {}],
      ['first_run', {}],
      ['first_success', {}],
      ['tutorial_step_reached', { stepId: 'mission-objective' }],
      ['tutorial_step_reached', { stepId: 'jack-in' }],
      ['tutorial_step_completed', { stepId: 'mission-objective' }],
      ['demo_completed', {}],
      ['path_chosen', { path: 'beginner' }],
      ['path_chosen', { path: 'advanced' }],
      ['trial_problem_started', { slug: 'two-sum' }],
      ['trial_problem_started', { slug: 'valid-parentheses' }],
      ['trial_problem_solved', { slug: 'two-sum' }],
      ['signup_wall_shown', {}],
      ['signup_wall_converted', {}],
      ['signup_completed', {}],
    ]);
  });

  it('deduplicates demoStarted across different types', async () => {
    const { hook, trackGuestFunnelStep } = await loadHook({ isAuthenticated: false });

    act(() => {
      hook.result.current.demoStarted('full');
      hook.result.current.demoStarted('quick');
    });

    expect(trackGuestFunnelStep.mock.calls).toEqual([['demo_started', { type: 'full' }]]);
  });

  it('does not fire funnel events for authenticated users', async () => {
    const { hook, trackGuestFunnelStep } = await loadHook({ isAuthenticated: true });

    act(() => {
      hook.result.current.demoStarted('quick');
      hook.result.current.briefScrolled();
      hook.result.current.problemOpened();
      hook.result.current.editorOpened();
      hook.result.current.firstKeystroke();
      hook.result.current.firstRun();
      hook.result.current.firstSuccess();
      hook.result.current.demoCompleted();
      hook.result.current.pathChosen('beginner');
      hook.result.current.trialProblemStarted('two-sum');
      hook.result.current.trialProblemSolved('two-sum');
      hook.result.current.signupWallShown();
      hook.result.current.signupWallConverted();
      hook.result.current.signupCompleted();
    });

    expect(trackGuestFunnelStep).not.toHaveBeenCalled();
  });
});
