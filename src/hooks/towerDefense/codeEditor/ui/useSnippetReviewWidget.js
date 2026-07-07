import { useEffect, useRef, useState } from 'react';

const DEFAULT_WIDGET = { visible: false, top: 0, left: 0 };

const useSnippetReviewWidget = (editorRef) => {
  const [widgetState, setWidgetState] = useState(DEFAULT_WIDGET);
  const rangeRef = useRef(null);
  const scrollListenerRef = useRef(null);
  const autoAcceptTimeoutRef = useRef(null);
  const pendingVisibleRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateWidgetPosition = () => {
      const editor = editorRef.current;
      const range = rangeRef.current;
      if (!editor || !range) {
        setWidgetState((prev) => ({
          ...prev,
          visible: pendingVisibleRef.current,
          top: prev.top || 8,
          left: prev.left || 8,
        }));
        return;
      }

      const domNode = editor.getDomNode?.();
      const position = editor.getScrolledVisiblePosition?.({
        lineNumber: range.endLineNumber,
        column: range.endColumn,
      });

      if (!domNode || !position) {
        setWidgetState((prev) => ({
          ...prev,
          visible: pendingVisibleRef.current,
          top: prev.top || 8,
          left: prev.left || 8,
        }));
        return;
      }

      setWidgetState({
        visible: true,
        top: Math.max(6, position.top + position.height + 6),
        left: Math.max(8, position.left + 8),
      });
    };

    const disposeScrollListener = () => {
      if (scrollListenerRef.current?.dispose) {
        scrollListenerRef.current.dispose();
        scrollListenerRef.current = null;
      }
    };

    const clearAutoAccept = () => {
      if (autoAcceptTimeoutRef.current) {
        clearTimeout(autoAcceptTimeoutRef.current);
        autoAcceptTimeoutRef.current = null;
      }
    };

    const armAutoAccept = () => {
      clearAutoAccept();
      autoAcceptTimeoutRef.current = setTimeout(() => {
        const actions = typeof window !== 'undefined' ? window.__tdPendingSnippetActions : null;
        if (actions?.accept) {
          actions.accept({ auto: true, reason: 'timeout' });
        }
        autoAcceptTimeoutRef.current = null;
      }, 30000);
    };

    const syncFromPendingSnippet = () => {
      const pending = window.__tdPendingSnippet;
      const actions = window.__tdPendingSnippetActions;
      if (!pending && !actions) {
        pendingVisibleRef.current = false;
        rangeRef.current = null;
        setWidgetState((prev) => ({ ...prev, visible: false, top: 0, left: 0 }));
        clearAutoAccept();
        disposeScrollListener();
        return;
      }

      pendingVisibleRef.current = true;
      rangeRef.current = pending?.preview?.highlightRange || null;
      setWidgetState((prev) => ({
        ...prev,
        visible: true,
        top: prev.top || 8,
        left: prev.left || 8,
      }));
      updateWidgetPosition();
      armAutoAccept();
      disposeScrollListener();
      const editor = editorRef.current;
      if (editor?.onDidScrollChange) {
        scrollListenerRef.current = editor.onDidScrollChange(() => {
          updateWidgetPosition();
        });
      }
    };

    const handleReviewEvent = (event) => {
      const detail = event?.detail || {};
      if (detail.status === 'pending') {
        pendingVisibleRef.current = true;
        rangeRef.current = detail.range || null;
        setWidgetState((prev) => ({ ...prev, visible: true }));
        updateWidgetPosition();
        armAutoAccept();
        disposeScrollListener();
        const editor = editorRef.current;
        if (editor?.onDidScrollChange) {
          scrollListenerRef.current = editor.onDidScrollChange(() => {
            updateWidgetPosition();
          });
        }
        return;
      }

      if (detail.status === 'cleared') {
        pendingVisibleRef.current = false;
        rangeRef.current = null;
        setWidgetState((prev) => ({ ...prev, visible: false, top: 0, left: 0 }));
        clearAutoAccept();
        disposeScrollListener();
      }
    };

    syncFromPendingSnippet();

    window.addEventListener('td-snippet-review', handleReviewEvent);

    return () => {
      window.removeEventListener('td-snippet-review', handleReviewEvent);
      clearAutoAccept();
      disposeScrollListener();
    };
  }, [editorRef]);

  const handleAction = (action) => {
    if (typeof window === 'undefined') return;
    if (autoAcceptTimeoutRef.current) {
      clearTimeout(autoAcceptTimeoutRef.current);
      autoAcceptTimeoutRef.current = null;
    }
    const actions = window.__tdPendingSnippetActions;
    if (!actions) return;
    if (action === 'accept' || action === 'accept-edit') {
      actions.accept?.({});
    } else if (action === 'deny') {
      actions.deny?.();
    } else if (action === 'retry') {
      actions.retry?.();
    }
  };

  return {
    widgetState,
    handleAction,
  };
};

export default useSnippetReviewWidget;
