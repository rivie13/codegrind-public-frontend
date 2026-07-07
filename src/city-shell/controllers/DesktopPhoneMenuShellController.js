import getAssetUrl from '../../utils/assets/assetUrl';
import WorldPhoneShellController from './WorldPhoneShellController';

class DesktopPhoneMenuShellController extends WorldPhoneShellController {
  constructor(context = {}) {
    super({
      ...context,
      deviceClass: 'desktop',
      shellId: context.shellId || 'desktop-phone-menu',
      terminalName: context.terminalName || 'Companion Phone',
    });
  }

  createInitialSnapshot() {
    return {
      ...super.createInitialSnapshot(),
      footerHint: 'Stow the handset when you are ready to head back out.',
      launchNote: 'City handset ready.',
      phoneHardwareFrameSrc: getAssetUrl(
        '/city-v2/tiled/device-shell-art/Pixelized_Phone_2/Pixelized_Phone_2/Model_02/White/front.png'
      ),
      notifications: [
        {
          id: 'desktop-phone-notification',
          message: 'City handset linked.',
          title: 'Field device ready',
          tone: 'info',
        },
      ],
      subtitle: 'Port Meridian Phone // Field ready',
      title: 'Port Meridian Phone',
    };
  }
}

export default DesktopPhoneMenuShellController;
