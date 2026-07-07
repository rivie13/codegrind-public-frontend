import { describe, expect, it, vi } from 'vitest';

const loadService = async ({ fetchImpl } = {}) => {
  vi.resetModules();

  const fetchWithError = vi.fn(fetchImpl || (async () => ({ ok: true })));
  const trackGoogleAnalyticsEvent = vi.fn();
  const logger = {
    warn: vi.fn(),
  };

  vi.doMock('./api/fetcher', () => ({
    fetchWithError,
  }));

  vi.doMock('./analyticsService', () => ({
    trackGoogleAnalyticsEvent,
  }));

  vi.doMock('../utils/core/logger', () => ({
    default: logger,
  }));

  const mod = await import('./userContentEventService');
  return {
    beginPostSignupTelemetrySession: mod.beginPostSignupTelemetrySession,
    clearPostSignupTelemetrySession: mod.clearPostSignupTelemetrySession,
    trackUserContentEvent: mod.trackUserContentEvent,
    fetchWithError,
    trackGoogleAnalyticsEvent,
    logger,
  };
};

describe('userContentEventService', () => {
  it('starts and clears a post-signup telemetry session', async () => {
    const { beginPostSignupTelemetrySession, clearPostSignupTelemetrySession } =
      await loadService();

    beginPostSignupTelemetrySession({
      signupSource: 'direct_signup',
      signupGuestTrialState: 'no_guest_token',
      signupAuthProvider: 'local',
      signupEntryRoute: '/register',
      emailVerified: 'true',
      membershipTier: 'FREE',
      progressSummary: {
        demoCompleted: 'false',
        pathChoice: 'none',
        trialLearningPath: 'none',
        problemsAttemptedCount: '0',
        problemsSolvedCount: '0',
        lpNodesCompletedCount: '0',
        hadGuestToken: 'false',
      },
    });

    expect(JSON.parse(localStorage.getItem('codegrind_post_signup_context'))).toEqual(
      expect.objectContaining({
        signupSource: 'direct_signup',
        signupGuestTrialState: 'no_guest_token',
        signupAuthProvider: 'local',
        signupEntryRoute: '/register',
      })
    );

    clearPostSignupTelemetrySession();
    expect(localStorage.getItem('codegrind_post_signup_context')).toBeNull();
  });

  it('posts authenticated content events to the analytics endpoint', async () => {
    const { trackUserContentEvent, fetchWithError, trackGoogleAnalyticsEvent, logger } =
      await loadService();

    await trackUserContentEvent('user_content_surface_opened', {
      area: 'interview',
      surface: 'problem_list',
    });

    expect(trackGoogleAnalyticsEvent).toHaveBeenCalledWith('user_content_surface_opened', {
      area: 'interview',
      surface: 'problem_list',
    });
    expect(fetchWithError).toHaveBeenCalledWith('/api/analytics/user-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'user_content_surface_opened',
        metadata: { area: 'interview', surface: 'problem_list' },
      }),
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('enriches events during the post-signup window and emits first-touch activation events', async () => {
    const {
      beginPostSignupTelemetrySession,
      trackUserContentEvent,
      fetchWithError,
      trackGoogleAnalyticsEvent,
    } = await loadService();

    beginPostSignupTelemetrySession({
      signupSource: 'guest_conversion',
      signupGuestTrialState: 'meaningful_guest_progress',
      signupAuthProvider: 'google',
      signupEntryRoute: '/register',
      emailVerified: 'true',
      membershipTier: 'FREE',
      progressSummary: {
        demoCompleted: 'true',
        pathChoice: 'python',
        trialLearningPath: 'python_path',
        problemsAttemptedCount: '2',
        problemsSolvedCount: '1',
        lpNodesCompletedCount: '1',
        hadGuestToken: 'true',
      },
    });

    await trackUserContentEvent('user_content_surface_opened', {
      area: 'interview',
      surface: 'problem_list',
    });
    await trackUserContentEvent('user_problem_started', {
      area: 'interview',
      surface: 'problem_workspace',
    });

    expect(fetchWithError).toHaveBeenCalledTimes(4);

    const parsedBodies = fetchWithError.mock.calls.map((call) => JSON.parse(call[1].body));
    expect(parsedBodies[0]).toEqual(
      expect.objectContaining({
        eventName: 'user_content_surface_opened',
        metadata: expect.objectContaining({
          signupSource: 'guest_conversion',
          signupGuestTrialState: 'meaningful_guest_progress',
          signupAuthProvider: 'google',
        }),
      })
    );
    expect(parsedBodies[1]).toEqual(
      expect.objectContaining({
        eventName: 'user_post_signup_first_content_opened',
        metadata: expect.objectContaining({
          triggerEventName: 'user_content_surface_opened',
          signupSource: 'guest_conversion',
        }),
      })
    );
    expect(parsedBodies[3]).toEqual(
      expect.objectContaining({
        eventName: 'user_post_signup_first_meaningful_action',
        metadata: expect.objectContaining({
          triggerEventName: 'user_problem_started',
          signupSource: 'guest_conversion',
        }),
      })
    );
    expect(trackGoogleAnalyticsEvent).toHaveBeenCalledWith(
      'user_post_signup_first_meaningful_action',
      expect.objectContaining({ signupSource: 'guest_conversion' })
    );
  });

  it('swallows request failures and logs a warning', async () => {
    const error = new Error('network down');
    const { trackUserContentEvent, logger } = await loadService({
      fetchImpl: async () => {
        throw error;
      },
    });

    await expect(trackUserContentEvent('user_content_surface_opened')).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      '[userContentEvent] Failed to record event "user_content_surface_opened":',
      'network down'
    );
  });
});
