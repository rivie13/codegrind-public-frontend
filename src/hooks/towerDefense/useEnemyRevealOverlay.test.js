import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import useEnemyRevealOverlay from './useEnemyRevealOverlay';

const STORAGE_KEY = 'codegrind_seen_enemy_types';

describe('useEnemyRevealOverlay', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('marks newly surfaced enemy intel as seen before the overlay is dismissed', async () => {
    const { result } = renderHook(() =>
      useEnemyRevealOverlay({
        gameState: { status: 'prehack', wave: 1 },
        playerLevel: 1,
        disabled: false,
      })
    );

    await waitFor(() => {
      expect(result.current.activeEnemyReveal?.enemies).toHaveLength(1);
    });

    expect(result.current.activeEnemyReveal?.enemies[0]?.type).toBe('basic');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')).toContain('basic');
  });
});
