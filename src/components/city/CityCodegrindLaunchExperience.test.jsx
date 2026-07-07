import { ChakraProvider } from '@chakra-ui/react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CityCodegrindLaunchExperience from './CityCodegrindLaunchExperience';
import {
  resolveLaunchNavigationInstruction,
  resolveSameOriginNavigationTarget,
} from './cityCodegrindLaunchNavigation';

const mockNavigate = vi.fn();
const mockWritePendingAppLaunch = vi.fn();
const mockSetHomeDemoShellHidden = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./RetroDesktopBootScreen', () => ({
  default: () => <div data-testid="retro-desktop-boot-screen" />,
}));

vi.mock('../../utils/navigation/pendingAppLaunch', () => ({
  writePendingAppLaunch: (...args) => mockWritePendingAppLaunch(...args),
}));

vi.mock('../../utils/ui/homeDemoShellVisibility', () => ({
  setHomeDemoShellHidden: (...args) => mockSetHomeDemoShellHidden(...args),
}));

describe('resolveSameOriginNavigationTarget', () => {
  it('returns a router-friendly path for same-origin targets', () => {
    expect(resolveSameOriginNavigationTarget('/city?entry=intro#window')).toBe(
      '/city?entry=intro#window'
    );
  });

  it('rejects cross-origin targets', () => {
    expect(resolveSameOriginNavigationTarget('https://example.com/city')).toBeNull();
  });
});

describe('resolveLaunchNavigationInstruction', () => {
  it('keeps normal same-origin handoffs on the router path', () => {
    expect(
      resolveLaunchNavigationInstruction({
        sameOriginTargetPath: '/city',
        targetLaunchRequest: null,
        targetPath: '/city',
      })
    ).toEqual({ mode: 'spa', target: '/city' });
  });

  it('keeps home demo launches on the router path when the target stays same-origin', () => {
    expect(
      resolveLaunchNavigationInstruction({
        sameOriginTargetPath: '/',
        targetLaunchRequest: { shellTheme: 'retro-desktop', type: 'home-demo' },
        targetPath: '/',
      })
    ).toEqual({ mode: 'spa', target: '/' });
  });
});

describe('CityCodegrindLaunchExperience', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('navigates through react-router for same-origin page handoffs', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <ChakraProvider>
          <CityCodegrindLaunchExperience targetPath="/city" />
        </ChakraProvider>
      </MemoryRouter>
    );

    vi.advanceTimersByTime(1040);

    expect(mockNavigate).toHaveBeenCalledWith('/city');
  });

  it('persists the pending launch metadata before a home demo SPA handoff', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <ChakraProvider>
          <CityCodegrindLaunchExperience
            targetPath="/"
            targetLaunchRequest={{ shellTheme: 'retro-desktop', type: 'home-demo' }}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    vi.advanceTimersByTime(1040);

    expect(mockSetHomeDemoShellHidden).toHaveBeenCalledWith(true);
    expect(mockWritePendingAppLaunch).toHaveBeenCalledWith({
      shellTheme: 'retro-desktop',
      type: 'home-demo',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('keeps phone handoffs in the compact mobile shell on same-origin routes', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <ChakraProvider>
          <CityCodegrindLaunchExperience
            targetPath="/profile"
            targetLaunchRequest={{ deviceClass: 'phone', source: 'city-phone-shell' }}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    vi.advanceTimersByTime(1040);

    expect(mockNavigate).toHaveBeenCalledWith('/profile?cgMobileShell=compact');
  });
});
