import { Box, FormControl, FormLabel, Spinner } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { parseEscapeSequences } from '../utils/generationHelpers';
import MobileSyntaxTextarea from '../../editor/MobileSyntaxTextarea';
import useEquippedCosmetics from '../../../hooks/cosmetics/useEquippedCosmetics';
import {
  AI_RUNTIME_THEME_NAME,
  registerAiRuntimeTheme,
} from '../../../utils/monaco/editorSurfaceBaselines';
import { applyCustomTokenProviders } from '../../../utils/monaco/towerTokenProviders';
import detectPhoneFriendlyEditorMode from '../../../utils/web/detectPhoneFriendlyEditorMode';
import {
  buildMonacoOptionsFromFont,
  ensureMonacoTheme,
  getMonacoThemeName,
} from '../../../utils/monaco/cosmeticThemeTools';

const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

const SolutionEditor = ({ solution, setSolution, language, setEditorRef }) => {
  const [localSolution, setLocalSolution] = useState(parseEscapeSequences(solution || ''));
  const [isPhoneEditorMode, setIsPhoneEditorMode] = useState(() => detectPhoneFriendlyEditorMode());
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isEditingRef = useRef(false);
  const { editorThemePack, editorFontPack, editorBackgroundPack, editorEffectPack } =
    useEquippedCosmetics();

  useEffect(() => {
    if (!isEditingRef.current) {
      const parsedSolution = parseEscapeSequences(solution || '');
      setLocalSolution(parsedSolution);

      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model && model.getValue() !== parsedSolution) {
          const position = editorRef.current.getPosition();
          model.setValue(parsedSolution);
          if (position) {
            editorRef.current.setPosition(position);
          }
        }
      }
    }
  }, [solution]);

  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'python':
        return 'python';
      case 'javascript':
        return 'javascript';
      case 'java':
        return 'java';
      case 'cpp':
        return 'cpp';
      default:
        return 'python';
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (setEditorRef && typeof setEditorRef === 'function') {
      setEditorRef(editor);
    }

    editor.setValue(localSolution);

    editor.onDidChangeModelContent(() => {
      isEditingRef.current = true;
      setLocalSolution(editor.getValue());
    });

    editor.onDidBlurEditorWidget(() => {
      isEditingRef.current = false;
      const currentValue = editor.getValue();
      if (solution !== currentValue) {
        setSolution(currentValue);
      }
    });

    editor.onDidFocusEditorWidget(() => {
      isEditingRef.current = true;
    });

    registerAiRuntimeTheme(monaco);
    if (editorThemePack?.id) {
      ensureMonacoTheme(monaco, editorThemePack);
      monaco.editor.setTheme(getMonacoThemeName(editorThemePack.id));
    } else {
      monaco.editor.setTheme(AI_RUNTIME_THEME_NAME);
    }

    applyCustomTokenProviders(monaco, editor, getMonacoLanguage(language));
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    applyCustomTokenProviders(monaco, editor, getMonacoLanguage(language));
  }, [language]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    if (editorThemePack?.id) {
      ensureMonacoTheme(monaco, editorThemePack);
      monaco.editor.setTheme(getMonacoThemeName(editorThemePack.id));
    } else {
      monaco.editor.setTheme(AI_RUNTIME_THEME_NAME);
    }

    editor.updateOptions({
      ...buildMonacoOptionsFromFont(editorFontPack),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      folding: true,
      lineNumbers: 'on',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
        verticalSliderSize: 8,
        horizontalSliderSize: 8,
      },
      glyphMargin: false,
      cursorBlinking: 'phase',
      cursorSmoothCaretAnimation: Boolean(editorEffectPack?.cursorGlow),
      cursorStyle: 'line',
      smoothScrolling: true,
      renderLineHighlight: editorEffectPack?.linePulse ? 'all' : 'line',
      hideCursorInOverviewRuler: true,
    });
  }, [editorEffectPack?.cursorGlow, editorEffectPack?.linePulse, editorFontPack, editorThemePack]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewportChange = () => {
      setIsPhoneEditorMode(detectPhoneFriendlyEditorMode());
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
    if (!isPhoneEditorMode) return;

    editorRef.current = null;
    monacoRef.current = null;

    if (typeof setEditorRef === 'function') {
      setEditorRef(null);
    }
  }, [isPhoneEditorMode, setEditorRef]);

  const handleMobileSolutionChange = (event) => {
    const nextValue = event?.target?.value ?? '';
    isEditingRef.current = true;
    setLocalSolution(nextValue);
  };

  const handleMobileSolutionBlur = (event) => {
    isEditingRef.current = false;

    const nextValue = event?.target?.value ?? '';
    if (solution !== nextValue) {
      setSolution(nextValue);
    }
  };

  return (
    <FormControl>
      <FormLabel
        color="#0a2c9a"
        fontFamily={UI_FONT_FAMILY}
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.06em"
      >
        Edit Solution
      </FormLabel>
      <Box
        h="300px"
        bg="#d4d0c8"
        border="1px solid #7f7f7f"
        borderRadius="0"
        position="relative"
        boxShadow="var(--cg-window-outset)"
        overflow="hidden"
      >
        <React.Suspense
          fallback={
            <Box
              w="100%"
              h="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="#ece8df"
            >
              <Spinner
                color="#0a2c9a"
                size="xl"
                thickness="4px"
                speed="0.8s"
                emptyColor="#b7bcc8"
              />
            </Box>
          }
        >
          {isPhoneEditorMode ? (
            <MobileSyntaxTextarea
              value={localSolution}
              language={getMonacoLanguage(language)}
              onChange={handleMobileSolutionChange}
              onBlur={handleMobileSolutionBlur}
              themePack={editorThemePack}
              fontPack={editorFontPack}
              effectPack={editorEffectPack}
              backgroundStyle={editorBackgroundPack}
              height="300px"
              minHeight="300px"
              borderColor="#7f7f7f"
              background="#ffffff"
              textareaProps={{
                enterKeyHint: 'enter',
              }}
            />
          ) : (
            <MonacoEditor
              height="300px"
              language={getMonacoLanguage(language)}
              theme={
                editorThemePack?.id ? getMonacoThemeName(editorThemePack.id) : AI_RUNTIME_THEME_NAME
              }
              value={localSolution}
              options={{
                ...buildMonacoOptionsFromFont(editorFontPack),
                automaticLayout: true,
                tabSize: 2,
                folding: true,
                lineNumbers: 'on',
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  verticalSliderSize: 8,
                  horizontalSliderSize: 8,
                },
                glyphMargin: false,
                cursorBlinking: 'phase',
                cursorSmoothCaretAnimation: Boolean(editorEffectPack?.cursorGlow),
                cursorStyle: 'line',
                smoothScrolling: true,
                renderLineHighlight: editorEffectPack?.linePulse ? 'all' : 'line',
                hideCursorInOverviewRuler: true,
              }}
              onMount={handleEditorDidMount}
            />
          )}
        </React.Suspense>
      </Box>
    </FormControl>
  );
};

export default SolutionEditor;
