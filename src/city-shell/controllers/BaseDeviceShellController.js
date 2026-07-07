class BaseDeviceShellController {
  constructor(context = {}) {
    this.context = context;
    this.listeners = new Set();
    this.timers = new Set();
    this.snapshot = this.createInitialSnapshot();
  }

  createInitialSnapshot() {
    return {
      deviceClass: this.context.deviceClass || 'desktop',
      notifications: [],
      shellFamilyId: this.context.shellFamilyId || 'device',
      shellId: this.context.shellId || 'device-shell',
      terminalInstanceId: this.context.terminalInstanceId || 'unknown-terminal',
      terminalName: this.context.terminalName || 'Device terminal',
    };
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => {
      this.listeners.delete(listener);
    };
  }

  emit() {
    this.listeners.forEach((listener) => {
      listener(this.snapshot);
    });
  }

  setSnapshot(nextSnapshotOrUpdater) {
    this.snapshot =
      typeof nextSnapshotOrUpdater === 'function'
        ? nextSnapshotOrUpdater(this.snapshot)
        : nextSnapshotOrUpdater;
    this.emit();
    return this.snapshot;
  }

  patchSnapshot(patch) {
    return this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      ...patch,
    }));
  }

  queueTimeout(callback, delayMs) {
    const timeoutId = globalThis.setTimeout(() => {
      this.timers.delete(timeoutId);
      callback();
    }, delayMs);

    this.timers.add(timeoutId);
    return timeoutId;
  }

  clearTimers() {
    this.timers.forEach((timeoutId) => {
      globalThis.clearTimeout(timeoutId);
    });
    this.timers.clear();
  }

  destroy() {
    this.clearTimers();
    this.listeners.clear();
  }
}

export default BaseDeviceShellController;
