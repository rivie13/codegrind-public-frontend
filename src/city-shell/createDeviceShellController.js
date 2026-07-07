import {
  APARTMENT_HUB_SHELL_ID,
  APARTMENT_INTRO_PHONE_SHELL_ID,
  APARTMENT_INTRO_SHELL_ID,
  DESKTOP_INTRO_PHONE_MENU_SHELL_ID,
  DESKTOP_PHONE_MENU_SHELL_ID,
  WORLD_PHONE_SHELL_ID,
} from '../utils/navigation/apartmentEntryState';
import ApartmentHubDesktopShellController from './controllers/ApartmentHubDesktopShellController';
import ApartmentIntroDesktopShellController from './controllers/ApartmentIntroDesktopShellController';
import ApartmentIntroPhoneShellController from './controllers/ApartmentIntroPhoneShellController';
import DesktopIntroPhoneMenuShellController from './controllers/DesktopIntroPhoneMenuShellController';
import DesktopPhoneMenuShellController from './controllers/DesktopPhoneMenuShellController';
import WorldPhoneShellController from './controllers/WorldPhoneShellController';

export const createDeviceShellController = (request) => {
  if (!request?.shellId) {
    throw new Error('Device shell request is missing a shellId.');
  }

  switch (request.shellId) {
    case APARTMENT_HUB_SHELL_ID:
      return new ApartmentHubDesktopShellController(request);
    case APARTMENT_INTRO_SHELL_ID:
      return new ApartmentIntroDesktopShellController(request);
    case APARTMENT_INTRO_PHONE_SHELL_ID:
      return new ApartmentIntroPhoneShellController(request);
    case WORLD_PHONE_SHELL_ID:
      return new WorldPhoneShellController(request);
    case DESKTOP_INTRO_PHONE_MENU_SHELL_ID:
      return new DesktopIntroPhoneMenuShellController(request);
    case DESKTOP_PHONE_MENU_SHELL_ID:
      return new DesktopPhoneMenuShellController(request);
    default:
      throw new Error(`Unsupported device shell: ${request.shellId}`);
  }
};

export default createDeviceShellController;
