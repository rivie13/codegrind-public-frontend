import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeAudioMock = (playQueue = []) => {
  const queue = [...playQueue];

  class MockAudio {
    constructor(url) {
      this.url = url;
      this.volume = 1;
      this.loop = true;
      this.currentTime = 0;
      this.onended = null;
      this.onpause = null;
      this.play = vi.fn(() => {
        if (queue.length > 0) {
          return queue.shift()();
        }
        return Promise.resolve();
      });
      this.pause = vi.fn();
    }

    cloneNode() {
      return new MockAudio(this.url);
    }
  }

  globalThis.Audio = MockAudio;
  return MockAudio;
};

const loadAudioManager = async () => {
  vi.resetModules();
  const mod = await import('./AudioManager');
  return mod.default;
};

describe('AudioManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes and loads/plays sound effects with rate limiting', async () => {
    makeAudioMock();
    const manager = await loadAudioManager();

    await manager.initialize();
    expect(manager.initialized).toBe(true);

    manager.loadSoundEffect('tower-placed', '/x.wav');
    expect(manager.soundEffects['tower-placed']).toBeDefined();

    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
    manager.playSoundEffect('tower-placed');
    expect(manager.activeSoundEffects.size).toBe(1);

    nowSpy.mockReturnValue(1020);
    manager.playSoundEffect('tower-placed');
    expect(manager.activeSoundEffects.size).toBe(1);

    manager.stopAllSoundEffects();
    expect(manager.activeSoundEffects.size).toBe(0);
  });

  it('plays background music successfully and emits track change', async () => {
    makeAudioMock([() => Promise.resolve()]);
    const manager = await loadAudioManager();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const started = await manager.playBackgroundMusic('/music.mp3', { id: 'm1', title: 'Track' });
    expect(started).toBe(true);
    expect(manager.getCurrentTrack()).toEqual({ id: 'm1', title: 'Track' });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
  });

  it('handles autoplay blocking and retries after user interaction', async () => {
    const notAllowedError = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    makeAudioMock([() => Promise.reject(notAllowedError), () => Promise.resolve()]);
    const manager = await loadAudioManager();

    const started = await manager.playBackgroundMusic(
      '/blocked.mp3',
      { id: 'm2' },
      { loop: false }
    );
    expect(started).toBe(false);
    expect(manager._pendingTrack).toBeTruthy();

    document.dispatchEvent(new Event('click'));
    await Promise.resolve();
    expect(manager._pendingTrack).toBeNull();
  });

  it('retries blocked autoplay on capture-phase pointer input', async () => {
    const notAllowedError = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    makeAudioMock([() => Promise.reject(notAllowedError), () => Promise.resolve()]);
    const manager = await loadAudioManager();

    const started = await manager.playBackgroundMusic('/blocked.mp3', { id: 'm7' });
    expect(started).toBe(false);
    expect(manager._pendingTrack).toBeTruthy();

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await Promise.resolve();
    expect(manager._pendingTrack).toBeNull();
  });

  it('waits for keyup before retrying blocked autoplay so gameplay keydowns stay usable', async () => {
    const notAllowedError = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    makeAudioMock([() => Promise.reject(notAllowedError), () => Promise.resolve()]);
    const manager = await loadAudioManager();

    const started = await manager.playBackgroundMusic('/blocked.mp3', { id: 'm8' });
    expect(started).toBe(false);
    expect(manager._pendingTrack).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'KeyD', key: 'd' }));
    await Promise.resolve();
    expect(manager._pendingTrack).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, code: 'KeyD', key: 'd' }));
    await Promise.resolve();
    expect(manager._pendingTrack).toBeNull();
  });

  it('logs retry failure when autoplay retry still cannot play', async () => {
    const notAllowedError = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    const retryError = new Error('still-blocked');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    makeAudioMock([() => Promise.reject(notAllowedError), () => Promise.reject(retryError)]);
    const manager = await loadAudioManager();

    const started = await manager.playBackgroundMusic(
      '/blocked.mp3',
      { id: 'm3' },
      { loop: false }
    );
    expect(started).toBe(false);

    document.dispatchEvent(new Event('click'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalled();
  });

  it('clears pending autoplay retry when background music is stopped', async () => {
    const notAllowedError = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    makeAudioMock([() => Promise.reject(notAllowedError), () => Promise.resolve()]);
    const manager = await loadAudioManager();

    const started = await manager.playBackgroundMusic('/blocked.mp3', { id: 'm5' });
    expect(started).toBe(false);
    expect(manager._pendingTrack).toBeTruthy();

    manager.stopBackgroundMusic();
    expect(manager._pendingTrack).toBeNull();
    expect(manager.getCurrentTrack()).toBeNull();

    document.dispatchEvent(new Event('click'));
    await Promise.resolve();
    expect(manager.getCurrentTrack()).toBeNull();
  });

  it('can resume pending autoplay directly when input handlers intercept the event', async () => {
    const notAllowedError = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    makeAudioMock([() => Promise.reject(notAllowedError), () => Promise.resolve()]);
    const manager = await loadAudioManager();

    const started = await manager.playBackgroundMusic('/blocked.mp3', { id: 'm6' });
    expect(started).toBe(false);

    expect(manager.resumePendingAutoplay()).toBe(true);
    await Promise.resolve();
    expect(manager._pendingTrack).toBeNull();
  });

  it('rejects background music promise for non-NotAllowed errors', async () => {
    const boom = new Error('boom');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    makeAudioMock([() => Promise.reject(boom)]);
    const manager = await loadAudioManager();

    await expect(manager.playBackgroundMusic('/error.mp3', { id: 'm4' })).rejects.toThrow('boom');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('updates settings and persists values to localStorage', async () => {
    makeAudioMock();
    const manager = await loadAudioManager();

    manager.loadSoundEffect('button-click', '/click.wav');
    manager.updateSoundEffectsSettings(false, 0.25);
    expect(manager.getSettings().soundEffectsEnabled).toBe(false);
    expect(manager.soundEffects['button-click'].volume).toBe(0.25);
    expect(localStorage.getItem('td_soundEffectsEnabled')).toBe('false');

    manager.playBackgroundMusic = vi.fn();
    manager.backgroundMusic = new Audio('/bg.mp3');
    manager.updateMusicSettings(false, 0.2);
    expect(manager.getSettings().musicEnabled).toBe(false);
    expect(localStorage.getItem('td_musicEnabled')).toBe('false');

    manager.backgroundMusic = new Audio('/bg2.mp3');
    manager.updateMusicSettings(true, 0.8);
    expect(manager.backgroundMusic.volume).toBe(0.8);
  });
});
