import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FirefoxWall from './FirefoxWall';

const originalUserAgent = window.navigator.userAgent;
const originalLocation = window.location;

const mockUserAgent = (ua) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: ua,
  });
};

const mockLocationQuery = (searchQuery) => {
  delete window.location;
  window.location = {
    ...originalLocation,
    search: searchQuery,
    reload: vi.fn(),
  };
};

describe('FirefoxWall', () => {
  beforeEach(() => {
    mockUserAgent(originalUserAgent);
    // Reset location mock to original
    delete window.location;
    window.location = originalLocation;
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
    delete window.location;
    window.location = originalLocation;
  });

  it('renders nothing for Chrome user agent', () => {
    mockUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    render(
      <ChakraProvider>
        <FirefoxWall />
      </ChakraProvider>
    );
    expect(screen.queryByText('SYSTEM_ERROR_WARNING.EXE')).not.toBeInTheDocument();
  });

  it('renders nothing for Safari user agent', () => {
    mockUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    );
    render(
      <ChakraProvider>
        <FirefoxWall />
      </ChakraProvider>
    );
    expect(screen.queryByText('SYSTEM_ERROR_WARNING.EXE')).not.toBeInTheDocument();
  });

  it('renders warning screen for Firefox user agent', () => {
    mockUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    );
    render(
      <ChakraProvider>
        <FirefoxWall />
      </ChakraProvider>
    );

    // Verify warning header & content
    expect(screen.getByText('SYSTEM_ERROR_WARNING.EXE')).toBeInTheDocument();
    expect(screen.getByText('BOM: BROWSER_NOT_SUPPORTED')).toBeInTheDocument();
    expect(screen.getByText(/Firefox is not supported on this platform/)).toBeInTheDocument();
    expect(screen.getByText('Google Chrome (Recommended)')).toBeInTheDocument();

    // Verify "OK" button is present and disabled, and "Cancel" button is disabled
    const okBtn = screen.getByRole('button', { name: 'OK' });
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(okBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  it('renders nothing for Firefox if bypass query parameter is present', () => {
    mockUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    );
    mockLocationQuery('?bypass_firefox_gate=true');

    render(
      <ChakraProvider>
        <FirefoxWall />
      </ChakraProvider>
    );
    expect(screen.queryByText('SYSTEM_ERROR_WARNING.EXE')).not.toBeInTheDocument();
  });
});
