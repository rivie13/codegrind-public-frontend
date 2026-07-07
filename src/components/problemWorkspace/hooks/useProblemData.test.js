import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockApi = vi.hoisted(() => ({
  problems: {
    getById: vi.fn(),
  },
  aiProblems: {
    getById: vi.fn(),
  },
  learningProblems: {
    getById: vi.fn(),
  },
}));

vi.mock('../../../services/api', () => ({
  api: mockApi,
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import useProblemData from './useProblemData';

const renderProblemHook = (overrides = {}) => {
  const handleEditorChange = overrides.handleEditorChange ?? vi.fn();
  const onLoadError = overrides.onLoadError ?? vi.fn();

  const hook = renderHook(() =>
    useProblemData({
      titleSlug: overrides.titleSlug ?? 'two-sum',
      handleEditorChange,
      pathname: overrides.pathname ?? '/problems/two-sum',
      preferredLanguage: overrides.preferredLanguage ?? null,
      onLoadError,
    })
  );

  return { ...hook, handleEditorChange, onLoadError };
};

describe('useProblemData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads standard problems, normalizes snippetsMap, and defaults editor to python', async () => {
    mockApi.problems.getById.mockResolvedValue({
      title: 'Two Sum',
      difficulty: 'easy',
      description: 'Problem description',
      questionFrontendId: '1',
      codeSnippets: {
        python: 'def solve(nums, target):\n    pass',
        js: 'function solve(nums, target) {}',
      },
    });

    const { result, handleEditorChange } = renderProblemHook();

    await waitFor(() => {
      expect(mockApi.problems.getById).toHaveBeenCalledWith('two-sum');
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.language).toBe('python');
    expect(result.current.problemData.difficulty).toBe('EASY');
    expect(result.current.problemData.snippetsMap).toEqual(
      expect.objectContaining({
        python: 'def solve(nums, target):\n    pass',
        javascript: 'function solve(nums, target) {}',
      })
    );
    expect(handleEditorChange).toHaveBeenCalledWith('def solve(nums, target):\n    pass');
  });

  it('falls back to first available snippet when python is unavailable in array input', async () => {
    mockApi.problems.getById.mockResolvedValue({
      title: 'Alt Snippets',
      difficulty: 'medium',
      description: 'Desc',
      codeSnippets: [
        { lang: 'js', code: 'console.log(1);' },
        { langSlug: 'c++', code: '// cpp' },
      ],
    });

    const { result, handleEditorChange } = renderProblemHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('javascript');
    expect(handleEditorChange).toHaveBeenCalledWith('console.log(1);');
  });

  it('prefers the locked learning language over python during initial load', async () => {
    mockApi.learningProblems.getById.mockResolvedValue({
      title: 'Java Hello',
      difficulty: 'easy',
      description: 'Desc',
      codeSnippets: {
        python: 'def greet():\n    pass',
        java: 'public static void greet() {\n    // TODO\n}',
      },
    });

    const { result, handleEditorChange } = renderProblemHook({
      titleSlug: 'lp-java-m0-td-hello-print',
      pathname: '/learning/java-path/problems/lp-java-m0-td-hello-print',
      preferredLanguage: 'java',
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('java');
    expect(handleEditorChange).toHaveBeenCalledWith('public static void greet() {\n    // TODO\n}');
  });

  it('does not fall back to python when the locked learning language snippet is mislabeled python', async () => {
    mockApi.learningProblems.getById.mockResolvedValue({
      title: 'JavaScript Hello',
      difficulty: 'easy',
      description: 'Desc',
      codeSnippets: {
        python: 'def greet():\n    pass',
        javascript: 'def greet():\n    pass',
      },
    });

    const { result, handleEditorChange } = renderProblemHook({
      titleSlug: 'lp-js-m0-td-hello-print',
      pathname: '/learning/javascript-path/problems/lp-js-m0-td-hello-print',
      preferredLanguage: 'javascript',
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('javascript');
    expect(result.current.problemData.snippetsMap.javascript).toBeUndefined();
    expect(handleEditorChange).not.toHaveBeenCalledWith('def greet():\n    pass');
  });

  it('uses AI and learning endpoints based on pathname mode', async () => {
    mockApi.aiProblems.getById.mockResolvedValue({
      title: 'AI Problem',
      difficulty: 'hard',
      description: 'AI desc',
      codeSnippets: { python: 'print("ai")' },
    });

    renderProblemHook({
      titleSlug: 'ai-problem',
      pathname: '/ai-problems/ai-problem',
    });

    await waitFor(() => {
      expect(mockApi.aiProblems.getById).toHaveBeenCalledWith('ai-problem');
    });

    mockApi.learningProblems.getById.mockResolvedValue({
      title: 'Learning Problem',
      difficulty: 'easy',
      description: 'Learning desc',
      codeSnippets: { python: 'print("learning")' },
    });

    renderProblemHook({
      titleSlug: 'learning-1',
      pathname: '/learning/python-path/problems/learning-1',
    });

    await waitFor(() => {
      expect(mockApi.learningProblems.getById).toHaveBeenCalledWith('learning-1');
    });
  });

  it('updates language and editor content via normalized handleLanguageChange', async () => {
    mockApi.problems.getById.mockResolvedValue({
      title: 'Language Switch',
      difficulty: 'medium',
      description: 'Desc',
      codeSnippets: {
        python: 'print("py")',
        cpp: 'std::cout << "cpp";',
      },
    });

    const { result, handleEditorChange } = renderProblemHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.handleLanguageChange('c++');
    });

    expect(result.current.language).toBe('cpp');
    expect(handleEditorChange).toHaveBeenLastCalledWith('std::cout << "cpp";');
  });

  it('surfaces fetch errors while clearing loading state', async () => {
    mockApi.problems.getById.mockRejectedValue(new Error('Problem fetch failed'));

    const { result, onLoadError } = renderProblemHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Problem fetch failed');
    expect(result.current.problemData).toBe(null);
    expect(onLoadError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('does not refetch the same problem when callback props get new identities on rerender', async () => {
    mockApi.problems.getById.mockResolvedValue({
      title: 'Two Sum',
      difficulty: 'easy',
      description: 'Problem description',
      codeSnippets: {
        python: 'def solve(nums, target):\n    pass',
      },
    });

    const initialHandleEditorChange = vi.fn();
    const initialOnLoadError = vi.fn();

    const { rerender } = renderHook(
      ({ handleEditorChange, onLoadError }) =>
        useProblemData({
          titleSlug: 'two-sum',
          handleEditorChange,
          pathname: '/problems/two-sum',
          preferredLanguage: null,
          onLoadError,
        }),
      {
        initialProps: {
          handleEditorChange: initialHandleEditorChange,
          onLoadError: initialOnLoadError,
        },
      }
    );

    await waitFor(() => {
      expect(mockApi.problems.getById).toHaveBeenCalledTimes(1);
    });

    rerender({
      handleEditorChange: vi.fn(),
      onLoadError: vi.fn(),
    });

    await waitFor(() => {
      expect(mockApi.problems.getById).toHaveBeenCalledTimes(1);
    });
  });
});
