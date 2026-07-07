/**
 * Tower Defense V2 - Multi Problem State
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { runCodeTestsRequest } from '../../../../../hooks/towerDefense/codeEditor/executionHandlers';
import audioManager from '../../../../../utils/audio/AudioManager';
import CodeSnippetManager from '@rivie13/premium-core/sync/towerDefense/CodeSnippetManager';
import { normalizeProblemId } from '../../../../../components/chat/chatHelpers';

export default function useTowerDefenseV2MultiProblemState({
  isMultiProblemTower,
  learningProblemSlugs,
  activeTitleSlug,
  problem,
  language,
  setLanguage,
  code,
  setCode,
  initialCodeGenerated,
  setInitialCodeGenerated,
  functionTowerPlaced,
  setFunctionTowerPlaced,
  objectTowerPlaced,
  setObjectTowerPlaced,
  terminalOutput,
  setTerminalOutput,
  terminalResetKey,
  setTerminalResetKey,
  codeSubmitted,
  setCodeSubmitted,
  codeSubmissionSuccess,
  setCodeSubmissionSuccess,
  generateInitialCodeSnippet,
  api,
  addTerminalMessage,
  handleExecutionRateLimit,
  lockedLearningLanguage,
  chatActorId,
  resolveHasTowerType,
  submitSolution,
  learningUnlockActive = false
}) {
  const problemSlotStateRef = useRef({});
  const prevActiveSlugRef = useRef(activeTitleSlug);
  const sharedEditorUnlockRef = useRef(false);
  const sharedSlotInitRef = useRef(false);
  const [problemTabTitles, setProblemTabTitles] = useState({});
  const problemCacheRef = useRef({});
  const refreshedMultiChatRef = useRef(false);

  useEffect(() => {
    if (!isMultiProblemTower) return;
    if (!learningProblemSlugs.length) return;
    if (refreshedMultiChatRef.current) return;
    refreshedMultiChatRef.current = true;

    try {
      learningProblemSlugs.forEach((slug) => {
        const normalizedId = normalizeProblemId(slug);
        const key = `tower_defense_chat_${normalizedId}_${chatActorId}`;
        localStorage.removeItem(key);
      });
    } catch {
      // Ignore storage errors
    }
  }, [chatActorId, isMultiProblemTower, learningProblemSlugs]);

  useEffect(() => {
    if (!problem?.titleSlug || !problem?.title) return;
    setProblemTabTitles((prev) => ({
      ...prev,
      [problem.titleSlug]: problem.title
    }));
  }, [problem?.title, problem?.titleSlug]);

  const saveSlotState = useCallback((slug) => {
    if (!slug) return;
    const sharedUnlock = sharedEditorUnlockRef.current;
    problemSlotStateRef.current[slug] = {
      code,
      language,
      initialCodeGenerated: initialCodeGenerated || Boolean(code),
      functionTowerPlaced: sharedUnlock ? true : functionTowerPlaced,
      objectTowerPlaced: sharedUnlock ? true : objectTowerPlaced,
      terminalOutput,
      terminalResetKey,
      codeSubmitted,
      codeSubmissionSuccess,
      sharedEditorUnlock: sharedUnlock
    };
  }, [code, codeSubmissionSuccess, codeSubmitted, functionTowerPlaced, initialCodeGenerated, language, objectTowerPlaced, terminalOutput, terminalResetKey]);

  useEffect(() => {
    if (!isMultiProblemTower) return;
    if (!activeTitleSlug) return;
    if (prevActiveSlugRef.current !== activeTitleSlug) return;
    const sharedUnlock = sharedEditorUnlockRef.current;
    const existing = problemSlotStateRef.current[activeTitleSlug] || {};
    problemSlotStateRef.current[activeTitleSlug] = {
      ...existing,
      code,
      language,
      initialCodeGenerated: initialCodeGenerated || Boolean(code),
      functionTowerPlaced: sharedUnlock ? true : functionTowerPlaced,
      objectTowerPlaced: sharedUnlock ? true : objectTowerPlaced,
      terminalOutput,
      terminalResetKey,
      codeSubmitted,
      codeSubmissionSuccess,
      sharedEditorUnlock: sharedUnlock
    };
  }, [activeTitleSlug, code, codeSubmissionSuccess, codeSubmitted, functionTowerPlaced, initialCodeGenerated, isMultiProblemTower, language, objectTowerPlaced, terminalOutput, terminalResetKey]);

  useEffect(() => {
    const prevSlug = prevActiveSlugRef.current;
    if (prevSlug && prevSlug !== activeTitleSlug) {
      saveSlotState(prevSlug);
    }
    prevActiveSlugRef.current = activeTitleSlug;
  }, [activeTitleSlug, saveSlotState]);

  const fetchLearningProblem = useCallback(async (slug) => {
    if (!slug) return null;
    if (problemCacheRef.current[slug]) return problemCacheRef.current[slug];
    try {
      const data = await api.learningProblems.getById(slug);
      const processed = {
        ...data,
        content: data.content || data.description,
        difficulty: data.difficulty?.toUpperCase(),
        questionFrontendId: data.questionFrontendId || `LEARN-${data.id}`,
        isAIProblem: false,
        isLearningProblem: true,
        source: 'LEARNING',
        examples: data.examples || []
      };
      problemCacheRef.current[slug] = processed;
      return processed;
    } catch (error) {
      return null;
    }
  }, [api]);

  useEffect(() => {
    if (!isMultiProblemTower || !learningProblemSlugs.length) return;
    let isActive = true;

    (async () => {
      const results = await Promise.all(learningProblemSlugs.map((slug) => fetchLearningProblem(slug)));
      if (!isActive) return;
      results.forEach((entry, index) => {
        const slug = learningProblemSlugs[index];
        if (!slug || !entry?.title) return;
        setProblemTabTitles((prev) => ({
          ...prev,
          [slug]: entry.title
        }));
      });
    })();

    return () => {
      isActive = false;
    };
  }, [fetchLearningProblem, isMultiProblemTower, learningProblemSlugs]);

  const generateSlotTemplate = useCallback(async (slug, { applyToEditor = false } = {}) => {
    if (!slug) return false;
    const existing = problemSlotStateRef.current[slug] || {};
    if (existing.initialCodeGenerated || existing.code) return true;

    const problemData = slug === activeTitleSlug ? problem : await fetchLearningProblem(slug);
    if (!problemData) return false;

    const resolvedLanguage = (problemData?.language
      ? String(problemData.language).toLowerCase()
      : (lockedLearningLanguage || language || 'python'));

    const snippet = CodeSnippetManager.getCodeSnippetForLanguage(resolvedLanguage, problemData);
    problemSlotStateRef.current[slug] = {
      ...existing,
      code: snippet,
      language: resolvedLanguage,
      initialCodeGenerated: true,
      functionTowerPlaced: true,
      objectTowerPlaced: true,
      sharedEditorUnlock: true
    };

    if (applyToEditor) {
      setLanguage(resolvedLanguage);
      setCode(snippet);
      setInitialCodeGenerated(true);
      setFunctionTowerPlaced(true);
      setObjectTowerPlaced(true);
    }

    return true;
  }, [activeTitleSlug, fetchLearningProblem, language, lockedLearningLanguage, problem, setCode, setFunctionTowerPlaced, setInitialCodeGenerated, setLanguage, setObjectTowerPlaced]);

  const ensureSharedSlotTemplates = useCallback(async () => {
    if (!isMultiProblemTower) return;
    if (!sharedEditorUnlockRef.current) return;
    if (sharedSlotInitRef.current) return;
    sharedSlotInitRef.current = true;

    await Promise.all(learningProblemSlugs.map((slug) => generateSlotTemplate(slug)));
  }, [generateSlotTemplate, isMultiProblemTower, learningProblemSlugs]);

  const updateSlotResult = useCallback((slug, success) => {
    if (!slug) return;
    const existing = problemSlotStateRef.current[slug] || {};
    const nextState = {
      ...existing,
      codeSubmitted: true,
      codeSubmissionSuccess: success
    };
    problemSlotStateRef.current[slug] = nextState;
    if (slug === activeTitleSlug) {
      setCodeSubmitted(true);
      setCodeSubmissionSuccess(success);
    }
  }, [activeTitleSlug, setCodeSubmitted, setCodeSubmissionSuccess]);

  const runMultiTabVerification = useCallback(async () => {
    if (!isMultiProblemTower) {
      return submitSolution();
    }

    saveSlotState(activeTitleSlug);
    addTerminalMessage('[VERIFY] Multi-problem verification engaged. Running all slots...');

    const userIdString = localStorage.getItem('user_id');
    const userId = userIdString ? parseInt(userIdString) : null;
    const results = [];

    for (let index = 0; index < learningProblemSlugs.length; index += 1) {
      const slug = learningProblemSlugs[index];
      const slotState = slug === activeTitleSlug
        ? {
            code,
            language,
            initialCodeGenerated
          }
        : (problemSlotStateRef.current[slug] || null);

      if (!slotState?.initialCodeGenerated || !slotState?.code) {
        results.push({ slug, success: false, reason: 'missing_code' });
        continue;
      }

      const problemData = await fetchLearningProblem(slug);
      if (!problemData) {
        results.push({ slug, success: false, reason: 'missing_problem' });
        continue;
      }

      const result = await runCodeTestsRequest({
        code: slotState.code,
        language: slotState.language || lockedLearningLanguage || 'python',
        problem: problemData,
        userId,
        addTerminalMessage: (message) => addTerminalMessage(`[TAB ${index + 1}] ${message}`),
        onExecutionRateLimit: handleExecutionRateLimit
      });

      if (result?.status === 'vm_timeout') {
        addTerminalMessage(`[TAB ${index + 1}] VM startup timeout. Try again.`);
        return 'vm_timeout';
      }

      if (result?.status === 'rate_limited') {
        addTerminalMessage(`[TAB ${index + 1}] Execution limit reached. Watch an ad or wait for reset.`);
        return 'rate_limited';
      }

      const success = Boolean(result?.success);
      results.push({ slug, success });
    }

    results.forEach((entry) => updateSlotResult(entry.slug, entry.success));

    const failed = results.filter(entry => !entry.success);
    if (failed.length) {
      addTerminalMessage('[VERIFY] Multi-problem verification failed. Fix the failing tabs and retry.');
      failed.forEach((entry, index) => {
        const label = problemTabTitles[entry.slug] || `Problem ${learningProblemSlugs.indexOf(entry.slug) + 1}`;
        const reason = entry.reason === 'missing_code' ? 'missing code or template' : 'tests failed';
        addTerminalMessage(`[VERIFY] ${label}: ${reason}.`);
      });
      audioManager.playSoundEffect('solution-failed');
      return false;
    }

    addTerminalMessage('[VERIFY] All problem tabs passed. Proceeding to final breach.');
    audioManager.playSoundEffect('solution-successful');
    return true;
  }, [
    activeTitleSlug,
    addTerminalMessage,
    code,
    fetchLearningProblem,
    handleExecutionRateLimit,
    initialCodeGenerated,
    isMultiProblemTower,
    language,
    learningProblemSlugs,
    lockedLearningLanguage,
    problemTabTitles,
    saveSlotState,
    submitSolution,
    updateSlotResult
  ]);

  useEffect(() => {
    if (!isMultiProblemTower) return;
    if (!learningUnlockActive) return;
    if (!functionTowerPlaced || !objectTowerPlaced) return;

    if (!sharedEditorUnlockRef.current) {
      sharedEditorUnlockRef.current = true;
    }
    if (!initialCodeGenerated) {
      setInitialCodeGenerated(true);
    }

    ensureSharedSlotTemplates();
  }, [ensureSharedSlotTemplates, functionTowerPlaced, initialCodeGenerated, isMultiProblemTower, learningUnlockActive, objectTowerPlaced, setInitialCodeGenerated]);

  useEffect(() => {
    if (!isMultiProblemTower) return;
    const hasFunctionTower = resolveHasTowerType('function');
    const hasObjectTower = resolveHasTowerType('object');
    if (!hasFunctionTower || !hasObjectTower) return;

    if (!sharedEditorUnlockRef.current) {
      sharedEditorUnlockRef.current = true;
    }

    if (!functionTowerPlaced) {
      setFunctionTowerPlaced(true);
    }
    if (!objectTowerPlaced) {
      setObjectTowerPlaced(true);
    }

    ensureSharedSlotTemplates();
  }, [ensureSharedSlotTemplates, functionTowerPlaced, isMultiProblemTower, objectTowerPlaced, resolveHasTowerType, setFunctionTowerPlaced, setObjectTowerPlaced]);

  useEffect(() => {
    if (!isMultiProblemTower) return;
    if (!problem?.titleSlug || problem.titleSlug !== activeTitleSlug) return;

    const savedState = problemSlotStateRef.current[activeTitleSlug];
    const sharedUnlock = sharedEditorUnlockRef.current;
    if (savedState) {
      if (savedState.language && savedState.language !== language) {
        setLanguage(savedState.language);
      }
      const hasSavedCode = Boolean(savedState.code);
      const shouldUnlock = sharedUnlock || (savedState.functionTowerPlaced && savedState.objectTowerPlaced);
      setCode(savedState.code || '');
      if (savedState.terminalOutput !== undefined) {
        setTerminalOutput(savedState.terminalOutput || '');
      }
      if (savedState.terminalResetKey !== undefined) {
        setTerminalResetKey(savedState.terminalResetKey || 0);
      }
      setCodeSubmitted(Boolean(savedState.codeSubmitted));
      setCodeSubmissionSuccess(savedState.codeSubmissionSuccess ?? null);
      setFunctionTowerPlaced(shouldUnlock ? true : Boolean(savedState.functionTowerPlaced));
      setObjectTowerPlaced(shouldUnlock ? true : Boolean(savedState.objectTowerPlaced));
      setInitialCodeGenerated(shouldUnlock ? Boolean(savedState.initialCodeGenerated || hasSavedCode) : Boolean(savedState.initialCodeGenerated));
      if (shouldUnlock && !hasSavedCode && !savedState.initialCodeGenerated) {
        generateSlotTemplate(activeTitleSlug, { applyToEditor: true });
      }
      return;
    }

    setCode('');
    setCodeSubmitted(false);
    setCodeSubmissionSuccess(null);
    setInitialCodeGenerated(false);
    if (!String(terminalOutput || '').trim()) {
      setTerminalOutput('');
      setTerminalResetKey((prev) => prev + 1);
    }

    if (sharedUnlock) {
      generateSlotTemplate(activeTitleSlug, { applyToEditor: true });
      return;
    }

    const hasFunctionTower = resolveHasTowerType('function');
    const hasObjectTower = resolveHasTowerType('object');
    setFunctionTowerPlaced(hasFunctionTower);
    setObjectTowerPlaced(hasObjectTower);
    if (hasFunctionTower && hasObjectTower) {
      generateInitialCodeSnippet({ force: true });
    }
  }, [
    activeTitleSlug,
    generateSlotTemplate,
    generateInitialCodeSnippet,
    isMultiProblemTower,
    language,
    problem?.titleSlug,
    resolveHasTowerType,
    setCode,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
    setFunctionTowerPlaced,
    setInitialCodeGenerated,
    setLanguage,
    setObjectTowerPlaced,
    setTerminalOutput,
    setTerminalResetKey,
    terminalOutput
  ]);

  const problemTabs = useMemo(() => {
    if (!learningProblemSlugs.length) return [];
    return learningProblemSlugs.map((slug, index) => ({
      slug,
      title: problemTabTitles[slug] || `Problem ${index + 1}`
    }));
  }, [learningProblemSlugs, problemTabTitles]);

  const sharedUnlockActive = Boolean(isMultiProblemTower && sharedEditorUnlockRef.current);

  const resetSharedUnlock = useCallback(() => {
    sharedEditorUnlockRef.current = false;
    sharedSlotInitRef.current = false;
  }, []);

  const resetMultiProblemEditors = useCallback(() => {
    if (!isMultiProblemTower) return;
    problemSlotStateRef.current = {};
    sharedEditorUnlockRef.current = false;
    sharedSlotInitRef.current = false;
    prevActiveSlugRef.current = activeTitleSlug;
  }, [activeTitleSlug, isMultiProblemTower]);

  return {
    problemTabTitles,
    problemTabs,
    runMultiTabVerification,
    sharedUnlockActive,
    resetSharedUnlock,
    resetMultiProblemEditors,
    ensureSharedSlotTemplates,
    saveSlotState
  };
}

