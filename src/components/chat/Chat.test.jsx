import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  api: {
    chat: {
      getUsage: vi.fn(),
      sendMessage: vi.fn(),
      addCredit: vi.fn(),
    },
  },
  navigate: vi.fn(),
  useAuth: vi.fn(),
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
  buildProblemChatContext: vi.fn(() => ({ context: true })),
  prepareForPrompt: vi.fn((value) => value),
  onInputStart: vi.fn(),
  idCounter: 0,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockState.useAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockState.navigate,
  };
});

vi.mock('../../services/api', () => ({
  api: mockState.api,
}));

vi.mock('../../utils/code/promptInjectionPrevention', () => ({
  prepareForPrompt: (...args) => mockState.prepareForPrompt(...args),
}));

vi.mock('./chatContext', () => ({
  buildProblemChatContext: (...args) => mockState.buildProblemChatContext(...args),
}));

vi.mock('../../utils/core/logger', () => ({
  default: mockState.logger,
}));

vi.mock('./chatHelpers', () => ({
  filterDuplicateLimitMessages: (messages) => {
    let seenLimit = false;
    return messages.filter((msg) => {
      if (!msg?.isLimit) return true;
      if (seenLimit) return false;
      seenLimit = true;
      return true;
    });
  },
  formatCooldown: (seconds) => `${seconds}s`,
  generateUniqueId: () => {
    mockState.idCounter += 1;
    return `msg-${mockState.idCounter}`;
  },
  getResetRemainingSeconds: () => 120,
  normalizeProblemId: (problemId) => `normalized-${problemId}`,
  sanitizeOutgoingMessage: (input) => input.trim(),
}));

vi.mock('./index.js', () => {
  const useChatState = ({ initialMessages = [], initialInput = '' } = {}) => {
    const [messages, setMessages] = React.useState(initialMessages);
    const [input, setInput] = React.useState(initialInput);
    return { messages, setMessages, input, setInput };
  };

  return {
    useChatState,
    ChatShell: ({ children, dataFont }) => (
      <div data-testid="chat-shell" data-font={dataFont}>
        {children}
      </div>
    ),
    LeaveModal: ({ isOpen, onCancel, onConfirm }) =>
      isOpen ? (
        <div data-testid="leave-modal">
          <button onClick={onCancel}>leave-cancel</button>
          <button onClick={onConfirm}>leave-confirm</button>
        </div>
      ) : null,
    RewardAdModal: ({ isOpen, onComplete, adViewed }) =>
      isOpen ? (
        <div data-testid="reward-ad-modal">
          <span>{String(adViewed)}</span>
          <button onClick={onComplete}>complete-reward-ad</button>
        </div>
      ) : null,
    MessageList: ({ messages, renderLimitMessage }) => (
      <div data-testid="messages">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isLimit
              ? renderLimitMessage()
              : typeof message.content === 'string'
                ? message.content
                : message.content?.type || ''}
          </div>
        ))}
      </div>
    ),
    ChatStatusBar: ({ statusText, lowRemainingText, extraCreditsText }) => (
      <div data-testid="status-bar">
        <div>{statusText}</div>
        {lowRemainingText ? <div>{lowRemainingText}</div> : null}
        {extraCreditsText ? <div>{extraCreditsText}</div> : null}
      </div>
    ),
    ChatAdActions: ({ onWatchAd, onUpgrade, cooldownLabel }) => (
      <div data-testid="chat-ad-actions">
        <span>{cooldownLabel}</span>
        <button onClick={onWatchAd}>watch-ad</button>
        <button onClick={onUpgrade}>upgrade-chat</button>
      </div>
    ),
    Composer: ({ value, onChange, onSend, placeholder, disabled, loading, onToggleFont }) => (
      <div>
        <input
          aria-label="chat-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button onClick={onSend}>send-message</button>
        <button onClick={onToggleFont}>toggle-font</button>
        <span data-testid="composer-loading">{String(loading)}</span>
      </div>
    ),
    LimitMessage: () => <div data-testid="limit-message">limit-message</div>,
  };
});

import Chat from './Chat';

const usagePayload = (overrides = {}) => ({
  chatCount: 0,
  dailyRemaining: 3,
  totalAllowed: 10,
  extraCredits: 0,
  lastResetTime: new Date(Date.now() - 60_000).toISOString(),
  extraCreditsEarnedAt: null,
  chatAdCooldownUntil: null,
  chatAdCooldownRemaining: 0,
  ...overrides,
});

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.idCounter = 0;
    localStorage.clear();
    mockState.useAuth.mockReturnValue({
      user: { id: 'user-1', membershipTier: 'FREE' },
    });
    mockState.onInputStart.mockReset();
  });

  it('loads usage and sends a message through the API flow', async () => {
    mockState.api.chat.getUsage
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 3 }))
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 3 }))
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 2 }));
    mockState.api.chat.sendMessage.mockResolvedValue({
      response: 'AI says hello',
    });

    render(
      <Chat
        problemId="leetcode-1"
        onInputStart={mockState.onInputStart}
        assistanceLevel="normal"
        problemData={{ title: 'Two Sum' }}
        code="print(1)"
        executionResult=""
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('status-bar')).toHaveTextContent('Chats left: 3 / 10');
    });

    const input = screen.getByLabelText('chat-input');
    fireEvent.change(input, { target: { value: 'h' } });
    fireEvent.change(input, { target: { value: 'help me solve this' } });
    fireEvent.click(screen.getByRole('button', { name: 'send-message' }));

    await waitFor(() => {
      expect(mockState.api.chat.sendMessage).toHaveBeenCalledTimes(1);
    });

    expect(mockState.onInputStart).toHaveBeenCalledTimes(1);
    expect(mockState.api.chat.sendMessage).toHaveBeenCalledWith(
      'user-1',
      'normalized-leetcode-1',
      'help me solve this',
      'normal',
      { context: true },
      null
    );
    expect(screen.getByTestId('messages')).toHaveTextContent('AI says hello');
    expect(screen.getByLabelText('chat-input')).toHaveValue('');
  });

  it('shows limit actions and confirms upgrade navigation through leave modal', async () => {
    mockState.api.chat.getUsage.mockResolvedValue(usagePayload({ dailyRemaining: 0 }));

    render(
      <Chat
        problemId="leetcode-1"
        onInputStart={mockState.onInputStart}
        assistanceLevel="normal"
        problemData={{ title: 'Two Sum' }}
        code="print(1)"
        executionResult=""
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('chat-ad-actions')).toBeInTheDocument();
    });

    expect(screen.getByTestId('limit-message')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'upgrade-chat' }));
    expect(screen.getByTestId('leave-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'leave-confirm' }));
    expect(mockState.navigate).toHaveBeenCalledWith('/upgrade');
  });

  it('retries once on content-filtered errors and appends recovery messaging', async () => {
    mockState.api.chat.getUsage
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 5 }))
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 5 }))
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 4 }));

    mockState.api.chat.sendMessage
      .mockRejectedValueOnce({
        data: {
          error: 'content_filter',
          message: 'message filtered by policy',
        },
      })
      .mockResolvedValueOnce({
        response: 'Safe fallback response',
      });

    render(
      <Chat
        problemId="leetcode-1"
        onInputStart={mockState.onInputStart}
        assistanceLevel="normal"
        problemData={{ title: 'Two Sum' }}
        code="print(1)"
        executionResult=""
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('chat-input'), {
      target: { value: 'sensitive test prompt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'send-message' }));

    await waitFor(() => {
      expect(mockState.api.chat.sendMessage).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByTestId('messages')).toHaveTextContent(
      'I rephrased your request to avoid safety filters.'
    );
    expect(screen.getByTestId('messages')).toHaveTextContent('Safe fallback response');
  });

  it('grants extra credits after watching and completing a reward ad', async () => {
    mockState.api.chat.getUsage
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 0, chatAdCooldownRemaining: 0 }))
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 0, chatAdCooldownRemaining: 0 }))
      .mockResolvedValueOnce(
        usagePayload({
          dailyRemaining: 3,
          extraCredits: 3,
          extraCreditsEarnedAt: new Date().toISOString(),
          chatAdCooldownRemaining: 0,
        })
      );
    mockState.api.chat.addCredit.mockResolvedValue({
      extraCredits: 3,
      chatAdCooldownUntil: null,
      chatAdCooldownRemaining: 0,
      extraCreditsEarnedAt: new Date().toISOString(),
    });

    render(
      <Chat
        problemId="leetcode-1"
        onInputStart={mockState.onInputStart}
        assistanceLevel="normal"
        problemData={{ title: 'Two Sum' }}
        code="print(1)"
        executionResult=""
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('chat-ad-actions')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'watch-ad' }));

    await waitFor(() => {
      expect(screen.getByTestId('reward-ad-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'complete-reward-ad' }));

    await waitFor(() => {
      expect(mockState.api.chat.addCredit).toHaveBeenCalledWith(
        'user-1',
        'normalized-leetcode-1',
        'short'
      );
    });

    expect(screen.getByTestId('messages')).toHaveTextContent('You earned 3 extra chat credits');
    await waitFor(() => {
      expect(screen.queryByTestId('reward-ad-modal')).not.toBeInTheDocument();
    });
  });

  it('loads guest usage and opens the reward ad flow for guests', async () => {
    mockState.useAuth.mockReturnValue({ user: null });
    mockState.api.chat.getUsage
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 0, totalAllowed: 10 }))
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 0, totalAllowed: 10 }))
      .mockResolvedValueOnce(
        usagePayload({
          dailyRemaining: 3,
          totalAllowed: 10,
          extraCredits: 3,
          extraCreditsEarnedAt: new Date().toISOString(),
        })
      );
    mockState.api.chat.addCredit.mockResolvedValue({
      extraCredits: 3,
      chatAdCooldownUntil: null,
      chatAdCooldownRemaining: 0,
      extraCreditsEarnedAt: new Date().toISOString(),
    });

    render(
      <Chat
        problemId="decrypt-neural-frequency-pair"
        onInputStart={mockState.onInputStart}
        assistanceLevel="hints"
        problemData={{ title: 'Decrypt Neural Frequency Pair' }}
        code="print(1)"
        executionResult=""
      />
    );

    await waitFor(() => {
      expect(mockState.api.chat.getUsage).toHaveBeenCalledWith(
        'guest',
        'normalized-decrypt-neural-frequency-pair'
      );
      expect(screen.getByTestId('status-bar')).toHaveTextContent('Chats left: 0 / 10');
    });

    fireEvent.click(screen.getByRole('button', { name: 'watch-ad' }));

    await waitFor(() => {
      expect(screen.getByTestId('reward-ad-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'complete-reward-ad' }));

    await waitFor(() => {
      expect(mockState.api.chat.addCredit).toHaveBeenCalledWith(
        'guest',
        'normalized-decrypt-neural-frequency-pair',
        'short'
      );
    });
  });

  it('shows cooldown warning and avoids opening reward modal during ad cooldown', async () => {
    mockState.api.chat.getUsage
      .mockResolvedValueOnce(usagePayload({ dailyRemaining: 0, chatAdCooldownRemaining: 0 }))
      .mockResolvedValue(
        usagePayload({
          dailyRemaining: 0,
          chatAdCooldownRemaining: 90,
        })
      );

    render(
      <Chat
        problemId="leetcode-1"
        onInputStart={mockState.onInputStart}
        assistanceLevel="normal"
        problemData={{ title: 'Two Sum' }}
        code="print(1)"
        executionResult=""
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('chat-ad-actions')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'watch-ad' }));

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent(
        'Ad cooldown active. Please wait 90s before watching another ad.'
      );
    });

    expect(screen.queryByTestId('reward-ad-modal')).not.toBeInTheDocument();
  });
});
