import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockChat = vi.hoisted(() => vi.fn(() => <div data-testid="chat" />));

vi.mock('./AssistanceLevelSelector', () => ({
  default: () => <div data-testid="assistance-level-selector" />,
}));

vi.mock('./Chat', () => ({
  default: (props) => mockChat(props),
}));

import ChatPanel from './ChatPanel';

describe('ChatPanel', () => {
  it('uses the retro desktop theme for the shared problem chat shell', () => {
    const { container } = render(
      <ChatPanel problemId="problem-1" onInputStart={vi.fn()} isDisabled={false} />
    );

    expect(container.firstChild).toHaveClass('chat-panel-container');
    expect(container.firstChild).toHaveClass('retro-desktop-chat-panel');
    expect(container.firstChild).not.toHaveClass('cyberpunk-chat');
    expect(mockChat.mock.calls[0][0].theme).toBe('retro-desktop');
  });
});
