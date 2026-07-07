import { useEffect } from 'react';

export default function useLearningUnlockCodeRestore({
  isLearningMode,
  learningUnlockActive,
  requiredCoreTowersPlaced,
  initialCodeGenerated,
  code,
  generateInitialCodeSnippet,
  setInitialCodeGenerated,
  isHomepageDemo = false,
}) {
  useEffect(() => {
    if (isHomepageDemo) return;
    if (!isLearningMode || !learningUnlockActive) return;
    if (!requiredCoreTowersPlaced || initialCodeGenerated) return;

    const liveEditorValue =
      typeof window !== 'undefined'
        ? window.__tdMonacoEditor?.getModel?.()?.getValue?.() || ''
        : '';
    const existingCode = typeof code === 'string' ? code : '';

    if (existingCode.trim().length > 0 || liveEditorValue.trim().length > 0) {
      setInitialCodeGenerated(true);
      return;
    }

    if (typeof generateInitialCodeSnippet === 'function') {
      generateInitialCodeSnippet({ force: true });
      return;
    }

    setInitialCodeGenerated(true);
  }, [
    code,
    generateInitialCodeSnippet,
    initialCodeGenerated,
    isLearningMode,
    learningUnlockActive,
    requiredCoreTowersPlaced,
    setInitialCodeGenerated,
    isHomepageDemo,
  ]);
}
