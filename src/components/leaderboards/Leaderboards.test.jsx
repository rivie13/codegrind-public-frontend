import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  api: {
    leaderboards: {
      getProblems: vi.fn(),
      getProblemLeaderboard: vi.fn(),
      getTowerDefenseProblemLeaderboard: vi.fn(),
    },
  },
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
  },
  standardPanelSpy: vi.fn(),
  tdPanelSpy: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  api: mockState.api,
}));

vi.mock('../../utils/core/logger', () => ({
  default: mockState.logger,
}));

vi.mock('@chakra-ui/react', () => ({
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Tabs: ({ children, onChange }) => (
    <div>
      <button onClick={() => onChange?.(1)}>switch-tab</button>
      {children}
    </div>
  ),
  TabList: ({ children }) => <div>{children}</div>,
  TabPanels: ({ children }) => <div>{children}</div>,
  TabPanel: ({ children }) => <div>{children}</div>,
  Tab: ({ children }) => <button>{children}</button>,
}));

vi.mock('./LeaderboardLoading', () => ({
  default: () => <div>Loading leaderboards</div>,
}));

vi.mock('./StandardLeaderboardPanel', () => ({
  default: (props) => {
    mockState.standardPanelSpy(props);
    return (
      <div data-testid="standard-panel">
        <div data-testid="standard-selected">{props.getSelectedProblem() || 'none'}</div>
        <div data-testid="standard-rows">{props.getCurrentPageData().length}</div>
        <button onClick={() => props.setSelectedSource('AI')}>source-ai</button>
        <button onClick={() => props.setSelectedProblem('AI_2')}>pick-ai-problem</button>
      </div>
    );
  },
}));

vi.mock('./TowerDefenseLeaderboardPanel', () => ({
  default: (props) => {
    mockState.tdPanelSpy(props);
    return (
      <div data-testid="td-panel">
        <div data-testid="td-selected">{props.getSelectedTdProblem() || 'none'}</div>
        <div data-testid="td-rows">{props.getCurrentTdPageData().length}</div>
        <button onClick={() => props.setSelectedTdSource('AI')}>td-source-ai</button>
        <button onClick={() => props.setSelectedTdProblem('AI_2')}>pick-ai-td-problem</button>
        <button onClick={() => props.setTdMode('endless')}>td-endless</button>
      </div>
    );
  },
}));

import Leaderboards from './Leaderboards';

const problemsList = [
  {
    source: 'INTERVIEW',
    key: 'INTERVIEW_1',
    id: '1',
    title: 'Two Sum',
    difficulty: 'EASY',
    questionId: '1',
    totalSubmissions: 12,
    avgExecutionTime: 1.2,
  },
  {
    source: 'AI',
    key: 'AI_2',
    id: '2',
    title: 'Alien Sum',
    difficulty: 'MEDIUM',
    questionId: '2',
    totalSubmissions: 7,
    avgExecutionTime: 1.8,
  },
];

const standardDataByKey = {
  INTERVIEW_1: {
    scores: [{ id: 'a' }, { id: 'b' }],
    problemInfo: { title: 'Two Sum' },
  },
  AI_2: {
    scores: [{ id: 'x' }],
    problemInfo: { title: 'Alien Sum' },
  },
};

const tdDataByKey = {
  INTERVIEW_1: {
    scores: [
      { username: 'player-1', endlessScore: 0, endlessWaves: 0, endlessSurvivalTime: 0 },
      { username: 'player-2', endlessScore: 150, endlessWaves: 12, endlessSurvivalTime: 95 },
    ],
    problemInfo: { title: 'Two Sum TD' },
  },
  AI_2: {
    scores: [{ username: 'player-3', endlessScore: 80, endlessWaves: 9, endlessSurvivalTime: 70 }],
    problemInfo: { title: 'Alien TD' },
  },
};

describe('Leaderboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockState.api.leaderboards.getProblems.mockResolvedValue(problemsList);
    mockState.api.leaderboards.getProblemLeaderboard.mockImplementation(async (key) => {
      return standardDataByKey[key] || { scores: [], problemInfo: {} };
    });
    mockState.api.leaderboards.getTowerDefenseProblemLeaderboard.mockImplementation(async (key) => {
      return tdDataByKey[key] || { scores: [], problemInfo: {} };
    });
  });

  it('shows loading first, then loads default INTERVIEW leaderboard datasets', async () => {
    render(<Leaderboards />);

    expect(screen.getByText('Loading leaderboards')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('standard-panel')).toBeInTheDocument();
      expect(screen.getByTestId('td-panel')).toBeInTheDocument();
    });

    expect(mockState.api.leaderboards.getProblems).toHaveBeenCalledTimes(2);
    expect(mockState.api.leaderboards.getProblemLeaderboard).toHaveBeenCalledWith('INTERVIEW_1');
    expect(mockState.api.leaderboards.getTowerDefenseProblemLeaderboard).toHaveBeenCalledWith(
      'INTERVIEW_1'
    );
    expect(screen.getByTestId('standard-selected')).toHaveTextContent('INTERVIEW_1');
    expect(screen.getByTestId('standard-rows')).toHaveTextContent('2');
    expect(screen.getByTestId('td-selected')).toHaveTextContent('INTERVIEW_1');
  });

  it('switches source to AI and applies endless TD filtering', async () => {
    render(<Leaderboards />);

    await waitFor(() => {
      expect(screen.getByTestId('standard-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'source-ai' }));

    await waitFor(() => {
      expect(mockState.api.leaderboards.getProblemLeaderboard).toHaveBeenCalledWith('AI_2');
    });

    fireEvent.click(screen.getByRole('button', { name: 'pick-ai-problem' }));

    await waitFor(() => {
      expect(screen.getByTestId('standard-selected')).toHaveTextContent('AI_2');
    });

    fireEvent.click(screen.getByRole('button', { name: 'td-endless' }));

    await waitFor(() => {
      expect(screen.getByTestId('td-rows')).toHaveTextContent('1');
    });
  });

  it('handles metadata load errors without crashing the view', async () => {
    mockState.api.leaderboards.getProblems.mockRejectedValue(new Error('metadata unavailable'));

    render(<Leaderboards />);

    await waitFor(() => {
      expect(screen.queryByText('Loading leaderboards')).not.toBeInTheDocument();
    });

    expect(mockState.logger.error).toHaveBeenCalled();
    expect(screen.getByTestId('standard-panel')).toBeInTheDocument();
    expect(screen.getByTestId('td-panel')).toBeInTheDocument();
  });

  it('switches tower-defense source to AI and loads AI TD data', async () => {
    render(<Leaderboards />);

    await waitFor(() => {
      expect(screen.getByTestId('td-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'td-source-ai' }));

    await waitFor(() => {
      expect(mockState.api.leaderboards.getTowerDefenseProblemLeaderboard).toHaveBeenCalledWith(
        'AI_2'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'pick-ai-td-problem' }));

    await waitFor(() => {
      expect(screen.getByTestId('td-selected')).toHaveTextContent('AI_2');
    });
  });

  it('applies problem search filtering through panel callbacks', async () => {
    render(<Leaderboards />);

    const getStandardProps = () => mockState.standardPanelSpy.mock.calls.at(-1)?.[0];

    await waitFor(() => {
      expect(getStandardProps()).toBeTruthy();
    });

    await act(async () => {
      getStandardProps().setSearchQuery('two');
    });

    await waitFor(() => {
      expect(
        getStandardProps()
          .getCurrentProblemsList()
          .map((problem) => problem.title)
      ).toEqual(['Two Sum']);
    });

    await act(async () => {
      getStandardProps().setSearchQuery('missing');
    });

    await waitFor(() => {
      expect(getStandardProps().getCurrentProblemsList()).toHaveLength(0);
    });
  });
});
