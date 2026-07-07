import { describe, expect, it, vi } from 'vitest';
import {
  AI_EDITOR_THEME_DEF,
  AI_RUNTIME_THEME_NAME,
  TD_RUNTIME_THEME_NAME,
  WORKSPACE_EDITOR_THEME_DEF,
  registerAiRuntimeTheme,
  registerWorkspaceRuntimeTheme,
} from './editorSurfaceBaselines';

describe('editorSurfaceBaselines', () => {
  it('uses distinct runtime theme names for TD and AI', () => {
    expect(TD_RUNTIME_THEME_NAME).not.toBe(AI_RUNTIME_THEME_NAME);
  });

  it('defines Monaco token rule foregrounds without leading hash for workspace and AI', () => {
    const foregrounds = [...WORKSPACE_EDITOR_THEME_DEF.rules, ...AI_EDITOR_THEME_DEF.rules]
      .map((rule) => rule.foreground)
      .filter(Boolean);

    expect(foregrounds.length).toBeGreaterThan(0);
    expect(foregrounds.every((color) => !String(color).startsWith('#'))).toBe(true);
  });

  it('includes bracket keyword token rules for workspace and AI themes', () => {
    const workspaceTokens = new Set(WORKSPACE_EDITOR_THEME_DEF.rules.map((rule) => rule.token));
    const aiTokens = new Set(AI_EDITOR_THEME_DEF.rules.map((rule) => rule.token));

    expect(workspaceTokens.has('brackets.ifcondition')).toBe(true);
    expect(workspaceTokens.has('brackets.forloop')).toBe(true);
    expect(aiTokens.has('brackets.ifcondition')).toBe(true);
    expect(aiTokens.has('brackets.forloop')).toBe(true);
  });

  it('registers workspace and AI runtime themes under their dedicated names', () => {
    const monaco = {
      editor: {
        defineTheme: vi.fn(),
      },
    };

    registerWorkspaceRuntimeTheme(monaco);
    registerAiRuntimeTheme(monaco);

    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      'cyberpunkTheme',
      expect.objectContaining({ rules: expect.any(Array) })
    );
    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      AI_RUNTIME_THEME_NAME,
      expect.objectContaining({ rules: expect.any(Array) })
    );
  });
});
