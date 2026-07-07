import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDetachedSnippetPreview,
  hydrateSnippetPreview,
  insertSnippetIntoEditor,
  insertSnippetPreview,
  registerGeneratedLines,
  suppressNextLineCommitIfMultiline,
} from './snippetInsertion';

class MockRange {
  constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
    this.startLineNumber = startLineNumber;
    this.startColumn = startColumn;
    this.endLineNumber = endLineNumber;
    this.endColumn = endColumn;
  }

  isEmpty() {
    return this.startLineNumber === this.endLineNumber && this.startColumn === this.endColumn;
  }

  getStartPosition() {
    return {
      lineNumber: this.startLineNumber,
      column: this.startColumn,
    };
  }
}

const createEditorContext = ({
  initialValue = '',
  position = { lineNumber: 1, column: 1 },
  selection = null,
  modelOptions = { tabSize: 2, insertSpaces: true },
} = {}) => {
  let value = initialValue;

  const getLines = () => value.split('\n');
  const getLine = (lineNumber) => getLines()[lineNumber - 1] ?? '';

  const model = {
    getLineContent: vi.fn((lineNumber) => getLine(lineNumber)),
    getLineCount: vi.fn(() => getLines().length),
    getLineMaxColumn: vi.fn((lineNumber) => getLine(lineNumber).length + 1),
    getOptions: vi.fn(() => modelOptions),
    getValue: vi.fn(() => value),
    getOffsetAt: vi.fn(({ lineNumber, column }) => {
      const prior = getLines()
        .slice(0, Math.max(0, lineNumber - 1))
        .reduce((sum, line) => sum + line.length + 1, 0);
      return prior + Math.max(0, column - 1);
    }),
    getPositionAt: vi.fn((offset) => {
      let remaining = Math.max(0, offset);
      const lines = getLines();
      for (let index = 0; index < lines.length; index += 1) {
        const lineLength = lines[index].length;
        if (remaining <= lineLength) {
          return { lineNumber: index + 1, column: remaining + 1 };
        }
        remaining -= lineLength + 1;
      }
      const lastLine = lines.length || 1;
      return { lineNumber: lastLine, column: (lines[lastLine - 1] || '').length + 1 };
    }),
  };

  const applyEdit = (range, text) => {
    const start = model.getOffsetAt({
      lineNumber: range.startLineNumber,
      column: range.startColumn,
    });
    const end = model.getOffsetAt({
      lineNumber: range.endLineNumber,
      column: range.endColumn,
    });
    value = `${value.slice(0, start)}${text}${value.slice(end)}`;
  };

  const editor = {
    getModel: vi.fn(() => model),
    getPosition: vi.fn(() => position),
    getSelection: vi.fn(() => selection),
    executeEdits: vi.fn((_source, edits) => {
      edits.forEach((edit) => applyEdit(edit.range, edit.text));
    }),
    setPosition: vi.fn(),
    revealPositionInCenterIfOutsideViewport: vi.fn(),
    revealRangeInCenterIfOutsideViewport: vi.fn(),
    focus: vi.fn(),
    deltaDecorations: vi.fn(() => ['dec-1']),
    setSelection: vi.fn(),
  };

  window.__tdMonacoEditor = editor;
  window.__tdMonaco = {
    Range: MockRange,
    editor: {
      TrackedRangeStickiness: {
        NeverGrowsWhenTypingAtEdges: 'never',
      },
    },
  };

  return { editor, model, getValue: () => value };
};

describe('snippetInsertion', () => {
  beforeEach(() => {
    delete window.__tdSuppressNextLineCommit;
    delete window.__tdGeneratedLineSuppressions;
    delete window.__tdAiSnippetCooldownUntil;
    delete window.__tdMonacoEditor;
    delete window.__tdMonaco;
    vi.restoreAllMocks();
  });

  it('suppresses next line commit only for multiline snippets', () => {
    suppressNextLineCommitIfMultiline('single line');
    expect(window.__tdSuppressNextLineCommit).toBeUndefined();

    suppressNextLineCommitIfMultiline('line 1\nline 2');
    expect(window.__tdSuppressNextLineCommit).toBe(1);

    window.__tdSuppressNextLineCommit = 3;
    suppressNextLineCommitIfMultiline('a\nb');
    expect(window.__tdSuppressNextLineCommit).toBe(3);
  });

  it('registers generated line suppressions and cooldown metadata', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    registerGeneratedLines('foo();\n foo()\nbar ;\n');

    expect(window.__tdGeneratedLineSuppressions['foo();']).toEqual({
      remaining: 1,
      expiresAt: 6_000,
    });
    expect(window.__tdGeneratedLineSuppressions['foo()']).toEqual({
      remaining: 2,
      expiresAt: 6_000,
    });
    expect(window.__tdGeneratedLineSuppressions.bar).toEqual({
      remaining: 1,
      expiresAt: 6_000,
    });
    expect(window.__tdAiSnippetCooldownUntil).toBe(2_500);
  });

  it('returns null when editor context or snippet is unavailable', () => {
    expect(insertSnippetIntoEditor('x = 1', 'python')).toBeNull();

    createEditorContext({ initialValue: 'print(1)' });
    expect(insertSnippetIntoEditor('   ', 'python')).toBeNull();
  });

  it('inserts snippets with indentation-aware caret placement', () => {
    const { editor, getValue } = createEditorContext({
      initialValue: 'def solve():\n  return 0',
      position: { lineNumber: 2, column: 3 },
    });

    const updated = insertSnippetIntoEditor('if value:', 'python');

    expect(updated).toContain('\n  if value:\n    ');
    expect(getValue()).toContain('if value:');
    expect(editor.executeEdits).toHaveBeenCalledWith(
      'td-snippet',
      expect.arrayContaining([
        expect.objectContaining({
          text: '\n  if value:\n    ',
        }),
      ])
    );
    expect(editor.setPosition).toHaveBeenCalledTimes(1);
    expect(editor.revealPositionInCenterIfOutsideViewport).toHaveBeenCalledTimes(1);
    expect(editor.focus).toHaveBeenCalledTimes(1);
  });

  it('builds snippet previews with highlight metadata for selected ranges', () => {
    const selection = new MockRange(1, 7, 1, 8);
    const { editor } = createEditorContext({
      initialValue: 'const x = 1;',
      position: { lineNumber: 1, column: 8 },
      selection,
    });

    const preview = insertSnippetPreview('value', 'javascript');

    expect(preview.beforeValue).toBe('const x = 1;');
    expect(preview.value).toContain('value');
    expect(preview.value).not.toBe(preview.beforeValue);
    expect(preview.decorationIds).toEqual(['dec-1']);
    expect(preview.selectionRange).toEqual({
      startLineNumber: 1,
      startColumn: 7,
      endLineNumber: 1,
      endColumn: 8,
    });
    expect(editor.deltaDecorations).toHaveBeenCalledWith(
      [],
      expect.arrayContaining([
        expect.objectContaining({
          options: expect.objectContaining({
            stickiness: 'never',
          }),
        }),
      ])
    );
    expect(editor.setSelection).toHaveBeenCalledWith(preview.highlightRange);
    expect(editor.revealRangeInCenterIfOutsideViewport).toHaveBeenCalledWith(
      preview.highlightRange
    );
  });

  it('creates detached previews with indentation-aware insertion when no editor is mounted', () => {
    const preview = createDetachedSnippetPreview({
      currentCode: 'def solve():\n  pass',
      snippet: 'if ready:',
      language: 'python',
    });

    expect(preview.beforeValue).toBe('def solve():\n  pass');
    expect(preview.value).toBe('def solve():\n  pass\n  if ready:\n    ');
    expect(preview.highlightRange).toEqual({
      startLineNumber: 2,
      startColumn: 7,
      endLineNumber: 4,
      endColumn: 5,
    });
  });

  it('rehydrates detached previews into Monaco decorations when the editor mounts later', () => {
    const { editor } = createEditorContext({
      initialValue: 'def solve():\n  pass\n  if ready:\n    ',
      position: { lineNumber: 3, column: 5 },
    });

    const preview = hydrateSnippetPreview({
      beforeValue: 'def solve():\n  pass',
      value: 'def solve():\n  pass\n  if ready:\n    ',
      decorationIds: [],
      highlightRange: {
        startLineNumber: 2,
        startColumn: 7,
        endLineNumber: 4,
        endColumn: 5,
      },
      endPosition: { lineNumber: 4, column: 5 },
      cursorPosition: { lineNumber: 2, column: 7 },
      selectionRange: null,
    });

    expect(preview.decorationIds).toEqual(['dec-1']);
    expect(editor.setSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        startLineNumber: 2,
        startColumn: 7,
        endLineNumber: 4,
        endColumn: 5,
      })
    );
    expect(editor.revealRangeInCenterIfOutsideViewport).toHaveBeenCalledWith(
      expect.objectContaining({
        startLineNumber: 2,
        startColumn: 7,
        endLineNumber: 4,
        endColumn: 5,
      })
    );
  });
});
