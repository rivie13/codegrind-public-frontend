import React, { useEffect, useRef } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fakeEditor,
  hydrateSnippetPreviewMock,
  codeEditorHeaderSpy,
  detectPhoneFriendlyEditorModeMock,
  handleResizeStartMock,
} = vi.hoisted(() => {
  const fakeEditor = {
    getModel: vi.fn(() => ({
      getLineCount: vi.fn(() => 4),
      getLineMaxColumn: vi.fn(() => 5),
    })),
    setPosition: vi.fn(),
    revealPositionInCenterIfOutsideViewport: vi.fn(),
    revealLineInCenter: vi.fn(),
    focus: vi.fn(),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
    updateOptions: vi.fn(),
  };

  return {
    fakeEditor,
    hydrateSnippetPreviewMock: vi.fn((preview) => preview),
    codeEditorHeaderSpy: vi.fn(),
    detectPhoneFriendlyEditorModeMock: vi.fn(() => false),
    handleResizeStartMock: vi.fn(),
  };
});

vi.mock('../../../../hooks/animations/useMatrixBombEffect', () => ({
  useMatrixBombEffect: () => ({
    updateMatrixEffect: vi.fn(),
    startMatrixBomb: vi.fn(),
    stopMatrixBomb: vi.fn(),
  }),
}));

vi.mock('./CodeEditorHeader', () => ({
  default: (props) => {
    codeEditorHeaderSpy(props);
    return <div data-testid="code-editor-header" />;
  },
}));

vi.mock('./CodeEditorSetupPanel', () => ({
  default: () => <div data-testid="code-editor-setup" />,
}));

vi.mock('./CodeEditorMonacoArea', () => ({
  default: function MockCodeEditorMonacoArea({ onEditorDidMount, onPhoneModeChange }) {
    const didMountRef = useRef(false);

    useEffect(() => {
      if (didMountRef.current) return;
      didMountRef.current = true;
      onEditorDidMount(fakeEditor, {
        editor: {
          setTheme: vi.fn(),
        },
        languages: {},
      });
      onPhoneModeChange?.(true);
    }, [onEditorDidMount]);

    return <div data-testid="code-editor-monaco-area" />;
  },
}));

vi.mock('../../../../utils/web/detectPhoneFriendlyEditorMode', () => ({
  default: detectPhoneFriendlyEditorModeMock,
}));

vi.mock('./SnippetReviewWidget', () => ({
  default: () => null,
}));

vi.mock('../../terminal/TowerDefenseTerminal', () => ({
  default: () => <div data-testid="td-terminal" />,
}));

vi.mock('../../../../hooks/towerDefense/codeEditor/ui/useSnippetReviewWidget', () => ({
  default: () => ({
    widgetState: { visible: false, top: 0, left: 0 },
    handleAction: vi.fn(),
  }),
}));

vi.mock('../../../../hooks/towerDefense/codeEditor/ui/useEditorSplitPane', () => ({
  default: () => ({
    editorHeight: '60%',
    terminalHeight: '40%',
    containerRef: { current: null },
    resizeHandleRef: { current: null },
    handleResizeStart: handleResizeStartMock,
  }),
}));

vi.mock('../../../../hooks/cosmetics/useEquippedCosmetics', () => ({
  default: () => ({
    editorThemePack: null,
    editorFontPack: null,
    editorBackgroundPack: null,
    editorEffectPack: null,
  }),
}));

vi.mock('../../../../utils/monaco/towerTokenProviders', () => ({
  applyCustomTokenProviders: vi.fn(),
  defineTowerTheme: vi.fn(),
  getMatrixRefreshInterval: vi.fn(() => 1000),
  logTokenization: vi.fn(),
}));

vi.mock('../../../../utils/monaco/cosmeticThemeTools', () => ({
  buildMonacoOptionsFromFont: vi.fn(() => ({})),
  ensureMonacoTheme: vi.fn(),
  getMonacoThemeName: vi.fn(() => 'cyberpunk'),
}));

vi.mock('../../../../utils/game/VisualSettingsManager', () => ({
  default: {
    getSettings: vi.fn(() => ({ editorMatrixEnabled: false })),
  },
}));

vi.mock('../../../../hooks/towerDefense/codeEditor/snippetInsertion', () => ({
  hydrateSnippetPreview: hydrateSnippetPreviewMock,
}));

import CodeEditorPanel from './CodeEditorPanel';

const baseProps = {
  initialCodeGenerated: true,
  playerLost: false,
  playerWon: false,
  initialLives: 10,
  language: 'python',
  code: 'class Solution:\n    pass\n    seen = set()\n',
  showTerminal: true,
  terminalOutput: '',
  terminalAnimating: false,
  terminalRef: { current: null },
  terminalResetKey: 0,
  codeSubmitted: false,
  codeSubmissionSuccess: null,
  canSubmitSolution: true,
  currentWave: 1,
  lives: 10,
  adSlotId: null,
  selectedTowerType: null,
  isTowerPlacementMode: false,
  onLanguageChange: vi.fn(),
  onCodeChange: vi.fn(),
  onStartWave: vi.fn(),
  onResetGame: vi.fn(),
  onCancelTowerPlacement: vi.fn(),
  gameStatus: 'ready',
  problemTitle: 'Detect Rogue Daemon Duplicate',
  difficulty: 'Easy',
  onTerminalCommand: vi.fn(),
  terminalInputEnabled: false,
  terminalInputPlaceholder: 'Type /tower help',
  terminalInputDisabledReason: 'Commands are locked during active waves.',
};

const renderPanel = (props = {}) =>
  render(
    <ChakraProvider>
      <CodeEditorPanel {...baseProps} {...props} />
    </ChakraProvider>
  );

describe('CodeEditorPanel pending snippet focus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeEditor.setPosition.mockClear();
    fakeEditor.focus.mockClear();
    handleResizeStartMock.mockClear();
    detectPhoneFriendlyEditorModeMock.mockReturnValue(false);
    window.__tdPendingSnippet = {
      preview: {
        highlightRange: {
          startLineNumber: 3,
          startColumn: 5,
          endLineNumber: 4,
          endColumn: 1,
        },
      },
    };
    window.requestAnimationFrame = vi.fn((callback) => {
      callback();
      return 1;
    });
  });

  afterEach(() => {
    delete window.__tdPendingSnippet;
  });

  it('does not move the cursor to EOF when hydrating a pending snippet preview', async () => {
    renderPanel();

    await waitFor(() => {
      expect(hydrateSnippetPreviewMock).toHaveBeenCalled();
    });

    expect(fakeEditor.setPosition).not.toHaveBeenCalled();
  });

  it('keeps mobile keyboard visibility disabled outside single-slot layout', async () => {
    renderPanel();

    await waitFor(() => {
      expect(codeEditorHeaderSpy.mock.calls.length).toBeGreaterThan(1);
    });

    expect(
      codeEditorHeaderSpy.mock.calls.some(([props]) => props?.showMobileKeyboardButton === true)
    ).toBe(false);
  });

  it('passes mobile keyboard visibility to the header in single-slot phone mode', async () => {
    renderPanel({ isMobileSlotLayout: true });

    await waitFor(() => {
      expect(
        codeEditorHeaderSpy.mock.calls.some(([props]) => props?.showMobileKeyboardButton === true)
      ).toBe(true);
    });
  });

  it('renders a larger mobile resize handle and wires pointer drag start', () => {
    renderPanel({ isMobileSlotLayout: true });

    const resizeHandle = screen.getByLabelText('Resize editor and terminal');
    expect(resizeHandle).toHaveStyle({ height: '20px' });

    fireEvent.pointerDown(resizeHandle, { clientY: 240, pointerId: 7, pointerType: 'touch' });

    expect(handleResizeStartMock).toHaveBeenCalledTimes(1);
  });
});
