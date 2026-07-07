import { Badge, Box, Button, HStack, VStack } from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import ProfileHeader from '../../../components/profileDashboard/ProfileHeader';
import GameCanvasV2 from '../../../components/towerDefense/ui/board/GameCanvasV2';
import {
  EDITOR_SURFACE_CONFIGS,
  EDITOR_SURFACE_KEYS,
  registerSurfaceThemeForStore,
} from '../../../utils/monaco/editorSurfaceBaselines';
import { ensureMonacoTheme, getMonacoThemeName } from '../../../utils/monaco/cosmeticThemeTools';
import { applyCustomTokenProviders } from '../../../utils/monaco/towerTokenProviders';
import {
  PROFILE_PREVIEW_USER_DATA,
  STORE_TD_PREVIEW_LANGUAGE_ID,
  TD_GAMEPLAY_DEMO_OPTIONS,
} from '../storePage.constants';
import { TD_PREVIEW_KIND } from '../tdGameplayPreview.utils';

const EditorPreview = ({
  backgroundPack,
  editorSurface,
  editorThemeOverrides,
  effectPack,
  monacoOptions,
  previewEditorRef,
  setEditorSurface,
  themePack,
}) => {
  const surfaceConfig = EDITOR_SURFACE_CONFIGS[editorSurface];
  const bgColor = backgroundPack ? backgroundPack.background : surfaceConfig.defaultBackground;
  const bgSize = backgroundPack ? backgroundPack.backgroundSize || '100% 100%' : '100% 100%';
  const bgAnimation = backgroundPack ? backgroundPack.animation || 'none' : 'none';
  const activeThemeName = themePack
    ? getMonacoThemeName(themePack.id)
    : surfaceConfig.storeThemeName;

  return (
    <Box
      border="1px solid var(--cg-window-shadow)"
      bg="var(--cg-window-face)"
      boxShadow="var(--cg-window-inset)"
      p={2}
    >
      <HStack
        spacing={1}
        mb={2}
        overflowX={{ base: 'auto', md: 'visible' }}
        pb={{ base: 1, md: 0 }}
        sx={{
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(103, 232, 249, 0.35)',
            borderRadius: '999px',
          },
        }}
      >
        {EDITOR_SURFACE_KEYS.map((surfaceKey) => (
          <Button
            key={surfaceKey}
            size="xs"
            variant={editorSurface === surfaceKey ? 'solid' : 'outline'}
            colorScheme="cyan"
            onClick={() => setEditorSurface(surfaceKey)}
            flexShrink={0}
          >
            {EDITOR_SURFACE_CONFIGS[surfaceKey].label}
          </Button>
        ))}
      </HStack>
      <Box
        position="relative"
        h={{ base: '380px', lg: '440px' }}
        bg={bgColor}
        backgroundSize={bgSize}
        animation={bgAnimation}
        overflow="hidden"
      >
        {effectPack?.scanline && (
          <Box
            position="absolute"
            inset={0}
            pointerEvents="none"
            opacity={effectPack.scanlineOpacity || 0.1}
            bg="repeating-linear-gradient(180deg, rgba(148,163,184,0.12) 0px, rgba(148,163,184,0.12) 1px, transparent 1px, transparent 4px)"
            _after={{
              content: '""',
              position: 'absolute',
              top: '-100%',
              left: 0,
              right: 0,
              height: '40%',
              background:
                'linear-gradient(180deg, transparent 0%, rgba(125, 211, 252, 0.2) 55%, transparent 100%)',
              animation: 'cosmetic-scanline 4s linear infinite',
            }}
          />
        )}

        <Box
          position="absolute"
          inset={0}
          sx={{
            '.monaco-editor, .monaco-editor .margin, .monaco-editor-background, .monaco-editor .inputarea.ime-input':
              {
                background: 'transparent !important',
              },
            '.monaco-editor .cursor': effectPack?.cursorGlow
              ? {
                  boxShadow: `0 0 8px ${effectPack.cursorGlowColor || '#67E8F9'}`,
                }
              : undefined,
            '.monaco-editor .view-overlays .current-line': effectPack?.linePulse
              ? {
                  backgroundColor: `${effectPack.linePulseColor || 'rgba(56,189,248,0.2)'} !important`,
                }
              : undefined,
          }}
        >
          {effectPack?.overlayGlow && (
            <Box
              position="absolute"
              inset={0}
              pointerEvents="none"
              bg={`radial-gradient(circle at 50% 0%, ${effectPack.overlayGlowColor || 'rgba(56, 189, 248, 0.2)'}, transparent 52%)`}
              zIndex={1}
            />
          )}

          {effectPack?.chromaticShift && (
            <Box
              position="absolute"
              inset={0}
              pointerEvents="none"
              zIndex={2}
              bg="linear-gradient(90deg, rgba(236,72,153,0.07), transparent 35%, transparent 65%, rgba(34,211,238,0.07))"
              mixBlendMode="screen"
            />
          )}

          <Editor
            key={editorSurface}
            height="100%"
            defaultLanguage="python"
            value={surfaceConfig.sampleSnippet}
            options={monacoOptions}
            onMount={(editor, monaco) => {
              previewEditorRef.current = editor;
              if (themePack) {
                ensureMonacoTheme(monaco, themePack, editorThemeOverrides);
                monaco.editor.setTheme(getMonacoThemeName(themePack.id));
              } else {
                registerSurfaceThemeForStore(monaco, editorSurface);
                monaco.editor.setTheme(surfaceConfig.storeThemeName);
              }
              if (surfaceConfig.applyTokenProviders) {
                applyCustomTokenProviders(monaco, editor, {
                  languageId: surfaceConfig.language,
                  targetLanguageId: STORE_TD_PREVIEW_LANGUAGE_ID,
                });
              }
            }}
            theme={activeThemeName}
          />
        </Box>
      </Box>
    </Box>
  );
};

const TdPreview = ({
  damageTextPack,
  deathFxPack,
  enemyPack,
  gameCanvasRef,
  lightningInternalMode,
  pathGradientMode,
  tdAttackFxMode,
  tdBoardTheme,
  tdGameplayAvailableTowerTypes,
  tdGameplayDemoMode,
  tdGeneratedMap,
  tdPreviewKind,
  towerPack,
}) => {
  const isGameplay = tdPreviewKind === TD_PREVIEW_KIND.GAMEPLAY;

  return (
    <Box
      border="1px solid var(--cg-window-shadow)"
      bg="var(--cg-window-face)"
      boxShadow="var(--cg-window-inset)"
      p={2}
      minW={0}
      overflowX="auto"
    >
      <Box h={{ base: '520px', lg: '620px' }} position="relative">
        <GameCanvasV2
          ref={gameCanvasRef}
          generatedMap={tdGeneratedMap}
          cellSize={48}
          showTowerSelector={false}
          difficulty="medium"
          initialCredits={isGameplay ? 5000 : 700}
          initialLives={40}
          totalWaves={10}
          availableTowerTypes={
            isGameplay ? tdGameplayAvailableTowerTypes : ['Function', 'ForLoop', 'Variable']
          }
          disableDynamicResolution
          pathGradientMode={pathGradientMode}
          tdMapTheme={tdBoardTheme}
          lightningInternalMode={towerPack ? lightningInternalMode : null}
          lightningColor={towerPack?.lightningColor || '#FDE047'}
          lightningGlow={towerPack?.lightningGlow || '#FEF08A'}
          towerPack={isGameplay ? null : towerPack}
          enemyPack={isGameplay ? null : enemyPack}
          tdAttackFxMode={isGameplay ? 'marker-burst' : tdAttackFxMode}
          damageTextPack={isGameplay ? null : damageTextPack}
          deathFxPack={isGameplay ? null : deathFxPack}
        />

        {isGameplay && (
          <VStack
            position="absolute"
            right={3}
            top={3}
            spacing={2}
            align="stretch"
            pointerEvents="none"
          >
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-link)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              Gameplay Unlock Preview
            </Badge>
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-accent-green)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              {TD_GAMEPLAY_DEMO_OPTIONS.find((mode) => mode.id === tdGameplayDemoMode)?.name}
            </Badge>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

const ProfilePreview = ({ profileBackgroundPack, profileBadgePack, profileCallingCardPack }) => (
  <Box
    border="1px solid var(--cg-window-shadow)"
    bg="var(--cg-window-face)"
    boxShadow="var(--cg-window-inset)"
    p={3}
  >
    <ProfileHeader
      userData={PROFILE_PREVIEW_USER_DATA}
      onEditProfile={() => {}}
      onManageBilling={null}
      billingLoading={false}
      billingError={null}
      avatarLoading={false}
      avatarError={null}
      isPublicView={false}
      shareUrl="https://codegrind.local/profile/1"
      cosmeticPreview={{
        backgroundId: profileBackgroundPack.id,
        callingCardId: profileCallingCardPack.id,
        badgeId: profileBadgePack.id,
      }}
    />
  </Box>
);

const StorePreviewBySection = ({ activeSectionId, ...previewProps }) => {
  const editorPreview = <EditorPreview {...previewProps} />;
  const tdPreview = <TdPreview {...previewProps} />;
  const profilePreview = <ProfilePreview {...previewProps} />;

  if (activeSectionId === 'editor') return editorPreview;
  if (activeSectionId === 'td') return tdPreview;
  if (activeSectionId === 'profile') return profilePreview;

  return (
    <VStack align="stretch" spacing={4}>
      {editorPreview}
      {tdPreview}
      {profilePreview}
    </VStack>
  );
};

export default StorePreviewBySection;
