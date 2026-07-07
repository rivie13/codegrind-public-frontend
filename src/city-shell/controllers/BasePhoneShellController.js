import getAssetUrl from '../../utils/assets/assetUrl';
import BaseDeviceShellController from './BaseDeviceShellController';

class BasePhoneShellController extends BaseDeviceShellController {
  buildPhoneAppLaunchRequest(currentSnapshot, selectedApp) {
    const appLaunchRequest =
      selectedApp?.launchRequest && typeof selectedApp.launchRequest === 'object'
        ? { ...selectedApp.launchRequest }
        : {};

    return {
      ...appLaunchRequest,
      appId: selectedApp.id,
      programId:
        selectedApp.programId ||
        appLaunchRequest.programId ||
        selectedApp.label ||
        currentSnapshot.title,
      shellId: currentSnapshot.shellId,
      source: this.context.requestSource || appLaunchRequest.source || null,
      targetLaunchRequest:
        selectedApp.targetLaunchRequest || appLaunchRequest.targetLaunchRequest || null,
      targetPath: selectedApp.targetPath || appLaunchRequest.targetPath || null,
      terminalInstanceId: currentSnapshot.terminalInstanceId,
      terminalName: currentSnapshot.terminalName,
    };
  }

  buildPhoneActionLaunchRequest(currentSnapshot, action) {
    const launchRequest =
      action?.launchRequest && typeof action.launchRequest === 'object'
        ? { ...action.launchRequest }
        : {};

    return {
      ...launchRequest,
      actionId: action?.id || null,
      appId: action?.appId || currentSnapshot.activePhoneAppId || null,
      programId:
        action?.programId || launchRequest.programId || action?.label || currentSnapshot.title,
      shellId: currentSnapshot.shellId,
      source: this.context.requestSource || action?.source || launchRequest.source || null,
      targetLaunchRequest: action?.targetLaunchRequest || launchRequest.targetLaunchRequest || null,
      targetPath: action?.targetPath || launchRequest.targetPath || null,
      terminalInstanceId: currentSnapshot.terminalInstanceId,
      terminalName: currentSnapshot.terminalName,
    };
  }

  createInitialSnapshot() {
    return {
      ...super.createInitialSnapshot(),
      activePhoneAppId: null,
      footerHint: 'Close the field device to return to the room.',
      launchNote: '',
      phoneApps: [],
      phoneHardwareFrameSrc: getAssetUrl(
        '/city-v2/tiled/device-shell-art/Pixelized_Phone_2/Pixelized_Phone_2/Model_02/Black/front.png'
      ),
      phoneHomeHint: 'Tap an app to open it.',
      phoneHomeNotifications: [],
      phoneHomeTitle: 'Field Device Home',
      phoneMode: 'menu',
      phoneView: 'home',
      shellFamilyId: 'phone',
      subtitle: 'Field device interface online',
      title: 'Field Device',
    };
  }

  activatePhoneApp(appId) {
    const currentSnapshot = this.getSnapshot();
    const selectedApp = currentSnapshot.phoneApps.find((app) => app.id === appId);

    if (!selectedApp || selectedApp.disabled) {
      return;
    }

    if (selectedApp.action === 'close-shell') {
      this.context.onRequestClose?.({
        appId,
        shellId: currentSnapshot.shellId,
        source: this.context.requestSource || null,
      });
      return;
    }

    if (selectedApp.action === 'launch-program') {
      if (typeof this.context.onLaunchProgram === 'function') {
        this.context.onLaunchProgram(this.buildPhoneAppLaunchRequest(currentSnapshot, selectedApp));
        return;
      }
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      activePhoneAppId: appId,
      launchNote: selectedApp.launchNote || previousSnapshot.launchNote,
      phoneView: 'app',
    }));
  }

  returnToPhoneHome() {
    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      phoneView: 'home',
    }));
  }

  runPhoneAction(action) {
    if (!action || typeof action !== 'object') {
      return;
    }

    const currentSnapshot = this.getSnapshot();

    if (action.type === 'activate-app' && action.appId) {
      this.activatePhoneApp(action.appId);
      return;
    }

    if (action.type === 'launch-program') {
      if (typeof this.context.onLaunchProgram === 'function') {
        this.context.onLaunchProgram(this.buildPhoneActionLaunchRequest(currentSnapshot, action));
      }
      return;
    }

    if (action.type === 'set-waypoint') {
      this.context.onSetWaypoint?.(action.waypoint || action.payload || null);
      return;
    }

    if (action.type === 'return-to-site') {
      this.context.onReturnToSite?.(action.payload || null);
      return;
    }

    if (action.type === 'close-shell') {
      this.context.onRequestClose?.({
        actionId: action.id || null,
        shellId: currentSnapshot.shellId,
        source: this.context.requestSource || null,
      });
    }
  }
}

export default BasePhoneShellController;
