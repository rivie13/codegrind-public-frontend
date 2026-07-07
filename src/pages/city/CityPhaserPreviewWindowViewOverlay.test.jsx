import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CityPhaserPreviewWindowViewOverlay from './CityPhaserPreviewWindowViewOverlay';

describe('CityPhaserPreviewWindowViewOverlay', () => {
  it('renders the back-to-room button and closes the overlay on click', () => {
    const onClose = vi.fn();

    render(
      <ChakraProvider>
        <CityPhaserPreviewWindowViewOverlay onClose={onClose} />
      </ChakraProvider>
    );

    expect(screen.getByText(/Port Meridian at dusk/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Back to Room/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
