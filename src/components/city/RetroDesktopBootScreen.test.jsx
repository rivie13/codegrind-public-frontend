import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RetroDesktopBootScreen from './RetroDesktopBootScreen';

describe('RetroDesktopBootScreen', () => {
  it('renders without leaking vendor scroll props to the DOM', () => {
    render(
      <ChakraProvider>
        <RetroDesktopBootScreen title="Loading Apartment Safehouse..." windowTitle="city.exe" />
      </ChakraProvider>
    );

    const bootScreen = screen.getByTestId('retro-desktop-boot-screen');

    expect(bootScreen).not.toHaveAttribute('WebkitOverflowScrolling');
    expect(bootScreen).not.toHaveAttribute('webkitoverflowscrolling');
    expect(screen.getByText('Loading Apartment Safehouse...')).toBeInTheDocument();
    expect(document.querySelector('[data-boot-window]')).not.toBeNull();
  });
});
