import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { api } from '../../../services/api';
import { getTowerByType } from '../../../game-engine-v2';
import {
  submitSolutionRequest,
  runCodeTestsRequest,
  runCodeOutputRequest,
} from './executionHandlers';
import CodeSnippetManager from '@rivie13/premium-core/sync/towerDefense/CodeSnippetManager';
import audioManager from '../../../utils/audio/AudioManager';
import visualSettingsManager from '../../../utils/game/VisualSettingsManager';
import { prepareForPrompt } from '../../../utils/code/promptInjectionPrevention';
import {
  createDetachedSnippetPreview as createDetachedSnippetPreviewBase,
  insertSnippetIntoEditor as insertSnippetIntoEditorBase,
  insertSnippetPreview as insertSnippetPreviewBase,
  registerGeneratedLines as registerGeneratedLinesBase,
  suppressNextLineCommitIfMultiline as suppressNextLineCommitIfMultilineBase,
} from './snippetInsertion';
import { getDerivedTowerType as getDerivedTowerTypeBase } from './snippetAnalysis';
import {
  areRequiredCoreTowersPlaced,
  resolveCoreTowerRequirements,
} from '../../../utils/towerDefense/coreTowerRequirements';
import { getUserStdout } from '../../../components/problemWorkspace/utils/codeHelpers';

/**
 * Custom hook to handle code editor state and functionality
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.problem - The problem data
 * @param {Function} options.addTerminalMessage - Function to add messages to terminal
 * @returns {Object} Code editor state and methods
 */
export default function useCodeEditor({
  problem,
  addTerminalMessage,
  onExecutionRateLimit,
  preserveOnProblemChange = false,
  allowedTowerTypes = null,
  initialLanguage = 'python',
}) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(() => initialLanguage || 'python');
  const [isExecuting, setIsExecuting] = useState(false);
  const [codeSubmitted, setCodeSubmitted] = useState(false);
  const [codeSubmissionSuccess, setCodeSubmissionSuccess] = useState(null);
  const [functionTowerPlaced, setFunctionTowerPlaced] = useState(false);
  const [objectTowerPlaced, setObjectTowerPlaced] = useState(false);
  const [initialCodeGenerated, setInitialCodeGenerated] = useState(false);
  const [aiCodeSnippetsEnabled, setAiCodeSnippetsEnabled] = useState(true);
  const lastPrewarmedProblemRef = useRef(null);

  // Use a ref to track tower counts by type
  const towerCountsRef = useRef({});
  const pendingSnippetRef = useRef(null);

  const showSnippetFallbackToast = useCallback(
    (fallbackReason) => {
      const fallbackToastConfig = {
        basic_snippet_fallback: {
          id: 'td-basic-snippet-fallback',
          title: 'Basic snippet used',
          description:
            'AI snippet generation was unavailable, so we inserted a basic snippet instead.',
        },
        ai_generation_failed: {
          id: 'td-ai-snippet-unavailable',
          title: 'AI snippet unavailable',
          description: 'AI snippet generation hit an issue. Please try again.',
        },
      };

      const config = fallbackToastConfig[fallbackReason];
      if (!config) {
        return;
      }

      if (typeof toast.isActive === 'function' && toast.isActive(config.id)) {
        return;
      }

      toast({
        id: config.id,
        title: config.title,
        description: config.description,
        status: 'warning',
        duration: 3200,
        isClosable: true,
        position: 'top',
      });
    },
    [toast]
  );

  const coreTowerRequirements = useMemo(
    () => resolveCoreTowerRequirements({ problem, language, allowedTowerTypes }),
    [allowedTowerTypes, language, problem]
  );

  useEffect(() => {
    if (!initialLanguage || initialCodeGenerated || language === initialLanguage) return;
    setLanguage(initialLanguage);
  }, [initialCodeGenerated, initialLanguage, language]);

  const getDerivedTowerType = useCallback((snippetLine, languageKey) => {
    return getDerivedTowerTypeBase(snippetLine, languageKey);
  }, []);

  const clearPendingSnippet = useCallback(
    (message) => {
      if (message && addTerminalMessage) {
        addTerminalMessage(message);
      }
      pendingSnippetRef.current = null;
      if (typeof window !== 'undefined') {
        window.__tdPendingSnippet = null;
        window.__tdPendingSnippetActions = null;
        window.dispatchEvent(
          new CustomEvent('td-snippet-review', {
            detail: { status: 'cleared' },
          })
        );
      }
    },
    [addTerminalMessage]
  );

  const suppressNextLineCommitIfMultiline = useCallback((snippet) => {
    suppressNextLineCommitIfMultilineBase(snippet);
  }, []);

  const registerGeneratedLines = useCallback((snippet) => {
    registerGeneratedLinesBase(snippet);
  }, []);

  const suppressTowerSuggestions = useCallback((durationMs = 1500) => {
    if (typeof window === 'undefined') return;
    window.__tdSuppressTowerSuggestionsUntil = Date.now() + durationMs;
  }, []);

  const insertSnippetIntoEditor = useCallback(
    (snippet) => {
      return insertSnippetIntoEditorBase(snippet, language);
    },
    [language]
  );

  const insertSnippetPreview = useCallback(
    (snippet) => {
      return insertSnippetPreviewBase(snippet, language);
    },
    [language]
  );

  const createDetachedSnippetPreview = useCallback(
    (snippet) => {
      return createDetachedSnippetPreviewBase({
        snippet,
        language,
        currentCode: code || '',
      });
    },
    [code, language]
  );

  /**
   * Handle language change in the code editor
   */
  const handleLanguageChange = useCallback(
    (event) => {
      const newLanguage = event.target.value;
      setLanguage(newLanguage);

      // Only update code if initial code has been generated
      if (initialCodeGenerated && problem) {
        // Regenerate the code snippet based on the new language
        let snippet = CodeSnippetManager.getCodeSnippetForLanguage(newLanguage, problem);
        suppressTowerSuggestions();
        registerGeneratedLines(snippet);
        suppressNextLineCommitIfMultiline(snippet);
        setCode(snippet);
        if (addTerminalMessage) {
          addTerminalMessage(`Changed language to ${newLanguage}. Solution template updated.`);
        }

        // Reset tower counts when changing language
        towerCountsRef.current = {};
      } else if (!initialCodeGenerated) {
        // If code hasn't been generated yet, keep editor empty
        setCode('');
      }
    },
    [
      addTerminalMessage,
      initialCodeGenerated,
      problem,
      registerGeneratedLines,
      suppressNextLineCommitIfMultiline,
      suppressTowerSuggestions,
    ]
  );

  /**
   * Generate the initial code snippet when required towers are placed
   */
  const generateInitialCodeSnippet = useCallback(
    (options = {}) => {
      const forceGenerate = options?.force === true;
      //console.log("[DEBUG] generateInitialCodeSnippet called - checking if code can be generated...");
      //console.log(`[DEBUG] State: Function tower: ${functionTowerPlaced}, Object tower: ${objectTowerPlaced}, Already generated: ${initialCodeGenerated}`);

      const requiredCoreTowersPlaced = areRequiredCoreTowersPlaced(coreTowerRequirements, {
        functionTowerPlaced,
        objectTowerPlaced,
      });

      if (!forceGenerate && !requiredCoreTowersPlaced) {
        //console.log("[DEBUG] Cannot generate code - missing towers");
        return false;
      }

      // Avoid regenerating if already done
      if (initialCodeGenerated) {
        //console.log("[DEBUG] Code already generated - skipping regeneration");
        return true;
      }

      //console.log("[DEBUG] All conditions met - generating code snippet...");
      // Generate code snippet based on selected language and problem data
      const snippet = CodeSnippetManager.getCodeSnippetForLanguage(language, problem);

      // Set code and update initialCodeGenerated atomically
      suppressTowerSuggestions();
      registerGeneratedLines(snippet);
      suppressNextLineCommitIfMultiline(snippet);
      setCode(snippet);
      setInitialCodeGenerated(true);

      // Initialize tower counts
      towerCountsRef.current = {
        ...(coreTowerRequirements.function !== false ? { Function: 1 } : {}),
        ...(coreTowerRequirements.object !== false ? { Object: 1 } : {}),
      };

      // Add terminal message
      if (addTerminalMessage) {
        addTerminalMessage(
          '[COMPILE] Initial solution template generated. Ready for algorithm implementation.'
        );
      }
      //console.log("[DEBUG] Code generation complete, initialCodeGenerated set to true");

      // Schedule a verification to make sure state was updated
      setTimeout(() => {
        //console.log(`[DEBUG] State verification after generation: initialCodeGenerated=${initialCodeGenerated}`);
        if (!initialCodeGenerated) {
          //console.log("[DEBUG] State didn't update properly, forcing update again");
          setInitialCodeGenerated(true);
        }
      }, 50);

      return true;
    },
    [
      addTerminalMessage,
      coreTowerRequirements,
      functionTowerPlaced,
      initialCodeGenerated,
      language,
      objectTowerPlaced,
      problem,
      registerGeneratedLines,
      suppressNextLineCommitIfMultiline,
      suppressTowerSuggestions,
    ]
  );



  // Listen for changes to AI code snippet settings
  useEffect(() => {
    // Load initial setting
    const visualSettings = visualSettingsManager.getSettings();
    setAiCodeSnippetsEnabled(
      visualSettings.aiCodeSnippetGeneration !== undefined
        ? visualSettings.aiCodeSnippetGeneration
        : true
    );

    // Set up listener for settings changes
    const handleSettingsChange = (event) => {
      // The custom event dispatches data in event.detail, not event.target
      const enabled = event.detail.enabled;

      //console.log('[DEBUG] AI snippet setting changed:', enabled);
      setAiCodeSnippetsEnabled(enabled);
    };

    window.addEventListener('td-ai-snippet-setting-changed', handleSettingsChange);

    return () => {
      window.removeEventListener('td-ai-snippet-setting-changed', handleSettingsChange);
    };
  }, []);

  // Auto-accept or clear pending snippets based on editor edits
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const editor = window.__tdMonacoEditor;
    const monaco = window.__tdMonaco || window.monaco;
    if (
      !editor ||
      !monaco ||
      !editor.onDidChangeModelContent ||
      !editor.onDidChangeCursorSelection
    ) {
      return undefined;
    }

    const getLivePreviewRange = () => {
      const pending = pendingSnippetRef.current;
      const model = editor.getModel?.();
      const decorationId = pending?.preview?.decorationIds?.[0];
      if (!pending || !model || !decorationId || !model.getDecorationRange) return null;
      return model.getDecorationRange(decorationId);
    };

    const intersects = (range, selection) => {
      if (!range || !selection) return false;
      if (monaco.Range && typeof monaco.Range.intersectRanges === 'function') {
        return Boolean(monaco.Range.intersectRanges(range, selection));
      }
      const startsAfter =
        selection.startLineNumber > range.endLineNumber ||
        (selection.startLineNumber === range.endLineNumber &&
          selection.startColumn > range.endColumn);
      const endsBefore =
        selection.endLineNumber < range.startLineNumber ||
        (selection.endLineNumber === range.startLineNumber &&
          selection.endColumn < range.startColumn);
      return !(startsAfter || endsBefore);
    };

    const cursorDisposable = editor.onDidChangeCursorSelection((event) => {
      const pending = pendingSnippetRef.current;
      if (!pending) return;
      const liveRange = getLivePreviewRange();
      if (!liveRange) return;
      const selection = event.selection;
      if (!intersects(liveRange, selection)) {
        pending.movedOffPreview = true;
      }
    });

    const contentDisposable = editor.onDidChangeModelContent((event) => {
      const pending = pendingSnippetRef.current;
      if (!pending?.actions) return;

      const liveRange = getLivePreviewRange();
      if (!liveRange) {
        clearPendingSnippet('[SYSTEM] Snippet highlight cleared. Pending review removed.');
        return;
      }

      const selection = editor.getSelection?.();
      const intersectsSelection = selection ? intersects(liveRange, selection) : false;
      const intersectsChange = Array.isArray(event?.changes)
        ? event.changes.some((change) => intersects(liveRange, change.range))
        : false;

      if (intersectsSelection || intersectsChange) {
        if (pending.preview?.decorationIds?.length) {
          editor.deltaDecorations(pending.preview.decorationIds, []);
        }
        clearPendingSnippet('[SYSTEM] Snippet edited while highlighted. Pending review cleared.');
        return;
      }

      if (pending.movedOffPreview) {
        pending.actions.accept?.({ auto: true });
      }
    });

    return () => {
      cursorDisposable?.dispose?.();
      contentDisposable?.dispose?.();
    };
  }, [clearPendingSnippet]);

  // Reset code editor state when problem changes
  useEffect(() => {
    if (!problem?.titleSlug) return;
    if (preserveOnProblemChange) return;
    //console.log('[DEBUG] Problem changed, resetting code editor state:', problem.titleSlug);
    suppressTowerSuggestions();
    setInitialCodeGenerated(false);
    setFunctionTowerPlaced(false);
    setObjectTowerPlaced(false);
    setCode('');
    towerCountsRef.current = {};
  }, [preserveOnProblemChange, problem?.titleSlug, suppressTowerSuggestions]);

  /**
   * Add a tower-specific code snippet to the editor
   */
  const addTowerCodeSnippet = useCallback(
    async (towerType, towerContext = {}) => {
      if (!initialCodeGenerated) {
        return;
      }

      const towerConfig = getTowerByType(towerType);
      const resolvedTowerType = towerConfig?.type || towerType;
      const isAIAssist = resolvedTowerType === 'AIAssist';
      if (towerConfig?.isNonCode) {
        if (addTerminalMessage) {
          addTerminalMessage(`[MODULE] Added ${towerType}: non-code tower (no code generation).`);
        }
        return;
      }

      // Increment tower count for this type
      if (!towerCountsRef.current[towerType]) {
        towerCountsRef.current[towerType] = 1;
      } else {
        towerCountsRef.current[towerType]++;
      }

      const count = towerCountsRef.current[towerType];
      //console.log(`[DEBUG] Adding ${towerType} tower (count: ${count})`);

      // Check if code snippet generation is enabled
      // If disabled, don't add any snippets (neither AI nor basic)
      //console.log(`[DEBUG] AI Code Snippets Enabled: ${aiCodeSnippetsEnabled}`);
      if (!aiCodeSnippetsEnabled) {
        //console.log(`[DEBUG] Code snippet generation is disabled - not adding any snippets for ${towerType}`);
        if (addTerminalMessage) {
          addTerminalMessage(`[MODULE] Added ${towerType}: Code snippet generation is disabled.`);
        }
        return;
      }

      const placementPosition = towerContext?.position || null;
      const languageKey = language === 'cpp' ? 'cpp' : String(language).toLowerCase();

      const applySnippet = (snippet) => {
        if (!snippet) return false;
        suppressTowerSuggestions();
        registerGeneratedLines(snippet);
        suppressNextLineCommitIfMultiline(snippet);
        const insertedValue = insertSnippetIntoEditor(snippet);
        if (typeof insertedValue === 'string') {
          setCode(insertedValue);
          return true;
        }
        if (!insertedValue) {
          const editorValue =
            typeof window !== 'undefined'
              ? window.__tdMonacoEditor?.getModel?.()?.getValue?.()
              : null;
          if (typeof editorValue === 'string') {
            setCode(editorValue);
            return true;
          }
          setCode((prevCode) => prevCode + snippet);
        }
        return true;
      };

      const queuePendingSnippet = (pending) => {
        if (pendingSnippetRef.current?.actions?.accept) {
          pendingSnippetRef.current.actions.accept({ auto: true });
        }

        pending.movedOffPreview = false;
        pendingSnippetRef.current = pending;
        if (typeof window !== 'undefined') {
          window.__tdPendingSnippet = pending;
          window.__tdPendingSnippetActions = pending.actions;
          window.dispatchEvent(
            new CustomEvent('td-snippet-review', {
              detail: {
                status: 'pending',
                range: pending.preview?.highlightRange || null,
              },
            })
          );
        }
      };

      try {
        // Only use AI snippet generation for non-initial tower types
        // Function and Object towers used for initialization should use existing methods
        if (
          initialCodeGenerated &&
          !(resolvedTowerType === 'Function' && count === 1) &&
          !(resolvedTowerType === 'Object' && count === 1)
        ) {
          //console.log(`[DEBUG] Using AI-powered snippet generation for ${resolvedTowerType}`);

          const generateAndQueueSnippet = async () => {
            // Set the AI code generation state to true and update current tower type
            if (typeof window.setIsGeneratingAICode === 'function') {
              window.setIsGeneratingAICode(true);
            }
            if (typeof window.setCurrentTowerType === 'function') {
              window.setCurrentTowerType(resolvedTowerType);
            }

            if (addTerminalMessage) {
              addTerminalMessage(
                '[SYSTEM] AI snippet generation started. One automatic quality-retry may run for free (no extra generation cost).'
              );
            }

            try {
              const requestTowerType = isAIAssist ? 'AIAssist' : resolvedTowerType;
              const result = await CodeSnippetManager.getEnhancedTowerCodeSnippet(
                requestTowerType,
                language,
                code,
                problem,
                count
              );

              // Check if we got a valid result with a snippet
              if (result && result.snippet) {
                if (result.rateLimited) {
                  if (result.fallbackReason) {
                    showSnippetFallbackToast(result.fallbackReason);
                  }
                  if (applySnippet(result.snippet) && addTerminalMessage) {
                    addTerminalMessage(
                      `[MODULE] Added ${resolvedTowerType}: ${result.rateInfo?.message || 'Added standard code structure to solution.'}`
                    );
                  }
                  return true;
                }

                if (result.fallbackReason) {
                  showSnippetFallbackToast(result.fallbackReason);
                  if (applySnippet(result.snippet) && addTerminalMessage) {
                    addTerminalMessage(
                      `[MODULE] Added ${resolvedTowerType}: AI snippet generation was unavailable, so standard code structure was inserted.`
                    );
                  }
                  return true;
                }

                const firstLine =
                  String(result.snippet)
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .find(Boolean) || '';
                const derivedTowerType = getDerivedTowerType(firstLine, languageKey);
                const derivedLabel = derivedTowerType || 'NextLine';

                suppressTowerSuggestions();
                registerGeneratedLines(result.snippet);
                suppressNextLineCommitIfMultiline(result.snippet);
                const preview =
                  insertSnippetPreview(result.snippet) ||
                  createDetachedSnippetPreview(result.snippet);
                if (preview?.value) {
                  setCode(preview.value);
                } else {
                  applySnippet(result.snippet);
                }

                if (addTerminalMessage) {
                  if (isAIAssist) {
                    addTerminalMessage(
                      `[MODULE] AIAssist: next-best line generated (${derivedLabel}).`
                    );
                  } else {
                    addTerminalMessage(
                      `[MODULE] ${resolvedTowerType}: advanced logic with next-best line (${derivedLabel}).`
                    );
                  }

                  if (result.rateInfo) {
                    const remainingCount =
                      result.rateInfo.totalRemaining ?? result.rateInfo.remaining;
                    if (remainingCount !== undefined) {
                      addTerminalMessage(
                        `[INFO] You have ${remainingCount} AI snippet generation${remainingCount === 1 ? '' : 's'} remaining.`
                      );
                    }
                  }

                  if (result.autoRetry?.used) {
                    addTerminalMessage(
                      '[SYSTEM] Auto-quality retry applied (freebie). No extra AI generation was consumed.'
                    );
                  }

                  addTerminalMessage(
                    '[SYSTEM] Snippet ready in editor. Use inline controls to accept/deny/retry (retry costs 1 generation).'
                  );
                }

                const accept = (options = {}) => {
                  if (preview?.decorationIds?.length && typeof window !== 'undefined') {
                    const editor = window.__tdMonacoEditor;
                    if (editor?.deltaDecorations) {
                      editor.deltaDecorations(preview.decorationIds, []);
                    }
                    if (preview?.endPosition) {
                      editor.setPosition(preview.endPosition);
                      editor.revealPositionInCenterIfOutsideViewport(preview.endPosition);
                      editor.focus();
                    }
                  }
                  if (addTerminalMessage) {
                    addTerminalMessage(
                      options.auto
                        ? '[SYSTEM] Previous snippet auto-accepted (new generation requested).'
                        : '[SYSTEM] Snippet accepted.'
                    );
                  }

                  if (
                    isAIAssist &&
                    derivedTowerType &&
                    placementPosition &&
                    typeof window !== 'undefined'
                  ) {
                    const transformed =
                      typeof window.__tdTransformTowerAtPosition === 'function'
                        ? window.__tdTransformTowerAtPosition(placementPosition, derivedTowerType)
                        : false;
                    if (addTerminalMessage) {
                      if (transformed) {
                        addTerminalMessage(
                          `[MODULE] AIAssist reconfigured to ${derivedTowerType}.`
                        );
                      } else {
                        addTerminalMessage('[WARNING] Unable to reconfigure AIAssist tower.');
                      }
                    }
                  }

                  clearPendingSnippet();
                };

                const deny = () => {
                  if (preview?.beforeValue) {
                    setCode(preview.beforeValue);
                  }
                  if (preview?.decorationIds?.length && typeof window !== 'undefined') {
                    const editor = window.__tdMonacoEditor;
                    if (editor?.deltaDecorations) {
                      editor.deltaDecorations(preview.decorationIds, []);
                    }
                  }
                  if (preview?.beforeValue && typeof window !== 'undefined') {
                    const editor = window.__tdMonacoEditor;
                    if (editor?.setValue) {
                      editor.setValue(preview.beforeValue);
                      setCode(preview.beforeValue);
                      if (preview.cursorPosition) {
                        editor.setPosition(preview.cursorPosition);
                      }
                      if (preview.selectionRange) {
                        editor.setSelection(preview.selectionRange);
                      }
                    }
                  }
                  clearPendingSnippet('[SYSTEM] Snippet denied. Tower charge not refunded.');
                };

                const retry = async () => {
                  if (preview?.beforeValue) {
                    setCode(preview.beforeValue);
                  }
                  if (preview?.decorationIds?.length && typeof window !== 'undefined') {
                    const editor = window.__tdMonacoEditor;
                    if (editor?.deltaDecorations) {
                      editor.deltaDecorations(preview.decorationIds, []);
                    }
                  }
                  if (preview?.beforeValue && typeof window !== 'undefined') {
                    const editor = window.__tdMonacoEditor;
                    if (editor?.setValue) {
                      editor.setValue(preview.beforeValue);
                      setCode(preview.beforeValue);
                      if (preview.cursorPosition) {
                        editor.setPosition(preview.cursorPosition);
                      }
                      if (preview.selectionRange) {
                        editor.setSelection(preview.selectionRange);
                      }
                    }
                  }
                  clearPendingSnippet('[SYSTEM] Regenerating snippet...');
                  await generateAndQueueSnippet();
                };

                queuePendingSnippet({
                  snippet: result.snippet,
                  requestedTowerType: resolvedTowerType,
                  derivedTowerType,
                  placementPosition,
                  preview,
                  actions: { accept, deny, retry },
                });
                return true;
              }

              if (result?.rateLimited && addTerminalMessage) {
                addTerminalMessage(
                  `[MODULE] ${resolvedTowerType}: ${result.rateInfo?.message || 'AI snippet limit reached. Watch an ad to continue.'}`
                );
                return true;
              }

              return false;
            } finally {
              // Reset the AI code generation state
              if (typeof window.setIsGeneratingAICode === 'function') {
                window.setIsGeneratingAICode(false);
              }
              if (typeof window.setCurrentTowerType === 'function') {
                window.setCurrentTowerType('');
              }
            }
          };

          try {
            const handled = await generateAndQueueSnippet();
            if (handled) {
              return;
            }
          } catch (error) {
            console.error('Error setting AI code generation state:', error);
          }
        }

        // Fall back to traditional snippet generation
        //console.log(`[DEBUG] Using traditional snippet generation for ${towerType}`);
        const snippet = CodeSnippetManager.getTowerCodeSnippet(resolvedTowerType, language, count);
        showSnippetFallbackToast('ai_generation_failed');

        // Add the snippet to the code if not empty
        if (snippet) {
          applySnippet(snippet);
          if (addTerminalMessage) {
            addTerminalMessage(`Added ${resolvedTowerType}: added code structure to solution.`);
          }
        }
      } catch (error) {
        console.error('Error generating tower code snippet:', error);
        // Fall back to traditional snippet generation
        const snippet = CodeSnippetManager.getTowerCodeSnippet(resolvedTowerType, language, count);
        showSnippetFallbackToast('ai_generation_failed');
        if (snippet) {
          applySnippet(snippet);
          if (addTerminalMessage) {
            addTerminalMessage(`Added ${resolvedTowerType}: added code structure to solution.`);
          }
        }
      }
    },
    [
      initialCodeGenerated,
      language,
      code,
      problem,
      addTerminalMessage,
      aiCodeSnippetsEnabled,
      insertSnippetIntoEditor,
      insertSnippetPreview,
      createDetachedSnippetPreview,
      registerGeneratedLines,
      suppressTowerSuggestions,
      suppressNextLineCommitIfMultiline,
      getDerivedTowerType,
      clearPendingSnippet,
      showSnippetFallbackToast,
    ]
  );

  /**
   * Submit the solution code for verification
   */
  const submitSolution = useCallback(
    async (timerValue = 0) => {
      try {
        setIsExecuting(true);
        if (addTerminalMessage) {
          addTerminalMessage('[KERNEL] _/// INITIATING CODE MATRIX VERIFICATION ////_');
          addTerminalMessage('[SYSTEM] Running algorithmic integrity analysis...');
          addTerminalMessage('[KERNEL] Compiling security bypass vectors...');
          addTerminalMessage('[SYSTEM] Probing system vulnerability matrices...');
        }

        const userIdString = localStorage.getItem('user_id');
        const userId = userIdString ? parseInt(userIdString) : null;

        const result = await submitSolutionRequest({
          code,
          language,
          problem,
          userId,
          timerValue,
          addTerminalMessage,
          onExecutionRateLimit,
        });

        if (result.status === 'vm_timeout') {
          setCodeSubmitted(true);
          setCodeSubmissionSuccess(false);
          return 'vm_timeout';
        }

        if (result.status === 'rate_limited') {
          return 'rate_limited';
        }

        const success = Boolean(result.success);
        setCodeSubmitted(true);
        setCodeSubmissionSuccess(success);
        audioManager.playSoundEffect(success ? 'solution-successful' : 'solution-failed');

        return success;
      } catch (error) {
        console.error('Error submitting solution:', error);
        if (addTerminalMessage) {
          addTerminalMessage(
            '[ERROR] Verification process compromised! Security protocols unstable.'
          );
          addTerminalMessage('Connection interrupted. Attempting to recover breach vector...');
        }

        setCodeSubmitted(true);
        setCodeSubmissionSuccess(false);
        audioManager.playSoundEffect('solution-failed');

        console.error('[ERROR] Verification failure details:', {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        });

        return false;
      } finally {
        setIsExecuting(false);
      }
    },
    [code, language, problem, addTerminalMessage, onExecutionRateLimit]
  );

  /**
   * Run code to test against test cases without submitting
   */
  const runCodeTests = useCallback(async () => {
    try {
      setIsExecuting(true);
      if (addTerminalMessage) {
        addTerminalMessage('[TEST] _/// RUNNING CODE AGAINST TEST CASES ////_');
        addTerminalMessage('[SYSTEM] Preparing test environment...');
        addTerminalMessage('[SYSTEM] Executing test cases...');
      }

      const userIdString = localStorage.getItem('user_id');
      const userId = userIdString ? parseInt(userIdString) : null;

      const result = await runCodeTestsRequest({
        code,
        language,
        problem,
        userId,
        addTerminalMessage,
        onExecutionRateLimit,
      });

      if (result.status === 'vm_timeout') {
        return 'vm_timeout';
      }

      if (result.status === 'rate_limited') {
        return 'rate_limited';
      }

      const success = Boolean(result.success);
      const response = result.response;

      if (addTerminalMessage) {
        if (success) {
          addTerminalMessage('[SYSTEM] All test cases passed! ✅');
        } else {
          addTerminalMessage('[SYSTEM] Some test cases failed. ❌');
        }

        if (response?.formatted?.testCases) {
          addTerminalMessage('[SYSTEM] Test case details:');
          response.formatted.testCases.forEach((testCase, index) => {
            addTerminalMessage(
              `[TEST ${index + 1}] ${testCase.passed ? '✅ PASSED' : '❌ FAILED'}`
            );
            addTerminalMessage(`Input: ${JSON.stringify(testCase.input)}`);
            addTerminalMessage(`Expected Output: ${JSON.stringify(testCase.expectedOutput)}`);
            addTerminalMessage(`Actual Output: ${JSON.stringify(testCase.actualOutput)}`);

            const userStdout = getUserStdout(testCase.stdout);
            if (userStdout) {
              addTerminalMessage(`Stdout: ${userStdout}`);
            }

            if (!testCase.passed) {
              if (testCase.compile_output) {
                addTerminalMessage(`Compilation Error: ${testCase.compile_output}`);
              }
              if (testCase.stderr) {
                addTerminalMessage(`Runtime Error: ${testCase.stderr}`);
              }
              if (testCase.message) {
                addTerminalMessage(`Message: ${testCase.message}`);
              }
              if (testCase.error) {
                addTerminalMessage(`Error: ${testCase.error}`);
              }
            }
            addTerminalMessage('------------------');
          });
        } else if (response?.testResults) {
          addTerminalMessage('[SYSTEM] Test case details:');
          response.testResults.forEach((testCase, index) => {
            addTerminalMessage(
              `[TEST ${index + 1}] ${testCase.passed ? '✅ PASSED' : '❌ FAILED'}`
            );
            addTerminalMessage(`Input: ${JSON.stringify(testCase.input)}`);
            addTerminalMessage(`Expected: ${JSON.stringify(testCase.expected)}`);
            addTerminalMessage(`Output: ${JSON.stringify(testCase.output)}`);
            if (!testCase.passed) {
              addTerminalMessage(`Error: ${testCase.error || 'Results do not match'}`);
            }
            addTerminalMessage('------------------');
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Error running code tests:', error);
      if (addTerminalMessage) {
        addTerminalMessage('[ERROR] Test process failed! Execution environment error.');
        addTerminalMessage('Try again or adjust your code to fix syntax errors.');
      }

      return false;
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, problem, addTerminalMessage, onExecutionRateLimit]);

  /**
   * Run code to capture raw stdout/stderr without comparing to expected output
   */
  const runCodeOutput = useCallback(async () => {
    try {
      setIsExecuting(true);
      if (addTerminalMessage) {
        addTerminalMessage('[OUTPUT] Capturing program output...');
        addTerminalMessage('[SYSTEM] Executing test cases...');
      }

      const userIdString = localStorage.getItem('user_id');
      const userId = userIdString ? parseInt(userIdString) : null;

      const result = await runCodeOutputRequest({
        code,
        language,
        problem,
        userId,
        addTerminalMessage,
        onExecutionRateLimit,
      });

      return result;
    } catch (error) {
      console.error('Error capturing code output:', error);
      if (addTerminalMessage) {
        addTerminalMessage('[ERROR] Output capture failed. Try again.');
      }
      return { status: 'error', success: false, response: null, apiError: error };
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, problem, addTerminalMessage, onExecutionRateLimit]);

  /**
   * Get a code snippet for the current language
   */
  const getCodeSnippetForLanguage = useCallback(
    (lang = language) => {
      return CodeSnippetManager.getCodeSnippetForLanguage(lang, problem);
    },
    [language, problem]
  );

  /**
   * Reset tower counts - useful when resetting the game
   */
  const resetTowerCounts = useCallback(() => {
    towerCountsRef.current = {};
  }, []);

  // When sending code context to AI
  const sendCodeContext = async (context) => {
    try {
      // Prepare code context for AI prompt
      const preparedContext = {
        ...context,
        code: prepareForPrompt(context.code),
        problem: {
          ...context.problem,
          title: prepareForPrompt(context.problem.title),
          content: prepareForPrompt(context.problem.content),
        },
      };

      // Send to backend
      const response = await api.ai.analyzeCode(preparedContext);
      return response;
    } catch (error) {
      console.error('Error sending code context:', error);
      throw error;
    }
  };

  return {
    // State
    code,
    setCode,
    language,
    setLanguage,
    isExecuting,
    setIsExecuting,
    codeSubmitted,
    setCodeSubmitted,
    codeSubmissionSuccess,
    setCodeSubmissionSuccess,
    functionTowerPlaced,
    setFunctionTowerPlaced,
    objectTowerPlaced,
    setObjectTowerPlaced,
    initialCodeGenerated,
    setInitialCodeGenerated,
    aiCodeSnippetsEnabled,
    setAiCodeSnippetsEnabled,

    // Methods
    handleLanguageChange,
    generateInitialCodeSnippet,
    addTowerCodeSnippet,
    submitSolution,
    runCodeTests,
    runCodeOutput,
    getCodeSnippetForLanguage,
    resetTowerCounts,
    sendCodeContext,
  };
}

