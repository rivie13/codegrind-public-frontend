import { shouldPlayApartmentIntroSequence } from '../../utils/navigation/apartmentEntryState';
import {
  APARTMENT_PREVIEW_ADVANCE_EVENT,
  APARTMENT_PREVIEW_BRIDGE_KEY,
  APARTMENT_PREVIEW_CLOSE_COLLECTIBLE_EVENT,
  APARTMENT_PREVIEW_CLOSE_WINDOW_VIEW_EVENT,
  APARTMENT_PREVIEW_COLLECTIBLE_COLLECT_EVENT,
  APARTMENT_PREVIEW_ERROR_EVENT,
  APARTMENT_PREVIEW_READY_EVENT,
  APARTMENT_PREVIEW_SET_WAYPOINT_EVENT,
} from './previewBootEvents';
import { getDistrict01PreviewMap } from './district01PreviewMaps';
import { getAutoLayerTilesetAssets, loadExternalTiledMap } from './loadExternalTiledMap';
import { attachApartmentPreviewSceneActorMethods } from './apartmentPreviewScene.actors';
import { attachApartmentPreviewSceneAssetMethods } from './apartmentPreviewScene.assets';
import { MIN_CAMERA_ZOOM, TILESET_TEXTURE_PREFIX } from './apartmentPreviewScene.constants';
import { attachApartmentPreviewSceneInteractionMethods } from './apartmentPreviewScene.interactions';
import { attachApartmentPreviewSceneOverlayMethods } from './apartmentPreviewScene.overlays';

const RESTART_SENSITIVE_SCENE_REFS = [
  'player',
  'loadingOverlayBackdrop',
  'loadingOverlayGrid',
  'loadingOverlayShadow',
  'loadingOverlayWindow',
  'loadingOverlayTitleBar',
  'loadingOverlayKicker',
  'loadingOverlayLocation',
  'loadingOverlayDetail',
  'loadingOverlayStatusDot',
  'loadingOverlayStatusLabel',
  'loadingOverlayProgressTrack',
  'loadingOverlayProgressFill',
  'loadingOverlayFooter',
  'introBackdropMatte',
  'introCityBackdrop',
  'introCityTint',
  'introLetterboxTop',
  'introLetterboxBottom',
  'windowViewHeaderShadow',
  'windowViewHeaderBackground',
  'windowViewHeaderTitleBar',
  'windowViewHeaderTitle',
  'windowViewHeaderBody',
  'windowViewBackButtonShadow',
  'windowViewBackButtonBackground',
  'windowViewBackButtonText',
  'windowViewBackButtonHitArea',
  'terminalCueGlow',
  'terminalCueBellIcon',
  'terminalCueTitle',
  'terminalCueBody',
  'terminalCueDeviceIcon',
  'terminalCueBadge',
  'terminalCueBadgeLabel',
  'terminalCueContainer',
  'waypointGuideLine',
  'waypointGuideShadow',
  'waypointGuideCore',
  'waypointGuideArrow',
  'waypointMarkerPulse',
  'waypointMarkerCore',
  'waypointMarkerLabelBackground',
  'waypointMarkerLabelText',
  'waypointMarker',
];

export const createApartmentPreviewScene = (Phaser) => {
  class ApartmentPreviewScene extends Phaser.Scene {
    constructor() {
      super('ApartmentPreviewScene');
      this.yieldToMain = async () => {
        // Background preboot mode (during character/demo selection):
        // Yield with setTimeout(0) so the UI stays responsive during asset loads.
        if (this.game?.config?.isBackgroundPreboot) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          return;
        }
        // City route mode: loading screen handles the UX, no need to yield.
        // Browser rAF throttling in incognito/production was causing 8.8s+ of
        // artificial delays — full sync speed is the correct behavior here.
        return;
      };
    }

    init(sceneData = {}) {
      this._manualTextureInfoCache = new Map();
      this.createdCanvasTextures = new Set();
      this.previewMapConfig = getDistrict01PreviewMap(sceneData.locationId);
      this.previewLocationId = this.previewMapConfig.id;
      this.previewSpawnTarget = sceneData.spawn || this.previewMapConfig.defaultSpawn;
      this.skipIntroSequence = Boolean(sceneData.skipIntroSequence);
      RESTART_SENSITIVE_SCENE_REFS.forEach((key) => {
        this[key] = null;
      });
      this.activePrompt = '';
      this.activeCollectibleModal = null;
      this.activeSceneDialogue = null;
      this.activeWaypointPointId = null;
      this.activeInteractionZone = null;
      this.dialogueDisplayEntries = [];
      this.collisionDebugGraphics = null;
      this.controlsLocked = true;
      this.duskCityFrames = [];
      this.facing = 'down';
      this.fullscreenOverlayCamera = null;
      this.gameplayZoom = MIN_CAMERA_ZOOM;
      this.hasPendingIntroSequenceStart = false;
      this.hasPendingWindowViewOpen = false;
      this.hasQueuedIntroAdvance = false;
      this.interactionZoneEntries = [];
      this.introAdvanceAvailableAt = 0;
      this.introBeatIndex = -1;
      this.introBeatTimer = null;
      this.introCityAnimationTimer = null;
      this.isUsingUncroppedCityBackdrop = false;
      this.isIntroSequenceActive = false;
      this.isIntroSequenceComplete = false;
      this.isSceneReady = false;
      this.isWindowViewActive = false;
      const touchControlsState = this.getPreviewBridge()?.touchControlsState || null;
      this.lastTouchInteractAt = touchControlsState
        ? Number(touchControlsState.interactRequestedAt) || 0
        : 0;
      this.oversizedTilesetImages = new Map();
      this.previewHudStateSerialized = '';
      this.previewCollectibleModalSerialized = '';
      this.previewInteractionStateSerialized = '';
      this.previewWorldStateSerialized = '';
      this.playerDoorApproachState = null;
      this.nextPreviewWorldStateSyncAt = 0;
      this.rawCollisionObjects = [];
      this.resolvedCollisionRectangles = [];
      this.sceneHasError = false;
      this.collectibleDisplayEntries = [];
      this.sceneActorEntries = [];
      this.sceneDoorEntries = [];
      this.windowViewOverlayNodes = [];
      this.loadingOverlayNodes = [];
      this.loadingOverlayState = null;
      this.lowFpsStartTime = null;
      this.lowFpsLogged = false;
      this.terminalFoundLogged = false;
      this.handleHudAdvanceRequest = () => {
        this.handlePreviewHudAdvance?.();
      };
      this.handleWindowViewCloseRequest = () => {
        this.hideWindowView();
      };
      this.handleCollectibleModalCloseRequest = () => {
        this.closeCollectibleModal?.();
      };
      this.handleCollectibleModalCollectRequest = (event) => {
        this.handlePreviewCollectibleCollectRequest?.(event?.detail ?? null);
      };
      this.handleWaypointRequest = (event) => {
        this.handlePreviewWaypointRequest(event?.detail ?? null);
      };
      this.terminalZoneObject = null;
      this.windowZoneObject = null;
      this.exitZoneObject = null;
    }

    create() {
      this.cameras.main.setBackgroundColor('#070b12');

      if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.__CODEGRIND_APARTMENT_PREVIEW_SCENE__ = this;
        this.events.once('shutdown', () => {
          if (window.__CODEGRIND_APARTMENT_PREVIEW_SCENE__ === this) {
            delete window.__CODEGRIND_APARTMENT_PREVIEW_SCENE__;
          }
        });
      }

      if (typeof window !== 'undefined') {
        window.addEventListener(APARTMENT_PREVIEW_ADVANCE_EVENT, this.handleHudAdvanceRequest);
        window.addEventListener(
          APARTMENT_PREVIEW_CLOSE_COLLECTIBLE_EVENT,
          this.handleCollectibleModalCloseRequest
        );
        window.addEventListener(
          APARTMENT_PREVIEW_COLLECTIBLE_COLLECT_EVENT,
          this.handleCollectibleModalCollectRequest
        );
        window.addEventListener(
          APARTMENT_PREVIEW_CLOSE_WINDOW_VIEW_EVENT,
          this.handleWindowViewCloseRequest
        );
        window.addEventListener(APARTMENT_PREVIEW_SET_WAYPOINT_EVENT, this.handleWaypointRequest);
        this.events.once('shutdown', () => {
          window.removeEventListener(APARTMENT_PREVIEW_ADVANCE_EVENT, this.handleHudAdvanceRequest);
          window.removeEventListener(
            APARTMENT_PREVIEW_CLOSE_COLLECTIBLE_EVENT,
            this.handleCollectibleModalCloseRequest
          );
          window.removeEventListener(
            APARTMENT_PREVIEW_COLLECTIBLE_COLLECT_EVENT,
            this.handleCollectibleModalCollectRequest
          );
          window.removeEventListener(
            APARTMENT_PREVIEW_CLOSE_WINDOW_VIEW_EVENT,
            this.handleWindowViewCloseRequest
          );
          window.removeEventListener(
            APARTMENT_PREVIEW_SET_WAYPOINT_EVENT,
            this.handleWaypointRequest
          );
        });
      }

      this.events.once('shutdown', () => {
        this.setPreviewCollectibleModalState(null);
        this.setPreviewHudState(null);
        this.setPreviewInteractionState(null);
        this.setPreviewWorldState(null);
      });

      this.createLoadingOverlay();
      this.createInteractionLabel();
      this.updateHudLayout();

      void this.bootstrap();
    }

    async bootstrap() {
      const bootstrapOverallLabel = '[ApartmentPreviewScene] ⏱ Total bootstrap';
      console.time(bootstrapOverallLabel);
      try {
        const loadingTargetLabel = this.previewMapConfig?.label || 'district window';

        this.setLoadingOverlayState({
          detail: 'Linking the next district window and authored markers.',
          footer: 'District handoff is preparing the route.',
          progress: 0.08,
          statusLabel: 'Route handoff',
          title: `Opening ${loadingTargetLabel}`,
        });

        const mapLoadLabel = '[ApartmentPreviewScene] ⏱ Step 1: Map JSON load';
        console.time(mapLoadLabel);
        const mapData = await loadExternalTiledMap(this.previewMapConfig.mapAssetPath);
        this.mapData = mapData;
        console.timeEnd(mapLoadLabel);

        await this.yieldToMain();

        this.setLoadingOverlayState({
          detail: 'Streaming tile sheets, prop art, and backdrop textures.',
          footer: 'Port Meridian signage and scene props are coming online.',
          progress: 0.28,
          statusLabel: 'Asset stream',
          title: `Loading ${loadingTargetLabel}`,
        });

        const assetLoadLabel = '[ApartmentPreviewScene] ⏱ Step 2: Asset/texture load';
        console.time(assetLoadLabel);
        await this.loadAssets(mapData);
        console.timeEnd(assetLoadLabel);

        await this.yieldToMain();

        this.cache.tilemap.remove(this.previewMapConfig.mapCacheKey);
        this.cache.tilemap.add(this.previewMapConfig.mapCacheKey, {
          data: mapData,
          format: Phaser.Tilemaps.Formats.TILED_JSON,
        });

        this.tilemap = this.make.tilemap({ key: this.previewMapConfig.mapCacheKey });
        const tilesets = getAutoLayerTilesetAssets(mapData)
          .map((tileset) =>
            this.tilemap.addTilesetImage(tileset.key, `${TILESET_TEXTURE_PREFIX}${tileset.key}`)
          )
          .filter(Boolean);

        await this.yieldToMain();

        this.setLoadingOverlayState({
          detail: 'Compositing layered tiles, manual props, and the skyline matte.',
          footer: 'The district shell is being rebuilt from the Tiled map.',
          progress: 0.56,
          statusLabel: 'World compose',
          title: `Compositing ${loadingTargetLabel}`,
        });

        const compositeLabel = '[ApartmentPreviewScene] ⏱ Step 3: Layer composite + manual tiles';
        console.time(compositeLabel);
        await this.renderLayers(mapData, tilesets);
        await this.yieldToMain();
        await this.renderManualTiles(mapData);
        await this.yieldToMain();
        this.duskCityFrames = await this.collectDuskCityFrames(mapData);
        console.timeEnd(compositeLabel);

        await this.yieldToMain();

        this.setLoadingOverlayState({
          detail: 'Wiring player movement, collisions, prompts, and interact zones.',
          footer: 'Controls stay locked until the slice is stable.',
          progress: 0.8,
          statusLabel: 'Systems sync',
          title: `Booting ${loadingTargetLabel}`,
        });

        const systemsLabel =
          '[ApartmentPreviewScene] ⏱ Step 4: Systems wiring (player/collision/zones)';
        console.time(systemsLabel);
        this.createPlayer();
        await this.yieldToMain();
        await this.createCollisionGeometry();
        await this.yieldToMain();
        this.createInteractionZones();
        await this.yieldToMain();
        this.createSceneActors();
        await this.yieldToMain();
        this.createSceneDoors?.();
        await this.yieldToMain();
        this.createWaypointMarker();
        await this.yieldToMain();
        this.createTerminalCue();
        await this.yieldToMain();
        this.configureInput();
        await this.yieldToMain();
        this.createIntroOverlay();
        await this.yieldToMain();
        this.createWindowViewOverlay();
        console.timeEnd(systemsLabel);

        this.setLoadingOverlayState({
          detail: 'Syncing camera framing and final transition chrome.',
          footer: 'Control unlocks as soon as the district window settles.',
          progress: 0.97,
          statusLabel: 'Viewport lock',
          title: `Opening ${loadingTargetLabel}`,
        });

        const viewportLabel = '[ApartmentPreviewScene] ⏱ Step 5: Viewport + camera lock';
        console.time(viewportLabel);
        this.configureCamera();
        this.configureFullscreenOverlayCamera();
        console.timeEnd(viewportLabel);

        if (this.createdCanvasTextures && this.createdCanvasTextures.size > 0) {
          for (const canvas of this.createdCanvasTextures) {
            canvas.refresh();
          }
          this.createdCanvasTextures.clear();
        }

        this.hideLoadingOverlay();
        this.setPrompt('');
        this.isSceneReady = true;
        console.timeEnd(bootstrapOverallLabel);

        if (this.game?.config?.isBackgroundPreboot) {
          console.log(
            '[ApartmentPreviewScene] Background preboot complete. Scene is idle and waiting.'
          );
          if (typeof this.game.config.onBackgroundPrebootComplete === 'function') {
            this.game.config.onBackgroundPrebootComplete(this.game);
          }
          return;
        }

        this.game?.config?.onPreviewSceneReady?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
        }
        this.syncPreviewWorldState(true);

        const bridge = this.getPreviewBridge();
        if (typeof bridge.trackFunnelEvent === 'function') {
          bridge.trackFunnelEvent('engineZoneEntered', { zoneId: this.previewLocationId });
        }

        if (this.shouldPlayIntroSequence()) {
          this.startIntroSequence();
        } else {
          this.enterPlayablePreviewState();
        }
      } catch (error) {
        const failedTargetLabel = this.previewMapConfig?.label || 'preview scene';
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown Phaser bootstrap error';

        this.sceneHasError = true;
        this.game?.config?.onPreviewSceneError?.(errorMessage);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(APARTMENT_PREVIEW_ERROR_EVENT, {
              detail: {
                message: errorMessage,
              },
            })
          );
        }
        this.setLoadingOverlayState({
          detail: errorMessage,
          footer: 'The district window is staying on hold until the fault clears.',
          isError: true,
          progress: 1,
          statusLabel: 'Transit fault',
          title: `${failedTargetLabel} failed to load`,
        });
        console.timeEnd(bootstrapOverallLabel);
        console.error(error);
      }
    }

    getPreviewBridge() {
      return this.registry?.get(APARTMENT_PREVIEW_BRIDGE_KEY) || {};
    }

    isCityVistaVisualsReady() {
      const readinessResolver = this.getPreviewBridge().isCityVistaVisualsReady;

      if (typeof readinessResolver !== 'function') {
        return true;
      }

      return readinessResolver() !== false;
    }

    flushPendingCityVistaTransitions() {
      if (!this.isSceneReady || !this.isCityVistaVisualsReady()) {
        return;
      }

      if (
        this.hasPendingIntroSequenceStart &&
        !this.isIntroSequenceActive &&
        !this.isIntroSequenceComplete
      ) {
        this.hasPendingIntroSequenceStart = false;
        this.startIntroSequence();
        return;
      }

      if (this.hasPendingWindowViewOpen && !this.isWindowViewActive) {
        this.hasPendingWindowViewOpen = false;
        this.showWindowView();
      }
    }

    shouldPlayIntroSequence() {
      if (!this.previewMapConfig?.supportsIntroSequence || this.skipIntroSequence) {
        return false;
      }

      return shouldPlayApartmentIntroSequence({
        apartmentState: this.getPreviewBridge().apartmentEntryState,
      });
    }

    enterPlayablePreviewState() {
      this.isIntroSequenceActive = false;
      this.isIntroSequenceComplete = true;
      this.isWindowViewActive = false;
      this.controlsLocked = false;
      this.hasPendingIntroSequenceStart = false;
      this.hasPendingWindowViewOpen = false;
      this.hasQueuedIntroAdvance = false;
      this.introAdvanceAvailableAt = 0;
      this.playerDoorApproachState = null;
      this.introBeatTimer?.remove(false);
      this.introBeatTimer = null;
      this.introCityAnimationTimer?.remove(false);
      this.introCityAnimationTimer = null;
      this.activeInteractionZone = null;
      this.player.setVelocity(0, 0);
      this.player.setAlpha(1);
      this.applyIdleFrame();
      this.interactionLabel.setVisible(false);
      this.setPreviewHudState(null);

      // Explicitly clean up and hide all intro overlay targets
      const overlayTargets = [
        this.introBackdropMatte,
        this.introCityBackdrop,
        this.introCityTint,
        this.introLetterboxTop,
        this.introLetterboxBottom,
      ].filter(Boolean);

      overlayTargets.forEach((target) => {
        target.setVisible(false);
        target.setAlpha(0);
      });

      if (this.fullscreenOverlayCamera) {
        this.fullscreenOverlayCamera.setVisible(false);
      }

      if (this.cameras?.main) {
        this.updateViewportLayout();
      }
      this.applyGameplayCameraState();

      const postPathChoiceObjective = this.getPostPathChoiceObjective?.();
      const previewBridge = this.getPreviewBridge?.() || {};
      const isHubState = previewBridge.apartmentEntryState === 'hub';

      if (typeof previewBridge.trackFunnelEvent === 'function') {
        previewBridge.trackFunnelEvent('engineZoneEntered', { zoneId: this.previewLocationId });
      }

      if (isHubState) {
        if (postPathChoiceObjective && previewBridge.postPathChoiceContactAcknowledged !== true) {
          if (!this.terminalCueContainer?.visible) {
            this.activateTerminalCue?.();
          }
        } else {
          this.terminalCueContainer?.setVisible(false).setAlpha(0);
        }
      } else {
        if (!this.terminalCueContainer?.visible) {
          this.activateTerminalCue?.();
        }
      }

      // Auto-draw waypoints to safehouse terminal
      this.activeWaypointPointId =
        typeof this.getDefaultObjectivePointId === 'function'
          ? this.getDefaultObjectivePointId() ||
            (this.previewLocationId === 'apartment' ? 'safehouse-terminal' : null)
          : this.previewLocationId === 'apartment'
            ? 'safehouse-terminal'
            : null;

      this.syncObjectiveHudState();
      this.syncInteractionContext();
      this.syncPreviewWorldState(true);
    }
  }

  attachApartmentPreviewSceneActorMethods(ApartmentPreviewScene, Phaser);
  attachApartmentPreviewSceneAssetMethods(ApartmentPreviewScene);
  attachApartmentPreviewSceneOverlayMethods(ApartmentPreviewScene, Phaser);
  attachApartmentPreviewSceneInteractionMethods(ApartmentPreviewScene, Phaser);

  return ApartmentPreviewScene;
};
