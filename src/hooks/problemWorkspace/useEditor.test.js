import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const matrixMocks = vi.hoisted(() => ({
  updateMatrixEffect: vi.fn(),
  startMatrixBomb: vi.fn(),
  stopMatrixBomb: vi.fn(),
}));

vi.mock('../animations/useMatrixBombEffect', () => ({
  useMatrixBombEffect: () => matrixMocks,
}));

import { useEditor } from './useEditor';

const setViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
};

const createMockEditor = ({ withModel = true, withPosition = true, lineNumber = 2 } = {}) => {
  const model = withModel
    ? {
        getLineCount: vi.fn(() => 2),
        getLineContent: vi.fn(() => 'abcd'),
        getLineMaxColumn: vi.fn(() => 5),
        applyEdits: vi.fn(),
      }
    : null;

  const editor = {
    getModel: vi.fn(() => model),
    getPosition: vi.fn(() => (withPosition ? { lineNumber, column: 1 } : null)),
    executeEdits: vi.fn(),
  };

  return { editor, model };
};

describe('useEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    setViewport(1280, 720);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('syncs code when initialCode prop changes', () => {
    const { result, rerender } = renderHook(({ initialCode }) => useEditor(initialCode), {
      initialProps: { initialCode: 'first' },
    });

    expect(result.current.code).toBe('first');

    rerender({ initialCode: 'second' });
    expect(result.current.code).toBe('second');
  });

  it('initializes editor cursor state and performs applyEdits bootstrapping', () => {
    const { result } = renderHook(() => useEditor('const x = 1;'));
    const { editor, model } = createMockEditor({ lineNumber: 2 });

    act(() => {
      result.current.setEditor(editor);
    });

    expect(result.current.currentLine).toBe(1);
    expect(model.applyEdits).toHaveBeenCalledTimes(2);
    expect(model.applyEdits.mock.calls[0][0][0].text).toBe(' ');
    expect(model.applyEdits.mock.calls[1][0][0].text).toBe('');
    expect(sessionStorage.getItem('editorInitializing')).toBeNull();
  });

  it('starts matrix bomb with high-res and standard refresh settings', () => {
    const { result } = renderHook(() => useEditor('print("hi")'));
    const { editor } = createMockEditor({ lineNumber: 3 });

    act(() => {
      result.current.setEditor(editor);
    });

    act(() => {
      result.current.setMatrixBombActive(true);
    });

    expect(matrixMocks.startMatrixBomb).toHaveBeenCalledWith(
      expect.objectContaining({
        editor,
        code: 'print("hi")',
        refreshInterval: 100,
        intensity: 1,
        visibleLineCount: 1,
      })
    );

    setViewport(2560, 1440);
    act(() => {
      result.current.setMatrixBombActive(false);
    });
    act(() => {
      result.current.setMatrixBombActive(true);
    });

    expect(matrixMocks.startMatrixBomb).toHaveBeenLastCalledWith(
      expect.objectContaining({
        editor,
        refreshInterval: 200,
      })
    );
    expect(matrixMocks.stopMatrixBomb).toHaveBeenCalled();
  });

  it('inserts random characters on interval and stops after unmount', () => {
    vi.useFakeTimers();

    const { result, unmount } = renderHook(() => useEditor('code'));
    const { editor } = createMockEditor({ lineNumber: 1 });
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0);

    act(() => {
      result.current.setEditor(editor);
      result.current.setShouldAddRandomChars(true);
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(editor.executeEdits).toHaveBeenCalledTimes(1);
    const [source, edits] = editor.executeEdits.mock.calls[0];
    expect(source).toBe('random-chars');
    expect(edits[0].text).toBe('!');

    unmount();
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(editor.executeEdits).toHaveBeenCalledTimes(1);

    randomSpy.mockRestore();
  });

  it('skips random insertion when model or cursor position is missing', () => {
    vi.useFakeTimers();
    const { result: noModelResult } = renderHook(() => useEditor('code'));
    const { editor: noModelEditor } = createMockEditor({ withModel: false });

    act(() => {
      noModelResult.current.setEditor(noModelEditor);
      noModelResult.current.setShouldAddRandomChars(true);
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(noModelEditor.executeEdits).not.toHaveBeenCalled();

    const { result: noPosResult } = renderHook(() => useEditor('code'));
    const { editor: noPosEditor } = createMockEditor({ withPosition: false });
    act(() => {
      noPosResult.current.setEditor(noPosEditor);
      noPosResult.current.setShouldAddRandomChars(true);
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(noPosEditor.executeEdits).not.toHaveBeenCalled();
  });
});
