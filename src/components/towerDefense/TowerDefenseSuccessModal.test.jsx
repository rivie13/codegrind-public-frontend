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

vi.mock('../../hooks/animations/useXpLevelUpAnimation', () => ({
  default: (options) => mockUseXpLevelUpAnimation(options),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockState.auth,
}));

vi.mock('../../contexts/GuestProgressProvider', () => ({
  useGuestProgressCtx: () => mockState.guestCtx,
}));

vi.mock('../shared/XpProgressBar', () => ({
  default: () => <div data-testid="xp-progress-bar" />,
}));

vi.mock('../shared/SocialShareButtons', () => ({
  default: () => <div data-testid="social-share-buttons" />,
}));

vi.mock('../shared/DataPacketsEarnedBadge', () => ({
  default: () => <div data-testid="data-packets-earned-badge" />,
}));

vi.mock('../../utils/audio/AudioManager', () => ({
  default: {
    stopAllSoundEffects: vi.fn(),
  },
}));

vi.mock('../../utils/audio/AudioService', () => ({
  default: {
    initialize: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  api: {
    aiProblems: {
      getNextProblem: vi.fn(),
    },
    problems: {
      getNextProblem: vi.fn(),
    },
  },
}));

import TowerDefenseSuccessModal from './TowerDefenseSuccessModal';

describe('TowerDefenseSuccessModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.auth = { isAuthenticated: false };
    mockState.guestCtx = null;
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
      xpDisplayMode: 'current',
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

  it('uses xp summary level/role fallback when there is no level-up payload', () => {
    const gameStats = {
      xp: {
        summary: {
          level: 2,
          roleName: 'Greenhorn',
          xpIntoLevel: 145,
          xpToNextLevel: 213,
        },
        awards: [{ reason: 'problem_solved_easy', amount: 50 }],
        levelUp: null,
      },
    };

    render(
      <MemoryRouter>
        <ChakraProvider>
          <TowerDefenseSuccessModal isOpen={false} onClose={vi.fn()} gameStats={gameStats} />
        </ChakraProvider>
      </MemoryRouter>
    );

    expect(mockUseXpLevelUpAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        previousLevel: 2,
        newLevel: 2,
        previousRoleName: 'Greenhorn',
        newRoleName: 'Greenhorn',
      })
    );
  });

  it('shows a back-to-clusters action when cluster navigation is present', () => {
    render(
      <MemoryRouter>
        <ChakraProvider>
          <TowerDefenseSuccessModal
            isOpen
            onClose={vi.fn()}
            gameStats={{}}
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

  it('opens the guest signup wall instead of navigating when the pro trial is exhausted', () => {
    const onGuestSignupWallRequested = vi.fn();
    mockState.guestCtx = {
      isProTrialLocked: true,
      hasReachedClusterProblemWall: true,
    };

    render(
      <MemoryRouter>
        <ChakraProvider>
          <TowerDefenseSuccessModal
            isOpen
            onClose={vi.fn()}
            gameStats={{}}
            problemData={{
              id: 1,
              title: 'Trace Rogue Daemon Instances',
              titleSlug: 'trace-rogue-daemon-instances',
              source: 'CODEGRIND',
            }}
            onGuestSignupWallRequested={onGuestSignupWallRequested}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /next target/i }));

    expect(onGuestSignupWallRequested).toHaveBeenCalledTimes(1);
  });

  it('keeps guest tower-defense modal summary tied to the solve payload when context xp is higher', () => {
    mockState.guestCtx = {
      xpSummary: {
        xp: 354,
        level: 2,
        roleName: 'Greenhorn',
        xpIntoLevel: 204,
        xpToNextLevel: 213,
      },
    };

    const gameStats = {
      xp: {
        summary: {
          xp: 295,
          level: 2,
          roleName: 'Greenhorn',
          xpIntoLevel: 145,
          xpToNextLevel: 213,
        },
        awards: [{ reason: 'guest_achievement_triple_threat', amount: 40 }],
        levelUp: null,
      },
    };

    render(
      <MemoryRouter>
        <ChakraProvider>
          <TowerDefenseSuccessModal isOpen={false} onClose={vi.fn()} gameStats={gameStats} />
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
          <TowerDefenseSuccessModal
            isOpen
            onClose={vi.fn()}
            gameStats={{
              xp: {
                summary: {
                  level: 2,
                  roleName: 'Greenhorn',
                  xpIntoLevel: 145,
                  xpToNextLevel: 213,
                },
                awards: [{ reason: 'tower_defense_win', amount: 80 }],
                levelUp: null,
              },
            }}
            problemData={{ title: 'Trace Rogue Daemon Instances', difficulty: 'medium' }}
          />
        </ChakraProvider>
      </MemoryRouter>
    );

    const xpHeading = screen.getByText(/xp sync report/i);
    const xpSection = xpHeading.closest('[tabindex="-1"]');

    await waitFor(() => {
      expect(xpSection).not.toBeNull();
      expect(document.activeElement).toBe(xpSection);
    });
  });
});
