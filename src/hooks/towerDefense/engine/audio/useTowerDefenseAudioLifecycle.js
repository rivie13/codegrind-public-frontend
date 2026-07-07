import { useEffect } from 'react';
import AudioService from '../../../../utils/audio/AudioService';

export default function useTowerDefenseAudioLifecycle() {
  useEffect(() => {
    const isBootSequenceBlockingMusic = () => {
      if (typeof window === 'undefined') return false;
      return Boolean(window._homeBootAudioSequenceActive || window._homeDemoBootSequenceActive);
    };

    const tryStartGameplayMusic = () => {
      if (typeof window === 'undefined') return false;
      if (!window._musicInitialized || window._musicStarted) return false;
      if (isBootSequenceBlockingMusic()) return false;

      window._musicStarted = true;
      AudioService.playBackgroundMusic('random');
      return true;
    };

    const detachInteractionListeners = () => {
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('keydown', startMusicOnInteraction);
    };

    const detachBootReadyListener = () => {
      window.removeEventListener('home-demo-boot-sequence-complete', startMusicAfterBootSequence);
    };

    const startMusicAfterBootSequence = () => {
      if (tryStartGameplayMusic()) {
        detachInteractionListeners();
        detachBootReadyListener();
      }
    };

    // Reset music state flags for clean initialization
    if (typeof window !== 'undefined') {
      window._musicInitialized = false;
      window._musicStarted = false;
    }

    AudioService.resetPlaybackHistory();

    AudioService.initialize().then(() => {
      if (typeof window !== 'undefined') {
        window._musicInitialized = true;
      }

      // Attempt to start music immediately if no boot sequence is blocking it.
      startMusicAfterBootSequence();
    });

    const startMusicOnInteraction = () => {
      if (tryStartGameplayMusic()) {
        detachInteractionListeners();
        detachBootReadyListener();
      }
    };

    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    window.addEventListener('home-demo-boot-sequence-complete', startMusicAfterBootSequence);

    return () => {
      AudioService.stopBackgroundMusic();
      detachInteractionListeners();
      detachBootReadyListener();
    };
  }, []);
}
