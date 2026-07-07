import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockToast = vi.hoisted(() => vi.fn());
const mockGetAll = vi.hoisted(() => vi.fn());

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

vi.mock('../../services/api.js', () => ({
  default: {
    aiProblems: {
      getAll: (...args) => mockGetAll(...args),
    },
  },
}));

vi.mock('../../utils/core/logger.js', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../components/layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('../../components/modals/ChallengeModal', () => ({
  default: () => null,
}));

vi.mock('../../components/layout/PaginationControls', () => ({
  default: () => <div data-testid="pagination-controls" />,
}));

import AIProblemsView from './AIProblemsView';

describe('AIProblemsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a warning toast when AI problem loading fails', async () => {
    mockGetAll.mockRejectedValue(new Error('load failed'));

    render(
      <MemoryRouter>
        <ChakraProvider>
          <AIProblemsView />
        </ChakraProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ai-problems-load-failed',
          title: 'AI problems unavailable',
          status: 'warning',
        })
      );
    });

    expect(screen.getByText('AI problem index unavailable')).toBeInTheDocument();
  });
});
