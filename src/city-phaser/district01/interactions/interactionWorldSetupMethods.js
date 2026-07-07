import {
  DEFAULT_PLAYER_CHARACTER_PRESET,
  PLAYER_BODY_CONFIG,
} from '../apartmentPreviewScene.constants';
import { getCollisionRectangles } from '../apartmentPreviewScene.utils';

export const attachInteractionWorldSetupMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    createPlayer() {
      const spawnPoint = this.resolveSpawnTargetPosition();
      const playerTextureKey =
        this.playerTextureKeys?.atlas || DEFAULT_PLAYER_CHARACTER_PRESET.textureKeys.atlas;

      this.player = this.physics.add
        .sprite(spawnPoint?.x || 240, spawnPoint?.y || 222, playerTextureKey)
        .setOrigin(0.5, 1)
        .setDepth(140)
        .setCollideWorldBounds(true);

      this.player.body.setSize(PLAYER_BODY_CONFIG.width, PLAYER_BODY_CONFIG.height);
      this.player.body.setOffset(PLAYER_BODY_CONFIG.offsetX, PLAYER_BODY_CONFIG.offsetY);
      this.player.body.debugShowVelocity = this.shouldShowCollisionDebug();
      this.applyIdleFrame();
    },

    async createCollisionGeometry() {
      const collisionLayer = this.getMapObjectLayer('Collision');
      const collisionObjects = collisionLayer?.objects || [];
      const collisionRectangles = collisionObjects
        .filter((collisionObject) => !this.shouldSkipCollisionObject?.(collisionObject))
        .flatMap((collisionObject) => getCollisionRectangles(collisionObject));

      this.rawCollisionObjects = collisionObjects;
      this.resolvedCollisionRectangles = collisionRectangles;

      this.collisionBodies = [];
      const isBackground = this.game?.config?.isBackgroundPreboot;
      const chunkSize = isBackground ? 20 : 100;

      for (let i = 0; i < collisionRectangles.length; i++) {
        const hitbox = this.createCollisionBody(collisionRectangles[i]);
        this.collisionBodies.push(hitbox);
        if ((i + 1) % chunkSize === 0) {
          await this.yieldToMain?.();
        }
      }

      if (this.shouldShowCollisionDebug()) {
        this.createCollisionDebugOverlay();
      }
    },

    shouldSkipCollisionObject(collisionObject) {
      const collisionName = String(collisionObject?.name || '').trim();

      return collisionName.endsWith('_DOOR_PLACEMENT');
    },

    createCollisionBody(collisionRectangle) {
      const hitbox = this.add.rectangle(
        collisionRectangle.x + collisionRectangle.width / 2,
        collisionRectangle.y + collisionRectangle.height / 2,
        collisionRectangle.width,
        collisionRectangle.height,
        0xff4d4d,
        0
      );

      this.physics.add.existing(hitbox, true);
      this.physics.add.collider(this.player, hitbox);
      return hitbox;
    },

    createInteractionZones() {
      const interactablesLayer = this.getMapObjectLayer('Interactables');
      const exitsLayer = this.getMapObjectLayer('Exits');

      const authoredInteractionObjects = [
        ...((interactablesLayer?.objects || []).filter(
          (zoneObject) => zoneObject?.width && zoneObject?.height
        ) || []),
        ...((exitsLayer?.objects || []).filter(
          (zoneObject) => zoneObject?.width && zoneObject?.height
        ) || []),
      ].filter((zoneObject) => Boolean(this.getInteractionConfig(zoneObject?.name)));
      const authoredInteractionNames = new Set(
        authoredInteractionObjects.map((zoneObject) => zoneObject.name)
      );
      const configuredInteractionObjects = Object.entries(this.previewMapConfig?.interactions || {})
        .filter(
          ([interactionName, interactionConfig]) =>
            !authoredInteractionNames.has(interactionName) &&
            interactionConfig?.zone?.width &&
            interactionConfig?.zone?.height
        )
        .map(([interactionName, interactionConfig]) => ({
          id: `configured:${interactionName}`,
          name: interactionName,
          ...interactionConfig.zone,
        }));
      const interactionObjects = [...authoredInteractionObjects, ...configuredInteractionObjects];

      this.interactionZoneEntries = interactionObjects.map((zoneObject) => ({
        object: zoneObject,
        zone: this.createStaticZone(zoneObject),
      }));

      this.syncInteractionZones();

      this.createCollectibleDisplays();
      this.createDialogueDisplays();

      if (this.shouldShowCollisionDebug()) {
        this.redrawCollisionDebugOverlay();
      }
    },

    syncInteractionZones() {
      if (!Array.isArray(this.interactionZoneEntries)) {
        return;
      }

      this.terminalZoneObject =
        this.interactionZoneEntries.find((zoneEntry) => {
          const interactionConfig = this.getInteractionConfig(zoneEntry.object.name);
          return (
            interactionConfig?.kind === 'terminal' && this.canUseInteraction(interactionConfig)
          );
        })?.object || null;
      this.windowZoneObject =
        this.interactionZoneEntries.find(
          (zoneEntry) => this.getInteractionConfig(zoneEntry.object.name)?.kind === 'window'
        )?.object || null;
      this.exitZoneObject =
        this.interactionZoneEntries.find(
          (zoneEntry) => this.getInteractionConfig(zoneEntry.object.name)?.kind === 'transition'
        )?.object || null;
      this.terminalZone =
        this.interactionZoneEntries.find((zoneEntry) => {
          const interactionConfig = this.getInteractionConfig(zoneEntry.object.name);
          return (
            interactionConfig?.kind === 'terminal' && this.canUseInteraction(interactionConfig)
          );
        })?.zone || null;
      this.exitZone =
        this.interactionZoneEntries.find(
          (zoneEntry) => this.getInteractionConfig(zoneEntry.object.name)?.kind === 'transition'
        )?.zone || null;

      if (typeof this.createTerminalCue === 'function') {
        this.createTerminalCue();
      }
    },
  });
};
