import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LEARNING_NODE_TYPES } from '../../data/learningPathRegistry';

const mockState = vi.hoisted(() => ({
  navigate: vi.fn(),
  useLearningPathData: vi.fn(),
  getRateLimit: vi.fn(),
  completeLearningPathNode: vi.fn(),
  loadLearningPathProgress: vi.fn(),
  useAuth: vi.fn(),
  guestProgress: null,
  toast: vi.fn(),
  getNextLearningNode: vi.fn(),
  computeCompletion: vi.fn(),
  computeModuleAvailability: vi.fn(),
  getNodeStatus: vi.fn(),
  trackUserContentEvent: vi.fn(),
}));

const mockUseXpLevelUpAnimation = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockState.navigate,
    useParams: () => ({ pathSlug: 'python-path', nodeId: 'learn-1' }),
  };
});

vi.mock('../../components/layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('../../components/ads/TopBannerAd', () => ({
  default: () => <div data-testid="top-banner-ad" />,
}));

vi.mock('../../components/ads/BottomBannerAd', () => ({
  default: () => <div data-testid="bottom-banner-ad" />,
}));

vi.mock('../../components/towerDefense/AdModal', () => ({
  default: () => null,
}));

vi.mock('../../components/shared/XpProgressBar', () => ({
  default: () => <div data-testid="xp-progress-bar" />,
}));

vi.mock('../../hooks/animations/useXpLevelUpAnimation', () => ({
  default: (options) => mockUseXpLevelUpAnimation(options),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockState.useAuth(),
}));

vi.mock('../../contexts/GuestProgressProvider', () => ({
  useGuestProgressCtx: () => mockState.guestProgress,
}));

vi.mock('../../hooks/useLearningPathData', () => ({
  default: (...args) => mockState.useLearningPathData(...args),
}));

vi.mock('../../services/api', () => ({
  api: {
    learningPath: {
      getRateLimit: (...args) => mockState.getRateLimit(...args),
    },
  },
}));

vi.mock('../../services/userContentEventService', () => ({
  trackUserContentEvent: (...args) => mockState.trackUserContentEvent(...args),
}));

vi.mock('../../utils/learning/learningPathProgress', () => ({
  completeLearningPathNode: (...args) => mockState.completeLearningPathNode(...args),
  loadLearningPathProgress: (...args) => mockState.loadLearningPathProgress(...args),
}));

vi.mock('../../utils/learning/learningPathNavigation', () => ({
  getNextLearningNode: (...args) => mockState.getNextLearningNode(...args),
}));

vi.mock('../../utils/learning/learningPathStatus.js', () => ({
  computeCompletion: (...args) => mockState.computeCompletion(...args),
  computeModuleAvailability: (...args) => mockState.computeModuleAvailability(...args),
  getNodeStatus: (...args) => mockState.getNodeStatus(...args),
}));

vi.mock('../../utils/audio/AudioService', () => ({
  default: {
    initialize: vi.fn(),
  },
}));

import LearningPathActivity from './LearningPathActivity';

describe('LearningPathActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    mockState.useAuth.mockReturnValue({ isAuthenticated: true });
    mockState.guestProgress = null;
    mockState.useLearningPathData.mockReturnValue({
      loading: false,
      pathData: {
        pathId: 'python-path',
        title: 'Python Path',
        seedCompletedNodeIds: [],
        modules: [{ moduleId: 'module-1', title: 'Module One' }],
        nodes: [
          {
            id: 'learn-1',
            moduleId: 'module-1',
            type: LEARNING_NODE_TYPES.LEARN,
            label: 'What did I learn?',
            description: 'Recap the lesson.',
            content: {
              body: ['Key idea one', 'Key idea two'],
            },
          },
        ],
      },
    });
    mockState.getRateLimit.mockResolvedValue({
      rateLimit: { unlimited: true, remaining: 3, adCooldownRemaining: 0 },
    });
    mockState.loadLearningPathProgress.mockResolvedValue(new Set());
    mockState.completeLearningPathNode.mockResolvedValue({
      xp: {
        summary: {
          xp: 980,
          level: 7,
          roleName: 'Debugger',
          xpIntoLevel: 120,
          xpToNextLevel: 220,
        },
        levelUp: null,
        awards: [{ reason: 'learning_path_node_complete', amount: 20 }],
      },
    });
    mockState.getNextLearningNode.mockReturnValue(null);
    mockState.computeCompletion.mockReturnValue({});
    mockState.computeModuleAvailability.mockReturnValue({});
    mockState.getNodeStatus.mockReturnValue('available');
  });

  it('passes the resolved XP summary level to the learning success animation when no level-up payload exists', async () => {
    render(
      <MemoryRouter>
        <ChakraProvider>
          <LearningPathActivity />
        </ChakraProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));

    await waitFor(
      () => {
        expect(
          mockUseXpLevelUpAnimation.mock.calls.some(
            ([options]) =>
              options?.hasXpData === true &&
              options?.previousLevel === 7 &&
              options?.newLevel === 7 &&
              options?.previousRoleName === 'Debugger' &&
              options?.newRoleName === 'Debugger'
          )
        ).toBe(true);
      },
      { timeout: 15000 }
    );
  }, 15000);
});
