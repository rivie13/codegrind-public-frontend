import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  preloadImageSources,
  shouldRunBackdropSignClock,
} from './CityPhaserPreviewBackdropSigns.utils';

describe('shouldRunBackdropSignClock', () => {
  it('starts the shared clock before the vista reveal gate has finished', () => {
    expect(
      shouldRunBackdropSignClock({
        backdropRect: { height: 400, left: 0, top: 0, width: 800 },
        bootError: '',
        bootPhase: 'ready',
        isCityVistaPresentationRequested: true,
      })
    ).toBe(true);
  });

  it('stays off until the scene is ready or there is a backdrop rect to animate against', () => {
    expect(
      shouldRunBackdropSignClock({
        backdropRect: null,
        bootError: '',
        bootPhase: 'ready',
        isCityVistaPresentationRequested: true,
      })
    ).toBe(false);

    expect(
      shouldRunBackdropSignClock({
        backdropRect: { height: 400, left: 0, top: 0, width: 800 },
        bootError: '',
        bootPhase: 'scene',
        isCityVistaPresentationRequested: true,
      })
    ).toBe(false);
  });
});

describe('preloadImageSources', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('waits for decoded unique image sources before resolving', async () => {
    const originalImage = window.Image;
    const imageInstances = [];
    const decodeResolvers = [];

    class MockImage {
      constructor() {
        this.complete = false;
        this.naturalHeight = 0;
        this.naturalWidth = 0;
        this.onload = null;
        this.onerror = null;
        imageInstances.push(this);
      }

      decode() {
        return new Promise((resolve) => {
          decodeResolvers.push(resolve);
        });
      }

      set src(value) {
        this._src = value;
      }

      get src() {
        return this._src;
      }
    }

    window.Image = MockImage;

    const preloadPromise = preloadImageSources(['/sign-a.png', '/sign-a.png', '/sign-b.png']);
    const requestedImages = imageInstances.filter((imageInstance) => imageInstance.src);

    expect(requestedImages).toHaveLength(2);

    requestedImages.forEach((imageInstance) => {
      imageInstance.complete = true;
      imageInstance.naturalHeight = 24;
      imageInstance.naturalWidth = 24;
      imageInstance.onload?.();
    });

    let isResolved = false;
    preloadPromise.then(() => {
      isResolved = true;
    });

    await Promise.resolve();
    expect(isResolved).toBe(false);

    decodeResolvers.forEach((resolveDecode) => resolveDecode());

    await expect(preloadPromise).resolves.toBe(true);

    window.Image = originalImage;
  });
});
