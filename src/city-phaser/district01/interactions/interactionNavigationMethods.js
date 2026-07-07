import { getDistrict01PreviewInteraction } from '../district01PreviewMaps';

import { PLAYER_SPEED } from '../apartmentPreviewScene.constants';
import { findObject } from '../apartmentPreviewScene.utils';

import { clampCoordinate } from './interactionShared';
export const attachInteractionNavigationMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    getInteractionConfig(interactionName) {
      return getDistrict01PreviewInteraction(this.previewLocationId, interactionName);
    },

    getObjectAnchorPosition(objectValue, anchor = 'object-origin') {
      const width = Number(objectValue?.width || 0);
      const height = Number(objectValue?.height || 0);

      if (anchor === 'center') {
        return {
          x: objectValue.x + width / 2,
          y: objectValue.y + height / 2,
        };
      }

      if (anchor === 'top-center') {
        return {
          x: objectValue.x + width / 2,
          y: objectValue.y,
        };
      }

      if (anchor === 'bottom-center') {
        return {
          x: objectValue.x + width / 2,
          y: objectValue.y + height,
        };
      }

      if (anchor === 'left-center') {
        return {
          x: objectValue.x,
          y: objectValue.y + height / 2,
        };
      }

      if (anchor === 'right-center') {
        return {
          x: objectValue.x + width,
          y: objectValue.y + height / 2,
        };
      }

      return {
        x: objectValue.x,
        y: objectValue.y,
      };
    },

    resolveSpawnTargetObject(
      spawnTarget = this.previewSpawnTarget || this.previewMapConfig?.defaultSpawn
    ) {
      if (!spawnTarget?.objectName || !spawnTarget?.layerName) {
        return null;
      }

      return findObject(
        this.getMapObjectLayer(spawnTarget.layerName)?.objects,
        spawnTarget.objectName
      );
    },

    resolveSpawnTargetPosition(
      spawnTarget = this.previewSpawnTarget || this.previewMapConfig?.defaultSpawn
    ) {
      const spawnObject = this.resolveSpawnTargetObject(spawnTarget);

      if (!spawnObject) {
        return null;
      }

      const anchorPosition = this.getObjectAnchorPosition(spawnObject, spawnTarget.anchor);

      return {
        x: anchorPosition.x + (spawnTarget.offsetX || 0),
        y: anchorPosition.y + (spawnTarget.offsetY || 0),
      };
    },

    resolveTransitionWalkPosition(interactionConfig) {
      if (interactionConfig?.transitionWalkTarget) {
        const walkPosition = this.resolveSpawnTargetPosition(
          interactionConfig.transitionWalkTarget
        );

        return this.resolveAxisLockedTransitionWalkPosition(
          walkPosition,
          interactionConfig,
          interactionConfig.transitionWalkTarget
        );
      }

      const transitionEffect = interactionConfig?.transitionEffect || null;

      if (transitionEffect) {
        const walkTarget =
          transitionEffect.overlayTarget || transitionEffect.playerSnapTarget || null;
        const walkPosition = this.resolveSpawnTargetPosition(walkTarget);

        if (!walkPosition) {
          return null;
        }

        return this.resolveAxisLockedTransitionWalkPosition(
          {
            x: walkPosition.x + Number(transitionEffect.playerSnapOffsetX ?? 0),
            y: walkPosition.y + Number(transitionEffect.playerSnapOffsetY ?? 0),
          },
          interactionConfig,
          walkTarget
        );
      }
      return null;
    },

    resolveAxisLockedTransitionWalkPosition(walkPosition, interactionConfig, walkTarget) {
      if (!walkPosition) {
        return null;
      }

      const walkAxis = interactionConfig?.transitionWalkAxis;

      if (walkAxis !== 'horizontal' && walkAxis !== 'vertical') {
        return walkPosition;
      }

      const targetObject =
        typeof walkTarget?.layerName === 'string' && typeof walkTarget?.objectName === 'string'
          ? this.resolveSpawnTargetObject(walkTarget)
          : null;

      if (walkAxis === 'horizontal') {
        const currentY = Number(this.player?.y);
        const fallbackY = Number.isFinite(currentY) ? currentY : walkPosition.y;

        if (!targetObject) {
          return {
            ...walkPosition,
            y: fallbackY,
          };
        }

        return {
          ...walkPosition,
          y: clampCoordinate(
            fallbackY,
            Number(targetObject.y || 0),
            Number(targetObject.y || 0) + Number(targetObject.height || 0)
          ),
        };
      }

      const currentX = Number(this.player?.x);
      const fallbackX = Number.isFinite(currentX) ? currentX : walkPosition.x;

      if (!targetObject) {
        return {
          ...walkPosition,
          x: fallbackX,
        };
      }

      return {
        ...walkPosition,
        x: clampCoordinate(
          fallbackX,
          Number(targetObject.x || 0),
          Number(targetObject.x || 0) + Number(targetObject.width || 0)
        ),
      };
    },

    startPlayerSceneTransitionBeat(interactionConfig, onComplete) {
      const transitionEffect = interactionConfig?.transitionEffect || null;

      if (transitionEffect && this.playDoorTransitionEffect) {
        if (typeof transitionEffect.facing === 'string' && transitionEffect.facing) {
          this.facing = transitionEffect.facing;
        }

        this.player.setVelocity(0, 0);
        this.alignActorWithDoorTransition?.(transitionEffect, this.player);
        this.applyIdleFrame();

        const startedDoorTransition = this.playDoorTransitionEffect(transitionEffect, {
          actor: this.player,
          hideActorAfterMs: transitionEffect.hideActorAfterMs,
          onComplete,
        });

        if (startedDoorTransition) {
          this.syncInteractionContext();
          return true;
        }
      }

      onComplete();
      return false;
    },

    queuePlayerSceneTransitionApproach(interactionConfig, onArrive) {
      const targetPosition = this.resolveTransitionWalkPosition(interactionConfig);
      const transitionEffect = interactionConfig?.transitionEffect || null;

      if (
        !targetPosition ||
        typeof this.player?.x !== 'number' ||
        typeof this.player?.y !== 'number'
      ) {
        return false;
      }

      const arrivalDistance = Number(interactionConfig?.transitionWalkArrivalDistance ?? 6);
      const immediateTransitionTargets = [
        transitionEffect?.overlayTarget,
        transitionEffect?.playerSnapTarget,
        interactionConfig?.transitionWalkTarget,
      ].filter(Boolean);

      const isAlreadyAtDoor = immediateTransitionTargets.some((target) => {
        const resolvedTarget = this.resolveSpawnTargetPosition(target);

        if (!resolvedTarget) {
          return false;
        }

        return (
          Math.hypot(resolvedTarget.x - this.player.x, resolvedTarget.y - this.player.y) <=
          arrivalDistance
        );
      });

      if (isAlreadyAtDoor) {
        return false;
      }

      const deltaX = targetPosition.x - this.player.x;
      const deltaY = targetPosition.y - this.player.y;

      if (Math.hypot(deltaX, deltaY) <= arrivalDistance) {
        return false;
      }

      this.playerDoorApproachState = {
        arrivalDistance,
        onArrive,
        speed: Number(interactionConfig?.transitionWalkSpeed ?? PLAYER_SPEED),
        targetPosition,
      };

      return true;
    },

    updatePlayerDoorApproach() {
      const approachState = this.playerDoorApproachState;

      if (!approachState || !this.player) {
        return false;
      }

      const deltaX = approachState.targetPosition.x - this.player.x;
      const deltaY = approachState.targetPosition.y - this.player.y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance <= approachState.arrivalDistance) {
        this.player.setVelocity(0, 0);
        this.applyIdleFrame();

        const onArrive = approachState.onArrive;
        this.playerDoorApproachState = null;
        onArrive?.();
        return true;
      }

      const directionVector = new Phaser.Math.Vector2(deltaX, deltaY);

      if (directionVector.lengthSq() > 0) {
        directionVector.normalize().scale(approachState.speed);
      }

      this.player.setVelocity(directionVector.x, directionVector.y);
      this.updatePlayerAnimation(directionVector);
      return true;
    },
  });
};
