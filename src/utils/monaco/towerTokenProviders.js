import { TD_EDITOR_THEME_DEF } from './editorSurfaceBaselines.js';

const resolveLanguageConfig = (languageOverride, fallbackLanguageId) => {
  if (typeof languageOverride === 'string') {
    return {
      languageId: languageOverride,
      targetLanguageId: languageOverride,
    };
  }

  if (languageOverride && typeof languageOverride === 'object') {
    const languageId = languageOverride.languageId || fallbackLanguageId;
    const targetLanguageId = languageOverride.targetLanguageId || languageId;
    return {
      languageId,
      targetLanguageId,
    };
  }

  return {
    languageId: fallbackLanguageId,
    targetLanguageId: fallbackLanguageId,
  };
};

const registerPythonTokenProvider = (monaco, languageId = 'python') => {
  monaco.languages.register({ id: languageId });

  if (!monaco.editor.tokenize) {
    monaco.editor.tokenize = {};
  }

  const towerKeywordTokens = {
    class: 'object',
    def: 'function',
    if: 'ifcondition',
    elif: 'ifcondition',
    else: 'ifcondition',
    for: 'forloop',
    while: 'whileloop',
    try: 'trycatch',
    except: 'trycatch',
    finally: 'trycatch',
    return: 'return',
  };

  monaco.editor.tokenize.towerKeywordTokens = towerKeywordTokens;

  monaco.languages.setMonarchTokensProvider(languageId, {
    defaultToken: '',
    keywords: [
      'False',
      'None',
      'True',
      'and',
      'as',
      'assert',
      'break',
      'class',
      'continue',
      'def',
      'del',
      'elif',
      'else',
      'except',
      'finally',
      'for',
      'from',
      'global',
      'if',
      'import',
      'in',
      'is',
      'lambda',
      'nonlocal',
      'not',
      'or',
      'pass',
      'raise',
      'return',
      'try',
      'while',
      'with',
      'yield',
    ],
    towerKeywords: [
      'class',
      'def',
      'if',
      'elif',
      'else',
      'for',
      'while',
      'try',
      'except',
      'finally',
      'return',
    ],
    forloop: ['for'],
    whileloop: ['while'],
    ifcondition: ['if', 'elif', 'else'],
    function: ['def'],
    object: ['class'],
    trycatch: ['try', 'except', 'finally'],
    return: ['return'],
    functionKeywords: ['def', 'lambda'],
    operators: [
      '+',
      '-',
      '*',
      '**',
      '/',
      '//',
      '%',
      '<<',
      '>>',
      '&',
      '|',
      '^',
      '~',
      '<',
      '>',
      '<=',
      '>=',
      '==',
      '!=',
      '<>',
      ':=',
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@forloop': 'brackets.forloop',
              '@whileloop': 'brackets.whileloop',
              '@ifcondition': 'brackets.ifcondition',
              '@function': 'brackets.function',
              '@object': 'brackets.object',
              '@trycatch': 'brackets.trycatch',
              '@return': 'brackets.return',
              '@keywords': 'keyword',
              '@functionKeywords': 'keyword.function',
              '@default': 'identifier',
            },
          },
        ],
        [/\d+(\.\d+)?/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/[ \t\r\n]+/, 'white'],
        [/#.*$/, 'comment'],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/[{}()\[\]]/, '@brackets'],
        [/[;,.]/, 'delimiter'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      string_single: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],
    },
  });
};

const registerJavaScriptTokenProvider = (monaco, languageId = 'javascript') => {
  monaco.languages.register({ id: languageId });

  if (!monaco.editor.tokenize) {
    monaco.editor.tokenize = {};
  }

  const towerKeywordTokens = {
    class: 'object',
    function: 'function',
    if: 'ifcondition',
    else: 'ifcondition',
    for: 'forloop',
    while: 'whileloop',
    do: 'whileloop',
    try: 'trycatch',
    catch: 'trycatch',
    finally: 'trycatch',
    return: 'return',
    switch: 'switch',
    case: 'switch',
    default: 'switch',
  };

  monaco.editor.tokenize.towerKeywordTokens = towerKeywordTokens;

  monaco.languages.setMonarchTokensProvider(languageId, {
    defaultToken: 'invalid',
    keywords: [
      'break',
      'case',
      'catch',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'false',
      'finally',
      'for',
      'from',
      'if',
      'in',
      'instanceof',
      'new',
      'null',
      'return',
      'switch',
      'throw',
      'true',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'yield',
      'async',
      'await',
      'of',
    ],
    towerKeywords: [
      'class',
      'function',
      'if',
      'else',
      'for',
      'while',
      'do',
      'try',
      'catch',
      'finally',
      'return',
      'switch',
      'case',
      'default',
    ],
    towerKeywordTokens: {
      class: 'object',
      function: 'function',
      if: 'ifcondition',
      else: 'ifcondition',
      for: 'forloop',
      while: 'whileloop',
      do: 'whileloop',
      try: 'trycatch',
      catch: 'trycatch',
      finally: 'trycatch',
      return: 'return',
      switch: 'switch',
      case: 'switch',
      default: 'switch',
    },
    forloop: ['for'],
    whileloop: ['while', 'do'],
    ifcondition: ['if', 'else'],
    function: ['function'],
    object: ['class'],
    trycatch: ['try', 'catch', 'finally'],
    return: ['return'],
    switch: ['switch', 'case', 'default'],
    specialIdentifiers: ['var', 'let', 'const'],
    variableKeywords: ['var', 'let', 'const'],
    tokenizer: {
      root: [
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              '@forloop': 'brackets.forloop',
              '@whileloop': 'brackets.whileloop',
              '@ifcondition': 'brackets.ifcondition',
              '@function': 'brackets.function',
              '@object': 'brackets.object',
              '@trycatch': 'brackets.trycatch',
              '@return': 'brackets.return',
              '@switch': 'brackets.switch',
              '@variableKeywords': 'brackets.variable',
              '@specialIdentifiers': 'identifier.special',
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [/=>/, 'function'],
        [/\[/, { token: 'array', bracket: '@open' }],
        [/\]/, { token: 'array', bracket: '@close' }],
        [/\{/, { token: 'object', bracket: '@open' }],
        [/\}/, { token: 'object', bracket: '@close' }],
        { include: '@whitespace' },
        [/\d+/, 'number'],
        [/[;,.]/, 'delimiter'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/`/, 'string', '@string_backtick'],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      string_single: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
      string_backtick: [
        [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
        [/[^\\`$]+/, 'string'],
        [/\\./, 'string.escape'],
        [/`/, 'string', '@pop'],
      ],
      bracketCounting: [
        [/\{/, 'delimiter.bracket', '@bracketCounting'],
        [/\}/, 'delimiter.bracket', '@pop'],
        { include: 'root' },
      ],
    },
  });
};

const registerJavaTokenProvider = (monaco, languageId = 'java') => {
  monaco.languages.register({ id: languageId });

  if (!monaco.editor.tokenize) {
    monaco.editor.tokenize = {};
  }

  const towerKeywordTokens = {
    class: 'object',
    interface: 'object',
    if: 'ifcondition',
    else: 'ifcondition',
    for: 'forloop',
    while: 'whileloop',
    do: 'whileloop',
    try: 'trycatch',
    catch: 'trycatch',
    finally: 'trycatch',
    return: 'return',
    switch: 'switch',
    case: 'switch',
    default: 'switch',
  };

  monaco.editor.tokenize.towerKeywordTokens = towerKeywordTokens;

  monaco.languages.setMonarchTokensProvider(languageId, {
    defaultToken: 'invalid',
    keywords: [
      'abstract',
      'assert',
      'boolean',
      'break',
      'byte',
      'case',
      'catch',
      'char',
      'continue',
      'default',
      'do',
      'double',
      'else',
      'enum',
      'extends',
      'final',
      'finally',
      'float',
      'for',
      'goto',
      'if',
      'implements',
      'import',
      'instanceof',
      'int',
      'interface',
      'long',
      'native',
      'new',
      'package',
      'private',
      'protected',
      'public',
      'return',
      'short',
      'static',
      'strictfp',
      'super',
      'switch',
      'synchronized',
      'this',
      'throw',
      'throws',
      'transient',
      'try',
      'void',
      'volatile',
      'while',
    ],
    towerKeywords: [
      'class',
      'interface',
      'if',
      'else',
      'for',
      'while',
      'do',
      'try',
      'catch',
      'finally',
      'return',
      'switch',
      'case',
      'default',
    ],
    forloop: ['for'],
    whileloop: ['while', 'do'],
    ifcondition: ['if', 'else'],
    function: ['void', 'int', 'double', 'float', 'boolean', 'char', 'String', 'long'],
    object: ['class', 'interface'],
    trycatch: ['try', 'catch', 'finally'],
    return: ['return'],
    switch: ['switch', 'case', 'default'],
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    tokenizer: {
      root: [
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              '@forloop': 'brackets.forloop',
              '@whileloop': 'brackets.whileloop',
              '@ifcondition': 'brackets.ifcondition',
              '@function': 'brackets.function',
              '@object': 'brackets.object',
              '@trycatch': 'brackets.trycatch',
              '@return': 'brackets.return',
              '@switch': 'brackets.switch',
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [
          /\b(int|float|double|boolean|char|String|long)\b\s+([a-zA-Z_$][\w$]*)/,
          ['keyword', 'variable'],
        ],
        [/\b[a-zA-Z_$][\w$]*\s*\(/, 'function'],
        [/\[\s*\]/, 'array'],
        [/\[/, { token: 'array', bracket: '@open' }],
        [/\]/, { token: 'array', bracket: '@close' }],
        [/\{/, { token: 'object', bracket: '@open' }],
        [/\}/, { token: 'object', bracket: '@close' }],
        { include: '@whitespace' },
        [/\d+/, 'number'],
        [/[;,.]/, 'delimiter'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  });
};

const registerCppTokenProvider = (monaco, languageId = 'cpp') => {
  monaco.languages.register({ id: languageId });

  if (!monaco.editor.tokenize) {
    monaco.editor.tokenize = {};
  }

  const towerKeywordTokens = {
    class: 'object',
    struct: 'object',
    if: 'ifcondition',
    else: 'ifcondition',
    for: 'forloop',
    while: 'whileloop',
    do: 'whileloop',
    try: 'trycatch',
    catch: 'trycatch',
    return: 'return',
    switch: 'switch',
    case: 'switch',
    default: 'switch',
  };

  monaco.editor.tokenize.towerKeywordTokens = towerKeywordTokens;

  monaco.languages.setMonarchTokensProvider(languageId, {
    defaultToken: 'invalid',
    keywords: [
      'alignas',
      'alignof',
      'and',
      'and_eq',
      'asm',
      'auto',
      'bitand',
      'bitor',
      'bool',
      'break',
      'case',
      'catch',
      'char',
      'char16_t',
      'char32_t',
      'class',
      'compl',
      'concept',
      'const',
      'constexpr',
      'const_cast',
      'continue',
      'decltype',
      'default',
      'delete',
      'do',
      'double',
      'dynamic_cast',
      'else',
      'enum',
      'explicit',
      'export',
      'extern',
      'false',
      'float',
      'for',
      'friend',
      'goto',
      'if',
      'inline',
      'int',
      'long',
      'mutable',
      'namespace',
      'new',
      'noexcept',
      'not',
      'not_eq',
      'nullptr',
      'operator',
      'or',
      'or_eq',
      'private',
      'protected',
      'public',
      'register',
      'reinterpret_cast',
      'requires',
      'return',
      'short',
      'signed',
      'sizeof',
      'static',
      'static_assert',
      'static_cast',
      'struct',
      'switch',
      'template',
      'this',
      'thread_local',
      'throw',
      'true',
      'try',
      'typedef',
      'typeid',
      'typename',
      'union',
      'unsigned',
      'using',
      'virtual',
      'void',
      'volatile',
      'wchar_t',
      'while',
      'xor',
      'xor_eq',
    ],
    towerKeywords: [
      'class',
      'struct',
      'if',
      'else',
      'for',
      'while',
      'do',
      'try',
      'catch',
      'return',
      'switch',
      'case',
      'default',
    ],
    forloop: ['for'],
    whileloop: ['while', 'do'],
    ifcondition: ['if', 'else'],
    function: ['void', 'int', 'double', 'float', 'bool', 'char', 'auto', 'string'],
    object: ['class', 'struct'],
    trycatch: ['try', 'catch'],
    return: ['return'],
    switch: ['switch', 'case', 'default'],
    specialIdentifiers: ['vector', 'map', 'string', 'array', 'size', 'iterator', 'const', 'auto'],
    variableKeywords: ['int', 'float', 'double', 'bool', 'char', 'auto', 'string'],
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    tokenizer: {
      root: [
        [
          /[a-zA-Z_][\w]*/,
          {
            cases: {
              '@forloop': 'brackets.forloop',
              '@whileloop': 'brackets.whileloop',
              '@ifcondition': 'brackets.ifcondition',
              '@function': 'brackets.function',
              '@object': 'brackets.object',
              '@trycatch': 'brackets.trycatch',
              '@return': 'brackets.return',
              '@switch': 'brackets.switch',
              '@variableKeywords': 'brackets.variable',
              '@specialIdentifiers': 'identifier.special',
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [
          /\b(int|float|double|bool|char|auto|string|long)\b\s+([a-zA-Z_][\w]*)/,
          ['keyword', 'variable'],
        ],
        [/\b[a-zA-Z_][\w]*\s*\(/, 'function'],
        [/\[\s*\]/, 'array'],
        [/\[/, { token: 'array', bracket: '@open' }],
        [/\]/, { token: 'array', bracket: '@close' }],
        [/\bvector\b|\barray\b/, 'array'],
        [/\{/, { token: 'object', bracket: '@open' }],
        [/\}/, { token: 'object', bracket: '@close' }],
        { include: '@whitespace' },
        [/\d+/, 'number'],
        [/[;,.]/, 'delimiter'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  });
};

const buildRange = (model, position) => {
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
};

const createKeywordSuggestions = (monaco, range, values, kind = 'Keyword') => {
  const completionKind =
    monaco.languages.CompletionItemKind[kind] || monaco.languages.CompletionItemKind.Keyword;

  return values.map((label) => ({
    label,
    kind: completionKind,
    insertText: label,
    range,
  }));
};

const createSnippetSuggestions = (monaco, range, snippets) =>
  snippets.map((snippet) => ({
    label: snippet.label,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: snippet.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: snippet.detail,
    documentation: snippet.documentation,
    range,
  }));

const registerJavaCompletionProvider = (monaco, languageId = 'java') => {
  const javaKeywords = [
    'class',
    'public',
    'private',
    'protected',
    'static',
    'void',
    'int',
    'double',
    'boolean',
    'String',
    'if',
    'else',
    'for',
    'while',
    'return',
    'new',
    'try',
    'catch',
    'finally',
    'switch',
    'case',
    'default',
  ];

  return monaco.languages.registerCompletionItemProvider(languageId, {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const range = buildRange(model, position);
      const dotMatch = linePrefix.match(/([A-Za-z_][\w.]*)\.([A-Za-z_]*)$/);

      if (dotMatch) {
        const qualifier = dotMatch[1];
        const memberPrefix = dotMatch[2] || '';
        const memberRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - memberPrefix.length,
          endColumn: position.column,
        };

        if (qualifier === 'System') {
          const members = [
            { label: 'out', kind: 'Field' },
            { label: 'err', kind: 'Field' },
            { label: 'in', kind: 'Field' },
            { label: 'currentTimeMillis()', kind: 'Method' },
            { label: 'nanoTime()', kind: 'Method' },
            { label: 'getProperty("${1:key}")', kind: 'Method', isSnippet: true },
            {
              label: 'arraycopy(${1:src}, ${2:srcPos}, ${3:dest}, ${4:destPos}, ${5:length})',
              kind: 'Method',
              isSnippet: true,
            },
          ];

          return {
            suggestions: members.map((member) => ({
              label: member.label.replace(/\(.*$/, ''),
              kind: monaco.languages.CompletionItemKind[member.kind],
              insertText: member.label,
              insertTextRules: member.isSnippet
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              range: memberRange,
            })),
          };
        }

        if (qualifier === 'System.out' || qualifier === 'System.err') {
          return {
            suggestions: createSnippetSuggestions(monaco, memberRange, [
              {
                label: 'println',
                insertText: 'println(${1:value});',
                detail: 'Print line',
                documentation: 'System.out.println(...) helper',
              },
              {
                label: 'print',
                insertText: 'print(${1:value});',
                detail: 'Print',
                documentation: 'System.out.print(...) helper',
              },
              {
                label: 'printf',
                insertText: 'printf(${1:format}, ${2:args});',
                detail: 'Formatted print',
                documentation: 'System.out.printf(...) helper',
              },
            ]),
          };
        }
      }

      return {
        suggestions: [
          ...createKeywordSuggestions(monaco, range, javaKeywords),
          ...createSnippetSuggestions(monaco, range, [
            {
              label: 'main',
              insertText: 'public static void main(String[] args) {\n    ${1}// TODO\n}',
              detail: 'Main method',
              documentation: 'Java entry point',
            },
            {
              label: 'sout',
              insertText: 'System.out.println(${1:value});',
              detail: 'Print line',
              documentation: 'Shorthand for System.out.println',
            },
          ]),
        ],
      };
    },
  });
};

const registerPythonCompletionProvider = (monaco, languageId = 'python') => {
  const pythonKeywords = [
    'def',
    'class',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'return',
    'try',
    'except',
    'finally',
    'import',
    'from',
    'with',
    'as',
    'pass',
    'break',
    'continue',
    'True',
    'False',
    'None',
  ];

  return monaco.languages.registerCompletionItemProvider(languageId, {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const range = buildRange(model, position);
      const dotMatch = linePrefix.match(/([A-Za-z_][\w]*)\.([A-Za-z_]*)$/);

      if (dotMatch) {
        const qualifier = dotMatch[1];
        const memberPrefix = dotMatch[2] || '';
        const memberRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - memberPrefix.length,
          endColumn: position.column,
        };

        const memberMap = {
          str: [
            'lower()',
            'upper()',
            'strip()',
            'split(${1:sep})',
            'replace(${1:old}, ${2:new})',
            'startswith(${1:prefix})',
            'endswith(${1:suffix})',
            'format(${1:args})',
          ],
          list: [
            'append(${1:item})',
            'extend(${1:iterable})',
            'pop()',
            'insert(${1:index}, ${2:item})',
            'remove(${1:item})',
            'sort()',
            'reverse()',
            'clear()',
          ],
          dict: [
            'get(${1:key})',
            'keys()',
            'values()',
            'items()',
            'update(${1:other})',
            'pop(${1:key})',
            'clear()',
          ],
          set: [
            'add(${1:item})',
            'remove(${1:item})',
            'discard(${1:item})',
            'union(${1:other})',
            'intersection(${1:other})',
            'clear()',
          ],
        };

        const members = memberMap[qualifier] || [];
        if (members.length) {
          return {
            suggestions: members.map((insertText) => ({
              label: insertText.replace(/\(.*$/, ''),
              kind: monaco.languages.CompletionItemKind.Method,
              insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: memberRange,
            })),
          };
        }
      }

      return {
        suggestions: [
          ...createKeywordSuggestions(monaco, range, pythonKeywords),
          ...createSnippetSuggestions(monaco, range, [
            {
              label: 'print',
              insertText: 'print(${1:value})',
              detail: 'Print output',
              documentation: 'Python print helper',
            },
            {
              label: 'for',
              insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
              detail: 'For loop',
              documentation: 'Python for loop snippet',
            },
          ]),
        ],
      };
    },
  });
};

const registerCppCompletionProvider = (monaco, languageId = 'cpp') => {
  const cppKeywords = [
    'int',
    'long',
    'double',
    'float',
    'bool',
    'char',
    'string',
    'void',
    'if',
    'else',
    'for',
    'while',
    'return',
    'class',
    'struct',
    'public',
    'private',
    'protected',
    'template',
    'constexpr',
    'auto',
    'namespace',
  ];

  return monaco.languages.registerCompletionItemProvider(languageId, {
    triggerCharacters: ['.', ':'],
    provideCompletionItems: (model, position) => {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const range = buildRange(model, position);

      const stdMatch = linePrefix.match(/std::([A-Za-z_]*)$/);
      if (stdMatch) {
        const memberPrefix = stdMatch[1] || '';
        const memberRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - memberPrefix.length,
          endColumn: position.column,
        };

        return {
          suggestions: [
            'vector',
            'string',
            'map',
            'unordered_map',
            'set',
            'unordered_set',
            'pair',
            'make_pair',
            'cout',
            'cin',
            'endl',
            'sort',
            'max',
            'min',
          ].map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: label,
            range: memberRange,
          })),
        };
      }

      return {
        suggestions: [
          ...createKeywordSuggestions(monaco, range, cppKeywords),
          ...createSnippetSuggestions(monaco, range, [
            {
              label: 'cout',
              insertText: 'std::cout << ${1:value} << std::endl;',
              detail: 'Print to stdout',
              documentation: 'C++ stream output snippet',
            },
            {
              label: 'fori',
              insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n    ${3}// TODO\n}',
              detail: 'Index loop',
              documentation: 'C++ indexed for loop snippet',
            },
          ]),
        ],
      };
    },
  });
};

const applyLanguageCompletionProviders = (monaco, languageId, providerType = languageId) => {
  if (!monaco?.languages?.registerCompletionItemProvider) return;

  if (!monaco.__codegrindCompletionProviders) {
    monaco.__codegrindCompletionProviders = {};
  }

  if (monaco.__codegrindCompletionProviders[languageId]) {
    return;
  }

  let disposable = null;
  switch (providerType) {
    case 'java':
      disposable = registerJavaCompletionProvider(monaco, languageId);
      break;
    case 'python':
      disposable = registerPythonCompletionProvider(monaco, languageId);
      break;
    case 'cpp':
      disposable = registerCppCompletionProvider(monaco, languageId);
      break;
    default:
      break;
  }

  if (disposable) {
    monaco.__codegrindCompletionProviders[languageId] = disposable;
  }
};

const applyCustomTokenProviders = (monaco, editor, languageOverride = null) => {
  if (!editor || !monaco) return;
  const model = editor.getModel();
  if (!model) return;

  const modelLanguageId = monaco.editor.getModel(model.uri).getLanguageId();
  const { languageId: currentLanguage, targetLanguageId } = resolveLanguageConfig(
    languageOverride,
    modelLanguageId
  );

  switch (currentLanguage) {
    case 'python':
      registerPythonTokenProvider(monaco, targetLanguageId);
      applyLanguageCompletionProviders(monaco, targetLanguageId, 'python');
      break;
    case 'javascript':
      registerJavaScriptTokenProvider(monaco, targetLanguageId);
      break;
    case 'java':
      registerJavaTokenProvider(monaco, targetLanguageId);
      applyLanguageCompletionProviders(monaco, targetLanguageId, 'java');
      break;
    case 'cpp':
      registerCppTokenProvider(monaco, targetLanguageId);
      applyLanguageCompletionProviders(monaco, targetLanguageId, 'cpp');
      break;
    default:
      break;
  }

  monaco.editor.setModelLanguage(model, targetLanguageId);
};

const logTokenization = (editor) => {
  const model = editor?.getModel();
  if (!model) return;

  const value = model.getValue();
  const lines = value.split('\n');

  lines.slice(0, 20).forEach((line) => {
    if (
      line.includes('if') ||
      line.includes('while') ||
      line.includes('for') ||
      line.includes('class') ||
      line.includes('def')
    ) {
      // console.log(line);
    }
  });
};

const getMatrixRefreshInterval = () => {
  const isHighRes = window.innerWidth > 1920 || window.innerHeight > 1080;
  return isHighRes ? 200 : 100;
};

const defineTowerTheme = (monaco) => {
  monaco.editor.defineTheme('cyberpunk', TD_EDITOR_THEME_DEF);

  monaco.editor.setTheme('cyberpunk');
};

export { applyCustomTokenProviders, defineTowerTheme, getMatrixRefreshInterval, logTokenization };
