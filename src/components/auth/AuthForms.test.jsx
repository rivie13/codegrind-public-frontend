import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockToast = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());
const mockRegister = vi.hoisted(() => vi.fn());
const mockStartOAuth = vi.hoisted(() => vi.fn());
const mockExecuteRecaptchaAction = vi.hoisted(() => vi.fn());
const mockPrepareRecaptcha = vi.hoisted(() => vi.fn());
const mockIsRecaptchaConfigured = vi.hoisted(() => vi.fn());
const mockUseIsMobileDevice = vi.hoisted(() => vi.fn(() => false));

vi.mock('@chakra-ui/icons', () => ({
  CloseIcon: () => <span data-testid="close-icon" />,
}));

vi.mock('@chakra-ui/react', () => ({
  Box: ({ children }) => <div>{children}</div>,
  Button: ({ children, isDisabled, isLoading, loadingText, ...props }) => (
    <button disabled={Boolean(isDisabled || isLoading)} aria-busy={Boolean(isLoading)} {...props}>
      {isLoading ? loadingText || children : children}
    </button>
  ),
  Flex: ({ children }) => <div>{children}</div>,
  FormControl: ({ children }) => <div>{children}</div>,
  FormLabel: ({ children, htmlFor }) => <label htmlFor={htmlFor}>{children}</label>,
  Heading: ({ children }) => <h2>{children}</h2>,
  Input: (props) => <input {...props} />,
  List: ({ children }) => <ul>{children}</ul>,
  ListIcon: () => <span data-testid="list-icon" />,
  ListItem: ({ children }) => <li>{children}</li>,
  Stack: ({ children }) => <div>{children}</div>,
  Text: ({ children }) => <p>{children}</p>,
  useToast: () => mockToast,
}));

vi.mock('react-icons/fa', () => ({
  FaDiscord: () => <span data-testid="discord-icon" />,
  FaGoogle: () => <span data-testid="google-icon" />,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    user: null,
  }),
}));

vi.mock('../../hooks/useIsMobileDevice', () => ({
  default: () => mockUseIsMobileDevice(),
}));

vi.mock('../../services/api', () => ({
  api: {
    auth: {
      startOAuth: mockStartOAuth,
      resendVerificationEmail: vi.fn(),
    },
  },
}));

import { api } from '../../services/api';

vi.mock('../../services/recaptchaService', () => ({
  executeRecaptchaAction: mockExecuteRecaptchaAction,
  isRecaptchaConfigured: mockIsRecaptchaConfigured,
  prepareRecaptcha: mockPrepareRecaptcha,
}));

import AuthForms from './AuthForms';

const getInputForLabel = (labelText) => {
  const label = screen.getByText(labelText);
  return label.closest('div')?.querySelector('input');
};

const renderAuthForms = (props = {}) =>
  render(
    <MemoryRouter>
      <AuthForms {...props} />
    </MemoryRouter>
  );

const createDeferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

describe('AuthForms', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseIsMobileDevice.mockReturnValue(false);
    mockIsRecaptchaConfigured.mockReturnValue(true);
    mockPrepareRecaptcha.mockResolvedValue(null);
    mockExecuteRecaptchaAction.mockResolvedValue('recaptcha-token');
    mockLogin.mockResolvedValue({ user: { id: 1 }, recaptcha: { reviewRecommended: false } });
    mockRegister.mockResolvedValue({ emailSent: true, recaptcha: { reviewRecommended: false } });
    mockStartOAuth.mockResolvedValue({ url: 'https://oauth.example.test' });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'http://localhost/' },
    });
  });

  it('submits login with a reCAPTCHA token through the shared auth context', async () => {
    renderAuthForms();

    fireEvent.change(getInputForLabel('EMAIL OR USERNAME'), {
      target: { value: 'riven' },
    });
    fireEvent.change(getInputForLabel('PASSWORD'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/ }));

    await waitFor(() => {
      expect(mockExecuteRecaptchaAction).toHaveBeenCalledWith('login_password');
    });
    expect(mockLogin).toHaveBeenCalledWith('riven', 'secret', {
      recaptchaToken: 'recaptcha-token',
    });
  });

  it('shows a loading state on the login submit button while authentication is pending', async () => {
    const deferredLogin = createDeferred();
    mockLogin.mockReturnValue(deferredLogin.promise);

    renderAuthForms();

    fireEvent.change(getInputForLabel('EMAIL OR USERNAME'), {
      target: { value: 'riven' },
    });
    fireEvent.change(getInputForLabel('PASSWORD'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'LOGGING IN...' })).toBeDisabled();
    });

    deferredLogin.resolve({ user: { id: 1 }, recaptcha: { reviewRecommended: false } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^LOGIN$/ })).toBeInTheDocument();
    });
  });

  it('does not consume a reCAPTCHA token when registration fails client validation', async () => {
    renderAuthForms({ defaultIsLogin: false });

    fireEvent.change(getInputForLabel('USERNAME'), {
      target: { value: 'ab' },
    });
    fireEvent.change(getInputForLabel('EMAIL'), {
      target: { value: 'new@test.com' },
    });
    fireEvent.change(getInputForLabel('PASSWORD'), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.change(getInputForLabel('CONFIRM PASSWORD'), {
      target: { value: 'StrongPass1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^REGISTER$/ }));

    expect(mockExecuteRecaptchaAction).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Invalid Username',
      })
    );
  });

  it('shows a loading state on the register submit button while registration is pending', async () => {
    const deferredRegister = createDeferred();
    mockRegister.mockReturnValue(deferredRegister.promise);

    renderAuthForms({ defaultIsLogin: false });

    fireEvent.change(getInputForLabel('USERNAME'), {
      target: { value: 'new_user' },
    });
    fireEvent.change(getInputForLabel('EMAIL'), {
      target: { value: 'new@test.com' },
    });
    fireEvent.change(getInputForLabel('PASSWORD'), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.change(getInputForLabel('CONFIRM PASSWORD'), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^REGISTER$/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'REGISTERING...' })).toBeDisabled();
    });

    deferredRegister.resolve({ emailSent: true, recaptcha: { reviewRecommended: false } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'RETURN TO LOGIN' })).toBeInTheDocument();
    });
  });

  it('resends verification by email from the signed-out registration success state', async () => {
    api.auth.resendVerificationEmail.mockResolvedValue({ ok: true });

    renderAuthForms({ defaultIsLogin: false });

    fireEvent.change(getInputForLabel('USERNAME'), {
      target: { value: 'new_user' },
    });
    fireEvent.change(getInputForLabel('EMAIL'), {
      target: { value: 'new@test.com' },
    });
    fireEvent.change(getInputForLabel('PASSWORD'), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.change(getInputForLabel('CONFIRM PASSWORD'), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^REGISTER$/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'RESEND VERIFICATION EMAIL' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'RESEND VERIFICATION EMAIL' }));

    await waitFor(() => {
      expect(api.auth.resendVerificationEmail).toHaveBeenCalledWith('new@test.com');
    });
  });

  it('starts Google OAuth with the signup action token from the shared form', async () => {
    renderAuthForms({ defaultIsLogin: false });

    fireEvent.click(screen.getByRole('button', { name: /SIGN UP WITH GOOGLE/i }));

    await waitFor(() => {
      expect(mockExecuteRecaptchaAction).toHaveBeenCalledWith('signup_google');
    });
    expect(mockStartOAuth).toHaveBeenCalledWith('google', 'register', {
      recaptchaToken: 'recaptcha-token',
    });
    expect(window.location.href).toBe('https://oauth.example.test');
  });

  it('shows a loading state on the Google OAuth button while the redirect handoff is pending', async () => {
    const deferredOAuth = createDeferred();
    mockStartOAuth.mockReturnValue(deferredOAuth.promise);

    renderAuthForms();

    fireEvent.click(screen.getByRole('button', { name: /SIGN IN WITH GOOGLE/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CONNECTING TO GOOGLE...' })).toBeDisabled();
    });

    deferredOAuth.resolve({ url: 'https://oauth.example.test' });

    await waitFor(() => {
      expect(mockStartOAuth).toHaveBeenCalledWith('google', 'login', {
        recaptchaToken: 'recaptcha-token',
      });
    });
  });

  it('passes the compact mobile shell hint into OAuth start on mobile', async () => {
    mockUseIsMobileDevice.mockReturnValue(true);

    renderAuthForms();

    fireEvent.click(screen.getByRole('button', { name: /SIGN IN WITH GOOGLE/i }));

    await waitFor(() => {
      expect(mockStartOAuth).toHaveBeenCalledWith('google', 'login', {
        recaptchaToken: 'recaptcha-token',
        compactMobileShell: true,
      });
    });
  });

  it('does not start OAuth when reCAPTCHA cannot produce a token', async () => {
    mockExecuteRecaptchaAction.mockResolvedValue(null);

    renderAuthForms();

    fireEvent.click(screen.getByRole('button', { name: /SIGN IN WITH GOOGLE/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: expect.stringContaining('reCAPTCHA could not verify this request'),
        })
      );
    });
    expect(mockStartOAuth).not.toHaveBeenCalled();
  });

  it('shows the reCAPTCHA disclosure when protection is enabled', () => {
    renderAuthForms();

    expect(screen.getByText(/This form is protected by reCAPTCHA Enterprise/i)).toBeInTheDocument();
  });
});
