import {
  INTRO_ADVANCE_ARM_DELAY_MS,
  INTRO_SEQUENCE_STEPS,
} from '../apartmentPreviewScene.constants';

export const attachIntroFlowMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    primeCityBackdropPresentation({
      backdropAlpha = 0,
      showLetterbox = false,
      tintAlpha = 0.42,
    } = {}) {
      if (!this.introCityBackdrop) {
        return false;
      }

      const initialFrameKey = this.duskCityFrames?.[0]?.key || this.introCityBackdrop.texture?.key;

      this.introCityAnimationTimer?.remove(false);
      this.introCityAnimationTimer = null;

      if (initialFrameKey) {
        this.introCityBackdrop.setTexture(initialFrameKey);
      }

      this.layoutIntroOverlay?.();

      if (this.fullscreenOverlayCamera) {
        this.fullscreenOverlayCamera.setVisible(true);
      }

      [this.introBackdropMatte, this.introCityBackdrop, this.introCityTint]
        .filter(Boolean)
        .forEach((target) => {
          target.setVisible(true);
          target.setAlpha(backdropAlpha);
        });

      this.introCityTint?.setFillStyle(0x03060d, tintAlpha);

      [this.introLetterboxTop, this.introLetterboxBottom].filter(Boolean).forEach((target) => {
        target.setVisible(showLetterbox);
        target.setAlpha(showLetterbox ? backdropAlpha : 0);
      });

      return true;
    },

    startIntroSequence(force = false) {
      if (force) {
        this.isIntroSequenceActive = false;
        this.isIntroSequenceComplete = false;
        this.introBeatTimer?.remove(false);
        this.introBeatTimer = null;
        this.introCityAnimationTimer?.remove(false);
        this.introCityAnimationTimer = null;
      }

      if (this.isIntroSequenceActive || this.isIntroSequenceComplete) {
        return;
      }

      const isCityVistaReady =
        typeof this.isCityVistaVisualsReady === 'function' ? this.isCityVistaVisualsReady() : true;

      if (!isCityVistaReady) {
        this.hasPendingIntroSequenceStart = true;
        return;
      }

      this.hasPendingIntroSequenceStart = false;
      this.isIntroSequenceActive = true;
      this.isWindowViewActive = false;
      this.controlsLocked = true;
      this.activeInteractionZone = null;
      this.player.setVelocity(0, 0);
      this.applyIdleFrame();
      this.interactionLabel.setVisible(false);
      this.cameras.main.stopFollow();
      this.hasQueuedIntroAdvance = false;
      this.primeCityBackdropPresentation({
        backdropAlpha: 0,
        showLetterbox: true,
        tintAlpha: 0.42,
      });

      this.startDuskCityBackdropAnimation();
      this.runIntroBeat(0);
    },

    runIntroBeat(index) {
      if (!this.isIntroSequenceActive) {
        return;
      }

      if (index >= INTRO_SEQUENCE_STEPS.length) {
        this.finishIntroSequence();
        return;
      }

      const beat = INTRO_SEQUENCE_STEPS[index];
      this.introBeatIndex = index;
      this.player.setAlpha(beat.showCityBackdrop ? 0.24 : 1);
      this.setPreviewHudState(this.buildIntroHudState(beat));
      this.hasQueuedIntroAdvance = false;
      this.introAdvanceAvailableAt = this.time.now + INTRO_ADVANCE_ARM_DELAY_MS;

      this.setIntroCityBackdropVisible(Boolean(beat.showCityBackdrop));
      this.focusCameraOnIntroTarget(beat.focus, beat.cameraDurationMs || 0);

      if (beat.playTerminalPing) {
        this.activateTerminalCue();
      }

      this.introBeatTimer?.remove(false);
      this.introBeatTimer = null;
    },

    handleIntroAdvance() {
      if (
        !this.isIntroSequenceActive ||
        this.time.now < this.introAdvanceAvailableAt ||
        !this.hasQueuedIntroAdvance
      ) {
        return;
      }

      this.hasQueuedIntroAdvance = false;
      this.runIntroBeat(this.introBeatIndex + 1);
    },

    queueIntroAdvance() {
      if (!this.isIntroSequenceActive || this.time.now < this.introAdvanceAvailableAt) {
        return;
      }

      this.hasQueuedIntroAdvance = true;
    },

    setIntroCityBackdropVisible(isVisible) {
      const backdropTargets = [
        this.introBackdropMatte,
        this.introCityBackdrop,
        this.introCityTint,
      ].filter(Boolean);

      if (backdropTargets.length === 0) {
        return;
      }

      backdropTargets.forEach((target) => {
        target.setVisible(true);
      });
      this.tweens.killTweensOf(backdropTargets);
      this.tweens.add({
        alpha: isVisible ? 1 : 0,
        duration: 420,
        ease: isVisible ? 'Quad.Out' : 'Quad.In',
        onComplete: () => {
          if (!isVisible) {
            backdropTargets.forEach((target) => {
              target.setVisible(false);
            });
          }
        },
        targets: backdropTargets,
      });
    },

    startDuskCityBackdropAnimation() {
      if (!this.introCityBackdrop || this.duskCityFrames.length <= 1) {
        return;
      }

      this.introCityAnimationTimer?.remove(false);

      let nextFrameIndex = 0;

      const advanceFrame = () => {
        if (!this.introCityBackdrop?.active || !this.shouldAnimateDuskCityBackdrop()) {
          this.introCityAnimationTimer = null;
          return;
        }

        const frame = this.duskCityFrames[nextFrameIndex];
        this.introCityBackdrop.setTexture(frame.key, frame.frame ?? undefined);
        nextFrameIndex = (nextFrameIndex + 1) % this.duskCityFrames.length;
        this.introCityAnimationTimer = this.time.delayedCall(frame.duration, advanceFrame);
      };

      advanceFrame();
    },

    shouldAnimateDuskCityBackdrop() {
      return this.isIntroSequenceActive || this.isWindowViewActive;
    },
  });
};
