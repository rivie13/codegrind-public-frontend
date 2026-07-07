import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearNativeImageCache,
  loadNativeImage,
  queueLoaderFiles,
} from './apartmentPreviewScene.utils';

const createSceneLoaderHarness = (startImplementation) => {
  const listeners = new Map();

  const scene = {
    load: {
      image: vi.fn(),
      off: vi.fn((eventName, handler) => {
        listeners.delete(`${eventName}:${handler}`);
      }),
      on: vi.fn((eventName, handler) => {
        listeners.set(`${eventName}:${handler}`, handler);
      }),
      spritesheet: vi.fn(),
      start: vi.fn(() => {
        const emit = (eventName, payload) => {
          [...listeners.entries()].forEach(([listenerKey, handler]) => {
            if (listenerKey.startsWith(`${eventName}:`)) {
              handler(payload);
            }
          });
        };

        startImplementation({ emit });
      }),
    },
    textures: {
      exists: vi.fn(() => false),
    },
  };

  return scene;
};

afterEach(() => {
  clearNativeImageCache();
  vi.restoreAllMocks();
});

describe('queueLoaderFiles', () => {
  it('allows optional asset failures to fall through to completion', async () => {
    const scene = createSceneLoaderHarness(({ emit }) => {
      emit('loaderror', { key: 'optional-backdrop', src: '/backdrop.png' });
      emit('complete');
    });

    await expect(
      queueLoaderFiles(scene, [
        {
          key: 'optional-backdrop',
          optional: true,
          path: '/backdrop.png',
          type: 'image',
        },
      ])
    ).resolves.toBeUndefined();

    expect(scene.load.image).toHaveBeenCalledWith('optional-backdrop', '/backdrop.png');
  });

  it('still rejects required asset failures', async () => {
    const scene = createSceneLoaderHarness(({ emit }) => {
      emit('loaderror', { key: 'required-backdrop', src: '/backdrop.png' });
    });

    await expect(
      queueLoaderFiles(scene, [
        {
          key: 'required-backdrop',
          path: '/backdrop.png',
          type: 'image',
        },
      ])
    ).rejects.toThrow('Unable to load Phaser asset: /backdrop.png');
  });
});

describe('loadNativeImage', () => {
  it('reuses the same in-flight image request for the same source path', async () => {
    const originalImage = globalThis.Image;
    const assignedSources = [];

    class MockImage {
      set src(value) {
        assignedSources.push(value);
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    vi.stubGlobal('Image', MockImage);

    try {
      const firstRequest = loadNativeImage('/city-v2/tiled/backgrounds_loadingScreens/dusk.png');
      const secondRequest = loadNativeImage('/city-v2/tiled/backgrounds_loadingScreens/dusk.png');

      expect(firstRequest).toBe(secondRequest);

      await Promise.all([firstRequest, secondRequest]);
      expect(assignedSources).toEqual(['/city-v2/tiled/backgrounds_loadingScreens/dusk.png']);
    } finally {
      vi.stubGlobal('Image', originalImage);
    }
  });
});
