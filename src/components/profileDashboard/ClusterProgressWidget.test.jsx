import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  submissions: {
    getSolvedSlugs: vi.fn(),
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
  CLUSTER_DIFFICULTY: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  },
  CLUSTER_COLLECTIONS: [
    {
      id: 'codegrind-core',
      clusters: [
        {
          id: 'arrays-cluster',
          title: 'Arrays Cluster',
          shortTitle: 'ARR',
          icon: 'A',
          difficulty: 'beginner',
          accent: '#00FF8C',
          slugs: ['slug-a', 'slug-b'],
        },
        {
          id: 'graph-cluster',
          title: 'Graph Cluster',
          shortTitle: 'GRF',
          icon: 'G',
          difficulty: 'intermediate',
          accent: '#00FFFF',
          slugs: ['slug-c'],
        },
        {
          id: 'dp-cluster',
          title: 'DP Cluster',
          shortTitle: 'DYN',
          icon: 'D',
          difficulty: 'advanced',
          accent: '#FF6B6B',
          slugs: ['slug-d', 'slug-e'],
        },
      ],
    },
  ],
}));

import ClusterProgressWidget from './ClusterProgressWidget';

function renderWidget(userId = 'user-1') {
  return render(
    <MemoryRouter>
      <ChakraProvider>
        <ClusterProgressWidget userId={userId} />
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('ClusterProgressWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.submissions.getSolvedSlugs.mockResolvedValue([]);
  });

  it('renders with zero progress when no user id is provided', async () => {
    renderWidget(null);

    await screen.findByText(/CLUSTER PROGRESS/i);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(mockApi.submissions.getSolvedSlugs).not.toHaveBeenCalled();
  });

  it('computes progress and handles cluster navigation clicks', async () => {
    mockApi.submissions.getSolvedSlugs.mockResolvedValue(['slug-a', 'slug-c']);

    renderWidget('player-7');

    await screen.findByText(/CLUSTER PROGRESS/i);
    expect(screen.getByText('40%')).toBeInTheDocument();

    fireEvent.click(screen.getByText('ARR'));
    expect(mockNavigate).toHaveBeenCalledWith('/games/clusters/arrays-cluster');

    fireEvent.click(screen.getByText(/VIEW ALL CLUSTERS/i));
    expect(mockNavigate).toHaveBeenCalledWith('/games/clusters');
  });
});
