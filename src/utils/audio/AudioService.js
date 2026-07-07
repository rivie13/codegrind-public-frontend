import audioManager from './AudioManager';
import soundEffects, { loadSoundEffects } from './soundEffects';
import getAssetUrl from '../assets/assetUrl';

/**
 * Service class to handle all audio-related functionality
 * This centralizes audio management logic outside of UI components
 */
class AudioService {
  constructor() {
    this.initialized = false;
    this.currentTrackId = null;
    this.playedTrackIds = new Set();
    this.randomQueue = [];
    this.beginDemoSequencePromise = null;
  }

  getGameplayTracks() {
    const excluded = new Set(['victory-music', 'defeat-music']);
    return soundEffects.BACKGROUND_MUSIC.filter((t) => !excluded.has(t.id));
  }

  shuffleTracks(tracks) {
    const array = [...tracks];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  resetRandomCycle(excludeId = null) {
    const gameplayTracks = this.getGameplayTracks();
    const gameplayIds = new Set(gameplayTracks.map((track) => track.id));
    const preserved = [...this.playedTrackIds].filter((id) => !gameplayIds.has(id));
    this.playedTrackIds = new Set(preserved);
    if (excludeId) {
      this.playedTrackIds.add(excludeId);
    }
    this.randomQueue = this.shuffleTracks(gameplayTracks.filter((track) => track.id !== excludeId));
  }

  getNextRandomGameplayTrack(excludeId = null) {
    if (!this.randomQueue.length) {
      this.resetRandomCycle(excludeId);
    }

    if (!this.randomQueue.length) {
      return null;
    }

    return this.randomQueue.shift();
  }

  /**
   * Initialize the audio manager and load sound effects
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize() {
    // Skip if already initialized
    if (this.initialized) {
      //console.log('[DEBUG] AudioService already initialized, skipping');
      return true;
    }

    await audioManager.initialize();
    //console.log('[DEBUG] Audio manager initialized');

    // Load sound effects
    loadSoundEffects();

    this.initialized = true;
    return true;
  }

  /**
   * Run the home-page demo audio sequence: boot SFX only.
   * Gameplay music starts after the visual boot sequence dismisses.
   */
  async playBeginDemoSequence() {
    if (this.beginDemoSequencePromise) {
      return this.beginDemoSequencePromise;
    }

    this.beginDemoSequencePromise = (async () => {
      if (typeof window !== 'undefined') {
        window._homeBootAudioSequenceActive = true;
        window.dispatchEvent(
          new CustomEvent('home-demo-boot-audio-start', {
            detail: { maxWaitMs: 12000 },
          })
        );
      }

      const demoBootPath =
        soundEffects?.['demo-boot']?.path || getAssetUrl('/audio/Windows_NT_-_Boot.mp3');
      const initPromise = this.initialize();

      try {
        // Play immediately from the click chain; fallback URL ensures we still attempt playback
        // even if the keyed effect has not finished loading yet.
        await audioManager.playSoundEffectAndWait('demo-boot', {
          maxWaitMs: 12000,
          force: true,
          fallbackUrl: demoBootPath,
        });
      } finally {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('home-demo-boot-audio-end'));
        }
        if (typeof window !== 'undefined') {
          window._homeBootAudioSequenceActive = false;
        }
      }

      await initPromise;
    })();

    try {
      await this.beginDemoSequencePromise;
    } finally {
      this.beginDemoSequencePromise = null;
    }
  }

  /**
   * Play background music based on the game state or a specific track
   * @param {string} musicType - Type of music to play (default, victory, defeat)
   * @param {string} trackId - Optional specific track ID to play
   * @returns {Promise<boolean>} Resolves to true when music starts immediately
   */
  playBackgroundMusic(musicType = 'default', trackId = null) {
    const previousTrackId = this.currentTrackId;
    // Stop any currently playing music first
    this.stopBackgroundMusic();

    let track;
    const excludeId = previousTrackId || trackId;

    if (trackId) {
      // Play specific track if ID is provided
      track = this.findTrackById(trackId);
    }

    if (!track) {
      if (musicType === 'victory') {
        track = this.findTrackById('victory-music');
      } else if (musicType === 'defeat') {
        track = this.findTrackById('defeat-music');
      } else if (musicType === 'random') {
        // Play random track - exclude victory and defeat music
        track = this.getNextRandomGameplayTrack(excludeId);
      }
    }

    if (!track) {
      // Default to a standard gameplay track if no specific track requested
      track =
        this.findTrackById('gameplay-default') ||
        this.getNextRandomGameplayTrack(excludeId) ||
        this.getGameplayTracks()[0] ||
        soundEffects.BACKGROUND_MUSIC[0];
    }

    if (!track) {
      console.warn(`[AudioService] Couldn't find track for ${trackId || musicType}`);
      return Promise.resolve(false);
    }

    //console.log(`[AUDIO] Playing track: ${track.id} - ${track.title}`);
    this.currentTrackId = track.id;
    this.playedTrackIds.add(track.id);

    const shouldAutoAdvance = musicType === 'random' || trackId !== null;

    // Set global music started flag immediately - this helps other components know we're trying to play music
    if (typeof window !== 'undefined') {
      window._musicStarted = true;
    }

    // Attempt to play the music
    return audioManager
      .playBackgroundMusic(track.path, track, {
        loop: !shouldAutoAdvance,
        onEnded: shouldAutoAdvance
          ? () => {
              this.playBackgroundMusic('random');
            }
          : undefined,
      })
      .then((success) => {
        if (success) {
          //console.log(`[AUDIO] Successfully started playing: ${track.title}`);
        }

        return success;
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error(`[AUDIO] Error playing music:`, err);
        }
        return false;
      });
  }

  /**
   * Find a track by its ID
   * @param {string} trackId - ID of the track to find
   * @returns {Object|null} - Track object or null if not found
   */
  findTrackById(trackId) {
    return soundEffects.BACKGROUND_MUSIC.find((track) => track.id === trackId) || null;
  }

  /**
   * Get all available music tracks
   * @returns {Array} Array of all music tracks
   */
  getAllMusicTracks() {
    return [...soundEffects.BACKGROUND_MUSIC];
  }

  getSelectableTracks({ limit = 15, excludeIds = [] } = {}) {
    let excluded = new Set([...this.playedTrackIds, ...excludeIds]);
    let candidates = soundEffects.BACKGROUND_MUSIC.filter((track) => !excluded.has(track.id));

    if (!candidates.length) {
      this.resetRandomCycle(excludeIds[0]);
      excluded = new Set([...this.playedTrackIds, ...excludeIds]);
      candidates = soundEffects.BACKGROUND_MUSIC.filter((track) => !excluded.has(track.id));
    }

    return this.shuffleTracks(candidates).slice(0, limit);
  }

  resetPlaybackHistory() {
    this.playedTrackIds.clear();
    this.randomQueue = [];
    this.currentTrackId = null;
  }

  /**
   * Get information about the currently playing track
   * @returns {Object|null} Current track information or null if no track is playing
   */
  getCurrentTrack() {
    // Get from AudioManager first
    const track = audioManager.getCurrentTrack();

    // If AudioManager doesn't have the track info, try to find it by ID
    if (!track && this.currentTrackId) {
      return this.findTrackById(this.currentTrackId);
    }

    return track;
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    audioManager.stopBackgroundMusic();
    this.currentTrackId = null;
  }

  /**
   * Play a sound effect
   * @param {string} effectType - Type of sound effect to play
   */
  playSoundEffect(effectType) {
    if (!effectType || !soundEffects[effectType]) {
      console.warn(`[AudioService] Unknown sound effect type: ${effectType}`);
      return;
    }

    const effect = soundEffects[effectType];
    if (Array.isArray(effect)) {
      // If it's an array, randomly select one
      const randomIndex = Math.floor(Math.random() * effect.length);
      audioManager.playSoundEffect(effect[randomIndex].id || effect[randomIndex].path);
    } else if (effect.path) {
      // If it's a single effect
      audioManager.playSoundEffect(effect.id || effect.path);
    }
  }

  /**
   * Stop all currently playing sound effects.
   */
  stopAllSoundEffects() {
    audioManager.stopAllSoundEffects();
  }

  /**
   * Set master volume for all audio
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    if (volume < 0 || volume > 1) {
      console.warn('[AudioService] Volume must be between 0 and 1');
      return;
    }

    audioManager.setVolume(volume);
  }

  /**
   * Toggle mute state for all audio
   * @param {boolean} muted - Whether audio should be muted
   */
  setMuted(muted) {
    audioManager.setMuted(muted);
  }
}

// Export as a singleton
export default new AudioService();
