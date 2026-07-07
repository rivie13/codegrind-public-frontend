import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Image,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import getAssetUrl from '../../utils/assets/assetUrl';
import { getAvatarWidth } from './avatarSizing';
import { resolveAvatarAsset, getAvatarCandidates } from '../../utils/city/avatarUtils';
import {
  CITY_SCENE_ART_SIZE,
  projectScenePositionToStagePercent,
  projectSceneZoneToStageBounds,
} from './sceneProjection';

const CITY_DESKTOP_TOP_BAR_HEIGHT = '50px';
const CITY_DESKTOP_OVERLAY_TOP = `calc(${CITY_DESKTOP_TOP_BAR_HEIGHT} + 24px)`;

const SceneBackdrop = memo(function SceneBackdrop({ scene }) {
  const candidates = useMemo(() => {
    if (!scene?.art?.assetPath) return [];

    const primarySrc = getAssetUrl(scene.art.assetPath);
    const fallbackSrc = scene.art.fallbackSrc;
    if (!fallbackSrc || fallbackSrc === primarySrc) {
      return [primarySrc];
    }

    return [primarySrc, fallbackSrc];
  }, [scene?.art?.assetPath, scene?.art?.fallbackSrc]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidatesKey = candidates.join('|');

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidatesKey]);

  if (candidates.length === 0) return null;

  const src = candidates[candidateIndex] || candidates[0];

  return (
    <Image
      src={src}
      alt={scene?.art?.alt || `${scene?.title || 'City scene'} background`}
      position="absolute"
      inset={0}
      w="100%"
      h="100%"
      objectFit="cover"
      onError={() => {
        setCandidateIndex((current) => {
          if (current >= candidates.length - 1) return current;
          return current + 1;
        });
      }}
    />
  );
});

const toCssBounds = (zone, stageSize) => {
  if (!zone) return null;

  return projectSceneZoneToStageBounds(zone, stageSize, CITY_SCENE_ART_SIZE);
};

const AvatarOverlay = ({ scene, stageSize, isMobileViewport = false }) => {
  const avatarState = scene?.avatar?.state || 'idle';
  const avatarDirection = scene?.avatar?.direction || 'south';
  const avatarAsset = resolveAvatarAsset(avatarState, avatarDirection);
  const candidates = useMemo(() => getAvatarCandidates(avatarAsset), [avatarAsset]);
  const candidatesKey = candidates.join('|');
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidatesKey]);

  if (!avatarAsset || candidates.length === 0) return null;

  const src = candidates[candidateIndex] || candidates[0];

  const avatarScale = scene?.avatar?.scale || 1;
  const avatarMobileScaleBoost = scene?.avatar?.mobileScaleBoost || 1;
  const avatarX = scene?.avatar?.x ?? scene?.spawn?.x ?? 18;
  const avatarY = scene?.avatar?.y ?? scene?.spawn?.y ?? 76;
  const projectedPosition = projectScenePositionToStagePercent(
    { x: avatarX, y: avatarY },
    stageSize,
    CITY_SCENE_ART_SIZE
  );

  return (
    <Image
      key={`${avatarState}:${avatarDirection}:${src}`}
      src={src}
      alt={avatarAsset.alt}
      data-avatar-x={avatarX}
      data-avatar-y={avatarY}
      position="absolute"
      left={`${projectedPosition?.x ?? avatarX}%`}
      top={`${projectedPosition?.y ?? avatarY}%`}
      transform="translate(-50%, -100%)"
      w={getAvatarWidth(avatarScale, stageSize, {
        isMobileViewport,
        mobileBoost: avatarMobileScaleBoost,
      })}
      imageRendering="pixelated"
      filter="drop-shadow(0 18px 28px rgba(0, 0, 0, 0.68))"
      zIndex={1}
      transition={avatarState === 'walk' ? 'none' : 'left 90ms linear, top 90ms linear'}
      onError={() => {
        setCandidateIndex((current) => {
          if (current >= candidates.length - 1) return current;
          return current + 1;
        });
      }}
      pointerEvents="none"
      style={{ willChange: 'left, top, transform' }}
      draggable={false}
    />
  );
};

const MOVEMENT_BUTTON_LAYOUT = [
  { id: 'up', label: '^', direction: 'arrowup', column: 2, row: 1 },
  { id: 'left', label: '<', direction: 'arrowleft', column: 1, row: 2 },
  { id: 'right', label: '>', direction: 'arrowright', column: 3, row: 2 },
  { id: 'down', label: 'v', direction: 'arrowdown', column: 2, row: 3 },
];

const CityMusicPanel = ({
  currentTrack,
  availableTracks,
  selectedTrackId,
  musicEnabled,
  musicVolume,
  onToggleMusic,
  onVolumeChange,
  onTrackSelect,
}) => (
  <VStack align="stretch" spacing={3}>
    <Box>
      <Text
        color="#9cefff"
        fontSize="xs"
        fontFamily="monospace"
        letterSpacing="0.14em"
        textTransform="uppercase"
      >
        City Audio
      </Text>
      <Text color="white" mt={1} fontSize="sm" fontWeight="semibold">
        {currentTrack?.title || 'No track selected'}
      </Text>
      <Text color="gray.400" fontSize="xs">
        {currentTrack?.artist || 'Choose a song or re-enable music to resume playback.'}
      </Text>
    </Box>
    <FormControl display="flex" alignItems="center" justifyContent="space-between">
      <FormLabel mb="0" color="gray.200" fontSize="sm">
        Music Enabled
      </FormLabel>
      <Switch isChecked={musicEnabled} onChange={onToggleMusic} colorScheme="cyan" />
    </FormControl>
    <FormControl isDisabled={!musicEnabled}>
      <FormLabel mb={2} color="gray.200" fontSize="sm">
        Volume
      </FormLabel>
      <Slider min={0} max={1} step={0.01} value={musicVolume} onChange={onVolumeChange}>
        <SliderTrack bg="rgba(255,255,255,0.12)">
          <SliderFilledTrack bg="rgba(125, 249, 255, 0.78)" />
        </SliderTrack>
        <SliderThumb boxSize={5} bg="rgba(125, 249, 255, 0.92)">
          <Text fontSize="10px" color="#041018" fontWeight="bold">
            {Math.round(musicVolume * 100)}
          </Text>
        </SliderThumb>
      </Slider>
    </FormControl>
    <FormControl>
      <FormLabel mb={2} color="gray.200" fontSize="sm">
        Song
      </FormLabel>
      <Box
        as="select"
        value={selectedTrackId}
        onChange={(event) => onTrackSelect(event.target.value)}
        bg="rgba(4, 10, 18, 0.9)"
        borderColor="rgba(125, 249, 255, 0.24)"
        borderWidth="1px"
        borderStyle="solid"
        borderRadius="md"
        color="white"
        width="100%"
        px={3}
        py={2}
        _hover={{ borderColor: 'rgba(125, 249, 255, 0.48)' }}
        sx={{
          '& option': {
            background: '#07111b',
            color: 'white',
          },
        }}
      >
        <option value="">Random rotation</option>
        {availableTracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.title}
          </option>
        ))}
      </Box>
    </FormControl>
  </VStack>
);

const CitySettingsPanel = ({
  currentTrack,
  availableTracks,
  selectedTrackId,
  musicEnabled,
  musicVolume,
  onToggleMusic,
  onVolumeChange,
  onTrackSelect,
  controlSide,
  onControlSideChange,
}) => (
  <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
    <Box>
      <Text
        color="#9cefff"
        fontSize="xs"
        fontFamily="monospace"
        letterSpacing="0.14em"
        textTransform="uppercase"
      >
        Settings
      </Text>
      <Text color="gray.400" mt={1} fontSize="xs" lineHeight="1.45">
        Audio and touch-control preferences.
      </Text>
    </Box>
    <CityMusicPanel
      currentTrack={currentTrack}
      availableTracks={availableTracks}
      selectedTrackId={selectedTrackId}
      musicEnabled={musicEnabled}
      musicVolume={musicVolume}
      onToggleMusic={onToggleMusic}
      onVolumeChange={onVolumeChange}
      onTrackSelect={onTrackSelect}
    />
    {onControlSideChange ? (
      <Box borderTop="1px solid rgba(125, 249, 255, 0.16)" pt={3}>
        <Text color="white" fontSize="sm" fontWeight="semibold">
          Touch Controls
        </Text>
        <Text color="gray.400" mt={1} mb={3} fontSize="xs">
          Choose which side shows the movement pad.
        </Text>
        <HStack spacing={3} flexWrap="wrap" align="stretch">
          <Button
            size="sm"
            aria-pressed={controlSide === 'left'}
            flex="1 1 132px"
            minW="132px"
            bg={controlSide === 'left' ? 'rgba(125, 249, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)'}
            color="white"
            border="1px solid rgba(125, 249, 255, 0.24)"
            _hover={{ bg: 'rgba(125, 249, 255, 0.28)' }}
            onClick={() => onControlSideChange('left')}
          >
            Left side
          </Button>
          <Button
            size="sm"
            aria-pressed={controlSide === 'right'}
            flex="1 1 132px"
            minW="132px"
            bg={controlSide === 'right' ? 'rgba(125, 249, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)'}
            color="white"
            border="1px solid rgba(125, 249, 255, 0.24)"
            _hover={{ bg: 'rgba(125, 249, 255, 0.28)' }}
            onClick={() => onControlSideChange('right')}
          >
            Right side
          </Button>
        </HStack>
      </Box>
    ) : null}
  </VStack>
);

const CityMovementPad = ({ movementControls }) => {
  if (!movementControls?.isEnabled) return null;

  return (
    <Box
      data-city-ui
      data-testid="city-movement-pad"
      position="absolute"
      bottom="calc(92px + env(safe-area-inset-bottom))"
      left={movementControls.side === 'left' ? 4 : 'auto'}
      right={movementControls.side === 'right' ? 4 : 'auto'}
      zIndex={5}
      display="grid"
      gridTemplateColumns="repeat(3, 48px)"
      gridTemplateRows="repeat(3, 48px)"
      gap={2}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {MOVEMENT_BUTTON_LAYOUT.map((button) => (
        <Button
          key={button.id}
          data-testid={`city-move-${button.id}`}
          gridColumn={button.column}
          gridRow={button.row}
          minW="48px"
          h="48px"
          p={0}
          borderRadius="16px"
          bg={
            movementControls.activeDirections?.[button.direction]
              ? 'rgba(125, 249, 255, 0.28)'
              : 'rgba(4, 10, 18, 0.86)'
          }
          color="white"
          border="1px solid rgba(125, 249, 255, 0.28)"
          boxShadow="0 12px 24px rgba(0, 0, 0, 0.28)"
          backdropFilter="blur(10px)"
          _hover={{ bg: 'rgba(125, 249, 255, 0.22)' }}
          _active={{ bg: 'rgba(125, 249, 255, 0.3)' }}
          onPointerDown={(event) => {
            event.stopPropagation();
            movementControls.onDirectionStart(button.direction);
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
            movementControls.onDirectionEnd(button.direction);
          }}
          onPointerLeave={() => movementControls.onDirectionEnd(button.direction)}
          onPointerCancel={() => movementControls.onDirectionEnd(button.direction)}
        >
          {button.label}
        </Button>
      ))}
    </Box>
  );
};

export default function CityScene({
  scene,
  avatar,
  isMobileViewport = false,
  activeInteraction,
  movementHelpText,
  interactionHelpText,
  musicDock,
  movementControls,
  terminalMenu,
  showControlsHint,
  showTouchInteractButton,
  onInteract,
  onCloseTerminalMenu,
  onSelectTerminalMenuOption,
  onStagePointerDown,
}) {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState(() => {
    if (typeof window === 'undefined') return null;

    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;

    if (width <= 0 || height <= 0) {
      return null;
    }

    return { width, height };
  });

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const nextWidth = rect.width || window.innerWidth || 0;
      const nextHeight = rect.height || window.innerHeight || 0;

      setStageSize((current) => {
        if (current?.width === nextWidth && current?.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    measure();

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => measure());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!scene) return null;

  const displayAvatar = avatar || scene.avatar;
  const activeGlowBounds = toCssBounds(
    activeInteraction?.highlightZone || activeInteraction?.proximityZone,
    stageSize
  );
  const useMobileUiSizing = Boolean(isMobileViewport);
  const cityUiLayout = useMobileUiSizing ? 'mobile' : 'desktop';
  const isMobileSettingsOpen = Boolean(musicDock?.isMobile && musicDock?.isOpen);
  const shouldRenderControlsBar =
    showControlsHint || showTouchInteractButton || Boolean(musicDock?.isMobile);

  return (
    <Box
      data-testid="city-stage"
      ref={stageRef}
      position="relative"
      overflow="hidden"
      h="100dvh"
      minH="100dvh"
      bg={scene.palette?.background || 'rgba(8, 18, 30, 0.92)'}
      onPointerDown={onStagePointerDown}
      cursor="crosshair"
      style={{ touchAction: 'manipulation' }}
    >
      <SceneBackdrop scene={scene} />
      {activeGlowBounds ? (
        <Box
          data-testid="city-interaction-glow"
          position="absolute"
          zIndex={2}
          pointerEvents="none"
          left={activeGlowBounds.left}
          top={activeGlowBounds.top}
          width={activeGlowBounds.width}
          height={activeGlowBounds.height}
          borderRadius="22px"
          border={`1px solid ${activeInteraction?.accent || 'rgba(125, 249, 255, 0.75)'}`}
          boxShadow={`0 0 18px ${activeInteraction?.accent || 'rgba(125, 249, 255, 0.7)'}, inset 0 0 18px rgba(255, 255, 255, 0.12)`}
          bg={`linear-gradient(180deg, ${activeInteraction?.accent || 'rgba(125, 249, 255, 0.16)'}22, transparent)`}
        />
      ) : null}
      <AvatarOverlay
        scene={{ ...scene, avatar: displayAvatar }}
        stageSize={stageSize}
        isMobileViewport={isMobileViewport}
      />
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, rgba(4, 7, 13, 0.12) 0%, rgba(4, 7, 13, 0.05) 35%, rgba(4, 7, 13, 0.24) 72%, rgba(4, 7, 13, 0.48) 100%)"
        pointerEvents="none"
      />
      {activeInteraction ? (
        <Box
          data-city-ui
          data-testid="city-interaction-hint"
          data-layout={cityUiLayout}
          position="absolute"
          zIndex={4}
          left="50%"
          bottom={useMobileUiSizing ? '88px' : '128px'}
          transform="translateX(-50%)"
          px={useMobileUiSizing ? 3 : 4}
          py={useMobileUiSizing ? 1.5 : 2.5}
          borderRadius={useMobileUiSizing ? '20px' : 'full'}
          bg="rgba(4, 10, 18, 0.86)"
          border={`1px solid ${activeInteraction.accent || 'rgba(125, 249, 255, 0.7)'}`}
          boxShadow={`0 0 24px ${activeInteraction.accent || 'rgba(125, 249, 255, 0.42)'}`}
          maxW={useMobileUiSizing ? 'min(72vw, 360px)' : 'min(88vw, 540px)'}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Text
            color="white"
            fontSize={useMobileUiSizing ? 'xs' : 'md'}
            textAlign="center"
            lineHeight={useMobileUiSizing ? 1.35 : 'short'}
            fontWeight={useMobileUiSizing ? 'medium' : 'semibold'}
          >
            {interactionHelpText}
          </Text>
        </Box>
      ) : null}
      <CityMovementPad movementControls={movementControls} />
      {terminalMenu ? (
        <Box
          data-city-ui
          data-city-terminal-menu
          position="absolute"
          zIndex={5}
          left="50%"
          bottom={useMobileUiSizing ? '132px' : '144px'}
          transform="translateX(-50%)"
          w={useMobileUiSizing ? 'min(92vw, 420px)' : 'min(92vw, 520px)'}
          p={useMobileUiSizing ? 3 : 4}
          borderRadius={useMobileUiSizing ? '20px' : '24px'}
          bg="rgba(4, 10, 18, 0.92)"
          border="1px solid rgba(76, 255, 232, 0.34)"
          boxShadow="0 22px 42px rgba(0, 0, 0, 0.38), 0 0 24px rgba(76, 255, 232, 0.2)"
          backdropFilter="blur(16px)"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Text
            color="#90fff6"
            fontSize="xs"
            fontFamily="monospace"
            letterSpacing="0.18em"
            textTransform="uppercase"
          >
            Terminal
          </Text>
          <Text
            color="white"
            mt={2}
            mb={4}
            fontSize={useMobileUiSizing ? 'md' : 'lg'}
            fontWeight="semibold"
          >
            {terminalMenu.title}
          </Text>
          <SimpleGrid columns={useMobileUiSizing ? 2 : 4} spacing={useMobileUiSizing ? 2 : 3}>
            {terminalMenu.options.map((option) => (
              <Button
                key={option.id}
                size="sm"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onSelectTerminalMenuOption(option.href)}
                bg="rgba(76, 255, 232, 0.12)"
                color="white"
                border="1px solid rgba(76, 255, 232, 0.2)"
                _hover={{ bg: 'rgba(76, 255, 232, 0.2)' }}
              >
                {option.label}
              </Button>
            ))}
          </SimpleGrid>
          <Button
            mt={4}
            size="sm"
            variant="ghost"
            color="gray.300"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onCloseTerminalMenu}
          >
            Close terminal
          </Button>
        </Box>
      ) : null}
      {musicDock && !musicDock.isMobile ? (
        <Box
          data-testid="city-music-desktop-overlay"
          position="absolute"
          top={CITY_DESKTOP_OVERLAY_TOP}
          right={{ base: 4, md: 6 }}
          zIndex={5}
          display="flex"
          flexDirection="column"
          alignItems="flex-end"
          gap={3}
        >
          <Button
            data-city-ui
            data-testid="city-music-desktop-toggle"
            size="sm"
            bg="rgba(4, 10, 18, 0.78)"
            color="white"
            border="1px solid rgba(125, 249, 255, 0.28)"
            boxShadow="0 10px 28px rgba(0, 0, 0, 0.28)"
            backdropFilter="blur(12px)"
            _hover={{ bg: 'rgba(4, 10, 18, 0.92)' }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              musicDock.onToggleOpen();
            }}
          >
            {musicDock.isOpen ? 'Hide Settings' : 'Settings'}
          </Button>
          {musicDock.isOpen ? (
            <Box
              data-city-ui
              data-testid="city-music-desktop-dock"
              w="min(92vw, 320px)"
              p={4}
              borderRadius="24px"
              bg="rgba(4, 10, 18, 0.9)"
              border="1px solid rgba(125, 249, 255, 0.24)"
              boxShadow="0 22px 42px rgba(0, 0, 0, 0.38), 0 0 24px rgba(125, 249, 255, 0.18)"
              backdropFilter="blur(16px)"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <CitySettingsPanel
                currentTrack={musicDock.currentTrack}
                availableTracks={musicDock.availableTracks}
                selectedTrackId={musicDock.selectedTrackId}
                musicEnabled={musicDock.musicEnabled}
                musicVolume={musicDock.musicVolume}
                onToggleMusic={musicDock.onToggleMusic}
                onVolumeChange={musicDock.onVolumeChange}
                onTrackSelect={musicDock.onTrackSelect}
                controlSide={musicDock.controlSide}
                onControlSideChange={musicDock.onControlSideChange}
              />
            </Box>
          ) : null}
        </Box>
      ) : null}
      {shouldRenderControlsBar ? (
        <Box
          data-city-ui
          data-testid="city-controls-bar"
          data-layout={cityUiLayout}
          position="absolute"
          left={0}
          right={0}
          bottom={0}
          zIndex={isMobileSettingsOpen ? 8 : 4}
          px={useMobileUiSizing ? 4 : 6}
          pt={showControlsHint ? 3 : 2}
          pb="calc(12px + env(safe-area-inset-bottom))"
          bg="linear-gradient(180deg, rgba(4, 7, 13, 0) 0%, rgba(4, 7, 13, 0.76) 36%, rgba(4, 7, 13, 0.96) 100%)"
          borderTop={showControlsHint ? '1px solid rgba(125, 249, 255, 0.16)' : undefined}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {musicDock?.isMobile && musicDock.isOpen ? (
            <Box
              data-testid="city-music-mobile-dock"
              position="absolute"
              left="50%"
              bottom="calc(100% + 8px)"
              transform="translateX(-50%)"
              zIndex={1}
              w="min(calc(100vw - 16px), 440px)"
              maxW="calc(100vw - 16px)"
              maxH="min(calc(100dvh - 140px - env(safe-area-inset-bottom)), 540px)"
              overflowY="auto"
              overscrollBehavior="contain"
              px={useMobileUiSizing ? 3 : 4}
              py={useMobileUiSizing ? 3 : 4}
              borderRadius={useMobileUiSizing ? '20px' : '24px'}
              bg="rgba(4, 10, 18, 0.94)"
              border="1px solid rgba(125, 249, 255, 0.24)"
              boxShadow="0 22px 42px rgba(0, 0, 0, 0.38), 0 0 24px rgba(125, 249, 255, 0.18)"
              backdropFilter="blur(16px)"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <CitySettingsPanel
                currentTrack={musicDock.currentTrack}
                availableTracks={musicDock.availableTracks}
                selectedTrackId={musicDock.selectedTrackId}
                musicEnabled={musicDock.musicEnabled}
                musicVolume={musicDock.musicVolume}
                onToggleMusic={musicDock.onToggleMusic}
                onVolumeChange={musicDock.onVolumeChange}
                onTrackSelect={musicDock.onTrackSelect}
                controlSide={musicDock.controlSide}
                onControlSideChange={musicDock.onControlSideChange}
              />
            </Box>
          ) : null}
          {showControlsHint ? (
            <>
              <Text
                color="#9cefff"
                fontSize="xs"
                fontFamily="monospace"
                letterSpacing="0.14em"
                textTransform="uppercase"
              >
                Controls
              </Text>
              <Text color="white" mt={2} fontSize={useMobileUiSizing ? 'sm' : 'md'}>
                {movementHelpText}
              </Text>
              <Text color="gray.300" mt={1} fontSize={useMobileUiSizing ? 'sm' : 'md'}>
                {interactionHelpText}
              </Text>
            </>
          ) : null}
          {showTouchInteractButton || musicDock?.isMobile ? (
            <HStack
              mt={showControlsHint ? (useMobileUiSizing ? 2.5 : 3) : 0}
              spacing={useMobileUiSizing ? 2 : 3}
            >
              {showTouchInteractButton ? (
                <Button
                  size="sm"
                  bg="rgba(255, 176, 77, 0.18)"
                  color="white"
                  border="1px solid rgba(255, 176, 77, 0.34)"
                  _hover={{ bg: 'rgba(255, 176, 77, 0.28)' }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onInteract();
                  }}
                >
                  Interact
                </Button>
              ) : null}
              {musicDock?.isMobile ? (
                <Button
                  data-testid="city-music-mobile-toggle"
                  size="sm"
                  bg="rgba(125, 249, 255, 0.16)"
                  color="white"
                  border="1px solid rgba(125, 249, 255, 0.28)"
                  _hover={{ bg: 'rgba(125, 249, 255, 0.24)' }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    musicDock.onToggleOpen();
                  }}
                >
                  {musicDock.isOpen ? 'Close Settings' : 'Settings'}
                </Button>
              ) : null}
            </HStack>
          ) : null}
        </Box>
      ) : null}
      <VisuallyHidden>
        <Text as="h1">District 01</Text>
        <Text as="h2">{scene.title}</Text>
        <Text>City scene gameplay surface.</Text>
      </VisuallyHidden>
    </Box>
  );
}
