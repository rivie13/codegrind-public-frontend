import { useCallback, useEffect, useRef, useState } from 'react';
import { useMatrixBombEffect } from '../animations/useMatrixBombEffect';
//import the timer from useTimer.js

export function useEditor(initialCode = '') {
    const [code, setCode] = useState(initialCode);
    const [matrixBombActive, setMatrixBombActive] = useState(false);
    const [currentLine, setCurrentLine] = useState(0);
    const [editor, setEditor] = useState(null);
    const [shouldAddRandomChars, setShouldAddRandomChars] = useState(false);
    const randomCharsIntervalRef = useRef(null);
    const { updateMatrixEffect, startMatrixBomb, stopMatrixBomb } = useMatrixBombEffect();

    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
        }
    }, [initialCode]);

    // Random characters effect
    useEffect(() => {
        if (shouldAddRandomChars && editor) {
            const insertRandomChar = () => {
                const model = editor.getModel();
                if (!model) return;

                const position = editor.getPosition();
                if (!position) return;

                const lineCount = model.getLineCount();
                const randomLine = Math.floor(Math.random() * lineCount) + 1;
                const lineContent = model.getLineContent(randomLine);
                const randomCol = Math.floor(Math.random() * (lineContent.length + 1)) + 1;
                const randomChar = String.fromCharCode(33 + Math.floor(Math.random() * 94));

                const range = {
                    startLineNumber: randomLine,
                    startColumn: randomCol,
                    endLineNumber: randomLine,
                    endColumn: randomCol
                };

                editor.executeEdits('random-chars', [{
                    range: range,
                    text: randomChar,
                    forceMoveMarkers: true
                }]);
            };

            randomCharsIntervalRef.current = setInterval(insertRandomChar, 10000);

            return () => {
                if (randomCharsIntervalRef.current) {
                    clearInterval(randomCharsIntervalRef.current);
                }
            };
        }
    }, [shouldAddRandomChars, editor]);

    const handleEditorChange = useCallback((value) => {
        if (value) {
            setCode(value);
            if (matrixBombActive && editor) {
                const position = editor.getPosition();
                const currentLineNumber = position ? position.lineNumber : 1;
                updateMatrixEffect(editor, value, currentLineNumber);
                setCurrentLine(currentLineNumber - 1);
            }
        }
    }, [matrixBombActive, editor, updateMatrixEffect]);

    useEffect(() => {
        if (matrixBombActive && editor && code) {
            // For matrix effect, reduce interval frequency on higher resolutions
            // to improve performance while maintaining the effect
            const isHighRes = window.innerWidth > 1920 || window.innerHeight > 1080;
            const refreshInterval = isHighRes ? 200 : 100; // Slower refresh on high-res

            startMatrixBomb({
                editor,
                code,
                intensity: 1,
                refreshInterval,
                visibleLineCount: 1
            });

            return () => {
                stopMatrixBomb();
            };
        }

        stopMatrixBomb();
    }, [matrixBombActive, editor, code, startMatrixBomb, stopMatrixBomb]);

    // Add this effect to handle editor initialization for all modes
    useEffect(() => {
        if (editor && !matrixBombActive) {  // Only for non-matrix bomb modes
            // Force an initial cursor position update to initialize editor
            const position = editor.getPosition();
            const currentLineNumber = position ? position.lineNumber : 1;
            setCurrentLine(currentLineNumber - 1);
            
            // Add a space at the end to trigger editor initialization
            const model = editor.getModel();
            if (model) {
                const lastLine = model.getLineCount();
                const lastColumn = model.getLineMaxColumn(lastLine);
                
                // Set a flag in sessionStorage to indicate initialization
                sessionStorage.setItem('editorInitializing', 'true');
                
                model.applyEdits([{
                    range: {
                        startLineNumber: lastLine,
                        startColumn: lastColumn,
                        endLineNumber: lastLine,
                        endColumn: lastColumn
                    },
                    text: ' '
                }]);
                // Immediately remove the space
                model.applyEdits([{
                    range: {
                        startLineNumber: lastLine,
                        startColumn: lastColumn,
                        endLineNumber: lastLine,
                        endColumn: lastColumn + 1
                    },
                    text: ''
                }]);
                
                // Clear the initialization flag
                sessionStorage.removeItem('editorInitializing');
            }
        }
    }, [editor, code, matrixBombActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (randomCharsIntervalRef.current) {
                clearInterval(randomCharsIntervalRef.current);
                randomCharsIntervalRef.current = null;
            }
        };
    }, []);

    return {
        code,
        setCode,
        editor,
        setEditor,
        matrixBombActive,
        setMatrixBombActive,
        currentLine,
        setCurrentLine,
        shouldAddRandomChars,
        setShouldAddRandomChars,
        updateMatrixEffect
    };
} 