import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  learningPath: {
    getProgress: vi.fn(),
    getPath: vi.fn(),
  },
  profile: {
    getPublicProfile: vi.fn(),
  },
  submissions: {
    getProfileStats: vi.fn(),
    getSolvedSlugs: vi.fn(),
    getCreatedAIProblems: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  default: mockApi,
}));

vi.mock('../../data/clusterCollections', () => ({
  CLUSTER_COLLECTIONS: [
    {
      id: 'codegrind-core',
      clusters: [
        {
          id: 'arrays-cluster',
          title: 'Arrays Cluster',
          shortTitle: 'ARR',
          difficulty: 'beginner',
          slugs: ['slug-1', 'slug-2', 'slug-3'],
        },
      ],
    },
  ],
}));

import NextObjectiveWidget from './NextObjectiveWidget';

function renderWidget(userId = 'user-1') {
  return render(
    <MemoryRouter>
      <ChakraProvider>
        <NextObjectiveWidget userId={userId} />
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('NextObjectiveWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.learningPath.getProgress.mockResolvedValue({ completedNodeIds: [] });
    mockApi.learningPath.getPath.mockResolvedValue(null);
    mockApi.profile.getPublicProfile.mockResolvedValue({ recentSubmissions: [] });
    mockApi.submissions.getProfileStats.mockResolvedValue({
      towerDefenseStats: { totalGames: 1 },
      easy: 0,
      medium: 0,
      hard: 0,
    });
    mockApi.submissions.getSolvedSlugs.mockResolvedValue([]);
    mockApi.submissions.getCreatedAIProblems.mockResolvedValue({ problems: [], total: 0 });
  });

  it('prioritizes continuing learning path when there is LP progress', async () => {
    mockApi.learningPath.getProgress.mockResolvedValue({ completedNodeIds: ['n1'] });
    mockApi.learningPath.getPath.mockResolvedValue({
      modules: [
        {
          title: 'Module 1',
          moduleId: 'm1',
          nodes: [
            { nodeId: 'n1', type: 'learn', title: 'Intro' },
            { nodeId: 'n2', type: 'workspace', title: 'Loops' },
          ],
        },
      ],
    });

    renderWidget();

    await screen.findByText(/CONTINUE LEARNING/i);
    expect(screen.getByText(/Module 1: Practice/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue your learning path/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/learning/python-path/n2');
  });

  it('chooses AI generation when the latest recent signal is AI problem creation', async () => {
    mockApi.submissions.getCreatedAIProblems.mockResolvedValue({
      problems: [{ id: 1, createdAt: '2026-05-02T10:00:00.000Z' }],
      total: 1,
    });

    renderWidget();

    await screen.findByText(/^AI PROBLEM GENERATION$/i);
    expect(screen.getByText(/Generate Your Next AI Problem/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Generate another AI problem/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/ai-problems/create');
  });

  it('chooses cluster continuation when recent submissions match cluster problems', async () => {
    mockApi.learningPath.getPath.mockResolvedValue({ modules: [] });
    mockApi.submissions.getSolvedSlugs.mockResolvedValue(['slug-1']);
    mockApi.profile.getPublicProfile.mockResolvedValue({
      recentSubmissions: [
        {
          problemId: 'slug-1',
          mode: 'practice',
          submission_date: '2026-05-03T10:00:00.000Z',
        },
      ],
    });

    renderWidget();

    await screen.findByText(/CONTINUE CLUSTER/i);
    expect(screen.getByText('Arrays Cluster')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue your cluster/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/games/clusters/arrays-cluster');
  });

  it('suggests starting LP when path exists but no nodes are completed', async () => {
    mockApi.learningPath.getPath.mockResolvedValue({
      modules: [
        {
          title: 'Foundations',
          moduleId: 'm0',
          nodes: [{ nodeId: 'x1', type: 'learn', title: 'Intro' }],
        },
      ],
    });

    renderWidget();

    await screen.findByText(/START LEARNING/i);
    fireEvent.click(screen.getByRole('button', { name: /Start your learning path/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/learning/python-path');
  });

  it('falls back to exploring clusters when no stronger objective exists', async () => {
    renderWidget();

    await screen.findByText(/Interview Clusters/i);
    fireEvent.click(screen.getByRole('button', { name: /Explore clusters/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/games/clusters');
  });
});
