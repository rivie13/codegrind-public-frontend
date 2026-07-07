import { useCallback, useEffect, useRef, useState } from 'react';

const getClientY = (event) => {
  if (typeof event?.clientY === 'number') {
    return event.clientY;
  }

  if (event?.touches?.length) {
    return event.touches[0].clientY;
  }

  if (event?.changedTouches?.length) {
    return event.changedTouches[0].clientY;
  }

  return null;
};

const useEditorSplitPane = () => {
  const [editorHeight, setEditorHeight] = useState('70%');
  const [terminalHeight, setTerminalHeight] = useState('30%');
  const resizeHandleRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef(null);

  const handleResizeMove = useCallback((event) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    if (
      typeof event?.pointerId === 'number' &&
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return;
    }

    const clientY = getClientY(event);
    if (clientY === null) return;

    if ((event?.type === 'touchmove' || event?.type === 'pointermove') && event.cancelable) {
      event.preventDefault();
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    if (!containerHeight) return;

    const relativeY = clientY - containerRect.top;

    const editorPercent = Math.max(20, Math.min(80, (relativeY / containerHeight) * 100));
    const terminalPercent = 100 - editorPercent;

    setEditorHeight(`${editorPercent}%`);
    setTerminalHeight(`${terminalPercent}%`);
  }, []);

  const handleResizeEnd = useCallback(() => {
    isDraggingRef.current = false;
    const activePointerId = activePointerIdRef.current;
    activePointerIdRef.current = null;

    if (
      typeof activePointerId === 'number' &&
      resizeHandleRef.current?.hasPointerCapture?.(activePointerId)
    ) {
      resizeHandleRef.current.releasePointerCapture(activePointerId);
    }

    document.removeEventListener('pointermove', handleResizeMove);
    document.removeEventListener('pointerup', handleResizeEnd);
    document.removeEventListener('pointercancel', handleResizeEnd);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleResizeMove);
    document.removeEventListener('touchend', handleResizeEnd);
    document.removeEventListener('touchcancel', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback(
    (event) => {
      if (
        typeof window !== 'undefined' &&
        'PointerEvent' in window &&
        (event?.type === 'mousedown' || event?.type === 'touchstart')
      ) {
        return;
      }

      if (event?.cancelable) {
        event.preventDefault();
      }

      if (typeof event?.stopPropagation === 'function') {
        event.stopPropagation();
      }

      isDraggingRef.current = true;
      activePointerIdRef.current = typeof event?.pointerId === 'number' ? event.pointerId : null;

      if (
        typeof event?.pointerId === 'number' &&
        typeof event?.currentTarget?.setPointerCapture === 'function'
      ) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      document.addEventListener('pointermove', handleResizeMove, { passive: false });
      document.addEventListener('pointerup', handleResizeEnd);
      document.addEventListener('pointercancel', handleResizeEnd);
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
      document.addEventListener('touchcancel', handleResizeEnd);
      handleResizeMove(event);
    },
    [handleResizeEnd, handleResizeMove]
  );

  useEffect(() => {
    const preventSelection = (e) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener('selectstart', preventSelection);
    return () => {
      isDraggingRef.current = false;
      activePointerIdRef.current = null;
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('pointercancel', handleResizeEnd);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
      document.removeEventListener('touchcancel', handleResizeEnd);
      document.removeEventListener('selectstart', preventSelection);
    };
  }, [handleResizeEnd, handleResizeMove]);

  return {
    editorHeight,
    terminalHeight,
    containerRef,
    resizeHandleRef,
    handleResizeStart,
  };
};

export default useEditorSplitPane;
