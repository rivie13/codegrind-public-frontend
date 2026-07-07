import { useCallback, useEffect, useRef } from 'react';

export function useMatrixBombEffect() {
  const decorationsRef = useRef(null);
  const intervalRef = useRef(null);
  const editorRef = useRef(null);

  const updateMatrixEffect = useCallback((editor, code, currentLineNumber, intensity = 1, visibleLineCount = 1) => {
    if (editorRef.current && editorRef.current !== editor) {
      if (decorationsRef.current) {
        decorationsRef.current.clear();
        decorationsRef.current = null;
      }
    }
    editorRef.current = editor;
    if (!decorationsRef.current && editor) {
      decorationsRef.current = editor.createDecorationsCollection();
    }

    if (!decorationsRef.current || !editor || !editor.getModel()) return;

    const model = editor.getModel();
    const totalLines = model.getLineCount();
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    const normalizedVisibleLines = Math.max(1, Math.floor(visibleLineCount));
    const extraLines = normalizedVisibleLines - 1;
    const beforeLines = Math.floor(extraLines / 2);
    const afterLines = Math.ceil(extraLines / 2);
    const visibleStart = Math.max(1, currentLineNumber - beforeLines);
    const visibleEnd = Math.min(totalLines, currentLineNumber + afterLines);

    // Adjust matrix effect density based on intensity
    const density = 0.5 * clampedIntensity; // Lower intensity = fewer matrix characters

    const decorationArray = Array.from({ length: totalLines }, (_, index) => {
      const lineNumber = index + 1;
      if (lineNumber >= visibleStart && lineNumber <= visibleEnd) {
        return null;
      }

      try {
        // Adjust line length based on intensity
        const lineLength = Math.max(model.getLineLength(index + 1) * 2 * clampedIntensity, 80);

        // Adjust matrix text density based on intensity
        const matrixText = Array(Math.floor(lineLength))
          .fill(0)
          .map(() => (Math.random() < density ? (Math.random() < 0.5 ? '0' : '1') : ' '))
          .join('');

        return {
          range: {
                    startLineNumber: lineNumber,
            startColumn: 1,
                    endLineNumber: lineNumber,
                    endColumn: Math.max(model.getLineMaxColumn(lineNumber), 80)
          },
          options: {
            isWholeLine: true,
            className: 'matrix-line',
            inlineClassName: `matrix-char matrix-intensity-${Math.floor(clampedIntensity * 10)}`,
            before: {
              content: matrixText,
              inlineClassName: `matrix-overlay matrix-intensity-${Math.floor(clampedIntensity * 10)}`
            }
          }
        };
      } catch (error) {
        return null;
      }
    }).filter(Boolean);

    decorationsRef.current.set(decorationArray);
  }, []);

  const startMatrixBomb = useCallback(({
    editor,
    code,
    intensity = 1,
    refreshInterval = 100,
    visibleLineCount = 1
  }) => {
    if (!editor || !code) return;

    if (editorRef.current && editorRef.current !== editor) {
      if (decorationsRef.current) {
        decorationsRef.current.clear();
        decorationsRef.current = null;
      }
    }
    editorRef.current = editor;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const position = editor.getPosition();
    const currentLineNumber = position ? position.lineNumber : 1;
    updateMatrixEffect(editor, code, currentLineNumber, intensity, visibleLineCount);

    intervalRef.current = setInterval(() => {
      const pos = editor.getPosition();
      const lineNum = pos ? pos.lineNumber : 1;
      updateMatrixEffect(editor, code, lineNum, intensity, visibleLineCount);
    }, refreshInterval);
  }, [updateMatrixEffect]);

  const stopMatrixBomb = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (decorationsRef.current) {
        decorationsRef.current.clear();
        decorationsRef.current = null;
      }
      editorRef.current = null;
    };
  }, []);

  return {
    updateMatrixEffect,
    startMatrixBomb,
    stopMatrixBomb
  };
}
