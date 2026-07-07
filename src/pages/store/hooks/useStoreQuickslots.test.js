import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useStoreQuickslots, {
  buildQuickslotStorageKey,
  createEmptyQuickslots,
} from './useStoreQuickslots';
import { readStorage, writeStorage } from '../../../utils/web/storage';

vi.mock('../../../utils/web/storage', () => ({
  readStorage: vi.fn(),
  writeStorage: vi.fn(),
}));

describe('useStoreQuickslots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds user and anonymous storage keys', () => {
    expect(buildQuickslotStorageKey(42)).toBe('cg-store-quickslots:42');
    expect(buildQuickslotStorageKey(undefined)).toBe('cg-store-quickslots:anonymous');
  });

  it('loads empty quickslots when storage is empty', async () => {
    readStorage.mockReturnValue(null);

    const { result } = renderHook(() => useStoreQuickslots(42));

    await waitFor(() => {
      expect(readStorage).toHaveBeenCalledWith('localStorage', 'cg-store-quickslots:42');
    });

    await waitFor(() => {
      expect(writeStorage).toHaveBeenCalledWith(
        'localStorage',
        'cg-store-quickslots:42',
        JSON.stringify(createEmptyQuickslots())
      );
    });

    expect(result.current.quickslots).toEqual(createEmptyQuickslots());
  });

  it('normalizes stored quickslots and persists updates', async () => {
    readStorage.mockReturnValue(
      JSON.stringify({
        editor: [{ themeId: 'neon' }],
        td: [null, { towerPackId: 'ember' }],
      })
    );

    const { result } = renderHook(() => useStoreQuickslots('user-1'));

    await waitFor(() => {
      expect(result.current.quickslots.editor[0]).toEqual({ themeId: 'neon' });
    });

    expect(result.current.quickslots.editor).toHaveLength(3);
    expect(result.current.quickslots.td[1]).toEqual({ towerPackId: 'ember' });
    expect(result.current.quickslots.profile).toEqual([null, null, null]);

    act(() => {
      result.current.setQuickslots((prev) => ({
        ...prev,
        profile: [{ badgeId: 'legend' }, null, null],
      }));
    });

    await waitFor(() => {
      expect(writeStorage).toHaveBeenLastCalledWith(
        'localStorage',
        'cg-store-quickslots:user-1',
        JSON.stringify({
          editor: [{ themeId: 'neon' }, null, null],
          td: [null, { towerPackId: 'ember' }, null],
          profile: [{ badgeId: 'legend' }, null, null],
        })
      );
    });
  });

  it('falls back to empty quickslots when storage JSON is invalid', async () => {
    readStorage.mockReturnValue('not-json');

    const { result } = renderHook(() => useStoreQuickslots('broken'));

    await waitFor(() => {
      expect(result.current.quickslots).toEqual(createEmptyQuickslots());
    });

    expect(writeStorage).toHaveBeenCalledWith(
      'localStorage',
      'cg-store-quickslots:broken',
      JSON.stringify(createEmptyQuickslots())
    );
  });
});
