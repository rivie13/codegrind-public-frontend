import { Box } from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import React, { useEffect, useState, useCallback } from 'react';
import detectPhoneFriendlyEditorMode from '../../../../utils/web/detectPhoneFriendlyEditorMode';
import SnippetReviewWidget from './SnippetReviewWidget';
import TowerPlacementInfo from '../TowerPlacementInfo';
import MobileSyntaxTextarea from '../../../editor/MobileSyntaxTextarea';

const CodeEditorMonacoArea = ({
  shellTheme = 'default',
  editorHeight: _editorHeight,
  editorFlexGrow = null,
  showTerminal,
  language,
  code,
  onCodeChange,
  onEditorDidMount,
  theme = 'cyberpunk',
  editorOptions = {},
  backgroundStyle = null,
  editorThemePack = null,
  editorFontPack = null,
  editorEffectPack = null,
  snippetReviewWidget,
  onSnippetAction,
  onCodeLineCommitted: _onCodeLineCommitted = null,
  onPhoneModeChange = null,
  onPhoneViewportChange = null,
  selectedTowerType,
  isTowerPlacementMode,
  isMobileSlotLayout = false,
  isHomepageDemo = false,
  functionTowerPlaced = false,
}) => {
  const [shieldVisible, setShieldVisible] = useState(isHomepageDemo && !functionTowerPlaced);
  const [glitchActive, setGlitchActive] = useState(false);
  const [isPhoneEditorMode, setIsPhoneEditorMode] = useState(() => detectPhoneFriendlyEditorMode());
  const effectivePhoneEditorMode = isMobileSlotLayout && isPhoneEditorMode;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateMode = () => {
      setIsPhoneEditorMode(detectPhoneFriendlyEditorMode());
    };

    updateMode();
    window.addEventListener('resize', updateMode);
    window.addEventListener('orientationchange', updateMode);

    return () => {
      window.removeEventListener('resize', updateMode);
      window.removeEventListener('orientationchange', updateMode);
    };
  }, []);

  useEffect(() => {
    if (typeof onPhoneModeChange === 'function') {
      onPhoneModeChange(effectivePhoneEditorMode);
    }
  }, [effectivePhoneEditorMode, onPhoneModeChange]);

  useEffect(() => {
    if (typeof onPhoneViewportChange === 'function') {
      onPhoneViewportChange(effectivePhoneEditorMode);
    }
  }, [effectivePhoneEditorMode, onPhoneViewportChange]);

  // Shield logic: listen for td-laser-hit to dissolve the shield
  useEffect(() => {
    if (!isHomepageDemo) return;
    if (functionTowerPlaced) {
      // Once function tower is placed, the laser will fire.
      // Listen for the td-laser-hit event to trigger the glitch animation.
      const handleLaserHit = () => {
        console.log('[DEBUG] handleLaserHit triggered in CodeEditorMonacoArea');
        setGlitchActive(true);
        setTimeout(() => {
          setShieldVisible(false);
          setGlitchActive(false);
        }, 600);
      };
      window.addEventListener('td-laser-hit', handleLaserHit);
      return () => window.removeEventListener('td-laser-hit', handleLaserHit);
    }
    // Reset shield if somehow function tower is unplaced
    setShieldVisible(true);
  }, [isHomepageDemo, functionTowerPlaced]);

  const handleMobileCodeChange = (e) => {
    if (typeof onCodeChange === 'function') {
      onCodeChange(e?.target?.value ?? '');
    }
  };

  const touchFriendlyOptions = effectivePhoneEditorMode
    ? {
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        wordBasedSuggestions: 'off',
        inlineSuggest: { enabled: false },
        parameterHints: { enabled: false },
        acceptSuggestionOnEnter: 'off',
        tabCompletion: 'off',
      }
    : null;

  const resolvedEditorOptions = {
    ...editorOptions,
    ...(touchFriendlyOptions || {}),
    // Force read-only when shield is active in homepage demo
    ...(isHomepageDemo && shieldVisible ? { readOnly: true } : {}),
  };

  return (
    <Box
      flex={showTerminal ? `${editorFlexGrow ?? 1} 1 0px` : '1 1 auto'}
      height={showTerminal ? undefined : '100%'}
      minHeight="0"
      m="0"
      p="0"
      overflow="hidden"
      position="relative"
      data-tutorial="code-editor"
      data-learning="code-editor"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'linear-gradient(to bottom, rgba(0,10,30,0.05) 0%, rgba(0,0,0,0) 5%, rgba(0,0,0,0) 95%, rgba(0,10,30,0.05) 100%)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {effectivePhoneEditorMode ? (
        (() => {
          const isRetro = shellTheme === 'retro-desktop';
          const mobileBg = isRetro
            ? editorThemePack?.editorColors?.background || '#090a16'
            : 'transparent';
          const effectiveFontPack = isRetro
            ? {
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontSize: 13,
                lineHeight: 1.45,
                ...(editorFontPack || {}),
              }
            : editorFontPack;

          return (
            <Box h="100%" px={1} py={1}>
              <Box
                h="100%"
                overflow="hidden"
                {...(isRetro
                  ? {
                      border: '2px solid',
                      borderColor: '#808080 #dfdfdf #dfdfdf #808080',
                      boxShadow: 'inset 1px 1px 0 #000, inset -1px -1px 0 #fff',
                      borderRadius: '0',
                    }
                  : {
                      borderWidth: '1px',
                      borderColor: '#0f4667',
                      borderRadius: 'md',
                    })}
              >
                <MobileSyntaxTextarea
                  value={code}
                  language={language === 'cpp' ? 'cpp' : language}
                  onChange={handleMobileCodeChange}
                  themePack={editorThemePack}
                  fontPack={effectiveFontPack}
                  effectPack={editorEffectPack}
                  backgroundStyle={backgroundStyle}
                  height="100%"
                  borderColor="transparent"
                  borderRadius={isRetro ? '0' : 'md'}
                  background={mobileBg}
                />
              </Box>
            </Box>
          );
        })()
      ) : (
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={onCodeChange}
          onMount={onEditorDidMount}
          theme={theme}
          options={{
            ...resolvedEditorOptions,
          }}
        />
      )}

      {backgroundStyle ? (
        <Box
          position="absolute"
          inset="0"
          pointerEvents="none"
          bg={backgroundStyle.background}
          backgroundSize={backgroundStyle.backgroundSize || '100% 100%'}
          animation={backgroundStyle.animation || 'none'}
          mixBlendMode="screen"
          opacity={0.2}
          zIndex={0}
        />
      ) : null}

      {!isMobileSlotLayout && !effectivePhoneEditorMode && (
        <SnippetReviewWidget
          visible={snippetReviewWidget.visible}
          top={snippetReviewWidget.top}
          left={snippetReviewWidget.left}
          onAction={onSnippetAction}
        />
      )}

      <TowerPlacementInfo
        selectedTowerType={selectedTowerType}
        isTowerPlacementMode={isTowerPlacementMode}
      />

      {/* Homepage Demo: Locked Shield Overlay */}
      {isHomepageDemo && shieldVisible && (
        <Box
          position="absolute"
          inset="0"
          zIndex={10}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(0, 0, 0, 0.65)"
          backdropFilter="blur(2px)"
          sx={{
            animation: glitchActive ? 'td-shield-glitch 0.6s steps(4) forwards' : 'none',
            '@keyframes td-shield-glitch': {
              '0%': { opacity: 1, transform: 'translateX(0)' },
              '20%': { opacity: 0.7, transform: 'translateX(-4px) skewX(-2deg)' },
              '40%': { opacity: 0.9, transform: 'translateX(3px) skewX(1deg)' },
              '60%': { opacity: 0.4, transform: 'translateX(-2px) skewX(-1deg)' },
              '80%': { opacity: 0.15, transform: 'translateX(1px)' },
              '100%': { opacity: 0, transform: 'translateX(0)' },
            },
          }}
        >
          <Box
            border="2px solid"
            borderColor="#808080 #dfdfdf #dfdfdf #808080"
            bg="#c0c0c0"
            px={6}
            py={4}
            textAlign="center"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            boxShadow="inset 1px 1px 0 #fff, inset -1px -1px 0 #808080, 2px 2px 8px rgba(0,0,0,0.3)"
            maxW="280px"
          >
            <Box
              bg="#000080"
              color="white"
              fontWeight="bold"
              fontSize="xs"
              px={2}
              py={1}
              mb={3}
              mx={-6}
              mt={-4}
            >
              ⚠ system32.exe
            </Box>
            <Box fontSize="sm" color="#1f2430" mb={2} fontWeight="bold">
              🔒 SYSTEM LOCKED
            </Box>
            <Box fontSize="xs" color="#4a4a4a">
              Place a Boilerplate Core to initialize the code framework.
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CodeEditorMonacoArea;
