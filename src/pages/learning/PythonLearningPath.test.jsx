import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LEARNING_NODE_TYPES } from '../../data/learningPathRegistry';

const mockState = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  setSearchParams: vi.fn(),
  searchParams: new URLSearchParams(),
  useAuth: vi.fn(),
  guestProgress: null,
  useLearningPathData: vi.fn(),
  api: {
    learningPath: {
      getRateLimit: vi.fn(),
      watchAd: vi.fn(),
    },
  },
  loadLearningPathProgress: vi.fn(),
  resetLearningPathProgress: vi.fn(),
  computeCompletion: vi.fn(),
  computeModuleAvailability: vi.fn(),
  getNodeStatus: vi.fn(),
}));

vi.mock('@chakra-ui/react', () => ({
  Badge: ({ children }) => <span>{children}</span>,
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Container: ({ children }) => <div>{children}</div>,
  Flex: ({ children }) => <div>{children}</div>,
  Heading: ({ children }) => <h2>{children}</h2>,
  HStack: ({ children }) => <div>{children}</div>,
  Switch: ({ isChecked, onChange }) => (
    <input
      aria-label="motion-toggle"
      type="checkbox"
      checked={Boolean(isChecked)}
      onChange={onChange}
    />
  ),
  Text: ({ children }) => <span>{children}</span>,
  Tooltip: ({ children }) => <>{children}</>,
  VStack: ({ children }) => <div>{children}</div>,
  usePrefersReducedMotion: () => false,
  useToast: () => mockState.toast,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockState.navigate,
    useSearchParams: () => [mockState.searchParams, mockState.setSearchParams],
  };
});

vi.mock('../../components/layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('../../components/towerDefense/AdModal', () => ({
  default: ({ isOpen, onAdComplete }) =>
    isOpen ? (
      <div data-testid="learning-ad-modal">
        <button onClick={onAdComplete}>complete-learning-ad</button>
      </div>
    ) : null,
}));

vi.mock('../../components/ads/TopBannerAd', () => ({
  default: () => <div data-testid="top-banner-ad" />,
}));

vi.mock('../../components/ads/BottomBannerAd', () => ({
  default: () => <div data-testid="bottom-banner-ad" />,
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
  api: mockState.api,
}));

vi.mock('../../utils/learning/learningPathProgress', () => ({
  loadLearningPathProgress: (...args) => mockState.loadLearningPathProgress(...args),
  resetLearningPathProgress: (...args) => mockState.resetLearningPathProgress(...args),
  buildGuestLearningCompletedNodes: vi.fn().mockReturnValue(new Set()),
}));

vi.mock('../../utils/learning/learningPathStatus.js', () => ({
  computeCompletion: (...args) => mockState.computeCompletion(...args),
  computeModuleAvailability: (...args) => mockState.computeModuleAvailability(...args),
  getNodeStatus: (...args) => mockState.getNodeStatus(...args),
}));

vi.mock('../../components/guest/GuestSignupWall', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="guest-signup-wall" /> : null),
}));

import PythonLearningPath from './PythonLearningPath';

const basePathData = {
  pathId: 'python-path',
  seedCompletedNodeIds: ['root-node'],
  modules: [{ moduleId: 'module-1' }],
  nodes: [
    {
      id: 'root-node',
      type: LEARNING_NODE_TYPES.ROOT,
      label: 'Root Node',
      description: 'Entry',
      position: { row: 0, col: 0 },
      prereqs: [],
    },
    {
      id: 'module-1',
      type: LEARNING_NODE_TYPES.MODULE,
      moduleId: 'module-1',
      label: 'Module Alpha',
      description: 'Module',
      position: { row: 1, col: 0 },
      prereqs: ['root-node'],
    },
    {
      id: 'workspace-1',
      type: LEARNING_NODE_TYPES.WORKSPACE,
      moduleId: 'module-1',
      label: 'Workspace Locked',
      description: 'Workspace',
      position: { row: 2, col: 0 },
      prereqs: ['module-1'],
      content: { learningProblemSlug: 'two-sum' },
    },
    {
      id: 'final-1',
      type: LEARNING_NODE_TYPES.FINAL,
      moduleId: 'module-1',
      label: 'Final Node',
      description: 'Final',
      position: { row: 3, col: 0 },
      prereqs: ['workspace-1'],
      content: { learningProblemSlug: 'two-sum-final' },
    },
  ],
};

describe('PythonLearningPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.searchParams = new URLSearchParams();
    mockState.useAuth.mockReturnValue({ isAuthenticated: true });
    mockState.guestProgress = {
      progress: {
        lpNodesCompleted: [],
        problemsAttempted: [],
      },
      hasReachedProblemWall: false,
      hasReachedLearningProblemWall: false,
      recordProblemAttempt: vi.fn(),
      activitySummary: {
        problemsAttemptedCount: 0,
        problemsSolvedCount: 0,
        lpNodesCompletedCount: 0,
        tdGamesPlayed: 0,
        clustersBrowsedCount: 0,
        demoCompleted: false,
      },
    };
    mockState.useLearningPathData.mockReturnValue({
      pathData: basePathData,
      loading: false,
    });
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: { unlimited: true, remaining: 9, adCooldownRemaining: 0 },
    });
    mockState.api.learningPath.watchAd.mockResolvedValue({
      rateLimit: { unlimited: false, remaining: 1, adCooldownRemaining: 0 },
      creditsEarned: 1,
    });
    mockState.loadLearningPathProgress.mockResolvedValue(new Set(['root-node']));
    mockState.resetLearningPathProgress.mockResolvedValue({ cleared: true });
    mockState.computeCompletion.mockReturnValue({});
    mockState.computeModuleAvailability.mockReturnValue({});
    mockState.getNodeStatus.mockReturnValue('available');
  });

  it('renders loading and not-found states for missing path data', async () => {
    mockState.useLearningPathData.mockReturnValueOnce({
      pathData: null,
      loading: true,
    });

    const { rerender } = render(<PythonLearningPath />);
    expect(screen.getByText('Loading learning path')).toBeInTheDocument();

    mockState.useLearningPathData.mockReturnValueOnce({
      pathData: null,
      loading: false,
    });
    rerender(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByText('Learning path not found')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back to learning' }));
    expect(mockState.navigate).toHaveBeenCalledWith('/learning');
  });

  it('root node is not interactive in macro view', async () => {
    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByText('Root Node')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Root Node'));

    // Root nodes should never trigger navigation or module selection
    expect(mockState.setSearchParams).not.toHaveBeenCalled();
  });

  it('shows locked-node toast when selecting a locked micro-view activity', async () => {
    mockState.searchParams = new URLSearchParams('module=module-1');
    mockState.getNodeStatus.mockImplementation((node) =>
      node.id === 'workspace-1' ? 'locked' : 'available'
    );

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByText('Workspace Locked')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Workspace Locked'));

    expect(mockState.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Locked node',
        status: 'info',
      })
    );
  });

  it('resets progress after confirmation and clears module query params', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset progress' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));

    await waitFor(() => {
      expect(mockState.resetLearningPathProgress).toHaveBeenCalledWith('python-path');
    });

    expect(mockState.setSearchParams).toHaveBeenCalledWith({});
    expect(mockState.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Progress cleared',
        status: 'success',
      })
    );
    confirmSpy.mockRestore();
  });

  it('shows reset failure toast when backend progress reset fails', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockState.resetLearningPathProgress.mockResolvedValueOnce({ cleared: false });

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset progress' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));

    await waitFor(() => {
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reset failed',
          status: 'error',
        })
      );
    });

    confirmSpy.mockRestore();
  });

  it('opens learning ad modal for available nodes when activity credits are depleted', async () => {
    mockState.searchParams = new URLSearchParams('module=module-1');
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: { unlimited: false, remaining: 0, adCooldownRemaining: 0 },
    });

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByText('Workspace Locked')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Workspace Locked'));

    await waitFor(() => {
      expect(screen.getByTestId('learning-ad-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'complete-learning-ad' }));

    await waitFor(() => {
      expect(mockState.api.learningPath.watchAd).toHaveBeenCalledWith('python-path', 'short');
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Credit applied',
          status: 'success',
        })
      );
    });

    expect(mockState.navigate).toHaveBeenCalledWith(
      '/learning/python-path/problems/two-sum',
      expect.objectContaining({
        state: expect.objectContaining({
          learningMode: true,
        }),
      })
    );
  });

  it('shows cooldown toast instead of opening ad modal when cooldown is active', async () => {
    mockState.searchParams = new URLSearchParams('module=module-1');
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: { unlimited: false, remaining: 0, adCooldownRemaining: 180 },
    });

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByText('Workspace Locked')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Workspace Locked'));

    await waitFor(() => {
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Activity cooldown active',
          status: 'info',
        })
      );
    });

    expect(screen.queryByTestId('learning-ad-modal')).not.toBeInTheDocument();
  });

  it('shows a warning toast when learning access status cannot be refreshed', async () => {
    mockState.api.learningPath.getRateLimit.mockRejectedValue(new Error('network down'));

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'python-learning-rate-limit-failed',
          title: 'Learning access unavailable',
          status: 'warning',
        })
      );
    });
  });

  it('shows a warning toast when saved learning progress cannot be loaded', async () => {
    mockState.loadLearningPathProgress.mockRejectedValue(new Error('progress unavailable'));

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'python-learning-progress-failed',
          title: 'Progress unavailable',
          status: 'warning',
        })
      );
    });
  });

  it('shows guest signup wall when a guest at the trial limit clicks a new problem node', async () => {
    mockState.useAuth.mockReturnValue({ isAuthenticated: false });
    mockState.searchParams = new URLSearchParams('module=py-m0-hello');
    mockState.useLearningPathData.mockReturnValue({
      pathData: {
        pathId: 'python-path',
        seedCompletedNodeIds: ['root-node'],
        modules: [{ moduleId: 'py-m0-hello' }],
        nodes: [
          {
            id: 'root-node',
            type: LEARNING_NODE_TYPES.ROOT,
            label: 'Root Node',
            description: 'Entry',
            position: { row: 0, col: 0 },
            prereqs: [],
          },
          {
            id: 'py-m0-hello',
            type: LEARNING_NODE_TYPES.MODULE,
            moduleId: 'py-m0-hello',
            label: 'Module 0',
            description: 'Module',
            position: { row: 1, col: 0 },
            prereqs: ['root-node'],
          },
          {
            id: 'py-m0-workspace-1',
            type: LEARNING_NODE_TYPES.WORKSPACE,
            moduleId: 'py-m0-hello',
            label: 'Workspace Locked',
            description: 'Workspace',
            position: { row: 2, col: 0 },
            prereqs: ['py-m0-hello'],
            content: { learningProblemSlug: 'lp-m0-td-addition' },
          },
        ],
      },
      loading: false,
    });
    mockState.guestProgress = {
      progress: {
        lpNodesCompleted: [],
        problemsAttempted: [],
      },
      hasReachedLearningProblemWall: true,
      selectedTrialTrack: 'beginner',
      recordProblemAttempt: vi.fn(),
      activitySummary: {
        problemsAttemptedCount: 3,
        problemsSolvedCount: 2,
        lpNodesCompletedCount: 1,
        tdGamesPlayed: 1,
        clustersBrowsedCount: 1,
        demoCompleted: true,
      },
    };

    render(<PythonLearningPath />);

    await waitFor(() => {
      expect(screen.getByText('Workspace Locked')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Workspace Locked'));

    await waitFor(() => {
      expect(screen.getByTestId('guest-signup-wall')).toBeInTheDocument();
    });

    expect(mockState.guestProgress.recordProblemAttempt).not.toHaveBeenCalled();
    expect(mockState.navigate).not.toHaveBeenCalled();
  });
});
