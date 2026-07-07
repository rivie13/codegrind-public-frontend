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

const useResizableTerminal = ({ isResizable = true, defaultHeight = 300, terminalContentRef }) => {
  const [initialHeight, setInitialHeight] = useState(defaultHeight);
  const terminalContainerRef = useRef(null);
  const resizeStartRef = useRef(null);

  const handleResizeMove = useCallback(
    (event) => {
      if (!resizeStartRef.current || !isResizable) return;

      const clientY = getClientY(event);
      if (clientY === null) return;

      if (event?.type === 'touchmove' && event.cancelable) {
        event.preventDefault();
      }

      const deltaY = resizeStartRef.current.y - clientY;
      const newHeight = Math.max(
        150,
        Math.min(window.innerHeight * 0.8, resizeStartRef.current.height + deltaY)
      );

      setInitialHeight(newHeight);

      if (terminalContainerRef.current) {
        terminalContainerRef.current.style.height = `${newHeight}px`;
      }

      const parentElement = terminalContainerRef.current?.parentElement;
      if (parentElement) {
        parentElement.style.height = `${newHeight}px`;
      }
    },
    [isResizable]
  );

  const handleResizeEnd = useCallback(() => {
    resizeStartRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleResizeMove);
    document.removeEventListener('touchend', handleResizeEnd);
    document.removeEventListener('touchcancel', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback(
    (event) => {
      if (!isResizable) return;

      if (event?.cancelable) {
        event.preventDefault();
      }

      const clientY = getClientY(event);
      if (clientY === null) return;

      resizeStartRef.current = {
        y: clientY,
        height: initialHeight,
      };

      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
      document.addEventListener('touchcancel', handleResizeEnd);
      handleResizeMove(event);
    },
    [handleResizeEnd, handleResizeMove, initialHeight, isResizable]
  );

  useEffect(() => {
    const handleResize = () => {
      if (terminalContentRef?.current) {
        const maxHeight = window.innerHeight * 0.8;
        if (initialHeight > maxHeight) {
          setInitialHeight(maxHeight);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
      document.removeEventListener('touchcancel', handleResizeEnd);
    };
  }, [handleResizeEnd, handleResizeMove, initialHeight, terminalContentRef]);

  return {
    initialHeight,
    setInitialHeight,
    terminalContainerRef,
    handleResizeStart,
  };
};

export default useResizableTerminal;
