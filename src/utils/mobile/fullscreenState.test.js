import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exitAppFullscreen,
  isFullscreenActive,
  readFullscreenIntent,
  requestAppFullscreen,
  restoreFullscreenFromIntent,
  writeFullscreenIntent,
} from './fullscreenState';

describe('fullscreenState', () => {
  let fullscreenElement;
  let requestFullscreenMock;
  let exitFullscreenMock;

  beforeEach(() => {
    window.sessionStorage.clear();
    fullscreenElement = null;

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });

    requestFullscreenMock = vi.fn(async () => {
      fullscreenElement = document.documentElement;
    });
    exitFullscreenMock = vi.fn(async () => {
      fullscreenElement = null;
    });

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreenMock,
    });

    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreenMock,
    });
  });

  it('requests fullscreen on the document element and stores intent', async () => {
    const success = await requestAppFullscreen();

    expect(success).toBe(true);
    expect(requestFullscreenMock).toHaveBeenCalledWith({ navigationUI: 'hide' });
    expect(isFullscreenActive()).toBe(true);
    expect(readFullscreenIntent()).toBe(true);
  });

  it('does not request fullscreen when no intent was stored', async () => {
    const success = await restoreFullscreenFromIntent();

    expect(success).toBe(false);
    expect(requestFullscreenMock).not.toHaveBeenCalled();
  });

  it('re-enters fullscreen from stored intent and clears the intent on exit', async () => {
    writeFullscreenIntent(true);

    const restored = await restoreFullscreenFromIntent();
    expect(restored).toBe(true);
    expect(isFullscreenActive()).toBe(true);

    const exited = await exitAppFullscreen();
    expect(exited).toBe(true);
    expect(exitFullscreenMock).toHaveBeenCalledTimes(1);
    expect(isFullscreenActive()).toBe(false);
    expect(readFullscreenIntent()).toBe(false);
  });
});
