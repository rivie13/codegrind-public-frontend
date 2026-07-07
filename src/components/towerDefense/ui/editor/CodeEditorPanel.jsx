import { Box, Button, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import TowerDefenseTerminal from '../../terminal/TowerDefenseTerminal';
import visualSettingsManager from '../../../../utils/game/VisualSettingsManager';
import { useMatrixBombEffect } from '../../../../hooks/animations/useMatrixBombEffect';
import CodeEditorHeader from './CodeEditorHeader';
import CodeEditorSetupPanel from './CodeEditorSetupPanel';
import CodeEditorMonacoArea from './CodeEditorMonacoArea';
import SnippetReviewWidget from './SnippetReviewWidget';
import useSnippetReviewWidget from '../../../../hooks/towerDefense/codeEditor/ui/useSnippetReviewWidget';
import useEditorSplitPane from '../../../../hooks/towerDefense/codeEditor/ui/useEditorSplitPane';
import useEquippedCosmetics from '../../../../hooks/cosmetics/useEquippedCosmetics';
import {
  applyCustomTokenProviders,
  defineTowerTheme,
  getMatrixRefreshInterval,
  logTokenization,
} from '../../../../utils/monaco/towerTokenProviders';
import { hydrateSnippetPreview } from '../../../../hooks/towerDefense/codeEditor/snippetInsertion';
import {
  buildMonacoOptionsFromFont,
  ensureMonacoTheme,
  getMonacoThemeName,
} from '../../../../utils/monaco/cosmeticThemeTools';
import detectPhoneFriendlyEditorMode from '../../../../utils/web/detectPhoneFriendlyEditorMode';

const normalizeMonacoLanguage = (value) => {
  if (typeof value !== 'string') return 'javascript';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'c++') return 'cpp';
  if (normalized === 'js') return 'javascript';
  if (['python', 'javascript', 'java', 'cpp'].includes(normalized)) return normalized;
  return 'javascript';
};

const detectLandscapeViewport = () => {
  if (typeof window === 'undefined') return false;

  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(orientation: landscape)').matches) ||
    window.innerWidth > window.innerHeight
  );
};

const WINDOWS_TOUCH_KEYBOARD_HINT_DISMISSED_KEY = '_td_windows_touch_keyboard_hint_dismissed_v1';

const CodeEditorPanel = ({
  initialCodeGenerated,
  playerLost,
  playerWon,
  initialLives,
  language,
  code,
  showTerminal,
  terminalOutput,
  terminalAnimating,
  terminalRef,
  terminalResetKey,
  codeSubmitted,
  codeSubmissionSuccess,
  canSubmitSolution,
  currentWave,
  lives,
  adSlotId,
  selectedTowerType,
  isTowerPlacementMode,
  onLanguageChange,
  onCodeChange,
  onStartWave,
  onResetGame,
  onCancelTowerPlacement,
  gameStatus,
  problemTitle,
  difficulty,
  isDemo = false,
  strictCodeGate = false,
  onTerminalCommand = null,
  terminalInputEnabled = false,
  terminalInputPlaceholder = 'Type /tower help',
  terminalInputDisabledReason = 'Commands are locked during active waves.',
  onCodeLineCommitted = null,
  isLearningMode = false,
  lockedLearningLanguage = null,
  isMobileSlotLayout = false,
  slotSwitcherControl = null,
  slotChrome = null,
  shellTheme = 'default',
  isHomepageDemo = false,
  functionTowerPlaced = false,
}) => {
  const [internalCodeGenerated, setInternalCodeGenerated] = useState(initialCodeGenerated);
  const { editorHeight, terminalHeight, containerRef, resizeHandleRef, handleResizeStart } =
    useEditorSplitPane();
  const editorRef = useRef(null); // Reference to the Monaco editor instance
  const cursorListenerRef = useRef(null);
  const contentListenerRef = useRef(null);
  const onLineCommittedRef = useRef(onCodeLineCommitted);
  const languageRef = useRef(language);
  const codeRef = useRef(code);
  const currentLineRef = useRef(1);
  const unlockCursorSetRef = useRef(false);
  const initialLivesRef = useRef(typeof lives === 'number' ? lives : 10);
  const matrixActiveRef = useRef(false);
  const matrixIntensityRef = useRef(0);
  const matrixVisibleLinesRef = useRef(1);
  const { updateMatrixEffect, startMatrixBomb, stopMatrixBomb } = useMatrixBombEffect();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [editorInstanceVersion, setEditorInstanceVersion] = useState(0);
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() => detectLandscapeViewport());
  const [isPhoneEditorMode, setIsPhoneEditorMode] = useState(() => detectPhoneFriendlyEditorMode());
  const [showWindowsTouchKeyboardHint, setShowWindowsTouchKeyboardHint] = useState(false);
  const [visualSettings, setVisualSettings] = useState(() => visualSettingsManager.getSettings());
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const effectivePhoneEditorMode = isMobileSlotLayout && isPhoneEditorMode;
  const useMobileTouchResizeHandle = isMobileSlotLayout;
  const editorSplitRatio = useMemo(() => {
    const parsed = Number.parseFloat(editorHeight);
    return Number.isFinite(parsed) ? parsed : 70;
  }, [editorHeight]);
  const terminalSplitRatio = useMemo(() => {
    const parsed = Number.parseFloat(terminalHeight);
    return Number.isFinite(parsed) ? parsed : 30;
  }, [terminalHeight]);
  const { widgetState: snippetReviewWidget, handleAction: handleSnippetWidgetAction } =
    useSnippetReviewWidget(editorRef);
  const { editorThemePack, editorFontPack, editorBackgroundPack, editorEffectPack } =
    useEquippedCosmetics();

  const monacoOptions = useMemo(
    () => ({
      ...buildMonacoOptionsFromFont(editorFontPack),
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      wordBasedSuggestions: 'currentDocument',
      tabCompletion: 'on',
      lineNumbers: 'on',
      renderLineHighlight: editorEffectPack?.linePulse ? 'all' : 'line',
      cursorBlinking: 'phase',
      cursorSmoothCaretAnimation: Boolean(editorEffectPack?.cursorGlow),
      smoothScrolling: true,
      renderIndentGuides: true,
      inlineSuggest: { enabled: true },
    }),
    [editorEffectPack?.cursorGlow, editorEffectPack?.linePulse, editorFontPack]
  );

  const monacoThemeName = useMemo(() => {
    if (!editorThemePack?.id) return 'cyberpunk';
    return getMonacoThemeName(editorThemePack.id);
  }, [editorThemePack?.id]);

  const handleDismissWindowsTouchKeyboardHint = () => {
    setShowWindowsTouchKeyboardHint(false);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WINDOWS_TOUCH_KEYBOARD_HINT_DISMISSED_KEY, '1');
    }
  };

  // Track initialCodeGenerated state from multiple sources
  useEffect(() => {
    if (strictCodeGate) {
      setInternalCodeGenerated(Boolean(initialCodeGenerated));
      return;
    }
    // Function to check all possible sources
    const checkCodeGeneratedState = () => {
      // First use the prop directly
      if (initialCodeGenerated) {
        setInternalCodeGenerated(true);
        return true;
      }

      // Check localStorage
      const storedValue = localStorage.getItem('_tower_defense_code_generated');
      if (storedValue === 'true') {
        setInternalCodeGenerated(true);
        return true;
      }

      // Check body class
      if (document.body.classList.contains('initial-code-generated')) {
        setInternalCodeGenerated(true);
        return true;
      }

      return initialCodeGenerated;
    };

    // Run the check immediately
    checkCodeGeneratedState();

    // Listen for custom events
    const handleCodeGenComplete = () => {
      //console.log('[DEBUG] CodeEditorPanel: Received codegen-complete event');
      setInternalCodeGenerated(true);

      const editor = editorRef.current;
      if (editor && codeRef.current && matrixActiveRef.current) {
        const refreshInterval = getMatrixRefreshInterval();
        startMatrixBomb({
          editor,
          code: codeRef.current,
          intensity: matrixIntensityRef.current,
          refreshInterval,
          visibleLineCount: matrixVisibleLinesRef.current,
        });
      }
    };

    const handleCodeGenReset = () => {
      //console.log('[DEBUG] CodeEditorPanel: Received codegen-reset event');
      setInternalCodeGenerated(false);
    };

    const handleCompleteReset = () => {
      //console.log('[DEBUG] CodeEditorPanel: Received game-completely-reset event');
      setInternalCodeGenerated(false);
    };

    document.addEventListener('codegen-complete', handleCodeGenComplete);
    document.addEventListener('codegen-reset', handleCodeGenReset);
    document.addEventListener('game-completely-reset', handleCompleteReset);

    return () => {
      document.removeEventListener('codegen-complete', handleCodeGenComplete);
      document.removeEventListener('codegen-reset', handleCodeGenReset);
      document.removeEventListener('game-completely-reset', handleCompleteReset);
    };
  }, [initialCodeGenerated, strictCodeGate, startMatrixBomb]);

  const focusCursorAtEnd = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel?.();
    if (!model) return;

    const lastLine = Math.max(1, model.getLineCount());
    const lastColumn = model.getLineMaxColumn(lastLine);

    editor.setPosition({ lineNumber: lastLine, column: lastColumn });
    if (typeof editor.revealPositionInCenterIfOutsideViewport === 'function') {
      editor.revealPositionInCenterIfOutsideViewport({ lineNumber: lastLine, column: lastColumn });
    } else if (typeof editor.revealLineInCenter === 'function') {
      editor.revealLineInCenter(lastLine);
    }
    editor.focus();
  };

  // If internal state says code is generated but props don't, use internal state
  const effectiveCodeGenerated = strictCodeGate
    ? initialCodeGenerated
    : internalCodeGenerated || initialCodeGenerated;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDismissed =
      window.localStorage.getItem(WINDOWS_TOUCH_KEYBOARD_HINT_DISMISSED_KEY) === '1';
    if (isDismissed) return;

    const hasTouch =
      (window.navigator?.maxTouchPoints || 0) > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const isWindows = /Windows/i.test(window.navigator?.userAgent || '');

    if (isWindows && hasTouch) {
      setShowWindowsTouchKeyboardHint(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewportChange = () => {
      setIsLandscapeViewport(detectLandscapeViewport());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!effectiveCodeGenerated || gameStatus === 'prehack' || playerLost || playerWon) {
      unlockCursorSetRef.current = false;
      return;
    }

    if (unlockCursorSetRef.current) return;
    if (!editorRef.current) return;

    unlockCursorSetRef.current = true;
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        focusCursorAtEnd();
      });
    } else {
      focusCursorAtEnd();
    }
  }, [effectiveCodeGenerated, gameStatus, playerLost, playerWon, editorInstanceVersion, code]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    onLineCommittedRef.current = onCodeLineCommitted;
  }, [onCodeLineCommitted]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const handleSettingsChange = () => {
      setVisualSettings(visualSettingsManager.getSettings());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('td-settings-changed', handleSettingsChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('td-settings-changed', handleSettingsChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof lives === 'number') {
      if (gameStatus === 'prehack' || lives > initialLivesRef.current) {
        initialLivesRef.current = lives;
      }
    }
  }, [gameStatus, lives]);

  const matrixTier = useMemo(() => {
    const maxLives = Math.max(1, initialLives ?? initialLivesRef.current ?? lives ?? 1);
    const currentLives = typeof lives === 'number' ? lives : maxLives;
    const lifeRatio = Math.max(0, Math.min(1, currentLives / maxLives));

    if (lifeRatio > 0.7) return 0;
    if (lifeRatio > 0.5) return 1;
    if (lifeRatio > 0.3) return 2;
    if (lifeRatio > 0.1) return 3;
    return 4;
  }, [initialLives, lives]);

  const matrixIntensity = useMemo(() => {
    const baseIntensity = visualSettings.editorMatrixIntensity ?? 0;
    const enabled = visualSettings.editorMatrixEnabled !== false;
    if (!enabled || matrixTier === 0) return 0;

    const tierMultiplier = [0, 0.25, 0.5, 0.75, 1][matrixTier] || 0;
    return Math.max(0, Math.min(1, baseIntensity * tierMultiplier));
  }, [matrixTier, visualSettings.editorMatrixEnabled, visualSettings.editorMatrixIntensity]);

  const matrixVisibleLineCount = useMemo(() => {
    const minLines = Math.max(1, Math.floor(visualSettings.editorMatrixVisibleLinesMin ?? 1));
    const maxLines = Math.max(
      minLines,
      Math.floor(visualSettings.editorMatrixVisibleLinesMax ?? 5)
    );

    if (matrixTier === 0) return maxLines;

    const tierMapping = [
      maxLines,
      maxLines,
      Math.max(minLines, Math.round(maxLines * 0.6)),
      Math.max(minLines, Math.round(maxLines * 0.4)),
      minLines,
    ];
    return tierMapping[matrixTier] ?? minLines;
  }, [
    matrixTier,
    visualSettings.editorMatrixVisibleLinesMin,
    visualSettings.editorMatrixVisibleLinesMax,
  ]);

  const matrixActive = useMemo(() => {
    const enabled = visualSettings.editorMatrixEnabled !== false;
    return (
      enabled &&
      matrixTier > 0 &&
      matrixIntensity > 0.01 &&
      !playerLost &&
      !playerWon &&
      internalCodeGenerated
    );
  }, [
    visualSettings.editorMatrixEnabled,
    matrixTier,
    matrixIntensity,
    playerLost,
    playerWon,
    internalCodeGenerated,
  ]);

  useEffect(() => {
    matrixActiveRef.current = matrixActive;
    matrixIntensityRef.current = matrixIntensity;
    matrixVisibleLinesRef.current = matrixVisibleLineCount;
  }, [matrixActive, matrixIntensity, matrixVisibleLineCount]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !matrixActive || !code) {
      stopMatrixBomb();
      return;
    }

    const refreshInterval = getMatrixRefreshInterval();

    startMatrixBomb({
      editor,
      code,
      intensity: matrixIntensity,
      refreshInterval,
      visibleLineCount: matrixVisibleLineCount,
    });

    return () => {
      stopMatrixBomb();
    };
  }, [
    code,
    editorInstanceVersion,
    matrixActive,
    matrixIntensity,
    matrixVisibleLineCount,
    startMatrixBomb,
    stopMatrixBomb,
  ]);

  // Handle editor initialization and apply custom syntax highlighting
  const handleEditorDidMount = (editor, monaco) => {
    //console.log("Monaco editor mounted - applying syntax highlighting for tower types");
    editorRef.current = editor;
    if (typeof window !== 'undefined') {
      window.__tdMonacoEditor = editor;
      window.__tdMonaco = monaco;
    }
    setEditorInstanceVersion((prev) => prev + 1);

    if (cursorListenerRef.current) {
      cursorListenerRef.current.dispose();
    }

    if (contentListenerRef.current) {
      contentListenerRef.current.dispose();
    }

    cursorListenerRef.current = editor.onDidChangeCursorPosition((e) => {
      currentLineRef.current = e.position.lineNumber;
      if (matrixActiveRef.current) {
        updateMatrixEffect(
          editor,
          codeRef.current,
          currentLineRef.current,
          matrixIntensityRef.current,
          matrixVisibleLinesRef.current
        );
      }
    });

    contentListenerRef.current = editor.onDidChangeModelContent((event) => {
      const handler = onLineCommittedRef.current;
      if (!handler) return;
      if (event?.isFlush) return;
      const model = editor.getModel();
      if (!model) return;

      const consumeSuppressedCommit = () => {
        if (typeof window === 'undefined') return false;
        const count = Number(window.__tdSuppressNextLineCommit || 0);
        if (!count || count <= 0) return false;
        window.__tdSuppressNextLineCommit = Math.max(0, count - 1);
        return true;
      };

      event.changes.forEach((change) => {
        const text = change?.text ?? '';
        if (!text || (!text.includes('\n') && !text.includes('\r\n'))) return;
        if (consumeSuppressedCommit()) return;
        const lineNumber = change.range?.startLineNumber;
        if (!lineNumber) return;
        const lineText = model.getLineContent(lineNumber);
        handler({
          lineText,
          lineNumber,
          language: languageRef.current,
        });
      });
    });

    if (!monaco.editor.tokenize) {
      monaco.editor.tokenize = {};
    }

    defineTowerTheme(monaco);
    if (editorThemePack?.id) {
      ensureMonacoTheme(monaco, editorThemePack);
      monaco.editor.setTheme(getMonacoThemeName(editorThemePack.id));
    }

    // Call our setup functions
    setTimeout(() => {
      applyCustomTokenProviders(monaco, editor);
      logTokenization(editor);
    }, 500);

    // Store these functions for later use
    window.applyCustomTokenProviders = () => applyCustomTokenProviders(monaco, editor);
    window.logTokenization = () => logTokenization(editor);

    if (typeof window !== 'undefined' && window.__tdPendingSnippet?.preview?.highlightRange) {
      const hydratedPreview = hydrateSnippetPreview(
        window.__tdPendingSnippet.preview,
        editor,
        monaco
      );
      if (hydratedPreview) {
        // Preserve the pending snippet selection instead of moving the cursor to EOF.
        unlockCursorSetRef.current = true;
        window.__tdPendingSnippet.preview = hydratedPreview;
        window.dispatchEvent(
          new CustomEvent('td-snippet-review', {
            detail: {
              status: 'pending',
              range: hydratedPreview.highlightRange,
            },
          })
        );
      }
    }
  };

  useEffect(() => {
    if (!editorRef.current || !window.__tdMonaco) return;

    const monaco = window.__tdMonaco;
    if (editorThemePack?.id) {
      ensureMonacoTheme(monaco, editorThemePack);
      monaco.editor.setTheme(getMonacoThemeName(editorThemePack.id));
    } else {
      monaco.editor.setTheme('cyberpunk');
    }
    editorRef.current.updateOptions(monacoOptions);
  }, [editorThemePack, monacoOptions]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if (window.__tdMonacoEditor === editorRef.current) {
          delete window.__tdMonacoEditor;
        }
        if (window.__tdMonaco) {
          delete window.__tdMonaco;
        }
      }
      if (cursorListenerRef.current) {
        cursorListenerRef.current.dispose();
        cursorListenerRef.current = null;
      }
      if (contentListenerRef.current) {
        contentListenerRef.current.dispose();
        contentListenerRef.current = null;
      }
    };
  }, []);

  // When language changes, re-apply syntax highlighting
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const editor = editorRef.current;
    const monaco = window.__tdMonaco || window.monaco;
    if (!editor || !monaco) return undefined;

    const timeoutId = setTimeout(() => {
      applyCustomTokenProviders(monaco, editor, normalizeMonacoLanguage(language));
      logTokenization(editor);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [language]);

  return (
    <Box
      flex="1"
      minWidth="0"
      minHeight="0"
      height="100%"
      bg={isRetroDesktopTheme ? '#d4d0c8' : '#0a0a1a'}
      borderRadius={isRetroDesktopTheme ? '0' : 'md'}
      overflow="hidden"
      border={isRetroDesktopTheme ? '2px solid' : '1px solid'}
      borderColor={isRetroDesktopTheme ? '#5d636e' : '#0f4667'}
      boxShadow={
        isRetroDesktopTheme
          ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(92, 99, 110, 0.28), 0 12px 18px rgba(0, 0, 0, 0.12)'
          : '0 0 20px rgba(0, 210, 255, 0.15)'
      }
      display="flex"
      flexDirection="column"
      position="relative"
      _before={
        isRetroDesktopTheme
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #00ccff, transparent)',
              zIndex: 1,
            }
      }
      _after={
        isRetroDesktopTheme
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #00ccff, transparent)',
              zIndex: 1,
            }
      }
    >
      <CodeEditorHeader
        language={language}
        onLanguageChange={onLanguageChange}
        codeSubmitted={codeSubmitted}
        codeSubmissionSuccess={codeSubmissionSuccess}
        canSubmitSolution={canSubmitSolution}
        isLearningMode={isLearningMode}
        lockedLearningLanguage={lockedLearningLanguage}
        compactMobileLandscape={isMobileSlotLayout && isLandscapeViewport}
        showMobileKeyboardButton={effectivePhoneEditorMode}
        leftAddon={slotSwitcherControl}
        rightAddon={slotChrome}
        shellTheme={shellTheme}
      />

      {showWindowsTouchKeyboardHint && (
        <Flex
          align="center"
          justify="space-between"
          gap={2}
          px={3}
          py={2}
          borderBottom="1px solid"
          borderColor={isRetroDesktopTheme ? 'rgba(93, 99, 110, 0.45)' : 'rgba(0, 204, 255, 0.25)'}
          bg={isRetroDesktopTheme ? '#ece6da' : 'rgba(0, 35, 70, 0.55)'}
        >
          <Text
            color={isRetroDesktopTheme ? '#2b2f38' : '#bfeeff'}
            fontSize="xs"
            fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          >
            Windows touch keyboard tip: if keyboard does not appear while a physical keyboard is
            attached, go to Settings {'>'} Time and language {'>'} Typing {'>'} Touch keyboard and
            set Show the touch keyboard to Always.
          </Text>
          <Button
            size="xs"
            variant={isRetroDesktopTheme ? 'solid' : 'outline'}
            color={isRetroDesktopTheme ? '#1f2430' : '#8edfff'}
            bg={isRetroDesktopTheme ? '#d4d0c8' : undefined}
            borderColor={isRetroDesktopTheme ? '#7d828a' : 'rgba(142, 223, 255, 0.7)'}
            onClick={handleDismissWindowsTouchKeyboardHint}
            _hover={{ bg: isRetroDesktopTheme ? '#f5efe3' : 'rgba(142, 223, 255, 0.12)' }}
            sx={
              isRetroDesktopTheme
                ? {
                    borderRadius: '0',
                    border: '1px solid #7d828a',
                    boxShadow:
                      'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.28)',
                    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                    fontWeight: '700',
                  }
                : undefined
            }
          >
            Dismiss
          </Button>
        </Flex>
      )}

      {/* Editor with conditional Terminal */}
      <Box
        position="relative"
        flex="1"
        minHeight="0"
        display="flex"
        flexDirection="column"
        ref={containerRef}
        overflow="hidden"
      >
        {(!effectiveCodeGenerated || gameStatus === 'prehack') &&
        !playerLost &&
        !playerWon &&
        !isHomepageDemo ? (
          <CodeEditorSetupPanel
            showTerminal={showTerminal}
            terminalHeight={terminalHeight}
            currentWave={currentWave}
            onStartWave={onStartWave}
            onResetGame={onResetGame}
            selectedTowerType={selectedTowerType}
            onCancelTowerPlacement={onCancelTowerPlacement}
            problemTitle={problemTitle}
            difficulty={difficulty}
            isDemo={isDemo}
            showHowToPlay={showHowToPlay}
            setShowHowToPlay={setShowHowToPlay}
            lives={lives}
            effectiveCodeGenerated={effectiveCodeGenerated}
            shellTheme={shellTheme}
          />
        ) : (
          <CodeEditorMonacoArea
            shellTheme={shellTheme}
            editorHeight={editorHeight}
            editorFlexGrow={editorSplitRatio}
            showTerminal={showTerminal}
            language={language}
            code={code}
            onCodeChange={onCodeChange}
            onEditorDidMount={handleEditorDidMount}
            theme={monacoThemeName}
            editorOptions={monacoOptions}
            backgroundStyle={editorBackgroundPack}
            editorThemePack={editorThemePack}
            editorFontPack={editorFontPack}
            editorEffectPack={editorEffectPack}
            snippetReviewWidget={snippetReviewWidget}
            onSnippetAction={handleSnippetWidgetAction}
            onCodeLineCommitted={onCodeLineCommitted}
            onPhoneModeChange={setIsPhoneEditorMode}
            selectedTowerType={selectedTowerType}
            isTowerPlacementMode={isTowerPlacementMode}
            isMobileSlotLayout={isMobileSlotLayout}
            isHomepageDemo={isHomepageDemo}
            functionTowerPlaced={functionTowerPlaced}
          />
        )}

        {/* Mobile snippet review bar - stacked between editor and terminal */}
        {isMobileSlotLayout && snippetReviewWidget.visible && (
          <SnippetReviewWidget visible isMobile onAction={handleSnippetWidgetAction} />
        )}

        {/* Resize Handle - only show when both editor and terminal are visible */}
        {showTerminal && effectiveCodeGenerated && gameStatus !== 'prehack' && (
          <Box
            ref={resizeHandleRef}
            height={useMobileTouchResizeHandle ? '20px' : '8px'}
            bg={
              isRetroDesktopTheme
                ? '#c9c4bb'
                : useMobileTouchResizeHandle
                  ? 'rgba(10, 16, 32, 0.85)'
                  : '#0a1020'
            }
            cursor="row-resize"
            onPointerDown={handleResizeStart}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            position="relative"
            zIndex="20"
            sx={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            aria-label="Resize editor and terminal"
            role="separator"
            aria-orientation="horizontal"
            _hover={{ bg: isRetroDesktopTheme ? '#d8d2c9' : '#00ccff50' }}
            _active={{ bg: isRetroDesktopTheme ? '#bdb8af' : '#00ccff80' }}
            borderTop="1px solid"
            borderBottom="1px solid"
            borderColor={isRetroDesktopTheme ? '#5d636e' : '#0f4667'}
            display="flex"
            justifyContent="center"
            alignItems="center"
            m="0"
            p="0"
            flexShrink={0}
            boxShadow={
              isRetroDesktopTheme
                ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.66), inset -1px -1px 0 rgba(93, 99, 110, 0.2)'
                : useMobileTouchResizeHandle
                  ? 'inset 0 0 10px rgba(0, 204, 255, 0.12)'
                  : 'none'
            }
          >
            <Box
              width={useMobileTouchResizeHandle ? '48px' : '30px'}
              height={useMobileTouchResizeHandle ? '3px' : '2px'}
              borderRadius={isRetroDesktopTheme ? '0' : 'full'}
              bg={isRetroDesktopTheme ? '#000080' : '#00ccff'}
              boxShadow={isRetroDesktopTheme ? 'none' : '0 0 10px rgba(0, 204, 255, 0.75)'}
            />
          </Box>
        )}

        {/* Terminal - show regardless of editor state */}
        {showTerminal && (
          <Box
            ref={terminalRef}
            flex={
              effectiveCodeGenerated && gameStatus !== 'prehack'
                ? `${terminalSplitRatio} 1 0px`
                : undefined
            }
            height={effectiveCodeGenerated && gameStatus !== 'prehack' ? undefined : '40%'}
            minHeight="0"
            borderTop="none"
            m="0"
            p="0"
            overflow="hidden"
            position="relative"
            display="flex"
            flexDirection="column"
            data-tutorial="terminal-panel"
            bg={isRetroDesktopTheme ? '#d4d0c8' : undefined}
            _before={
              isRetroDesktopTheme
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    bg: 'linear-gradient(90deg, transparent, rgba(0, 204, 255, 0.3), transparent)',
                    zIndex: 1,
                  }
            }
          >
            <TowerDefenseTerminal
              key={terminalResetKey}
              executionResult={terminalOutput}
              isLoading={terminalAnimating}
              showAd={false}
              adSlotId={adSlotId}
              livesRemaining={lives}
              isResizable={false} // Disable terminal's internal resize
              terminalHeight="100%" // Fill the container
              onNewMessageProcessed={() => {
                // Callback when terminal finishes typing a message
              }}
              gameStatus={gameStatus} // Pass the gameStatus prop to the terminal
              onCommandSubmit={onTerminalCommand}
              inputEnabled={terminalInputEnabled}
              inputPlaceholder={terminalInputPlaceholder}
              inputDisabledReason={terminalInputDisabledReason}
              isPlacementActive={isTowerPlacementMode}
              onCancelPlacement={onCancelTowerPlacement}
              shellTheme={shellTheme}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CodeEditorPanel;
