import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMatrixBombEffect } from './useMatrixBombEffect';

const createMockEditor = ({ throwLineLength = false } = {}) => {
  const decorations = {
    set: vi.fn(),
    clear: vi.fn(),
  };

  const model = {
    getLineCount: vi.fn(() => 3),
    getLineLength: vi.fn((line) => {
      if (throwLineLength && line === 2) {
        throw new Error('line error');
      }
      return 10;
    }),
    getLineMaxColumn: vi.fn(() => 20),
  };

  const editor = {
    createDecorationsCollection: vi.fn(() => decorations),
    getModel: vi.fn(() => model),
    getPosition: vi.fn(() => ({ lineNumber: 2 })),
  };

  return { editor, model, decorations };
};

describe('useMatrixBombEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates decorations and skips visible lines in updateMatrixEffect', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const { editor, decorations } = createMockEditor();

    act(() => {
      result.current.updateMatrixEffect(editor, 'code', 2, 1, 1);
    });

    expect(editor.createDecorationsCollection).toHaveBeenCalledTimes(1);
    expect(decorations.set).toHaveBeenCalledTimes(1);

    const payload = decorations.set.mock.calls[0][0];
    expect(payload.length).toBeGreaterThan(0);
    expect(payload.every((d) => d.range.startLineNumber !== 2)).toBe(true);
  });

  it('handles line-generation errors and keeps processing other lines', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const { editor, decorations } = createMockEditor({ throwLineLength: true });

    act(() => {
      result.current.updateMatrixEffect(editor, 'code', 1, 1, 1);
    });

    expect(decorations.set).toHaveBeenCalledTimes(1);
    const payload = decorations.set.mock.calls[0][0];
    expect(payload.some((d) => d.range.startLineNumber === 2)).toBe(false);
  });

  it('returns early when model is unavailable', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const editor = {
      createDecorationsCollection: vi.fn(() => ({ set: vi.fn(), clear: vi.fn() })),
      getModel: vi.fn(() => null),
      getPosition: vi.fn(() => ({ lineNumber: 1 })),
    };

    act(() => {
      result.current.updateMatrixEffect(editor, 'code', 1);
    });

    const collection = editor.createDecorationsCollection.mock.results[0].value;
    expect(collection.set).not.toHaveBeenCalled();
  });

  it('starts interval updates and stops/clears decorations', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const { editor, decorations } = createMockEditor();

    act(() => {
      result.current.startMatrixBomb({
        editor,
        code: 'const x = 1;',
        intensity: 1,
        refreshInterval: 50,
        visibleLineCount: 1,
      });
    });

    expect(decorations.set).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(decorations.set).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.stopMatrixBomb();
    });
    expect(decorations.clear).toHaveBeenCalled();
  });

  it('no-ops startMatrixBomb when editor or code are missing', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const { editor, decorations } = createMockEditor();

    act(() => {
      result.current.startMatrixBomb({ editor: null, code: 'abc' });
      result.current.startMatrixBomb({ editor, code: '' });
    });

    expect(decorations.set).not.toHaveBeenCalled();
  });

  it('clears prior decorations when switching editors in updateMatrixEffect', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const first = createMockEditor();
    const second = createMockEditor();

    act(() => {
      result.current.updateMatrixEffect(first.editor, 'code', 1);
    });
    expect(first.decorations.clear).not.toHaveBeenCalled();

    act(() => {
      result.current.updateMatrixEffect(second.editor, 'code', 1);
    });

    expect(first.decorations.clear).toHaveBeenCalledTimes(1);
    expect(second.decorations.set).toHaveBeenCalled();
  });

  it('restarts interval and clears previous editor state when startMatrixBomb switches editors', () => {
    const { result } = renderHook(() => useMatrixBombEffect());
    const first = createMockEditor();
    const second = createMockEditor();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    act(() => {
      result.current.startMatrixBomb({
        editor: first.editor,
        code: 'first',
        refreshInterval: 100,
      });
    });

    second.editor.getPosition.mockReturnValue(null);
    act(() => {
      result.current.startMatrixBomb({
        editor: second.editor,
        code: 'second',
        refreshInterval: 100,
      });
    });

    expect(first.decorations.clear).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(second.decorations.set).toHaveBeenCalled();
  });

  it('handles stopMatrixBomb when no interval/decorations are active', () => {
    const { result } = renderHook(() => useMatrixBombEffect());

    expect(() => {
      act(() => {
        result.current.stopMatrixBomb();
      });
    }).not.toThrow();
  });

  it('cleans up timers and decorations on unmount', () => {
    const { result, unmount } = renderHook(() => useMatrixBombEffect());
    const { editor, decorations } = createMockEditor();

    act(() => {
      result.current.startMatrixBomb({
        editor,
        code: 'let a = 1;',
        refreshInterval: 100,
      });
    });

    unmount();
    expect(decorations.clear).toHaveBeenCalled();
  });
});
