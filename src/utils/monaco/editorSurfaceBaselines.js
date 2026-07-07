/**
 * editorSurfaceBaselines.js
 *
 * Single source of truth for the three Monaco editor surfaces in CodeGrind:
 *   - TD Editor  (tower-defense in-game editor, CodeEditorPanel)
 *   - Problem Workspace (problem-solving editor, EditorPanel)
 *   - AI Generator  (AI problem creation editor, SolutionEditor)
 *
 * Exports theme definitions, register helpers, and per-surface configs used by:
 *   - StorePage  → previews each surface baseline, then overlays equipped cosmetics
 *   - Runtime pages → import shared theme defs instead of defining inline
 */

// ---------------------------------------------------------------------------
// TD Editor theme definition
// Matches what defineTowerTheme() registers in towerTokenProviders.js
// ---------------------------------------------------------------------------
export const TD_EDITOR_THEME_DEF = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5588aa', fontStyle: 'italic' },
    { token: 'keyword', foreground: '00ccff' },
    { token: 'string', foreground: 'ffaa00' },
    { token: 'number', foreground: 'ff3366' },
    { token: 'delimiter', foreground: '777777' },
    { token: 'source', foreground: 'dddddd' },
    { token: 'brackets.forloop', foreground: '00FF00', fontStyle: 'bold' },
    { token: 'brackets.whileloop', foreground: '00FFCC', fontStyle: 'bold' },
    { token: 'brackets.ifcondition', foreground: 'FF9900', fontStyle: 'bold' },
    { token: 'brackets.function', foreground: '3399FF', fontStyle: 'bold' },
    { token: 'brackets.object', foreground: 'FFDD00', fontStyle: 'bold' },
    { token: 'brackets.trycatch', foreground: '33CCCC', fontStyle: 'bold' },
    { token: 'brackets.return', foreground: 'FF33CC', fontStyle: 'bold' },
    { token: 'brackets.switch', foreground: 'FF99CC', fontStyle: 'bold' },
    { token: 'brackets.array', foreground: 'FF5555', fontStyle: 'bold' },
    { token: 'brackets.variable', foreground: '9966FF', fontStyle: 'bold' },
    { token: 'brackets.tower', foreground: '00CCFF', fontStyle: 'bold' },
  ],
  colors: {
    'editor.background': '#0a0a1a',
    'editor.foreground': '#ddddff',
    'editorCursor.foreground': '#00ccff',
    'editor.lineHighlightBackground': '#12121f',
    'editorLineNumber.foreground': '#44aaff',
    'editor.selectionBackground': '#194085',
    'editor.wordHighlightBackground': '#1f3b6b',
    'editorLineNumber.activeForeground': '#00ffff',
    'editorIndentGuide.background': '#143850',
  },
};

// ---------------------------------------------------------------------------
// Problem Workspace theme definition
// Matches the 'cyberpunkTheme' registered inline in EditorPanel.jsx
// ---------------------------------------------------------------------------
export const WORKSPACE_EDITOR_THEME_DEF = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '608b4e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff00de' },
    { token: 'string', foreground: '00ff8c' },
    { token: 'number', foreground: 'ffdd57' },
    { token: 'function', foreground: '00ccff' },
    { token: 'type', foreground: '61afef' },
    { token: 'class', foreground: 'e683d9' },
    { token: 'variable', foreground: 'dbdbdb' },
    { token: 'operator', foreground: 'b084eb' },
    { token: 'brackets.forloop', foreground: '00ff8c', fontStyle: 'bold' },
    { token: 'brackets.whileloop', foreground: '00ccff', fontStyle: 'bold' },
    { token: 'brackets.ifcondition', foreground: 'ff00de', fontStyle: 'bold' },
    { token: 'brackets.function', foreground: '00ccff', fontStyle: 'bold' },
    { token: 'brackets.object', foreground: '61afef', fontStyle: 'bold' },
    { token: 'brackets.trycatch', foreground: 'b084eb', fontStyle: 'bold' },
    { token: 'brackets.return', foreground: 'ffdd57', fontStyle: 'bold' },
    { token: 'brackets.switch', foreground: 'e683d9', fontStyle: 'bold' },
    { token: 'brackets.array', foreground: 'ffdd57', fontStyle: 'bold' },
    { token: 'brackets.variable', foreground: 'dbdbdb', fontStyle: 'bold' },
  ],
  colors: {
    'editor.background': '#0a0e17',
    'editor.foreground': '#eeffff',
    'editorCursor.foreground': '#00ffff',
    'editor.lineHighlightBackground': '#1a2030',
    'editorLineNumber.foreground': '#858585',
    'editor.selectionBackground': '#153958',
    'editor.selectionHighlightBackground': '#0c2d50',
    'editorSuggestWidget.background': '#101020',
    'editorSuggestWidget.border': '#00ffff55',
    'editorSuggestWidget.foreground': '#eeffff',
    'editor.wordHighlightBackground': '#0c2d50',
    'editorLineNumber.activeForeground': '#00ffff',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#ffffff10',
    'scrollbarSlider.hoverBackground': '#ffffff20',
    'scrollbarSlider.activeBackground': '#ffffff30',
  },
};

// ---------------------------------------------------------------------------
// AI Generator theme definition
// Matches the 'cyberpunk' theme registered inline in SolutionEditor.jsx
// ---------------------------------------------------------------------------
export const AI_EDITOR_THEME_DEF = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '00FFFF' },
    { token: 'string', foreground: 'FF00DE' },
    { token: 'number', foreground: 'FFCC00' },
    { token: 'operator', foreground: '00FFFF' },
    { token: 'function', foreground: '00FF8C' },
    { token: 'type', foreground: '00B4FF' },
    { token: 'identifier', foreground: 'E6E6E6' },
    { token: 'brackets.forloop', foreground: '00FFFF', fontStyle: 'bold' },
    { token: 'brackets.whileloop', foreground: '00B4FF', fontStyle: 'bold' },
    { token: 'brackets.ifcondition', foreground: 'FF00DE', fontStyle: 'bold' },
    { token: 'brackets.function', foreground: '00FF8C', fontStyle: 'bold' },
    { token: 'brackets.object', foreground: '00B4FF', fontStyle: 'bold' },
    { token: 'brackets.trycatch', foreground: 'FFCC00', fontStyle: 'bold' },
    { token: 'brackets.return', foreground: 'FFCC00', fontStyle: 'bold' },
    { token: 'brackets.switch', foreground: 'FF00DE', fontStyle: 'bold' },
    { token: 'brackets.array', foreground: 'FFCC00', fontStyle: 'bold' },
    { token: 'brackets.variable', foreground: 'E6E6E6', fontStyle: 'bold' },
  ],
  colors: {
    'editor.background': '#0f1012',
    'editor.foreground': '#E6E6E6',
    'editorCursor.foreground': '#00FFFF',
    'editor.lineHighlightBackground': '#1a1a2e',
    'editorLineNumber.foreground': '#4A5568',
    'editorLineNumber.activeForeground': '#00FFFF',
    'editor.selectionBackground': 'rgba(0, 255, 255, 0.3)',
  },
};

// ---------------------------------------------------------------------------
// Store preview theme names (unique names to avoid collisions when
// switching surfaces in the Store preview — never conflict with runtime names)
// ---------------------------------------------------------------------------
export const STORE_TD_THEME_NAME = 'cg-surface-td';
export const STORE_WORKSPACE_THEME_NAME = 'cg-surface-workspace';
export const STORE_AI_THEME_NAME = 'cg-surface-ai';

// ---------------------------------------------------------------------------
// Runtime theme names (used by the actual pages — kept separate so
// runtime pages can keep using their existing string references)
// ---------------------------------------------------------------------------
export const TD_RUNTIME_THEME_NAME = 'cyberpunk';
export const WORKSPACE_RUNTIME_THEME_NAME = 'cyberpunkTheme';
export const AI_RUNTIME_THEME_NAME = 'cyberpunkAi';

// ---------------------------------------------------------------------------
// Sample snippets — each showcases the surface's token coloring
// ---------------------------------------------------------------------------
const TD_SAMPLE_SNIPPET = `class Tower:
    def __init__(self):
        self.level = 1
        self.damage = 10

    def attack(self, enemies):
        for enemy in enemies:
            if enemy.health > 0:
                try:
                    enemy.health -= self.damage
                    return enemy
                except Exception:
                    pass
        while self.level < 5:
            self.level += 1`;

const WORKSPACE_SAMPLE_SNIPPET = `def two_sum(nums, target):
    # Find indices of two numbers summing to target
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

class Solution:
    def max_profit(self, prices):
        min_price = float('inf')
        max_profit = 0
        for price in prices:
            if price < min_price:
                min_price = price
            elif price - min_price > max_profit:
                max_profit = price - min_price
        return max_profit`;

const AI_SAMPLE_SNIPPET = `def solve(nums, target):
    # AI-generated two-pointer solution
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        elif total < target:
            left += 1
        else:
            right -= 1
    return []`;

// ---------------------------------------------------------------------------
// Per-surface configuration used by the Store preview
// ---------------------------------------------------------------------------
export const EDITOR_SURFACE_CONFIGS = {
  tdEditor: {
    label: 'TD Editor',
    themeDef: TD_EDITOR_THEME_DEF,
    storeThemeName: STORE_TD_THEME_NAME,
    applyTokenProviders: true,
    sampleSnippet: TD_SAMPLE_SNIPPET,
    language: 'python',
    defaultBackground: '#0a0a1a',
  },
  problemWorkspace: {
    label: 'Problem Workspace',
    themeDef: WORKSPACE_EDITOR_THEME_DEF,
    storeThemeName: STORE_WORKSPACE_THEME_NAME,
    applyTokenProviders: false,
    sampleSnippet: WORKSPACE_SAMPLE_SNIPPET,
    language: 'python',
    defaultBackground: '#0a0e17',
  },
  aiGenerator: {
    label: 'AI Generator',
    themeDef: AI_EDITOR_THEME_DEF,
    storeThemeName: STORE_AI_THEME_NAME,
    applyTokenProviders: false,
    sampleSnippet: AI_SAMPLE_SNIPPET,
    language: 'python',
    defaultBackground: '#0f1012',
  },
};

export const EDITOR_SURFACE_KEYS = ['tdEditor', 'problemWorkspace', 'aiGenerator'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Register a surface's baseline theme in the Store preview context.
 * Uses unique store-specific theme names to avoid collisions when switching.
 *
 * @param {object} monaco  - Monaco instance
 * @param {string} surface - One of EDITOR_SURFACE_KEYS
 * @returns {string}       - The registered theme name
 */
export const registerSurfaceThemeForStore = (monaco, surface) => {
  const config = EDITOR_SURFACE_CONFIGS[surface];
  if (!config) return STORE_TD_THEME_NAME;
  monaco.editor.defineTheme(config.storeThemeName, config.themeDef);
  return config.storeThemeName;
};

/**
 * Register the TD baseline theme under the runtime theme name 'cyberpunk'.
 * Used by CodeEditorPanel (Phase 2) in place of the inline defineTowerTheme().
 *
 * @param {object} monaco - Monaco instance
 */
export const registerTdRuntimeTheme = (monaco) => {
  monaco.editor.defineTheme(TD_RUNTIME_THEME_NAME, TD_EDITOR_THEME_DEF);
};

/**
 * Register the Problem Workspace baseline theme under 'cyberpunkTheme'.
 * Used by EditorPanel (Phase 2) in place of the inline theme definition.
 *
 * @param {object} monaco - Monaco instance
 */
export const registerWorkspaceRuntimeTheme = (monaco) => {
  monaco.editor.defineTheme(WORKSPACE_RUNTIME_THEME_NAME, WORKSPACE_EDITOR_THEME_DEF);
};

/**
 * Register the AI Generator baseline theme under 'cyberpunk'.
 * Used by SolutionEditor (Phase 2) in place of the inline theme definition.
 *
 * @param {object} monaco - Monaco instance
 */
export const registerAiRuntimeTheme = (monaco) => {
  monaco.editor.defineTheme(AI_RUNTIME_THEME_NAME, AI_EDITOR_THEME_DEF);
};
