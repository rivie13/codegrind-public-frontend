import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecuteRecaptchaAction = vi.hoisted(() => vi.fn());
const mockFetchWithError = vi.hoisted(() => vi.fn());

vi.mock('../../services/recaptchaService', () => ({
  executeRecaptchaAction: mockExecuteRecaptchaAction,
  isRecaptchaConfigured: () => true,
}));

vi.mock('../../services/api/fetcher', () => ({
  fetchWithError: mockFetchWithError,
}));

import DemoTypeSelectModal from './DemoTypeSelectModal';

describe('DemoTypeSelectModal viewport logic', () => {
  const originalUserAgent = navigator.userAgent;
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  const originalInnerWidth = window.innerWidth;

  const setViewport = (userAgent, maxTouchPoints, innerWidth) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: userAgent,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: maxTouchPoints,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: innerWidth,
      writable: true,
      configurable: true,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setViewport('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0, 1280);
  });

  afterEach(() => {
    setViewport(originalUserAgent, originalMaxTouchPoints, originalInnerWidth);
  });

  it('renders experience chooser options without showing mobile advisory on desktop', () => {
    render(
      <ChakraProvider>
        <DemoTypeSelectModal
          isOpen
          onClose={vi.fn()}
          onSelectQuickDemo={vi.fn()}
          onSelectFullExperience={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/Select Your Experience/i)).toBeInTheDocument();
    expect(screen.queryByText(/MOBILE ADVISORY/i)).not.toBeInTheDocument();
  });

  it('renders the mobile advisory warning and desktop handoff email form on mobile viewports', () => {
    setViewport('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 5, 375);

    render(
      <ChakraProvider>
        <DemoTypeSelectModal
          isOpen
          onClose={vi.fn()}
          onSelectQuickDemo={vi.fn()}
          onSelectFullExperience={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/MOBILE ADVISORY/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Link/i })).toBeInTheDocument();
  });

  it('submits email and gets reCAPTCHA token, hitting the backend route on form submit', async () => {
    setViewport('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 5, 375);

    mockExecuteRecaptchaAction.mockResolvedValue('test-recaptcha-token');
    mockFetchWithError.mockResolvedValue({ success: true });

    render(
      <ChakraProvider>
        <DemoTypeSelectModal
          isOpen
          onClose={vi.fn()}
          onSelectQuickDemo={vi.fn()}
          onSelectFullExperience={vi.fn()}
        />
      </ChakraProvider>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your email address.../i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const sendButton = screen.getByRole('button', { name: /Send Link/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockExecuteRecaptchaAction).toHaveBeenCalledWith('mobile_handoff');
      expect(mockFetchWithError).toHaveBeenCalledWith(
        '/api/email/mobile-handoff',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
            recaptchaToken: 'test-recaptcha-token',
          }),
          skipGuestToken: true,
        })
      );
    });

    expect(screen.getByText(/Connection link dispatched/i)).toBeInTheDocument();
  });
});
