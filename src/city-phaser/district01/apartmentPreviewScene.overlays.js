import { attachLoadingOverlayMethods } from './overlays/loadingOverlayMethods';
import { attachOverlaySetupMethods } from './overlays/overlaySetupMethods';
import { attachOverlayLayoutMethods } from './overlays/overlayLayoutMethods';
import { attachIntroFlowMethods } from './overlays/introFlowMethods';
import { attachWindowCameraTerminalMethods } from './overlays/windowCameraTerminalMethods';
import { attachViewportCameraMethods } from './overlays/viewportCameraMethods';

export const attachApartmentPreviewSceneOverlayMethods = (SceneClass, Phaser) => {
  attachLoadingOverlayMethods(SceneClass, Phaser);
  attachOverlaySetupMethods(SceneClass, Phaser);
  attachOverlayLayoutMethods(SceneClass, Phaser);
  attachIntroFlowMethods(SceneClass, Phaser);
  attachWindowCameraTerminalMethods(SceneClass, Phaser);
  attachViewportCameraMethods(SceneClass, Phaser);
};
