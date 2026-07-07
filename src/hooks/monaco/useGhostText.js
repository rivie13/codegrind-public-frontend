/**
 * useGhostText — registers a Monaco InlineCompletionsProvider that shows
 * faded "ghost text" (like Copilot suggestions) for a known solution.
 *
 * Supports multi-line solutions with proper indentation and trims
 * auto-paired characters (closing brackets/quotes) to avoid duplicates
 * on Tab-accept.
 *
 * Uses window.__tdMonaco / window.__tdMonacoEditor globals set by
 * CodeEditorPanel in the tower-defense layout.
 *
 * @param {object}  opts
 * @param {boolean} opts.enabled   — whether ghost text should be active
 * @param {string}  opts.solution  — the full expected answer (may contain \n)
 * @param {string}  [opts.language] — Monaco language id (default: 'python')
 */
import { useEffect, useRef } from 'react';

/**
 * Trim suffix of `text` that is already present right after the cursor
 * (e.g. auto-paired closing bracket/quote). Prevents duplicate chars on Tab-accept.
 */
function trimAutopairedSuffix(text, textAfterCursor) {
  if (!textAfterCursor) return text;
  for (let len = Math.min(text.length, textAfterCursor.length); len > 0; len--) {
    if (text.endsWith(textAfterCursor.slice(0, len))) {
      return text.slice(0, text.length - len);
    }
  }
  return text;
}

export default function useGhostText({ enabled = true, solution = '', language = 'python' }) {
  const disposableRef = useRef(null);
  const answerStartLineRef = useRef(null);

  useEffect(() => {
    if (!enabled || !solution) {
      disposableRef.current?.dispose();
      disposableRef.current = null;
      return;
    }

    const answerLines = solution.split('\n');
    const triggerTimers = [];

    const trySetup = () => {
      const monaco = window.__tdMonaco;
      const editor = window.__tdMonacoEditor;
      if (!monaco || !editor) return false;

      /* Guard: editor must be in a visible, properly-sized panel.
       * The SlottableLayout portals off-screen panels into a hidden 1×1px
       * fixed box.  Returning false lets the retry interval re-try once
       * React has re-rendered the panel switch. */
      const containerDom = editor.getContainerDomNode?.() || editor.getDomNode?.();
      if (containerDom) {
        const { width, height } = containerDom.getBoundingClientRect();
        if (width < 10 || height < 10) return false;
      }

      /* --- a) Position cursor and anchor line for answer insertion ----- */
      const model = editor.getModel();
      let indent = '    ';
      let anchorFromBrace = false;
      if (model) {
        const fullText = model.getValue();
        const lines = fullText.split('\n');
        let answerStartLine = -1;

        // 1. Python: `pass` placeholder — replace it with blank indented line.
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === 'pass') {
            answerStartLine = i + 1; // 1-indexed, same line — we'll clear `pass` below.
            break;
          }
        }

        // 2. Comment-style placeholder (// TODO ..., // Your solution here, etc.).
        //    Keep the comment as a visible hint; insert a blank line BELOW it and
        //    position the cursor there so ghost text appears under the comment.
        if (answerStartLine < 1) {
          const placeholderRe =
            /your solution here|write your code here|write code here|add your code|\/\/.*todo/i;
          for (let i = 0; i < lines.length; i++) {
            if (placeholderRe.test(lines[i])) {
              const commentLineNum = i + 1; // 1-indexed
              const commentContent = lines[i];
              const commentIndent = commentContent.match(/^(\s*)/)?.[1] || '';
              const nextLineContent = lines[i + 1] ?? '';
              // Insert a blank indented line below the comment unless one already exists.
              if (nextLineContent.trim() !== '') {
                editor.executeEdits('onboarding', [
                  {
                    range: {
                      startLineNumber: commentLineNum,
                      startColumn: commentContent.length + 1,
                      endLineNumber: commentLineNum,
                      endColumn: commentContent.length + 1,
                    },
                    text: '\n' + commentIndent,
                  },
                ]);
              }
              answerStartLine = commentLineNum + 1; // line below the comment
              indent = commentIndent;
              break;
            }
          }
        }

        // 3. Non-Python fallback: last opening brace → first blank line inside block.
        if (answerStartLine < 1 && language !== 'python') {
          let lastBraceLineIdx = -1;
          for (let i = 0; i < lines.length; i++) {
            if (/\{\s*$/.test(lines[i])) {
              lastBraceLineIdx = i;
            }
          }
          if (lastBraceLineIdx >= 0 && lastBraceLineIdx + 1 < lines.length) {
            const braceIndent = lines[lastBraceLineIdx].match(/^(\s*)/)?.[1] || '';
            indent = braceIndent + '    ';
            anchorFromBrace = true;
            for (let i = lastBraceLineIdx + 1; i < lines.length; i++) {
              if (/^\s*[}\]];?\s*$/.test(lines[i])) break;
              if (lines[i].trim() === '') {
                answerStartLine = i + 1;
                break;
              }
            }
            if (answerStartLine < 1) {
              answerStartLine = lastBraceLineIdx + 2;
            }
          }
        }

        // 4. Final fallback: current cursor line.
        if (answerStartLine < 1) {
          answerStartLine = editor.getPosition?.()?.lineNumber || 1;
        }

        // Re-read lines after any executeEdits above (model may have changed).
        const currentLines = editor.getModel()?.getValue().split('\n') ?? lines;
        const lineContent = currentLines[answerStartLine - 1] || '';

        // Derive indent from the anchor line itself unless already set from brace/comment.
        if (!anchorFromBrace && indent === '    ') {
          indent = lineContent.match(/^(\s*)/)?.[1] || indent;
        }

        // Clear `pass` for Python (comment placeholders stay as hints).
        if (lineContent.trim() === 'pass') {
          editor.executeEdits('onboarding', [
            {
              range: {
                startLineNumber: answerStartLine,
                startColumn: 1,
                endLineNumber: answerStartLine,
                endColumn: lineContent.length + 1,
              },
              text: indent,
            },
          ]);
        }

        answerStartLineRef.current = answerStartLine;
        editor.setPosition({ lineNumber: answerStartLine, column: indent.length + 1 });
        editor.focus();
      }

      const capturedIndent = indent;

      /* --- b) Register InlineCompletionsProvider ---------------------- */
      const disposable = monaco.languages.registerInlineCompletionsProvider(language, {
        provideInlineCompletions(m, position) {
          const startLine = answerStartLineRef.current;
          if (!startLine) return { items: [] };

          const lineIndex = position.lineNumber - startLine;
          if (lineIndex < 0 || lineIndex >= answerLines.length) {
            return { items: [] };
          }

          const currentAnswerLine = answerLines[lineIndex];
          const textBeforeCursor = m
            .getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            })
            .trimStart();

          let currentLineRemainder;
          if (textBeforeCursor.length === 0) {
            currentLineRemainder = currentAnswerLine;
          } else if (currentAnswerLine.startsWith(textBeforeCursor)) {
            currentLineRemainder = currentAnswerLine.slice(textBeforeCursor.length);
          } else {
            return { items: [] };
          }

          // Strip auto-paired chars already present after cursor
          const lineLength = m.getLineLength(position.lineNumber);
          const textAfterCursor = m.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: lineLength + 1,
          });
          const trimmedRemainder = trimAutopairedSuffix(currentLineRemainder, textAfterCursor);

          // Append remaining answer lines (with indentation)
          const remainingLines = answerLines.slice(lineIndex + 1);
          const fullSuggestion =
            trimmedRemainder +
            (remainingLines.length > 0
              ? '\n' + remainingLines.map((l) => capturedIndent + l).join('\n')
              : '');

          if (!fullSuggestion) return { items: [] };

          return {
            items: [
              {
                insertText: fullSuggestion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              },
            ],
          };
        },
        freeInlineCompletions() {},
      });

      // Re-trigger inline suggestion on every keystroke so partial-typing
      // suggestions (e.g. user types "cout" or "System.o") always show.
      const contentChangeDisposable = editor.onDidChangeModelContent(() => {
        try {
          editor.trigger('onboarding', 'editor.action.inlineSuggest.trigger', {});
        } catch {
          /* safe to ignore */
        }
      });

      disposableRef.current = {
        dispose() {
          disposable.dispose();
          contentChangeDisposable.dispose();
        },
      };

      /* --- c) Trigger inline suggestion so ghost text shows immediately */
      const triggerGhost = () => {
        try {
          editor.layout();
          editor.focus();
          editor.trigger('onboarding', 'editor.action.inlineSuggest.trigger', {});
        } catch {
          /* editor may not support trigger — safe to ignore */
        }
      };
      triggerTimers.push(setTimeout(triggerGhost, 50));
      triggerTimers.push(setTimeout(triggerGhost, 200));
      triggerTimers.push(setTimeout(triggerGhost, 500));
      triggerTimers.push(setTimeout(triggerGhost, 1000));

      return true;
    };

    // Monaco may not be mounted yet (or may be in hidden portal); retry
    if (!trySetup()) {
      const retryInterval = setInterval(() => {
        if (trySetup()) clearInterval(retryInterval);
      }, 300);
      return () => {
        clearInterval(retryInterval);
        triggerTimers.forEach(clearTimeout);
        disposableRef.current?.dispose();
        disposableRef.current = null;
      };
    }

    return () => {
      triggerTimers.forEach(clearTimeout);
      disposableRef.current?.dispose();
      disposableRef.current = null;
    };
  }, [enabled, solution, language]);
}
