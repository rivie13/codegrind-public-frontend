import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn();
const mockResendVerificationEmail = vi.hoisted(() => vi.fn());

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../services/api', () => ({
  api: {
    auth: { resendVerificationEmail: mockResendVerificationEmail },
  },
}));

// Minimal Chakra stubs — no provider needed
vi.mock('@chakra-ui/react', () => ({
  Box: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Center: ({ children }) => <div>{children}</div>,
  Heading: ({ children }) => <h2>{children}</h2>,
  Text: ({ children }) => <p>{children}</p>,
  VStack: ({ children }) => <div>{children}</div>,
  useToast: () => vi.fn(),
}));

import ProtectedRoute from './ProtectedRoute';

// Render inside a router with an Outlet target
const renderProtectedRoute = (path = '/protected') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path={path} element={<div data-testid="outlet-content">Protected Content</div>} />
        </Route>
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  it('renders nothing while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    const { container } = renderProtectedRoute();

    // null return — no content rendered
    expect(container.firstChild).toBeFalsy();
  });

  it('redirects unauthenticated users from a protected path to home', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/games/tower-defense/two-sum']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/games/tower-defense/two-sum"
              element={<div data-testid="protected-content">Game</div>}
            />
          </Route>
          <Route path="/" element={<div data-testid="home">Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeTruthy();
    });
  });

  it('shows email verification UI when user.isEmailVerified is false', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'u', email: 'u@example.com', isEmailVerified: false },
      loading: false,
    });

    renderProtectedRoute();

    expect(screen.getByText('Email Verification Required')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeTruthy();
    expect(screen.getByText(/u@example.com/i)).toBeTruthy();
  });

  it('shows the resend target email after a verification resend succeeds', async () => {
    mockResendVerificationEmail.mockResolvedValue({ message: 'Verification email resent' });
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'u', email: 'u@example.com', isEmailVerified: false },
      loading: false,
    });

    renderProtectedRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));

    await waitFor(() => {
      expect(screen.getByText('Verification email sent to u@example.com')).toBeTruthy();
    });
  });

  it('renders outlet when user is authenticated with verified email', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'u', isEmailVerified: true },
      loading: false,
    });

    renderProtectedRoute();

    expect(screen.getByTestId('outlet-content')).toBeTruthy();
  });

  it('redirects to / when user is null and toast has fired', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderProtectedRoute();

    // After the useEffect fires and setShouldRedirect(true), Navigate renders
    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeTruthy();
    });
  });
});
