import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CityPhaserPreviewPage from './CityPhaserPreviewPage';
import { buildPreviewEntryState } from './cityPreviewEntryState';
import {
  APARTMENT_PREVIEW_ADVANCE_EVENT,
  APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT,
  APARTMENT_PREVIEW_HUD_STATE_EVENT,
  APARTMENT_PREVIEW_INTERACTION_STATE_EVENT,
  APARTMENT_PREVIEW_INPUT_TRACE_EVENT,
  APARTMENT_PREVIEW_READY_EVENT,
} from '../../city-phaser/district01/previewBootEvents';

import phaserInstanceManager from '../../utils/phaser/PhaserInstanceManager';

let fullscreenElement = null;
let activeMockGameInstance = null;

const { mockGameDestroyFns, mockSceneManager } = vi.hoisted(() => ({
  mockGameDestroyFns: [],
  mockSceneManager: {
    start: vi.fn(),
    stop: vi.fn(),
    isActive: vi.fn(() => false),
    isPaused: vi.fn(() => false),
    pause: vi.fn(),
    resume: vi.fn(),
  },
}));

const mockUseAuth = vi.hoisted(() => vi.fn(() => ({ isAuthenticated: false })));
const mockUseCityStoryState = vi.hoisted(() =>
  vi.fn(() => ({ isLoading: false, isReady: true, storyState: null }))
);
const mockUseIsMobileDevice = vi.hoisted(() => vi.fn(() => false));
const mockUseResponsiveProfile = vi.hoisted(() =>
  vi.fn(() => ({
    isLandscapeViewport: true,
    isPortraitViewport: false,
  }))
);

const { mockPreloadImageSources } = vi.hoisted(() => ({
  mockPreloadImageSources: vi.fn(() => Promise.resolve(true)),
}));

const createDeferredPromise = () => {
  let resolvePromise;

  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
};

const { mockAudioManager } = vi.hoisted(() => ({
  mockAudioManager: {
    getSettings: vi.fn(() => ({ musicEnabled: true, musicVolume: 0.5 })),
    resumePendingAutoplay: vi.fn(() => false),
    updateMusicSettings: vi.fn(),
  },
}));

const mockPhoneTracks = vi.hoisted(() => [
  {
    id: 'midnight-run',
    title: 'Midnight Run',
    artist: 'CodeGrind FM',
  },
  {
    id: 'signal-breach',
    title: 'Signal Breach',
    artist: 'Port Meridian',
  },
]);

const { mockAudioService } = vi.hoisted(() => ({
  mockAudioService: {
    findTrackById: vi.fn(
      (trackId) => mockPhoneTracks.find((track) => track.id === trackId) || null
    ),
    getAllMusicTracks: vi.fn(() => mockPhoneTracks),
    getCurrentTrack: vi.fn(() => mockPhoneTracks[0]),
    initialize: vi.fn().mockResolvedValue(undefined),
    playBackgroundMusic: vi.fn().mockResolvedValue(true),
    stopBackgroundMusic: vi.fn(),
  },
}));

vi.mock('../../hooks/useIsMobileDevice', () => ({
  default: mockUseIsMobileDevice,
}));

vi.mock('../../hooks/useResponsiveProfile', () => ({
  default: mockUseResponsiveProfile,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../hooks/city/useCityStoryState', () => ({
  default: mockUseCityStoryState,
}));

vi.mock('../../utils/web/storage', () => ({
  readStorage: vi.fn((storageKey, itemKey) => window[storageKey]?.getItem?.(itemKey) ?? null),
  writeStorage: vi.fn((storageKey, itemKey, value) =>
    window[storageKey]?.setItem?.(itemKey, value)
  ),
}));

vi.mock('../../utils/audio/AudioManager', () => ({
  default: mockAudioManager,
}));

vi.mock('../../utils/audio/AudioService', () => ({
  default: mockAudioService,
}));

vi.mock('../../hooks/guest/useGuestFunnel', () => ({
  default: () => ({
    demoLoadingStarted: vi.fn(),
    demoStarted: vi.fn(),
    engineZoneEntered: vi.fn(),
    engineInteractionAttempt: vi.fn(),
    engineTerminalFound: vi.fn(),
    engineFramerateDrop: vi.fn(),
    webglContextLost: vi.fn(),
    postPathUiRendered: vi.fn(),
  }),
}));

vi.mock('phaser', () => {
  class MockGame {
    constructor(config) {
      activeMockGameInstance = this;
      this.config = config;
      this.canvas = document.createElement('canvas');
      this.destroy = vi.fn();
      this.registry = { set: vi.fn() };
      this.scale = { resize: vi.fn() };
      this.scene = mockSceneManager;
      this.pause = vi.fn(() => {
        this.isPaused = true;
      });
      this.resume = vi.fn(() => {
        this.isPaused = false;
      });
      this.isPaused = false;
      mockGameDestroyFns.push(this.destroy);
      config?.parent?.appendChild?.(this.canvas);
      config?.callbacks?.preBoot?.(this);
    }
  }

  return {
    default: {
      AUTO: 'AUTO',
      Game: MockGame,
      Scale: {
        RESIZE: 'RESIZE',
      },
    },
  };
});

vi.mock('../../city-phaser/district01/createApartmentPreviewScene', () => ({
  createApartmentPreviewScene: vi.fn(() => function ApartmentPreviewScene() {}),
}));

vi.mock('../../components/city/CityCodegrindLaunchExperience', () => ({
  default: () => <div data-testid="launch-experience" />,
}));

vi.mock('../../components/city/CityPhaserPreviewDialogueOverlay', () => ({
  default: ({ dialogueState, hidden }) =>
    hidden || !dialogueState ? null : (
      <div
        data-testid="preview-dialogue-overlay"
        data-preview-presentation={dialogueState?.presentation || ''}
      >
        {dialogueState?.title || dialogueState?.text}
      </div>
    ),
}));

vi.mock('../../components/city/CityPhaserPreviewBootScreen', () => ({
  default: () => <div data-testid="preview-boot-screen" />,
}));

vi.mock('./CityPhaserPreviewBackdropSigns.utils', async () => {
  const actual = await vi.importActual('./CityPhaserPreviewBackdropSigns.utils');

  return {
    ...actual,
    preloadImageSources: (...args) => mockPreloadImageSources(...args),
  };
});

vi.mock('../../components/city/CityPhaserPreviewHud', () => ({
  default: ({ hidden, hudState }) =>
    hidden || !hudState ? null : (
      <div data-testid="preview-hud" data-preview-presentation={hudState?.presentation || ''}>
        {hudState?.title || hudState?.text}
      </div>
    ),
}));

vi.mock('../../components/city/CityPhaserPreviewMobileControls', () => ({
  default: () => <div data-testid="preview-mobile-controls" />,
}));

vi.mock('../../components/city/CityDeviceShellHost', () => ({
  default: ({
    onPhoneTrackSelect,
    onPhoneControlSideChange,
    onPhoneMusicToggle,
    onPhoneMusicVolumeChange,
    phoneAvailableTracks,
    phoneCurrentTrack,
    phoneGameSettings,
    phoneSelectedTrackId,
    request,
  }) =>
    request ? (
      <div
        data-testid="device-shell-host"
        data-phone-available-tracks={String(phoneAvailableTracks?.length ?? '')}
        data-phone-control-side={phoneGameSettings?.controlSide || ''}
        data-phone-current-track-id={phoneCurrentTrack?.id || ''}
        data-phone-music-enabled={String(phoneGameSettings?.musicEnabled ?? '')}
        data-phone-music-volume={String(phoneGameSettings?.musicVolume ?? '')}
        data-phone-selected-track-id={phoneSelectedTrackId || ''}
      >
        {request.terminalName || request.shellId}
        <button type="button" onClick={() => onPhoneControlSideChange?.('left')}>
          host-set-left
        </button>
        <button type="button" onClick={() => onPhoneMusicToggle?.()}>
          host-toggle-music
        </button>
        <button type="button" onClick={() => onPhoneMusicVolumeChange?.(0.25)}>
          host-set-volume
        </button>
        <button type="button" onClick={() => onPhoneTrackSelect?.('signal-breach')}>
          host-set-track
        </button>
      </div>
    ) : null,
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  fullscreenElement = null;

  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  });

  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      fullscreenElement = document.documentElement;
    }),
  });

  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      fullscreenElement = null;
    }),
  });

  mockPreloadImageSources.mockReset();
  mockPreloadImageSources.mockResolvedValue(true);
  mockGameDestroyFns.length = 0;
  phaserInstanceManager.gameInstance = null;
  phaserInstanceManager.containerId = null;
  activeMockGameInstance = null;
  mockSceneManager.pause.mockReset();
  mockSceneManager.resume.mockReset();
  mockSceneManager.start.mockReset();
  mockSceneManager.stop.mockReset();
  mockSceneManager.isActive.mockReset();
  mockSceneManager.isPaused.mockReset();
  mockSceneManager.isActive.mockReturnValue(false);
  mockSceneManager.isPaused.mockReturnValue(false);
  mockAudioManager.getSettings.mockReset();
  mockAudioManager.getSettings.mockReturnValue({ musicEnabled: true, musicVolume: 0.5 });
  mockAudioManager.resumePendingAutoplay.mockReset();
  mockAudioManager.resumePendingAutoplay.mockReturnValue(false);
  mockAudioManager.updateMusicSettings.mockReset();
  mockAudioService.findTrackById.mockReset();
  mockAudioService.findTrackById.mockImplementation(
    (trackId) => mockPhoneTracks.find((track) => track.id === trackId) || null
  );
  mockAudioService.getAllMusicTracks.mockReset();
  mockAudioService.getAllMusicTracks.mockReturnValue(mockPhoneTracks);
  mockAudioService.getCurrentTrack.mockReset();
  mockAudioService.getCurrentTrack.mockReturnValue(mockPhoneTracks[0]);
  mockAudioService.initialize.mockReset();
  mockAudioService.initialize.mockResolvedValue(undefined);
  mockAudioService.playBackgroundMusic.mockReset();
  mockAudioService.playBackgroundMusic.mockResolvedValue(true);
  mockAudioService.stopBackgroundMusic.mockReset();
  mockUseAuth.mockReturnValue({ isAuthenticated: false });
  mockUseCityStoryState.mockReturnValue({ isLoading: false, isReady: true, storyState: null });
  mockUseIsMobileDevice.mockReturnValue(false);
  mockUseResponsiveProfile.mockReturnValue({
    isLandscapeViewport: true,
    isPortraitViewport: false,
  });
});

describe('CityPhaserPreviewPage render', () => {
  it('pauses the Phaser game on unmount and reuses the same instance on remount', async () => {
    const pauseGameSpy = vi.spyOn(phaserInstanceManager, 'pauseGame');
    const pauseSceneSpy = vi.spyOn(phaserInstanceManager, 'pauseScene');

    const firstRender = render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGameDestroyFns).toHaveLength(1);
    });

    const firstGameInstance = activeMockGameInstance;
    expect(firstGameInstance).not.toBeNull();
    expect(firstGameInstance.destroy).not.toHaveBeenCalled();

    firstRender.unmount();

    // Verify game was paused on unmount (not destroyed)
    expect(pauseGameSpy).toHaveBeenCalled();
    expect(pauseSceneSpy).toHaveBeenCalledWith('ApartmentPreviewScene');
    expect(firstGameInstance.destroy).not.toHaveBeenCalled();

    pauseGameSpy.mockRestore();
    pauseSceneSpy.mockRestore();

    // Remount — should reuse the same Phaser instance (not create new)
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    // Verify no NEW game instance was created
    expect(mockGameDestroyFns).toHaveLength(1);

    // The same instance is reused
    const secondGameInstance = activeMockGameInstance;
    expect(secondGameInstance).toBe(firstGameInstance);
    expect(secondGameInstance.destroy).not.toHaveBeenCalled();
  });

  it('renders without throwing before desktop phone state is derived', () => {
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-hud')).not.toBeInTheDocument();
    expect(screen.queryByTestId('preview-dialogue-overlay')).not.toBeInTheDocument();
  });

  it('renders the collectible inspect modal from scene events and keeps guest collect disabled', () => {
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT, {
          detail: {
            collectibleId: 'district-01-ada',
            description:
              "Ada Lovelace wrote the first published algorithm intended for Charles Babbage's Analytical Engine and recognized that a machine could manipulate symbols as well as numbers.",
            eyebrow: 'Recovered portrait',
            footer:
              'English mathematician and early computing visionary, often regarded as the first computer programmer.',
            imageAlt: 'Ada collectible portrait',
            imageSrc: '/city-v2/tiled/Collectibles/Ada_Collectible_Pic.jpg',
            statusLabel: 'Field disk',
            title: 'Ada',
          },
        })
      );
    });

    expect(screen.getByTestId('city-preview-collectible-modal')).toBeInTheDocument();
    expect(screen.getByText('Recovered portrait')).toBeInTheDocument();
    expect(
      screen.getByText(/Ada Lovelace wrote the first published algorithm intended/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collect' })).toBeDisabled();
  });

  it('does not try to pause or resume the apartment scene before Phaser reports it running', () => {
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    expect(mockSceneManager.pause).not.toHaveBeenCalled();
    expect(mockSceneManager.resume).not.toHaveBeenCalled();
  });

  it('derives the hub checkpoint from authenticated story state when guest storage is gone', () => {
    const result = buildPreviewEntryState({
      isAuthenticated: true,
      isMobileDevice: false,
      storyState: {
        apartmentState: 'hub',
        selectedTrialTrack: 'beginner',
        selectedTrialLearningPath: 'python-path',
      },
    });

    expect(result).toEqual({
      apartmentShellId: 'apartment-hub-desktop',
      guestPhoneContext: {
        hasChosenPath: true,
        isAuthenticated: true,
        progressSummary: null,
        routeMissionState: null,
        selectedPlayerCharacterId: null,
        selectedTrialLearningPath: 'python-path',
        selectedTrialTrack: 'beginner',
      },
      resolvedApartmentState: 'hub',
    });
  });

  it('forces intro state if authenticated but has no chosen track', () => {
    const result = buildPreviewEntryState({
      isAuthenticated: true,
      isMobileDevice: false,
      storyState: {
        apartmentState: 'hub',
        selectedTrialTrack: null,
        selectedTrialLearningPath: null,
      },
    });

    expect(result).toEqual({
      apartmentShellId: 'apartment-intro-desktop',
      guestPhoneContext: {
        hasChosenPath: false,
        isAuthenticated: true,
        progressSummary: null,
        routeMissionState: null,
        selectedPlayerCharacterId: null,
        selectedTrialLearningPath: null,
        selectedTrialTrack: null,
      },
      resolvedApartmentState: 'intro',
    });
  });

  it('forces intro state and ignores leftover guest progress in localStorage when authenticated but has no chosen track', () => {
    const result = buildPreviewEntryState({
      isAuthenticated: true,
      isMobileDevice: false,
      storyState: {
        apartmentState: 'hub',
        selectedTrialTrack: null,
        selectedTrialLearningPath: null,
      },
      storedGuestProgress: {
        selectedTrialTrack: 'beginner',
        selectedTrialLearningPath: 'python-path',
        selectedPlayerCharacterId: 'selectable_character_04',
        apartmentState: 'hub',
        demoCompleted: true,
      },
    });

    expect(result).toEqual({
      apartmentShellId: 'apartment-intro-desktop',
      guestPhoneContext: {
        hasChosenPath: false,
        isAuthenticated: true,
        progressSummary: null,
        routeMissionState: null,
        selectedPlayerCharacterId: null,
        selectedTrialLearningPath: null,
        selectedTrialTrack: null,
      },
      resolvedApartmentState: 'intro',
    });
  });

  it('adds guest progress counts to the phone preview context for learning and cluster cards', () => {
    const result = buildPreviewEntryState({
      isAuthenticated: false,
      isMobileDevice: true,
      storedGuestProgress: {
        clustersBrowsed: ['cluster-1', 'cluster-2'],
        lpNodesCompleted: ['node-1', 'node-2'],
        lpNodesStarted: ['node-1', 'node-2', 'node-3'],
        problemsAttempted: ['problem-1', 'problem-2', 'problem-3'],
        problemsSolved: ['problem-1', 'problem-2'],
        selectedPlayerCharacterId: 'selectable_character_04',
        selectedTrialLearningPath: 'python-path',
        selectedTrialTrack: 'pro',
      },
    });

    expect(result.guestPhoneContext).toMatchObject({
      hasChosenPath: true,
      isAuthenticated: false,
      progressSummary: {
        clusterFreeProblemsRemaining: 1,
        clusterTrialProblemLimit: 3,
        clusterTrialSolvedCount: 2,
        clustersBrowsedCount: 2,
        learningNodesCompletedCount: 2,
        learningNodesStartedCount: 3,
        learningTrialProblemLimit: 4,
        learningTrialProblemsRemaining: 2,
        learningTrialSolvedCount: 2,
        problemsAttemptedCount: 3,
        problemsSolvedCount: 2,
      },
      selectedPlayerCharacterId: 'selectable_character_04',
      selectedTrialLearningPath: 'python-path',
      selectedTrialTrack: 'pro',
    });
  });

  it('does not reveal intro vista signs before the shared city-vista gate is ready', async () => {
    const deferredPreload = createDeferredPromise();
    mockPreloadImageSources.mockImplementation(() => deferredPreload.promise);

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            cityBackdropSourceSize: { width: 1881, height: 918 },
            cityBackdropUsesUncropped: true,
            cityBackdropVisible: true,
            mode: 'intro',
            text: 'Port Meridian intro copy.',
            title: 'Port Meridian',
          },
        })
      );
      await Promise.resolve();
    });

    expect(document.querySelectorAll('[data-testid^="city-backdrop-sign-"]').length).toBe(0);
    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();

    await act(async () => {
      deferredPreload.resolve(true);
      await deferredPreload.promise;
      await Promise.resolve();
    });
  });

  it('does not reveal window chrome before the shared city-vista gate is ready', async () => {
    const deferredPreload = createDeferredPromise();
    mockPreloadImageSources.mockImplementation(() => deferredPreload.promise);

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: false,
            movementUnlocked: true,
            windowViewActive: true,
            windowViewBackdropSourceSize: { width: 1881, height: 918 },
            windowViewUsesUncroppedBackdrop: true,
          },
        })
      );
      await Promise.resolve();
    });

    expect(screen.queryByRole('button', { name: /Back to Room/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid^="city-backdrop-sign-"]').length).toBe(0);
    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();

    await act(async () => {
      deferredPreload.resolve(true);
      await deferredPreload.promise;
      await Promise.resolve();
    });
  });

  it('does not reveal intro vista content until Phaser reports the backdrop primed', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: false,
            cityBackdropSourceSize: { width: 1881, height: 918 },
            cityBackdropUsesUncropped: true,
            cityBackdropVisible: true,
            mode: 'intro',
            text: 'Port Meridian intro copy.',
            title: 'Port Meridian',
          },
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
      await Promise.resolve();
    });

    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid^="city-backdrop-sign-"]')).toHaveLength(0);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: true,
            cityBackdropSourceSize: { width: 1881, height: 918 },
            cityBackdropUsesUncropped: true,
            cityBackdropVisible: true,
            mode: 'intro',
            text: 'Port Meridian intro copy.',
            title: 'Port Meridian',
          },
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-testid^="city-backdrop-sign-"]').length
    ).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('does not bring the boot overlay back when intro advances to a beat without the city backdrop', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: true,
            cityBackdropSourceSize: { width: 1881, height: 918 },
            cityBackdropUsesUncropped: true,
            cityBackdropVisible: true,
            mode: 'intro',
            text: 'Port Meridian intro copy.',
            title: 'Port Meridian',
          },
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: true,
            cityBackdropSourceSize: { width: 1881, height: 918 },
            cityBackdropUsesUncropped: true,
            cityBackdropVisible: false,
            mode: 'intro',
            text: 'Second intro beat copy.',
            title: 'The Pitch',
          },
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not reveal window chrome until Phaser reports the backdrop primed', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: false,
            movementUnlocked: true,
            windowViewActive: true,
            windowViewBackdropSourceSize: { width: 1881, height: 918 },
            windowViewUsesUncroppedBackdrop: true,
          },
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
      await Promise.resolve();
    });

    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Back to Room/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid^="city-backdrop-sign-"]')).toHaveLength(0);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            cityBackdropPrimed: true,
            movementUnlocked: true,
            windowViewActive: true,
            windowViewBackdropSourceSize: { width: 1881, height: 918 },
            windowViewUsesUncroppedBackdrop: true,
          },
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Room/i })).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-testid^="city-backdrop-sign-"]').length
    ).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('keeps the Phaser container hidden while the boot overlay is active', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    const previewContainer = screen.getByTestId('city-phaser-preview-container');

    expect(previewContainer).toHaveAttribute('data-preview-visible', 'false');

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            mode: 'objective',
            text: 'Boot complete.',
            title: 'Ready',
          },
        })
      );
      await Promise.resolve();
    });

    expect(previewContainer).toHaveAttribute('data-preview-visible', 'false');
    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(180);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(previewContainer).toHaveAttribute('data-preview-visible', 'false');
    expect(screen.getByTestId('preview-boot-screen')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('resumes pending music from the first intro advance and keeps the extra prompt hidden during intro', async () => {
    vi.useFakeTimers();
    mockAudioService.playBackgroundMusic.mockResolvedValue(false);
    mockAudioManager.resumePendingAutoplay.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            mode: 'intro',
            nextActionLabel: 'Next',
            text: 'Port Meridian intro copy.',
            title: 'Port Meridian',
          },
        })
      );
      await Promise.resolve();
      vi.advanceTimersByTime(240);
    });

    expect(screen.queryByText(/Click to start music on this screen\./i)).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_ADVANCE_EVENT));
      await Promise.resolve();
    });

    expect(mockAudioManager.resumePendingAutoplay).toHaveBeenCalled();
    expect(screen.queryByText(/Click to start music on this screen\./i)).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not render the fullscreen city backdrop chrome during normal apartment movement', async () => {
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            movementUnlocked: true,
            terminalZoneActive: false,
            windowViewActive: false,
            windowViewBackdropSourceSize: { width: 1881, height: 918 },
            windowViewUsesUncroppedBackdrop: true,
          },
        })
      );
    });

    expect(screen.queryByRole('button', { name: /Back to Room/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Port Meridian at dusk/i)).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid^="city-backdrop-sign-"]').length).toBe(0);
  });

  it('renders Phaser-sourced input trace updates for KeyD movement state', async () => {
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INPUT_TRACE_EVENT, {
          detail: {
            activeElementTag: 'body',
            capsLock: false,
            code: 'KeyD',
            defaultPreventedBeforeHandler: false,
            documentHasFocus: true,
            eventType: 'keydown',
            key: 'd',
            note: 'Phaser received movement key.',
            repeat: false,
            sceneDirection: 'arrowright',
            sceneReceived: true,
            shiftKey: false,
            targetTag: 'body',
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            inputDebug: {
              sceneArrowRightActive: false,
              sceneRightActive: true,
              sceneTouchRightActive: false,
              sceneWasdRightActive: true,
            },
          },
        })
      );
    });

    expect(screen.getByTestId('preview-input-trace')).toBeInTheDocument();
    expect(screen.getByTestId('preview-input-trace-event')).toHaveTextContent('Event: keydown');
    expect(screen.getByTestId('preview-input-trace-key')).toHaveTextContent('Key: d');
    expect(screen.getByTestId('preview-input-trace-code')).toHaveTextContent('Code: KeyD');
    expect(screen.getByTestId('preview-input-trace-scene-direction')).toHaveTextContent(
      'Scene Direction: arrowright'
    );
    expect(screen.getByTestId('preview-input-trace-scene-received')).toHaveTextContent(
      'Scene Received: ON'
    );
    expect(screen.getByTestId('preview-input-trace-scene-right')).toHaveTextContent(
      'Scene Right Active: ON'
    );

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INPUT_TRACE_EVENT, {
          detail: {
            activeElementTag: 'body',
            capsLock: false,
            code: 'KeyD',
            defaultPreventedBeforeHandler: false,
            documentHasFocus: true,
            eventType: 'keyup',
            key: 'd',
            note: 'Phaser received movement key release.',
            repeat: false,
            sceneDirection: 'arrowright',
            sceneReceived: true,
            shiftKey: false,
            targetTag: 'body',
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            inputDebug: {
              sceneArrowRightActive: false,
              sceneRightActive: false,
              sceneTouchRightActive: false,
              sceneWasdRightActive: false,
            },
          },
        })
      );
    });

    expect(screen.getByTestId('preview-input-trace-event')).toHaveTextContent('Event: keyup');
    expect(screen.getByTestId('preview-input-trace-scene-right')).toHaveTextContent(
      'Scene Right Active: OFF'
    );
  });

  it('does not misclassify non-movement keys as rightward movement in the trace overlay', async () => {
    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INPUT_TRACE_EVENT, {
          detail: {
            activeElementTag: 'body',
            capsLock: false,
            code: 'KeyP',
            defaultPreventedBeforeHandler: false,
            documentHasFocus: true,
            eventType: 'keydown',
            key: 'p',
            note: 'Phaser received non-movement key.',
            repeat: false,
            sceneDirection: null,
            sceneReceived: true,
            shiftKey: false,
            targetTag: 'body',
          },
        })
      );
    });

    expect(screen.getByTestId('preview-input-trace-key')).toHaveTextContent('Key: p');
    expect(screen.getByTestId('preview-input-trace-code')).toHaveTextContent('Code: KeyP');
    expect(screen.getByTestId('preview-input-trace-scene-direction')).toHaveTextContent(
      'Scene Direction: none'
    );
  });

  it('shows separate walk-controls and keyboard-help notices during the movement objective', async () => {
    vi.useFakeTimers();
    const objectiveHudState = {
      footer: 'Use WASD or the Arrow Keys to move. Press E when you reach the terminal.',
      hotkey: 'WASD',
      mode: 'objective',
      placement: 'top-left',
      statusLabel: 'Objective',
      text: 'The safehouse terminal just caught an off-pattern transmission.',
      title: 'Stray Signal',
    };

    const renderPreview = () =>
      render(
        <MemoryRouter initialEntries={['/city']}>
          <ChakraProvider>
            <CityPhaserPreviewPage />
          </ChakraProvider>
        </MemoryRouter>
      );

    const firstRender = renderPreview();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: objectiveHudState,
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('preview-walk-controls-notice')).toBeInTheDocument();
    expect(screen.getByTestId('preview-wasd-keypad')).toBeInTheDocument();
    expect(screen.getByTestId('preview-keyboard-help-notice')).toBeInTheDocument();
    expect(screen.getByText(/Use WASD or Arrow Keys to move/i)).toBeInTheDocument();
    expect(screen.getByText(/If WASD or the arrow keys do nothing/i)).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: /Hide Tip/i }).click();
    });

    expect(screen.getByTestId('preview-walk-controls-notice')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-keyboard-help-notice')).not.toBeInTheDocument();

    firstRender.unmount();

    renderPreview();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: objectiveHudState,
        })
      );
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.getByTestId('preview-walk-controls-notice')).toBeInTheDocument();
    expect(screen.getByTestId('preview-keyboard-help-notice')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('opens the desktop phone with P and closes it with Escape', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();

    const openMenuEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'KeyP',
      key: 'p',
    });

    await act(async () => {
      window.dispatchEvent(openMenuEvent);
    });

    expect(openMenuEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId('device-shell-host')).toHaveTextContent(/Field Device/i);

    const closeMenuEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Escape',
      key: 'Escape',
    });

    await act(async () => {
      window.dispatchEvent(closeMenuEvent);
    });

    expect(closeMenuEvent.defaultPrevented).toBe(true);
    expect(screen.queryByTestId('device-shell-host')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('passes live phone settings into the shell host and updates them from shell actions', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          code: 'KeyP',
          key: 'p',
        })
      );
    });

    const host = screen.getByTestId('device-shell-host');

    expect(host).toHaveAttribute('data-phone-available-tracks', '2');
    expect(host).toHaveAttribute('data-phone-control-side', 'right');
    expect(host).toHaveAttribute('data-phone-current-track-id', 'midnight-run');
    expect(host).toHaveAttribute('data-phone-music-enabled', 'true');
    expect(host).toHaveAttribute('data-phone-music-volume', '0.5');
    expect(host).toHaveAttribute('data-phone-selected-track-id', 'midnight-run');

    fireEvent.click(screen.getByRole('button', { name: 'host-set-left' }));
    expect(window.localStorage.getItem('cg-city-mobile-control-side')).toBe('left');
    expect(host).toHaveAttribute('data-phone-control-side', 'left');

    fireEvent.click(screen.getByRole('button', { name: 'host-set-track' }));
    expect(mockAudioService.playBackgroundMusic).toHaveBeenLastCalledWith(
      'default',
      'signal-breach'
    );
    expect(host).toHaveAttribute('data-phone-selected-track-id', 'signal-breach');

    fireEvent.click(screen.getByRole('button', { name: 'host-toggle-music' }));
    expect(mockAudioManager.updateMusicSettings).toHaveBeenLastCalledWith(false, 0.5);
    expect(mockAudioService.stopBackgroundMusic).toHaveBeenCalledTimes(1);
    expect(host).toHaveAttribute('data-phone-music-enabled', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'host-set-volume' }));
    expect(mockAudioManager.updateMusicSettings).toHaveBeenLastCalledWith(false, 0.25);
    expect(host).toHaveAttribute('data-phone-music-volume', '0.25');

    vi.useRealTimers();
  });

  it('does not open the preview phone menu while typing in an input', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const keyDownEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'KeyP',
      key: 'p',
    });

    input.dispatchEvent(keyDownEvent);

    expect(keyDownEvent.defaultPrevented).toBe(false);
    expect(screen.queryByTestId('device-shell-host')).not.toBeInTheDocument();

    input.remove();
    vi.useRealTimers();
  });

  it('shows an audio resume prompt after intro when autoplay is blocked and clears it after resume', async () => {
    mockAudioService.playBackgroundMusic.mockResolvedValueOnce(false);
    mockAudioManager.resumePendingAutoplay.mockReturnValueOnce(true);

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockAudioService.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            mode: 'intro',
            title: 'Port Meridian',
            text: 'Intro beat',
            placement: 'top-left',
            statusLabel: 'City feed',
            nextActionLabel: 'Next',
          },
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('preview-boot-screen')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Enable Music/i })).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
          detail: {
            mode: 'objective',
            title: 'Objective',
            text: 'Make your way outside.',
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
          detail: {
            isIntroSequenceActive: false,
            isIntroSequenceComplete: true,
          },
        })
      );
    });

    const enableMusicButton = screen.getByRole('button', { name: /Enable Music/i });
    expect(screen.getByText(/Click to start music on this screen\./i)).toBeInTheDocument();

    await act(async () => {
      enableMusicButton.click();
    });

    expect(mockAudioManager.resumePendingAutoplay).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Enable Music/i })).not.toBeInTheDocument();
  });

  it('shows a mobile fullscreen recovery notice when fullscreen intent remains but fullscreen drops', async () => {
    vi.useFakeTimers();
    mockUseIsMobileDevice.mockReturnValue(true);
    mockUseResponsiveProfile.mockReturnValue({
      isLandscapeViewport: true,
      isPortraitViewport: false,
    });
    window.sessionStorage.setItem('codegrind-fullscreen-intent', 'true');

    render(
      <MemoryRouter initialEntries={['/city']}>
        <ChakraProvider>
          <CityPhaserPreviewPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_READY_EVENT));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.getByTestId('preview-fullscreen-recovery-notice')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Return to Fullscreen/i }));
      await Promise.resolve();
    });

    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
