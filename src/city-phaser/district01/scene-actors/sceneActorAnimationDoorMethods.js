import {
  SCENE_DOOR_TRANSITION_FRAME_RATE,
  SCENE_ACTOR_IDLE_FRAME_RATE,
  SCENE_ACTOR_WALK_FRAME_RATE,
  buildAnimationFrames,
  buildReverseAnimationFrames,
  resolveActorDepth,
  scheduleSceneCallback,
} from './sceneActorShared';
export const attachSceneActorAnimationDoorMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    ensureSceneActorAnimations(actorConfig) {
      const appearance = actorConfig?.appearance;
      const textures = appearance?.textures || {};

      if (!appearance?.animationKeyPrefix) {
        return null;
      }

      const animationKeys = {
        idleDown: `${appearance.animationKeyPrefix}:anim:idle:down`,
        idleSide: `${appearance.animationKeyPrefix}:anim:idle:side`,
        idleUp: `${appearance.animationKeyPrefix}:anim:idle:up`,
        walkDown: `${appearance.animationKeyPrefix}:anim:walk:down`,
        walkSide: `${appearance.animationKeyPrefix}:anim:walk:side`,
        walkUp: `${appearance.animationKeyPrefix}:anim:walk:up`,
      };
      const createAnimationIfNeeded = (key, textureKey, frameCount, frameRate) => {
        if (!textureKey || !frameCount || this.anims.exists(key)) {
          return;
        }

        this.anims.create({
          frameRate,
          frames: buildAnimationFrames(textureKey, frameCount),
          key,
          repeat: -1,
        });
      };

      createAnimationIfNeeded(
        animationKeys.idleDown,
        textures.idleDown?.key,
        appearance.idleFrameCount,
        SCENE_ACTOR_IDLE_FRAME_RATE
      );
      createAnimationIfNeeded(
        animationKeys.idleSide,
        textures.idleSide?.key,
        appearance.idleFrameCount,
        SCENE_ACTOR_IDLE_FRAME_RATE
      );
      createAnimationIfNeeded(
        animationKeys.idleUp,
        textures.idleUp?.key,
        appearance.idleFrameCount,
        SCENE_ACTOR_IDLE_FRAME_RATE
      );
      createAnimationIfNeeded(
        animationKeys.walkDown,
        textures.walkDown?.key,
        appearance.walkFrameCount,
        SCENE_ACTOR_WALK_FRAME_RATE
      );
      createAnimationIfNeeded(
        animationKeys.walkSide,
        textures.walkSide?.key,
        appearance.walkFrameCount,
        SCENE_ACTOR_WALK_FRAME_RATE
      );
      createAnimationIfNeeded(
        animationKeys.walkUp,
        textures.walkUp?.key,
        appearance.walkFrameCount,
        SCENE_ACTOR_WALK_FRAME_RATE
      );

      return animationKeys;
    },

    resolveDoorTransitionPosition(effectConfig) {
      const resolvedTarget =
        this.resolveSceneActorTargetPosition(effectConfig?.overlayTarget) ||
        this.resolveSceneActorTargetPosition(effectConfig?.playerSnapTarget) ||
        null;

      if (!resolvedTarget) {
        return null;
      }

      return {
        x: resolvedTarget.x + Number(effectConfig?.offsetX ?? 0),
        y: resolvedTarget.y + Number(effectConfig?.offsetY ?? 0),
      };
    },

    alignActorWithDoorTransition(effectConfig, actor) {
      const resolvedTarget = this.resolveSceneActorTargetPosition(
        effectConfig?.playerSnapTarget || effectConfig?.overlayTarget
      );

      if (!resolvedTarget || typeof actor?.setPosition !== 'function') {
        return;
      }

      const nextX = resolvedTarget.x + Number(effectConfig?.playerSnapOffsetX ?? 0);
      const nextY = resolvedTarget.y + Number(effectConfig?.playerSnapOffsetY ?? 0);

      actor.body?.stop?.();
      actor.setPosition(nextX, nextY);
      actor.body?.updateFromGameObject?.();
    },

    ensureDoorTransitionAnimations(effectConfig) {
      const appearance = effectConfig?.appearance;

      if (!appearance?.textureKey || !appearance?.animationKeyPrefix) {
        return null;
      }

      const openKey = `${appearance.animationKeyPrefix}:anim:open`;
      const closeKey = `${appearance.animationKeyPrefix}:anim:close`;
      const frameCount = Number(appearance.frameCount ?? 4);

      if (!this.anims.exists(openKey)) {
        this.anims.create({
          frameRate: SCENE_DOOR_TRANSITION_FRAME_RATE,
          frames: buildAnimationFrames(appearance.textureKey, frameCount),
          key: openKey,
          repeat: 0,
        });
      }

      if (!this.anims.exists(closeKey)) {
        this.anims.create({
          frameRate: SCENE_DOOR_TRANSITION_FRAME_RATE,
          frames: buildReverseAnimationFrames(appearance.textureKey, frameCount),
          key: closeKey,
          repeat: 0,
        });
      }

      return {
        closeKey,
        openKey,
      };
    },

    playDoorTransitionEffect(effectConfig, options = {}) {
      const appearance = effectConfig?.appearance;
      const position = this.resolveDoorTransitionPosition(effectConfig);
      const animationKeys = this.ensureDoorTransitionAnimations(effectConfig);

      if (!appearance?.textureKey || !position || !animationKeys) {
        return false;
      }

      const actor = options.actor || null;
      const shadow = options.shadow || null;
      const sceneDoorId = effectConfig?.sceneDoorId || null;
      const sceneDoorEntry = this.getSceneDoorEntry(sceneDoorId);
      const closedFrame = Number(sceneDoorEntry?.sceneDoorConfig?.closedFrame ?? 0);
      const usesPersistentDoorSprite = Boolean(sceneDoorEntry?.sprite);
      const hideActorAfterMs =
        options.hideActorAfterMs === false
          ? null
          : (options.hideActorAfterMs ?? effectConfig?.hideActorAfterMs ?? 180);
      const showActorAfterMs =
        options.showActorAfterMs === false
          ? null
          : (options.showActorAfterMs ?? effectConfig?.showActorAfterMs ?? null);
      let hasHiddenActor = false;
      let hasShownActor = false;
      const doorSprite = usesPersistentDoorSprite
        ? sceneDoorEntry.sprite
        : this.add.sprite(position.x, position.y, appearance.textureKey, closedFrame);

      doorSprite.setPosition?.(position.x, position.y);
      doorSprite.setDepth?.(effectConfig?.depth ?? appearance.depth ?? 141);
      doorSprite.setOrigin?.(appearance.originX ?? 0.5, appearance.originY ?? 1);
      doorSprite.setVisible?.(true);
      doorSprite.setFrame?.(closedFrame);

      if (typeof appearance.scale === 'number' && doorSprite.setScale) {
        doorSprite.setScale(appearance.scale);
      }

      doorSprite.play(animationKeys.openKey, true);

      const hideActor = () => {
        if (hasHiddenActor) {
          return;
        }

        hasHiddenActor = true;
        actor?.body?.stop?.();

        if (actor?.body && options.disableActorBody !== false) {
          actor.body.enable = false;
        }

        actor?.setVisible?.(false);
        shadow?.setVisible?.(false);
        options.onHideActor?.();
      };

      const showActor = () => {
        if (hasShownActor) {
          return;
        }

        hasShownActor = true;

        if (actor?.body && options.enableActorBody !== false) {
          actor.body.enable = true;
        }

        actor?.setVisible?.(true);
        shadow?.setVisible?.(true);
        options.onShowActor?.();
      };

      if (hideActorAfterMs !== null) {
        scheduleSceneCallback(this, hideActorAfterMs, hideActor);
      }

      if (showActorAfterMs !== null) {
        scheduleSceneCallback(this, showActorAfterMs, showActor);
      }

      scheduleSceneCallback(
        this,
        Math.max(hideActorAfterMs ?? 0, showActorAfterMs ?? 0) +
          (options.closeDelayMs ?? effectConfig?.closeDelayMs ?? 160),
        () => {
          doorSprite.play(animationKeys.closeKey, true);
        }
      );
      scheduleSceneCallback(
        this,
        options.completeAfterMs ?? effectConfig?.completeAfterMs ?? 720,
        () => {
          if (usesPersistentDoorSprite) {
            doorSprite.anims?.stop?.();
            doorSprite.setFrame?.(closedFrame);
            doorSprite.setVisible?.(true);
          } else {
            doorSprite.destroy?.();
            this.setSceneDoorVisibility(sceneDoorId, true);
          }

          options.onComplete?.();
        }
      );

      return true;
    },

    syncSceneActorVisual(entry) {
      const depth = resolveActorDepth(entry.actorConfig);

      entry.sprite?.setDepth(depth);

      if (!entry.shadow) {
        return;
      }

      entry.shadow.setPosition(entry.sprite.x, entry.sprite.y);
      entry.shadow.setDepth(depth - 1);
      entry.shadow.setVisible(Boolean(entry.sprite.visible));
    },
  });
};
