/**
 * Tower Defense V2 - Language Lock
 */

import { useCallback, useEffect, useMemo } from 'react';

const normalizeLearningLanguage = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'js' || normalized.startsWith('js-') || normalized.startsWith('lp-js-')) {
    return 'javascript';
  }
  if (normalized.includes('javascript')) return 'javascript';
  if (normalized.startsWith('java-') || normalized.startsWith('lp-java-')) return 'java';
  if (normalized.includes('java') && !normalized.includes('javascript')) return 'java';
  if (
    normalized === 'cpp' ||
    normalized.startsWith('cpp-') ||
    normalized.startsWith('lp-cpp-') ||
    normalized.includes('c++')
  ) {
    return 'cpp';
  }
  if (
    normalized.includes('python') ||
    normalized.startsWith('py-') ||
    normalized.startsWith('lp-m')
  ) {
    return 'python';
  }
  return normalized;
};

export const resolveLearningLanguageLock = ({
  isLearningMode,
  learningPathSlug,
  learningPathTitleSlug,
  problemLanguage,
} = {}) => {
  if (!isLearningMode) return null;
  return (
    normalizeLearningLanguage(problemLanguage) ||
    normalizeLearningLanguage(learningPathSlug) ||
    normalizeLearningLanguage(learningPathTitleSlug) ||
    'python'
  );
};

export default function useTowerDefenseV2LanguageLock({
  isLearningMode,
  learningPathSlug,
  learningPathTitleSlug,
  problemLanguage,
  language,
  handleLanguageChange,
}) {
  const lockedLearningLanguage = useMemo(() => {
    return resolveLearningLanguageLock({
      isLearningMode,
      learningPathSlug,
      learningPathTitleSlug,
      problemLanguage,
    });
  }, [isLearningMode, learningPathSlug, learningPathTitleSlug, problemLanguage]);

  const applyLanguageChange = useCallback(
    (nextLanguage) => {
      if (!nextLanguage) return;
      handleLanguageChange({ target: { value: nextLanguage } });
    },
    [handleLanguageChange]
  );

  const handleUserLanguageChange = useCallback(
    (event) => {
      const nextLanguage = event?.target?.value;
      if (
        isLearningMode &&
        lockedLearningLanguage &&
        nextLanguage?.toLowerCase() !== lockedLearningLanguage
      ) {
        return;
      }
      handleLanguageChange(event);
    },
    [handleLanguageChange, isLearningMode, lockedLearningLanguage]
  );

  useEffect(() => {
    if (!isLearningMode || !lockedLearningLanguage) return;
    if (language !== lockedLearningLanguage) {
      applyLanguageChange(lockedLearningLanguage);
    }
  }, [applyLanguageChange, isLearningMode, language, lockedLearningLanguage]);

  return {
    lockedLearningLanguage,
    handleUserLanguageChange,
  };
}
