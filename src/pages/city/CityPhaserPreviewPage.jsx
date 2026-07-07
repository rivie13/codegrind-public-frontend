import { Box, Button, Text, useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CityCodegrindLaunchExperience from '../../components/city/CityCodegrindLaunchExperience';
import CityPhaserPreviewBootScreen from '../../components/city/CityPhaserPreviewBootScreen';
import CityPhaserPreviewDialogueOverlay from '../../components/city/CityPhaserPreviewDialogueOverlay';
import CityPhaserPreviewHud from '../../components/city/CityPhaserPreviewHud';
import CityPhaserPreviewMobileControls from '../../components/city/CityPhaserPreviewMobileControls';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import useCityStoryState from '../../hooks/city/useCityStoryState';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import useResponsiveProfile from '../../hooks/useResponsiveProfile';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';
import audioManager from '../../utils/audio/AudioManager';
import audioService from '../../utils/audio/AudioService';
import { readStorage } from '../../utils/web/storage';
import { isTextEntryTarget } from '../../utils/web/inputUtils';
import CityPhaserPreviewBackdropSigns from './CityPhaserPreviewBackdropSigns';
import {
  getBackdropRect,
  shouldRunBackdropSignClock,
} from './CityPhaserPreviewBackdropSigns.utils';
import CityPhaserPreviewInputTracePanel from './CityPhaserPreviewInputTracePanel';
import CityPhaserPreviewCollectibleModal from './CityPhaserPreviewCollectibleModal';
import CityPhaserPreviewNoticeCard from './CityPhaserPreviewNoticeCard';
import CityPhaserPreviewWindowViewOverlay from './CityPhaserPreviewWindowViewOverlay';
import {
  APARTMENT_PREVIEW_ADVANCE_EVENT,
  APARTMENT_PREVIEW_BRIDGE_KEY,
  APARTMENT_PREVIEW_CLOSE_COLLECTIBLE_EVENT,
  APARTMENT_PREVIEW_ERROR_EVENT,
  APARTMENT_PREVIEW_HUD_STATE_EVENT,
  APARTMENT_PREVIEW_INPUT_TRACE_EVENT,
  APARTMENT_PREVIEW_INTERACTION_STATE_EVENT,
  APARTMENT_PREVIEW_COLLECTIBLE_COLLECT_EVENT,
  APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT,
  APARTMENT_PREVIEW_CLOSE_WINDOW_VIEW_EVENT,
  APARTMENT_PREVIEW_READY_EVENT,
  APARTMENT_PREVIEW_SET_WAYPOINT_EVENT,
  APARTMENT_PREVIEW_WORLD_STATE_EVENT,
} from '../../city-phaser/district01/previewBootEvents';
import CityDeviceShellHost from '../../components/city/CityDeviceShellHost';
import { DEVICE_SHELL_OPEN_EVENT } from '../../city-shell/deviceShellEvents';
import {
  CITY_PREVIEW_COLLECTIBLE_STORE_SLUGS,
  getCityPreviewCollectibleById,
} from '../../city-phaser/district01/cityPreviewCollectibles';
import {
  buildBlockedGuestTrialNotice,
  canOpenDesktopPhoneMenu,
  getPortraitPhoneLockMessage,
  isDesktopPhoneShortcutKey,
  isPreviewPhoneMenuUnlocked,
  resolveCityLaunchDestination,
  resolveDesktopPhoneShellRequest,
  shouldDeferLandscapeLaunch,
  shouldDeferPhoneShellClose,
} from './cityPhaserPreviewHelpers';
import {
  APARTMENT_CITY_ENTRY_STATE_PARAM,
  APARTMENT_CITY_ENTRY_STATE_HUB,
  APARTMENT_CITY_ENTRY_STATE_INTRO,
} from '../../utils/navigation/apartmentEntryState';
import {
  normalizeMobileControlSide,
  readMobileControlSide,
  writeMobileControlSide,
} from '../../utils/mobile/mobileControlSide';
import {
  FULLSCREEN_INTENT_EVENT,
  isFullscreenActive,
  readFullscreenIntent,
  restoreFullscreenFromIntent,
} from '../../utils/mobile/fullscreenState';
import { api } from '../../services/api';
import { buildPreviewEntryState } from './cityPreviewEntryState';
import phaserInstanceManager from '../../utils/phaser/PhaserInstanceManager';
import { prebootPhaserInstance } from '../../utils/phaser/PhaserBackgroundPreloader';
import {
  INTRO_CITY_UNCROPPED_STRIP,
  MAP_ASSET_PATH,
} from '../../city-phaser/district01/apartmentPreviewScene.constants';
import resolveStableViewportSize from '../../city-phaser/district01/previewViewportSizing';
import { WINDOW_VIEW_SIGN_FRAME_SOURCES } from './CityPhaserPreviewBackdropSigns.config';
import { preloadImageSources } from './CityPhaserPreviewBackdropSigns.utils';

const PREVIEW_DEBUG_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_CITY_PHASER_DEBUG === 'true';
const PREVIEW_INPUT_TRACE_ENABLED = import.meta.env.MODE === 'test';
const WINDOW_VIEW_VISUAL_SOURCES = [];
const phaserPreviewModulesPromise = Promise.all([
  import('phaser'),
  import('../../city-phaser/district01/createApartmentPreviewScene'),
]);

const readPreviewContainerSize = (element) => {
  if (!element) {
    return null;
  }

  const containerRect = element.getBoundingClientRect?.();

  return {
    height: Number(containerRect?.height || element.clientHeight || 0),
    width: Number(containerRect?.width || element.clientWidth || 0),
  };
};

const getTraceTagName = (target) => {
  const resolvedTagName = String(target?.tagName || target?.nodeName || '')
    .trim()
    .toLowerCase();

  return resolvedTagName || 'window';
};

const buildPreviewInputTraceSnapshot = ({
  activeElementTag = typeof document === 'undefined'
    ? 'unknown'
    : getTraceTagName(document.activeElement),
  capsLock = false,
  code = '',
  defaultPreventedBeforeHandler = false,
  documentHasFocus = typeof document === 'undefined' ? false : document.hasFocus(),
  eventType = 'idle',
  key = '',
  note = '',
  repeat = false,
  sceneDirection = null,
  sceneReceived = false,
  shiftKey = false,
  targetTag = 'window',
}) => ({
  activeElementTag,
  capsLock,
  code,
  defaultPreventedBeforeHandler,
  documentHasFocus,
  eventType,
  key,
  note,
  repeat,
  sceneDirection,
  sceneReceived,
  shiftKey,
  targetTag,
});

function CityPhaserPreviewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const { isLoading: isStoryStateLoading, storyState } = useCityStoryState();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);
  const phaserGameRef = useRef(null);
  const touchControlsRef = useRef({
    activeDirections: {},
    interactRequestedAt: 0,
  });
  const [activeShellRequest, setActiveShellRequest] = useState(null);
  const [activeLaunchExperience, setActiveLaunchExperience] = useState(null);
  const [pendingLandscapeLaunchRequest, setPendingLandscapeLaunchRequest] = useState(null);
  const [activeTouchDirections, setActiveTouchDirections] = useState({});
  const [bootPhase, setBootPhase] = useState('route');
  const [bootError, setBootError] = useState('');
  const [isBootOverlayDismissed, setIsBootOverlayDismissed] = useState(false);
  const [areWindowViewVisualAssetsLoaded, setAreWindowViewVisualAssetsLoaded] = useState(
    () => typeof window === 'undefined'
  );
  const [previewCollectibleModalState, setPreviewCollectibleModalState] = useState(null);
  const [previewInteractionState, setPreviewInteractionState] = useState(null);
  const [previewHudState, setPreviewHudState] = useState(null);
  const [previewInputTrace, setPreviewInputTrace] = useState(() =>
    buildPreviewInputTraceSnapshot({
      eventType: 'idle',
      note: 'Press a desktop key in the preview.',
    })
  );
  const [cityBackdropAnimationTickMs, setCityBackdropAnimationTickMs] = useState(0);
  const [isKeyboardHelpDismissed, setIsKeyboardHelpDismissed] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => resolveStableViewportSize());
  const [isOrientationPhoneMenuDismissed, setIsOrientationPhoneMenuDismissed] = useState(false);
  const [pendingPhoneReturnToGame, setPendingPhoneReturnToGame] = useState(false);
  const [previewMusicUnlockRequired, setPreviewMusicUnlockRequired] = useState(false);
  const [phoneGameSettings, setPhoneGameSettings] = useState(() => {
    const audioSettings = audioManager.getSettings?.() || {};

    return {
      controlSide: normalizeMobileControlSide(readMobileControlSide()),
      hudEnabled: true,
      musicEnabled: audioSettings.musicEnabled !== false,
      musicVolume:
        Number.isFinite(audioSettings.musicVolume) && audioSettings.musicVolume >= 0
          ? audioSettings.musicVolume
          : 0.5,
      routeGuideEnabled: true,
    };
  });
  const [phoneCurrentTrack, setPhoneCurrentTrack] = useState(
    () => audioService.getCurrentTrack?.() || null
  );
  const [phoneSelectedTrackId, setPhoneSelectedTrackId] = useState(
    () => audioService.getCurrentTrack?.()?.id || 'midnight-run'
  );
  const [phoneAvailableTracks, setPhoneAvailableTracks] = useState(
    () => audioService.getAllMusicTracks?.() || []
  );
  const [fullscreenActive, setFullscreenActive] = useState(() => isFullscreenActive());
  const [fullscreenPreferred, setFullscreenPreferred] = useState(() => readFullscreenIntent());
  const requestedApartmentState = searchParams.get(APARTMENT_CITY_ENTRY_STATE_PARAM);
  const rawRequestedEntry = searchParams.get('entry');
  const requestedEntry = rawRequestedEntry ? rawRequestedEntry.replace(/_/g, '-') : null;
  const requestedSelectedTrack = searchParams.get('track');
  const requestedSelectedLearningPath =
    searchParams.get('learningPath') || searchParams.get('trialLearningPath');
  const isMobileDevice = useIsMobileDevice();
  const responsiveProfile = useResponsiveProfile();
  const activeShellRequestRef = useRef(null);
  const areCityVistaVisualsReadyRef = useRef(false);
  const isMobileDeviceRef = useRef(isMobileDevice);
  const isPortraitViewportRef = useRef(responsiveProfile.isPortraitViewport);
  const previewHudStateRef = useRef(previewHudState);
  const previewWorldStateRef = useRef(null);
  const viewportSizeRef = useRef(viewportSize);
  const wasMovementControlsObjectiveRef = useRef(false);
  const hasAttemptedPreviewMusicStartRef = useRef(false);
  const ownedCityCollectibleSlugsRef = useRef([]);
  const phoneGameSettingsRef = useRef(phoneGameSettings);

  activeShellRequestRef.current = activeShellRequest;
  isMobileDeviceRef.current = isMobileDevice;
  isPortraitViewportRef.current = responsiveProfile.isPortraitViewport;
  previewHudStateRef.current = previewHudState;
  viewportSizeRef.current = viewportSize;
  phoneGameSettingsRef.current = phoneGameSettings;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncTrack = (track) => {
      const resolvedTrack = track || audioService.getCurrentTrack?.() || null;

      setPhoneCurrentTrack(resolvedTrack);
      if (resolvedTrack?.id) {
        setPhoneSelectedTrackId(resolvedTrack.id);
      }
    };

    const handleTrackChange = (event) => {
      syncTrack(event.detail || null);
    };

    setPhoneAvailableTracks(audioService.getAllMusicTracks?.() || []);
    syncTrack(audioService.getCurrentTrack?.() || null);
    window.addEventListener('td-track-changed', handleTrackChange);

    return () => {
      window.removeEventListener('td-track-changed', handleTrackChange);
    };
  }, []);

  const replaceOwnedCityCollectibleSlugs = useCallback((nextSlugs) => {
    ownedCityCollectibleSlugsRef.current = [
      ...new Set(
        (Array.isArray(nextSlugs) ? nextSlugs : []).filter(
          (slug) => typeof slug === 'string' && CITY_PREVIEW_COLLECTIBLE_STORE_SLUGS.has(slug)
        )
      ),
    ];
  }, []);

  const addOwnedCityCollectibleSlug = useCallback((nextSlug) => {
    if (typeof nextSlug !== 'string' || !CITY_PREVIEW_COLLECTIBLE_STORE_SLUGS.has(nextSlug)) {
      return;
    }

    if (ownedCityCollectibleSlugsRef.current.includes(nextSlug)) {
      return;
    }

    ownedCityCollectibleSlugsRef.current = [...ownedCityCollectibleSlugsRef.current, nextSlug];
  }, []);

  const isStoryStateReady = !isAuthenticated || !isStoryStateLoading;

  const funnel = useGuestFunnel();
  const mountTimeRef = useRef(null);
  const loadingStartedRef = useRef(false);

  useEffect(() => {
    // Fire telemetry exactly when the Page component renders
    funnel.postPathUiRendered({ source: 'city_page_mount' });
  }, [funnel]);

  useEffect(() => {
    if (!isStoryStateReady) return;
    if (loadingStartedRef.current) return;
    loadingStartedRef.current = true;
    mountTimeRef.current = performance.now();
    funnel.demoLoadingStarted('full');
  }, [isStoryStateReady, funnel]);

  const { apartmentShellId, guestPhoneContext, resolvedApartmentState } = useMemo(() => {
    let storedGuestProgress = guestCtx;

    if (!storedGuestProgress) {
      try {
        storedGuestProgress = JSON.parse(
          readStorage('localStorage', 'codegrind_guest_progress') || '{}'
        );
      } catch {
        storedGuestProgress = {};
      }
    }

    return buildPreviewEntryState({
      isAuthenticated,
      isMobileDevice,
      requestedApartmentState,
      requestedSelectedLearningPath,
      requestedSelectedTrack,
      storyState,
      storedGuestProgress,
    });
  }, [
    isAuthenticated,
    isMobileDevice,
    requestedApartmentState,
    requestedSelectedLearningPath,
    requestedSelectedTrack,
    storyState,
    guestCtx,
  ]);

  const resolveLaunchDestination = useCallback(
    (launchRequest) => resolveCityLaunchDestination(launchRequest),
    []
  );

  const startLaunchProgram = useCallback(
    (launchRequest) => {
      setActiveLaunchExperience((currentExperience) => {
        if (currentExperience) {
          return currentExperience;
        }

        const screenNode = document.querySelector('[data-city-shell-monitor-screen="true"]');
        const screenRect = screenNode?.getBoundingClientRect?.();
        const launchDestination = resolveLaunchDestination(launchRequest);

        return {
          experienceId: `${launchRequest?.programId || 'codegrind'}-${Date.now()}`,
          programId: launchRequest?.programId || 'codegrind.exe',
          targetPath: launchDestination.targetPath,
          targetLaunchRequest: launchDestination.targetLaunchRequest,
          sourceRect: screenRect
            ? {
                height: screenRect.height,
                left: screenRect.left,
                top: screenRect.top,
                width: screenRect.width,
              }
            : null,
        };
      });
    },
    [resolveLaunchDestination]
  );

  const handleLaunchProgram = useCallback(
    async (launchRequest) => {
      await restoreFullscreenFromIntent();

      if (
        shouldDeferLandscapeLaunch({
          isMobileDevice: isMobileDeviceRef.current,
          isPortraitViewport: isPortraitViewportRef.current,
          request: launchRequest,
        })
      ) {
        setPendingLandscapeLaunchRequest(launchRequest);
        return;
      }

      setPendingLandscapeLaunchRequest(null);
      startLaunchProgram(launchRequest);
    },
    [startLaunchProgram]
  );

  const handleReturnToSite = useCallback(async () => {
    setPendingLandscapeLaunchRequest(null);
    setPendingPhoneReturnToGame(false);
    setActiveLaunchExperience(null);
    setActiveShellRequest(null);

    await restoreFullscreenFromIntent();
    navigate('/');
  }, [navigate]);

  const handleRestoreFullscreen = useCallback(async () => {
    const success = await restoreFullscreenFromIntent();

    if (success || toast.isActive('city-preview-fullscreen-unavailable')) {
      return;
    }

    toast({
      id: 'city-preview-fullscreen-unavailable',
      title: 'Fullscreen unavailable',
      description: 'This browser would not restore fullscreen for the safehouse.',
      duration: 3200,
      isClosable: true,
      position: 'top',
      status: 'info',
    });
  }, [toast]);

  const handleSetWaypoint = useCallback((waypoint) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(APARTMENT_PREVIEW_SET_WAYPOINT_EVENT, {
        detail: waypoint ?? null,
      })
    );
  }, []);

  const closeActiveShell = useCallback(() => {
    const currentRequest = activeShellRequestRef.current;

    setPendingPhoneReturnToGame(false);
    setIsOrientationPhoneMenuDismissed(currentRequest?.requestSource === 'orientation-phone-menu');
    setActiveShellRequest(null);
  }, []);

  const resumePreviewMusic = useCallback(() => {
    const didResume = audioManager.resumePendingAutoplay?.() === true;

    if (didResume) {
      setPreviewMusicUnlockRequired(false);
      return true;
    }

    const currentTrackId =
      phoneSelectedTrackId ||
      phoneCurrentTrack?.id ||
      audioService.getCurrentTrack?.()?.id ||
      'midnight-run';

    void audioService
      .playBackgroundMusic('default', currentTrackId)
      .then((started) => {
        setPreviewMusicUnlockRequired(started === false && audioManager.getSettings().musicEnabled);
      })
      .catch(() => {});

    return false;
  }, [phoneCurrentTrack?.id, phoneSelectedTrackId]);

  const dismissKeyboardHelp = useCallback(() => {
    setIsKeyboardHelpDismissed(true);
  }, []);

  const handlePhoneControlSideChange = useCallback((nextSide) => {
    const normalizedSide = normalizeMobileControlSide(nextSide);

    writeMobileControlSide(normalizedSide);
    setPhoneGameSettings((currentSettings) =>
      currentSettings.controlSide === normalizedSide
        ? currentSettings
        : {
            ...currentSettings,
            controlSide: normalizedSide,
          }
    );
  }, []);

  const handlePhoneMusicToggle = useCallback(() => {
    const currentSettings = phoneGameSettingsRef.current;
    const nextSettings = {
      ...currentSettings,
      musicEnabled: !currentSettings.musicEnabled,
    };

    phoneGameSettingsRef.current = nextSettings;
    setPhoneGameSettings(nextSettings);
    audioManager.updateMusicSettings(nextSettings.musicEnabled, nextSettings.musicVolume);

    if (!nextSettings.musicEnabled) {
      setPreviewMusicUnlockRequired(false);
      audioService.stopBackgroundMusic();
      return;
    }

    if (audioManager.resumePendingAutoplay?.() === true) {
      setPreviewMusicUnlockRequired(false);
      return;
    }

    const currentTrackId =
      phoneSelectedTrackId ||
      phoneCurrentTrack?.id ||
      audioService.getCurrentTrack?.()?.id ||
      'midnight-run';

    void audioService
      .playBackgroundMusic('default', currentTrackId)
      .then((started) => {
        setPreviewMusicUnlockRequired(started === false && audioManager.getSettings().musicEnabled);
      })
      .catch(() => {});
  }, [phoneCurrentTrack?.id, phoneSelectedTrackId]);

  const handlePhoneMusicVolumeChange = useCallback((nextVolume) => {
    const normalizedVolume = Math.min(Math.max(Number(nextVolume) || 0, 0), 1);
    const currentSettings = phoneGameSettingsRef.current;
    const nextSettings = {
      ...currentSettings,
      musicVolume: normalizedVolume,
    };

    phoneGameSettingsRef.current = nextSettings;
    setPhoneGameSettings(nextSettings);
    audioManager.updateMusicSettings(nextSettings.musicEnabled, normalizedVolume);
  }, []);

  const handlePhoneTrackSelect = useCallback(
    (trackId) => {
      const nextTrackId = typeof trackId === 'string' ? trackId.trim() : '';

      if (!nextTrackId) {
        return;
      }

      const selectedTrack =
        audioService.findTrackById?.(nextTrackId) ||
        phoneAvailableTracks.find((track) => track.id === nextTrackId) ||
        null;

      setPhoneSelectedTrackId(nextTrackId);
      setPhoneCurrentTrack(selectedTrack);

      if (!phoneGameSettingsRef.current.musicEnabled) {
        return;
      }

      void audioService
        .playBackgroundMusic('default', nextTrackId)
        .then((started) => {
          setPreviewMusicUnlockRequired(
            started === false && audioManager.getSettings().musicEnabled
          );
        })
        .catch(() => {});
    },
    [phoneAvailableTracks]
  );

  const handlePhoneHudToggle = useCallback(() => {
    setPhoneGameSettings((currentSettings) => {
      const nextSettings = {
        ...currentSettings,
        hudEnabled: currentSettings.hudEnabled === false,
      };

      phoneGameSettingsRef.current = nextSettings;
      return nextSettings;
    });
  }, []);

  const handlePhoneRouteGuideToggle = useCallback(() => {
    setPhoneGameSettings((currentSettings) => {
      const nextSettings = {
        ...currentSettings,
        routeGuideEnabled: currentSettings.routeGuideEnabled === false,
      };

      phoneGameSettingsRef.current = nextSettings;
      return nextSettings;
    });
  }, []);

  const handlePreviewCollectibleClaim = useCallback(
    async ({ collectibleId }) => {
      const collectible = getCityPreviewCollectibleById(collectibleId);
      const collectibleLabel = collectible?.displayName || 'Collectible';

      if (!isAuthenticated) {
        if (!toast.isActive('city-collectible-auth-required')) {
          toast({
            id: 'city-collectible-auth-required',
            title: `Sign up to claim ${collectibleLabel}`,
            description:
              'Guests can spot district collectibles, but only registered accounts can add them to the collection.',
            duration: 4500,
            isClosable: true,
            position: 'top',
            status: 'info',
          });
        }

        return { ok: false, requiresAuth: true };
      }

      try {
        const result = await api.city.claimCollectible({ collectibleId });
        if (result?.collectible?.slug) {
          addOwnedCityCollectibleSlug(result.collectible.slug);
        }

        const isAlreadyOwned = result?.alreadyOwned === true;
        toast({
          id: `city-collectible-${collectibleId}`,
          title: isAlreadyOwned
            ? `${collectibleLabel} already collected`
            : `${collectibleLabel} collected`,
          description: isAlreadyOwned
            ? `${collectibleLabel} is already in your District 01 collection.`
            : `${collectibleLabel} has been added to your District 01 collection.${result?.dataPackets?.amount ? ` ${result.dataPackets.amount} Data Packets added.` : ''}`,
          duration: 4200,
          isClosable: true,
          position: 'top',
          status: isAlreadyOwned ? 'info' : 'success',
        });

        return {
          ...result,
          ok: true,
        };
      } catch {
        toast({
          id: `city-collectible-${collectibleId}-error`,
          title: 'Collectible claim failed',
          description: 'The collectible did not stick. Try again in a moment.',
          duration: 4200,
          isClosable: true,
          position: 'top',
          status: 'error',
        });

        return { ok: false, error: 'claim_failed' };
      }
    },
    [addOwnedCityCollectibleSlug, isAuthenticated, toast]
  );

  const handleBlockedInteraction = useCallback(
    (detail) => {
      const notice = buildBlockedGuestTrialNotice(detail);

      if (!notice) {
        return;
      }

      if (toast.isActive(notice.id)) {
        return;
      }

      toast({
        description: notice.description,
        duration: 4500,
        id: notice.id,
        isClosable: true,
        position: 'top',
        status: 'info',
        title: notice.title,
      });
    },
    [toast]
  );

  const handleCloseCollectibleModal = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_CLOSE_COLLECTIBLE_EVENT));
  }, []);

  const handleCollectCollectible = useCallback(
    (collectibleId) => {
      if (typeof window === 'undefined' || !isAuthenticated) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(APARTMENT_PREVIEW_COLLECTIBLE_COLLECT_EVENT, {
          detail: { collectibleId },
        })
      );
    },
    [isAuthenticated]
  );

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      replaceOwnedCityCollectibleSlugs([]);
      return () => {
        cancelled = true;
      };
    }

    void api.store
      .getInventory()
      .then((inventoryPayload) => {
        if (cancelled) {
          return;
        }

        const ownedSlugs = (
          Array.isArray(inventoryPayload?.inventory) ? inventoryPayload.inventory : []
        )
          .map((inventoryRow) => inventoryRow?.item?.slug)
          .filter((slug) => typeof slug === 'string');

        replaceOwnedCityCollectibleSlugs(ownedSlugs);
      })
      .catch(() => {
        if (!cancelled) {
          replaceOwnedCityCollectibleSlugs([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, replaceOwnedCityCollectibleSlugs]);

  const handleCloseShell = useCallback(() => {
    const currentRequest = activeShellRequestRef.current;

    if (
      shouldDeferPhoneShellClose({
        isMobileDevice: isMobileDeviceRef.current,
        isPortraitViewport: isPortraitViewportRef.current,
        request: currentRequest,
      })
    ) {
      setPendingPhoneReturnToGame(true);
      return;
    }

    closeActiveShell();
  }, [closeActiveShell]);

  const openShellFromRequest = useCallback(
    (request) => {
      if (!request) {
        return;
      }

      setPendingPhoneReturnToGame(false);
      setActiveShellRequest({
        ...request,
        deviceClass: request?.deviceClass || (isMobileDevice ? 'phone' : 'desktop'),
        guestPhoneContext,
        onLaunchProgram: handleLaunchProgram,
        onSetWaypoint: handleSetWaypoint,
        onRequestClose: handleCloseShell,
        onReturnToSite: handleReturnToSite,
        ownedCityCollectibleSlugs: ownedCityCollectibleSlugsRef.current,
        previewHudState: previewHudStateRef.current,
        previewWorldState: previewWorldStateRef.current,
        requestId: `${request?.shellId || 'device-shell'}-${Date.now()}`,
      });
    },
    [
      guestPhoneContext,
      handleCloseShell,
      handleLaunchProgram,
      handleReturnToSite,
      handleSetWaypoint,
      isMobileDevice,
    ]
  );

  const openDesktopPhoneShell = useCallback(() => {
    const nextRequest = resolveDesktopPhoneShellRequest({
      previewInteractionState,
      resolvedApartmentState,
    });

    if (!nextRequest) {
      return;
    }

    openShellFromRequest({
      ...nextRequest,
      deviceClass: 'desktop',
    });
  }, [openShellFromRequest, previewInteractionState, resolvedApartmentState]);

  const openHandheldPhoneShell = useCallback(() => {
    const isUnlocked =
      resolvedApartmentState === APARTMENT_CITY_ENTRY_STATE_HUB ||
      isPreviewPhoneMenuUnlocked(previewInteractionState);

    if (!isUnlocked) {
      return;
    }

    openShellFromRequest({
      deviceClass: 'phone',
      requestSource: 'mobile-phone-button',
      shellId: apartmentShellId,
      terminalInstanceId: 'city-handheld-phone-shell',
      terminalName: 'Port Meridian Field Device',
      terminalZoneName: previewInteractionState?.terminalZoneName || null,
    });
  }, [apartmentShellId, openShellFromRequest, previewInteractionState, resolvedApartmentState]);

  const setTouchDirections = useCallback((nextDirections) => {
    touchControlsRef.current.activeDirections = nextDirections;
    setActiveTouchDirections(nextDirections);
  }, []);

  const handleTouchDirectionStart = useCallback(
    (direction) => {
      const currentDirections = touchControlsRef.current.activeDirections || {};
      if (currentDirections[direction]) {
        return;
      }

      setTouchDirections({
        ...currentDirections,
        [direction]: true,
      });
    },
    [setTouchDirections]
  );

  const handleTouchDirectionEnd = useCallback(
    (direction) => {
      const currentDirections = touchControlsRef.current.activeDirections || {};
      if (!currentDirections[direction]) {
        return;
      }

      const nextDirections = { ...currentDirections };
      delete nextDirections[direction];
      setTouchDirections(nextDirections);
    },
    [setTouchDirections]
  );

  const handleTouchInteract = useCallback(() => {
    touchControlsRef.current.interactRequestedAt = Date.now();
  }, []);

  const handleCloseWindowView = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(APARTMENT_PREVIEW_CLOSE_WINDOW_VIEW_EVENT));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    void phaserPreviewModulesPromise;
    void import('../../city-phaser/district01/loadExternalTiledMap')
      .then(({ loadExternalTiledMap }) => loadExternalTiledMap(MAP_ASSET_PATH))
      .catch(() => {});

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let cancelled = false;

    setAreWindowViewVisualAssetsLoaded(false);
    void preloadImageSources(WINDOW_VIEW_VISUAL_SOURCES).then((isLoaded) => {
      if (cancelled) {
        return;
      }

      setAreWindowViewVisualAssetsLoaded(isLoaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Gentle, non-blocking prefetch of the animated sign frames to warm the browser cache without blocking the boot sequence.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let cancelled = false;

    const prefetchSignFrames = async () => {
      const batchSize = 3;
      const urls = WINDOW_VIEW_SIGN_FRAME_SOURCES;

      for (let i = 0; i < urls.length; i += batchSize) {
        if (cancelled) {
          break;
        }

        const batch = urls.slice(i, i + batchSize);
        await Promise.all(
          batch.map((url) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve(); // continue on error
              img.src = url;
            });
          })
        );
      }
    };

    void prefetchSignFrames();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isStoryStateReady) {
      return undefined;
    }

    let destroyed = false;
    let phaserGame = null;
    const containerElement = containerRef.current;
    const originalBodyOverflow = document.body.style.overflow;
    const hiddenNodeState = new Map();
    const mountToReadyLabel = '[CityPhaserPreviewPage] ⏱ Mount-to-ready total';
    console.time(mountToReadyLabel);

    const hideRecaptchaNodes = () => {
      const recaptchaNodes = document.querySelectorAll(
        '.grecaptcha-badge, iframe[title*="reCAPTCHA"], iframe[src*="recaptcha"]'
      );

      recaptchaNodes.forEach((node) => {
        if (!hiddenNodeState.has(node)) {
          hiddenNodeState.set(node, {
            display: node.style.display,
            visibility: node.style.visibility,
          });
        }

        node.style.display = 'none';
        node.style.visibility = 'hidden';
      });
    };

    document.body.style.overflow = 'hidden';
    hideRecaptchaNodes();

    const observer = new MutationObserver(() => {
      hideRecaptchaNodes();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const handleShellOpenEvent = (event) => {
      openShellFromRequest(event.detail);
    };

    const handlePreviewReady = () => {
      if (destroyed) {
        return;
      }

      setBootPhase('ready');
      console.timeEnd(mountToReadyLabel);

      let latency = null;
      if (mountTimeRef.current !== null) {
        latency = Math.round(performance.now() - mountTimeRef.current);
      }
      funnel.demoStarted('full', latency !== null ? { durationMs: String(latency) } : {});
    };

    const handlePreviewError = (event) => {
      if (destroyed) {
        return;
      }

      const message =
        typeof event?.detail?.message === 'string' && event.detail.message.trim()
          ? event.detail.message.trim()
          : 'Unable to boot Phaser preview.';

      setBootError(message);
      setBootPhase('error');
    };

    const handlePreviewHudState = (event) => {
      if (destroyed) {
        return;
      }

      setPreviewHudState(event?.detail ?? null);
    };

    const handlePreviewCollectibleModalState = (event) => {
      if (destroyed) {
        return;
      }

      setPreviewCollectibleModalState(event?.detail ?? null);
    };

    const handlePreviewInteractionState = (event) => {
      if (destroyed) {
        return;
      }

      setPreviewInteractionState(event?.detail ?? null);
    };

    const handlePreviewWorldState = (event) => {
      if (destroyed) {
        return;
      }

      previewWorldStateRef.current = event?.detail ?? null;
    };

    const handlePreviewInputTrace = (event) => {
      if (destroyed || !PREVIEW_INPUT_TRACE_ENABLED) {
        return;
      }

      setPreviewInputTrace(buildPreviewInputTraceSnapshot(event?.detail ?? {}));
    };

    window.addEventListener(DEVICE_SHELL_OPEN_EVENT, handleShellOpenEvent);
    window.addEventListener(APARTMENT_PREVIEW_READY_EVENT, handlePreviewReady);
    window.addEventListener(APARTMENT_PREVIEW_ERROR_EVENT, handlePreviewError);
    window.addEventListener(
      APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT,
      handlePreviewCollectibleModalState
    );
    window.addEventListener(APARTMENT_PREVIEW_HUD_STATE_EVENT, handlePreviewHudState);
    window.addEventListener(APARTMENT_PREVIEW_INPUT_TRACE_EVENT, handlePreviewInputTrace);
    window.addEventListener(
      APARTMENT_PREVIEW_INTERACTION_STATE_EVENT,
      handlePreviewInteractionState
    );
    window.addEventListener(APARTMENT_PREVIEW_WORLD_STATE_EVENT, handlePreviewWorldState);

    const bootPreview = async () => {
      try {
        setBootPhase('runtime');
        setBootError('');

        // If no prebooted game instance exists, kick off the shared preboot
        // mechanism so it warms up Phaser + the apartment scene modules in the
        // hidden container. This ensures we hit the isReusingInstance fast path
        // below instead of cold-booting from scratch.
        if (!phaserInstanceManager.gameInstance) {
          await prebootPhaserInstance();
        }

        const [{ default: Phaser }, { createApartmentPreviewScene }] =
          await phaserPreviewModulesPromise;

        if (destroyed || !containerElement) {
          return;
        }

        const ApartmentPreviewScene = createApartmentPreviewScene(Phaser);
        const initialViewportSize = resolveStableViewportSize({
          containerSize: readPreviewContainerSize(containerElement),
          previousSize: viewportSizeRef.current,
        });
        const viewportWidth = initialViewportSize.width;
        const viewportHeight = initialViewportSize.height;
        const previewBridge = {
          apartmentEntryState: resolvedApartmentState,
          apartmentShellId,
          entry: requestedEntry,
          getOwnedCollectibleSlugs: () => ownedCityCollectibleSlugsRef.current,
          getPhoneGameSettings: () => phoneGameSettingsRef.current,
          guestPhoneContext,
          isCityVistaVisualsReady: () => areCityVistaVisualsReadyRef.current,
          onBlockedInteraction: handleBlockedInteraction,
          onCollectibleClaim: handlePreviewCollectibleClaim,
          onLaunchProgram: handleLaunchProgram,
          onShellRequestOpen: openShellFromRequest,
          previewDeviceClass: isMobileDevice ? 'phone' : 'desktop',
          showCollisionDebug: PREVIEW_DEBUG_ENABLED,
          touchControlsState: touchControlsRef.current,
          trackFunnelEvent: (eventName, metadata = {}) => {
            if (typeof funnel[eventName] === 'function') {
              funnel[eventName](metadata);
            }
          },
        };

        if (!containerElement.id) {
          containerElement.id = 'city-phaser-preview-container';
        }

        const isReusingInstance = Boolean(phaserInstanceManager.gameInstance);

        phaserGame = phaserInstanceManager.getInstance(Phaser, {
          backgroundColor: '#070b12',
          callbacks: {
            preBoot: (game) => {
              game.registry.set(APARTMENT_PREVIEW_BRIDGE_KEY, previewBridge);
            },
          },
          height: viewportHeight,
          parent: containerElement.id,
          physics: {
            arcade: {
              debug: PREVIEW_DEBUG_ENABLED,
              gravity: { y: 0 },
            },
            default: 'arcade',
          },
          pixelArt: true,
          scale: {
            height: viewportHeight,
            mode: Phaser.Scale.RESIZE,
            width: viewportWidth,
            min: {
              width: 16,
              height: 16,
            },
          },
          scene: [ApartmentPreviewScene],
          type: Phaser.AUTO,
          width: viewportWidth,
        });

        try {
          phaserGame.registry.set(APARTMENT_PREVIEW_BRIDGE_KEY, previewBridge);
          phaserInstanceManager.resumeGame();
          phaserInstanceManager.resumeScene('ApartmentPreviewScene');
        } catch (err) {
          console.warn(
            '[CityPhaserPreviewPage] WebGL crash caught on resume. Rebuilding Phaser instance:',
            err
          );
          // Fire crash telemetry
          funnel.webglContextLost({ context: 'resume_catch_rebuild' });
          // Destroy corrupt instance
          try {
            phaserInstanceManager.pauseGame();
            if (phaserInstanceManager.gameInstance) {
              phaserInstanceManager.gameInstance.destroy(true);
            }
          } catch {
            // Ignored
          }
          phaserInstanceManager.gameInstance = null;
          // Re-initialize a fresh instance cleanly
          phaserGame = phaserInstanceManager.getInstance(Phaser, {
            backgroundColor: '#070b12',
            callbacks: {
              preBoot: (game) => {
                game.registry.set(APARTMENT_PREVIEW_BRIDGE_KEY, previewBridge);
              },
            },
            height: viewportHeight,
            parent: containerElement.id,
            physics: {
              arcade: {
                debug: PREVIEW_DEBUG_ENABLED,
                gravity: { y: 0 },
              },
              default: 'arcade',
            },
            pixelArt: true,
            scale: {
              height: viewportHeight,
              mode: Phaser.Scale.RESIZE,
              width: viewportWidth,
              min: {
                width: 16,
                height: 16,
              },
            },
            scene: [ApartmentPreviewScene],
            type: Phaser.AUTO,
            width: viewportWidth,
          });
          phaserGame.registry.set(APARTMENT_PREVIEW_BRIDGE_KEY, previewBridge);
          phaserInstanceManager.resumeGame();
          phaserInstanceManager.resumeScene('ApartmentPreviewScene');
        }

        // If reusing a background-prebooted instance, clear the background flag so
        // any remaining yieldToMain() calls in the scene's bootstrap use requestAnimationFrame
        // instead of 100ms sleeps, speeding up the residual bootstrap.
        if (phaserGame?.config?.isBackgroundPreboot) {
          phaserGame.config.isBackgroundPreboot = false;
        }

        const activeScene =
          phaserGame.scene && typeof phaserGame.scene.getScene === 'function'
            ? phaserGame.scene.getScene('ApartmentPreviewScene')
            : null;
        const isInstanceFullyReady = isReusingInstance && activeScene && activeScene.isSceneReady;
        if (isInstanceFullyReady) {
          setBootPhase('ready');
          if (activeScene) {
            if (typeof activeScene.syncPlayerCharacter === 'function') {
              await activeScene.syncPlayerCharacter();
            }

            // Guard against async unmount races that happen during character sync
            if (destroyed) {
              return;
            }

            if (typeof activeScene.syncInteractionZones === 'function') {
              activeScene.syncInteractionZones();
            }

            if (activeScene.game?.config?.isBackgroundPreboot) {
              activeScene.game.config.isBackgroundPreboot = false;
            }

            activeScene.input.enabled = true;
            if (activeScene.input.keyboard) {
              activeScene.input.keyboard.enabled = true;
            }

            if (typeof activeScene.configureInput === 'function') {
              activeScene.configureInput();
            }

            const shouldPlayIntro =
              typeof activeScene.shouldPlayIntroSequence === 'function' &&
              activeScene.shouldPlayIntroSequence();

            if (shouldPlayIntro) {
              if (
                activeScene.isIntroSequenceActive &&
                typeof activeScene.forceSyncBridgeStates === 'function'
              ) {
                activeScene.forceSyncBridgeStates();
              } else if (typeof activeScene.startIntroSequence === 'function') {
                activeScene.startIntroSequence(true);
              }
            } else {
              if (typeof activeScene.enterPlayablePreviewState === 'function') {
                activeScene.enterPlayablePreviewState();
              } else {
                if (typeof activeScene.syncObjectiveHudState === 'function') {
                  activeScene.syncObjectiveHudState();
                }
                if (typeof activeScene.syncInteractionContext === 'function') {
                  activeScene.syncInteractionContext();
                }
                if (typeof activeScene.syncPreviewWorldState === 'function') {
                  activeScene.syncPreviewWorldState(true);
                }
              }
            }

            if (typeof activeScene.forceSyncBridgeStates === 'function') {
              activeScene.forceSyncBridgeStates();
            }
          }
        } else if (isReusingInstance && activeScene && !activeScene.isSceneReady) {
          // Background prebooted the instance but the scene is still bootstrapping.
          // Show loading overlay and poll for scene readiness with a 30s timeout.
          setBootPhase('scene');

          const POLL_INTERVAL_MS = 100;
          const POLL_TIMEOUT_MS = 30000;
          const pollStart = performance.now();
          while (!activeScene.isSceneReady && !destroyed) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            if (performance.now() - pollStart > POLL_TIMEOUT_MS) {
              console.warn(
                '[CityPhaserPreviewPage] Scene failed to become ready within 30s timeout'
              );
              setBootError('Scene initialization timed out.');
              setBootPhase('error');
              return;
            }
          }
          if (destroyed) return;

          // Scene is now ready — run the same full setup as the fully-ready path.
          if (typeof activeScene.syncPlayerCharacter === 'function') {
            await activeScene.syncPlayerCharacter();
          }
          if (destroyed) return;
          if (typeof activeScene.syncInteractionZones === 'function') {
            activeScene.syncInteractionZones();
          }
          activeScene.input.enabled = true;
          if (activeScene.input.keyboard) {
            activeScene.input.keyboard.enabled = true;
          }
          if (typeof activeScene.configureInput === 'function') {
            activeScene.configureInput();
          }

          const shouldPlayIntro =
            typeof activeScene.shouldPlayIntroSequence === 'function' &&
            activeScene.shouldPlayIntroSequence();

          if (shouldPlayIntro) {
            if (
              activeScene.isIntroSequenceActive &&
              typeof activeScene.forceSyncBridgeStates === 'function'
            ) {
              activeScene.forceSyncBridgeStates();
            } else if (typeof activeScene.startIntroSequence === 'function') {
              activeScene.startIntroSequence(true);
            }
          } else {
            if (typeof activeScene.enterPlayablePreviewState === 'function') {
              activeScene.enterPlayablePreviewState();
            } else {
              if (typeof activeScene.syncObjectiveHudState === 'function') {
                activeScene.syncObjectiveHudState();
              }
              if (typeof activeScene.syncInteractionContext === 'function') {
                activeScene.syncInteractionContext();
              }
              if (typeof activeScene.syncPreviewWorldState === 'function') {
                activeScene.syncPreviewWorldState(true);
              }
            }
          }

          if (typeof activeScene.forceSyncBridgeStates === 'function') {
            activeScene.forceSyncBridgeStates();
          }

          setBootPhase('ready');
        } else {
          if (activeScene && typeof activeScene.syncPlayerCharacter === 'function') {
            await activeScene.syncPlayerCharacter();
          }
          setBootPhase((currentPhase) =>
            currentPhase === 'ready' || currentPhase === 'error' ? currentPhase : 'scene'
          );
        }
        phaserGameRef.current = phaserGame;
      } catch (error) {
        if (!destroyed) {
          setBootError(error instanceof Error ? error.message : 'Unable to boot Phaser preview.');
          setBootPhase('error');
        }
      }
    };

    void bootPreview();

    return () => {
      destroyed = true;
      try {
        console.timeEnd(mountToReadyLabel);
      } catch {
        // Ignored
      }

      // Explicitly destroy scene-level Key objects before pausing.
      // Key objects created by scene.input.keyboard.addKey(code, enableCapture=true)
      // register individual DOM keydown listeners that call preventDefault() and persist
      // independently of the global capture array. Phaser's VisibilityHandler can auto-resume
      // the game on any focus event, re-arming those listeners on non-city routes.
      // removeAllKeys(true, true) destroys them and strips their DOM listeners entirely.
      const managedGame = phaserInstanceManager.gameInstance;
      if (managedGame) {
        const activeScene = managedGame.scene?.getScene?.('ApartmentPreviewScene');
        if (activeScene?.input?.keyboard) {
          if (typeof activeScene.input.keyboard.removeAllKeys === 'function') {
            activeScene.input.keyboard.removeAllKeys(true, true);
          }
          if (typeof activeScene.input.keyboard.clearCaptures === 'function') {
            activeScene.input.keyboard.clearCaptures();
          }
          activeScene.input.keyboard.enabled = false;
        }
      }

      // Pause scene and game so the next React mount reuses a clean, ready instance.
      // The Phaser audio context also needs to be paused to avoid Chrome autoplay
      // policy violations on the next resume.
      phaserInstanceManager.pauseScene('ApartmentPreviewScene');
      phaserInstanceManager.pauseGame();
      phaserGameRef.current = null;
      setPreviewCollectibleModalState(null);
      setPreviewInteractionState(null);
      previewWorldStateRef.current = null;
      setPreviewHudState(null);
      observer.disconnect();
      window.removeEventListener(DEVICE_SHELL_OPEN_EVENT, handleShellOpenEvent);
      window.removeEventListener(APARTMENT_PREVIEW_READY_EVENT, handlePreviewReady);
      window.removeEventListener(APARTMENT_PREVIEW_ERROR_EVENT, handlePreviewError);
      window.removeEventListener(
        APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT,
        handlePreviewCollectibleModalState
      );
      window.removeEventListener(APARTMENT_PREVIEW_HUD_STATE_EVENT, handlePreviewHudState);
      window.removeEventListener(APARTMENT_PREVIEW_INPUT_TRACE_EVENT, handlePreviewInputTrace);
      window.removeEventListener(
        APARTMENT_PREVIEW_INTERACTION_STATE_EVENT,
        handlePreviewInteractionState
      );
      window.removeEventListener(APARTMENT_PREVIEW_WORLD_STATE_EVENT, handlePreviewWorldState);
      hiddenNodeState.forEach((styles, node) => {
        node.style.display = styles.display;
        node.style.visibility = styles.visibility;
      });
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [
    apartmentShellId,
    handleBlockedInteraction,
    guestPhoneContext,
    handlePreviewCollectibleClaim,
    handleCollectCollectible,
    handleCloseCollectibleModal,
    handleLaunchProgram,
    isMobileDevice,
    isStoryStateReady,
    openShellFromRequest,
    requestedEntry,
    resolvedApartmentState,
  ]);

  const cityBackdropSourceSize =
    previewInteractionState?.windowViewBackdropSourceSize ||
    previewHudState?.cityBackdropSourceSize ||
    null;
  const cityBackdropRect = useMemo(
    () => getBackdropRect(viewportSize.width, viewportSize.height, cityBackdropSourceSize),
    [cityBackdropSourceSize, viewportSize.height, viewportSize.width]
  );
  const isCityVistaPresentationRequested = Boolean(
    (previewInteractionState?.cityVistaPending &&
      previewInteractionState?.windowViewUsesUncroppedBackdrop) ||
    (previewInteractionState?.windowViewActive &&
      previewInteractionState?.windowViewUsesUncroppedBackdrop) ||
    (previewHudState?.mode === 'intro' &&
      previewHudState?.cityBackdropVisible &&
      previewHudState?.cityBackdropUsesUncropped)
  );
  const canPrimeCityVistaPresentation =
    bootPhase === 'ready' &&
    areWindowViewVisualAssetsLoaded &&
    Boolean(cityBackdropRect) &&
    !bootError;
  const isCityVistaScenePrimed = Boolean(
    ((previewInteractionState?.cityVistaPending || previewInteractionState?.windowViewActive) &&
      previewInteractionState?.windowViewUsesUncroppedBackdrop &&
      previewInteractionState?.cityBackdropPrimed) ||
    (previewHudState?.mode === 'intro' &&
      previewHudState?.cityBackdropVisible &&
      previewHudState?.cityBackdropUsesUncropped &&
      previewHudState?.cityBackdropPrimed)
  );
  const areCityVistaVisualsReady =
    areWindowViewVisualAssetsLoaded &&
    (!isCityVistaPresentationRequested || canPrimeCityVistaPresentation);
  areCityVistaVisualsReadyRef.current = areCityVistaVisualsReady;
  const shouldHoldCityVistaPresentation = Boolean(
    isCityVistaPresentationRequested && (!areCityVistaVisualsReady || !isCityVistaScenePrimed)
  );
  const displayBootPhase =
    bootPhase === 'ready' && shouldHoldCityVistaPresentation && !bootError ? 'scene' : bootPhase;

  useEffect(() => {
    const isOverlayActive = displayBootPhase !== 'ready' || Boolean(bootError);

    if (isOverlayActive) {
      if (isBootOverlayDismissed) {
        setIsBootOverlayDismissed(false);
      }
      return undefined;
    }

    const dismissTimerId = window.setTimeout(() => {
      setIsBootOverlayDismissed(true);
    }, 200);

    return () => {
      window.clearTimeout(dismissTimerId);
    };
  }, [bootError, displayBootPhase, isBootOverlayDismissed]);

  useEffect(() => {
    const phaserGame = phaserGameRef.current;
    if (!phaserGame) {
      return;
    }

    const sceneKey = 'ApartmentPreviewScene';
    const isSceneActive = phaserGame.scene.isActive?.(sceneKey) === true;
    const isScenePaused = phaserGame.scene.isPaused?.(sceneKey) === true;

    if (activeShellRequest || activeLaunchExperience) {
      if (isSceneActive) {
        phaserGame.scene.pause(sceneKey);
        phaserInstanceManager.pauseGame();
      }
      return;
    }

    if (isScenePaused) {
      phaserInstanceManager.resumeGame();
      phaserGame.scene.resume(sceneKey);

      // Re-configure inputs to restore captured keys when returning to the game scene
      const activeScene = phaserGame.scene.getScene(sceneKey);
      if (activeScene) {
        activeScene.input.enabled = true;
        if (activeScene.input.keyboard) {
          activeScene.input.keyboard.enabled = true;
        }
        if (typeof activeScene.configureInput === 'function') {
          activeScene.configureInput();
        }
      }
    }
  }, [activeLaunchExperience, activeShellRequest, bootPhase]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleTrackChange = () => {
      setPreviewMusicUnlockRequired(false);
    };

    window.addEventListener('td-track-changed', handleTrackChange);

    return () => {
      window.removeEventListener('td-track-changed', handleTrackChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }

    const syncFullscreenState = () => {
      setFullscreenActive(isFullscreenActive());
    };

    const syncFullscreenIntent = (event) => {
      const nextPreferred = event?.detail?.preferred;
      if (typeof nextPreferred === 'boolean') {
        setFullscreenPreferred(nextPreferred);
        return;
      }

      setFullscreenPreferred(readFullscreenIntent());
    };

    syncFullscreenState();
    syncFullscreenIntent();
    document.addEventListener('fullscreenchange', syncFullscreenState);
    window.addEventListener(FULLSCREEN_INTENT_EVENT, syncFullscreenIntent);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      window.removeEventListener(FULLSCREEN_INTENT_EVENT, syncFullscreenIntent);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !previewMusicUnlockRequired) {
      return undefined;
    }

    const handleIntroAdvance = () => {
      resumePreviewMusic();
    };

    window.addEventListener(APARTMENT_PREVIEW_ADVANCE_EVENT, handleIntroAdvance);

    return () => {
      window.removeEventListener(APARTMENT_PREVIEW_ADVANCE_EVENT, handleIntroAdvance);
    };
  }, [previewMusicUnlockRequired, resumePreviewMusic]);

  useEffect(() => {
    let active = true;

    audioService
      .initialize()
      .then(() => {
        if (!active) {
          return;
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      setPreviewMusicUnlockRequired(false);
      audioService.stopBackgroundMusic();
    };
  }, []);

  useEffect(() => {
    const shouldStartFromIntroBeat = previewHudState?.mode === 'intro';
    const shouldStartFromPlayableState =
      previewInteractionState?.isIntroSequenceComplete === true &&
      previewInteractionState?.isIntroSequenceActive === false;

    if (!shouldStartFromIntroBeat && !shouldStartFromPlayableState) {
      return undefined;
    }

    if (hasAttemptedPreviewMusicStartRef.current) {
      return undefined;
    }

    hasAttemptedPreviewMusicStartRef.current = true;
    let cancelled = false;

    audioService
      .initialize()
      .then(async () => {
        if (cancelled) {
          return;
        }

        const started = await audioService.playBackgroundMusic(
          'default',
          phoneSelectedTrackId || 'midnight-run'
        );

        if (cancelled) {
          return;
        }

        setPreviewMusicUnlockRequired(started === false && audioManager.getSettings().musicEnabled);
      })
      .catch(() => {
        hasAttemptedPreviewMusicStartRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [phoneSelectedTrackId, previewHudState, previewInteractionState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncViewportSize = () => {
      const containerSize = readPreviewContainerSize(containerRef.current);
      const nextViewportSize = resolveStableViewportSize({
        containerSize,
        previousSize: viewportSizeRef.current,
      });

      setViewportSize((currentViewportSize) => {
        if (
          nextViewportSize.width === currentViewportSize.width &&
          nextViewportSize.height === currentViewportSize.height
        ) {
          return currentViewportSize;
        }

        return nextViewportSize;
      });

      const game = phaserGameRef.current || phaserInstanceManager.gameInstance;
      if (game && nextViewportSize.width > 0 && nextViewportSize.height > 0) {
        game.scale.resize(nextViewportSize.width, nextViewportSize.height);
      }
    };

    const previewContainer = containerRef.current;
    const visualViewport = window.visualViewport || null;
    const resizeObserver =
      typeof ResizeObserver === 'function' && previewContainer
        ? new ResizeObserver(syncViewportSize)
        : null;

    syncViewportSize();
    window.addEventListener('resize', syncViewportSize);
    window.addEventListener('orientationchange', syncViewportSize);
    visualViewport?.addEventListener?.('resize', syncViewportSize);
    resizeObserver?.observe(previewContainer);

    return () => {
      window.removeEventListener('resize', syncViewportSize);
      window.removeEventListener('orientationchange', syncViewportSize);
      visualViewport?.removeEventListener?.('resize', syncViewportSize);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const game = phaserGameRef.current || phaserInstanceManager.gameInstance;
    if (game && viewportSize.width > 0 && viewportSize.height > 0) {
      game.scale.resize(viewportSize.width, viewportSize.height);
    }
  }, [viewportSize]);

  const handleLaunchShellCovered = useCallback(() => {
    setActiveShellRequest(null);
  }, []);

  const shouldRenderBootOverlay =
    displayBootPhase !== 'ready' || Boolean(bootError) || !isBootOverlayDismissed;
  const canRevealCityVista =
    !shouldRenderBootOverlay &&
    bootPhase === 'ready' &&
    !shouldHoldCityVistaPresentation &&
    !bootError;
  const isCollectibleModalOpen = Boolean(previewCollectibleModalState);
  const isWindowViewActive =
    canRevealCityVista && Boolean(previewInteractionState?.windowViewActive);
  const shouldShowCityBackdropSigns =
    canRevealCityVista &&
    Boolean(
      (previewInteractionState?.windowViewActive &&
        previewInteractionState?.windowViewUsesUncroppedBackdrop) ||
      (previewHudState?.mode === 'intro' &&
        previewHudState?.cityBackdropVisible &&
        previewHudState?.cityBackdropUsesUncropped)
    );
  const shouldPrimeCityBackdropSigns =
    isCityVistaPresentationRequested && canPrimeCityVistaPresentation && isCityVistaScenePrimed;
  const shouldAnimateCityBackdropSigns = shouldRunBackdropSignClock({
    backdropRect: cityBackdropRect,
    bootError,
    bootPhase,
    isCityVistaPresentationRequested,
  });
  const isBootOverlayVisible = displayBootPhase !== 'ready' || Boolean(bootError);
  const isDialogueOverlayState = previewHudState?.presentation === 'dialogue-overlay';
  const objectiveHudState = isDialogueOverlayState ? null : previewHudState;
  const dialogueOverlayState = isDialogueOverlayState ? previewHudState : null;
  const shouldHidePreviewHud =
    phoneGameSettings.hudEnabled === false ||
    shouldRenderBootOverlay ||
    Boolean(activeShellRequest) ||
    Boolean(activeLaunchExperience) ||
    isCollectibleModalOpen ||
    isWindowViewActive;
  const shouldHideDialogueOverlay =
    shouldRenderBootOverlay ||
    Boolean(activeShellRequest) ||
    Boolean(activeLaunchExperience) ||
    isCollectibleModalOpen ||
    isWindowViewActive;
  const shouldShowPreviewAudioPrompt =
    previewMusicUnlockRequired &&
    !shouldRenderBootOverlay &&
    !activeShellRequest &&
    !activeLaunchExperience &&
    !isCollectibleModalOpen &&
    !(previewHudState?.mode === 'intro' && Boolean(previewHudState?.nextActionLabel));
  const isMovementControlsObjective =
    previewHudState?.mode === 'objective' && previewHudState?.hotkey === 'WASD';
  const shouldShowWalkControlsNotice =
    !isMobileDevice &&
    !shouldRenderBootOverlay &&
    !activeShellRequest &&
    !activeLaunchExperience &&
    !isCollectibleModalOpen &&
    !isWindowViewActive &&
    isMovementControlsObjective;
  const shouldShowKeyboardHelpNotice = shouldShowWalkControlsNotice && !isKeyboardHelpDismissed;
  const isPhoneMenuUnlocked =
    resolvedApartmentState === APARTMENT_CITY_ENTRY_STATE_HUB ||
    isPreviewPhoneMenuUnlocked(previewInteractionState);
  const shouldShowFullscreenRecovery =
    isMobileDevice &&
    responsiveProfile.isLandscapeViewport &&
    fullscreenPreferred &&
    !fullscreenActive &&
    !shouldRenderBootOverlay &&
    !activeShellRequest &&
    !activeLaunchExperience &&
    !isCollectibleModalOpen &&
    !isWindowViewActive;
  const shouldShowMobileControls =
    isMobileDevice &&
    responsiveProfile.isLandscapeViewport &&
    !shouldRenderBootOverlay &&
    !activeShellRequest &&
    !activeLaunchExperience &&
    !isCollectibleModalOpen &&
    !isWindowViewActive &&
    !dialogueOverlayState &&
    Boolean(previewInteractionState?.movementUnlocked);
  const mobilePhoneNotification =
    resolvedApartmentState === APARTMENT_CITY_ENTRY_STATE_INTRO && isPhoneMenuUnlocked
      ? 'Signal received. Pull up the phone to answer the safehouse terminal.'
      : null;
  const desktopPhoneMenuEnabled = canOpenDesktopPhoneMenu({
    resolvedApartmentState,
  });
  const portraitReturnToGameMessage =
    pendingPhoneReturnToGame &&
    isMobileDevice &&
    responsiveProfile.isPortraitViewport &&
    !isCollectibleModalOpen &&
    !isWindowViewActive &&
    activeShellRequest?.deviceClass === 'phone'
      ? 'Rotate back to landscape to return to the game. The field device will stow as soon as the world view is readable again.'
      : null;
  const portraitPhoneLockMessage =
    isMobileDevice &&
    responsiveProfile.isPortraitViewport &&
    !shouldRenderBootOverlay &&
    !activeShellRequest &&
    !activeLaunchExperience &&
    !isCollectibleModalOpen &&
    !isWindowViewActive &&
    !isPhoneMenuUnlocked
      ? getPortraitPhoneLockMessage(previewInteractionState)
      : null;
  const portraitLandscapeLaunchMessage =
    pendingLandscapeLaunchRequest &&
    isMobileDevice &&
    responsiveProfile.isPortraitViewport &&
    !isCollectibleModalOpen &&
    !isWindowViewActive &&
    !activeLaunchExperience
      ? 'Rotate to landscape to launch codegrind.exe. The anomaly handoff waits for the wider screen.'
      : null;

  useEffect(() => {
    if (isMovementControlsObjective && !wasMovementControlsObjectiveRef.current) {
      setIsKeyboardHelpDismissed(false);
    }

    wasMovementControlsObjectiveRef.current = isMovementControlsObjective;
  }, [isMovementControlsObjective]);

  useEffect(() => {
    if (shouldShowMobileControls) {
      return undefined;
    }

    touchControlsRef.current.activeDirections = {};
    setActiveTouchDirections((currentDirections) =>
      Object.keys(currentDirections).length > 0 ? {} : currentDirections
    );
    return undefined;
  }, [shouldShowMobileControls]);

  useEffect(() => {
    if (typeof window === 'undefined' || !shouldAnimateCityBackdropSigns) {
      return undefined;
    }

    let animationFrameId = null;
    let initialTimestamp = null;

    const advanceBackdropClock = (timestamp) => {
      if (initialTimestamp === null) {
        initialTimestamp = timestamp;
      }

      setCityBackdropAnimationTickMs(timestamp - initialTimestamp);
      animationFrameId = window.requestAnimationFrame(advanceBackdropClock);
    };

    setCityBackdropAnimationTickMs(0);
    animationFrameId = window.requestAnimationFrame(advanceBackdropClock);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [shouldAnimateCityBackdropSigns]);

  useEffect(() => {
    if (shouldAnimateCityBackdropSigns) {
      return undefined;
    }

    setCityBackdropAnimationTickMs((currentTickMs) => (currentTickMs === 0 ? currentTickMs : 0));
    return undefined;
  }, [shouldAnimateCityBackdropSigns]);

  useEffect(() => {
    if (responsiveProfile.isPortraitViewport || !isOrientationPhoneMenuDismissed) {
      return undefined;
    }

    setIsOrientationPhoneMenuDismissed(false);
    return undefined;
  }, [isOrientationPhoneMenuDismissed, responsiveProfile.isPortraitViewport]);

  useEffect(() => {
    if (!pendingPhoneReturnToGame || responsiveProfile.isPortraitViewport || !activeShellRequest) {
      return undefined;
    }

    closeActiveShell();
    return undefined;
  }, [
    activeShellRequest,
    closeActiveShell,
    pendingPhoneReturnToGame,
    responsiveProfile.isPortraitViewport,
  ]);

  useEffect(() => {
    if (!pendingLandscapeLaunchRequest || responsiveProfile.isPortraitViewport) {
      return undefined;
    }

    startLaunchProgram(pendingLandscapeLaunchRequest);
    setPendingLandscapeLaunchRequest(null);
    return undefined;
  }, [pendingLandscapeLaunchRequest, responsiveProfile.isPortraitViewport, startLaunchProgram]);

  useEffect(() => {
    if (!isMobileDevice) {
      return undefined;
    }

    if (shouldRenderBootOverlay || activeLaunchExperience) {
      return undefined;
    }

    if (responsiveProfile.isPortraitViewport) {
      if (!activeShellRequest && !isOrientationPhoneMenuDismissed && isPhoneMenuUnlocked) {
        openShellFromRequest({
          deviceClass: 'phone',
          requestSource: 'orientation-phone-menu',
          shellId: apartmentShellId,
          terminalInstanceId: 'city-handheld-phone-shell',
          terminalName: 'Port Meridian Field Device',
          terminalZoneName: previewInteractionState?.terminalZoneName || null,
        });
      }

      return undefined;
    }

    return undefined;
  }, [
    activeLaunchExperience,
    activeShellRequest,
    apartmentShellId,
    isPhoneMenuUnlocked,
    isOrientationPhoneMenuDismissed,
    isMobileDevice,
    openShellFromRequest,
    previewInteractionState?.terminalZoneName,
    responsiveProfile.isPortraitViewport,
    shouldRenderBootOverlay,
  ]);

  useEffect(() => {
    if (isMobileDevice || shouldRenderBootOverlay) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const normalizedKey = String(event.key || '')
        .trim()
        .toLowerCase();
      const isEscapeShortcut = normalizedKey === 'escape' || normalizedKey === 'esc';

      if (!isDesktopPhoneShortcutKey(event.key) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (activeLaunchExperience) {
        return;
      }

      if (activeShellRequest) {
        if (!isEscapeShortcut) {
          return;
        }

        event.preventDefault();
        handleCloseShell();
        return;
      }

      if (isWindowViewActive || !desktopPhoneMenuEnabled) {
        return;
      }

      if (isTextEntryTarget(event.target)) {
        return;
      }

      event.preventDefault();
      openDesktopPhoneShell();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeLaunchExperience,
    activeShellRequest,
    desktopPhoneMenuEnabled,
    handleCloseShell,
    isMobileDevice,
    isWindowViewActive,
    openDesktopPhoneShell,
    shouldRenderBootOverlay,
  ]);

  return (
    <Box bg="#070b12" color="white" inset="0" overflow="hidden" position="fixed">
      <Box
        data-preview-visible={shouldRenderBootOverlay ? 'false' : 'true'}
        data-testid="city-phaser-preview-container"
        ref={containerRef}
        inset="0"
        position="absolute"
        pointerEvents={shouldRenderBootOverlay ? 'none' : 'auto'}
        visibility={shouldRenderBootOverlay ? 'hidden' : 'visible'}
        sx={{
          '& canvas': {
            display: 'block',
            height: '100% !important',
            imageRendering: 'pixelated',
            width: '100% !important',
          },
          opacity: shouldRenderBootOverlay ? 0 : 1,
          transition: 'opacity 180ms ease',
        }}
      />

      <CityPhaserPreviewHud hidden={shouldHidePreviewHud} hudState={objectiveHudState} zIndex={2} />

      <CityPhaserPreviewDialogueOverlay
        hidden={shouldHideDialogueOverlay}
        dialogueState={dialogueOverlayState}
        zIndex={6}
      />

      {PREVIEW_INPUT_TRACE_ENABLED && !isMobileDevice ? (
        <CityPhaserPreviewInputTracePanel
          previewInputTrace={previewInputTrace}
          previewInteractionState={previewInteractionState}
        />
      ) : null}

      {shouldShowFullscreenRecovery ? (
        <CityPhaserPreviewNoticeCard
          data-testid="preview-fullscreen-recovery-notice"
          position="absolute"
          top={shouldShowPreviewAudioPrompt ? '112px' : 3}
          right={3}
          zIndex={14}
          width="min(320px, calc(100vw - 24px))"
          title="RESTORE FULLSCREEN"
          message="The browser dropped fullscreen during the handoff. Tap below to put the safehouse back in fullscreen mode."
        >
          <Button
            mt={3}
            onClick={handleRestoreFullscreen}
            borderRadius="0"
            minH="32px"
            px={4}
            bg="#d4d0c8"
            border="2px solid #6f6f6f"
            boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48)"
            color="#101010"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.04em"
            _hover={{ bg: '#dbd7cf' }}
            _active={{ bg: '#c8c3bb' }}
          >
            Return to Fullscreen
          </Button>
        </CityPhaserPreviewNoticeCard>
      ) : null}

      {shouldShowPreviewAudioPrompt ? (
        <CityPhaserPreviewNoticeCard
          position="absolute"
          top={3}
          right={3}
          zIndex={14}
          width="min(320px, calc(100vw - 24px))"
          title="AUDIO READY"
          message="Click to start music on this screen."
        >
          <Button
            mt={3}
            onClick={resumePreviewMusic}
            borderRadius="0"
            minH="32px"
            px={4}
            bg="#d4d0c8"
            border="2px solid #6f6f6f"
            boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48)"
            color="#101010"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.04em"
            _hover={{ bg: '#dbd7cf' }}
            _active={{ bg: '#c8c3bb' }}
          >
            Enable Music
          </Button>
        </CityPhaserPreviewNoticeCard>
      ) : null}

      {shouldShowWalkControlsNotice ? (
        <CityPhaserPreviewNoticeCard
          data-testid="preview-walk-controls-notice"
          position="absolute"
          right={4}
          top="64px"
          zIndex={5}
          width="min(280px, calc(100vw - 32px))"
          title="WALK CONTROLS"
          message="Use WASD or Arrow Keys to move. Press E when you reach the safehouse terminal."
        >
          <Box
            data-testid="preview-wasd-keypad"
            mt={3}
            display="inline-grid"
            gridTemplateColumns="repeat(3, 28px)"
            gridTemplateRows="repeat(2, 28px)"
            gap="4px"
          >
            <Box />
            {['W', 'A', 'S', 'D'].map((keyLabel, index) => {
              const isTopKey = index === 0;

              return (
                <Box
                  key={keyLabel}
                  gridColumn={isTopKey ? '2' : String(index)}
                  gridRow={isTopKey ? '1' : '2'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px solid #6f6f6f"
                  bg="#efebe4"
                  boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.38)"
                >
                  <Text
                    color="#111111"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="11px"
                    fontWeight="700"
                    lineHeight="1"
                  >
                    {keyLabel}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </CityPhaserPreviewNoticeCard>
      ) : null}

      {shouldShowKeyboardHelpNotice ? (
        <CityPhaserPreviewNoticeCard
          data-testid="preview-keyboard-help-notice"
          position="absolute"
          left={3}
          bottom={3}
          zIndex={5}
          width="min(360px, calc(100vw - 24px))"
          title="KEYBOARD HELP"
          message="If WASD or the arrow keys do nothing, click the preview first and check for browser shortcut extensions. Vimium and similar tools can capture D or the arrow keys before the room sees them. You can find this note again in the phone Settings app."
        >
          <Text
            mt={2}
            color="#333333"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="10px"
            fontWeight="700"
            lineHeight="1.4"
          >
            Hide this tip if you already know the browser-keyboard gotchas.
          </Text>
          <Button
            mt={3}
            onClick={dismissKeyboardHelp}
            borderRadius="0"
            minH="32px"
            px={4}
            bg="#d4d0c8"
            border="2px solid #6f6f6f"
            boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48)"
            color="#101010"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.04em"
            _hover={{ bg: '#dbd7cf' }}
            _active={{ bg: '#c8c3bb' }}
          >
            Hide Tip
          </Button>
        </CityPhaserPreviewNoticeCard>
      ) : null}

      {shouldShowMobileControls ? (
        <CityPhaserPreviewMobileControls
          activeDirections={activeTouchDirections}
          controlSide={phoneGameSettings.controlSide}
          isPhoneEnabled={isPhoneMenuUnlocked}
          interactionNotification={previewInteractionState?.mobileInteractionPrompt || null}
          onDirectionEnd={handleTouchDirectionEnd}
          onDirectionStart={handleTouchDirectionStart}
          onInteract={handleTouchInteract}
          onOpenPhone={openHandheldPhoneShell}
          phoneButtonLabel={isPhoneMenuUnlocked ? 'Phone' : 'Phone Locked'}
          phoneNotification={mobilePhoneNotification}
        />
      ) : null}

      {portraitPhoneLockMessage ? (
        <CityPhaserPreviewNoticeCard
          position="absolute"
          left={3}
          right={3}
          bottom="calc(16px + env(safe-area-inset-bottom))"
          zIndex={4}
          pointerEvents="none"
          title="ROTATE TO CONTINUE"
          message={portraitPhoneLockMessage}
        />
      ) : null}

      {portraitReturnToGameMessage ? (
        <CityPhaserPreviewNoticeCard
          position="absolute"
          left={3}
          right={3}
          top={3}
          zIndex={13}
          pointerEvents="none"
          title="RETURN TO GAME"
          message={portraitReturnToGameMessage}
        />
      ) : null}

      {portraitLandscapeLaunchMessage ? (
        <CityPhaserPreviewNoticeCard
          position="absolute"
          left={3}
          right={3}
          top={3}
          zIndex={13}
          pointerEvents="none"
          title="ROTATE TO LAUNCH"
          message={portraitLandscapeLaunchMessage}
        />
      ) : null}

      {shouldPrimeCityBackdropSigns && cityBackdropRect ? (
        <Box
          position="absolute"
          inset={0}
          zIndex={1}
          pointerEvents="none"
          opacity={shouldShowCityBackdropSigns ? 1 : 0}
          transition="opacity 160ms ease"
        >
          <CityPhaserPreviewBackdropSigns
            animationTickMs={cityBackdropAnimationTickMs}
            backdropRect={cityBackdropRect}
          />
        </Box>
      ) : null}

      {isWindowViewActive ? (
        <CityPhaserPreviewWindowViewOverlay onClose={handleCloseWindowView} />
      ) : null}

      {previewCollectibleModalState ? (
        <CityPhaserPreviewCollectibleModal
          collectible={previewCollectibleModalState}
          isAuthenticated={isAuthenticated}
          onClose={handleCloseCollectibleModal}
          onCollect={handleCollectCollectible}
        />
      ) : null}

      {!isMobileDevice &&
      !shouldRenderBootOverlay &&
      !activeShellRequest &&
      !activeLaunchExperience &&
      !isCollectibleModalOpen &&
      !isWindowViewActive ? (
        <Box
          position="absolute"
          right={4}
          top={4}
          zIndex={1}
          display="flex"
          flexDirection="column"
          gap={3}
          alignItems="flex-end"
        >
          {previewInteractionState?.isIntroSequenceActive === true ? (
            <Box
              as="button"
              type="button"
              onClick={() =>
                navigate('/', { state: { autoLaunchHomeDemo: true, skipBootSequence: true } })
              }
              border="2px solid #8f1f1f"
              bg="#d4d0c8"
              color="#171717"
              boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.84), inset -1px -1px 0 rgba(104, 104, 104, 0.38)"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontSize="11px"
              fontWeight="700"
              letterSpacing="0.06em"
              px={3}
              py={2}
              textTransform="uppercase"
              _hover={{ bg: '#e3dfd6', borderColor: '#b12a2a' }}
              _active={{
                bg: '#c6c1b7',
                boxShadow:
                  'inset -1px -1px 0 rgba(255, 255, 255, 0.84), inset 1px 1px 0 rgba(104, 104, 104, 0.45)',
              }}
            >
              Skip to Defense
            </Box>
          ) : null}

          <Box
            as="button"
            type="button"
            onClick={openDesktopPhoneShell}
            disabled={!desktopPhoneMenuEnabled}
            border="2px solid #6f6f6f"
            bg={desktopPhoneMenuEnabled ? '#d4d0c8' : '#b9b5ad'}
            color={desktopPhoneMenuEnabled ? '#171717' : 'rgba(23, 23, 23, 0.72)'}
            boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.84), inset -1px -1px 0 rgba(104, 104, 104, 0.38)"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.06em"
            px={3}
            py={2}
            textTransform="uppercase"
            _hover={
              desktopPhoneMenuEnabled ? { bg: '#e3dfd6' } : { bg: '#b9b5ad', cursor: 'not-allowed' }
            }
            _active={{
              bg: desktopPhoneMenuEnabled ? '#c6c1b7' : '#b9b5ad',
              boxShadow:
                'inset -1px -1px 0 rgba(255, 255, 255, 0.84), inset 1px 1px 0 rgba(104, 104, 104, 0.45)',
            }}
          >
            {desktopPhoneMenuEnabled ? 'Phone [P / Esc]' : 'Phone Locked'}
          </Box>
        </Box>
      ) : null}

      {shouldRenderBootOverlay ? (
        <CityPhaserPreviewBootScreen
          errorMessage={bootError}
          isVisible={isBootOverlayVisible}
          phase={displayBootPhase}
          zIndex={1}
        />
      ) : null}

      <CityDeviceShellHost
        request={activeShellRequest}
        onClose={handleCloseShell}
        onPhoneControlSideChange={handlePhoneControlSideChange}
        onPhoneHudToggle={handlePhoneHudToggle}
        onPhoneTrackSelect={handlePhoneTrackSelect}
        onPhoneMusicToggle={handlePhoneMusicToggle}
        onPhoneMusicVolumeChange={handlePhoneMusicVolumeChange}
        onPhoneRouteGuideToggle={handlePhoneRouteGuideToggle}
        phoneAvailableTracks={phoneAvailableTracks}
        phoneCurrentTrack={phoneCurrentTrack}
        phoneGameSettings={phoneGameSettings}
        phoneSelectedTrackId={phoneSelectedTrackId}
      />

      {activeLaunchExperience ? (
        <CityCodegrindLaunchExperience
          key={activeLaunchExperience.experienceId}
          sourceRect={activeLaunchExperience.sourceRect}
          targetPath={activeLaunchExperience.targetPath}
          targetLaunchRequest={activeLaunchExperience.targetLaunchRequest}
          onShellCovered={handleLaunchShellCovered}
        />
      ) : null}

      {bootError ? (
        <Box
          bg="rgba(7, 11, 18, 0.82)"
          borderRadius="14px"
          color="red.200"
          left={4}
          maxWidth="420px"
          p={4}
          position="absolute"
          top={4}
          zIndex={2}
        >
          <Text fontSize="sm">{bootError}</Text>
        </Box>
      ) : null}
    </Box>
  );
}

export default CityPhaserPreviewPage;
