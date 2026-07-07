import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  location: {
    pathname: '/problems/two-sum',
    search: '',
    state: {},
  },
  params: {
    titleSlug: 'two-sum',
    pathSlug: undefined,
  },
  navigate: vi.fn(),
  toast: vi.fn(),
  onOpen: vi.fn(),
  onClose: vi.fn(),
  useAuth: vi.fn(),
  useLearningPathData: vi.fn(),
  useProblemData: vi.fn(),
  loadLearningPathProgress: vi.fn(),
  checkTestCases: vi.fn(),
  handleLanguageChange: vi.fn(),
  startTimer: vi.fn(),
  workspaceLayoutProps: [],
  api: {
    learningPath: {
      getRateLimit: vi.fn(),
      watchAd: vi.fn(),
    },
    codeExecution: {
      prewarm: vi.fn(),
      addCredit: vi.fn(),
    },
    problems: {
      runCode: vi.fn(),
    },
  },
  trackUserContentEvent: vi.fn(),
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
    useDisclosure: () => ({
      isOpen: false,
      onOpen: mockState.onOpen,
      onClose: mockState.onClose,
    }),
    useToast: () => mockState.toast,
  };
});

vi.mock('@emotion/react', () => ({
  keyframes: () => 'mock-keyframe',
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockState.location,
    useNavigate: () => mockState.navigate,
    useParams: () => mockState.params,
  };
});

vi.mock('../layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('./LoadingScreen', () => ({
  default: () => <div data-testid="loading-screen">Loading workspace</div>,
}));

vi.mock('./ProblemWorkspaceLayout', () => ({
  default: (props) => {
    mockState.workspaceLayoutProps.push(props);
    return (
      <div data-testid="workspace-layout">
        <span data-testid="chat-visible">{String(props.isChatVisible)}</span>
        <span data-testid="workspace-mode">{props.mode}</span>
        <button onClick={props.onToggleChatVisibility}>toggle-chat</button>
        <button onClick={props.onChatInput}>chat-input</button>
        <button onClick={() => props.onEditorChange('print(2)')}>editor-change</button>
      </div>
    );
  },
}));

vi.mock('../towerDefense/AdModal', () => ({
  default: ({ isOpen, onAdComplete }) =>
    isOpen ? (
      <div data-testid="learning-ad-modal">
        <button onClick={onAdComplete}>complete-learning-ad</button>
      </div>
    ) : null,
}));

vi.mock('../learningPath/tutorial/LearningWorkspaceTutorialManager', () => ({
  default: ({ children, onEnsureChatVisible }) => (
    <div data-testid="tutorial-wrapper">
      <button onClick={onEnsureChatVisible}>ensure-chat-visible</button>
      {children}
    </div>
  ),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockState.useAuth(),
}));

vi.mock('../../services/userContentEventService', () => ({
  trackUserContentEvent: (...args) => mockState.trackUserContentEvent(...args),
}));

vi.mock('../../hooks/useLearningPathData', () => ({
  default: (...args) => mockState.useLearningPathData(...args),
}));

vi.mock('../../hooks/problemWorkspace/useEditor', () => ({
  useEditor: () => ({
    code: 'print(1)',
    setCode: vi.fn(),
    editor: null,
    setEditor: vi.fn(),
    setMatrixBombActive: vi.fn(),
    setCurrentLine: vi.fn(),
    setShouldAddRandomChars: vi.fn(),
    updateMatrixEffect: vi.fn(),
  }),
}));

vi.mock('../../hooks/problemWorkspace/useTimer', () => ({
  useTimer: () => ({
    timer: 42,
    hasStarted: false,
    startTimer: mockState.startTimer,
    stopTimer: vi.fn(),
    restartTimer: vi.fn(),
    setFreshTimer: vi.fn(),
  }),
}));

vi.mock('./hooks/useAnimationSettings', () => ({
  default: () => ({
    isHighRes: false,
    animationsEnabled: true,
    settings: {
      scanLineAnimation: { speed: 5 },
      glitchEffects: { intensity: 1 },
      matrixEffects: { intensity: 1 },
    },
    quality: 'high',
    toggleAnimations: vi.fn(),
  }),
}));

vi.mock('./hooks/useProblemData', () => ({
  default: (...args) => mockState.useProblemData(...args),
}));

vi.mock('./hooks/useExecutionAds', () => ({
  default: () => ({
    executionRateLimit: null,
    setExecutionRateLimit: vi.fn(),
    showExecutionAdModal: false,
    setShowExecutionAdModal: vi.fn(),
    isApplyingExecutionCredit: false,
    setIsApplyingExecutionCredit: vi.fn(),
    selectedExecutionAdType: 'short',
    setSelectedExecutionAdType: vi.fn(),
    executionAdOptions: {
      short: { credits: 1, label: 'Short (+1)' },
    },
    selectedExecutionAd: { credits: 1, label: 'Short (+1)' },
    handleExecutionAdModalClose: vi.fn(),
  }),
}));

vi.mock('./hooks/useCodeExecution', () => ({
  default: () => ({
    isExecuting: false,
    setIsExecuting: vi.fn(),
    executionResult: '',
    setExecutionResult: vi.fn(),
    handleRunCode: vi.fn(),
    handleRunOutput: vi.fn(),
  }),
}));

vi.mock('./hooks/useNextProblem', () => ({
  default: () => ({
    nextProblem: { titleSlug: 'next-problem' },
  }),
}));

vi.mock('./hooks/useChallengeState', () => ({
  default: () => ({
    challengeState: {
      hasMatrixBomb: false,
      hasRandomChars: false,
      isTimeAttack: false,
      isTimerRunning: false,
      isAIDisabled: false,
    },
    setChallengeState: vi.fn(),
  }),
}));

vi.mock('./hooks/useSubmissions', () => ({
  default: () => ({
    sessionSubmissions: 0,
    setSessionSubmissions: vi.fn(),
    highScore: 0,
    bestTime: 0,
    hasNewHighScore: false,
    hasNewBestTime: false,
    finalScore: 0,
    setFinalScore: vi.fn(),
    timeSpent: 0,
    setTimeSpent: vi.fn(),
    updateScore: vi.fn(),
  }),
}));

vi.mock('./hooks/useScoring', () => ({
  default: () => ({
    calculateScore: () => ({
      finalScore: 100,
      breakdown: {
        baseScore: 100,
        timeDeduction: 0,
        runtimeDeduction: 0,
        memoryDeduction: 0,
        submissionDeduction: 0,
        aiDeduction: 0,
        rawScore: 100,
        totalChallengeBonus: 0,
      },
    }),
    calculateAiPenalty: () => 0,
    getTimeLimit: () => 120,
  }),
}));

vi.mock('./utils/codeHelpers', () => ({
  checkTestCases: (...args) => mockState.checkTestCases(...args),
  getFullCode: (code) => `FULL:${code}`,
}));

vi.mock('./utils/formatters', () => ({
  formatTime: (value) => `${value}s`,
}));

vi.mock('../../utils/learning/learningPathProgress', () => ({
  loadLearningPathProgress: (...args) => mockState.loadLearningPathProgress(...args),
  completeLearningPathNode: vi.fn(),
  buildGuestLearningCompletedNodes: vi.fn(() => []),
}));

vi.mock('../../utils/learning/learningPathStatus.js', () => ({
  computeCompletion: vi.fn(() => ({})),
  computeModuleAvailability: vi.fn(() => new Map()),
  getNodeStatus: vi.fn(() => 'available'),
}));

vi.mock('../../utils/learning/learningPathNavigation', () => ({
  getNextLearningNode: vi.fn(() => null),
}));

vi.mock('../../services/api', () => ({
  api: mockState.api,
}));

vi.mock('../../utils/audio/AudioManager', () => ({
  default: {
    playSoundEffect: vi.fn(),
  },
}));

vi.mock('../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import ProblemWorkspace from './ProblemWorkspace';

describe('ProblemWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockState.workspaceLayoutProps = [];
    mockState.params = { titleSlug: 'two-sum', pathSlug: undefined };
    mockState.location = {
      pathname: '/problems/two-sum',
      search: '',
      state: {},
    };

    mockState.useAuth.mockReturnValue({ user: { id: 'user-1' }, isAuthenticated: true });
    mockState.useLearningPathData.mockReturnValue({
      pathData: null,
      loading: false,
    });
    mockState.useProblemData.mockReturnValue({
      problemData: { title: 'Two Sum', difficulty: 'EASY', questionId: '1' },
      isLoading: false,
      language: 'python',
      handleLanguageChange: mockState.handleLanguageChange,
      isAIProblem: false,
    });
    mockState.loadLearningPathProgress.mockResolvedValue(new Set(['workspace-1']));
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: {
        unlimited: true,
        remaining: 5,
        adCooldownRemaining: 0,
      },
    });
    mockState.api.learningPath.watchAd.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 1,
        adCooldownRemaining: 0,
      },
      creditsEarned: 1,
    });
    mockState.api.codeExecution.addCredit.mockResolvedValue({
      creditsEarned: 1,
      rateLimit: {
        unlimited: false,
        remaining: 1,
        adCooldownRemaining: 0,
      },
    });
    mockState.api.codeExecution.prewarm.mockResolvedValue({ ok: true });
    mockState.checkTestCases.mockResolvedValue(true);
    mockState.api.problems.runCode.mockResolvedValue({
      formatted: {
        testCases: [
          {
            passed: true,
            input: [1, 2],
            expectedOutput: [0, 1],
            actualOutput: [0, 1],
            runtime: '0.01',
            memory: 1024,
          },
        ],
      },
      xp: {
        summary: { xp: 120, level: 2, roleName: 'Greenhorn' },
        awards: [{ reason: 'problem_solve', amount: 60 }],
        levelUp: null,
      },
    });
  });

  it('renders the loading screen while problem data is loading', () => {
    mockState.useProblemData.mockReturnValue({
      problemData: null,
      isLoading: true,
      language: 'python',
      handleLanguageChange: mockState.handleLanguageChange,
      isAIProblem: false,
    });

    render(<ProblemWorkspace />);

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('workspace-layout')).not.toBeInTheDocument();
  });

  it('renders workspace layout in ranked mode, toggles chat visibility, and starts timer on chat input', async () => {
    localStorage.setItem('pw_chat_visible', 'false');
    mockState.location = {
      pathname: '/problems/two-sum',
      search: '',
      state: { mode: 'ranked' },
    };

    render(<ProblemWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-layout')).toBeInTheDocument();
    });

    expect(screen.getByTestId('workspace-mode')).toHaveTextContent('ranked');
    expect(screen.getByTestId('chat-visible')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'toggle-chat' }));
    expect(localStorage.getItem('pw_chat_visible')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'chat-input' }));
    expect(mockState.startTimer).toHaveBeenCalledTimes(1);
  });



  it('tracks authenticated interview problem started on workspace mount', async () => {
    render(<ProblemWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-layout')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockState.trackUserContentEvent).toHaveBeenCalledWith(
        'user_content_surface_opened',
        expect.objectContaining({
          area: 'interview',
          surface: 'problem_workspace',
          problemSlug: 'two-sum',
        })
      );
    });

    // Code execution is now client-side — api.problems.runCode should NOT be called
    expect(mockState.api.problems.runCode).not.toHaveBeenCalled();
  });

  it('shows learning-gate lock screen when learning credits are exhausted', async () => {
    mockState.params = { titleSlug: 'two-sum', pathSlug: 'python-path' };
    mockState.location = {
      pathname: '/learning/python-path/problems/two-sum',
      search: '',
      state: {
        mode: 'learning',
        learningMode: true,
        learningPath: {
          pathId: 'python-path',
          nodeId: 'workspace-1',
          moduleId: 'module-1',
        },
      },
    };
    mockState.useLearningPathData.mockReturnValue({
      pathData: {
        pathId: 'python-path',
        nodes: [
          {
            id: 'workspace-1',
            moduleId: 'module-1',
            type: 'workspace',
            content: { learningProblemSlug: 'two-sum' },
          },
        ],
      },
      loading: false,
    });
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 0,
        adCooldownRemaining: 0,
      },
    });

    render(<ProblemWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Learning limit reached')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back to map' }));
    expect(mockState.navigate).toHaveBeenCalledWith('/learning/python-path');
    expect(screen.getByTestId('learning-ad-modal')).toBeInTheDocument();
  });

  it('wraps workspace with the tutorial manager in learning mode when gate is inactive', async () => {
    localStorage.setItem('pw_chat_visible', 'false');
    mockState.params = { titleSlug: 'two-sum', pathSlug: 'python-path' };
    mockState.location = {
      pathname: '/learning/python-path/problems/two-sum',
      search: '',
      state: {
        mode: 'learning',
        learningMode: true,
        learningPath: {
          pathId: 'python-path',
          nodeId: 'workspace-1',
          moduleId: 'module-1',
        },
      },
    };
    mockState.useLearningPathData.mockReturnValue({
      pathData: {
        pathId: 'python-path',
        nodes: [
          {
            id: 'workspace-1',
            moduleId: 'module-1',
            type: 'workspace',
            content: { learningProblemSlug: 'two-sum' },
          },
        ],
      },
      loading: false,
    });
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 2,
        adCooldownRemaining: 0,
      },
    });

    render(<ProblemWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('tutorial-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-layout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'ensure-chat-visible' }));

    await waitFor(() => {
      expect(screen.getByTestId('chat-visible')).toHaveTextContent('true');
    });
  });

  it('applies learning ad credits and exits the learning gate', async () => {
    mockState.params = { titleSlug: 'two-sum', pathSlug: 'python-path' };
    mockState.location = {
      pathname: '/learning/python-path/problems/two-sum',
      search: '',
      state: {
        mode: 'learning',
        learningMode: true,
        learningPath: {
          pathId: 'python-path',
          nodeId: 'workspace-1',
          moduleId: 'module-1',
        },
      },
    };
    mockState.useLearningPathData.mockReturnValue({
      pathData: {
        pathId: 'python-path',
        nodes: [
          {
            id: 'workspace-1',
            moduleId: 'module-1',
            type: 'workspace',
            content: { learningProblemSlug: 'two-sum' },
          },
        ],
      },
      loading: false,
    });
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 0,
        adCooldownRemaining: 0,
      },
    });

    render(<ProblemWorkspace />);

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

    await waitFor(() => {
      expect(screen.getByTestId('tutorial-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-layout')).toBeInTheDocument();
    });
  });

  it('shows cooldown warning when learning ad credit request fails', async () => {
    mockState.params = { titleSlug: 'two-sum', pathSlug: 'python-path' };
    mockState.location = {
      pathname: '/learning/python-path/problems/two-sum',
      search: '',
      state: {
        mode: 'learning',
        learningMode: true,
        learningPath: {
          pathId: 'python-path',
          nodeId: 'workspace-1',
          moduleId: 'module-1',
        },
      },
    };
    mockState.useLearningPathData.mockReturnValue({
      pathData: {
        pathId: 'python-path',
        nodes: [
          {
            id: 'workspace-1',
            moduleId: 'module-1',
            type: 'workspace',
            content: { learningProblemSlug: 'two-sum' },
          },
        ],
      },
      loading: false,
    });
    mockState.api.learningPath.getRateLimit.mockResolvedValue({
      rateLimit: {
        unlimited: false,
        remaining: 0,
        adCooldownRemaining: 0,
      },
    });
    mockState.api.learningPath.watchAd.mockRejectedValueOnce({
      data: {
        rateLimit: {
          adCooldownRemaining: 180,
        },
      },
    });

    render(<ProblemWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('learning-ad-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'complete-learning-ad' }));

    await waitFor(() => {
      expect(mockState.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ad cooldown active',
          status: 'warning',
        })
      );
    });
  });

  it('rehydrates navigation state from session storage on mount', async () => {
    const restoredState = { mode: 'challenge', challenges: ['noAI'] };
    sessionStorage.setItem('navigationState', JSON.stringify(restoredState));

    render(<ProblemWorkspace />);

    await waitFor(() => {
      expect(mockState.navigate).toHaveBeenCalledWith('/problems/two-sum', {
        state: restoredState,
        replace: true,
      });
    });

    expect(sessionStorage.getItem('navigationState')).toBeNull();
  });
});
