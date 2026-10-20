import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CodeEditorHeader from './CodeEditorHeader';

vi.mock('../overlays/RateLimitIndicator', () => ({
  default: () => <div>AI rate limit</div>,
}));

const renderHeader = (props = {}) =>
  render(
    <ChakraProvider>
      <CodeEditorHeader {...props} />
    </ChakraProvider>
  );

describe('CodeEditorHeader mobile keyboard control', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows a labeled hide keyboard button in mobile portrait mode', () => {
    renderHeader({ showMobileKeyboardButton: true });

    expect(screen.getByRole('button', { name: /hide keyboard/i })).toBeInTheDocument();
    expect(screen.getByTestId('code-editor-header-mobile-portrait-top-row')).toBeInTheDocument();
    expect(
      screen.getByTestId('code-editor-header-mobile-portrait-control-row')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('code-editor-header-mobile-portrait-primary-controls')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('code-editor-header-mobile-portrait-secondary-controls')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('code-editor-header-desktop-control-row')).not.toBeInTheDocument();
  });

  it('shows a labeled hide keyboard button in compact mobile landscape mode', () => {
    renderHeader({ showMobileKeyboardButton: true, compactMobileLandscape: true });

    expect(screen.getByRole('button', { name: /hide keyboard/i })).toBeInTheDocument();
  });

  it('blurs the active element before the button can steal focus', () => {
    const input = document.createElement('input');
    const blurSpy = vi.spyOn(input, 'blur');
    document.body.appendChild(input);
    input.focus();

    renderHeader({ showMobileKeyboardButton: true });

    fireEvent.mouseDown(screen.getByRole('button', { name: /hide keyboard/i }));

    expect(blurSpy).toHaveBeenCalled();
  });

  it('renders a stable desktop header layout for fixed editor chrome', () => {
    renderHeader({
      rightAddon: <div data-testid="right-addon">NEURAL SYNTHESIS</div>,
    });

    const topRow = screen.getByTestId('code-editor-header-desktop-top-row');
    const controlRow = screen.getByTestId('code-editor-header-desktop-control-row');

    expect(within(topRow).getByText(/CODE_MATRIX/i)).toBeInTheDocument();
    expect(within(topRow).queryByTestId('right-addon')).not.toBeInTheDocument();
    expect(within(controlRow).getByTestId('right-addon')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(controlRow).getByText(/AI rate limit/i)).toBeInTheDocument();
  });

  it('keeps the rate limit chrome while omitting desktop slot labels in portrait mobile mode', () => {
    renderHeader({
      showMobileKeyboardButton: true,
      rightAddon: <div data-testid="right-addon">NEURAL SYNTHESIS</div>,
    });

    const primaryControls = screen.getByTestId(
      'code-editor-header-mobile-portrait-primary-controls'
    );
    const secondaryControls = screen.getByTestId(
      'code-editor-header-mobile-portrait-secondary-controls'
    );

    expect(screen.getByText(/CODE_MATRIX/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(primaryControls).getByText(/AI rate limit/i)).toBeInTheDocument();
    expect(within(secondaryControls).getByTestId('right-addon')).toBeInTheDocument();
    expect(
      within(secondaryControls).getByRole('button', { name: /hide keyboard/i })
    ).toBeInTheDocument();
  });
});
