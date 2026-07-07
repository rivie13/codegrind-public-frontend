/**
 * Utility to preload Phaser bundles, map JSONs, and visual assets in the background.
 * This runs on idle CPU cycles (via requestIdleCallback) to prevent any impact
 * on initial homepage rendering or user interaction, while reducing future page load times.
 */

import phaserInstanceManager from './PhaserInstanceManager';
import getAssetUrl from '../assets/assetUrl';

/**
 * Checks if the user has any saved progression or authenticated session in localStorage.
 * This is used to determine if they are a returning user or a first-time user.
 * This function is safe for SSR - it should only be called from client-side code.
 */
function hasUserProgression() {
  // This function should only be called from client-side code after hydration
  // For SSR safety, we check window existence first
  if (typeof window === 'undefined') {
    // During SSR, assume no progression to avoid hydration mismatches
    return false;
  }

  // 1. Authenticated user has user_id
  try {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      return true;
    }
  } catch {
    // Ignored in SSR or restrictive browser settings
  }

  // 2. Guest user with progress
  try {
    const rawProgress = localStorage.getItem('codegrind_guest_progress');
    if (rawProgress) {
      const progress = JSON.parse(rawProgress);
      if (
        progress?.demoCompleted ||
        progress?.pathChoice ||
        (Array.isArray(progress?.problemsSolved) && progress.problemsSolved.length > 0) ||
        (Array.isArray(progress?.problemsAttempted) && progress.problemsAttempted.length > 0) ||
        (Array.isArray(progress?.lpNodesCompleted) && progress.lpNodesCompleted.length > 0)
      ) {
        return true;
      }
    }
  } catch {
    // Ignored in SSR or restrictive browser settings
  }

  return false;
}

/**
 * Client-side wrapper for hasUserProgression that ensures it's only called after hydration.
 * This prevents SSR/hydration mismatches by deferring the check until after the initial render.
 */
let clientHasUserProgression = null;
let isClientReady = false;

export function getHasUserProgression() {
  if (!isClientReady) {
    // If called before client is ready, return false to prevent SSR mismatches
    return false;
  }
  return hasUserProgression();
}

// Mark client as ready after hydration
export function markClientReady() {
  isClientReady = true;
  clientHasUserProgression = hasUserProgression();
}

/** @type {Promise<void>|null} */
let preloadPromise = null;
/** @type {Promise<void>|null} */
let prebootPromise = null;

if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    window.__codegrindLastInteractionTime = performance.now();
  };
  window.addEventListener('scroll', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
}

const yieldToMainThread = async () => {
  const isCityRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/city') ||
      window.location.pathname.includes('/standalone-city'));

  if (!isCityRoute && typeof window !== 'undefined') {
    // Background mode: yield with a 100ms cooling sleep to keep main thread completely clear
    await new Promise((resolve) => setTimeout(resolve, 100));
  } else if (typeof window !== 'undefined') {
    // Active route mode: yield with requestAnimationFrame to let browser paint
    await new Promise((resolve) => requestAnimationFrame(resolve));
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

export function preloadPhaserBackground() {
  // Prevent running on the server during SSR builds
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }
  if (!preloadPromise) {
    preloadPromise = (async () => {
      const isMobileDevice =
        typeof navigator !== 'undefined' &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
          (navigator.maxTouchPoints > 0 &&
            typeof window !== 'undefined' &&
            window.innerWidth < 1024));

      console.log(
        `[PhaserBackgroundPreloader] Warming up light assets${isMobileDevice ? ' (Mobile)' : ''}...`
      );

      try {
        // Step 3: Load Homepage TD and TD V2 chunks.
        // The home page already kicks off the backend problem warmup on mount, so
        // we keep this step focused on bundle warming and avoid serializing the
        // rest of the Phaser boot on a slow API round trip.
        let stepStart = performance.now();
        await yieldToMainThread();
        console.log('[PhaserBackgroundPreloader] Step 3: Loading TD chunks...');

        await Promise.all([
          import('../../pages/home/HomepageTDDemo'),
          import('../../pages/games/towerDefenseV2/TowerDefenseV2Page'),
        ]);
        await yieldToMainThread();
        console.log(
          `[PhaserBackgroundPreloader] Step 3 completed in ${(performance.now() - stepStart).toFixed(2)}ms`
        );

        // Step 4: Load Character select presets & assets
        stepStart = performance.now();
        await yieldToMainThread();
        console.log(
          '[PhaserBackgroundPreloader] Step 4: Loading character presets and textures...'
        );
        const { PLAYER_CHARACTER_PRESETS } =
          await import('../../player-character/playerCharacterPresets');
        await yieldToMainThread();

        if (Array.isArray(PLAYER_CHARACTER_PRESETS)) {
          await Promise.all(
            PLAYER_CHARACTER_PRESETS.map((preset) => {
              if (!preset?.sheetPath) return Promise.resolve();
              return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = preset.sheetPath;
              });
            })
          );
        }
        await yieldToMainThread();
        console.log(
          `[PhaserBackgroundPreloader] Step 4 completed in ${(performance.now() - stepStart).toFixed(2)}ms`
        );

        // Step 5: Load City Dusk Skyline Background & Lights
        stepStart = performance.now();
        await yieldToMainThread();
        console.log('[PhaserBackgroundPreloader] Step 5: Preloading Dusk City Skyline textures...');

        const skylineImages = [
          getAssetUrl(
            '/city-v2/tiled/backgrounds_loadingScreens/Dusk_City_Background_UNCROPPED.png'
          ),
          getAssetUrl('/city-v2/tiled/backgrounds_loadingScreens/Dusk_City_Background.png'),
        ];
        await Promise.all(
          skylineImages.map((src) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = src;
            });
          })
        );
        await yieldToMainThread();
        console.log(
          `[PhaserBackgroundPreloader] Step 5 completed in ${(performance.now() - stepStart).toFixed(2)}ms`
        );
      } catch (error) {
        console.error('[PhaserBackgroundPreloader] Error warming up light assets:', error);
      }
    })();
  }

  return preloadPromise;
}

export function prebootPhaserInstance() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }
  if (prebootPromise) {
    return prebootPromise;
  }

  prebootPromise = _executePreboot();
  return prebootPromise;
}

async function _executePreboot() {
  const isMobileDevice =
    typeof navigator !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && typeof window !== 'undefined' && window.innerWidth < 1024));

  // If there's already an active Phaser game instance, do not preboot another
  if (phaserInstanceManager.gameInstance) {
    return;
  }

  console.log(
    `[PhaserBackgroundPreloader] Starting heavy Phaser preboot sequence${
      isMobileDevice ? ' (Mobile - Asset Caching only)' : ''
    }...`
  );

  const overallStart = performance.now();
  let stepStart;

  try {
    // Step 2: Load Phaser Engine only
    stepStart = performance.now();
    await yieldToMainThread();
    console.log('[PhaserBackgroundPreloader] Step 2: Loading Phaser engine core...');
    const { default: Phaser } = await import('phaser');
    await yieldToMainThread();
    console.log(
      `[PhaserBackgroundPreloader] Step 2 completed in ${(performance.now() - stepStart).toFixed(2)}ms`
    );

    // Step 6: Load Apartment Scene and pre-boot
    stepStart = performance.now();
    await yieldToMainThread();
    console.log(
      '[PhaserBackgroundPreloader] Step 6: Loading Apartment Scene and pre-booting Phaser...'
    );

    const [
      { createApartmentPreviewScene },
      { loadExternalTiledMap },
      { DISTRICT_01_PREVIEW_MAPS },
      { RETRO_HUD_ICON_ASSETS },
    ] = await Promise.all([
      import('../../city-phaser/district01/createApartmentPreviewScene'),
      import('../../city-phaser/district01/loadExternalTiledMap'),
      import('../../city-phaser/district01/maps/district01PreviewMapConfigs'),
      import('../../city-phaser/district01/apartmentPreviewScene.constants'),
    ]);
    await yieldToMainThread();

    // Create container
    let prebootContainer = document.getElementById('phaser-preboot-container');
    if (!prebootContainer) {
      prebootContainer = document.createElement('div');
      prebootContainer.id = 'phaser-preboot-container';
      prebootContainer.style.position = 'absolute';
      prebootContainer.style.left = '-9999px';
      prebootContainer.style.top = '-9999px';
      prebootContainer.style.width = '800px';
      prebootContainer.style.height = '600px';
      prebootContainer.style.visibility = 'hidden';
      prebootContainer.style.pointerEvents = 'none';
      document.body.appendChild(prebootContainer);
    }

    const ApartmentPreviewScene = createApartmentPreviewScene(Phaser);
    const gameConfig = {
      backgroundColor: '#070b12',
      parent: 'phaser-preboot-container',
      audio: {
        noAudio: true,
      },
      loader: {
        maxParallelDownloads: 2,
      },
      autoFocus: false,
      physics: {
        arcade: {
          debug: false,
          gravity: { y: 0 },
        },
        default: 'arcade',
      },
      pixelArt: true,
      scale: {
        height: 600,
        mode: Phaser.Scale.NONE,
        width: 800,
      },
      scene: [ApartmentPreviewScene],
      type: Phaser.AUTO,
      isBackgroundPreboot: true,
      input: {
        keyboard: {
          target: prebootContainer,
          capture: [],
        },
      },
      callbacks: {
        postBoot: (game) => {
          if (game.input && game.input.keyboard) {
            game.input.keyboard.enabled = false;
            game.input.keyboard.clearCaptures();
            try {
              if (typeof game.input.keyboard.stopListeners === 'function') {
                game.input.keyboard.stopListeners();
              }
              game.input.keyboard.target = prebootContainer;
              if (typeof game.input.keyboard.startListeners === 'function') {
                game.input.keyboard.startListeners();
              }
            } catch (e) {
              console.error(
                '[PhaserBackgroundPreloader] Error setting postBoot keyboard target:',
                e
              );
            }
          }
          if (game.canvas && typeof game.canvas.blur === 'function') {
            game.canvas.blur();
          }
        },
      },
      onBackgroundPrebootComplete: () => {
        // If the user is already on a city preview route, dispatch ready event
        // instead of pausing — the city page needs the scene to stay live.
        const isOnCityRoute =
          typeof window !== 'undefined' &&
          (window.location.pathname.startsWith('/city') ||
            window.location.pathname.includes('/standalone-city'));

        if (isOnCityRoute) {
          console.log(
            '[PhaserBackgroundPreloader] Background preboot finished while on city route. Dispatching ready event.'
          );
          window.dispatchEvent(new CustomEvent('codegrind:apartment-preview-ready'));
          return;
        }

        console.log(
          '[PhaserBackgroundPreloader] Background preboot finished. Pausing game now to save CPU.'
        );
        phaserInstanceManager.pauseGame();
      },
    };

    phaserInstanceManager.getInstance(Phaser, gameConfig);

    console.log(
      '[PhaserBackgroundPreloader] Phaser singleton instantiated. Awaiting scene bootstrap completion in background...'
    );
    await yieldToMainThread();
    console.log(
      `[PhaserBackgroundPreloader] Step 6 completed in ${(performance.now() - stepStart).toFixed(2)}ms`
    );

    // Step 7: Everything Else (lazy exterior maps & secondary assets)
    stepStart = performance.now();
    await yieldToMainThread();
    console.log('[PhaserBackgroundPreloader] Step 7: Loading remaining secondary city assets...');

    const userHasProgress = getHasUserProgression();

    // Pre-fetch other maps JSON so they are loaded in TILED_MAP_CACHE
    if (DISTRICT_01_PREVIEW_MAPS) {
      for (const [locationId, mapConfig] of Object.entries(DISTRICT_01_PREVIEW_MAPS)) {
        if (!mapConfig?.mapAssetPath) {
          continue;
        }
        const shouldPrefetch = userHasProgress && locationId === 'exterior';
        if (shouldPrefetch) {
          loadExternalTiledMap(mapConfig.mapAssetPath).catch((err) => {
            console.warn(
              `[PhaserBackgroundPreloader] Gentle map pre-fetch failed for ${locationId}:`,
              err
            );
          });
        }
      }
    }
    await yieldToMainThread();

    // Gather secondary images
    const imageUrlsToPrefetch = new Set();
    if (RETRO_HUD_ICON_ASSETS) {
      Object.values(RETRO_HUD_ICON_ASSETS).forEach((icon) => {
        if (icon?.path) {
          imageUrlsToPrefetch.add(icon.path);
        }
      });
    }

    if (DISTRICT_01_PREVIEW_MAPS) {
      for (const [locationId, mapConfig] of Object.entries(DISTRICT_01_PREVIEW_MAPS)) {
        if (locationId === 'apartment-room-01' || locationId === 'apartment') {
          continue;
        }

        const shouldLoadSecondaryAssets = userHasProgress && locationId === 'exterior';
        if (!shouldLoadSecondaryAssets) {
          continue;
        }

        if (Array.isArray(mapConfig?.sceneActors)) {
          mapConfig.sceneActors.forEach((actor) => {
            const textures = actor?.appearance?.textures || {};
            Object.values(textures).forEach((tex) => {
              if (tex?.assetPath) {
                imageUrlsToPrefetch.add(tex.assetPath);
              }
            });
            if (actor?.display?.assetPath) {
              imageUrlsToPrefetch.add(actor.display.assetPath);
            }
          });
        }

        if (Array.isArray(mapConfig?.sceneDoors)) {
          mapConfig.sceneDoors.forEach((door) => {
            if (door?.appearance?.assetPath) {
              imageUrlsToPrefetch.add(door.appearance.assetPath);
            }
          });
        }

        if (mapConfig?.interactions) {
          Object.values(mapConfig.interactions).forEach((interaction) => {
            if (interaction?.transitionEffect?.appearance?.assetPath) {
              imageUrlsToPrefetch.add(interaction.transitionEffect.appearance.assetPath);
            }
            if (interaction?.display?.assetPath) {
              imageUrlsToPrefetch.add(interaction.display.assetPath);
            }
          });
        }
      }
    }

    const allUrls = Array.from(imageUrlsToPrefetch).filter(Boolean);
    const batchSize = 2;
    let prefetchCount = 0;

    for (let i = 0; i < allUrls.length; i += batchSize) {
      const pathDuringLoop = window.location.pathname;
      if (pathDuringLoop.startsWith('/city') || pathDuringLoop.includes('/standalone-city')) {
        break;
      }

      const batch = allUrls.slice(i, i + batchSize);
      await Promise.all(
        batch.map((url) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              prefetchCount++;
              resolve();
            };
            img.onerror = () => {
              resolve();
            };
            img.src = url;
          });
        })
      );
      await yieldToMainThread();
    }

    console.log(
      `[PhaserBackgroundPreloader] Step 7 completed in ${(performance.now() - stepStart).toFixed(2)}ms`
    );
    console.log(
      `[PhaserBackgroundPreloader] Sequential preloading complete. Primed ${prefetchCount} secondary assets. Total preloading duration: ${(
        performance.now() - overallStart
      ).toFixed(2)}ms`
    );
  } catch (error) {
    console.error(
      '[PhaserBackgroundPreloader] Error during sequential pre-boot/preloading:',
      error
    );
  }
}
