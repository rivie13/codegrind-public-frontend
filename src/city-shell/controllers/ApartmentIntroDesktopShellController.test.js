import { describe, expect, it } from 'vitest';

import apartmentIntroShellScenario from '../scenarios/apartmentIntroScenario';
import ApartmentIntroDesktopShellController from './ApartmentIntroDesktopShellController';

describe('ApartmentIntroDesktopShellController credits window', () => {
  it('shows a credits icon and opens and closes the credits window', () => {
    const controller = new ApartmentIntroDesktopShellController();
    const initialSnapshot = controller.getSnapshot();
    const creditsIcon = initialSnapshot.desktopIcons.find(
      (icon) => icon.id === apartmentIntroShellScenario.creditsIcon.id
    );

    expect(creditsIcon).toEqual(
      expect.objectContaining({
        clickable: true,
        label: 'Credits',
        visible: true,
      })
    );
    expect(initialSnapshot.openWindows.credits).toBe(false);

    controller.activateDesktopIcon(apartmentIntroShellScenario.creditsIcon.id);

    const openedSnapshot = controller.getSnapshot();
    expect(openedSnapshot.openWindows.credits).toBe(true);
    expect(openedSnapshot.launchNote).toMatch(/credits/i);

    controller.closeCreditsWindow();

    const closedSnapshot = controller.getSnapshot();
    expect(closedSnapshot.openWindows.credits).toBe(false);

    controller.destroy();
  });
});
