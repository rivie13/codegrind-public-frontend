import { Box, Button, Flex, Input, Text, useToast } from '@chakra-ui/react';
import Editor, { useMonaco } from '@monaco-editor/react';
import MobileSyntaxTextarea from '../../editor/MobileSyntaxTextarea';
import { Resizable } from 're-resizable';
import { useEffect, useMemo, useRef, useState } from 'react';
import EditorFooter from './EditorFooter';
import EditorToolbar from './EditorToolbar';
import { applyCustomTokenProviders } from '../../../utils/monaco/towerTokenProviders';
import { registerWorkspaceRuntimeTheme } from '../../../utils/monaco/editorSurfaceBaselines';
import useEquippedCosmetics from '../../../hooks/cosmetics/useEquippedCosmetics';
import {
  buildMonacoOptionsFromFont,
  ensureMonacoTheme,
  getMonacoThemeName,
} from '../../../utils/monaco/cosmeticThemeTools';

const languageMapping = {
  python: 'python',
  java: 'java',
  javascript: 'javascript',
  cpp: 'cpp',
  'c++': 'cpp',
};

const normalizeLanguage = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const MIN_TERMINAL_HEIGHT = 200;
const MIN_EDITOR_HEIGHT = 220;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const EditorPanel = ({
  displayCode,
  language,
  onChange,
  onLanguageChange,
  isExecuting,
  executionResult,
  onRun,
  onRunOutput,
  onSubmit,
  mode,
  timer,
  sessionSubmissions,
  bestTime,
  highScore,
  formatTime,
  problemData: _problemData,
  setCurrentLine,
  setMatrixBombActive,
  challengeState,
  setCursorPosition: _setCursorPosition,
  setEditor,
  // Animation settings props
  isHighRes,
  animationsEnabled,
  toggleAnimations,
  // Problem workspace UI controls
  isChatVisible,
  onToggleChatVisibility,
  executionRateLimit,
  isLearningMode = false,
  isLearningPathMode = false,
  onResetLearningTutorial,
  lockedLearningLanguage = null,
  isMobilePhoneMode = false,
}) => {
  const [editorHeight, setEditorHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [touchInputLineNumber, setTouchInputLineNumber] = useState(1);
  const [touchInputValue, setTouchInputValue] = useState('');
  const monaco = useMonaco();
  const toast = useToast();
  const [performanceMode, setPerformanceMode] = useState(false);
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const touchInputFocusedRef = useRef(false);
  const applyingTouchEditRef = useRef(false);
  const cursorChangeDisposableRef = useRef(null);
  const contentChangeDisposableRef = useRef(null);
  const { editorThemePack, editorFontPack, editorBackgroundPack, editorEffectPack } =
    useEquippedCosmetics();

  const equippedMonacoOptions = useMemo(
    () => ({
      ...buildMonacoOptionsFromFont(editorFontPack),
      cursorSmoothCaretAnimation: Boolean(editorEffectPack?.cursorGlow),
      renderLineHighlight: editorEffectPack?.linePulse ? 'all' : 'line',
    }),
    [editorEffectPack?.cursorGlow, editorEffectPack?.linePulse, editorFontPack]
  );

  const equippedThemeName = useMemo(() => {
    if (!editorThemePack?.id) return 'cyberpunkTheme';
    return getMonacoThemeName(editorThemePack.id);
  }, [editorThemePack?.id]);

  // Detect high performance mode
  useEffect(() => {
    if (isHighRes) {
      setPerformanceMode(true);
      console.log('[DEBUG] High-res mode active in EditorPanel');
    }
  }, [isHighRes]);

  // Keep editor height clamped so the terminal never disappears below the fold
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateHeights = () => {
      const height = element.clientHeight || 0;
      const maxEditorHeight = Math.max(MIN_EDITOR_HEIGHT, height - MIN_TERMINAL_HEIGHT);
      setContainerHeight(height);
      setEditorHeight((prev) => {
        if (!prev) {
          const desired = height ? height * 0.6 : 360;
          return clamp(desired, MIN_EDITOR_HEIGHT, maxEditorHeight);
        }
        return clamp(prev, MIN_EDITOR_HEIGHT, maxEditorHeight);
      });
    };

    const resizeObserver = new ResizeObserver(updateHeights);
    resizeObserver.observe(element);
    updateHeights();
    window.addEventListener('resize', updateHeights);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeights);
    };
  }, []);

  // Set the Monaco editor theme and options
  useEffect(() => {
    if (monaco) {
      registerWorkspaceRuntimeTheme(monaco);
      monaco.editor.setTheme('cyberpunkTheme');
    }
  }, [monaco]);

  const handleLanguageChange = (newLang) => {
    if (!newLang) return;
    const normalizedLocked = lockedLearningLanguage?.toLowerCase();
    const normalizedNext = newLang?.toLowerCase();
    if (
      isLearningPathMode &&
      normalizedLocked &&
      normalizedNext &&
      normalizedNext !== normalizedLocked
    ) {
      toast({
        title: 'Language locked',
        description: 'You cannot change your language in learning mode.',
        status: 'warning',
        duration: 2200,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    onLanguageChange(newLang);
  };

  const normalizedLanguage = normalizeLanguage(language);
  const monacoLanguage = languageMapping[normalizedLanguage] || 'javascript';

  const handleMobileCodeChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e?.target?.value ?? '');
    }
  };

  const syncTouchInputFromEditor = (editorInstance, lineOverride = null) => {
    if (!editorInstance) return;

    const model = editorInstance.getModel?.();
    if (!model) return;

    const targetLineNumber = Math.max(
      1,
      Math.min(
        lineOverride ?? editorInstance.getPosition?.()?.lineNumber ?? 1,
        model.getLineCount()
      )
    );

    setTouchInputLineNumber(targetLineNumber);

    if (touchInputFocusedRef.current || applyingTouchEditRef.current) {
      return;
    }

    setTouchInputValue(model.getLineContent(targetLineNumber) ?? '');
  };

  const handleTouchInputFocus = () => {
    touchInputFocusedRef.current = true;

    if (
      typeof navigator !== 'undefined' &&
      navigator.virtualKeyboard &&
      typeof navigator.virtualKeyboard.show === 'function'
    ) {
      try {
        navigator.virtualKeyboard.show();
      } catch {
        // Ignore unsupported or blocked virtual keyboard calls.
      }
    }
  };

  const handleTouchInputBlur = () => {
    touchInputFocusedRef.current = false;
    syncTouchInputFromEditor(editorRef.current);
  };

  const handleTouchInputLineStep = (delta) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel?.();
    if (!model) return;

    const currentPosition = editor.getPosition?.();
    const currentLine = currentPosition?.lineNumber ?? touchInputLineNumber;
    const nextLine = Math.max(1, Math.min(currentLine + delta, model.getLineCount()));

    editor.setPosition({ lineNumber: nextLine, column: 1 });
    if (typeof editor.revealPositionInCenterIfOutsideViewport === 'function') {
      editor.revealPositionInCenterIfOutsideViewport({ lineNumber: nextLine, column: 1 });
    }

    syncTouchInputFromEditor(editor, nextLine);
  };

  const handleTouchInputChange = (event) => {
    const sanitizedValue = String(event?.target?.value ?? '').replace(/\r?\n/g, ' ');
    setTouchInputValue(sanitizedValue);

    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel?.();
    if (!model) return;

    const targetLineNumber = Math.max(1, Math.min(touchInputLineNumber, model.getLineCount()));

    if (model.getLineContent(targetLineNumber) === sanitizedValue) {
      return;
    }

    applyingTouchEditRef.current = true;
    try {
      editor.executeEdits('workspace-touch-input', [
        {
          range: {
            startLineNumber: targetLineNumber,
            startColumn: 1,
            endLineNumber: targetLineNumber,
            endColumn: model.getLineMaxColumn(targetLineNumber),
          },
          text: sanitizedValue,
        },
      ]);

      const targetColumn = Math.min(
        sanitizedValue.length + 1,
        model.getLineMaxColumn(targetLineNumber)
      );
      editor.setPosition({ lineNumber: targetLineNumber, column: targetColumn });
      if (typeof editor.revealPositionInCenterIfOutsideViewport === 'function') {
        editor.revealPositionInCenterIfOutsideViewport({
          lineNumber: targetLineNumber,
          column: targetColumn,
        });
      }
    } finally {
      applyingTouchEditRef.current = false;
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setEditor(editor);

    if (cursorChangeDisposableRef.current) {
      cursorChangeDisposableRef.current.dispose();
      cursorChangeDisposableRef.current = null;
    }
    if (contentChangeDisposableRef.current) {
      contentChangeDisposableRef.current.dispose();
      contentChangeDisposableRef.current = null;
    }

    if (monaco) {
      if (editorThemePack?.id) {
        ensureMonacoTheme(monaco, editorThemePack);
        monaco.editor.setTheme(getMonacoThemeName(editorThemePack.id));
      } else {
        monaco.editor.setTheme('cyberpunkTheme');
      }
      applyCustomTokenProviders(monaco, editor, monacoLanguage);
    }

    // Store a flag to prevent timer start during init
    sessionStorage.setItem('editorInitializing', 'true');

    // Reset flag after a short delay
    setTimeout(() => {
      sessionStorage.removeItem('editorInitializing');
    }, 1000);

    cursorChangeDisposableRef.current = editor.onDidChangeCursorPosition((e) => {
      const lineNumber = e.position.lineNumber - 1;
      setCurrentLine(lineNumber);
      if (challengeState?.hasMatrixBomb) {
        setMatrixBombActive(true);
      }
      syncTouchInputFromEditor(editor, e.position.lineNumber);
    });

    contentChangeDisposableRef.current = editor.onDidChangeModelContent(() => {
      if (!applyingTouchEditRef.current) {
        syncTouchInputFromEditor(editor);
      }
    });

    if (challengeState?.hasMatrixBomb) {
      editor.updateOptions({
        readOnly: false,
        cursorStyle: 'line',
        cursorBlinking: 'blink',
        lineNumbers: 'on',
        renderWhitespace: 'none',
        scrollBeyondLastLine: false,
        cursorSmoothCaretAnimation: true,
        renderLineHighlight: 'line',
      });
    }

    // Apply performance optimizations for high-res screens
    if (isHighRes || performanceMode) {
      console.log('[DEBUG] Applying performance optimizations to editor');
      editor.updateOptions({
        minimap: { enabled: false },
        renderWhitespace: 'none',
        cursorSmoothCaretAnimation: false,
        smoothScrolling: false,
        overviewRulerLanes: 0,
        renderControlCharacters: false,
        renderIndentGuides: false,
        folding: false,
        glyphMargin: false,
      });
    }

    syncTouchInputFromEditor(editor);
  };

  useEffect(() => {
    if (!monaco || !editorRef.current) return;

    registerWorkspaceRuntimeTheme(monaco);
    if (editorThemePack?.id) {
      ensureMonacoTheme(monaco, editorThemePack);
      monaco.editor.setTheme(getMonacoThemeName(editorThemePack.id));
    } else {
      monaco.editor.setTheme('cyberpunkTheme');
    }

    editorRef.current.updateOptions(equippedMonacoOptions);
  }, [editorThemePack, equippedMonacoOptions, monaco]);

  const handleRunCode = () => {
    toast({
      title: 'Running Code',
      description: 'Executing your algorithm...',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'top',
      render: () => (
        <Box
          p={3}
          bg="var(--cg-window)"
          color="var(--cg-text)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-outset)"
          fontFamily="var(--cg-font-retro-display)"
          letterSpacing="0.08em"
          textAlign="center"
        >
          <Text fontWeight="700" mb={1} textTransform="uppercase">
            Compiling Code
          </Text>
          <Text fontSize="sm">Initializing execution sequence...</Text>
        </Box>
      ),
    });

    onRun();
  };

  const handleRunOutput = (filter) => {
    if (!onRunOutput) return;
    toast({
      title: 'Capturing Output',
      description: 'Running your code to display program output...',
      status: 'info',
      duration: 1800,
      isClosable: true,
      position: 'top',
    });
    onRunOutput(filter);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel?.();
    if (!model) return;
    applyCustomTokenProviders(monaco, editor, monacoLanguage);
    monaco.editor.setModelLanguage(model, monacoLanguage);
  }, [monaco, monacoLanguage]);

  useEffect(() => {
    if (!isMobilePhoneMode) {
      touchInputFocusedRef.current = false;
      applyingTouchEditRef.current = false;
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      if (!touchInputFocusedRef.current) {
        setTouchInputLineNumber(1);
        setTouchInputValue('');
      }
      return;
    }

    syncTouchInputFromEditor(editor);
  }, [displayCode, language, isMobilePhoneMode]);

  useEffect(
    () => () => {
      if (cursorChangeDisposableRef.current) {
        cursorChangeDisposableRef.current.dispose();
        cursorChangeDisposableRef.current = null;
      }
      if (contentChangeDisposableRef.current) {
        contentChangeDisposableRef.current.dispose();
        contentChangeDisposableRef.current = null;
      }
      touchInputFocusedRef.current = false;
      applyingTouchEditRef.current = false;
    },
    []
  );

  const terminalHeight = Math.max(
    MIN_TERMINAL_HEIGHT,
    containerHeight ? containerHeight - editorHeight : MIN_TERMINAL_HEIGHT
  );

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Editor Header with Stats */}
      <EditorToolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        mode={mode}
        timer={timer}
        sessionSubmissions={sessionSubmissions}
        bestTime={bestTime}
        highScore={highScore}
        formatTime={formatTime}
        animationsEnabled={animationsEnabled}
        toggleAnimations={toggleAnimations}
        isChatVisible={isChatVisible}
        onToggleChatVisibility={onToggleChatVisibility}
        onRun={handleRunCode}
        onRunOutput={handleRunOutput}
        onSubmit={onSubmit}
        isExecuting={isExecuting}
        executionRateLimit={executionRateLimit}
        showLearningOutputButtons={isLearningMode}
        isLearningMode={isLearningMode}
        onResetLearningTutorial={onResetLearningTutorial}
        lockedLearningLanguage={lockedLearningLanguage}
        isMobilePhoneMode={isMobilePhoneMode}
      />

      {/* Editor + Terminal body */}
      <Box ref={containerRef} flex="1" display="flex" flexDirection="column" minHeight={0}>
        <Resizable
          size={{ height: editorHeight || 360, width: '100%' }}
          minHeight={MIN_EDITOR_HEIGHT}
          maxHeight={
            containerHeight
              ? Math.max(MIN_EDITOR_HEIGHT, containerHeight - MIN_TERMINAL_HEIGHT)
              : 800
          }
          bounds="parent"
          enable={{ bottom: true }}
          handleStyles={{
            bottom: {
              height: '14px',
              bottom: '-7px',
              cursor: 'row-resize',
              touchAction: 'none',
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.04))',
              borderRadius: '8px',
              zIndex: 5,
            },
          }}
          onResize={(e, direction, ref) => {
            if (e?.cancelable) {
              e.preventDefault();
            }
            const measuredHeight = ref.getBoundingClientRect().height;
            const maxEditorHeight = containerHeight
              ? Math.max(MIN_EDITOR_HEIGHT, containerHeight - MIN_TERMINAL_HEIGHT)
              : 800;
            setEditorHeight(clamp(measuredHeight, MIN_EDITOR_HEIGHT, maxEditorHeight));
          }}
          onResizeStop={(e, direction, ref, _delta) => {
            if (e?.cancelable) {
              e.preventDefault();
            }
            const measuredHeight = ref.getBoundingClientRect().height;
            const maxEditorHeight = containerHeight
              ? Math.max(MIN_EDITOR_HEIGHT, containerHeight - MIN_TERMINAL_HEIGHT)
              : 800;
            setEditorHeight(clamp(measuredHeight, MIN_EDITOR_HEIGHT, maxEditorHeight));
          }}
          style={{
            borderBottom: '1px solid rgba(0, 204, 255, 0.2)',
            background: editorBackgroundPack?.background || '#0a0e17',
            flexShrink: 0,
          }}
        >
          {isMobilePhoneMode ? (
            <Box h="100%" px={1} py={1}>
              <Box
                h="100%"
                borderWidth="1px"
                borderColor="#0f4667"
                borderRadius="md"
                overflow="hidden"
              >
                <MobileSyntaxTextarea
                  value={displayCode}
                  language={monacoLanguage}
                  onChange={handleMobileCodeChange}
                  themePack={editorThemePack}
                  fontPack={editorFontPack}
                  effectPack={editorEffectPack}
                  backgroundStyle={editorBackgroundPack}
                  height="100%"
                  borderColor="#0f4667"
                  background="transparent"
                />
              </Box>
            </Box>
          ) : (
            <Editor
              height="100%"
              defaultLanguage={monacoLanguage}
              language={monacoLanguage}
              theme={equippedThemeName}
              value={displayCode}
              onChange={onChange}
              onMount={handleEditorDidMount}
              options={{
                ...equippedMonacoOptions,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                wordWrap: 'on',
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                suggestOnTriggerCharacters: true,
                wordBasedSuggestions: 'currentDocument',
                tabCompletion: 'on',
                lineNumbers: 'on',
                renderLineHighlight: equippedMonacoOptions.renderLineHighlight || 'line',
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />
          )}
        </Resizable>
        <EditorFooter
          height={terminalHeight}
          minHeight={MIN_TERMINAL_HEIGHT}
          executionResult={executionResult}
          isExecuting={isExecuting}
          onRun={handleRunCode}
        />
      </Box>
    </Box>
  );
};

export default EditorPanel;
