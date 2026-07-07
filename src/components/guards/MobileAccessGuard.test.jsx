import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import MobileAccessGuard from './MobileAccessGuard';

const renderGuard = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MobileAccessGuard />}>
          <Route path="*" element={<div data-testid="guard-outlet">Allowed Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('MobileAccessGuard', () => {
  it('allows SEO practice guide routes', () => {
    renderGuard('/coding-interview-practice');

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
  });

  it('allows tower defense routes', () => {
    renderGuard('/games/tower-defense/exploit-chrono-arbitrage-vulnerability-stock-exchange');

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
  });

  it('allows coding problem list routes', () => {
    renderGuard('/problems');

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
  });

  it('allows coding problem workspace routes', () => {
    renderGuard('/problems/two-sum');

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
  });

  it('allows AI problem workspace routes', () => {
    renderGuard('/ai-problems/create');

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
  });
});
