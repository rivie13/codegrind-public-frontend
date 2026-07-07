import { DEVICE_SHELL_OPEN_EVENT } from '../../../city-shell/deviceShellEvents';

import { PLAYER_SPEED, PREVIEW_KEY_CAPTURES } from '../apartmentPreviewScene.constants';

import { buildTerminalLaunchRequest } from './interactionShared';
export const attachPlayerControlInteractionMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    configureInput() {
      if (this.game?.config?.isBackgroundPreboot) {
        this.input.enabled = false;
        if (this.input.keyboard) {
          this.input.keyboard.enabled = false;
        }
        if (this.game?.input?.keyboard) {
          this.game.input.keyboard.clearCaptures();
          this.game.input.keyboard.enabled = false;
        }
        return;
      }

      if (this.game?.input?.keyboard) {
        this.game.input.keyboard.enabled = true;
      }

      this.input.enabled = true;
      if (this.input.keyboard) {
        this.input.keyboard.enabled = true;
      }

      this.cursorKeys = this.input.keyboard.createCursorKeys();
      this.input.keyboard.addCapture(PREVIEW_KEY_CAPTURES);
      this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, true);
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, true);
      this.introAdvanceEnterKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER,
        true
      );
      this.introAdvanceSpaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        true
      );
      this.wasdKeys = this.input.keyboard.addKeys(
        {
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
          up: Phaser.Input.Keyboard.KeyCodes.W,
        },
        true
      );

      this.handlePointerDownAttemptWrapper = (pointer) => this.handlePointerDownAttempt(pointer);
      this.input.on('pointerdown', this.queueIntroAdvance, this);
      this.input.on('pointerdown', this.handlePointerDownAttemptWrapper, this);
      this.input.keyboard.on('keydown', this.handlePreviewInputKeyDown, this);
      this.input.keyboard.on('keydown-E', this.queueIntroAdvance, this);
      this.input.keyboard.on('keydown-ENTER', this.queueIntroAdvance, this);
      this.input.keyboard.on('keydown-SPACE', this.queueIntroAdvance, this);
      this.input.keyboard.on('keyup', this.handlePreviewInputKeyUp, this);
      this.events.once('shutdown', () => {
        this.input.off('pointerdown', this.queueIntroAdvance, this);
        if (this.handlePointerDownAttemptWrapper) {
          this.input.off('pointerdown', this.handlePointerDownAttemptWrapper, this);
        }
        this.input.keyboard.off('keydown', this.handlePreviewInputKeyDown, this);
        this.input.keyboard.off('keydown-E', this.queueIntroAdvance, this);
        this.input.keyboard.off('keydown-ENTER', this.queueIntroAdvance, this);
        this.input.keyboard.off('keydown-SPACE', this.queueIntroAdvance, this);
        this.input.keyboard.off('keyup', this.handlePreviewInputKeyUp, this);
        this.input.keyboard.removeCapture(PREVIEW_KEY_CAPTURES);
        // Destroy all Key objects and remove their individual DOM listeners.
        // removeCapture() only clears the global capture array; Key objects created
        // by addKey(code, enableCapture=true) have per-key DOM listeners that must
        // be explicitly destroyed to prevent them from capturing keys after shutdown.
        if (typeof this.input.keyboard.removeAllKeys === 'function') {
          this.input.keyboard.removeAllKeys(true, true);
        }
      });
    },

    update(time, delta) {
      if (!this.isSceneReady) {
        return;
      }

      // Framerate Monitoring
      if (this.game && this.game.loop) {
        const currentFps = this.game.loop.actualFps;
        if (currentFps < 20) {
          if (!this.lowFpsStartTime) {
            this.lowFpsStartTime = time;
          } else if (time - this.lowFpsStartTime > 5000) {
            if (!this.lowFpsLogged) {
              this.lowFpsLogged = true;
              const bridge = this.getPreviewBridge();
              if (typeof bridge.trackFunnelEvent === 'function') {
                bridge.trackFunnelEvent('engineFramerateDrop', {
                  fps: String(Math.round(currentFps)),
                  viewportWidth: String(window.innerWidth),
                  viewportHeight: String(window.innerHeight),
                });
              }
            }
          }
        } else {
          this.lowFpsStartTime = null;
          this.lowFpsLogged = false;
        }
      }

      this.flushPendingCityVistaTransitions?.();

      this.updateSceneActors?.();

      if (this.playerDoorApproachState) {
        this.updatePlayerDoorApproach();
        this.activeInteractionZone = null;
        this.syncInteractionContext();
        this.syncPreviewWorldState();
        this.interactionLabel.setVisible(false);
        this.updateTerminalCuePlacement();

        if (this.shouldShowCollisionDebug()) {
          this.redrawCollisionDebugOverlay();
        }
        return;
      }

      const directionVector = new Phaser.Math.Vector2(0, 0);

      if (this.isWindowViewActive) {
        this.player.setVelocity(0, 0);
        this.applyIdleFrame();
        this.activeInteractionZone = null;
        this.syncInteractionContext();
        this.syncPreviewWorldState();
        this.interactionLabel.setVisible(false);
        this.handleWindowViewInput();
        this.updateTerminalCuePlacement();

        if (this.shouldShowCollisionDebug()) {
          this.redrawCollisionDebugOverlay();
        }
        return;
      }

      if (this.activeCollectibleModal) {
        this.player.setVelocity(0, 0);
        this.applyIdleFrame();
        this.syncInteractionContext();
        this.syncPreviewWorldState();
        this.interactionLabel.setVisible(false);
        this.updateTerminalCuePlacement();

        if (this.shouldShowCollisionDebug()) {
          this.redrawCollisionDebugOverlay();
        }
        return;
      }

      if (this.isIntroSequenceActive || this.controlsLocked) {
        this.player.setVelocity(0, 0);
        this.applyIdleFrame();
        this.activeInteractionZone = null;
        this.syncInteractionContext();
        this.syncPreviewWorldState();
        this.interactionLabel.setVisible(false);
        this.handleIntroAdvance();
        this.updateTerminalCuePlacement();

        if (this.shouldShowCollisionDebug()) {
          this.redrawCollisionDebugOverlay();
        }
        return;
      }

      const touchControlsState = this.getPreviewBridge().touchControlsState || null;
      const activeTouchDirections = touchControlsState?.activeDirections || {};

      if (
        this.cursorKeys.left.isDown ||
        this.wasdKeys.left.isDown ||
        activeTouchDirections.arrowleft
      ) {
        directionVector.x -= 1;
      }
      if (
        this.cursorKeys.right.isDown ||
        this.wasdKeys.right.isDown ||
        activeTouchDirections.arrowright
      ) {
        directionVector.x += 1;
      }
      if (this.cursorKeys.up.isDown || this.wasdKeys.up.isDown || activeTouchDirections.arrowup) {
        directionVector.y -= 1;
      }
      if (
        this.cursorKeys.down.isDown ||
        this.wasdKeys.down.isDown ||
        activeTouchDirections.arrowdown
      ) {
        directionVector.y += 1;
      }

      if (directionVector.lengthSq() > 0) {
        directionVector.normalize().scale(PLAYER_SPEED);
      }

      this.player.setVelocity(directionVector.x, directionVector.y);
      this.updatePlayerAnimation(directionVector);
      this.activeInteractionZone = this.getActiveInteractionZone();
      this.syncInteractionContext();
      this.syncPreviewWorldState();

      const nextTouchInteractAt = Number(touchControlsState?.interactRequestedAt) || 0;
      const hasTouchInteractRequest = nextTouchInteractAt > this.lastTouchInteractAt;

      const isEPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
      const isSpacePressed = this.introAdvanceSpaceKey
        ? Phaser.Input.Keyboard.JustDown(this.introAdvanceSpaceKey)
        : false;

      if (isEPressed || isSpacePressed || hasTouchInteractRequest) {
        if (hasTouchInteractRequest) {
          this.lastTouchInteractAt = nextTouchInteractAt;
        }

        if (this.activeInteractionZone) {
          this.handleInteraction();
        } else {
          // Miss-attempt: check if close to any target zones
          if (this.player && this.interactionZoneEntries) {
            let closestZone = null;
            let minDistance = Infinity;
            this.interactionZoneEntries.forEach((zoneEntry) => {
              if (!zoneEntry.object) return;
              const centerX = zoneEntry.object.x + (zoneEntry.object.width || 0) / 2;
              const centerY = zoneEntry.object.y + (zoneEntry.object.height || 0) / 2;
              const distance = Math.hypot(this.player.x - centerX, this.player.y - centerY);
              if (distance < minDistance) {
                minDistance = distance;
                closestZone = zoneEntry;
              }
            });
            if (closestZone && minDistance < 100) {
              const bridge = this.getPreviewBridge();
              if (typeof bridge.trackFunnelEvent === 'function') {
                let attemptType = 'key_e';
                if (isSpacePressed) attemptType = 'key_space';
                else if (hasTouchInteractRequest) attemptType = 'touch';

                bridge.trackFunnelEvent('engineInteractionAttempt', {
                  interactionName: closestZone.object.name,
                  distanceToTarget: String(Math.round(minDistance)),
                  attemptType: attemptType,
                });
              }
            }
          }
        }
      }

      this.updatePrompt();
      this.updateTerminalCuePlacement();

      if (this.shouldShowCollisionDebug()) {
        this.redrawCollisionDebugOverlay();
      }
    },

    handlePointerDownAttempt(pointer) {
      if (this.isIntroSequenceActive || this.controlsLocked) {
        return;
      }
      if (!this.interactionZoneEntries || this.interactionZoneEntries.length === 0) {
        return;
      }

      let closestZone = null;
      let minDistance = Infinity;

      this.interactionZoneEntries.forEach((zoneEntry) => {
        if (!zoneEntry.object) return;
        const centerX = zoneEntry.object.x + (zoneEntry.object.width || 0) / 2;
        const centerY = zoneEntry.object.y + (zoneEntry.object.height || 0) / 2;
        const distance = Math.hypot(pointer.worldX - centerX, pointer.worldY - centerY);
        if (distance < minDistance) {
          minDistance = distance;
          closestZone = zoneEntry;
        }
      });

      if (closestZone && minDistance < 80) {
        const bridge = this.getPreviewBridge();
        if (typeof bridge.trackFunnelEvent === 'function') {
          bridge.trackFunnelEvent('engineInteractionAttempt', {
            interactionName: closestZone.object.name,
            distanceToTarget: String(Math.round(minDistance)),
            attemptType: 'pointer',
          });
        }
      }
    },

    async handleInteraction() {
      if (!this.activeInteractionZone) {
        return;
      }

      const interactionName = this.activeInteractionZone.object.name;
      const interactionConfig = this.getInteractionConfig(interactionName);
      const interactionAccess = this.getInteractionAccess(interactionConfig);

      if (!interactionConfig) {
        return;
      }

      if (!interactionAccess.allowed) {
        if (interactionAccess.reason === 'guest-trial') {
          this.player.setVelocity(0, 0);
          this.applyIdleFrame();
          this.notifyBlockedInteraction(interactionAccess, interactionConfig, interactionName);
        }

        return;
      }

      if (interactionConfig.kind === 'window') {
        this.showWindowView();
        return;
      }

      if (interactionConfig.kind === 'terminal') {
        this.player.setVelocity(0, 0);
        this.applyIdleFrame();
        this.setPreviewHudState(null);
        const previewBridge = this.getPreviewBridge();

        const launchRequest = buildTerminalLaunchRequest({
          interactionConfig,
          interactionName,
          previewBridge,
        });

        if (launchRequest) {
          previewBridge.onLaunchProgram?.(launchRequest);
          return;
        }

        const shellRequest = {
          shellId: previewBridge.apartmentShellId || 'apartment-intro-desktop',
          terminalInstanceId: 'apartment-safehouse-terminal',
          terminalName: 'Apartment Safehouse Terminal',
          terminalZoneName: interactionName,
        };

        previewBridge.onShellRequestOpen?.(shellRequest);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(DEVICE_SHELL_OPEN_EVENT, { detail: shellRequest }));
        }
        return;
      }

      if (interactionConfig.kind === 'collectible') {
        const collectibleConfig = this.getCollectibleConfig(interactionName);
        if (!collectibleConfig || this.isCollectibleOwned(collectibleConfig)) {
          this.syncCollectibleDisplayVisibility();
          this.syncPreviewWorldState(true);
          this.syncInteractionContext();
          return;
        }

        this.player.setVelocity(0, 0);
        this.applyIdleFrame();

        this.openCollectibleModal(collectibleConfig);

        return;
      }

      if (interactionConfig.kind === 'dialogue') {
        this.player.setVelocity(0, 0);
        this.applyIdleFrame();
        this.activeSceneDialogue = interactionConfig.dialogue || null;
        this.syncObjectiveHudState();
        return;
      }

      if (interactionConfig.kind === 'transition') {
        const restartScene = () => {
          this.scene.restart({
            locationId: interactionConfig.targetLocationId,
            skipIntroSequence: true,
            spawn: interactionConfig.targetSpawn,
          });
        };
        const startTransition = () => {
          this.startPlayerSceneTransitionBeat(interactionConfig, restartScene);
        };

        this.controlsLocked = true;
        this.activeInteractionZone = null;

        if (this.queuePlayerSceneTransitionApproach(interactionConfig, startTransition)) {
          this.syncInteractionContext();
          return;
        }

        startTransition();
        return;
      }

      console.info('[ApartmentPreviewScene] Interaction placeholder triggered:', {
        id: this.activeInteractionZone.object.id,
        name: interactionName,
      });
    },
  });
};
