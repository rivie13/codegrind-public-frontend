import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DesktopShellRenderer from './DesktopShellRenderer';

vi.mock('re-resizable', () => ({
  Resizable: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

const buildSnapshot = () => ({
  browser: {
    popups: [],
  },
  desktopAds: [],
  desktopIcons: [],
  footerHint: 'Return to the room when you are done with this shell.',
  launchNote: 'Apartment hub is online.',
  notifications: [],
  openWindows: {
    browser: false,
    credits: false,
    terminal: false,
  },
  shellFamilyId: 'desktop',
  shellId: 'apartment-hub-desktop',
  startMenuActions: [
    {
      id: 'return-to-site',
      label: 'Back to site',
      sprite: 'browser',
    },
  ],
  startMenuDescription:
    'Exit the shell and return to the apartment, or jump back to the main CodeGrind site.',
  startMenuTitle: 'Safehouse controls',
  subtitle: 'Apartment Hub Shell // Safehouse controls online',
  terminal: {
    awaitingConfirmation: false,
    logs: [],
    progress: 0,
    status: 'idle',
    typedCommand: '',
  },
  title: 'Safehouse Desktop',
  wallpaper: {
    accent: '#000080',
    gradient: 'linear-gradient(180deg, #506b78 0%, #394e5c 55%, #243340 100%)',
    label: 'Safehouse Hub CRT',
  },
});

describe('DesktopShellRenderer start menu actions', () => {
  it('renders and triggers the optional back-to-site action', () => {
    const onStartMenuAction = vi.fn();

    render(
      <ChakraProvider>
        <DesktopShellRenderer
          snapshot={buildSnapshot()}
          onClose={vi.fn()}
          onCloseBrowserWindow={vi.fn()}
          onCloseCreditsWindow={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onDismissBrowserPopup={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onIconActivate={vi.fn()}
          onStartMenuAction={onStartMenuAction}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to site/i }));

    expect(onStartMenuAction).toHaveBeenCalledWith('return-to-site');
  });
});
