import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  useAuth: vi.fn(),
  guestCtx: null,
  pageState: null,
  location: { pathname: '/games/tower-defense/two-sum', search: '', state: null },
  navigate: vi.fn(),
  toast: vi.fn(),
  trackUserContentEvent: vi.fn(),
}));

const mockEnemyRevealOverlay = vi.hoisted(() => vi.fn(() => null));
const mockUseTowerDefenseV2PageState = vi.hoisted(() => vi.fn());
const mockUseCompactLandscapeShellMode = vi.hoisted(() => vi.fn(() => false));

vi.mock('react-router-dom', () => ({
  useLocation: () => mockState.location,
  useNavigate: () => mockState.navigate,
}));

vi.mock('@chakra-ui/react', () => {
  const createPassthrough = (tag = 'div') => {
    const Component = ({ children, ...props }) => React.createElement(tag, props, children);
    Component.displayName = `Mock${tag[0].toUpperCase()}${tag.slice(1)}`;
    return Component;
  };

  return {
    Box: createPassthrough(),
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Flex: createPassthrough(),
    HStack: createPassthrough(),
    Modal: ({ children, isOpen }) => (isOpen ? <div>{children}</div> : null),
    ModalBody: createPassthrough(),
    ModalCloseButton: ({ onClick }) => <button onClick={onClick}>close</button>,
    ModalContent: createPassthrough(),
    ModalOverlay: createPassthrough(),
    Text: createPassthrough('span'),
    VStack: createPassthrough(),
    useToast: () => mockState.toast,
  };
});

vi.mock('../../../components/layout/PageContainer', () => ({
  default: ({ children }) => <div data-testid="page-container">{children}</div>,
}));

vi.mock('../../../components/ads/BottomBannerAd', () => ({
  default: () => null,
}));

vi.mock('../../../components/ads/TopBannerAd', () => ({
  default: () => null,
}));

vi.mock('../../../components/learningPath/LearningPathTowerDefenseOnboarding', () => ({
  default: () => null,
}));

vi.mock('../../../components/learningPath/LearningWaveOverlay', () => ({
  default: () => null,
}));

vi.mock('../../../components/towerDefense/ui/overlays/EnemyRevealOverlay', () => ({
  default: (props) => mockEnemyRevealOverlay(props),
}));

vi.mock('../../../hooks/learning/useLearningWaveOverlays', () => ({
  default: () => ({
    activeOverlay: null,
    dismissOverlay: vi.fn(),
  }),
}));

vi.mock('../../../hooks/towerDefense/useEnemyRevealOverlay', () => ({
  default: () => ({
    activeEnemyReveal: null,
    dismissEnemyReveal: vi.fn(),
  }),
}));

vi.mock('../../../utils/audio/AudioManager', () => ({
  default: {
    getSettings: () => ({ musicEnabled: false }),
  },
}));

vi.mock('../../../utils/audio/AudioService', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(undefined),
    playBackgroundMusic: vi.fn(),
  },
}));

vi.mock('./TowerDefenseV2Modals', () => ({
  default: () => null,
}));

vi.mock('./useTowerDefenseV2PageState', () => ({
  default: (...args) => mockUseTowerDefenseV2PageState(...args),
}));

vi.mock('../../../hooks/useCompactLandscapeShellMode', () => ({
  default: (...args) => mockUseCompactLandscapeShellMode(...args),
}));

vi.mock('../../../components/towerDefense/ui/layout/panelTypes', () => ({
  PANEL_TYPES: {
    GAME: 'game',
    PROBLEM: 'problem',
    EDITOR: 'editor',
  },
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockState.useAuth(),
}));

vi.mock('../../../contexts/GuestProgressProvider', () => ({
  useGuestProgressCtx: () => mockState.guestCtx,
}));

vi.mock('../../../services/userContentEventService', () => ({
  trackUserContentEvent: (...args) => mockState.trackUserContentEvent(...args),
}));

import TowerDefenseV2Page from './TowerDefenseV2Page';

const buildPageState = (overrides = {}) => ({
  layout: <div data-testid="layout" />,
  gameState: { status: 'prehack', wave: 1 },
  codeSubmitted: false,
  codeSubmissionSuccess: false,
  playerLevel: 1,
  initialCodeGenerated: true,
  functionTowerPlaced: true,
  objectTowerPlaced: true,
  isMultiProblemTower: false,
  problemTabs: [],
  activeProblemIndex: 0,
  leftPanel: 'game',
  rightPanel: 'problem',
  setLeftPanel: vi.fn(),
  setRightPanel: vi.fn(),
  lastTerminalCommand: '',
  learningPathOnboardingActive: false,
  setLearningPathOnboardingActive: vi.fn(),
  validatedGameSettings: {
    deployableMenuEnabled: false,
    aiChatEnabled: false,
  },
  problem: {
    titleSlug: null,
    difficulty: 'easy',
  },
  learningPathData: null,
  learningNodeId: null,
  showAdModal: false,
  setShowAdModal: vi.fn(),
  showExecutionAdModal: false,
  setShowExecutionAdModal: vi.fn(),
  executionAdOptions: {},
  executionRateLimit: null,
  selectedExecutionAd: null,
  selectedExecutionAdType: null,
  setSelectedExecutionAdType: vi.fn(),
  isApplyingExecutionCredit: false,
  handleExecutionAdComplete: vi.fn(),
  handleWatchAdForRefinement: vi.fn(),
  gameStats: null,
  showSuccessModal: false,
  setShowSuccessModal: vi.fn(),
  handleEnterEndlessMode: null,
  learningNextNode: null,
  handleContinueLearning: vi.fn(),
  handleReturnToMap: vi.fn(),
  problemError: null,
  ...overrides,
});

describe('TowerDefenseV2Page guest solve tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemyRevealOverlay.mockClear();
    mockUseCompactLandscapeShellMode.mockReturnValue(false);
    mockState.location = { pathname: '/games/tower-defense/two-sum', search: '', state: null };
    mockState.navigate = vi.fn();
    mockState.useAuth.mockReturnValue({ isAuthenticated: false });
    mockState.guestCtx = {
      recordProblemAttempt: vi.fn(),
      recordProblemSolved: vi.fn(),
    };
    mockState.pageState = buildPageState();
    mockUseTowerDefenseV2PageState.mockImplementation(() => mockState.pageState);
  });

  it('forwards the embedded shell theme into the page-state hook', async () => {
    render(<TowerDefenseV2Page embedded embeddedShellTheme="retro-desktop" />);

    await waitFor(() => {
      expect(mockUseTowerDefenseV2PageState).toHaveBeenCalledWith(
        expect.objectContaining({
          embeddedShellTheme: 'retro-desktop',
          desktopShellSizingMode: 'embedded',
        })
      );
    });
  });

  it('forwards the handheld page scroll override into the page-state hook', async () => {
    render(<TowerDefenseV2Page embedded allowEmbeddedHandheldPageScroll />);

    await waitFor(() => {
      expect(mockUseTowerDefenseV2PageState).toHaveBeenCalledWith(
        expect.objectContaining({
          allowEmbeddedHandheldPageScroll: true,
        })
      );
    });
  });

  it('defaults standalone tower defense to the retro desktop shell theme', async () => {
    render(<TowerDefenseV2Page />);

    await waitFor(() => {
      expect(mockUseTowerDefenseV2PageState).toHaveBeenCalledWith(
        expect.objectContaining({
          embeddedShellTheme: 'retro-desktop',
          desktopShellSizingMode: 'standalone',
        })
      );
    });
  });

  it('enables handheld page scroll for standalone compact mobile landscape runtime', async () => {
    mockUseCompactLandscapeShellMode.mockReturnValue(true);

    render(<TowerDefenseV2Page />);

    await waitFor(() => {
      expect(mockUseTowerDefenseV2PageState).toHaveBeenCalledWith(
        expect.objectContaining({
          allowEmbeddedHandheldPageScroll: true,
          desktopShellSizingMode: 'standalone',
        })
      );
    });
  });

  it('does not auto-record a new guest solve when slug changes during the same completed run', async () => {
    mockState.pageState = buildPageState({
      gameState: { status: 'level-complete', wave: 2 },
      codeSubmissionSuccess: true,
      problem: { titleSlug: 'lp-m0-td-addition', difficulty: 'easy' },
    });

    const { rerender } = render(
      <TowerDefenseV2Page
        learningPathTitleSlug="lp-m0-td-addition"
        learningPathMeta={{
          pathId: 'python-path',
          nodeId: 'py-m0-tower-addition',
          moduleId: 'py-m0-hello',
        }}
      />
    );

    await waitFor(() => {
      expect(mockState.guestCtx.recordProblemSolved).toHaveBeenCalledTimes(1);
    });

    mockState.pageState = buildPageState({
      gameState: { status: 'level-complete', wave: 2 },
      codeSubmissionSuccess: true,
      problem: { titleSlug: 'lp-m0-td-variables', difficulty: 'easy' },
    });

    rerender(
      <TowerDefenseV2Page
        learningPathTitleSlug="lp-m0-td-variables"
        learningPathMeta={{
          pathId: 'python-path',
          nodeId: 'py-m0-tower-variables',
          moduleId: 'py-m0-hello',
        }}
      />
    );

    await waitFor(() => {
      expect(mockState.guestCtx.recordProblemSolved).toHaveBeenCalledTimes(1);
      expect(mockState.guestCtx.recordProblemSolved).toHaveBeenCalledWith(
        'lp-m0-td-addition',
        expect.objectContaining({ source: 'learning-tower-defense' })
      );
    });
  });

  it('shows a warning toast when the tower defense problem fails to load', async () => {
    mockState.pageState = buildPageState({
      problemError: 'problem load failed',
    });

    render(<TowerDefenseV2Page />);

    await waitFor(() => {
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'td-problem-load-failed',
          title: 'Problem unavailable',
          status: 'warning',
        })
      );
    });
  });

  it('tracks authenticated interview tower defense problem started and solved', async () => {
    mockState.useAuth.mockReturnValue({ isAuthenticated: true });
    mockState.guestCtx = null;
    mockState.pageState = buildPageState({
      codeSubmitted: true,
      gameState: { status: 'level-complete', wave: 2 },
      codeSubmissionSuccess: true,
      problem: { titleSlug: 'two-sum', difficulty: 'easy' },
    });

    render(<TowerDefenseV2Page />);

    await waitFor(() => {
      expect(mockState.trackUserContentEvent).toHaveBeenCalledWith(
        'user_problem_started',
        expect.objectContaining({
          area: 'interview',
          surface: 'tower_defense',
          problemSlug: 'two-sum',
        })
      );
      expect(mockState.trackUserContentEvent).toHaveBeenCalledWith(
        'user_problem_solved',
        expect.objectContaining({
          area: 'interview',
          surface: 'tower_defense',
          problemSlug: 'two-sum',
        })
      );
    });
  });

  it('reports non-game embedded focus for single-panel problem slot states', async () => {
    mockState.pageState = buildPageState({
      leftPanel: 'problem',
      rightPanel: null,
    });

    const onEmbeddedChatFocusChange = vi.fn();

    render(<TowerDefenseV2Page embedded onEmbeddedChatFocusChange={onEmbeddedChatFocusChange} />);

    await waitFor(() => {
      expect(onEmbeddedChatFocusChange).toHaveBeenCalledWith(true);
    });
  });

  it('forces the mobile enemy reveal layout when tower defense is in single-panel mobile mode', async () => {
    mockState.pageState = buildPageState({
      leftPanel: 'game',
      rightPanel: null,
    });

    render(<TowerDefenseV2Page />);

    await waitFor(() => {
      expect(mockEnemyRevealOverlay).toHaveBeenCalledWith(
        expect.objectContaining({
          preferMobileLayout: true,
        })
      );
    });
  });
});
