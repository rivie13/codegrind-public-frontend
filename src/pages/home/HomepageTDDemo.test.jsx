import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockTowerDefensePage = vi.hoisted(() => vi.fn(() => <div data-testid="td-page" />));

vi.mock('../games/towerDefenseV2/TowerDefenseV2Page', () => ({
  default: (props) => mockTowerDefensePage(props),
}));

import HomepageTDDemo from './HomepageTDDemo';

describe('HomepageTDDemo', () => {
  it('passes the canonical hello-print learning node metadata to the embedded tower demo', async () => {
    const onLearningXp = vi.fn();

    render(
      <ChakraProvider>
        <HomepageTDDemo onLearningXp={onLearningXp} />
      </ChakraProvider>
    );

    expect(await screen.findByTestId('td-page', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(mockTowerDefensePage).toHaveBeenCalledWith(
      expect.objectContaining({
        learningPathSlug: 'python-path',
        learningPathTitleSlug: 'lp-m0-td-hello-print',
        onEmbeddedLearningXp: expect.any(Function),
        learningPathMeta: expect.objectContaining({
          pathId: 'python-path',
          nodeId: 'py-m0-tower-hello',
          moduleId: 'py-m0-hello',
        }),
      })
    );

    const embeddedProps = mockTowerDefensePage.mock.calls[0]?.[0];
    const samplePayload = { xp: { awarded: 10 } };

    embeddedProps.onEmbeddedLearningXp(samplePayload);
    expect(onLearningXp).toHaveBeenCalledWith(samplePayload);
  });

  it('holds the city handoff briefly before starting the typed boot intro', async () => {
    vi.useFakeTimers();

    try {
      render(
        <ChakraProvider>
          <HomepageTDDemo bootPrepDelayMs={900} />
        </ChakraProvider>
      );

      const demoRoot = document.querySelector('[data-tutorial="homepage-demo-root"]');

      expect(demoRoot).toHaveAttribute('data-boot-overlay-stage', 'warmup');

      expect(screen.getByText('Stabilizing demo shell...')).toBeInTheDocument();
      expect(
        screen.getByText('Holding the boot sequence until the mission surface settles.')
      ).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(899);
      });

      expect(demoRoot).toHaveAttribute('data-boot-overlay-stage', 'warmup');
      expect(screen.getByText('Stabilizing demo shell...')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(demoRoot).toHaveAttribute('data-boot-overlay-stage', 'intro');
    } finally {
      vi.useRealTimers();
    }
  });

  it('forwards handheld page scroll mode into the embedded tower demo', async () => {
    render(
      <ChakraProvider>
        <HomepageTDDemo allowEmbeddedHandheldPageScroll />
      </ChakraProvider>
    );

    expect(await screen.findByTestId('td-page', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(mockTowerDefensePage).toHaveBeenCalledWith(
      expect.objectContaining({
        allowEmbeddedHandheldPageScroll: true,
      })
    );
  });
});
