import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CityPhaserPreviewMobileControls from './CityPhaserPreviewMobileControls';

describe('CityPhaserPreviewMobileControls', () => {
  it('swaps the movement and action clusters when the d-pad side changes', () => {
    const { rerender } = render(
      <ChakraProvider>
        <CityPhaserPreviewMobileControls controlSide="right" />
      </ChakraProvider>
    );

    expect(document.querySelector('[data-city-preview-mobile-controls="true"]')).toHaveAttribute(
      'data-city-preview-control-side',
      'right'
    );
    expect(document.querySelector('[data-city-preview-control-cluster="movement"]')).toHaveStyle({
      right: '14px',
    });
    expect(document.querySelector('[data-city-preview-control-cluster="actions"]')).toHaveStyle({
      left: '14px',
    });

    rerender(
      <ChakraProvider>
        <CityPhaserPreviewMobileControls controlSide="left" />
      </ChakraProvider>
    );

    expect(document.querySelector('[data-city-preview-control-cluster="movement"]')).toHaveStyle({
      left: '14px',
    });
    expect(document.querySelector('[data-city-preview-control-cluster="actions"]')).toHaveStyle({
      right: '14px',
    });
  });

  it('forwards touch interactions through the retro mobile controls', () => {
    const onDirectionStart = vi.fn();
    const onDirectionEnd = vi.fn();
    const onInteract = vi.fn();
    const onOpenPhone = vi.fn();

    render(
      <ChakraProvider>
        <CityPhaserPreviewMobileControls
          controlSide="right"
          onDirectionEnd={onDirectionEnd}
          onDirectionStart={onDirectionStart}
          onInteract={onInteract}
          onOpenPhone={onOpenPhone}
        />
      </ChakraProvider>
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Lt' }));
    expect(onDirectionStart).toHaveBeenCalledWith('arrowleft');

    fireEvent.pointerUp(screen.getByRole('button', { name: 'Lt' }));
    expect(onDirectionEnd).toHaveBeenCalledWith('arrowleft');

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Phone' }));
    expect(onOpenPhone).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Interact' }));
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it('shows contextual interaction guidance when a nearby action needs the interact button', () => {
    render(
      <ChakraProvider>
        <CityPhaserPreviewMobileControls interactionNotification="Tap Interact to look out the window." />
      </ChakraProvider>
    );

    expect(screen.getByText(/Tap Interact to look out the window\./i)).toBeInTheDocument();
  });
});
