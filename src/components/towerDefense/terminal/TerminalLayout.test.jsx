import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useTerminalStateMock } = vi.hoisted(() => ({
  useTerminalStateMock: vi.fn(),
}));

vi.mock('./useTerminalState', () => ({
  default: useTerminalStateMock,
}));

vi.mock('./TerminalHeader', () => ({
  default: () => <div data-testid="terminal-header" />,
}));

vi.mock('./TerminalHistory', () => ({
  default: () => <div data-testid="terminal-history" />,
}));

vi.mock('./TerminalInput', () => ({
  default: () => <div data-testid="terminal-input" />,
}));

import TerminalContainer from './TerminalContainer';

vi.mock('../../ads/BottomBannerAd', () => ({
  default: () => <div data-testid="bottom-banner-ad" />,
}));

vi.mock('./TerminalLine', () => ({
  default: ({ content }) => <div>{content}</div>,
}));

const renderWithChakra = (node) => render(<ChakraProvider>{node}</ChakraProvider>);

describe('Terminal mobile layout guards', () => {
  beforeEach(() => {
    useTerminalStateMock.mockReturnValue({
      shouldShowAd: false,
      showCursor: false,
      terminalRef: { current: null },
      terminalContentRef: { current: null },
      terminalContainerRef: { current: null },
      initialHeight: 300,
      handleResizeStart: vi.fn(),
      commandInput: '',
      handleInputChange: vi.fn(),
      handleKeyDown: vi.fn(),
      displayedText: '',
      isSmallScreen: false,
      getTerminalGlitchClass: () => '',
      isLoading: false,
      adSlotId: 'test-slot',
      inputEnabled: true,
      inputPlaceholder: 'Type /tower help',
      inputDisabledReason: 'Commands are locked during active waves.',
    });
  });

  it('keeps the command input dock from shrinking out of view', () => {
    renderWithChakra(<TerminalContainer onCommandSubmit={vi.fn()} />);

    expect(screen.getByTestId('terminal-input').parentElement).toHaveStyle({
      flexShrink: '0',
    });
  });

  it('allows the terminal history region to shrink inside the panel', async () => {
    const { default: TerminalHistory } = await vi.importActual('./TerminalHistory');
    const { container } = renderWithChakra(
      <TerminalHistory
        terminalRef={{ current: null }}
        terminalContentRef={{ current: null }}
        displayedText={'[SYSTEM] Booting...\n[READY] Terminal online.'}
        isSmallScreen={false}
        isLoading={false}
        showCursor={false}
        shouldShowAd={false}
        adSlotId="test-slot"
        terminalGlitchClass=""
      />
    );

    expect(container.querySelector('.terminal-content')).toHaveStyle({
      minHeight: '0px',
    });
  });
});
