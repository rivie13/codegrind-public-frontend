import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../../components/towerDefense/onboarding/useInlineTowerDefenseOnboardingStep',
  () => ({
    default: () => null,
  })
);

vi.mock('../../../../components/towerDefense/ui', () => ({
  TowerDefenseProblemPanel: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../../hooks/guest/useGuestFunnel', () => ({
  default: () => ({ problemOpened: vi.fn() }),
}));

import ProblemPanelContent from './ProblemPanelContent';

describe('ProblemPanelContent multi-task states', () => {
  it('lists each task with an explicit done or needed state', () => {
    render(
      <ChakraProvider>
        <ProblemPanelContent
          problem={{}}
          problemDescription=""
          currentWave={1}
          totalWaves={3}
          isMissionComplete={false}
          isHomepageDemo={false}
          problemTabs={[
            { slug: 'first-task', title: 'First task' },
            { slug: 'second-task', title: 'Second task' },
          ]}
          problemTabStatuses={[{ slug: 'first-task', done: true }]}
          activeProblemIndex={0}
          onProblemTabChange={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByRole('tab', { name: /done: first task/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /needed: second task/i })).toBeInTheDocument();
  });
});
