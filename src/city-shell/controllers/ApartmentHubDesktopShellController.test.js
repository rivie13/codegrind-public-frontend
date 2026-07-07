import { describe, expect, it, vi } from 'vitest';

import ApartmentHubDesktopShellController from './ApartmentHubDesktopShellController';

describe('ApartmentHubDesktopShellController', () => {
  it('exposes a back-to-site start menu action and routes through the host callback', () => {
    const onReturnToSite = vi.fn();
    const controller = new ApartmentHubDesktopShellController({ onReturnToSite });

    const initialSnapshot = controller.getSnapshot();

    expect(initialSnapshot.startMenuActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'return-to-site',
          label: 'Back to site',
          sprite: 'browser',
        }),
      ])
    );

    controller.activateStartMenuAction('return-to-site');

    expect(onReturnToSite).toHaveBeenCalledWith(
      expect.objectContaining({
        shellId: 'apartment-hub-desktop',
      })
    );
    expect(controller.getSnapshot().launchNote).toMatch(/main codegrind site/i);

    controller.destroy();
  });
});
