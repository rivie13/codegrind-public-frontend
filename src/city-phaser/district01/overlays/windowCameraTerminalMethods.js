import {
  INTRO_NOTIFICATION_SOUND_SRC,
  TERMINAL_CUE_WINDOW_HEIGHT,
  TERMINAL_CUE_WINDOW_WIDTH,
  getWorldCueViewportScale,
} from '../apartmentPreviewScene.constants';
import { getZoneCenter } from '../apartmentPreviewScene.utils';

export const attachWindowCameraTerminalMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    showWindowView() {
      if (this.isWindowViewActive || !this.introCityBackdrop) {
        return;
      }

      const isCityVistaReady =
        typeof this.isCityVistaVisualsReady === 'function' ? this.isCityVistaVisualsReady() : true;

      if (!isCityVistaReady) {
        this.hasPendingWindowViewOpen = true;
        return;
      }

      this.hasPendingWindowViewOpen = false;
      this.isWindowViewActive = true;
      this.controlsLocked = true;
      this.activeInteractionZone = null;
      this.player.setVelocity(0, 0);
      this.applyIdleFrame();
      this.interactionLabel.setVisible(false);
      this.setPrompt('');
      this.setPreviewHudState(null);
      this.windowViewOverlayNodes.forEach((target) => {
        target.setVisible(false).setAlpha(0);
      });

      this.primeCityBackdropPresentation({
        backdropAlpha: 1,
        showLetterbox: false,
        tintAlpha: 0.18,
      });

      const overlayTargets = [
        this.introBackdropMatte,
        this.introCityBackdrop,
        this.introCityTint,
      ].filter(Boolean);

      this.tweens.killTweensOf(overlayTargets);
      this.startDuskCityBackdropAnimation();
      this.syncInteractionContext();
    },

    hideWindowView() {
      if (!this.isWindowViewActive) {
        return;
      }

      this.hasPendingWindowViewOpen = false;
      this.isWindowViewActive = false;
      this.controlsLocked = false;
      this.player.setVelocity(0, 0);
      this.applyIdleFrame();
      this.activeInteractionZone = null;

      const overlayTargets = [
        this.introBackdropMatte,
        this.introCityBackdrop,
        this.introCityTint,
      ].filter(Boolean);

      this.windowViewOverlayNodes.forEach((target) => {
        target.setVisible(false).setAlpha(0);
      });

      this.tweens.killTweensOf(overlayTargets);
      this.tweens.add({
        alpha: 0,
        duration: 220,
        ease: 'Quad.InOut',
        onComplete: () => {
          overlayTargets.forEach((target) => {
            target.setVisible(false);
          });
          this.introCityAnimationTimer?.remove(false);
          this.introCityAnimationTimer = null;
          if (this.fullscreenOverlayCamera) {
            this.fullscreenOverlayCamera.setVisible(false);
          }
        },
        targets: overlayTargets,
      });

      this.introCityTint?.setFillStyle(0x03060d, 0.42);
      this.syncObjectiveHudState();
      this.syncInteractionContext();
    },

    handleWindowViewInput() {
      const touchControlsState = this.getPreviewBridge().touchControlsState || null;
      const nextTouchInteractAt = Number(touchControlsState?.interactRequestedAt) || 0;
      const hasTouchInteractRequest = nextTouchInteractAt > this.lastTouchInteractAt;

      if (
        Phaser.Input.Keyboard.JustDown(this.escapeKey) ||
        Phaser.Input.Keyboard.JustDown(this.interactKey) ||
        Phaser.Input.Keyboard.JustDown(this.introAdvanceEnterKey) ||
        Phaser.Input.Keyboard.JustDown(this.introAdvanceSpaceKey) ||
        hasTouchInteractRequest
      ) {
        this.lastTouchInteractAt = nextTouchInteractAt;
        this.hideWindowView();
      }
    },

    getGameplayCameraFollowLerp() {
      return Number.isInteger(this.gameplayZoom) ? 0.15 : 1;
    },

    applyGameplayCameraState({ zoomDurationMs = 0 } = {}) {
      const followLerp = this.getGameplayCameraFollowLerp();

      this.cameras.main.startFollow(this.player, true, followLerp, followLerp);
      this.cameras.main.roundPixels = true;

      if (zoomDurationMs > 0) {
        this.cameras.main.zoomTo(this.gameplayZoom, zoomDurationMs, 'Sine.easeInOut');
        return;
      }

      this.cameras.main.setZoom(this.gameplayZoom);
    },

    focusCameraOnIntroTarget(targetName, durationMs) {
      const camera = this.cameras.main;
      const focusPoint = this.getIntroFocusPoint(targetName);
      const targetZoom = this.getIntroZoom(targetName);

      if (!focusPoint) {
        return;
      }

      if (!durationMs) {
        camera.centerOn(focusPoint.x, focusPoint.y);
        camera.setZoom(targetZoom);
        return;
      }

      camera.pan(focusPoint.x, focusPoint.y, durationMs, 'Sine.easeInOut');
      camera.zoomTo(targetZoom, durationMs, 'Sine.easeInOut');
    },

    getIntroFocusPoint(targetName) {
      if (targetName === 'player' && this.player) {
        return {
          x: this.player.x,
          y: this.player.y - 46,
        };
      }

      if (targetName === 'window' && this.windowZoneObject) {
        const windowCenter = getZoneCenter(this.windowZoneObject);
        return {
          x: windowCenter.x,
          y: windowCenter.y + 10,
        };
      }

      if (targetName === 'apartment') {
        const terminalCenter = this.terminalZoneObject
          ? getZoneCenter(this.terminalZoneObject)
          : null;
        const windowCenter = this.windowZoneObject ? getZoneCenter(this.windowZoneObject) : null;

        if (terminalCenter && windowCenter) {
          return {
            x: (terminalCenter.x + windowCenter.x) / 2,
            y: Math.min(terminalCenter.y, windowCenter.y) + 18,
          };
        }
      }

      if (targetName === 'terminal' && this.terminalZoneObject) {
        const terminalCenter = getZoneCenter(this.terminalZoneObject);
        return {
          x: terminalCenter.x,
          y: terminalCenter.y - 12,
        };
      }

      return {
        x: this.tilemap.widthInPixels / 2,
        y: this.tilemap.heightInPixels / 2,
      };
    },

    getIntroZoom(targetName) {
      if (targetName === 'map') {
        return Math.max(this.gameplayZoom * 0.8, 1.45);
      }

      if (targetName === 'apartment') {
        return Math.max(this.gameplayZoom * 0.88, 1.72);
      }

      if (targetName === 'terminal') {
        return this.gameplayZoom * 1.08;
      }

      if (targetName === 'window') {
        return Math.max(this.gameplayZoom * 0.96, 1.85);
      }

      return this.gameplayZoom;
    },

    activateTerminalCue() {
      if (!this.terminalCueContainer || !this.terminalZoneObject) {
        this.terminalCueContainer?.setVisible(false).setAlpha(0);
        return;
      }

      if (this.fullscreenOverlayCamera) {
        this.fullscreenOverlayCamera.ignore(this.terminalCueContainer);
      }

      this.terminalCueContainer.setVisible(true);
      this.terminalCueContainer.setAlpha(0);
      this.updateTerminalCuePlacement();
      this.terminalCueGlow.setScale(0.86).setAlpha(0.18);
      this.terminalCueBellIcon.setScale(0.92).setAngle(0);
      this.tweens.killTweensOf([
        this.terminalCueContainer,
        this.terminalCueGlow,
        this.terminalCueBellIcon,
      ]);
      this.tweens.add({
        alpha: 1,
        duration: 220,
        ease: 'Quad.Out',
        targets: this.terminalCueContainer,
      });
      this.tweens.add({
        alpha: 0.04,
        duration: 760,
        ease: 'Sine.easeInOut',
        repeat: -1,
        scaleX: 1.38,
        scaleY: 1.38,
        targets: this.terminalCueGlow,
        yoyo: true,
      });
      this.tweens.add({
        angle: 12,
        duration: 260,
        ease: 'Sine.easeInOut',
        repeat: -1,
        targets: this.terminalCueBellIcon,
        yoyo: true,
      });

      this.playTerminalNotificationSound();
    },

    updateTerminalCuePlacement() {
      if (!this.terminalCueContainer?.visible || !this.terminalZoneObject) {
        return;
      }

      const camera = this.cameras.main;
      const gameWidth = this.scale.gameSize?.width || this.scale.width || window.innerWidth;
      const gameHeight = this.scale.gameSize?.height || this.scale.height || window.innerHeight;
      const zoom = camera.zoom || 1;
      const cueScale = getWorldCueViewportScale(gameWidth, gameHeight) / zoom;
      const terminalCenter = getZoneCenter(this.terminalZoneObject);
      const anchorScreenX = (terminalCenter.x - camera.worldView.x) * zoom;
      const anchorScreenY = (terminalCenter.y - 56 - camera.worldView.y) * zoom;
      const cueMarginX = (TERMINAL_CUE_WINDOW_WIDTH * cueScale) / 2 + 14;
      const cueMarginY = (TERMINAL_CUE_WINDOW_HEIGHT * cueScale) / 2 + 20;
      const clampedScreenX = Phaser.Math.Clamp(anchorScreenX, cueMarginX, gameWidth - cueMarginX);
      const clampedScreenY = Phaser.Math.Clamp(anchorScreenY, cueMarginY, gameHeight - cueMarginY);
      const worldPoint = camera.getWorldPoint(clampedScreenX, clampedScreenY);

      this.terminalCueContainer.setScale(cueScale).setPosition(worldPoint.x, worldPoint.y);
    },

    playTerminalNotificationSound() {
      try {
        const notificationAudio = new Audio(INTRO_NOTIFICATION_SOUND_SRC);
        notificationAudio.currentTime = 0;
        notificationAudio.playsInline = true;
        notificationAudio.preload = 'auto';
        notificationAudio.volume = 0.58;
        notificationAudio.play().catch(() => {});
      } catch {
        // best effort only
      }
    },
  });
};
