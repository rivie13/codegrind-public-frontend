import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAudioManager, mockLoadSoundEffects, mockSoundEffects } = vi.hoisted(() => ({
  mockAudioManager: {
    initialize: vi.fn().mockResolvedValue(true),
    playBackgroundMusic: vi.fn().mockResolvedValue(true),
    playSoundEffectAndWait: vi.fn().mockResolvedValue(true),
    stopBackgroundMusic: vi.fn(),
    getCurrentTrack: vi.fn(),
    playSoundEffect: vi.fn(),
    stopAllSoundEffects: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
  },
  mockLoadSoundEffects: vi.fn(),
  mockSoundEffects: {
    BACKGROUND_MUSIC: [
      { id: 'gameplay-default', path: '/g1.mp3', title: 'Gameplay Default' },
      { id: 'alt-track', path: '/g2.mp3', title: 'Alt' },
      { id: 'victory-music', path: '/v.mp3', title: 'Victory' },
      { id: 'defeat-music', path: '/d.mp3', title: 'Defeat' },
    ],
    buttonClick: { id: 'button-click', path: '/click.wav' },
    burst: [
      { id: 'burst-1', path: '/b1.wav' },
      { id: 'burst-2', path: '/b2.wav' },
    ],
  },
}));

vi.mock('./AudioManager', () => ({
  default: mockAudioManager,
}));

vi.mock('./soundEffects', () => ({
  default: mockSoundEffects,
  loadSoundEffects: mockLoadSoundEffects,
}));

import audioService from './AudioService';

describe('AudioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioService.initialized = false;
    audioService.currentTrackId = null;
    audioService.playedTrackIds = new Set();
    audioService.randomQueue = [];
  });

  it('initializes once and loads sound effects', async () => {
    await audioService.initialize();
    await audioService.initialize();

    expect(mockAudioManager.initialize).toHaveBeenCalledTimes(1);
    expect(mockLoadSoundEffects).toHaveBeenCalledTimes(1);
    expect(audioService.initialized).toBe(true);
  });

  it('filters gameplay tracks and randomizes queue selection', () => {
    const gameplay = audioService.getGameplayTracks();
    expect(gameplay.map((track) => track.id)).toEqual(['gameplay-default', 'alt-track']);

    const shuffled = audioService.shuffleTracks(gameplay);
    expect(shuffled).toHaveLength(gameplay.length);

    const next = audioService.getNextRandomGameplayTrack();
    expect(next).toBeTruthy();
    expect(['gameplay-default', 'alt-track']).toContain(next.id);
  });

  it('plays music by type and track id', async () => {
    await expect(audioService.playBackgroundMusic('victory')).resolves.toBe(true);
    expect(mockAudioManager.playBackgroundMusic).toHaveBeenCalledWith(
      '/v.mp3',
      expect.objectContaining({ id: 'victory-music' }),
      expect.any(Object)
    );

    await expect(audioService.playBackgroundMusic('defeat')).resolves.toBe(true);
    expect(mockAudioManager.playBackgroundMusic).toHaveBeenCalledWith(
      '/d.mp3',
      expect.objectContaining({ id: 'defeat-music' }),
      expect.any(Object)
    );

    await expect(audioService.playBackgroundMusic('default', 'alt-track')).resolves.toBe(true);
    expect(mockAudioManager.playBackgroundMusic).toHaveBeenCalledWith(
      '/g2.mp3',
      expect.objectContaining({ id: 'alt-track' }),
      expect.any(Object)
    );
  });

  it('exposes track helpers and playback history controls', () => {
    audioService.currentTrackId = 'alt-track';
    mockAudioManager.getCurrentTrack.mockReturnValue(null);

    expect(audioService.findTrackById('alt-track')?.title).toBe('Alt');
    expect(audioService.getAllMusicTracks()).toHaveLength(4);
    expect(audioService.getCurrentTrack()?.id).toBe('alt-track');

    audioService.playedTrackIds.add('gameplay-default');
    expect(audioService.getSelectableTracks({ limit: 1 })).toHaveLength(1);

    audioService.resetPlaybackHistory();
    expect(audioService.playedTrackIds.size).toBe(0);
    expect(audioService.currentTrackId).toBeNull();
  });

  it('plays sound effects and forwards audio controls', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    audioService.playSoundEffect('missing');
    expect(warnSpy).toHaveBeenCalled();

    audioService.playSoundEffect('buttonClick');
    expect(mockAudioManager.playSoundEffect).toHaveBeenCalledWith('button-click');

    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    audioService.playSoundEffect('burst');
    expect(mockAudioManager.playSoundEffect).toHaveBeenCalledWith('burst-2');

    audioService.stopAllSoundEffects();
    audioService.stopBackgroundMusic();
    audioService.setMuted(true);
    audioService.setVolume(0.5);
    audioService.setVolume(2);

    expect(mockAudioManager.stopAllSoundEffects).toHaveBeenCalled();
    expect(mockAudioManager.stopBackgroundMusic).toHaveBeenCalled();
    expect(mockAudioManager.setMuted).toHaveBeenCalledWith(true);
    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5);
  });

  it('keeps gameplay music off during begin demo boot sequence', async () => {
    await audioService.playBeginDemoSequence();

    expect(mockAudioManager.playSoundEffectAndWait).toHaveBeenCalledWith(
      'demo-boot',
      expect.objectContaining({
        maxWaitMs: 12000,
        force: true,
      })
    );
    expect(mockAudioManager.playBackgroundMusic).not.toHaveBeenCalled();
  });
});
