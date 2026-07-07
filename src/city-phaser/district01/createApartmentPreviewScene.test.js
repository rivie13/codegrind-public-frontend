import { describe, expect, it, vi } from 'vitest';

import { attachApartmentPreviewSceneOverlayMethods } from './apartmentPreviewScene.overlays';
import { createApartmentPreviewScene } from './createApartmentPreviewScene';

class BaseScene {
  constructor(sceneKey) {
    this.sceneKey = sceneKey;
  }
}

const createDestroyedNode = (extra = {}) => ({
  active: false,
  destroyed: true,
  scene: null,
  setPosition: vi.fn(() => {
    throw new Error('stale node should not be laid out');
  }),
  setSize: vi.fn(() => {
    throw new Error('stale node should not be resized');
  }),
  ...extra,
});

describe('createApartmentPreviewScene', () => {
  it('clears restart-sensitive overlay refs in init', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();

    scene.introBackdropMatte = { stale: true };
    scene.loadingOverlayBackdrop = { stale: true };
    scene.windowViewBackButtonText = { stale: true };
    scene.terminalCueContainer = { stale: true };
    scene.waypointMarker = { stale: true };
    scene.loadingOverlayNodes = [{ stale: true }];
    scene.windowViewOverlayNodes = [{ stale: true }];

    scene.init({ locationId: 'exterior-seed', skipIntroSequence: true });

    expect(scene.introBackdropMatte).toBeNull();
    expect(scene.loadingOverlayBackdrop).toBeNull();
    expect(scene.windowViewBackButtonText).toBeNull();
    expect(scene.terminalCueContainer).toBeNull();
    expect(scene.waypointMarker).toBeNull();
    expect(scene.loadingOverlayNodes).toEqual([]);
    expect(scene.windowViewOverlayNodes).toEqual([]);
  });

  it('activates the terminal cue when a routed path-choice contact lands directly in hub state', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();

    scene.isIntroSequenceActive = false;
    scene.isIntroSequenceComplete = false;
    scene.isWindowViewActive = true;
    scene.controlsLocked = true;
    scene.hasQueuedIntroAdvance = true;
    scene.introAdvanceAvailableAt = 300;
    scene.activeInteractionZone = { stale: true };
    scene.player = {
      setAlpha: vi.fn(),
      setVelocity: vi.fn(),
    };
    scene.applyIdleFrame = vi.fn();
    scene.applyGameplayCameraState = vi.fn();
    scene.interactionLabel = {
      setVisible: vi.fn(),
    };
    scene.setPreviewHudState = vi.fn();
    scene.gameplayZoom = 1.75;
    scene.getPostPathChoiceObjective = vi.fn(() => ({
      title: 'Fixer Signal',
    }));
    scene.activateTerminalCue = vi.fn();
    scene.terminalCueContainer = { visible: false };
    scene.syncObjectiveHudState = vi.fn();
    scene.syncInteractionContext = vi.fn();
    scene.syncPreviewWorldState = vi.fn();
    scene.introBeatTimer = { remove: vi.fn() };
    scene.introCityAnimationTimer = { remove: vi.fn() };

    scene.enterPlayablePreviewState();

    expect(scene.applyGameplayCameraState).toHaveBeenCalledOnce();
    expect(scene.activateTerminalCue).toHaveBeenCalledOnce();
    expect(scene.syncObjectiveHudState).toHaveBeenCalledOnce();
    expect(scene.controlsLocked).toBe(false);
    expect(scene.isIntroSequenceComplete).toBe(true);
  });

  it('routes playable camera setup through the shared gameplay camera helper', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();

    scene.introBeatTimer = { remove: vi.fn() };
    scene.introCityAnimationTimer = { remove: vi.fn() };
    scene.player = {
      setAlpha: vi.fn(),
      setVelocity: vi.fn(),
    };
    scene.applyGameplayCameraState = vi.fn();
    scene.applyIdleFrame = vi.fn();
    scene.getPostPathChoiceObjective = vi.fn(() => null);
    scene.interactionLabel = { setVisible: vi.fn() };
    scene.setPreviewHudState = vi.fn();
    scene.syncInteractionContext = vi.fn();
    scene.syncObjectiveHudState = vi.fn();
    scene.syncPreviewWorldState = vi.fn();

    scene.enterPlayablePreviewState();

    expect(scene.applyGameplayCameraState).toHaveBeenCalledOnce();
  });

  it('queues the intro sequence until shared city-vista visuals are ready', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();
    const createOverlayNode = () => ({
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    });
    let cityVistaReady = false;

    scene.isSceneReady = true;
    scene.hasPendingIntroSequenceStart = false;
    scene.isIntroSequenceActive = false;
    scene.isIntroSequenceComplete = false;
    scene.getPreviewBridge = () => ({
      isCityVistaVisualsReady: () => cityVistaReady,
    });
    scene.player = {
      setVelocity: vi.fn(),
    };
    scene.applyIdleFrame = vi.fn();
    scene.interactionLabel = {
      setVisible: vi.fn(),
    };
    scene.cameras = {
      main: {
        stopFollow: vi.fn(),
      },
    };
    scene.introBackdropMatte = createOverlayNode();
    scene.introCityBackdrop = createOverlayNode();
    scene.introCityTint = {
      setFillStyle: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    };
    scene.introLetterboxTop = createOverlayNode();
    scene.introLetterboxBottom = createOverlayNode();
    scene.startDuskCityBackdropAnimation = vi.fn();
    scene.runIntroBeat = vi.fn();

    scene.startIntroSequence();

    expect(scene.hasPendingIntroSequenceStart).toBe(true);
    expect(scene.isIntroSequenceActive).toBe(false);
    expect(scene.runIntroBeat).not.toHaveBeenCalled();

    cityVistaReady = true;
    scene.flushPendingCityVistaTransitions();

    expect(scene.hasPendingIntroSequenceStart).toBe(false);
    expect(scene.isIntroSequenceActive).toBe(true);
    expect(scene.runIntroBeat).toHaveBeenCalledWith(0);
  });

  it('re-primes the intro city backdrop before starting the sequence', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();
    const createOverlayNode = () => ({
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    });

    scene.isSceneReady = true;
    scene.isIntroSequenceActive = false;
    scene.isIntroSequenceComplete = false;
    scene.getPreviewBridge = () => ({
      isCityVistaVisualsReady: () => true,
    });
    scene.duskCityFrames = [{ duration: 100, key: 'city-backdrop-frame-0' }];
    scene.introCityAnimationTimer = { remove: vi.fn() };
    scene.player = {
      setVelocity: vi.fn(),
    };
    scene.applyIdleFrame = vi.fn();
    scene.interactionLabel = {
      setVisible: vi.fn(),
    };
    scene.cameras = {
      main: {
        stopFollow: vi.fn(),
      },
    };
    scene.introBackdropMatte = createOverlayNode();
    scene.introCityBackdrop = {
      setAlpha: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      texture: { key: 'stale-frame' },
    };
    scene.introCityTint = {
      ...createOverlayNode(),
      setFillStyle: vi.fn().mockReturnThis(),
    };
    scene.introLetterboxTop = createOverlayNode();
    scene.introLetterboxBottom = createOverlayNode();
    scene.layoutIntroOverlay = vi.fn();
    scene.startDuskCityBackdropAnimation = vi.fn();
    scene.runIntroBeat = vi.fn();

    scene.startIntroSequence();

    expect(scene.introCityAnimationTimer).toBeNull();
    expect(scene.layoutIntroOverlay).toHaveBeenCalledOnce();
    expect(scene.introCityBackdrop.setTexture).toHaveBeenCalledWith('city-backdrop-frame-0');
    expect(scene.introBackdropMatte.setAlpha).toHaveBeenCalledWith(0);
    expect(scene.introCityTint.setFillStyle).toHaveBeenCalledWith(0x03060d, 0.42);
    expect(scene.introLetterboxTop.setVisible).toHaveBeenCalledWith(true);
    expect(scene.startDuskCityBackdropAnimation).toHaveBeenCalledOnce();
  });

  it('queues window view until shared city-vista visuals are ready', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();
    const createOverlayNode = () => ({
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    });
    let cityVistaReady = false;

    scene.isSceneReady = true;
    scene.hasPendingWindowViewOpen = false;
    scene.getPreviewBridge = () => ({
      isCityVistaVisualsReady: () => cityVistaReady,
    });
    scene.isWindowViewActive = false;
    scene.controlsLocked = false;
    scene.activeInteractionZone = { object: { name: 'lookWindow' } };
    scene.player = {
      setVelocity: vi.fn(),
    };
    scene.applyIdleFrame = vi.fn();
    scene.interactionLabel = {
      setVisible: vi.fn(),
    };
    scene.setPrompt = vi.fn();
    scene.setPreviewHudState = vi.fn();
    scene.layoutIntroOverlay = vi.fn();
    scene.syncInteractionContext = vi.fn();
    scene.startDuskCityBackdropAnimation = vi.fn();
    scene.tweens = {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    };
    scene.introBackdropMatte = createOverlayNode();
    scene.introCityBackdrop = createOverlayNode();
    scene.introCityTint = {
      ...createOverlayNode(),
      setFillStyle: vi.fn().mockReturnThis(),
    };
    scene.introLetterboxTop = createOverlayNode();
    scene.introLetterboxBottom = createOverlayNode();
    scene.windowViewOverlayNodes = [createOverlayNode(), createOverlayNode()];

    scene.showWindowView();

    expect(scene.hasPendingWindowViewOpen).toBe(true);
    expect(scene.isWindowViewActive).toBe(false);
    expect(scene.startDuskCityBackdropAnimation).not.toHaveBeenCalled();

    cityVistaReady = true;
    scene.flushPendingCityVistaTransitions();

    expect(scene.hasPendingWindowViewOpen).toBe(false);
    expect(scene.isWindowViewActive).toBe(true);
    expect(scene.startDuskCityBackdropAnimation).toHaveBeenCalledOnce();
  });

  it('re-primes the city backdrop before opening window view', () => {
    const SceneClass = createApartmentPreviewScene({ Scene: BaseScene });
    const scene = new SceneClass();
    const createOverlayNode = () => ({
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    });

    scene.isSceneReady = true;
    scene.getPreviewBridge = () => ({
      isCityVistaVisualsReady: () => true,
    });
    scene.isWindowViewActive = false;
    scene.controlsLocked = false;
    scene.activeInteractionZone = { object: { name: 'lookWindow' } };
    scene.duskCityFrames = [{ duration: 100, key: 'city-backdrop-frame-0' }];
    scene.introCityAnimationTimer = { remove: vi.fn() };
    scene.player = {
      setVelocity: vi.fn(),
    };
    scene.applyIdleFrame = vi.fn();
    scene.interactionLabel = {
      setVisible: vi.fn(),
    };
    scene.setPrompt = vi.fn();
    scene.setPreviewHudState = vi.fn();
    scene.layoutIntroOverlay = vi.fn();
    scene.syncInteractionContext = vi.fn();
    scene.startDuskCityBackdropAnimation = vi.fn();
    scene.tweens = {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    };
    scene.introBackdropMatte = createOverlayNode();
    scene.introCityBackdrop = {
      setAlpha: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      texture: { key: 'stale-frame' },
    };
    scene.introCityTint = {
      ...createOverlayNode(),
      setFillStyle: vi.fn().mockReturnThis(),
    };
    scene.introLetterboxTop = createOverlayNode();
    scene.introLetterboxBottom = createOverlayNode();
    scene.windowViewOverlayNodes = [createOverlayNode(), createOverlayNode()];

    scene.showWindowView();

    expect(scene.introCityAnimationTimer).toBeNull();
    expect(scene.layoutIntroOverlay).toHaveBeenCalledOnce();
    expect(scene.introCityBackdrop.setTexture).toHaveBeenCalledWith('city-backdrop-frame-0');
    expect(scene.introBackdropMatte.setAlpha).toHaveBeenCalledWith(1);
    expect(scene.introCityTint.setFillStyle).toHaveBeenCalledWith(0x03060d, 0.18);
    expect(scene.introLetterboxTop.setVisible).toHaveBeenCalledWith(false);
    expect(scene.startDuskCityBackdropAnimation).toHaveBeenCalledOnce();
  });
});

describe('apartment preview overlay restart guards', () => {
  class MockOverlayScene {}

  attachApartmentPreviewSceneOverlayMethods(MockOverlayScene, {
    Math: {
      Clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    },
  });

  it('does not activate the terminal cue without an available terminal zone', () => {
    const scene = new MockOverlayScene();

    scene.terminalZoneObject = null;
    scene.terminalCueContainer = {
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    };
    scene.terminalCueGlow = {
      setAlpha: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
    };
    scene.terminalCueBellIcon = {
      setAngle: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
    };
    scene.updateTerminalCuePlacement = vi.fn();
    scene.tweens = {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    };
    scene.playTerminalNotificationSound = vi.fn();

    scene.activateTerminalCue();

    expect(scene.terminalCueContainer.setVisible).toHaveBeenCalledWith(false);
    expect(scene.tweens.killTweensOf).not.toHaveBeenCalled();
    expect(scene.tweens.add).not.toHaveBeenCalled();
    expect(scene.playTerminalNotificationSound).not.toHaveBeenCalled();
  });

  it('skips overlay layout when restart left destroyed nodes behind', () => {
    const scene = new MockOverlayScene();

    scene.scale = {
      gameSize: { width: 1280, height: 720 },
      height: 720,
      width: 1280,
    };
    scene.cameras = {
      main: {
        setLerp: vi.fn(),
        scrollX: 0,
        scrollY: 0,
        setViewport: vi.fn(),
        setZoom: vi.fn(),
        zoom: 1,
      },
    };
    scene.fullscreenOverlayCamera = {
      setViewport: vi.fn(),
    };
    scene.tilemap = {
      heightInPixels: 640,
      widthInPixels: 960,
    };
    scene.isIntroSequenceActive = false;
    scene.loadingOverlayState = { progress: 0.4 };
    scene.updateHudLayout = vi.fn();
    scene.updateTerminalCuePlacement = vi.fn();
    scene.getPreviewBridge = () => ({ previewDeviceClass: 'desktop' });

    scene.loadingOverlayBackdrop = createDestroyedNode();
    scene.loadingOverlayGrid = createDestroyedNode();
    scene.loadingOverlayWindow = createDestroyedNode();
    scene.loadingOverlayTitleBar = createDestroyedNode();
    scene.loadingOverlayLocation = createDestroyedNode({
      setFontSize: vi.fn(() => {
        throw new Error('stale node should not be resized');
      }),
    });
    scene.loadingOverlayDetail = createDestroyedNode({
      setWordWrapWidth: vi.fn(() => {
        throw new Error('stale node should not be wrapped');
      }),
    });
    scene.loadingOverlayStatusDot = createDestroyedNode();
    scene.loadingOverlayStatusLabel = createDestroyedNode();
    scene.loadingOverlayProgressTrack = createDestroyedNode();
    scene.loadingOverlayProgressFill = createDestroyedNode({
      setDisplaySize: vi.fn(() => {
        throw new Error('stale node should not be resized');
      }),
    });
    scene.loadingOverlayFooter = createDestroyedNode({
      setWordWrapWidth: vi.fn(() => {
        throw new Error('stale node should not be wrapped');
      }),
    });
    scene.loadingOverlayNodes = [
      scene.loadingOverlayBackdrop,
      scene.loadingOverlayGrid,
      scene.loadingOverlayWindow,
    ];

    scene.introBackdropMatte = createDestroyedNode();
    scene.introCityBackdrop = createDestroyedNode({
      setDisplaySize: vi.fn(() => {
        throw new Error('stale node should not be resized');
      }),
      texture: {
        getSourceImage: vi.fn(() => ({ height: 100, width: 100 })),
      },
    });
    scene.introCityTint = createDestroyedNode();
    scene.introLetterboxTop = createDestroyedNode();
    scene.introLetterboxBottom = createDestroyedNode();

    scene.windowViewHeaderShadow = createDestroyedNode();
    scene.windowViewHeaderBackground = createDestroyedNode();
    scene.windowViewHeaderTitleBar = createDestroyedNode();
    scene.windowViewHeaderTitle = createDestroyedNode();
    scene.windowViewHeaderBody = createDestroyedNode({
      setPosition: vi.fn(() => {
        throw new Error('stale node should not be positioned');
      }),
      setWordWrapWidth: vi.fn(() => {
        throw new Error('stale node should not be wrapped');
      }),
    });
    scene.windowViewBackButtonShadow = createDestroyedNode();
    scene.windowViewBackButtonBackground = createDestroyedNode();
    scene.windowViewBackButtonText = createDestroyedNode({
      text: 'Back to room [Esc]',
      width: 140,
    });
    scene.windowViewBackButtonHitArea = createDestroyedNode();
    scene.windowViewOverlayNodes = [
      scene.windowViewHeaderShadow,
      scene.windowViewHeaderBackground,
      scene.windowViewHeaderTitleBar,
      scene.windowViewHeaderTitle,
      scene.windowViewHeaderBody,
      scene.windowViewBackButtonShadow,
      scene.windowViewBackButtonBackground,
      scene.windowViewBackButtonText,
      scene.windowViewBackButtonHitArea,
    ];

    expect(() => scene.updateViewportLayout()).not.toThrow();
    expect(() => scene.layoutLoadingOverlay()).not.toThrow();
    expect(scene.loadingOverlayBackdrop).toBeNull();
    expect(scene.loadingOverlayWindow).toBeNull();
    expect(scene.loadingOverlayNodes).toEqual([]);
    expect(scene.introBackdropMatte).toBeNull();
    expect(scene.introCityTint).toBeNull();
    expect(scene.windowViewHeaderShadow).toBeNull();
    expect(scene.windowViewBackButtonText).toBeNull();
    expect(scene.windowViewOverlayNodes).toEqual([]);
    expect(scene.updateHudLayout).toHaveBeenCalledOnce();
    expect(scene.updateTerminalCuePlacement).toHaveBeenCalledOnce();
  });

  it('drops follow smoothing when gameplay zoom is fractional', () => {
    const scene = new MockOverlayScene();

    scene.scale = {
      gameSize: { width: 1366, height: 768 },
      height: 768,
      width: 1366,
    };
    scene.cameras = {
      main: {
        setLerp: vi.fn(),
        setViewport: vi.fn(),
        setZoom: vi.fn(),
      },
    };
    scene.fullscreenOverlayCamera = {
      setViewport: vi.fn(),
    };
    scene.tilemap = {
      heightInPixels: 448,
      widthInPixels: 640,
    };
    scene.isIntroSequenceActive = false;
    scene.layoutIntroOverlay = vi.fn();
    scene.layoutWindowViewOverlay = vi.fn();
    scene.updateHudLayout = vi.fn();
    scene.updateTerminalCuePlacement = vi.fn();

    scene.updateViewportLayout();

    expect(scene.gameplayZoom).toBeCloseTo(1366 / 640);
    expect(scene.cameras.main.setLerp).toHaveBeenCalledWith(1, 1);
  });

  it('reveals the window-view backdrop immediately instead of tweening it in', () => {
    const scene = new MockOverlayScene();

    const createOverlayNode = () => ({
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    });

    scene.isWindowViewActive = false;
    scene.controlsLocked = false;
    scene.activeInteractionZone = { object: { name: 'lookWindow' } };
    scene.player = {
      setVelocity: vi.fn(),
    };
    scene.applyIdleFrame = vi.fn();
    scene.interactionLabel = {
      setVisible: vi.fn(),
    };
    scene.setPrompt = vi.fn();
    scene.setPreviewHudState = vi.fn();
    scene.layoutIntroOverlay = vi.fn();
    scene.syncInteractionContext = vi.fn();
    scene.startDuskCityBackdropAnimation = vi.fn();
    scene.tweens = {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    };
    scene.introBackdropMatte = createOverlayNode();
    scene.introCityBackdrop = createOverlayNode();
    scene.introCityTint = {
      ...createOverlayNode(),
      setFillStyle: vi.fn().mockReturnThis(),
    };
    scene.introLetterboxTop = createOverlayNode();
    scene.introLetterboxBottom = createOverlayNode();
    scene.windowViewOverlayNodes = [createOverlayNode(), createOverlayNode()];

    scene.showWindowView();

    expect(scene.introBackdropMatte.setVisible).toHaveBeenCalledWith(true);
    expect(scene.introBackdropMatte.setAlpha).toHaveBeenCalledWith(1);
    expect(scene.introCityBackdrop.setAlpha).toHaveBeenCalledWith(1);
    expect(scene.introCityTint.setAlpha).toHaveBeenCalledWith(1);
    expect(scene.tweens.killTweensOf).toHaveBeenCalledOnce();
    expect(scene.tweens.add).not.toHaveBeenCalled();
    expect(scene.startDuskCityBackdropAnimation).toHaveBeenCalledOnce();
  });
});
