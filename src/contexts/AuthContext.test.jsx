import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mockFetchWithError = vi.hoisted(() => vi.fn());
const mockClearGuestTokenState = vi.hoisted(() => vi.fn());
const mockTrackGuestFunnelStep = vi.hoisted(() => vi.fn());
const mockBeginPostSignupTelemetrySession = vi.hoisted(() => vi.fn());
const mockClearPostSignupTelemetrySession = vi.hoisted(() => vi.fn());
const mockTrackUserContentEvent = vi.hoisted(() => vi.fn());
const mockUseIsMobileDevice = vi.hoisted(() => vi.fn(() => false));
const mockToast = vi.hoisted(() => {
  const fn = vi.fn();
  fn.isActive = vi.fn(() => false);
  return fn;
});

vi.mock('@chakra-ui/react', () => ({
  useToast: () => mockToast,
}));

vi.mock('../services/api', () => ({
  api: {
    auth: {
      check: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getUserProfile: vi.fn(),
    },
  },
}));

vi.mock('../services/api/fetcher', () => ({
  fetchWithError: mockFetchWithError,
  clearGuestTokenState: mockClearGuestTokenState,
}));

vi.mock('../services/guestFunnelService', () => ({
  trackGuestFunnelStep: mockTrackGuestFunnelStep,
}));

vi.mock('../services/userContentEventService', () => ({
  beginPostSignupTelemetrySession: mockBeginPostSignupTelemetrySession,
  clearPostSignupTelemetrySession: mockClearPostSignupTelemetrySession,
  trackUserContentEvent: mockTrackUserContentEvent,
}));

vi.mock('../utils/core/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../services/api';

// Consumer component to expose auth context values
const TestConsumer = () => {
  const { user, isAuthenticated, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.username ?? 'none'}</span>
    </div>
  );
};

const LocationConsumer = () => {
  const location = useLocation();

  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>;
};

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mockToast.mockReset();
  mockToast.isActive.mockReset();
  mockToast.isActive.mockReturnValue(false);
  mockClearGuestTokenState.mockReset();
  mockClearGuestTokenState.mockImplementation(() => {
    localStorage.removeItem('guest_token');
  });
  mockFetchWithError.mockResolvedValue({ success: true });
  mockBeginPostSignupTelemetrySession.mockReset();
  mockClearPostSignupTelemetrySession.mockReset();
  mockTrackUserContentEvent.mockReset();
  mockTrackUserContentEvent.mockResolvedValue(undefined);
  mockUseIsMobileDevice.mockReset();
  mockUseIsMobileDevice.mockReturnValue(false);
  api.auth.getUserProfile.mockResolvedValue({
    progress: {
      xp: 0,
      level: 1,
      xpIntoLevel: 0,
      xpToNextLevel: 150,
      roleName: 'Greenhorn',
    },
  });
});

// ---------------------------------------------------------------------------
// checkAuth on mount
// ---------------------------------------------------------------------------

describe('AuthProvider — checkAuth', () => {
  it('keeps loading state true when no userId exists and auth check is still pending', async () => {
    // api.auth.check will never resolve — keeps loading state
    api.auth.check.mockReturnValue(new Promise(() => {}));

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('sets user and isAuthenticated when api.auth.check returns authenticated', async () => {
    api.auth.check.mockResolvedValue({
      authenticated: true,
      user: { id: 1, username: 'testuser', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('username').textContent).toBe('testuser');
  });

  it('persists the backend auth provider after session rehydration', async () => {
    api.auth.check.mockResolvedValue({
      authenticated: true,
      authProvider: 'google',
      user: { id: 1, username: 'testuser', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(localStorage.getItem('auth_provider')).toBe('google');
  });

  it('migrates guest token with progress blob after authenticated conversion', async () => {
    localStorage.setItem('guest_token', 'guest-token-abc');
    localStorage.setItem(
      'codegrind_guest_progress',
      JSON.stringify({
        demoCompleted: true,
        guestAchievements: ['hello-codegrind', 'first-blood'],
      })
    );

    api.auth.check.mockResolvedValue({
      authenticated: true,
      authAction: 'register',
      user: { id: 99, username: 'converted', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockTrackGuestFunnelStep).toHaveBeenCalledWith(
        'signup_completed',
        expect.objectContaining({
          demoCompleted: 'true',
          pathChoice: 'none',
          problemsSolvedCount: '0',
        })
      );
    });
    expect(mockBeginPostSignupTelemetrySession).toHaveBeenCalledWith(
      expect.objectContaining({
        signupSource: 'guest_conversion',
        signupGuestTrialState: 'meaningful_guest_progress',
      })
    );
    expect(mockTrackUserContentEvent).toHaveBeenCalledWith(
      'user_signup_completed',
      expect.objectContaining({ membershipTier: 'FREE' })
    );
    expect(mockTrackUserContentEvent).toHaveBeenCalledWith(
      'user_post_signup_landing_viewed',
      expect.objectContaining({ surface: 'post_signup_entry' })
    );
    await waitFor(() => {
      expect(mockFetchWithError).toHaveBeenCalledWith(
        '/api/guest/migrate',
        expect.objectContaining({
          method: 'POST',
          skipGuestToken: true,
          body: expect.any(String),
        })
      );
    });

    const migrateCall = mockFetchWithError.mock.calls.find(
      (call) => call[0] === '/api/guest/migrate'
    );
    const migratePayload = JSON.parse(migrateCall[1].body);
    expect(migratePayload).toEqual({
      guestToken: 'guest-token-abc',
      progressData: {
        demoCompleted: true,
        guestAchievements: ['hello-codegrind', 'first-blood'],
      },
    });
    expect(mockClearGuestTokenState).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('guest_token')).toBeNull();
    expect(localStorage.getItem('codegrind_guest_progress')).toBeNull();
  });

  it('tracks direct signup completion separately when no guest trial markers exist', async () => {
    api.auth.check.mockResolvedValue({
      authenticated: true,
      authAction: 'register',
      user: { id: 88, username: 'direct-signup', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockTrackGuestFunnelStep).toHaveBeenCalledWith(
        'signup_completed_no_guest_trial',
        expect.objectContaining({
          demoCompleted: 'false',
          pathChoice: 'none',
          problemsSolvedCount: '0',
          hadGuestToken: 'false',
        })
      );
    });
    expect(mockBeginPostSignupTelemetrySession).toHaveBeenCalledWith(
      expect.objectContaining({
        signupSource: 'direct_signup',
        signupGuestTrialState: 'no_guest_token',
      })
    );

    const migrateCalls = mockFetchWithError.mock.calls.filter(
      (call) => call[0] === '/api/guest/migrate'
    );
    expect(migrateCalls).toHaveLength(0);
  });

  it('tracks no-guest-trial signup when a guest token exists but no trial progression markers exist', async () => {
    localStorage.setItem('guest_token', 'guest-token-empty');
    localStorage.setItem('codegrind_guest_progress', JSON.stringify({}));

    api.auth.check.mockResolvedValue({
      authenticated: true,
      authAction: 'register',
      user: { id: 66, username: 'empty-guest', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockTrackGuestFunnelStep).toHaveBeenCalledWith(
        'signup_completed_no_guest_trial',
        expect.objectContaining({
          hadGuestToken: 'true',
          pathChoice: 'none',
          problemsAttemptedCount: '0',
        })
      );
    });

    await waitFor(() => {
      expect(mockFetchWithError).toHaveBeenCalledWith(
        '/api/guest/migrate',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('keeps guest state when migration fails so conversion can retry later', async () => {
    localStorage.setItem('guest_token', 'guest-token-retry');
    localStorage.setItem('codegrind_guest_progress', JSON.stringify({ demoCompleted: true }));
    mockFetchWithError.mockRejectedValueOnce(new Error('temporary failure'));

    api.auth.check.mockResolvedValue({
      authenticated: true,
      authAction: 'register',
      user: { id: 99, username: 'converted', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockFetchWithError).toHaveBeenCalledWith(
        '/api/guest/migrate',
        expect.objectContaining({ method: 'POST' })
      );

      expect(sessionStorage.getItem('guest_migration_inflight:guest-token-retry')).toBeNull();
    });

    expect(localStorage.getItem('guest_token')).toBe('guest-token-retry');
    expect(localStorage.getItem('codegrind_guest_progress')).toBe(
      JSON.stringify({ demoCompleted: true })
    );
    expect(mockClearGuestTokenState).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('guest_migration_done:guest-token-retry')).toBeNull();
    expect(sessionStorage.getItem('guest_migration_failed_notice:guest-token-retry')).toBe('1');
    expect(sessionStorage.getItem('guest_migration_inflight:guest-token-retry')).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'guest-migration-failed',
        title: 'Guest progress not migrated',
        status: 'warning',
      })
    );
  });

  it('skips migration when this session already completed guest conversion for token', async () => {
    localStorage.setItem('guest_token', 'guest-token-once');
    sessionStorage.setItem('guest_migration_done:guest-token-once', '1');

    api.auth.check.mockResolvedValue({
      authenticated: true,
      authAction: 'register',
      user: { id: 99, username: 'converted', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    const migrateCalls = mockFetchWithError.mock.calls.filter(
      (call) => call[0] === '/api/guest/migrate'
    );
    expect(migrateCalls).toHaveLength(0);
    expect(mockTrackGuestFunnelStep).not.toHaveBeenCalledWith('signup_completed');
  });

  it('migrates guest state after login without counting it as signup completion', async () => {
    localStorage.setItem('guest_token', 'guest-token-login');
    localStorage.setItem('codegrind_guest_progress', JSON.stringify({ demoCompleted: true }));

    api.auth.check.mockResolvedValue({
      authenticated: true,
      authAction: 'login',
      user: { id: 77, username: 'existing-user', isEmailVerified: true, membershipTier: 'FREE' },
    });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockFetchWithError).toHaveBeenCalledWith(
        '/api/guest/migrate',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(mockTrackGuestFunnelStep).not.toHaveBeenCalledWith(
      'signup_completed',
      expect.anything()
    );
  });

  it('sets isAuthenticated=false when api.auth.check returns not authenticated', async () => {
    api.auth.check.mockResolvedValue({ authenticated: false });

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('none');
  });

  it('keeps isAuthenticated=true on network error when userId is in localStorage', async () => {
    localStorage.setItem('user_id', '5');
    api.auth.check.mockRejectedValue(new Error('Network error'));

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
  });

  it('sets isAuthenticated=false on network error when no userId in localStorage', async () => {
    api.auth.check.mockRejectedValue(new Error('Network error'));

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe('AuthProvider — login', () => {
  it('sets user and navigates to /profile on successful login', async () => {
    api.auth.check.mockResolvedValue({ authenticated: false });
    api.auth.login.mockResolvedValue({
      user: { id: 2, username: 'loginuser', isEmailVerified: true, membershipTier: 'FREE' },
    });

    const LoginButton = () => {
      const { login } = useAuth();
      return <button onClick={() => login('loginuser', 'pass')}>Login</button>;
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <LocationConsumer />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('loginuser');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
  });

  it('keeps the compact mobile shell when login succeeds on handheld devices', async () => {
    mockUseIsMobileDevice.mockReturnValue(true);
    api.auth.check.mockResolvedValue({ authenticated: false });
    api.auth.login.mockResolvedValue({
      user: { id: 2, username: 'loginuser', isEmailVerified: true, membershipTier: 'FREE' },
    });

    const LoginButton = () => {
      const { login } = useAuth();
      return <button onClick={() => login('loginuser', 'pass')}>Login</button>;
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <LocationConsumer />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('loginuser');
    });

    expect(screen.getByTestId('location').textContent).toBe('/profile?cgMobileShell=compact');
  });

  it('throws when api.auth.login fails', async () => {
    api.auth.check.mockResolvedValue({ authenticated: false });
    api.auth.login.mockRejectedValue(new Error('Bad credentials'));

    let caughtError = null;
    const LoginButton = () => {
      const { login } = useAuth();
      return (
        <button
          onClick={async () => {
            try {
              await login('user', 'wrong');
            } catch (e) {
              caughtError = e;
            }
          }}
        >
          Login
        </button>
      );
    };

    renderWithRouter(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(api.auth.check).toHaveBeenCalled());

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => expect(caughtError).not.toBeNull());
    expect(caughtError.message).toBe('Bad credentials');
  });
});

describe('AuthProvider — register', () => {
  it('sets user immediately from the register response without a follow-up auth check', async () => {
    api.auth.check.mockResolvedValue({ authenticated: false });
    api.auth.register.mockResolvedValue({
      user: { id: 3, username: 'newuser', isEmailVerified: false, membershipTier: 'FREE' },
      emailSent: true,
      authenticated: false,
      verificationRequired: true,
    });

    const RegisterButton = () => {
      const { register } = useAuth();
      return (
        <button
          onClick={() =>
            register(
              { username: 'newuser', email: 'new@test.com', password: 'StrongPass1!' },
              { recaptchaToken: 'token-123' }
            )
          }
        >
          Register
        </button>
      );
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <RegisterButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'Register' }).click();
    });

    await waitFor(() => {
      expect(api.auth.register).toHaveBeenCalledWith(
        { username: 'newuser', email: 'new@test.com', password: 'StrongPass1!' },
        { recaptchaToken: 'token-123' }
      );
    });

    expect(screen.getByTestId('username').textContent).toBe('none');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe('AuthProvider — logout', () => {
  it('clears user and localStorage on logout', async () => {
    api.auth.check.mockResolvedValue({
      authenticated: true,
      user: { id: 1, username: 'u', isEmailVerified: true, membershipTier: 'FREE' },
    });
    api.auth.logout.mockResolvedValue({});
    localStorage.setItem('user_id', '1');

    const LogoutButton = () => {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('u'));

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(localStorage.getItem('user_id')).toBeNull();
  });

  it('reloads the page when logout succeeds on the homepage', async () => {
    const originalLocation = window.location;
    const reload = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', reload, assign: vi.fn() },
    });

    api.auth.check.mockResolvedValue({
      authenticated: true,
      user: { id: 1, username: 'u', isEmailVerified: true, membershipTier: 'FREE' },
    });
    api.auth.logout.mockResolvedValue({});
    localStorage.setItem('user_id', '1');
    localStorage.setItem('auth_provider', 'local');

    const LogoutButton = () => {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('u'));

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    await waitFor(() => {
      expect(api.auth.logout).toHaveBeenCalledWith('local');
    });
    expect(reload).toHaveBeenCalledOnce();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('runs provider logout in the background without leaving the app shell', async () => {
    const originalLocation = window.location;
    const originalFetch = window.fetch;
    const fetchMock = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();
    const assign = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', reload, assign },
    });

    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    api.auth.check.mockResolvedValue({
      authenticated: true,
      authProvider: 'google',
      user: { id: 1, username: 'u', isEmailVerified: true, membershipTier: 'FREE' },
    });
    api.auth.logout.mockResolvedValue({
      providerLogoutUrl:
        'https://api.example.test/.auth/logout?post_logout_redirect_uri=https%3A%2F%2Fwww.codegrind.online%2F',
    });
    localStorage.setItem('user_id', '1');
    localStorage.setItem('auth_provider', 'google');

    const LogoutButton = () => {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('u'));

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    await waitFor(() => {
      expect(api.auth.logout).toHaveBeenCalledWith('google');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/.auth/logout?post_logout_redirect_uri=https%3A%2F%2Fwww.codegrind.online%2F',
      {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
        keepalive: true,
      }
    );
    expect(assign).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledOnce();
    expect(localStorage.getItem('auth_provider')).toBeNull();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });

    if (originalFetch) {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        value: originalFetch,
      });
    } else {
      delete window.fetch;
    }
  });

  it('clears local auth state when logout fails on the server', async () => {
    api.auth.check.mockResolvedValue({
      authenticated: true,
      user: { id: 1, username: 'u', isEmailVerified: true, membershipTier: 'FREE' },
    });
    api.auth.logout.mockRejectedValue(new Error('logout failed'));
    localStorage.setItem('user_id', '1');
    localStorage.setItem('auth_provider', 'local');

    const LogoutButton = () => {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    };

    renderWithRouter(
      <AuthProvider>
        <TestConsumer />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('u'));

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    expect(screen.getByTestId('username').textContent).toBe('none');
    expect(localStorage.getItem('user_id')).toBeNull();
  });
});
