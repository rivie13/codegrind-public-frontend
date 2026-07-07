import { COLLISION_DEBUG_COLORS, PREVIEW_DEBUG_ENABLED } from '../apartmentPreviewScene.constants';

export const attachInteractionDetailMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    getInteractionDetails(interactionName) {
      const interactionConfig = this.getInteractionConfig(interactionName);
      const interactionAccess = this.getInteractionAccess(interactionConfig);

      if (!interactionConfig) {
        return {
          desktopPrompt: 'Press E to interact',
          mobilePrompt: 'Tap Interact to interact.',
        };
      }

      if (!interactionAccess.allowed) {
        if (interactionConfig.hideWhenUnavailable) {
          return {
            desktopPrompt: null,
            mobilePrompt: null,
          };
        }

        if (interactionAccess.reason === 'guest-trial') {
          if (interactionAccess.routeSurface === 'store') {
            return {
              desktopPrompt: 'Press E for store access info',
              mobilePrompt: 'Tap Interact for store access info.',
            };
          }

          return {
            desktopPrompt: 'Press E for guest trial route info',
            mobilePrompt: 'Tap Interact for guest trial route info.',
          };
        }

        return {
          desktopPrompt: 'Finish checking the signal first',
          mobilePrompt: null,
        };
      }

      const desktopPrompt = interactionConfig.desktopPrompt || 'Press E to interact';
      let mobilePrompt = interactionConfig.mobilePrompt || null;

      if (!mobilePrompt && desktopPrompt.match(/press\s+e\b/i)) {
        mobilePrompt = desktopPrompt
          .replace(/Press\s+E\b/gi, 'Tap Interact')
          .replace(/press\s+e\b/gi, 'tap Interact');
        if (mobilePrompt && !mobilePrompt.endsWith('.')) {
          mobilePrompt += '.';
        }
      }

      return {
        desktopPrompt,
        mobilePrompt,
      };
    },

    getActiveInteractionZone() {
      if (!this.player?.body) {
        return null;
      }

      const playerRectangle = new Phaser.Geom.Rectangle(
        this.player.body.x,
        this.player.body.y,
        this.player.body.width,
        this.player.body.height
      );

      return (
        this.interactionZoneEntries.find((zoneEntry) => {
          const interactionConfig = this.getInteractionConfig(zoneEntry.object.name);

          if (this.shouldHideInteractionWhenUnavailable(interactionConfig)) {
            return false;
          }

          if (interactionConfig?.kind === 'collectible') {
            const collectibleConfig = this.getCollectibleConfig(zoneEntry.object.name);
            if (this.isCollectibleOwned(collectibleConfig)) {
              return false;
            }
          }

          const zoneRectangle = new Phaser.Geom.Rectangle(
            zoneEntry.object.x,
            zoneEntry.object.y,
            zoneEntry.object.width,
            zoneEntry.object.height
          );
          return Phaser.Geom.Rectangle.Overlaps(playerRectangle, zoneRectangle);
        }) || null
      );
    },

    getMapObjectLayer(layerName) {
      return (
        this.tilemap?.getObjectLayer?.(layerName) ||
        (this.mapData?.layers || []).find(
          (layer) => layer?.type === 'objectgroup' && layer?.name === layerName
        ) ||
        null
      );
    },

    shouldShowCollisionDebug() {
      return PREVIEW_DEBUG_ENABLED && Boolean(this.getPreviewBridge().showCollisionDebug);
    },

    createCollisionDebugOverlay() {
      if (!this.shouldShowCollisionDebug()) {
        return;
      }

      if (!this.collisionDebugGraphics) {
        this.collisionDebugGraphics = this.add.graphics().setDepth(10000);
      }

      this.redrawCollisionDebugOverlay();
    },

    redrawCollisionDebugOverlay() {
      if (!this.collisionDebugGraphics) {
        return;
      }

      const graphics = this.collisionDebugGraphics;
      graphics.clear();

      graphics.lineStyle(2, COLLISION_DEBUG_COLORS.authored, 1);
      this.rawCollisionObjects.forEach((collisionObject) => {
        if (Array.isArray(collisionObject?.polygon) && collisionObject.polygon.length > 1) {
          const polygonPoints = collisionObject.polygon.map((point) => ({
            x: collisionObject.x + point.x,
            y: collisionObject.y + point.y,
          }));

          graphics.beginPath();
          graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
          polygonPoints.slice(1).forEach((point) => {
            graphics.lineTo(point.x, point.y);
          });
          graphics.closePath();
          graphics.strokePath();
          return;
        }

        if (collisionObject?.width && collisionObject?.height) {
          graphics.strokeRect(
            collisionObject.x,
            collisionObject.y,
            collisionObject.width,
            collisionObject.height
          );
        }
      });

      graphics.lineStyle(1, COLLISION_DEBUG_COLORS.physics, 1);
      this.resolvedCollisionRectangles.forEach((collisionRectangle) => {
        graphics.strokeRect(
          collisionRectangle.x,
          collisionRectangle.y,
          collisionRectangle.width,
          collisionRectangle.height
        );
      });

      graphics.lineStyle(2, COLLISION_DEBUG_COLORS.interaction, 1);
      this.interactionZoneEntries.forEach((zoneEntry) => {
        graphics.strokeRect(
          zoneEntry.object.x,
          zoneEntry.object.y,
          zoneEntry.object.width,
          zoneEntry.object.height
        );
      });

      if (this.player?.body) {
        graphics.fillStyle(COLLISION_DEBUG_COLORS.player, 0.2);
        graphics.fillRect(
          this.player.body.x,
          this.player.body.y,
          this.player.body.width,
          this.player.body.height
        );
        graphics.lineStyle(2, COLLISION_DEBUG_COLORS.player, 1);
        graphics.strokeRect(
          this.player.body.x,
          this.player.body.y,
          this.player.body.width,
          this.player.body.height
        );
      }
    },

    createStaticZone(zoneObject) {
      const zone = this.add.zone(
        zoneObject.x + zoneObject.width / 2,
        zoneObject.y + zoneObject.height / 2,
        zoneObject.width,
        zoneObject.height
      );

      this.physics.add.existing(zone, true);
      return zone;
    },
  });
};
