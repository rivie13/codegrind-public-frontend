import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useLearningUnlockCodeRestore from './useLearningUnlockCodeRestore';

describe('useLearningUnlockCodeRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.__tdMonacoEditor;
  });

  afterEach(() => {
    delete window.__tdMonacoEditor;
  });

  it('regenerates the starter snippet when unlock is active and the editor is empty', async () => {
    const generateInitialCodeSnippet = vi.fn();
    const setInitialCodeGenerated = vi.fn();

    renderHook(() =>
      useLearningUnlockCodeRestore({
        isLearningMode: true,
        learningUnlockActive: true,
        requiredCoreTowersPlaced: true,
        initialCodeGenerated: false,
        code: '',
        generateInitialCodeSnippet,
        setInitialCodeGenerated,
      })
    );

    await waitFor(() => {
      expect(generateInitialCodeSnippet).toHaveBeenCalledWith({ force: true });
    });
    expect(setInitialCodeGenerated).not.toHaveBeenCalled();
  });

  it('only marks code as generated when the editor already contains code', async () => {
    const generateInitialCodeSnippet = vi.fn();
    const setInitialCodeGenerated = vi.fn();

    renderHook(() =>
      useLearningUnlockCodeRestore({
        isLearningMode: true,
        learningUnlockActive: true,
        requiredCoreTowersPlaced: true,
        initialCodeGenerated: false,
        code: 'def solve():\n    return 1',
        generateInitialCodeSnippet,
        setInitialCodeGenerated,
      })
    );

    await waitFor(() => {
      expect(setInitialCodeGenerated).toHaveBeenCalledWith(true);
    });
    expect(generateInitialCodeSnippet).not.toHaveBeenCalled();
  });

  it('takes no action when isHomepageDemo is true', async () => {
    const generateInitialCodeSnippet = vi.fn();
    const setInitialCodeGenerated = vi.fn();

    renderHook(() =>
      useLearningUnlockCodeRestore({
        isLearningMode: true,
        learningUnlockActive: true,
        requiredCoreTowersPlaced: true,
        initialCodeGenerated: false,
        code: '',
        generateInitialCodeSnippet,
        setInitialCodeGenerated,
        isHomepageDemo: true,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(generateInitialCodeSnippet).not.toHaveBeenCalled();
    expect(setInitialCodeGenerated).not.toHaveBeenCalled();
  });
});
