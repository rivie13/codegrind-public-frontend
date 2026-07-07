import { Box, Textarea } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const caretBlink = keyframes`
  0%, 45% {
    opacity: 1;
  }

  55%, 100% {
    opacity: 0;
  }
`;

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeLanguage = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'py' || normalized === 'python3') return 'python';
  if (normalized === 'js' || normalized === 'node' || normalized === 'nodejs') return 'javascript';
  if (normalized === 'c++') return 'cpp';

  return normalized || 'javascript';
};

const SIMPLE_KEYWORD_CLASSES = {
  python: {
    def: 'kw-function',
    class: 'kw-object',
    if: 'kw-ifcondition',
    elif: 'kw-ifcondition',
    else: 'kw-ifcondition',
    for: 'kw-forloop',
    while: 'kw-whileloop',
    try: 'kw-trycatch',
    except: 'kw-trycatch',
    finally: 'kw-trycatch',
    return: 'kw-return',
    import: 'kw-generic',
    from: 'kw-generic',
    in: 'kw-generic',
  },
  javascript: {
    function: 'kw-function',
    class: 'kw-object',
    if: 'kw-ifcondition',
    else: 'kw-ifcondition',
    for: 'kw-forloop',
    while: 'kw-whileloop',
    do: 'kw-whileloop',
    try: 'kw-trycatch',
    catch: 'kw-trycatch',
    finally: 'kw-trycatch',
    return: 'kw-return',
    const: 'kw-generic',
    let: 'kw-generic',
    var: 'kw-generic',
    import: 'kw-generic',
    from: 'kw-generic',
  },
  java: {
    class: 'kw-object',
    if: 'kw-ifcondition',
    else: 'kw-ifcondition',
    for: 'kw-forloop',
    while: 'kw-whileloop',
    try: 'kw-trycatch',
    catch: 'kw-trycatch',
    finally: 'kw-trycatch',
    return: 'kw-return',
    static: 'kw-generic',
    public: 'kw-generic',
    private: 'kw-generic',
    protected: 'kw-generic',
    void: 'kw-generic',
    new: 'kw-generic',
  },
  cpp: {
    class: 'kw-object',
    if: 'kw-ifcondition',
    else: 'kw-ifcondition',
    for: 'kw-forloop',
    while: 'kw-whileloop',
    try: 'kw-trycatch',
    catch: 'kw-trycatch',
    return: 'kw-return',
    auto: 'kw-generic',
    const: 'kw-generic',
    namespace: 'kw-generic',
    using: 'kw-generic',
    include: 'kw-generic',
  },
};

const COMMENT_OR_STRING_TOKEN_REGEX =
  /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|#.*$|\/\/[^\n\r]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b)/gm;
const NUMBER_REGEX = /^\d+(?:\.\d+)?$/;
const IDENTIFIER_REGEX = /^[A-Za-z_]\w*$/;

const buildSimpleSyntaxHtml = (rawCode, language) => {
  const source = String(rawCode || '');
  if (!source) return ' ';

  const normalizedLanguage = normalizeLanguage(language);
  const keywordClasses =
    SIMPLE_KEYWORD_CLASSES[normalizedLanguage] || SIMPLE_KEYWORD_CLASSES.javascript;

  let html = '';
  let cursor = 0;

  source.replace(COMMENT_OR_STRING_TOKEN_REGEX, (token, _capture, index) => {
    html += escapeHtml(source.slice(cursor, index));

    let className = '';
    if (token.startsWith('#') || token.startsWith('//') || token.startsWith('/*')) {
      className = 'token-comment';
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      className = 'token-string';
    } else if (NUMBER_REGEX.test(token)) {
      className = 'token-number';
    } else if (IDENTIFIER_REGEX.test(token)) {
      className = keywordClasses[token] || '';
    }

    if (className) {
      html += `<span class="${className}">${escapeHtml(token)}</span>`;
    } else {
      html += escapeHtml(token);
    }

    cursor = index + token.length;
    return token;
  });

  html += escapeHtml(source.slice(cursor));
  return html || ' ';
};

const MobileSyntaxTextarea = ({
  value,
  language,
  onChange,
  onKeyDown,
  onBlur,
  themePack = null,
  fontPack = null,
  effectPack = null,
  backgroundStyle = null,
  height = '100%',
  minHeight = '0',
  borderColor = '#0f4667',
  borderRadius = 'md',
  background = '#0a0a1a',
  fontSize = 'sm',
  lineHeight = '1.45',
  paddingX = 3,
  paddingY = 3,
  textareaProps = {},
}) => {
  const previewRef = useRef(null);
  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const markerRef = useRef(null);
  const [caretSelection, setCaretSelection] = useState({
    start: 0,
    end: 0,
    scrollTop: 0,
    scrollLeft: 0,
    focused: false,
  });
  const [caretMetrics, setCaretMetrics] = useState({ top: 0, left: 0, height: 0 });
  const highlightedCode = useMemo(() => buildSimpleSyntaxHtml(value, language), [value, language]);
  const tokenColors = themePack?.tokenColors || {};
  const editorColors = themePack?.editorColors || {};
  const resolvedFontSize =
    typeof fontPack?.fontSize === 'number' ? `${fontPack.fontSize}px` : fontSize;
  const resolvedLineHeight = fontPack?.lineHeight || lineHeight;
  const resolvedFontFamily = fontPack?.fontFamily || 'monospace';
  const resolvedForeground = editorColors.foreground || '#d8f4ff';
  const resolvedBackground = backgroundStyle?.background || background;
  const resolvedBackgroundSize = backgroundStyle?.backgroundSize || '100% 100%';
  const resolvedBackgroundAnimation = backgroundStyle?.animation || 'none';
  const resolvedCaretColor = effectPack?.cursorGlowColor || editorColors.cursor || '#7df9ff';
  const resolvedSelectionColor = editorColors.selection || 'rgba(0, 204, 255, 0.25)';
  const resolvedFocusRing = `0 0 0 1px ${resolvedCaretColor}`;
  const resolvedCaretGlow = effectPack?.cursorGlow
    ? `0 0 8px ${effectPack.cursorGlowColor || resolvedCaretColor}`
    : 'none';
  const mirrorTextBeforeCaret = useMemo(
    () => String(value ?? '').slice(0, caretSelection.start),
    [caretSelection.start, value]
  );
  const selectionCollapsed = caretSelection.start === caretSelection.end;
  const shouldRenderCustomCaret = caretSelection.focused && selectionCollapsed;

  const syncSelectionFromTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    setCaretSelection({
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? textarea.selectionStart ?? 0,
      scrollTop: textarea.scrollTop ?? 0,
      scrollLeft: textarea.scrollLeft ?? 0,
      focused: document.activeElement === textarea,
    });
  };

  const handleScroll = (event) => {
    if (!previewRef.current) return;

    previewRef.current.scrollTop = event.currentTarget.scrollTop;
    previewRef.current.scrollLeft = event.currentTarget.scrollLeft;
    syncSelectionFromTextarea();
  };

  useEffect(() => {
    syncSelectionFromTextarea();
  }, [value]);

  useEffect(() => {
    const marker = markerRef.current;
    const mirror = mirrorRef.current;
    if (!marker || !mirror) return;

    const nextHeight =
      marker.offsetHeight || mirror.clientHeight || parseFloat(String(resolvedLineHeight)) || 22;
    setCaretMetrics({
      top: marker.offsetTop - caretSelection.scrollTop,
      left: marker.offsetLeft - caretSelection.scrollLeft,
      height: nextHeight,
    });
  }, [
    caretSelection,
    mirrorTextBeforeCaret,
    resolvedFontFamily,
    resolvedFontSize,
    resolvedLineHeight,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewportChange = () => {
      syncSelectionFromTextarea();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  const handleFocus = () => {
    syncSelectionFromTextarea();
  };

  const handleBlur = (event) => {
    setCaretSelection((previous) => ({
      ...previous,
      focused: false,
    }));

    if (typeof onBlur === 'function') {
      onBlur(event);
    }
  };

  const handleSelectionChange = () => {
    syncSelectionFromTextarea();
  };

  return (
    <Box
      position="relative"
      h={height}
      minH={minHeight}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius={borderRadius}
      overflow="hidden"
      bg={background}
      background={resolvedBackground}
      backgroundSize={resolvedBackgroundSize}
      animation={resolvedBackgroundAnimation}
      _focusWithin={{
        borderColor: resolvedCaretColor,
        boxShadow: resolvedFocusRing,
      }}
    >
      {effectPack?.overlayGlow ? (
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          bg={`radial-gradient(circle at 50% 0%, ${effectPack.overlayGlowColor || 'rgba(56, 189, 248, 0.2)'}, transparent 52%)`}
          zIndex={0}
        />
      ) : null}

      {effectPack?.chromaticShift ? (
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          zIndex={0}
          bg="linear-gradient(90deg, rgba(236,72,153,0.07), transparent 35%, transparent 65%, rgba(34,211,238,0.07))"
          mixBlendMode="screen"
        />
      ) : null}

      {effectPack?.scanline ? (
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          zIndex={0}
          opacity={effectPack.scanlineOpacity || 0.18}
          bg="repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)"
        />
      ) : null}

      <Box
        ref={previewRef}
        as="pre"
        m={0}
        position="absolute"
        inset={0}
        px={paddingX}
        py={paddingY}
        overflow="auto"
        pointerEvents="none"
        color={resolvedForeground}
        fontFamily={resolvedFontFamily}
        fontSize={resolvedFontSize}
        lineHeight={resolvedLineHeight}
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        zIndex={1}
        sx={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          '.token-comment': {
            color: tokenColors.comment || '#5588aa',
            fontStyle: 'italic',
          },
          '.token-string': {
            color: tokenColors.string || '#ffaa00',
          },
          '.token-number': {
            color: tokenColors.number || '#ff3366',
          },
          '.kw-generic': {
            color: tokenColors.keyword || '#00ccff',
          },
          '.kw-ifcondition': {
            color: tokenColors['brackets.ifcondition'] || tokenColors.keyword || '#ff9900',
            fontWeight: 700,
          },
          '.kw-forloop': {
            color: tokenColors['brackets.forloop'] || tokenColors.keyword || '#00ff00',
            fontWeight: 700,
          },
          '.kw-whileloop': {
            color: tokenColors['brackets.whileloop'] || tokenColors.keyword || '#00ffcc',
            fontWeight: 700,
          },
          '.kw-function': {
            color: tokenColors['brackets.function'] || tokenColors.function || '#3399ff',
            fontWeight: 700,
          },
          '.kw-object': {
            color: tokenColors['brackets.object'] || tokenColors.type || '#ffdd00',
            fontWeight: 700,
          },
          '.kw-trycatch': {
            color: tokenColors['brackets.trycatch'] || tokenColors.keyword || '#33cccc',
            fontWeight: 700,
          },
          '.kw-return': {
            color: tokenColors['brackets.return'] || tokenColors.keyword || '#ff33cc',
            fontWeight: 700,
          },
        }}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />

      <Box
        ref={mirrorRef}
        position="absolute"
        inset={0}
        px={paddingX}
        py={paddingY}
        overflow="hidden"
        pointerEvents="none"
        visibility="hidden"
        fontFamily={resolvedFontFamily}
        fontSize={resolvedFontSize}
        lineHeight={resolvedLineHeight}
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        zIndex={1}
      >
        <Box as="span">{mirrorTextBeforeCaret || ''}</Box>
        <Box ref={markerRef} as="span" display="inline-block" w="0" h="1em" verticalAlign="top" />
      </Box>

      {shouldRenderCustomCaret ? (
        <Box
          position="absolute"
          top={`${caretMetrics.top}px`}
          left={`${caretMetrics.left}px`}
          width="2px"
          height={`${caretMetrics.height}px`}
          bg={resolvedCaretColor}
          boxShadow={resolvedCaretGlow}
          borderRadius="full"
          pointerEvents="none"
          zIndex={3}
          animation={`${caretBlink} 1.06s steps(1, end) infinite`}
        />
      ) : null}

      <Textarea
        ref={textareaRef}
        value={value ?? ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onSelect={handleSelectionChange}
        onScroll={handleScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        inputMode="text"
        resize="none"
        bg="transparent"
        color="rgba(216, 244, 255, 0.01)"
        caretColor={resolvedCaretColor}
        borderWidth="0"
        fontFamily={resolvedFontFamily}
        fontSize={resolvedFontSize}
        lineHeight={resolvedLineHeight}
        px={paddingX}
        py={paddingY}
        zIndex={2}
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        _focusVisible={{
          outline: 'none',
          boxShadow: 'none',
        }}
        sx={{
          // Keep glyphs effectively invisible while allowing mobile browsers to paint the caret.
          WebkitTextFillColor: 'rgba(216, 244, 255, 0.01)',
          textShadow: 'none',
          caretColor: 'transparent',
          '&::selection': {
            background: resolvedSelectionColor,
          },
        }}
        {...textareaProps}
      />
    </Box>
  );
};

export default MobileSyntaxTextarea;
