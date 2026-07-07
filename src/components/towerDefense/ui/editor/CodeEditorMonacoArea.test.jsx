import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { monacoEditorMock, mobileSyntaxTextareaMock } = vi.hoisted(() => ({
  monacoEditorMock: vi.fn(({ value }) => <div data-testid="monaco-editor">{value}</div>),
  mobileSyntaxTextareaMock: vi.fn(({ value }) => (
    <div data-testid="mobile-syntax-textarea">{value}</div>
  )),
}));

vi.mock('@monaco-editor/react', () => ({
  default: monacoEditorMock,
}));

vi.mock('../../../editor/MobileSyntaxTextarea', () => ({
  default: mobileSyntaxTextareaMock,
}));

vi.mock('../../../../utils/web/detectPhoneFriendlyEditorMode', () => ({
  default: vi.fn(() => true),
}));

vi.mock('./SnippetReviewWidget', () => ({
  default: () => null,
}));

vi.mock('../TowerPlacementInfo', () => ({
  default: () => null,
}));

import CodeEditorMonacoArea from './CodeEditorMonacoArea';

const renderEditor = (props = {}) =>
  render(
    <ChakraProvider>
      <CodeEditorMonacoArea
        editorHeight="320px"
        showTerminal={false}
        language="javascript"
        code="const answer = 41;"
        onCodeChange={vi.fn()}
        onEditorDidMount={vi.fn()}
        snippetReviewWidget={{ visible: false, top: 0, left: 0 }}
        onSnippetAction={vi.fn()}
        selectedTowerType={null}
        isTowerPlacementMode={false}
        {...props}
      />
    </ChakraProvider>
  );

describe('CodeEditorMonacoArea mobile mode', () => {
  it('renders MobileSyntaxTextarea in phone mode and reports phone mode', async () => {
    const onPhoneModeChange = vi.fn();

    renderEditor({ isMobileSlotLayout: true, onPhoneModeChange });

    expect(screen.getByTestId('mobile-syntax-textarea')).toBeInTheDocument();

    await waitFor(() => {
      expect(onPhoneModeChange).toHaveBeenCalledWith(true);
    });

    expect(screen.queryByRole('button', { name: /hide keyboard/i })).not.toBeInTheDocument();
  });

  it('forwards cosmetic and configuration props to MobileSyntaxTextarea in phone mode', () => {
    renderEditor({
      isMobileSlotLayout: true,
      editorThemePack: { id: 'test-theme' },
      editorFontPack: { fontFamily: 'Courier' },
      editorEffectPack: { cursorGlow: true },
    });

    const lastCall = mobileSyntaxTextareaMock.mock.calls.at(-1)?.[0];

    expect(lastCall?.themePack?.id).toBe('test-theme');
    expect(lastCall?.fontPack?.fontFamily).toBe('Courier');
    expect(lastCall?.effectPack?.cursorGlow).toBe(true);
  });

  it('keeps phone mode disabled in two-slot layout even when the viewport looks like a phone', async () => {
    const onPhoneModeChange = vi.fn();

    renderEditor({ onPhoneModeChange });

    await waitFor(() => {
      expect(onPhoneModeChange).toHaveBeenCalledWith(false);
    });

    const lastCall = monacoEditorMock.mock.calls.at(-1)?.[0];

    expect(lastCall?.options?.quickSuggestions).not.toBe(false);
    expect(lastCall?.options?.tabCompletion).not.toBe('off');
  });
});
