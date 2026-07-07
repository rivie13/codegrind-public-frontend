import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  activeToastIds,
  toastMock,
  prewarmMock,
  analyzeCodeMock,
  getTowerByTypeMock,
  submitSolutionRequestMock,
  runCodeTestsRequestMock,
  runCodeOutputRequestMock,
  getEnhancedTowerCodeSnippetMock,
  getTowerCodeSnippetMock,
  getCodeSnippetForLanguageMock,
  createDetachedSnippetPreviewMock,
  insertSnippetIntoEditorMock,
  insertSnippetPreviewMock,
  registerGeneratedLinesMock,
  suppressNextLineCommitIfMultilineMock,
  getDerivedTowerTypeMock,
} = vi.hoisted(() => {
  const activeToastIds = new Set();
  const toastMock = vi.fn();
  toastMock.isActive = vi.fn((id) => activeToastIds.has(id));

  return {
    activeToastIds,
    toastMock,
    prewarmMock: vi.fn(),
    analyzeCodeMock: vi.fn(),
    getTowerByTypeMock: vi.fn(),
    submitSolutionRequestMock: vi.fn(),
    runCodeTestsRequestMock: vi.fn(),
    runCodeOutputRequestMock: vi.fn(),
    getEnhancedTowerCodeSnippetMock: vi.fn(),
    getTowerCodeSnippetMock: vi.fn(),
    getCodeSnippetForLanguageMock: vi.fn(),
    createDetachedSnippetPreviewMock: vi.fn(),
    insertSnippetIntoEditorMock: vi.fn(),
    insertSnippetPreviewMock: vi.fn(),
    registerGeneratedLinesMock: vi.fn(),
    suppressNextLineCommitIfMultilineMock: vi.fn(),
    getDerivedTowerTypeMock: vi.fn(),
  };
});

vi.mock('@chakra-ui/react', () => ({
  useToast: () => toastMock,
}));

vi.mock('../../../services/api', () => ({
  api: {
    codeExecution: {
      prewarm: prewarmMock,
    },
    ai: {
      analyzeCode: analyzeCodeMock,
    },
  },
}));

vi.mock('../../../game-engine-v2', () => ({
  getTowerByType: getTowerByTypeMock,
}));

vi.mock('./executionHandlers', () => ({
  submitSolutionRequest: submitSolutionRequestMock,
  runCodeTestsRequest: runCodeTestsRequestMock,
  runCodeOutputRequest: runCodeOutputRequestMock,
}));

vi.mock('@rivie13/premium-core/sync/towerDefense/CodeSnippetManager', () => ({
  default: {
    getEnhancedTowerCodeSnippet: getEnhancedTowerCodeSnippetMock,
    getTowerCodeSnippet: getTowerCodeSnippetMock,
    getCodeSnippetForLanguage: getCodeSnippetForLanguageMock,
  },
}));

vi.mock('../../../utils/audio/AudioManager', () => ({
  default: {},
}));

vi.mock('../../../utils/game/VisualSettingsManager', () => ({
  default: {
    getSettings: vi.fn(() => ({ aiCodeSnippetGeneration: true })),
  },
}));

vi.mock('../../../utils/code/promptInjectionPrevention', () => ({
  prepareForPrompt: vi.fn((value) => value),
}));

vi.mock('./snippetInsertion', () => ({
  createDetachedSnippetPreview: createDetachedSnippetPreviewMock,
  insertSnippetIntoEditor: insertSnippetIntoEditorMock,
  insertSnippetPreview: insertSnippetPreviewMock,
  registerGeneratedLines: registerGeneratedLinesMock,
  suppressNextLineCommitIfMultiline: suppressNextLineCommitIfMultilineMock,
  hydrateSnippetPreview: vi.fn((preview) => preview),
}));

vi.mock('./snippetAnalysis', () => ({
  getDerivedTowerType: getDerivedTowerTypeMock,
}));

vi.mock('@rivie13/premium-core/sync/towerDefense/coreTowerRequirements', () => ({
  areRequiredCoreTowersPlaced: vi.fn(() => true),
  resolveCoreTowerRequirements: vi.fn(() => ({ function: true, object: true })),
}));

import useCodeEditor from './useCodeEditor';

const createEnhancedResult = (overrides = {}) => ({
  snippet: 'fallback_line()\n',
  rateLimited: false,
  rateInfo: null,
  fallbackReason: 'ai_generation_failed',
  ...overrides,
});

const loadHook = ({
  enhancedResult = createEnhancedResult(),
  activeToastIds: nextActiveIds = [],
} = {}) => {
  activeToastIds.clear();
  nextActiveIds.forEach((id) => activeToastIds.add(id));
  getEnhancedTowerCodeSnippetMock.mockResolvedValue(enhancedResult);

  const addTerminalMessage = vi.fn();
  const hook = renderHook(() =>
    useCodeEditor({
      problem: { id: 'problem-1', titleSlug: 'two-sum' },
      addTerminalMessage,
    })
  );

  return {
    hook,
    toast: toastMock,
    addTerminalMessage,
  };
};

describe('useCodeEditor snippet fallback toasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    activeToastIds.clear();
    toastMock.isActive.mockImplementation((id) => activeToastIds.has(id));
    prewarmMock.mockResolvedValue({});
    analyzeCodeMock.mockResolvedValue({});
    getTowerByTypeMock.mockImplementation((towerType) => ({ type: towerType }));
    getEnhancedTowerCodeSnippetMock.mockResolvedValue(createEnhancedResult());
    getTowerCodeSnippetMock.mockImplementation(
      (towerType, language, count) => `fallback-${towerType}-${language}-${count}`
    );
    getCodeSnippetForLanguageMock.mockReturnValue('class Solution:\n    pass\n');
    createDetachedSnippetPreviewMock.mockReturnValue(null);
    insertSnippetIntoEditorMock.mockImplementation((snippet) => snippet);
    insertSnippetPreviewMock.mockReturnValue(null);
    registerGeneratedLinesMock.mockImplementation(() => {});
    suppressNextLineCommitIfMultilineMock.mockImplementation(() => {});
    getDerivedTowerTypeMock.mockReturnValue(null);
  });

  it('shows a warning toast when AI snippet generation falls back to a deterministic snippet', async () => {
    const { hook, toast, addTerminalMessage } = loadHook({
      enhancedResult: createEnhancedResult({
        fallbackReason: 'ai_generation_failed',
      }),
    });

    act(() => {
      hook.result.current.setInitialCodeGenerated(true);
    });

    await act(async () => {
      await hook.result.current.addTowerCodeSnippet('Switch');
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'td-ai-snippet-unavailable',
        title: 'AI snippet unavailable',
        status: 'warning',
      })
    );
    expect(addTerminalMessage).toHaveBeenCalledWith(
      '[MODULE] Added Switch: AI snippet generation was unavailable, so standard code structure was inserted.'
    );
  });

  it('shows a warning toast when a basic snippet fallback is inserted after AI quota flow', async () => {
    const { hook, toast, addTerminalMessage } = loadHook({
      enhancedResult: createEnhancedResult({
        snippet: 'basic_line()\n',
        rateLimited: true,
        rateInfo: { message: 'AI snippet limit reached. Using basic snippet fallback.' },
        fallbackReason: 'basic_snippet_fallback',
      }),
    });

    act(() => {
      hook.result.current.setInitialCodeGenerated(true);
    });

    await act(async () => {
      await hook.result.current.addTowerCodeSnippet('Array');
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'td-basic-snippet-fallback',
        title: 'Basic snippet used',
        status: 'warning',
      })
    );
    expect(addTerminalMessage).toHaveBeenCalledWith(
      '[MODULE] Added Array: AI snippet limit reached. Using basic snippet fallback.'
    );
  });

  it('does not duplicate an active snippet fallback toast', async () => {
    const { hook, toast } = loadHook({
      enhancedResult: createEnhancedResult({
        fallbackReason: 'ai_generation_failed',
      }),
      activeToastIds: ['td-ai-snippet-unavailable'],
    });

    act(() => {
      hook.result.current.setInitialCodeGenerated(true);
    });

    await act(async () => {
      await hook.result.current.addTowerCodeSnippet('Switch');
    });

    expect(toast).not.toHaveBeenCalled();
  });

  it('restores the previous code when denying a pending preview snapshot', async () => {
    const detachedPreview = {
      beforeValue: 'def solve():\n  pass',
      value: 'def solve():\n  pass\n  if ready:\n    ',
      decorationIds: [],
      highlightRange: {
        startLineNumber: 2,
        startColumn: 7,
        endLineNumber: 3,
        endColumn: 5,
      },
      endPosition: { lineNumber: 3, column: 5 },
      cursorPosition: { lineNumber: 2, column: 7 },
      selectionRange: null,
    };

    insertSnippetPreviewMock.mockReturnValue(detachedPreview);

    const { hook } = loadHook({
      enhancedResult: {
        snippet: 'if ready:',
        rateLimited: false,
        rateInfo: null,
        fallbackReason: null,
        autoRetry: null,
        message: null,
      },
    });

    act(() => {
      hook.result.current.setCode(detachedPreview.beforeValue);
      hook.result.current.setInitialCodeGenerated(true);
    });

    await act(async () => {
      await hook.result.current.addTowerCodeSnippet('Switch');
    });

    expect(hook.result.current.code).toBe(detachedPreview.value);
    expect(window.__tdPendingSnippet?.preview).toEqual(detachedPreview);

    act(() => {
      window.__tdPendingSnippetActions?.deny?.();
    });

    expect(hook.result.current.code).toBe(detachedPreview.beforeValue);
    expect(window.__tdPendingSnippet).toBeNull();
  });
});

