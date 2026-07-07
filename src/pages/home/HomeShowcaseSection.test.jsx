import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import HomeShowcaseSection from './HomeShowcaseSection';

// JSDOM does not provide IntersectionObserver; polyfill with a stub so
// LazyGifImage's useEffect hook does not throw during render.
beforeAll(() => {
  class MockIntersectionObserver {
    constructor() {
      this.observe = vi.fn();
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
    }
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

const mockNavigate = vi.hoisted(() => vi.fn());
const restoreFullscreenFromIntentMock = vi.hoisted(() => vi.fn().mockResolvedValue(false));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../utils/mobile/fullscreenState', () => ({
  restoreFullscreenFromIntent: restoreFullscreenFromIntentMock,
}));

describe('HomeShowcaseSection', () => {
  it('renders the updated showcase copy and routes the bottom CTA into the apartment intro demo', async () => {
    render(
      <ChakraProvider>
        <MemoryRouter>
          <HomeShowcaseSection />
        </MemoryRouter>
      </ChakraProvider>
    );

    expect(
      screen.getByText(
        /solve real coding problems by defending your solution as you build it through the waves/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all site content is free, including ai-generated problems/i)
    ).toBeInTheDocument();

    const beginDemoLink = screen.getByRole('link', { name: /begin demo/i });
    expect(beginDemoLink).toHaveAttribute(
      'href',
      '/city?scene=apartment-room-01&entry=path-choice&apartmentState=intro'
    );

    fireEvent.click(beginDemoLink);

    await waitFor(() => {
      expect(restoreFullscreenFromIntentMock).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/city?scene=apartment-room-01&entry=path-choice&apartmentState=intro'
      );
    });
  });
});
