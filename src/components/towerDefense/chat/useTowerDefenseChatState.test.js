import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockToast = vi.hoisted(() => {
  const fn = vi.fn();
  fn.isActive = vi.fn(() => false);
  return fn;
});

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockChatApi = vi.hoisted(() => ({
  getUsage: vi.fn(),
  addCredit: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('@chakra-ui/react', () => ({
  useToast: () => mockToast,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../services/api', () => ({
  api: {
    chat: mockChatApi,
  },
}));

import useTowerDefenseChatState from './useTowerDefenseChatState';

describe('useTowerDefenseChatState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockToast.isActive.mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      user: { id: 42, membershipTier: 'FREE' },
    });
  });

  it('does not fetch chat usage until loading is enabled', () => {
    const { result } = renderHook(() =>
      useTowerDefenseChatState({
        problemId: 'two-sum',
        shouldLoadUsage: false,
        onInputStart: vi.fn(),
        assistanceLevel: 'standard',
        problem: { id: 1, titleSlug: 'two-sum' },
        language: 'python',
        code: 'print(1)',
        terminalOutput: '',
      })
    );

    expect(mockChatApi.getUsage).not.toHaveBeenCalled();
    expect(result.current.hasLoadedUsage).toBe(false);
    expect(result.current.isDisabled).toBe(true);
  });

  it('hydrates cached chat usage without refetching on remount', async () => {
    sessionStorage.setItem(
      'tower_defense_chat_usage_two-sum_42',
      JSON.stringify({
        chatCount: 3,
        dailyRemaining: 7,
        totalAllowed: 10,
        extraCredits: 0,
        lastResetTime: '2026-05-13T00:00:00.000Z',
        chatAdCooldownUntil: null,
        chatAdCooldownRemaining: 0,
      })
    );

    const { result } = renderHook(() =>
      useTowerDefenseChatState({
        problemId: 'two-sum',
        shouldLoadUsage: true,
        onInputStart: vi.fn(),
        assistanceLevel: 'standard',
        problem: { id: 1, titleSlug: 'two-sum' },
        language: 'python',
        code: 'print(1)',
        terminalOutput: '',
      })
    );

    await waitFor(() => {
      expect(result.current.hasLoadedUsage).toBe(true);
    });

    expect(mockChatApi.getUsage).not.toHaveBeenCalled();
    expect(result.current.dailyRemaining).toBe(7);
    expect(result.current.isDisabled).toBe(false);
  });

  it('shows a warning toast when chat usage cannot be loaded', async () => {
    mockChatApi.getUsage.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() =>
      useTowerDefenseChatState({
        problemId: 'two-sum',
        onInputStart: vi.fn(),
        assistanceLevel: 'standard',
        problem: { id: 1, titleSlug: 'two-sum' },
        language: 'python',
        code: 'print(1)',
        terminalOutput: '',
      })
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'td-chat-unavailable',
          title: 'Chat unavailable',
          status: 'warning',
        })
      );
    });

    expect(result.current.isDisabled).toBe(true);
  });
});
