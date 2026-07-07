import { describe, expect, it, vi } from 'vitest';

import {
  applyCustomTokenProviders,
  defineTowerTheme,
  getMatrixRefreshInterval,
  logTokenization,
} from './towerTokenProviders';

const buildMonacoContext = (languageId = 'python', includeTokenize = false) => {
  const model = {
    uri: 'inmemory://model/1',
    getValue: vi.fn(() => 'first line\nif check:\nfinal line'),
  };

  const monaco = {
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
      CompletionItemKind: {
        Keyword: 1,
        Snippet: 2,
        Method: 3,
        Field: 4,
        Text: 5,
      },
      CompletionItemInsertTextRule: {
        InsertAsSnippet: 4,
      },
    },
    editor: {
      tokenize: includeTokenize ? {} : undefined,
      getModel: vi.fn(() => ({
        getLanguageId: () => languageId,
      })),
      setModelLanguage: vi.fn(),
      defineTheme: vi.fn(),
      setTheme: vi.fn(),
    },
  };

  const editor = {
    getModel: vi.fn(() => model),
  };

  return { monaco, editor, model };
};

describe('towerTokenProviders', () => {
  it('returns early when required editor/monaco state is missing', () => {
    const { monaco, editor } = buildMonacoContext();

    expect(() => applyCustomTokenProviders(null, editor)).not.toThrow();
    expect(() => applyCustomTokenProviders(monaco, null)).not.toThrow();
    expect(monaco.languages.register).not.toHaveBeenCalled();
  });

  it('returns early when editor model is unavailable', () => {
    const { monaco } = buildMonacoContext();
    const editor = {
      getModel: vi.fn(() => null),
    };

    applyCustomTokenProviders(monaco, editor);

    expect(monaco.languages.register).not.toHaveBeenCalled();
    expect(monaco.editor.setModelLanguage).not.toHaveBeenCalled();
  });

  it.each(['python', 'javascript', 'java', 'cpp'])(
    'registers token providers for %s and updates editor language',
    (language) => {
      const { monaco, editor, model } = buildMonacoContext('python');

      applyCustomTokenProviders(monaco, editor, language);

      expect(monaco.languages.register).toHaveBeenCalledWith({ id: language });
      expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        language,
        expect.any(Object)
      );
      expect(monaco.editor.setModelLanguage).toHaveBeenCalledWith(model, language);
      expect(monaco.editor.tokenize).toBeTruthy();
      expect(monaco.editor.tokenize.towerKeywordTokens).toBeTruthy();

      if (['python', 'java', 'cpp'].includes(language)) {
        expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
          language,
          expect.any(Object)
        );
      } else {
        expect(monaco.languages.registerCompletionItemProvider).not.toHaveBeenCalled();
      }
    }
  );

  it('registers completion providers only once per language', () => {
    const { monaco, editor } = buildMonacoContext('python');

    applyCustomTokenProviders(monaco, editor, 'python');
    applyCustomTokenProviders(monaco, editor, 'python');

    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledTimes(1);
  });

  it('uses model language when override is omitted', () => {
    const { monaco, editor, model } = buildMonacoContext('java', true);

    applyCustomTokenProviders(monaco, editor);

    expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'java' });
    expect(monaco.editor.setModelLanguage).toHaveBeenCalledWith(model, 'java');
  });

  it('reuses existing tokenize registry when present', () => {
    const { monaco, editor } = buildMonacoContext('python', true);
    const existingTokenize = monaco.editor.tokenize;

    applyCustomTokenProviders(monaco, editor, 'cpp');

    expect(monaco.editor.tokenize).toBe(existingTokenize);
    expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'cpp' });
  });

  it('supports custom target language ids without overriding the base language id', () => {
    const { monaco, editor, model } = buildMonacoContext('python', true);

    applyCustomTokenProviders(monaco, editor, {
      languageId: 'python',
      targetLanguageId: 'cg-store-td-python',
    });

    expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'cg-store-td-python' });
    expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
      'cg-store-td-python',
      expect.any(Object)
    );
    expect(monaco.editor.setModelLanguage).toHaveBeenCalledWith(model, 'cg-store-td-python');
  });

  it('falls back cleanly for unsupported languages', () => {
    const { monaco, editor, model } = buildMonacoContext('python');

    applyCustomTokenProviders(monaco, editor, 'ruby');

    expect(monaco.languages.register).not.toHaveBeenCalled();
    expect(monaco.languages.setMonarchTokensProvider).not.toHaveBeenCalled();
    expect(monaco.editor.setModelLanguage).toHaveBeenCalledWith(model, 'ruby');
  });

  it('defines and applies the cyberpunk editor theme', () => {
    const { monaco } = buildMonacoContext();

    defineTowerTheme(monaco);

    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      'cyberpunk',
      expect.objectContaining({
        base: 'vs-dark',
        inherit: true,
        rules: expect.any(Array),
        colors: expect.any(Object),
      })
    );
    expect(monaco.editor.setTheme).toHaveBeenCalledWith('cyberpunk');
  });

  it('returns refresh intervals based on viewport resolution', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 2200,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    });
    expect(getMatrixRefreshInterval()).toBe(200);

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1200,
    });
    expect(getMatrixRefreshInterval()).toBe(200);

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 720,
    });
    expect(getMatrixRefreshInterval()).toBe(100);
  });

  it('handles tokenization logging paths with and without models', () => {
    expect(() => logTokenization({ getModel: () => null })).not.toThrow();

    const model = {
      getValue: vi.fn(() => 'plain text\nfor i in range(3):\nvalue'),
    };
    const editor = {
      getModel: () => model,
    };

    expect(() => logTokenization(editor)).not.toThrow();
    expect(model.getValue).toHaveBeenCalledTimes(1);
  });
});
