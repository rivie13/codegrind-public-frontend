export const ensureMonacoTheme = (monaco, themePack, overrides = {}) => {
  if (!monaco || !themePack?.id) return;

  const themeName = `cg-cosmetic-${themePack.id}`;
  const tokenColors = {
    ...themePack.tokenColors,
    ...(overrides.tokenColors || {}),
  };
  const editorColors = {
    ...themePack.editorColors,
    ...(overrides.editorColors || {}),
  };

  // Map bracket token colors (these are what the Monarch tokenizer actually emits)
  const ifconditionColor = stripHash(tokenColors['brackets.ifcondition'] || tokenColors.keyword);
  const forloopColor = stripHash(tokenColors['brackets.forloop'] || tokenColors.keyword);
  const whileloopColor = stripHash(tokenColors['brackets.whileloop'] || tokenColors.keyword);
  const functionColor = stripHash(tokenColors['brackets.function'] || tokenColors.keyword);
  const objectColor = stripHash(tokenColors['brackets.object'] || tokenColors.keyword);
  const trycatchColor = stripHash(tokenColors['brackets.trycatch'] || tokenColors.keyword);
  const returnColor = stripHash(tokenColors['brackets.return'] || tokenColors.keyword);

  monaco.editor.defineTheme(themeName, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: stripHash(tokenColors.comment), fontStyle: 'italic' },
      { token: 'keyword', foreground: stripHash(tokenColors.keyword) },
      { token: 'string', foreground: stripHash(tokenColors.string) },
      { token: 'number', foreground: stripHash(tokenColors.number) },
      { token: 'function', foreground: stripHash(tokenColors.function) },
      { token: 'type', foreground: stripHash(tokenColors.type) },
      { token: 'variable', foreground: stripHash(tokenColors.variable) },
      { token: 'operator', foreground: stripHash(tokenColors.operator) },
      // Tower concept bracket token colors (emitted by Monarch tokenizer)
      { token: 'brackets.forloop', foreground: forloopColor, fontStyle: 'bold' },
      { token: 'brackets.whileloop', foreground: whileloopColor, fontStyle: 'bold' },
      { token: 'brackets.ifcondition', foreground: ifconditionColor, fontStyle: 'bold' },
      { token: 'brackets.function', foreground: functionColor, fontStyle: 'bold' },
      { token: 'brackets.object', foreground: objectColor, fontStyle: 'bold' },
      { token: 'brackets.trycatch', foreground: trycatchColor, fontStyle: 'bold' },
      { token: 'brackets.return', foreground: returnColor, fontStyle: 'bold' },
      { token: 'brackets.switch', foreground: ifconditionColor, fontStyle: 'bold' },
      { token: 'brackets.array', foreground: objectColor, fontStyle: 'bold' },
      {
        token: 'brackets.variable',
        foreground: stripHash(tokenColors.variable),
        fontStyle: 'bold',
      },
    ],
    colors: {
      'editor.background': editorColors.background,
      'editor.foreground': editorColors.foreground,
      'editor.lineHighlightBackground': editorColors.lineHighlight,
      'editorLineNumber.foreground': editorColors.lineNumber,
      'editorLineNumber.activeForeground': editorColors.lineNumberActive,
      'editor.selectionBackground': editorColors.selection,
      'editor.selectionHighlightBackground': editorColors.selectionHighlight,
      'editorCursor.foreground': editorColors.cursor,
      'editorSuggestWidget.background': '#0F172A',
      'editorSuggestWidget.border': '#334155',
      'editorSuggestWidget.foreground': editorColors.foreground,
      ...(overrides.monacoColors || {}),
    },
  });
};

export const getMonacoThemeName = (themePackId) => `cg-cosmetic-${themePackId}`;

export const buildMonacoOptionsFromFont = (fontPack) => ({
  fontFamily: fontPack?.fontFamily || "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  fontSize: fontPack?.fontSize || 14,
  lineHeight: Math.round((fontPack?.lineHeight || 1.55) * 16),
  fontLigatures: Boolean(fontPack?.fontLigatures),
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  smoothScrolling: true,
  cursorBlinking: 'phase',
  renderLineHighlight: 'all',
});

function stripHash(hex = '') {
  return String(hex).replace(/^#/, '');
}
