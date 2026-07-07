import {
  buildCollectibleFallbackDescription,
  buildCityPreviewCollectibleSummary,
  formatCityPreviewCollectibleSummaryText,
  getCityPreviewCollectibleById,
  getCityPreviewCollectibleByInteraction,
} from '../cityPreviewCollectibles';

export const attachCollectibleInteractionMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    getOwnedCollectibleSlugs() {
      const ownedSlugs = this.getPreviewBridge().getOwnedCollectibleSlugs?.();
      return Array.isArray(ownedSlugs) ? ownedSlugs : [];
    },

    getCollectibleConfig(interactionName) {
      return getCityPreviewCollectibleByInteraction(this.previewLocationId, interactionName);
    },

    isCollectibleOwned(collectibleConfig) {
      if (!collectibleConfig?.storeSlug) {
        return false;
      }

      return this.getOwnedCollectibleSlugs().includes(collectibleConfig.storeSlug);
    },

    getCollectibleSummary() {
      return buildCityPreviewCollectibleSummary({
        locationId: this.previewLocationId,
        ownedSlugs: this.getOwnedCollectibleSlugs(),
      });
    },

    getCollectibleSummaryText() {
      return formatCityPreviewCollectibleSummaryText(this.getCollectibleSummary());
    },

    getDistrictLocationHudLabel() {
      const districtLabel = this.getCollectibleSummary()?.districtLabel || 'District 01';
      const locationLabel =
        this.previewMapConfig?.hudLabel || this.previewMapConfig?.label || 'Current Area';

      return `${districtLabel}: ${locationLabel}`;
    },

    getRenderedTileLayer(layerName) {
      return this.renderedTileLayers?.get?.(layerName) || null;
    },

    getObjectTileBounds(objectValue) {
      const tileWidth = Number(
        this.tilemap?.tileWidth || this.tilemap?.tilewidth || this.mapData?.tilewidth || 0
      );
      const tileHeight = Number(
        this.tilemap?.tileHeight || this.tilemap?.tileheight || this.mapData?.tileheight || 0
      );

      if (!objectValue || tileWidth <= 0 || tileHeight <= 0) {
        return null;
      }

      const objectX = Number(objectValue.x || 0);
      const objectY = Number(objectValue.y || 0);
      const objectWidth = Math.max(Number(objectValue.width || 0), 1);
      const objectHeight = Math.max(Number(objectValue.height || 0), 1);

      return {
        endColumn: Math.floor((objectX + objectWidth - 1) / tileWidth),
        endRow: Math.floor((objectY + objectHeight - 1) / tileHeight),
        startColumn: Math.floor(objectX / tileWidth),
        startRow: Math.floor(objectY / tileHeight),
      };
    },

    getCollectibleMapArtEntries(zoneObject, collectibleConfig) {
      const layerNames = Array.isArray(collectibleConfig?.mapArtLayerNames)
        ? collectibleConfig.mapArtLayerNames
        : [];
      const tileBounds = this.getObjectTileBounds(zoneObject);

      if (!tileBounds || layerNames.length === 0) {
        return [];
      }

      const mapTileEntries = [];

      layerNames.forEach((layerName) => {
        const renderedLayer = this.getRenderedTileLayer(layerName);

        if (!renderedLayer?.getTileAt) {
          return;
        }

        for (let row = tileBounds.startRow; row <= tileBounds.endRow; row += 1) {
          for (let column = tileBounds.startColumn; column <= tileBounds.endColumn; column += 1) {
            const tile = renderedLayer.getTileAt(column, row);

            if (!tile || tile.index < 0) {
              continue;
            }

            mapTileEntries.push({
              isRemoved: false,
              layer: renderedLayer,
              tileIndex: tile.index,
              tileX: column,
              tileY: row,
            });
          }
        }
      });

      return mapTileEntries;
    },

    syncCollectibleMapArtVisibility(collectibleEntry, isVisible) {
      (collectibleEntry?.mapTileEntries || []).forEach((mapTileEntry) => {
        const renderedLayer = mapTileEntry.layer;

        if (!renderedLayer?.removeTileAt || !renderedLayer?.putTileAt) {
          return;
        }

        if (isVisible) {
          if (mapTileEntry.isRemoved) {
            renderedLayer.putTileAt(mapTileEntry.tileIndex, mapTileEntry.tileX, mapTileEntry.tileY);
            mapTileEntry.isRemoved = false;
          }

          return;
        }

        if (!mapTileEntry.isRemoved) {
          renderedLayer.removeTileAt(mapTileEntry.tileX, mapTileEntry.tileY);
          mapTileEntry.isRemoved = true;
        }
      });
    },

    createCollectibleDisplays() {
      const collectibleZoneEntries = (this.interactionZoneEntries || []).filter(
        (zoneEntry) => this.getInteractionConfig(zoneEntry.object.name)?.kind === 'collectible'
      );

      this.collectibleDisplayEntries = collectibleZoneEntries
        .map((zoneEntry) => {
          const collectibleConfig = this.getCollectibleConfig(zoneEntry.object.name);
          if (!collectibleConfig) {
            return null;
          }

          const collectibleAnchor = this.getObjectAnchorPosition(zoneEntry.object, 'center');
          const mapTileEntries = this.getCollectibleMapArtEntries(
            zoneEntry.object,
            collectibleConfig
          );
          const shadowWidth = Math.max(Number(collectibleConfig.shadowWidth || 30), 8);
          const shadowHeight = Math.max(Number(collectibleConfig.shadowHeight || 8), 4);
          const shadowOffsetY = Number(collectibleConfig.shadowOffsetY ?? 16);
          const displayOffsetY = Number(collectibleConfig.displayOffsetY ?? -8);
          const floatOffsetY = Math.max(Number(collectibleConfig.floatOffsetY ?? 4), 1);
          const collectibleShadow = this.add
            .ellipse(
              collectibleAnchor.x,
              collectibleAnchor.y + shadowOffsetY,
              shadowWidth,
              shadowHeight,
              0x000000,
              0.18
            )
            .setDepth(132);
          const collectibleDisplay = this.add
            .image(
              collectibleAnchor.x,
              collectibleAnchor.y + displayOffsetY,
              collectibleConfig.textureKey
            )
            .setDepth(133);
          const sourceImage = this.textures.get(collectibleConfig.textureKey)?.getSourceImage?.();
          const sourceWidth = Number(sourceImage?.width || 0);
          const sourceHeight = Number(sourceImage?.height || 0);

          if (sourceWidth > 0 && sourceHeight > 0) {
            const displayScale = Math.min(
              collectibleConfig.displayMaxWidth / sourceWidth,
              52 / sourceHeight
            );
            collectibleDisplay.setScale(displayScale);
          }

          this.tweens.add({
            duration: 1200,
            ease: 'Sine.easeInOut',
            repeat: -1,
            targets: collectibleDisplay,
            y: collectibleAnchor.y + displayOffsetY - floatOffsetY,
            yoyo: true,
          });

          return {
            collectibleConfig,
            display: collectibleDisplay,
            mapTileEntries,
            shadow: collectibleShadow,
          };
        })
        .filter(Boolean);

      this.syncCollectibleDisplayVisibility();
    },

    createDialogueDisplays() {
      const dialogueZoneEntries = (this.interactionZoneEntries || []).filter(
        (zoneEntry) => this.getInteractionConfig(zoneEntry.object.name)?.kind === 'dialogue'
      );

      this.dialogueDisplayEntries = dialogueZoneEntries
        .map((zoneEntry) => {
          const interactionConfig = this.getInteractionConfig(zoneEntry.object.name);
          const displayConfig = interactionConfig?.display;
          if (!displayConfig?.textureKey) {
            return null;
          }

          const dialogueShadow = displayConfig.shadow
            ? this.add
                .ellipse(
                  displayConfig.x,
                  displayConfig.y,
                  displayConfig.shadow.width,
                  displayConfig.shadow.height,
                  0x000000,
                  displayConfig.shadow.alpha ?? 0.2
                )
                .setDepth((displayConfig.depth || 138) - 1)
            : null;
          const dialogueDisplay =
            displayConfig.kind === 'sprite'
              ? this.add.sprite(
                  displayConfig.x,
                  displayConfig.y,
                  displayConfig.textureKey,
                  displayConfig.frame || 0
                )
              : this.add.image(displayConfig.x, displayConfig.y, displayConfig.textureKey);

          dialogueDisplay
            .setDepth(displayConfig.depth || 138)
            .setOrigin(displayConfig.originX ?? 0.5, displayConfig.originY ?? 1);

          if (typeof displayConfig.scale === 'number' && dialogueDisplay.setScale) {
            dialogueDisplay.setScale(displayConfig.scale);
          }

          return {
            display: dialogueDisplay,
            shadow: dialogueShadow,
          };
        })
        .filter(Boolean);
    },

    syncCollectibleDisplayVisibility() {
      (this.collectibleDisplayEntries || []).forEach((collectibleEntry) => {
        const isVisible = !this.isCollectibleOwned(collectibleEntry.collectibleConfig);
        collectibleEntry.display?.setVisible(isVisible);
        collectibleEntry.shadow?.setVisible(isVisible);
        this.syncCollectibleMapArtVisibility(collectibleEntry, isVisible);
      });
    },

    buildCollectibleModalState(collectibleConfig) {
      if (!collectibleConfig) {
        return null;
      }

      return {
        collectibleId: collectibleConfig.id,
        description:
          collectibleConfig.phoneDescription ||
          buildCollectibleFallbackDescription(collectibleConfig.displayName),
        eyebrow: collectibleConfig.phoneCategoryLabel || 'Recovered collectible',
        footer: collectibleConfig.phoneFooter || null,
        imageAlt:
          collectibleConfig.phoneImageAlt ||
          `${collectibleConfig.displayName || 'Collectible'} collectible portrait`,
        imageSrc: collectibleConfig.phoneImagePath || collectibleConfig.assetPath,
        statusLabel: collectibleConfig.footerStatusLabel || 'Field disk',
        title: collectibleConfig.displayName || 'Collectible',
      };
    },

    openCollectibleModal(collectibleConfig) {
      this.activeCollectibleModal = this.buildCollectibleModalState(collectibleConfig);
      this.setPreviewCollectibleModalState(this.activeCollectibleModal);
      this.syncInteractionContext();
    },

    closeCollectibleModal() {
      if (!this.activeCollectibleModal) {
        return;
      }

      this.activeCollectibleModal = null;
      this.setPreviewCollectibleModalState(null);
      this.syncInteractionContext();
      this.syncObjectiveHudState();
    },

    async handlePreviewCollectibleCollectRequest(detail) {
      const collectibleId =
        typeof detail?.collectibleId === 'string' && detail.collectibleId.trim()
          ? detail.collectibleId.trim()
          : null;

      if (!collectibleId || this.activeCollectibleModal?.collectibleId !== collectibleId) {
        return;
      }

      const collectibleConfig = getCityPreviewCollectibleById(collectibleId);

      if (!collectibleConfig) {
        return;
      }

      if (this.isCollectibleOwned(collectibleConfig)) {
        this.syncCollectibleDisplayVisibility();
        this.syncPreviewWorldState(true);
        this.closeCollectibleModal();
        return;
      }

      const claimResult = await this.getPreviewBridge().onCollectibleClaim?.({
        collectibleId: collectibleConfig.id,
        displayName: collectibleConfig.displayName,
        interactionName: collectibleConfig.interactionName,
      });

      if (claimResult?.ok || claimResult?.alreadyOwned) {
        this.syncCollectibleDisplayVisibility();
        this.syncPreviewWorldState(true);
        this.syncInteractionContext();
        this.syncObjectiveHudState();
        this.closeCollectibleModal();
      }
    },
  });
};
