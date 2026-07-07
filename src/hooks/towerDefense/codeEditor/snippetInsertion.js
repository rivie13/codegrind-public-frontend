export const suppressNextLineCommitIfMultiline = (snippet) => {
  if (typeof window === 'undefined') return;
  if (!snippet || !/[\r\n]/.test(snippet)) return;
  const current = Number(window.__tdSuppressNextLineCommit || 0);
  window.__tdSuppressNextLineCommit = Math.max(current, 1);
};

export const registerGeneratedLines = (snippet) => {
  if (typeof window === 'undefined') return;
  if (!snippet) return;
  const lines = String(snippet)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return;
  if (!window.__tdGeneratedLineSuppressions) {
    window.__tdGeneratedLineSuppressions = Object.create(null);
  }
  const normalize = (line) => line.replace(/\s+/g, '').replace(/;$/, '');
  const addKey = (key) => {
    if (!key) return;
    const existing = window.__tdGeneratedLineSuppressions[key];
    const now = Date.now();
    const remaining = typeof existing === 'number' ? existing : existing?.remaining || 0;
    window.__tdGeneratedLineSuppressions[key] = {
      remaining: remaining + 1,
      expiresAt: now + 5000,
    };
  };
  lines.forEach((line) => {
    addKey(line);
    const normalized = normalize(line);
    if (normalized !== line) {
      addKey(normalized);
    }
  });
  window.__tdAiSnippetCooldownUntil = Date.now() + 1500;
};

const getEditorContext = () => {
  if (typeof window === 'undefined') return null;
  const editor = window.__tdMonacoEditor;
  const monaco = window.__tdMonaco || window.monaco;
  if (!editor || !editor.getModel || !monaco || !monaco.Range) return null;
  return { editor, monaco };
};

const createPlainRange = (startLineNumber, startColumn, endLineNumber, endColumn) => ({
  startLineNumber,
  startColumn,
  endLineNumber,
  endColumn,
});

const hasSelectionRange = (range) => {
  if (!range) return false;
  return !(range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn);
};

const createVirtualModel = (value, modelOptions = {}) => {
  const source = typeof value === 'string' ? value : '';
  const getLines = () => source.split('\n');
  const getLine = (lineNumber) => getLines()[lineNumber - 1] ?? '';

  return {
    getLineContent(lineNumber) {
      return getLine(lineNumber);
    },
    getLineCount() {
      return Math.max(1, getLines().length);
    },
    getLineMaxColumn(lineNumber) {
      return getLine(lineNumber).length + 1;
    },
    getOptions() {
      return modelOptions;
    },
    getValue() {
      return source;
    },
    getOffsetAt(position) {
      const prior = getLines()
        .slice(0, Math.max(0, position.lineNumber - 1))
        .reduce((sum, line) => sum + line.length + 1, 0);
      return prior + Math.max(0, position.column - 1);
    },
    getPositionAt(offset) {
      let remaining = Math.max(0, offset);
      const lines = getLines();
      for (let index = 0; index < lines.length; index += 1) {
        const lineLength = lines[index].length;
        if (remaining <= lineLength) {
          return { lineNumber: index + 1, column: remaining + 1 };
        }
        remaining -= lineLength + 1;
      }

      const lastLineNumber = Math.max(1, lines.length);
      const lastLine = lines[lastLineNumber - 1] ?? '';
      return { lineNumber: lastLineNumber, column: lastLine.length + 1 };
    },
  };
};

const buildPreviewDecorations = (editor, monaco, highlightRange) => {
  if (!editor?.deltaDecorations || !monaco?.editor?.TrackedRangeStickiness) {
    return [];
  }

  return editor.deltaDecorations(
    [],
    [
      {
        range: highlightRange,
        options: {
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      },
    ]
  );
};

const getDefaultPosition = (model) => {
  const lastLineNumber = model.getLineCount();
  return {
    lineNumber: lastLineNumber,
    column: model.getLineMaxColumn(lastLineNumber),
  };
};

const createPreviewSnapshot = ({
  beforeValue,
  model,
  monaco,
  snippet,
  language,
  position,
  selection,
  applyPreviewEdit,
}) => {
  const resolved = resolveInsertionText({
    model,
    position,
    snippet,
    language,
  });
  if (!resolved) return null;

  const { insertionText } = resolved;

  const range = hasSelectionRange(selection)
    ? selection
    : new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);

  const value = applyPreviewEdit({ range, text: insertionText });
  const resultModel = createVirtualModel(value, model.getOptions?.() || {});
  const startOffset = model.getOffsetAt({
    lineNumber: range.startLineNumber,
    column: range.startColumn,
  });
  const endOffset = startOffset + insertionText.length;
  const startPosition = resultModel.getPositionAt(startOffset);
  const endPosition = resultModel.getPositionAt(endOffset);

  return {
    beforeValue,
    value,
    decorationIds: [],
    highlightRange: createPlainRange(
      startPosition.lineNumber,
      startPosition.column,
      endPosition.lineNumber,
      endPosition.column
    ),
    endPosition,
    cursorPosition: position,
    selectionRange: hasSelectionRange(selection)
      ? createPlainRange(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        )
      : null,
  };
};

const resolveInsertionText = ({ model, position, snippet, language }) => {
  const lineContent = model.getLineContent(position.lineNumber);
  const indentMatch = lineContent.match(/^\s*/);
  const indent = indentMatch ? indentMatch[0] : '';

  const rawSnippet = String(snippet);
  if (!rawSnippet.trim()) return null;

  const cleanedSnippet = rawSnippet.replace(/^\r?\n+/, '');
  const isMultiline = /[\r\n]/.test(cleanedSnippet);
  const needsLeadingNewline = lineContent.trim().length > 0 && position.column > 1;
  let insertionText = cleanedSnippet;
  let trimmedSingleLine = '';

  if (!isMultiline) {
    trimmedSingleLine = cleanedSnippet.trim();
    insertionText = `${needsLeadingNewline ? '\n' : ''}${needsLeadingNewline ? indent : ''}${trimmedSingleLine}`;
  } else if (needsLeadingNewline) {
    insertionText = `\n${cleanedSnippet}`;
  }

  const modelOptions = model.getOptions?.() || {};
  const tabSize = Number(modelOptions.tabSize || modelOptions.indentSize || 2);
  const indentUnit = modelOptions.insertSpaces === false ? '\t' : ' '.repeat(tabSize);
  let caretIndent = indent;
  if (!isMultiline && trimmedSingleLine) {
    if (language === 'python' && trimmedSingleLine.endsWith(':')) {
      caretIndent = indent + indentUnit;
    } else if (
      (language === 'javascript' || language === 'java' || language === 'cpp') &&
      trimmedSingleLine.endsWith('{')
    ) {
      caretIndent = indent + indentUnit;
    }
  }

  if (!/[\r\n]$/.test(insertionText)) {
    insertionText += `\n${caretIndent}`;
  }

  return {
    insertionText,
    isMultiline,
    trimmedSingleLine,
  };
};

export const insertSnippetIntoEditor = (snippet, language) => {
  const context = getEditorContext();
  if (!context || !snippet) return null;
  const { editor, monaco } = context;

  const model = editor.getModel();
  if (!model) return null;

  const selection = editor.getSelection?.();
  const position = editor.getPosition?.() || {
    lineNumber: model.getLineCount(),
    column: model.getLineMaxColumn(model.getLineCount()),
  };

  const resolved = resolveInsertionText({
    model,
    position,
    snippet,
    language,
  });
  if (!resolved) return null;

  const { insertionText } = resolved;

  const range =
    selection && !selection.isEmpty()
      ? selection
      : new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        );

  editor.executeEdits('td-snippet', [
    {
      range,
      text: insertionText,
      forceMoveMarkers: true,
    },
  ]);

  const startOffset = model.getOffsetAt(range.getStartPosition());
  const endOffset = startOffset + insertionText.length;
  const newPosition = model.getPositionAt(endOffset);
  editor.setPosition(newPosition);
  editor.revealPositionInCenterIfOutsideViewport(newPosition);
  editor.focus();
  return model.getValue();
};

export const insertSnippetPreview = (snippet, language) => {
  const context = getEditorContext();
  if (!context || !snippet) return null;
  const { editor, monaco } = context;

  const model = editor.getModel();
  if (!model) return null;
  const beforeValue = model.getValue();

  const selection = editor.getSelection?.();
  const position = editor.getPosition?.() || getDefaultPosition(model);

  const preview = createPreviewSnapshot({
    beforeValue,
    model,
    monaco,
    snippet,
    language,
    position,
    selection,
    applyPreviewEdit: ({ range, text }) => {
      editor.executeEdits('td-snippet-preview', [
        {
          range,
          text,
          forceMoveMarkers: true,
        },
      ]);

      return model.getValue();
    },
  });
  if (!preview) return null;

  return hydrateSnippetPreview(preview, editor, monaco);
};

export const createDetachedSnippetPreview = ({
  snippet,
  language,
  currentCode = '',
  cursorPosition = null,
  selectionRange = null,
  modelOptions = { tabSize: 2, insertSpaces: true },
}) => {
  if (!snippet) return null;

  const model = createVirtualModel(currentCode, modelOptions);
  const monaco = {
    Range: class DetachedRange {
      constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
        this.startLineNumber = startLineNumber;
        this.startColumn = startColumn;
        this.endLineNumber = endLineNumber;
        this.endColumn = endColumn;
      }
    },
  };

  const position = cursorPosition || getDefaultPosition(model);

  return createPreviewSnapshot({
    beforeValue: currentCode,
    model,
    monaco,
    snippet,
    language,
    position,
    selection: selectionRange,
    applyPreviewEdit: ({ range, text }) => {
      const start = model.getOffsetAt({
        lineNumber: range.startLineNumber,
        column: range.startColumn,
      });
      const end = model.getOffsetAt({
        lineNumber: range.endLineNumber,
        column: range.endColumn,
      });
      return `${currentCode.slice(0, start)}${text}${currentCode.slice(end)}`;
    },
  });
};

export const hydrateSnippetPreview = (preview, editorArg = null, monacoArg = null) => {
  if (!preview) return null;

  const editor = editorArg || (typeof window !== 'undefined' ? window.__tdMonacoEditor : null);
  const monaco =
    monacoArg || (typeof window !== 'undefined' ? window.__tdMonaco || window.monaco : null);
  if (!editor || !monaco?.Range || !preview.highlightRange) {
    return preview;
  }

  const highlightRange = new monaco.Range(
    preview.highlightRange.startLineNumber,
    preview.highlightRange.startColumn,
    preview.highlightRange.endLineNumber,
    preview.highlightRange.endColumn
  );
  const decorationIds = buildPreviewDecorations(editor, monaco, highlightRange);

  editor.setSelection?.(highlightRange);
  editor.revealRangeInCenterIfOutsideViewport?.(highlightRange);
  editor.focus?.();

  return {
    ...preview,
    decorationIds,
    highlightRange,
  };
};
