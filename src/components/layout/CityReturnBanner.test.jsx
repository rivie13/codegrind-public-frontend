import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CityReturnBanner from './CityReturnBanner';
import { useAuth } from '../../contexts/AuthContext';
import useCityStoryState from '../../hooks/city/useCityStoryState';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import {
  CITY_RETURN_STATE_STORAGE_KEY,
  readCityReturnState,
} from '../../utils/navigation/cityNavigation';

const restoreFullscreenFromIntentMock = vi.hoisted(() => vi.fn().mockResolvedValue(false));

vi.mock('../../hooks/useIsMobileDevice', () => ({
  default: vi.fn(() => false),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: false })),
}));

vi.mock('../../hooks/city/useCityStoryState', () => ({
  default: vi.fn(() => ({
    isLoading: false,
    saveReturnState: vi.fn().mockResolvedValue(null),
    storyState: null,
  })),
}));

vi.mock('../../utils/mobile/fullscreenState', () => ({
  restoreFullscreenFromIntent: restoreFullscreenFromIntentMock,
}));

const mockedUseIsMobileDevice = vi.mocked(useIsMobileDevice);
const mockedUseAuth = vi.mocked(useAuth);
const mockedUseCityStoryState = vi.mocked(useCityStoryState);

const renderBanner = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ChakraProvider>
        <CityReturnBanner />
      </ChakraProvider>
    </MemoryRouter>
  );

afterEach(() => {
  window.localStorage.clear();
  restoreFullscreenFromIntentMock.mockClear();
  mockedUseIsMobileDevice.mockReturnValue(false);
  mockedUseAuth.mockReturnValue({ isAuthenticated: false });
  mockedUseCityStoryState.mockReturnValue({
    isLoading: false,
    saveReturnState: vi.fn().mockResolvedValue(null),
    storyState: null,
  });
});

describe('CityReturnBanner', () => {
  it('stores the active city route without rendering the return button', async () => {
    renderBanner('/city?scene=docks-street-01');

    expect(screen.queryByRole('link', { name: /back to city/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(readCityReturnState()).toEqual({
        pathname: '/city',
        search: '?scene=docks-street-01',
      });
    });
  });

  it('renders a return button on supported non-city hub pages', () => {
    window.localStorage.setItem(
      CITY_RETURN_STATE_STORAGE_KEY,
      JSON.stringify({ pathname: '/city', search: '?scene=learning-module-guide-01' })
    );

    renderBanner('/games');

    expect(screen.getByRole('button', { name: /back to city/i })).toBeInTheDocument();
    expect(screen.getByText(/^city mode$/i)).toBeInTheDocument();
  });

  it('renders an enter city button on supported hub pages when no return state exists', () => {
    renderBanner('/learning');

    expect(screen.getByRole('button', { name: /enter city/i })).toBeInTheDocument();
    expect(screen.getByText(/^city mode$/i)).toBeInTheDocument();
  });

  it('falls back to the authenticated story-state return target when local storage is empty', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    mockedUseCityStoryState.mockReturnValue({
      isLoading: false,
      saveReturnState: vi.fn().mockResolvedValue(null),
      storyState: {
        cityReturnState: { pathname: '/city', search: '?scene=cluster-map-office-01' },
      },
    });

    renderBanner('/profile');

    expect(screen.getByRole('button', { name: /back to city/i })).toBeInTheDocument();
  });

  it('keeps the floating pill variant on mobile devices', () => {
    mockedUseIsMobileDevice.mockReturnValue(true);

    window.localStorage.setItem(
      CITY_RETURN_STATE_STORAGE_KEY,
      JSON.stringify({ pathname: '/city', search: '?scene=learning-module-guide-01' })
    );

    renderBanner('/games/clusters');

    expect(screen.getByTestId('city-return-banner')).toHaveAttribute(
      'data-city-return-variant',
      'floating-pill'
    );
    expect(screen.getByRole('button', { name: /back to city/i })).toBeInTheDocument();
    expect(screen.queryByText(/^city mode$/i)).not.toBeInTheDocument();
  });

  it('navigates back to the stored city route when clicked', async () => {
    window.localStorage.setItem(
      CITY_RETURN_STATE_STORAGE_KEY,
      JSON.stringify({ pathname: '/city', search: '?scene=learning-module-guide-01' })
    );

    render(
      <MemoryRouter initialEntries={['/games']}>
        <ChakraProvider>
          <Routes>
            <Route path="/games" element={<CityReturnBanner />} />
            <Route path="/city" element={<div>City Route Loaded</div>} />
          </Routes>
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /back to city/i }));

    expect(restoreFullscreenFromIntentMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('City Route Loaded')).toBeInTheDocument();
    });
  });

  it('navigates to the base city route when clicked without stored return state', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ChakraProvider>
          <Routes>
            <Route path="/profile" element={<CityReturnBanner />} />
            <Route path="/city" element={<div>City Route Loaded</div>} />
          </Routes>
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /enter city/i }));

    expect(restoreFullscreenFromIntentMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('City Route Loaded')).toBeInTheDocument();
    });
  });

  it('stays hidden on unrelated pages even when a city return target exists', () => {
    window.localStorage.setItem(
      CITY_RETURN_STATE_STORAGE_KEY,
      JSON.stringify({ pathname: '/city', search: '?scene=apartment-room-01' })
    );

    renderBanner('/about');

    expect(screen.queryByRole('link', { name: /back to city/i })).not.toBeInTheDocument();
  });

  it('persists the active city route to the server-backed story state for authenticated users', async () => {
    const saveReturnState = vi.fn().mockResolvedValue(null);
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    mockedUseCityStoryState.mockReturnValue({
      isLoading: false,
      saveReturnState,
      storyState: null,
    });

    renderBanner('/city?scene=packet-bazaar-01');

    await waitFor(() => {
      expect(saveReturnState).toHaveBeenCalledWith({
        pathname: '/city',
        search: '?scene=packet-bazaar-01',
      });
    });
  });
});
