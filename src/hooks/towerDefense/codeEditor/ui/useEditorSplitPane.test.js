import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useEditorSplitPane from './useEditorSplitPane';

const createPointerEvent = (type, { clientY, pointerId = 1 } = {}) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientY: { configurable: true, value: clientY },
    pointerId: { configurable: true, value: pointerId },
  });
  return event;
};

describe('useEditorSplitPane', () => {
  const originalPointerEvent = window.PointerEvent;

  beforeEach(() => {
    window.PointerEvent = window.PointerEvent || function PointerEvent() {};
  });

  afterEach(() => {
    window.PointerEvent = originalPointerEvent;
  });

  it('updates the split heights from pointer dragging', () => {
    const { result } = renderHook(() => useEditorSplitPane());

    result.current.containerRef.current = {
      getBoundingClientRect: () => ({ top: 100, height: 400 }),
    };

    const setPointerCapture = vi.fn();

    act(() => {
      result.current.handleResizeStart({
        type: 'pointerdown',
        clientY: 220,
        pointerId: 9,
        cancelable: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: { setPointerCapture },
      });
    });

    act(() => {
      document.dispatchEvent(createPointerEvent('pointermove', { clientY: 420, pointerId: 9 }));
    });

    expect(result.current.editorHeight).toBe('80%');
    expect(result.current.terminalHeight).toBe('20%');
    expect(setPointerCapture).toHaveBeenCalledWith(9);

    act(() => {
      document.dispatchEvent(createPointerEvent('pointerup', { clientY: 420, pointerId: 9 }));
    });
  });
});
