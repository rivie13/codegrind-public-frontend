import {
  DEFAULT_PLAYER_CHARACTER_PRESET,
  INTRO_SEQUENCE_STEPS,
  RETRO_HUD_ICON_ASSETS,
} from '../apartmentPreviewScene.constants';

import { getPostPathChoiceObjective } from './interactionShared';
export const attachPlayerHudInteractionMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    updatePlayerAnimation(directionVector) {
      if (directionVector.lengthSq() === 0) {
        this.applyIdleFrame();
        return;
      }

      if (Math.abs(directionVector.x) >= Math.abs(directionVector.y)) {
        this.facing = directionVector.x >= 0 ? 'right' : 'left';
      } else {
        this.facing = directionVector.y >= 0 ? 'down' : 'up';
      }

      this.player.setFlipX(this.facing === 'left');
      this.player.play(this.getWalkAnimationKey(), true);
    },

    applyIdleFrame() {
      this.player.setFlipX(this.facing === 'left');
      this.player.play(this.getIdleAnimationKey(), true);
    },

    getIdleAnimationKey() {
      const animationKeys =
        this.playerAnimationKeys || DEFAULT_PLAYER_CHARACTER_PRESET.animationKeys;
      if (this.facing === 'up') return animationKeys.idleUp;
      if (this.facing === 'left' || this.facing === 'right') return animationKeys.idleSide;
      return animationKeys.idleDown;
    },

    getWalkAnimationKey() {
      const animationKeys =
        this.playerAnimationKeys || DEFAULT_PLAYER_CHARACTER_PRESET.animationKeys;
      if (this.facing === 'up') return animationKeys.walkUp;
      if (this.facing === 'left' || this.facing === 'right') return animationKeys.walkSide;
      return animationKeys.walkDown;
    },

    updatePrompt() {
      if (this.isIntroSequenceActive) {
        return;
      }

      let isNearTerminal = false;
      if (this.activeInteractionZone) {
        const interactionConfig = this.getInteractionConfig(this.activeInteractionZone.object.name);
        if (interactionConfig?.kind === 'terminal') {
          isNearTerminal = true;
        }
      }
      if (this.terminalZoneObject) {
        const terminalCenter = {
          x: this.terminalZoneObject.x + (this.terminalZoneObject.width || 0) / 2,
          y: this.terminalZoneObject.y + (this.terminalZoneObject.height || 0) / 2,
        };
        const distanceToTerminal = Math.hypot(
          this.player.x - terminalCenter.x,
          this.player.y - terminalCenter.y
        );
        if (distanceToTerminal < 64) {
          isNearTerminal = true;
        }
      }

      if (isNearTerminal) {
        if (!this.terminalFoundLogged) {
          this.terminalFoundLogged = true;
          const bridge = this.getPreviewBridge();
          if (typeof bridge.trackFunnelEvent === 'function') {
            bridge.trackFunnelEvent('engineTerminalFound', { locationId: this.previewLocationId });
          }
        }
      } else {
        this.terminalFoundLogged = false;
      }

      if (this.activeInteractionZone) {
        this.setPrompt('');
        this.updateInteractionLabel();
        this.syncObjectiveHudState();
        return;
      }

      this.interactionLabel.setVisible(false);
      this.setPrompt('');
      this.syncObjectiveHudState();
    },

    getPreviewHudIconPath(iconName) {
      return RETRO_HUD_ICON_ASSETS[iconName]?.path || RETRO_HUD_ICON_ASSETS.info.path;
    },

    getIntroCityBackdropSourceSize() {
      const sourceImage = this.introCityBackdrop?.texture?.getSourceImage?.();
      const width = Number(sourceImage?.width || 0);
      const height = Number(sourceImage?.height || 0);

      if (width <= 0 || height <= 0) {
        return null;
      }

      return { width, height };
    },

    getCityBackdropPresentationState() {
      const sourceSize = this.getIntroCityBackdropSourceSize();
      const backdropTextureKey = this.introCityBackdrop?.texture?.key || null;

      return {
        cityBackdropAlpha: Number(this.introCityBackdrop?.alpha || 0),
        cityBackdropAnimating: Boolean(this.introCityAnimationTimer),
        cityBackdropPrimed: Boolean(
          sourceSize && backdropTextureKey && this.introCityBackdrop?.active !== false
        ),
        cityBackdropTextureKey: backdropTextureKey,
      };
    },

    buildIntroHudState(beat) {
      return {
        accentLabel: beat.hudAccentLabel,
        cityBackdropVisible: Boolean(beat.showCityBackdrop),
        cityBackdropSourceSize: this.getIntroCityBackdropSourceSize(),
        cityBackdropUsesUncropped: this.isUsingUncroppedCityBackdrop,
        ...this.getCityBackdropPresentationState(),
        iconSrc: this.getPreviewHudIconPath(beat.hudIcon),
        mode: 'intro',
        nextActionLabel:
          this.introBeatIndex >= INTRO_SEQUENCE_STEPS.length - 1 ? 'Continue' : 'Next',
        placement: beat.hudPlacement,
        presentation: 'dialogue-overlay',
        statusLabel: beat.hudStatusLabel,
        text: beat.text,
        title: beat.hudTitle,
      };
    },

    getPostPathChoiceObjective() {
      return getPostPathChoiceObjective(this.getPreviewBridge(), this.previewLocationId);
    },

    acknowledgePostPathChoiceContact() {
      const postPathChoiceObjective = this.getPostPathChoiceObjective();

      if (!postPathChoiceObjective) {
        return false;
      }

      const previewBridge = this.getPreviewBridge();

      if (previewBridge.postPathChoiceContactAcknowledged === true) {
        return false;
      }

      previewBridge.postPathChoiceContactAcknowledged = true;
      this.syncObjectiveHudState();
      return true;
    },

    handlePreviewHudAdvance() {
      if (this.isIntroSequenceActive) {
        this.queueIntroAdvance();
        return;
      }

      if (this.activeSceneDialogue) {
        this.activeSceneDialogue = null;
        this.syncObjectiveHudState();
        return;
      }

      this.acknowledgePostPathChoiceContact();
    },
  });
};
