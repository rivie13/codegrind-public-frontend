import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CityPhaserAnimatedWindowViewSign from './CityPhaserAnimatedWindowViewSign';

describe('CityPhaserAnimatedWindowViewSign', () => {
  let animationFrameCallbacks;
  let nextAnimationFrameId;
  let originalCancelAnimationFrame;
  let originalRequestAnimationFrame;
  let timestampMs;

  const runAnimationFrame = (elapsedMs) => {
    timestampMs += elapsedMs;
    const pendingCallbacks = [...animationFrameCallbacks.entries()];
    animationFrameCallbacks.clear();
    pendingCallbacks.forEach(([, callback]) => {
      callback(timestampMs);
    });
  };

  beforeEach(() => {
    animationFrameCallbacks = new Map();
    nextAnimationFrameId = 0;
    timestampMs = 0;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.requestAnimationFrame = vi.fn((callback) => {
      const animationFrameId = ++nextAnimationFrameId;
      animationFrameCallbacks.set(animationFrameId, callback);
      return animationFrameId;
    });

    window.cancelAnimationFrame = vi.fn((animationFrameId) => {
      animationFrameCallbacks.delete(animationFrameId);
    });
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('advances backdrop sign frames with requestAnimationFrame timing', () => {
    render(
      <ChakraProvider>
        <CityPhaserAnimatedWindowViewSign
          backdropRect={{ height: 240, left: 0, top: 0, width: 480 }}
          frameDelayMs={100}
          framePlacement={{ anchorX: 0.5, anchorY: 0.5, width: 0.1, x: 0.4, y: 0.5 }}
          frameSources={['/frame-0.png', '/frame-1.png', '/frame-2.png']}
          signId="intro-test-sign"
        />
      </ChakraProvider>
    );

    const animatedSign = screen.getByTestId('city-backdrop-sign-intro-test-sign');

    expect(animatedSign.getAttribute('src')).toContain('/frame-0.png');

    act(() => {
      runAnimationFrame(16);
    });

    expect(animatedSign.getAttribute('src')).toContain('/frame-0.png');

    act(() => {
      runAnimationFrame(100);
    });

    expect(animatedSign.getAttribute('src')).toContain('/frame-1.png');

    act(() => {
      runAnimationFrame(200);
    });

    expect(animatedSign.getAttribute('src')).toContain('/frame-0.png');
  });

  it('uses the shared animation tick when one is provided', () => {
    const { rerender } = render(
      <ChakraProvider>
        <CityPhaserAnimatedWindowViewSign
          animationTickMs={0}
          backdropRect={{ height: 240, left: 0, top: 0, width: 480 }}
          frameDelayMs={100}
          framePlacement={{ anchorX: 0.5, anchorY: 0.5, width: 0.1, x: 0.4, y: 0.5 }}
          frameSources={['/frame-0.png', '/frame-1.png', '/frame-2.png']}
          signId="shared-clock-test-sign"
        />
      </ChakraProvider>
    );

    const animatedSign = screen.getByTestId('city-backdrop-sign-shared-clock-test-sign');

    expect(animatedSign.getAttribute('src')).toContain('/frame-0.png');

    rerender(
      <ChakraProvider>
        <CityPhaserAnimatedWindowViewSign
          animationTickMs={220}
          backdropRect={{ height: 240, left: 0, top: 0, width: 480 }}
          frameDelayMs={100}
          framePlacement={{ anchorX: 0.5, anchorY: 0.5, width: 0.1, x: 0.4, y: 0.5 }}
          frameSources={['/frame-0.png', '/frame-1.png', '/frame-2.png']}
          signId="shared-clock-test-sign"
        />
      </ChakraProvider>
    );

    expect(animatedSign.getAttribute('src')).toContain('/frame-2.png');
  });
});
