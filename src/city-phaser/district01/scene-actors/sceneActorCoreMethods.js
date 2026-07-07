import {
  SCENE_ACTOR_BODY_CONFIG,
  SCENE_ACTOR_SLIDE_FACTOR,
  resolveActorDepth,
  resolveActorShadowConfig,
  normalizeActorTarget,
  resolveTransitionRangeValue,
} from './sceneActorShared';
export const attachSceneActorCoreMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    getSceneDoorConfigs() {
      return Array.isArray(this.previewMapConfig?.sceneDoors)
        ? this.previewMapConfig.sceneDoors
        : [];
    },

    getSceneActorConfigs() {
      return Array.isArray(this.previewMapConfig?.sceneActors)
        ? this.previewMapConfig.sceneActors
        : [];
    },

    isSceneActorNavEnabled(actorConfig) {
      return Boolean(actorConfig?.navGraph?.layerName);
    },

    doesSceneActorMove(actorConfig) {
      return (
        (Array.isArray(actorConfig?.route) && actorConfig.route.length > 0) ||
        this.isSceneActorNavEnabled(actorConfig)
      );
    },

    resolveSceneDoorPosition(sceneDoorConfig) {
      const resolvedTarget = this.resolveSceneActorTargetPosition(sceneDoorConfig?.target);

      if (!resolvedTarget) {
        return null;
      }

      return {
        x: resolvedTarget.x + Number(sceneDoorConfig?.offsetX ?? 0),
        y: resolvedTarget.y + Number(sceneDoorConfig?.offsetY ?? 0),
      };
    },

    createSceneDoors() {
      this.sceneDoorEntries = this.getSceneDoorConfigs()
        .map((sceneDoorConfig) => this.createSceneDoorEntry(sceneDoorConfig))
        .filter(Boolean);
    },

    createSceneDoorEntry(sceneDoorConfig) {
      const appearance = sceneDoorConfig?.appearance;
      const position = this.resolveSceneDoorPosition(sceneDoorConfig);

      if (!appearance?.textureKey || !position) {
        return null;
      }

      const sprite = this.add
        .sprite(
          position.x,
          position.y,
          appearance.textureKey,
          Number(sceneDoorConfig?.closedFrame ?? 0)
        )
        .setDepth(sceneDoorConfig?.depth ?? appearance.depth ?? 141)
        .setOrigin(appearance.originX ?? 0.5, appearance.originY ?? 1);

      if (typeof appearance.scale === 'number' && sprite.setScale) {
        sprite.setScale(appearance.scale);
      }

      return {
        id: sceneDoorConfig.id || null,
        sceneDoorConfig,
        sprite,
      };
    },

    getSceneDoorEntry(sceneDoorId) {
      if (!sceneDoorId || !Array.isArray(this.sceneDoorEntries)) {
        return null;
      }

      return this.sceneDoorEntries.find((entry) => entry.id === sceneDoorId) || null;
    },

    setSceneDoorVisibility(sceneDoorId, visible) {
      this.getSceneDoorEntry(sceneDoorId)?.sprite?.setVisible?.(visible);
    },

    resolveSceneActorTargetPosition(target) {
      const normalizedTarget = normalizeActorTarget(target);

      if (!normalizedTarget || typeof normalizedTarget !== 'object') {
        return null;
      }

      if (typeof normalizedTarget.x === 'number' && typeof normalizedTarget.y === 'number') {
        return {
          x: normalizedTarget.x,
          y: normalizedTarget.y,
        };
      }

      if (
        typeof normalizedTarget.layerName === 'string' &&
        typeof normalizedTarget.objectName === 'string'
      ) {
        return this.resolveSpawnTargetPosition(normalizedTarget);
      }

      return null;
    },

    createSceneActors() {
      this.sceneActorEntries = this.getSceneActorConfigs()
        .map((actorConfig) => this.createSceneActorEntry(actorConfig))
        .filter(Boolean);

      this.createSceneActorColliders();
    },

    createSceneActorColliders() {
      const movingEntries = Array.isArray(this.sceneActorEntries)
        ? this.sceneActorEntries.filter(
            (entry) =>
              this.doesSceneActorMove(entry?.actorConfig) &&
              entry.actorConfig.collidesWithActors !== false
          )
        : [];

      movingEntries.forEach((entry, entryIndex) => {
        if (entry.actorConfig?.collidesWithPlayer !== false && this.player) {
          this.physics.add.collider(entry.sprite, this.player);
        }

        for (let previousIndex = 0; previousIndex < entryIndex; previousIndex += 1) {
          this.physics.add.collider(entry.sprite, movingEntries[previousIndex].sprite);
        }
      });
    },

    createSceneActorEntry(actorConfig) {
      const appearance = actorConfig?.appearance;
      const idleTextureKey = appearance?.textures?.idleDown?.key;

      if (!appearance || !idleTextureKey) {
        return null;
      }

      const spawnPosition = this.resolveSceneActorTargetPosition(actorConfig.spawn) ||
        this.resolveSceneActorTargetPosition(actorConfig.route?.[0]) || { x: 240, y: 222 };

      const sprite = this.physics.add
        .sprite(spawnPosition.x, spawnPosition.y, idleTextureKey)
        .setOrigin(appearance?.originX ?? 0.5, appearance?.originY ?? 1)
        .setDepth(resolveActorDepth(actorConfig))
        .setCollideWorldBounds(true);

      if (typeof appearance?.scale === 'number' && sprite.setScale) {
        sprite.setScale(appearance.scale);
      }

      sprite.body.setSize(
        actorConfig.body?.width ?? SCENE_ACTOR_BODY_CONFIG.width,
        actorConfig.body?.height ?? SCENE_ACTOR_BODY_CONFIG.height
      );
      sprite.body.setOffset(
        actorConfig.body?.offsetX ?? SCENE_ACTOR_BODY_CONFIG.offsetX,
        actorConfig.body?.offsetY ?? appearance?.body?.offsetY ?? SCENE_ACTOR_BODY_CONFIG.offsetY
      );
      sprite.body.setAllowGravity?.(false);
      sprite.setSlideFactor?.(SCENE_ACTOR_SLIDE_FACTOR, SCENE_ACTOR_SLIDE_FACTOR);
      sprite.body.debugShowVelocity = this.shouldShowCollisionDebug?.() || false;

      const shadowConfig = resolveActorShadowConfig(actorConfig);
      const shadow = shadowConfig
        ? this.add
            .ellipse(
              spawnPosition.x,
              spawnPosition.y,
              shadowConfig.width,
              shadowConfig.height,
              0x000000,
              shadowConfig.alpha ?? 0.2
            )
            .setDepth(resolveActorDepth(actorConfig) - 1)
        : null;

      if (
        this.doesSceneActorMove(actorConfig) &&
        actorConfig.collidesWithWorld !== false &&
        Array.isArray(this.collisionBodies) &&
        this.collisionBodies.length > 0
      ) {
        this.physics.add.collider(sprite, this.collisionBodies);
      }

      const entry = {
        actorConfig,
        animationKeys: this.ensureSceneActorAnimations(actorConfig),
        currentRouteIndex: 0,
        facing: actorConfig.facing || 'down',
        lastProgressAt: 0,
        lastProgressDistance: Number.POSITIVE_INFINITY,
        lastRouteIndex: 0,
        navState: {
          blockedCrosswalkPairId: null,
          crosswalkCooldownActive: false,
          crosswalkFollowUpRule: null,
          currentNodeName:
            actorConfig?.spawn?.layerName === actorConfig?.navGraph?.layerName
              ? actorConfig.spawn.objectName
              : null,
          lastDestinationNodeName: null,
        },
        pendingResume: null,
        recoveryUntil: 0,
        recoveryVector: null,
        route: Array.isArray(actorConfig?.route) ? actorConfig.route : [],
        shadow,
        sprite,
        stuckAttemptCount: 0,
        stuckRouteIndex: -1,
        waitUntil: 0,
      };

      this.applySceneActorIdleAnimation(entry);
      this.syncSceneActorVisual(entry);

      return entry;
    },

    resolveSceneActorTransitionHiddenDurationMs(transitionConfig) {
      const rangeValue = resolveTransitionRangeValue(transitionConfig?.hiddenDurationRangeMs);

      if (rangeValue !== null) {
        return rangeValue;
      }

      return Number(transitionConfig?.hiddenDurationMs ?? 1200);
    },

    resolveSceneActorRouteIndex(nextRouteIndexConfig, fallbackIndex = 0) {
      if (typeof nextRouteIndexConfig === 'number') {
        return nextRouteIndexConfig;
      }

      if (Array.isArray(nextRouteIndexConfig)) {
        const validIndexes = nextRouteIndexConfig.filter((value) => typeof value === 'number');

        if (validIndexes.length > 0) {
          const randomIndex = Math.floor(Math.random() * validIndexes.length);
          return validIndexes[randomIndex];
        }
      }

      return fallbackIndex;
    },

    resetSceneActorRecovery(entry) {
      entry.recoveryUntil = 0;
      entry.recoveryVector = null;
      entry.stuckAttemptCount = 0;
      entry.stuckRouteIndex = -1;
    },
  });
};
