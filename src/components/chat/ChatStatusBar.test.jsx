import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ChatStatusBar from './ChatStatusBar';

describe('ChatStatusBar', () => {
  it('uses themeable status classes instead of inline color styles', () => {
    render(
      <ChatStatusBar
        statusText="Chats left: 2 / 10"
        lowRemainingText="2 chats remaining today"
        extraCreditsText="1 extra credit"
      />
    );

    const statusText = screen.getByText('Chats left: 2 / 10');
    const lowRemainingText = screen.getByText('2 chats remaining today');
    const extraCreditsText = screen.getByText('1 extra credit');

    expect(statusText).toHaveClass('chat-warning', 'chat-status-text');
    expect(lowRemainingText).toHaveClass('chat-warning', 'chat-status-low');
    expect(extraCreditsText).toHaveClass('chat-extra-credits', 'chat-status-extra');

    expect(statusText).not.toHaveAttribute('style');
    expect(lowRemainingText).not.toHaveAttribute('style');
    expect(extraCreditsText).not.toHaveAttribute('style');
  });
});
