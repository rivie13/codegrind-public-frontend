import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./AudioManager', () => ({
  default: {
    loadSoundEffect: vi.fn(),
  },
}));

vi.mock('../assets/assetUrl', () => ({
  default: vi.fn((path) => `/base${path}`),
}));

import audioManager from './AudioManager';
import {
  SOUND_EFFECTS,
  RECOMMENDED_SOUNDS,
  BACKGROUND_MUSIC,
  loadSoundEffects,
} from './soundEffects';

describe('SOUND_EFFECTS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SOUND_EFFECTS)).toBe(true);
    expect(SOUND_EFFECTS.length).toBeGreaterThan(0);
  });

  it('each entry has id, name, path, and volume', () => {
    for (const effect of SOUND_EFFECTS) {
      expect(effect).toHaveProperty('id');
      expect(effect).toHaveProperty('name');
      expect(effect).toHaveProperty('path');
      expect(effect).toHaveProperty('volume');
    }
  });

  it('contains expected sound ids', () => {
    const ids = SOUND_EFFECTS.map((e) => e.id);
    expect(ids).toContain('wave-start');
    expect(ids).toContain('enemy-defeated');
    expect(ids).toContain('level-complete');
    expect(ids).toContain('game-over');
  });

  it('applies asset base url to paths', () => {
    const waveStart = SOUND_EFFECTS.find((e) => e.id === 'wave-start');
    expect(waveStart.path).toMatch(/^\/base\//);
  });
});

describe('RECOMMENDED_SOUNDS', () => {
  it('is a non-null object', () => {
    expect(typeof RECOMMENDED_SOUNDS).toBe('object');
    expect(RECOMMENDED_SOUNDS).not.toBeNull();
  });

  it('includes expected keys', () => {
    expect(RECOMMENDED_SOUNDS).toHaveProperty('wave-start');
    expect(RECOMMENDED_SOUNDS).toHaveProperty('level-complete');
    expect(RECOMMENDED_SOUNDS).toHaveProperty('game-over');
  });

  it('all values are non-empty strings', () => {
    for (const val of Object.values(RECOMMENDED_SOUNDS)) {
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    }
  });
});

describe('BACKGROUND_MUSIC', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(BACKGROUND_MUSIC)).toBe(true);
    expect(BACKGROUND_MUSIC.length).toBeGreaterThan(0);
  });

  it('each track has id, path, title, artist, attribution', () => {
    for (const track of BACKGROUND_MUSIC) {
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('path');
      expect(track).toHaveProperty('title');
      expect(track).toHaveProperty('artist');
      expect(track).toHaveProperty('attribution');
    }
  });

  it('paths have asset base applied', () => {
    for (const track of BACKGROUND_MUSIC) {
      expect(track.path).toMatch(/^\/base\//);
    }
  });
});

describe('loadSoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls audioManager.loadSoundEffect for each sound effect', () => {
    loadSoundEffects();
    expect(audioManager.loadSoundEffect).toHaveBeenCalled();
  });

  it('calls loadSoundEffect with string id and path for each call', () => {
    loadSoundEffects();
    const calls = audioManager.loadSoundEffect.mock.calls;
    for (const [id, path] of calls) {
      expect(typeof id).toBe('string');
      expect(typeof path).toBe('string');
    }
  });

  it('does not preload background music tracks as sound effects', () => {
    loadSoundEffects();
    const ids = audioManager.loadSoundEffect.mock.calls.map(([id]) => id);
    expect(ids).not.toContain(BACKGROUND_MUSIC[0].id);
  });
});
