/**
 * Audio Manager for Tower Defense game
 * Handles playing sound effects and background music
 */
import { readStorage, writeStorage } from '../web/storage';

class AudioManager {
  constructor() {
    // Initialize audio settings from localStorage or defaults
    this.settings = {
      soundEffectsEnabled:
        readStorage('localStorage', 'td_soundEffectsEnabled') === 'false' ? false : true,
      musicEnabled: readStorage('localStorage', 'td_musicEnabled') === 'false' ? false : true,
      soundEffectsVolume: parseFloat(
        readStorage('localStorage', 'td_soundEffectsVolume') || '0.17'
      ),
      musicVolume: parseFloat(readStorage('localStorage', 'td_musicVolume') || '0.14'),
    };

    // Sound effect audio elements
    this.soundEffects = {};

    // Currently playing sound effects
    this.activeSoundEffects = new Set();

    // Background music audio element
    this.backgroundMusic = null;

    // Currently playing track information
    this.currentTrack = null;

    // Flag to track if the manager has been initialized with audio files
    this.initialized = false;

    // Track deferred autoplay retries so they can be cancelled on unmount/navigation
    this._pendingTrack = null;
    this._pendingInteractionHandler = null;

    // Track when sounds were last played (for rate limiting)
    this.lastPlayedTimes = {};

    // Define rate limits for different sound types (in milliseconds)
    this.soundRateLimits = {
      'tower-placed': 100,
      'button-click': 80,
      'ui-hover': 150,
      'enemy-hit': 50,
      'projectile-hit': 120,
      'enemy-defeat': 100,
      'wave-complete': 300,
      'game-over': 500,
      upgrade: 150,
      'projectile-shot-ForLoop': 140,
      'projectile-shot-WhileLoop': 140,
      'projectile-shot-IfCondition': 140,
      'projectile-shot-Variable': 140,
      'projectile-shot-Function': 140,
      'projectile-shot-Array': 140,
      'projectile-shot-Object': 140,
      'projectile-shot-Return': 140,
      'projectile-shot-TryCatch': 140,
      'projectile-shot-Switch': 140,
      'projectile-shot-BurstTurret': 120,
      'projectile-shot-BlastTurret': 160,
      'projectile-shot-AIAssist': 140,
      'progress-bar': 700,
      'level-up-begin': 700,
      'level-up-end': 700,
      'level-up-impact': 900,
      'level-up-thud': 800,
      // Default for any other sounds
      default: 50,
    };

    // Per-sound volume multipliers
    this.soundEffectMultipliers = {
      'demo-boot': 3.8,
      'level-up-begin': 1.35,
      'level-up-end': 1.4,
      'level-up-impact': 1.5,
      'level-up-thud': 1.45,
      'tower-upgraded': 1.4,
      'projectile-shot-ForLoop': 1.25,
      'projectile-shot-WhileLoop': 1.25,
      'projectile-shot-IfCondition': 1.25,
      'projectile-shot-Variable': 1.25,
      'projectile-shot-Function': 1.25,
      'projectile-shot-Array': 1.25,
      'projectile-shot-Object': 1.25,
      'projectile-shot-Return': 1.25,
      'projectile-shot-TryCatch': 1.25,
      'projectile-shot-Switch': 1.25,
      'projectile-shot-BurstTurret': 1.25,
      'projectile-shot-BlastTurret': 1.25,
      'projectile-shot-AIAssist': 1.25,
    };
  }

  /**
   * Initialize audio files
   * @returns {Promise} Resolves when all audio is loaded
   */
  initialize() {
    if (this.initialized) return Promise.resolve();

    // This would be where we preload all audio files
    // For now, we'll just mark as initialized
    this.initialized = true;
    return Promise.resolve();
  }

  clearPendingAutoplayRetry() {
    this._pendingTrack = null;
    if (!this._pendingInteractionHandler || typeof document === 'undefined') return;

    document.removeEventListener('click', this._pendingInteractionHandler, true);
    document.removeEventListener('pointerdown', this._pendingInteractionHandler, true);
    document.removeEventListener('touchstart', this._pendingInteractionHandler, true);
    document.removeEventListener('keyup', this._pendingInteractionHandler, true);
    this._pendingInteractionHandler = null;
  }

  resumePendingAutoplay() {
    if (!this._pendingInteractionHandler) {
      return false;
    }

    this._pendingInteractionHandler();
    return true;
  }

  /**
   * Load a sound effect
   * @param {string} id - Unique identifier for the sound
   * @param {string} url - URL to the sound file
   */
  loadSoundEffect(id, url) {
    const audio = new Audio(url);
    audio.volume = this.settings.soundEffectsVolume;
    this.soundEffects[id] = audio;
  }

  /**
   * Play a sound effect with rate limiting to prevent audio stuttering
   * @param {string} id - ID of the sound effect to play
   */
  playSoundEffect(id) {
    if (!this.settings.soundEffectsEnabled || !this.soundEffects[id]) return;

    const currentTime = Date.now();
    const rateLimit = this.soundRateLimits[id] || this.soundRateLimits['default'];
    const lastPlayed = this.lastPlayedTimes[id] || 0;

    // Skip playing if this sound was played too recently
    if (currentTime - lastPlayed < rateLimit) {
      //console.log(`Rate limiting sound: ${id}, last played ${currentTime - lastPlayed}ms ago`);
      return;
    }

    // Clone the audio to allow multiple instances of the same sound
    const sound = this.soundEffects[id].cloneNode();
    const multiplier = this.soundEffectMultipliers?.[id] || 1;
    sound.volume = Math.min(1, this.settings.soundEffectsVolume * multiplier);
    const playPromise = sound.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error('[AUDIO] Error playing sound effect:', err);
        }
      });
    }

    const cleanup = () => {
      this.activeSoundEffects.delete(sound);
    };

    sound.onended = cleanup;
    sound.onpause = cleanup;
    this.activeSoundEffects.add(sound);

    // Record when this sound was played
    this.lastPlayedTimes[id] = currentTime;
  }

  /**
   * Play a sound effect and resolve when playback ends.
   * Useful for short intro sequences where ordering matters.
   * @param {string} id - ID of the sound effect to play
   * @param {Object} options - Playback options
   * @param {number} options.maxWaitMs - Max wait before resolving even if no end event fires
   * @param {boolean} options.force - Ignore sound-effects enabled toggle and rate-limit checks
   * @param {string} options.fallbackUrl - Optional direct URL fallback if the sound ID is not loaded
   * @returns {Promise<boolean>} Resolves true if attempted, false when skipped/failed
   */
  playSoundEffectAndWait(id, options = {}) {
    const maxWaitMs = Number(options.maxWaitMs) > 0 ? Number(options.maxWaitMs) : 7000;
    const force = options.force === true;
    const fallbackUrl = typeof options.fallbackUrl === 'string' ? options.fallbackUrl : null;

    if (!force && !this.settings.soundEffectsEnabled) {
      return Promise.resolve(false);
    }

    const source = this.soundEffects[id] || (fallbackUrl ? new Audio(fallbackUrl) : null);
    if (!source) {
      return Promise.resolve(false);
    }

    const currentTime = Date.now();
    const rateLimit = this.soundRateLimits[id] || this.soundRateLimits.default;
    const lastPlayed = this.lastPlayedTimes[id] || 0;
    if (!force && currentTime - lastPlayed < rateLimit) {
      return Promise.resolve(false);
    }

    const sound = source.cloneNode();
    const multiplier = this.soundEffectMultipliers?.[id] || 1;
    const baseVolume =
      force && this.settings.soundEffectsVolume <= 0 ? 0.7 : this.settings.soundEffectsVolume;
    sound.volume = Math.min(1, baseVolume * multiplier);
    this.lastPlayedTimes[id] = currentTime;
    this.activeSoundEffects.add(sound);

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        this.activeSoundEffects.delete(sound);
        sound.onended = null;
        sound.onpause = null;
      };

      const finish = (result) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };

      sound.onended = () => finish(true);
      sound.onpause = () => {
        if (sound.currentTime > 0 && sound.currentTime < sound.duration) {
          finish(true);
        }
      };

      const playPromise = sound.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => finish(false));
      }

      setTimeout(() => finish(true), maxWaitMs);
    });
  }

  /**
   * Stop all currently playing sound effects.
   */
  stopAllSoundEffects() {
    this.activeSoundEffects.forEach((sound) => {
      try {
        sound.pause();
        sound.currentTime = 0;
      } catch {
        // Ignore stop errors
      }
    });
    this.activeSoundEffects.clear();
  }

  /**
   * Load and play background music
   * @param {string} url - URL to the music file
   * @param {Object} trackInfo - Optional track information
   * @param {Object} options - Playback options
   * @param {boolean} options.loop - Whether to loop the track (default: true)
   * @param {Function} options.onEnded - Callback when track finishes
   * @returns {Promise<boolean>} Promise resolving to true if music started playing
   */
  playBackgroundMusic(url, trackInfo = null, options = {}) {
    if (!this.settings.musicEnabled) {
      //console.log('[AUDIO] Music is disabled in settings, not playing');
      return Promise.resolve(false);
    }

    // Stop any currently playing music
    this.stopBackgroundMusic();

    //console.log('[AUDIO] Creating audio element for:', trackInfo?.title || url);

    // Create and play new background music
    this.backgroundMusic = new Audio(url);
    this.backgroundMusic.loop = options.loop ?? true;
    this.backgroundMusic.volume = this.settings.musicVolume;
    if (typeof options.onEnded === 'function') {
      this.backgroundMusic.onended = options.onEnded;
    }

    // Save current track info
    this.currentTrack = trackInfo;

    // Return a promise that resolves when music starts playing
    return new Promise((resolve, reject) => {
      // Play with error handling for autoplay restrictions
      const playPromise = this.backgroundMusic.play();

      if (playPromise === undefined) {
        //console.log('[AUDIO] Play promise is undefined, assuming success');
        resolve(true);
        return;
      }

      playPromise
        .then(() => {
          //console.log('[AUDIO] Music started playing successfully:', trackInfo?.title || url);

          // Dispatch event to notify UI components of track change
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('td-track-changed', {
                detail: this.currentTrack,
              })
            );
          }

          resolve(true);
        })
        .catch((error) => {
          // Auto-play was prevented due to browser restrictions
          if (error.name === 'NotAllowedError') {
            console.warn(
              '[AUDIO] Autoplay prevented: Music will play after user interaction',
              error
            );

            this.clearPendingAutoplayRetry();

            // Mark that we have a pending track to play
            this._pendingTrack = { url, trackInfo, options };

            // Add one-time listener for user interaction to retry playing
            const retryPlay = () => {
              //console.log("[AUDIO] User interacted, attempting to play music again");
              const pendingTrack = this._pendingTrack;
              this.clearPendingAutoplayRetry();
              if (!pendingTrack) return;
              const { url, trackInfo, options } = pendingTrack;

              // Create new audio element
              this.backgroundMusic = new Audio(url);
              this.backgroundMusic.loop = options?.loop ?? true;
              this.backgroundMusic.volume = this.settings.musicVolume;
              if (typeof options?.onEnded === 'function') {
                this.backgroundMusic.onended = options.onEnded;
              }

              // Save track info
              this.currentTrack = trackInfo;

              // Try playing again
              this.backgroundMusic
                .play()
                .then(() => {
                  //console.log('[AUDIO] Music started playing after user interaction');

                  // Dispatch event to notify UI components of track change
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('td-track-changed', {
                        detail: this.currentTrack,
                      })
                    );
                  }
                })
                .catch((e) => {
                  console.error('[AUDIO] Still unable to play audio despite user interaction', e);
                });
            };

            // Capture pointer/touch before UI handlers stop propagation, and use keyup so
            // gameplay movement keys do not lose their initial keydown to audio unlock.
            this._pendingInteractionHandler = retryPlay;
            document.addEventListener('click', retryPlay, { capture: true, once: true });
            document.addEventListener('pointerdown', retryPlay, { capture: true, once: true });
            document.addEventListener('touchstart', retryPlay, { capture: true, once: true });
            document.addEventListener('keyup', retryPlay, { capture: true, once: true });

            // Resolve with false since we couldn't play immediately
            resolve(false);
          } else if (error.name === 'AbortError') {
            // Quietly resolve on pause/unmount interruption
            resolve(false);
          } else {
            console.error('[AUDIO] Error playing audio:', error);
            reject(error);
          }
        });
    });
  }

  /**
   * Get information about the currently playing track
   * @returns {Object|null} Current track information or null if no track is playing
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    this.clearPendingAutoplayRetry();
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    this.backgroundMusic = null;
    this.currentTrack = null;
  }

  /**
   * Update sound effect settings
   * @param {boolean} enabled - Whether sound effects are enabled
   * @param {number} volume - Volume level (0-1)
   */
  updateSoundEffectsSettings(enabled, volume) {
    this.settings.soundEffectsEnabled = enabled;
    this.settings.soundEffectsVolume = volume;

    // Update volume on all loaded sound effects
    Object.values(this.soundEffects).forEach((sound) => {
      sound.volume = volume;
    });

    // Save to localStorage
    writeStorage('localStorage', 'td_soundEffectsEnabled', enabled);
    writeStorage('localStorage', 'td_soundEffectsVolume', volume);
  }

  /**
   * Update music settings
   * @param {boolean} enabled - Whether music is enabled
   * @param {number} volume - Volume level (0-1)
   */
  updateMusicSettings(enabled, volume) {
    this.settings.musicEnabled = enabled;
    this.settings.musicVolume = volume;

    // Update current background music if playing
    if (this.backgroundMusic) {
      if (!enabled) {
        this.stopBackgroundMusic();
      } else {
        this.backgroundMusic.volume = volume;
      }
    }

    // Save to localStorage
    writeStorage('localStorage', 'td_musicEnabled', enabled);
    writeStorage('localStorage', 'td_musicVolume', volume);
  }

  /**
   * Get current audio settings
   * @returns {Object} Current audio settings
   */
  getSettings() {
    return { ...this.settings };
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
