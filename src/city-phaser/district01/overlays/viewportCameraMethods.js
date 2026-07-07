import { MIN_CAMERA_ZOOM } from '../apartmentPreviewScene.constants';
import resolveStableViewportSize from '../previewViewportSizing';

export const attachViewportCameraMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    finishIntroSequence() {
      if (!this.isIntroSequenceActive) {
        return;
      }

      this.isIntroSequenceActive = false;
      this.isIntroSequenceComplete = true;
      this.player.setAlpha(1);
      this.introBeatTimer?.remove(false);
      this.introCityAnimationTimer?.remove(false);

      const overlayTargets = [
        this.introBackdropMatte,
        this.introCityBackdrop,
        this.introCityTint,
        this.introLetterboxTop,
        this.introLetterboxBottom,
      ].filter(Boolean);

      this.setPreviewHudState(null);
      this.tweens.killTweensOf(overlayTargets);
      this.tweens.add({
        alpha: 0,
        duration: 420,
        ease: 'Quad.InOut',
        onComplete: () => {
          overlayTargets.forEach((target) => {
            target.setVisible(false);
          });
          if (this.fullscreenOverlayCamera) {
            this.fullscreenOverlayCamera.setVisible(false);
          }
        },
        targets: overlayTargets,
      });

      this.time.delayedCall(180, () => {
        this.controlsLocked = false;
        this.activeWaypointPointId =
          typeof this.getDefaultObjectivePointId === 'function'
            ? this.getDefaultObjectivePointId() ||
              (this.previewLocationId === 'apartment' ? 'safehouse-terminal' : null)
            : this.previewLocationId === 'apartment'
              ? 'safehouse-terminal'
              : null;
        this.applyGameplayCameraState({ zoomDurationMs: 680 });
        this.syncObjectiveHudState();
      });
    },

    configureCamera() {
      this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
      this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
      this.cameras.main.roundPixels = true;
      this.scale.on('resize', this.handleResize, this);
      this.events.once('shutdown', () => {
        this.scale.off('resize', this.handleResize, this);
      });
      this.updateViewportLayout();
    },

    handleResize(gameSize) {
      this.updateViewportLayout(gameSize);
    },

    updateViewportLayout(gameSize = null) {
      const viewportSize = resolveStableViewportSize({
        gameSize,
        previousSize: this.lastViewportLayoutSize,
        scaleManager: this.scale,
      });
      const gameWidth = viewportSize.width;
      const gameHeight = viewportSize.height;

      if (!gameWidth || !gameHeight) {
        return;
      }

      this.lastViewportLayoutSize = viewportSize;

      this.cameras.main.setViewport(0, 0, gameWidth, gameHeight);
      this.fullscreenOverlayCamera?.setViewport(0, 0, gameWidth, gameHeight);
      const coverZoom = Math.max(
        gameWidth / this.tilemap.widthInPixels,
        gameHeight / this.tilemap.heightInPixels
      );
      this.gameplayZoom = Math.max(MIN_CAMERA_ZOOM, coverZoom);
      if (!this.isIntroSequenceActive) {
        const followLerp = this.getGameplayCameraFollowLerp();

        this.cameras.main.setLerp(followLerp, followLerp);
        this.cameras.main.setZoom(this.gameplayZoom);
      }

      this.layoutIntroOverlay();
      this.layoutWindowViewOverlay();
      this.updateHudLayout();
      this.updateTerminalCuePlacement();
    },

    updateHudLayout() {
      this.layoutLoadingOverlay();

      if (this.activeInteractionZone) {
        this.updateInteractionLabel();
      }
    },
  });
};
