import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';

const normalizeLanguageSlug = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'py' || normalized === 'python3' || normalized === 'python2') return 'python';
  if (normalized === 'c++') return 'cpp';
  if (normalized === 'js' || normalized === 'node' || normalized === 'nodejs') return 'javascript';
  return normalized;
};

const isPythonFunctionSnippet = (code) => /^\s*def\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(code || '');

const isCompatibleSnippetForLanguage = (language, code) => {
  if (!code) return false;
  if (language === 'python') return true;
  return !isPythonFunctionSnippet(code);
};

const useProblemData = ({
  titleSlug,
  handleEditorChange,
  pathname,
  preferredLanguage = null,
  onLoadError,
}) => {
  const [problemData, setProblemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('python');
  const handleEditorChangeRef = useRef(handleEditorChange);
  const onLoadErrorRef = useRef(onLoadError);

  const isAIProblem = useMemo(() => pathname?.includes('/ai-problems/'), [pathname]);
  const isLearningProblem = useMemo(
    () => Boolean(pathname?.includes('/learning/') && pathname?.includes('/problems/')),
    [pathname]
  );

  useEffect(() => {
    handleEditorChangeRef.current = handleEditorChange;
  }, [handleEditorChange]);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  const handleLanguageChange = useCallback(
    (newLang) => {
      const normalizedLang = normalizeLanguageSlug(newLang);
      if (!normalizedLang) return;
      // logger.info('newLang:');
      // logger.debug(newLang);

      // logger.info('problemData snippetsMap:');
      // logger.debug(problemData?.snippetsMap);

      setLanguage(normalizedLang);

      if (problemData?.snippetsMap) {
        const snippetKey = normalizedLang;
        const newCode = problemData.snippetsMap[snippetKey];

        // logger.info('Found code for language:');
        // logger.debug(snippetKey);
        // logger.info('New code:');
        // logger.debug(newCode);

        if (newCode) {
          handleEditorChangeRef.current?.(newCode);
        }
      }
    },
    [problemData]
  );

  const fetchProblem = useCallback(async () => {
    if (!titleSlug) return;

    try {
      setIsLoading(true);
      setError(null);

      // logger.info('Fetching problem:');
      // logger.debug(titleSlug);
      // logger.debug(isAIProblem);
      // logger.info('API_BASE_URL:');
      // logger.debug(import.meta.env.VITE_API_URL);

      const data = isLearningProblem
        ? await api.learningProblems.getById(titleSlug)
        : isAIProblem
          ? await api.aiProblems.getById(titleSlug)
          : await api.problems.getById(titleSlug);

      const snippetsMap = {};
      const normalizedSource = String(data?.source || '')
        .trim()
        .toUpperCase();
      const metadataFrontendId =
        data?.metadata?.frontendQuestionId || data?.metadata?.questionFrontendId || null;

      const resolvedQuestionFrontendId =
        data.question_frontend_id ||
        data.questionFrontendId ||
        data.displayNumber ||
        metadataFrontendId ||
        data.questionId ||
        (isAIProblem ? `AI-${data.id}` : null);

      const resolvedDisplayNumber =
        data.displayNumber ||
        data.question_frontend_id ||
        data.questionFrontendId ||
        metadataFrontendId ||
        data.questionId ||
        null;

      const resolvedSource = isLearningProblem
        ? 'LEARNING'
        : isAIProblem || normalizedSource === 'AI'
          ? 'AI'
          : normalizedSource === 'LEETCODE'
            ? 'LEETCODE'
            : 'CODEGRIND';

      if (data.codeSnippets) {
        if (Array.isArray(data.codeSnippets)) {
          data.codeSnippets.forEach((snippet) => {
            const key = normalizeLanguageSlug(snippet.langSlug || snippet.lang || '');
            if (key && isCompatibleSnippetForLanguage(key, snippet.code)) {
              snippetsMap[key] = snippet.code;
            }
          });
        } else if (typeof data.codeSnippets === 'object') {
          Object.keys(data.codeSnippets).forEach((lang) => {
            const key = normalizeLanguageSlug(lang);
            if (key && isCompatibleSnippetForLanguage(key, data.codeSnippets[lang])) {
              snippetsMap[key] = data.codeSnippets[lang];
            }
          });
        }
      }

      const normalizedPreferredLanguage = normalizeLanguageSlug(preferredLanguage);
      const preferredInitialLanguage =
        isLearningProblem && normalizedPreferredLanguage ? normalizedPreferredLanguage : null;
      const initialLanguage =
        preferredInitialLanguage ||
        (snippetsMap.python ? 'python' : null) ||
        Object.keys(snippetsMap)[0] ||
        null;

      setProblemData({
        ...data,
        snippetsMap,
        content: data.content || data.description,
        difficulty: data.difficulty?.toUpperCase(),
        questionFrontendId: resolvedQuestionFrontendId,
        displayNumber: resolvedDisplayNumber,
        source: resolvedSource,
        isLearningProblem,
      });

      if (initialLanguage) {
        if (snippetsMap[initialLanguage]) {
          handleEditorChangeRef.current?.(snippetsMap[initialLanguage]);
        }
        setLanguage(initialLanguage);
      }
    } catch (error) {
      logger.error('Error fetching problem:');
      logger.debug(error);
      setError(error.message || 'Failed to load problem');
      onLoadErrorRef.current?.(error);

      if (error.response) {
        logger.error('Response status:');
        logger.debug(error.response.status);
      }
    } finally {
      setIsLoading(false);
    }
  }, [titleSlug, isAIProblem, isLearningProblem, preferredLanguage]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  return {
    problemData,
    isLoading,
    error,
    language,
    setLanguage,
    handleLanguageChange,
    isAIProblem,
    isLearningProblem,
  };
};

export default useProblemData;
