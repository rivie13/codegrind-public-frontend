import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseXpLevelUpAnimation = vi.hoisted(() => vi.fn());
const mockState = vi.hoisted(() => ({
  auth: { isAuthenticated: false },
  guestCtx: null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/animations/useXpLevelUpAnimation', () => ({
  default: (options) => mockUseXpLevelUpAnimation(options),
}));

vi.mock('../../shared/XpProgressBar', () => ({
  default: () => <div data-testid="xp-progress-bar" />,
}));

vi.mock('../../modals/ChallengeModal', () => ({
  default: () => null,
}));

vi.mock('../../shared/SocialShareButtons', () => ({
  default: () => <div data-testid="social-share-buttons" />,
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockState.auth,
}));

vi.mock('../../../contexts/GuestProgressProvider', () => ({
  useGuestProgressCtx: () => mockState.guestCtx,
}));

vi.mock('../../../utils/audio/AudioManager', () => ({
  default: {
    stopAllSoundEffects: vi.fn(),
  },
}));

vi.mock('../../../utils/audio/AudioService', () => ({
  default: {
    initialize: vi.fn(),
  },
}));

import SuccessModal from './SuccessModal';

describe('Problem workspace SuccessModal', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockState.auth = { isAuthenticated: false };
    mockState.guestCtx = null;
    window.history.replaceState({}, '', '/problems/two-sum');
    if (!window.matchMedia) {
      window.matchMedia = () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });
    }
    mockUseXpLevelUpAnimation.mockReturnValue({
      animatedXpProgress: 0,
      progressTransition: 'none',
      showLevelUpCelebration: false,
      levelUpEmphasisActive: false,
      displayLevel: 1,
      displayRoleName: 'Greenhorn',
      barFullGlow: false,
      barFlashActive: false,
      barShakeActive: false,
      animatedXpDisplay: {
        into: 0,
        toNext: 0,
        remaining: 0,
      },
    });
  });

  it('shows a back-to-clusters action when opened from cluster mode', () => {
    render(
      <MemoryRouter>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Two Sum', titleSlug: 'two-sum' }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpAwards={[]}
            clusterNavigation={{
              clusterId: 'cluster-1',
              collectionId: 'codegrind-250',
              orderedSlugs: ['two-sum'],
            }}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /back to clusters/i })).toBeInTheDocument();
  });

  it('routes AI problems back to the AI browse list', () => {
    window.history.replaceState({}, '', '/ai-problems/generated-two-sum');

    render(
      <MemoryRouter initialEntries={['/ai-problems/generated-two-sum']}>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Generated Two Sum', titleSlug: 'generated-two-sum' }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpAwards={[]}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /back to ai problem list/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/ai-problems/browse');
  });

  it('keeps next-problem navigation on the AI problem route', () => {
    window.history.replaceState({}, '', '/ai-problems/generated-two-sum');

    render(
      <MemoryRouter initialEntries={['/ai-problems/generated-two-sum']}>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Generated Two Sum', titleSlug: 'generated-two-sum' }}
            nextProblem={{
              titleSlug: 'generated-three-sum',
              title: 'Generated Three Sum',
              source: 'AI',
            }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpAwards={[]}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /free play/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/ai-problems/generated-three-sum', {
      state: {
        mode: 'practice',
        isNextProblemAI: true,
      },
    });
  }, 15000);

  it('opens the guest signup wall instead of navigating to the next pro problem when the trial is exhausted', () => {
    const onGuestSignupWallRequested = vi.fn();
    mockState.guestCtx = {
      isProTrialLocked: true,
      hasReachedClusterProblemWall: true,
    };

    render(
      <MemoryRouter>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Two Sum', titleSlug: 'two-sum' }}
            nextProblem={{ title: 'Contains Duplicate', titleSlug: 'contains-duplicate' }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpAwards={[]}
            onGuestSignupWallRequested={onGuestSignupWallRequested}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /free play/i }));

    expect(onGuestSignupWallRequested).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  }, 15000);

  it('opens the guest signup wall instead of continuing learning when the beginner trial is exhausted', () => {
    const onGuestSignupWallRequested = vi.fn();
    const onContinueLearning = vi.fn();
    mockState.guestCtx = {
      isBeginnerTrialLocked: true,
      hasReachedLearningProblemWall: true,
    };

    render(
      <MemoryRouter initialEntries={['/learning/python-path/problems/lp-m0-td-variables']}>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Variables', titleSlug: 'lp-m0-td-variables' }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpAwards={[]}
            isLearningMode
            learningNextNode={{ id: 'py-m0-final', title: 'Final Challenge' }}
            onContinueLearning={onContinueLearning}
            onGuestSignupWallRequested={onGuestSignupWallRequested}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onGuestSignupWallRequested).toHaveBeenCalledTimes(1);
    expect(onContinueLearning).not.toHaveBeenCalled();
  });

  it('focuses the xp section first so the progress bar stays visible', async () => {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Two Sum', titleSlug: 'two-sum' }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpSummary={{ level: 2, roleName: 'Greenhorn', xpIntoLevel: 145, xpToNextLevel: 213 }}
            xpAwards={[{ reason: 'problem_solve', amount: 50 }]}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    const xpHeading = screen.getAllByText(/xp sync report/i)[0];
    const xpSection = xpHeading.closest('[tabindex="-1"]');

    await waitFor(() => {
      expect(xpSection).not.toBeNull();
      expect(document.activeElement).toBe(xpSection);
    });
  });

  it('keeps guest workspace modal summary tied to the solve payload when context xp is higher', () => {
    mockState.guestCtx = {
      xpSummary: {
        xp: 354,
        level: 2,
        roleName: 'Greenhorn',
        xpIntoLevel: 204,
        xpToNextLevel: 213,
      },
    };

    render(
      <MemoryRouter>
        <ChakraProvider>
          <SuccessModal
            isOpen
            onClose={vi.fn()}
            problemData={{ title: 'Contains Duplicate', titleSlug: 'contains-duplicate' }}
            timeSpent={30}
            finalScore={100}
            hasNewHighScore={false}
            hasNewBestTime={false}
            aiUsageCount={0}
            sessionSubmissions={1}
            xpSummary={{
              xp: 295,
              level: 2,
              roleName: 'Greenhorn',
              xpIntoLevel: 145,
              xpToNextLevel: 213,
            }}
            xpAwards={[{ reason: 'guest_achievement_triple_threat', amount: 40 }]}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    expect(mockUseXpLevelUpAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        currentXpIntoLevel: 145,
        currentXpToNextLevel: 213,
      })
    );
  });
});
