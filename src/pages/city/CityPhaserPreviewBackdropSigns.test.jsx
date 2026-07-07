import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const loadBackdropSigns = async ({ dev = true, tiledProjectRootUrl = '' } = {}) => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('DEV', dev ? 'true' : '');
  vi.stubEnv('PROD', dev ? '' : 'true');
  vi.stubEnv('VITE_TILED_PROJECT_ROOT_URL', tiledProjectRootUrl);

  return import('./CityPhaserPreviewBackdropSigns');
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('CityPhaserPreviewBackdropSigns', () => {
  it('routes lit backdrop sign frames through the external tiled asset root in dev', async () => {
    const { default: CityPhaserPreviewBackdropSigns } = await loadBackdropSigns({
      dev: true,
      tiledProjectRootUrl: '/__external_tiled__',
    });

    render(
      <ChakraProvider>
        <CityPhaserPreviewBackdropSigns
          backdropRect={{ height: 918, left: 0, top: 0, width: 1881 }}
        />
      </ChakraProvider>
    );

    expect(screen.getByTestId('city-backdrop-sign-sign-17-teal-left-edge')).toHaveAttribute(
      'src',
      expect.stringContaining(
        '/__external_tiled__/Pixel%20Art%20Sign%20Pack%20-%20Animated/Pixel%20Art%20Sign%20Pack%20-%20Animated/Sign%2017/TEAL/Sign%2017%20Glow%20-%20TEAL_000.png'
      )
    );
  });
});
