import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { monacoEditorMock, mobileSyntaxTextareaMock } = vi.hoisted(() => ({
  monacoEditorMock: vi.fn(({ value }) => <div data-testid="monaco-editor">{value}</div>),
  mobileSyntaxTextareaMock: vi.fn(({ value }) => (
    <div data-testid="mobile-syntax-textarea">{value}</div>
  )),
}));

vi.mock('@monaco-editor/react', () => ({
  default: monacoEditorMock,
  useMonaco: () => ({
    editor: {
      setTheme: vi.fn(),
      defineTheme: vi.fn(),
    },
  }),
}));

vi.mock('../../editor/MobileSyntaxTextarea', () => ({
  default: mobileSyntaxTextareaMock,
}));

vi.mock('../../../hooks/cosmetics/useEquippedCosmetics', () => ({
  default: () => ({
    editorThemePack: { id: 'cyberpunk-theme' },
    editorFontPack: { fontFamily: 'Courier' },
    editorBackgroundPack: { background: 'darkblue' },
    editorEffectPack: { cursorGlow: true },
  }),
}));

vi.mock('./EditorToolbar', () => ({
  default: () => <div data-testid="editor-toolbar">Toolbar</div>,
}));

vi.mock('./EditorFooter', () => ({
  default: () => <div data-testid="editor-footer">Footer</div>,
}));

vi.mock('re-resizable', () => ({
  Resizable: ({ children }) => <div data-testid="resizable-container">{children}</div>,
}));

import EditorPanel from './EditorPanel';

const defaultProps = {
  displayCode: 'print("hello")',
  language: 'python',
  onChange: vi.fn(),
  onLanguageChange: vi.fn(),
  isExecuting: false,
  executionResult: '',
  onRun: vi.fn(),
  onRunOutput: vi.fn(),
  onSubmit: vi.fn(),
  mode: 'practice',
  timer: 0,
  sessionSubmissions: 0,
  bestTime: 0,
  highScore: 0,
  formatTime: vi.fn((t) => `${t}s`),
  setCurrentLine: vi.fn(),
  setMatrixBombActive: vi.fn(),
  challengeState: {},
  setCursorPosition: vi.fn(),
  setEditor: vi.fn(),
  isHighRes: false,
  animationsEnabled: true,
  toggleAnimations: vi.fn(),
  isChatVisible: false,
  onToggleChatVisibility: vi.fn(),
  executionRateLimit: null,
};

const renderEditorPanel = (props = {}) =>
  render(
    <ChakraProvider>
      <EditorPanel {...defaultProps} {...props} />
    </ChakraProvider>
  );

describe('EditorPanel mobile check', () => {
  it('renders Monaco Editor in desktop mode (isMobilePhoneMode = false)', () => {
    renderEditorPanel({ isMobilePhoneMode: false });

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-syntax-textarea')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Tap here to type on the active line')
    ).not.toBeInTheDocument();
  });

  it('renders MobileSyntaxTextarea in mobile mode (isMobilePhoneMode = true) and forwards cosmetics and config props', () => {
    renderEditorPanel({ isMobilePhoneMode: true });

    expect(screen.getByTestId('mobile-syntax-textarea')).toBeInTheDocument();
    expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Tap here to type on the active line')
    ).not.toBeInTheDocument();

    const lastCall = mobileSyntaxTextareaMock.mock.calls.at(-1)?.[0];
    expect(lastCall?.themePack?.id).toBe('cyberpunk-theme');
    expect(lastCall?.fontPack?.fontFamily).toBe('Courier');
    expect(lastCall?.effectPack?.cursorGlow).toBe(true);
    expect(lastCall?.backgroundStyle?.background).toBe('darkblue');
  });
});
