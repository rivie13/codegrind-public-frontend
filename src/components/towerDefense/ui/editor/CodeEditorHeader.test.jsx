import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CodeEditorHeader from './CodeEditorHeader';

const renderHeader = (props = {}) =>
  render(
    <ChakraProvider>
      <CodeEditorHeader
        language="python"
        onLanguageChange={vi.fn()}
        codeSubmitted={false}
        codeSubmissionSuccess={null}
        canSubmitSolution={true}
        {...props}
      />
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

  it('renders a stable desktop header layout for two-slot editor chrome', () => {
    renderHeader({
      leftAddon: <div data-testid="left-addon">RIGHT: EDITOR</div>,
      rightAddon: <div data-testid="right-addon">NEURAL SYNTHESIS</div>,
    });

    const topRow = screen.getByTestId('code-editor-header-desktop-top-row');
    const controlRow = screen.getByTestId('code-editor-header-desktop-control-row');

    expect(within(topRow).getByTestId('left-addon')).toBeInTheDocument();
    expect(within(topRow).getByText(/CODE_MATRIX/i)).toBeInTheDocument();
    expect(within(topRow).queryByTestId('right-addon')).not.toBeInTheDocument();
    expect(within(controlRow).getByTestId('right-addon')).toBeInTheDocument();
    expect(within(controlRow).getByRole('combobox')).toHaveValue('python');
    expect(within(controlRow).getByText(/READY_FOR_VERIFY/i)).toBeInTheDocument();
  });

  it('keeps the rate limit chrome while omitting desktop slot labels in portrait mobile mode', () => {
    renderHeader({
      showMobileKeyboardButton: true,
      leftAddon: <div data-testid="left-addon">RIGHT: EDITOR</div>,
      rightAddon: <div data-testid="right-addon">NEURAL SYNTHESIS</div>,
    });

    const primaryControls = screen.getByTestId(
      'code-editor-header-mobile-portrait-primary-controls'
    );
    const secondaryControls = screen.getByTestId(
      'code-editor-header-mobile-portrait-secondary-controls'
    );

    expect(screen.queryByTestId('left-addon')).not.toBeInTheDocument();
    expect(within(primaryControls).getByRole('combobox')).toHaveValue('python');
    expect(within(primaryControls).getByText(/READY_FOR_VERIFY/i)).toBeInTheDocument();
    expect(within(secondaryControls).getByTestId('right-addon')).toBeInTheDocument();
    expect(
      within(secondaryControls).getByRole('button', { name: /hide keyboard/i })
    ).toBeInTheDocument();
  });
});
