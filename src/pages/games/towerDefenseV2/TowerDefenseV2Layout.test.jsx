import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { buildResponsiveProfileMock } = vi.hoisted(() => ({
  buildResponsiveProfileMock: vi.fn(() => ({
    isHandheldDevice: false,
    isHandheldSinglePanelLayout: false,
    isHandheldCompactLandscape: false,
  })),
}));

vi.mock('../../../components/feedback/BugReportButton', () => ({
  default: () => <button>Report Bug</button>,
}));

vi.mock('../../../utils/web/responsiveProfile', () => ({
  buildResponsiveProfile: buildResponsiveProfileMock,
}));

import TowerDefenseV2Layout from './TowerDefenseV2Layout';

describe('TowerDefenseV2Layout collapsibles', () => {
  it('bounds open panels with internal scroll and a vertical resize handle', () => {
    render(
      <ChakraProvider>
        <TowerDefenseV2Layout
          gameContent={<div>Game</div>}
          editorContent={<div>Editor</div>}
          problemContent={<div>Problem</div>}
          chatContent={<div>Chat</div>}
          problemOpen
          chatOpen={false}
          onProblemOpenChange={vi.fn()}
          onChatOpenChange={vi.fn()}
        />
      </ChakraProvider>
    );

    const handle = document.querySelector('[data-collapsible-resize-handle="problem"]');
    expect(handle).not.toBeNull();

    const body = handle.previousElementSibling;
    expect(body).toHaveStyle({ height: '400px', overflowY: 'auto' });

    fireEvent.mouseDown(handle, { clientY: 200 });
    fireEvent.mouseMove(window, { clientY: 260 });
    fireEvent.mouseUp(window);

    expect(body).toHaveStyle({ height: '460px' });
    expect(screen.getByText('Problem')).toBeInTheDocument();
  });

  it('places the chat resize handle between the game panel and the chat body', () => {
    render(
      <ChakraProvider>
        <TowerDefenseV2Layout
          gameContent={<div>Game</div>}
          editorContent={<div>Editor</div>}
          problemContent={<div>Problem</div>}
          chatContent={<div>Chat</div>}
          problemOpen={false}
          chatOpen
          onProblemOpenChange={vi.fn()}
          onChatOpenChange={vi.fn()}
        />
      </ChakraProvider>
    );

    const handle = document.querySelector('[data-collapsible-resize-handle="chat"]');
    expect(handle).not.toBeNull();

    const body = handle.nextElementSibling;
    expect(body.getAttribute('data-overlay-body')).toBe('chat');
    expect(body).toHaveStyle({ height: '280px' });

    fireEvent.mouseDown(handle, { clientY: 300 });
    fireEvent.mouseMove(window, { clientY: 240 });
    fireEvent.mouseUp(window);

    expect(body).toHaveStyle({ height: '340px' });
  });
});
