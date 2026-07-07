import {
  decodeTileGid,
  getTilesetDrawingOffset,
  getOversizedTilesets,
  getSheetTilesetAssets,
  getSortedTilesets,
  getTileByLocalId,
  getTilesetForGid,
  isCollectionTileset,
  isOversizedTileset,
  shouldManuallyRenderTileset,
  toAssetPath,
} from './loadExternalTiledMap';
import {
  INTRO_CITY_TILESET_NAME,
  INTRO_CITY_UNCROPPED_STRIP,
  MANUAL_TILE_TEXTURE_PREFIX,
  RETRO_HUD_ICON_ASSETS,
  TILESET_TEXTURE_PREFIX,
} from './apartmentPreviewScene.constants';
import { getPlayerCharacterPreset } from '../../player-character/playerCharacterPresets';
import { getCityPreviewCollectibleFilesForLocation } from './cityPreviewCollectibles';
import {
  buildPlayerAnimations,
  getLayerDepth,
  getUncroppedBackdropFrameSize,
  loadNativeImage,
  loadOptionalNativeImage,
  queueLoaderFiles,
} from './apartmentPreviewScene.utils';

export const attachApartmentPreviewSceneAssetMethods = (SceneClass) => {
  Object.assign(SceneClass.prototype, {
    collectConfiguredSceneActorFiles() {
      const configuredFiles = new Map();

      (this.previewMapConfig?.sceneActors || []).forEach((actorConfig) => {
        const frameConfig = actorConfig?.appearance?.frameConfig;

        Object.values(actorConfig?.appearance?.textures || {}).forEach((textureConfig) => {
          if (!textureConfig?.key || !textureConfig?.assetPath) {
            return;
          }

          configuredFiles.set(textureConfig.key, {
            config: frameConfig,
            key: textureConfig.key,
            path: textureConfig.assetPath,
            type: 'spritesheet',
          });
        });
      });

      return [...configuredFiles.values()];
    },

    collectConfiguredTransitionDoorFiles() {
      const configuredFiles = new Map();
      const addDoorAppearance = (appearance) => {
        if (!appearance?.textureKey || !appearance?.assetPath) {
          return;
        }

        configuredFiles.set(appearance.textureKey, {
          config: appearance.frameConfig,
          key: appearance.textureKey,
          path: appearance.assetPath,
          type: 'spritesheet',
        });
      };

      Object.values(this.previewMapConfig?.interactions || {}).forEach((interactionConfig) => {
        addDoorAppearance(interactionConfig?.transitionEffect?.appearance);
      });

      (this.previewMapConfig?.sceneDoors || []).forEach((sceneDoorConfig) => {
        addDoorAppearance(sceneDoorConfig?.appearance);
      });

      (this.previewMapConfig?.sceneActors || []).forEach((actorConfig) => {
        (actorConfig?.route || []).forEach((routePoint) => {
          addDoorAppearance(routePoint?.transition?.effect?.appearance);
        });
      });

      return [...configuredFiles.values()];
    },

    collectConfiguredInteractionDisplayFiles() {
      const configuredFiles = new Map();

      Object.values(this.previewMapConfig?.interactions || {}).forEach((interactionConfig) => {
        const displayConfig = interactionConfig?.display;
        if (!displayConfig?.textureKey || !displayConfig?.assetPath) {
          return;
        }

        configuredFiles.set(displayConfig.textureKey, {
          config: displayConfig.frameConfig,
          key: displayConfig.textureKey,
          path: displayConfig.assetPath,
          type: displayConfig.kind === 'sprite' ? 'spritesheet' : 'image',
        });
      });

      return [...configuredFiles.values()];
    },

    async loadAssets(mapData) {
      const tilesetFiles = getSheetTilesetAssets(mapData).map((tileset) => ({
        key: `${TILESET_TEXTURE_PREFIX}${tileset.key}`,
        path: tileset.path,
        type: 'image',
      }));
      const manualCollectionFiles = this.collectCollectionTileAssets(mapData);
      const collectibleFiles = getCityPreviewCollectibleFilesForLocation(this.previewLocationId);
      const configuredSceneActorFiles = this.collectConfiguredSceneActorFiles();
      const configuredTransitionDoorFiles = this.collectConfiguredTransitionDoorFiles();
      const configuredInteractionDisplayFiles = this.collectConfiguredInteractionDisplayFiles();
      const retroHudIconFiles = Object.values(RETRO_HUD_ICON_ASSETS).map((iconAsset) => ({
        key: iconAsset.key,
        path: iconAsset.path,
        type: 'image',
      }));
      await queueLoaderFiles(this, [
        ...tilesetFiles,
        ...manualCollectionFiles,
        ...collectibleFiles,
        ...configuredSceneActorFiles,
        ...configuredTransitionDoorFiles,
        ...configuredInteractionDisplayFiles,
        ...retroHudIconFiles,
      ]);

      await this.syncPlayerCharacter();

      const oversizedTilesets = getOversizedTilesets(mapData);
      const oversizedImages = await Promise.all(
        oversizedTilesets.map(async (tileset) => [
          tileset.name,
          await loadNativeImage(tileset.image),
        ])
      );

      oversizedImages.forEach(([tilesetName, image]) => {
        this.oversizedTilesetImages.set(tilesetName, image);
      });
    },

    async collectDuskCityFrames(mapData) {
      const duskCityTileset = (mapData?.tilesets || []).find(
        (tileset) => tileset?.name === INTRO_CITY_TILESET_NAME
      );

      if (!duskCityTileset || !isOversizedTileset(duskCityTileset)) {
        return [];
      }

      const baseTile = getTileByLocalId(duskCityTileset, 0);
      const animationFrames =
        Array.isArray(baseTile?.animation) && baseTile.animation.length > 0
          ? baseTile.animation
          : [{ duration: 100, tileid: 0 }];

      const uncroppedFrames = await this.collectUncroppedDuskCityFrames(animationFrames);
      this.isUsingUncroppedCityBackdrop = uncroppedFrames.length > 0;

      if (uncroppedFrames.length > 0) {
        return uncroppedFrames;
      }

      this.isUsingUncroppedCityBackdrop = false;

      return Promise.all(
        animationFrames.map(async (frame) => ({
          duration: frame.duration || 100,
          key: await this.ensureOversizedTileTexture(duskCityTileset, frame.tileid),
        }))
      );
    },

    async collectUncroppedDuskCityFrames(animationFrames) {
      // 1. Try loading pre-baked frames natively
      const frameFiles = animationFrames.map((frame) => {
        const frameIndex = frame.tileid;
        const key = `${INTRO_CITY_UNCROPPED_STRIP.keyPrefix}${frameIndex}`;
        const path = toAssetPath(
          `city-v2/tiled/backgrounds_loadingScreens/baked_backdrop/Dusk_City_Background_UNCROPPED_frame_${frameIndex}.png`
        );
        return {
          key,
          path,
          type: 'image',
          optional: true,
        };
      });

      try {
        await queueLoaderFiles(this, frameFiles);
      } catch (err) {
        console.warn('[ApartmentPreviewScene] Error loading pre-baked backdrop frames:', err);
      }

      // Check if all requested frames exist in the texture cache
      const allLoaded = animationFrames.every((frame) =>
        this.textures.exists(`${INTRO_CITY_UNCROPPED_STRIP.keyPrefix}${frame.tileid}`)
      );

      if (allLoaded) {
        console.log(
          '[ApartmentPreviewScene] Successfully loaded pre-baked backdrop frames natively.'
        );
        return animationFrames.map((frame) => ({
          duration: frame.duration || 100,
          key: `${INTRO_CITY_UNCROPPED_STRIP.keyPrefix}${frame.tileid}`,
        }));
      }

      console.warn(
        '[ApartmentPreviewScene] Pre-baked backdrop frames missing. Falling back to browser-side slicing.'
      );

      // 2. Fallback: load the uncropped image strip and slice it using canvases
      const cachedSourceImage = this.uncroppedBackdropSourceImage;
      const sourceImage =
        cachedSourceImage?.width && cachedSourceImage?.height
          ? cachedSourceImage
          : await loadOptionalNativeImage(INTRO_CITY_UNCROPPED_STRIP.path);

      if (!sourceImage) {
        return [];
      }

      this.uncroppedBackdropSourceImage = sourceImage;

      const frameSize = getUncroppedBackdropFrameSize(sourceImage, animationFrames);

      if (!frameSize) {
        return [];
      }

      return Promise.all(
        animationFrames.map(async (frame) => ({
          duration: frame.duration || 100,
          key: await this.ensureUncroppedBackdropTexture(sourceImage, frame.tileid, frameSize),
        }))
      );
    },

    collectCollectionTileAssets(mapData) {
      const uniqueAssets = new Map();
      const visitedTileKeys = new Set();

      const addCollectionTileAsset = (tileset, localTileId) => {
        const tileKey = `${tileset?.name || 'tileset'}:${localTileId}`;
        if (visitedTileKeys.has(tileKey)) {
          return;
        }

        visitedTileKeys.add(tileKey);

        const tile = getTileByLocalId(tileset, localTileId);
        if (!tile) {
          return;
        }

        if (tile.image) {
          const textureKey = this.getManualTextureKey(tileset.name, localTileId);
          if (!uniqueAssets.has(textureKey)) {
            uniqueAssets.set(textureKey, {
              key: textureKey,
              path: tile.image,
              type: 'image',
            });
          }
        }

        if (Array.isArray(tile.animation)) {
          tile.animation.forEach((frame) => {
            addCollectionTileAsset(tileset, frame.tileid);
          });
        }
      };

      (mapData.layers || [])
        .filter((layer) => layer.type === 'tilelayer' && Array.isArray(layer.data))
        .forEach((layer) => {
          layer.data.forEach((rawGid) => {
            if (!rawGid) {
              return;
            }

            const { gid } = decodeTileGid(rawGid);
            if (!gid) {
              return;
            }

            const tileset = getTilesetForGid(mapData, gid);
            if (!isCollectionTileset(tileset)) {
              return;
            }

            const localTileId = gid - tileset.firstgid;
            addCollectionTileAsset(tileset, localTileId);
          });
        });

      return [...uniqueAssets.values()];
    },

    async renderLayers(mapData, tilesets) {
      this.renderedTileLayers = new Map();

      const tileLayers = (mapData.layers || []).filter((layer) => layer.type === 'tilelayer');
      for (const layer of tileLayers) {
        const renderedLayer = this.tilemap.createLayer(layer.name, tilesets, 0, 0);
        if (renderedLayer) {
          renderedLayer.setDepth(getLayerDepth(layer.name));
          this.renderedTileLayers.set(layer.name, renderedLayer);
        }
        // No per-layer yield: createLayer() is native Phaser and takes <1ms.
        // Sleeping 100ms here (background-mode yieldToMain) × N layers was the
        // primary source of the 5-6 second Step 3 wall. Yield once after all layers.
      }
      // Single yield after all layers so the browser can paint before we continue.
      await new Promise((resolve) => requestAnimationFrame(resolve));
    },

    getTileSourceRect(tileset, localTileId) {
      if (isCollectionTileset(tileset)) {
        const tile = getTileByLocalId(tileset, localTileId);
        if (!tile?.image) {
          return null;
        }
        const textureKey = this.getManualTextureKey(tileset.name, localTileId);
        const texture = this.textures.get(textureKey);
        if (!texture) {
          return null;
        }
        return {
          height: tile.imageheight || tileset.tileheight,
          sourceImage: texture.getSourceImage(),
          sourceX: 0,
          sourceY: 0,
          width: tile.imagewidth || tileset.tilewidth,
        };
      }

      if (!isOversizedTileset(tileset)) {
        const tilesetTextureKey = `${TILESET_TEXTURE_PREFIX}${tileset.name}`;
        const texture = this.textures.get(tilesetTextureKey);
        if (!texture) {
          return null;
        }
        const tile = getTileByLocalId(tileset, localTileId);
        const width = tile?.width || tileset.tilewidth;
        const height = tile?.height || tileset.tileheight;
        const columns = Math.max(Number(tileset.columns) || 1, 1);
        const spacing = Number(tileset.spacing) || 0;
        const margin = Number(tileset.margin) || 0;
        const sourceX =
          typeof tile?.x === 'number'
            ? tile.x
            : margin + (localTileId % columns) * (tileset.tilewidth + spacing);
        const sourceY =
          typeof tile?.y === 'number'
            ? tile.y
            : margin + Math.floor(localTileId / columns) * (tileset.tileheight + spacing);
        return {
          height,
          sourceImage: texture.getSourceImage(),
          sourceX,
          sourceY,
          width,
        };
      }

      // Oversized tileset
      const sourceImage = this.oversizedTilesetImages.get(tileset.name);
      if (!sourceImage) {
        return null;
      }
      const sourceX = (localTileId % tileset.columns) * tileset.tilewidth;
      const sourceY = Math.floor(localTileId / tileset.columns) * tileset.tileheight;
      return {
        height: tileset.tileheight,
        sourceImage,
        sourceX,
        sourceY,
        width: tileset.tilewidth,
      };
    },

    async renderManualTiles(mapData) {
      const tileLayers = (mapData.layers || []).filter(
        (layer) =>
          layer.type === 'tilelayer' && layer.visible !== false && Array.isArray(layer.data)
      );

      // Pre-sort tilesets once — getTilesetForGid previously re-sorted on every tile call.
      const sortedTilesets = getSortedTilesets(mapData);

      // ─── Phase 1: Synchronous pre-scan ────────────────────────────────────────
      // Walk all tile data without any awaits. Collect:
      //   - uniquePairs: the distinct (tileset, localTileId) combos that need manual
      //     texture info built. Stored in a Map keyed by "tilesetName:localTileId".
      //   - placements: flat list of every sprite that needs to be drawn, referencing
      //     the cache key so Phase 3 can stay fully synchronous.
      const uniquePairs = new Map(); // cacheKey → { tileset, localTileId }
      const placements = []; // { cacheKey, column, row, layerDepth, layerOffsetX, layerOffsetY, drawingOffset, flipX, flipY, flipDiagonal }

      const addTileToUniquePairs = (tileset, localTileId) => {
        const cacheKey = `${tileset.name}:${localTileId}`;
        if (uniquePairs.has(cacheKey)) {
          return;
        }
        uniquePairs.set(cacheKey, { tileset, localTileId });

        // Scan for animation frames and pack them too
        const tile = getTileByLocalId(tileset, localTileId);
        if (tile && Array.isArray(tile.animation)) {
          tile.animation.forEach((frame) => {
            addTileToUniquePairs(tileset, frame.tileid);
          });
        }
      };

      for (const layer of tileLayers) {
        const layerDepth = getLayerDepth(layer.name);
        const layerOffsetX = Number(layer.offsetx) || 0;
        const layerOffsetY = Number(layer.offsety) || 0;

        for (let index = 0; index < layer.data.length; index += 1) {
          const rawGid = layer.data[index];
          if (!rawGid) {
            continue;
          }

          const decodedGid = decodeTileGid(rawGid);
          if (!decodedGid.gid) {
            continue;
          }

          const tileset = getTilesetForGid(mapData, decodedGid.gid, sortedTilesets);
          if (!tileset || !shouldManuallyRenderTileset(mapData, tileset)) {
            continue;
          }

          const localTileId = decodedGid.gid - tileset.firstgid;
          const cacheKey = `${tileset.name}:${localTileId}`;

          addTileToUniquePairs(tileset, localTileId);

          const drawingOffset = getTilesetDrawingOffset(tileset);
          const column = index % layer.width;
          const row = Math.floor(index / layer.width);

          placements.push({
            cacheKey,
            column,
            drawingOffset,
            flipDiagonal: decodedGid.flipDiagonal,
            flipX: decodedGid.flipX,
            flipY: decodedGid.flipY,
            layerDepth,
            layerOffsetX,
            layerOffsetY,
            row,
          });
        }
      }

      // ─── Phase 2: Per-Tileset-Type Texture Resolution ─────────────────────────
      // Sheet tilesets (offset/variable-size on an already-loaded Phaser texture):
      //   Register named sub-frames on the existing GPU texture — zero canvas work,
      //   zero pixel copy, zero GPU upload. This is pure frame metadata.
      // Collection / Oversized tilesets:
      //   Bake into 2048x2048 canvas atlases (pixel copy unavoidable for individual
      //   tile images or >8192px sources). Yield periodically to keep main thread
      //   responsive during synchronous drawImage calls.
      const textureInfoMap = new Map();
      let atlasIndex = 0;

      const getAtlasKey = (index) => `baked-dynamic-city-atlas-${index}`;

      // Remove stale atlas canvases from previous scene renders
      let cleanupIndex = 0;
      while (this.textures.exists(getAtlasKey(cleanupIndex))) {
        this.textures.remove(getAtlasKey(cleanupIndex));
        cleanupIndex++;
      }

      // Atlas state variables — only used when processing collection/oversized tiles
      const atlasWidth = 2048;
      const atlasHeight = 2048;
      let currentAtlasKey = null;
      let currentAtlasCanvas = null;
      let currentAtlasContext = null;
      const activeAtlases = new Set();
      let nextAtlasX = 0;
      let nextAtlasY = 0;
      let maxRowHeight = 0;

      const initAtlasIfNeeded = () => {
        if (currentAtlasCanvas) {
          return;
        }
        currentAtlasKey = getAtlasKey(0);
        currentAtlasCanvas = this.textures.createCanvas(currentAtlasKey, atlasWidth, atlasHeight);
        currentAtlasContext = currentAtlasCanvas.getContext();
        activeAtlases.add(currentAtlasCanvas);
      };

      for (const [cacheKey, { tileset, localTileId }] of uniquePairs.entries()) {
        // ── Sheet tileset path: register frame on existing texture (zero cost) ──
        if (!isCollectionTileset(tileset) && !isOversizedTileset(tileset)) {
          const result = this.ensureSheetTileTexture(tileset, localTileId);
          const tile = getTileByLocalId(tileset, localTileId);
          const tileWidth = tile?.width || tileset.tilewidth;
          const tileHeight = tile?.height || tileset.tileheight;

          const animationFrames =
            tile && Array.isArray(tile.animation) && tile.animation.length > 1
              ? tile.animation.map((frame) => {
                  const frameResult = this.ensureSheetTileTexture(tileset, frame.tileid);
                  return {
                    duration: frame.duration,
                    frame: frameResult.frame,
                    textureKey: frameResult.textureKey,
                  };
                })
              : null;

          textureInfoMap.set(cacheKey, {
            animationFrames,
            frame: animationFrames?.[0]?.frame ?? result.frame,
            height: tileHeight,
            textureKey: animationFrames?.[0]?.textureKey ?? result.textureKey,
            width: tileWidth,
          });
          continue;
        }

        // ── Collection / Oversized atlas path (existing baking) ──
        const rect = this.getTileSourceRect(tileset, localTileId);
        if (!rect) {
          continue;
        }

        const { sourceImage, sourceX, sourceY, width, height } = rect;
        initAtlasIfNeeded();

        // Row-packing: check if we need to wrap to the next row
        if (nextAtlasX + width > atlasWidth) {
          nextAtlasX = 0;
          nextAtlasY += maxRowHeight;
          maxRowHeight = 0;
        }

        // If wrapping row exceeds atlas height, allocate a new atlas canvas
        if (nextAtlasY + height > atlasHeight) {
          atlasIndex++;
          currentAtlasKey = getAtlasKey(atlasIndex);
          currentAtlasCanvas = this.textures.exists(currentAtlasKey)
            ? this.textures.get(currentAtlasKey)
            : this.textures.createCanvas(currentAtlasKey, atlasWidth, atlasHeight);
          currentAtlasContext = currentAtlasCanvas.getContext();
          activeAtlases.add(currentAtlasCanvas);

          nextAtlasX = 0;
          nextAtlasY = 0;
          maxRowHeight = 0;
        }

        if (height > maxRowHeight) {
          maxRowHeight = height;
        }

        const frameName = `frame:${cacheKey}`;

        // Draw tile pixels into the dynamic atlas canvas if not already registered
        if (!currentAtlasCanvas.has?.(frameName)) {
          currentAtlasContext.drawImage(
            sourceImage,
            sourceX,
            sourceY,
            width,
            height,
            nextAtlasX,
            nextAtlasY,
            width,
            height
          );
          currentAtlasCanvas.add(frameName, 0, nextAtlasX, nextAtlasY, width, height);
        }

        const tile = getTileByLocalId(tileset, localTileId);
        const animationFrames =
          tile && Array.isArray(tile.animation)
            ? tile.animation.map((frame) => ({
                duration: frame.duration,
                frame: `frame:${tileset.name}:${frame.tileid}`,
                textureKey: '', // populated in second pass
              }))
            : null;

        textureInfoMap.set(cacheKey, {
          animationFrames,
          frame: frameName,
          height,
          textureKey: currentAtlasKey,
          width,
        });

        nextAtlasX += width;

        // Yield using time-budgeted helper instead of hardcoded rAF
        await this.yieldToMain();
      }

      // Populate animationFrames' textureKey using the resolved textureKey of their frames
      for (const info of textureInfoMap.values()) {
        if (Array.isArray(info.animationFrames)) {
          info.animationFrames.forEach((animFrame) => {
            const frameCacheKey = animFrame.frame.replace('frame:', '');
            const frameInfo = textureInfoMap.get(frameCacheKey);
            animFrame.textureKey = frameInfo ? frameInfo.textureKey : info.textureKey;
          });
        }
      }

      // Upload updated atlas sheets to GPU (only if any collection/oversized tiles exist)
      for (const canvas of activeAtlases) {
        canvas.refresh();
      }

      // ─── Phase 3: High-Performance Blitter Batching ───────────────────────────
      const blitterGroups = new Map();
      const getOrCreateBlitter = (layerDepth, atlasKey) => {
        const key = `${layerDepth}:${atlasKey}`;
        if (!blitterGroups.has(key)) {
          blitterGroups.set(key, this.add.blitter(0, 0, atlasKey).setDepth(layerDepth));
        }
        return blitterGroups.get(key);
      };

      for (let i = 0; i < placements.length; i += 1) {
        if (i > 0 && i % 250 === 0) {
          await this.yieldToMain();
        }

        const placement = placements[i];
        const textureInfo = textureInfoMap.get(placement.cacheKey);
        if (!textureInfo) {
          continue;
        }

        const posX =
          placement.column * mapData.tilewidth + placement.layerOffsetX + placement.drawingOffset.x;
        const posY =
          placement.row * mapData.tileheight +
          placement.layerOffsetY +
          mapData.tileheight -
          textureInfo.height +
          placement.drawingOffset.y;

        const isAnimated =
          Array.isArray(textureInfo.animationFrames) && textureInfo.animationFrames.length > 1;
        const isRotated = placement.flipDiagonal;

        if (isAnimated || isRotated) {
          // Fall back to standard heavy image Game Object for animations and diagonal flips
          const sprite = this.add
            .image(posX, posY, textureInfo.textureKey, textureInfo.frame ?? undefined)
            .setDepth(placement.layerDepth)
            .setOrigin(0, 0)
            .setFlip(placement.flipX, placement.flipY);

          if (placement.flipDiagonal) {
            sprite.setAngle(90);
          }

          if (isAnimated) {
            this.startManualTileAnimation(sprite, textureInfo.animationFrames);
          }
        } else {
          // Use ultra-fast Blitter Bob pointer on the GPU
          const blitter = getOrCreateBlitter(placement.layerDepth, textureInfo.textureKey);
          const bob = blitter.create(posX, posY, textureInfo.frame);
          bob.flipX = placement.flipX;
          bob.flipY = placement.flipY;
        }
      }
    },

    async getManualTextureInfo(tileset, localTileId) {
      const cacheKey = `${tileset.name}:${localTileId}`;
      if (this._manualTextureInfoCache && this._manualTextureInfoCache.has(cacheKey)) {
        return this._manualTextureInfoCache.get(cacheKey);
      }
      const info = await this._getManualTextureInfoUncached(tileset, localTileId);
      if (this._manualTextureInfoCache && info) {
        this._manualTextureInfoCache.set(cacheKey, info);
      }
      return info;
    },

    async _getManualTextureInfoUncached(tileset, localTileId) {
      if (isCollectionTileset(tileset)) {
        const tile = getTileByLocalId(tileset, localTileId);
        if (!tile?.image) {
          return null;
        }

        const animationFrames = Array.isArray(tile.animation)
          ? tile.animation
              .map((frame) => {
                const animationTile = getTileByLocalId(tileset, frame.tileid);
                if (!animationTile?.image) {
                  return null;
                }

                // Collection tiles each load as a standalone texture — no parent frame needed.
                const standaloneKey = this.getManualTextureKey(tileset.name, frame.tileid);
                return {
                  duration: frame.duration,
                  frame: null,
                  textureKey: standaloneKey,
                };
              })
              .filter(Boolean)
          : null;

        const standaloneKey = this.getManualTextureKey(tileset.name, localTileId);
        return {
          animationFrames: animationFrames?.length > 1 ? animationFrames : null,
          frame: animationFrames?.[0]?.frame ?? null,
          height: tile.imageheight || tileset.tileheight,
          textureKey: animationFrames?.[0]?.textureKey || standaloneKey,
          width: tile.imagewidth || tileset.tilewidth,
        };
      }

      if (!isOversizedTileset(tileset)) {
        // Sheet tileset with oversized tiles or drawing offset — rendered manually.
        // ensureSheetTileTexture is now synchronous (adds a named frame to the
        // already-loaded tileset texture — no canvas creation, no GPU upload).
        const sheetTile = getTileByLocalId(tileset, localTileId);
        const animationFrames = Array.isArray(sheetTile?.animation)
          ? sheetTile.animation.map((animFrame) => {
              const result = this.ensureSheetTileTexture(tileset, animFrame.tileid);
              return {
                duration: animFrame.duration,
                frame: result.frame,
                textureKey: result.textureKey,
              };
            })
          : null;

        const baseResult = this.ensureSheetTileTexture(tileset, localTileId);
        return {
          animationFrames: animationFrames?.length > 1 ? animationFrames : null,
          frame: animationFrames?.[0]?.frame ?? baseResult.frame,
          height: sheetTile?.height || tileset.tileheight,
          textureKey: animationFrames?.[0]?.textureKey ?? baseResult.textureKey,
          width: sheetTile?.width || tileset.tilewidth,
        };
      }

      // Oversized tileset — must use canvas slicing because the source image exceeds
      // WebGL texture limits and cannot be loaded as a Phaser texture directly.
      const oversizedTile = getTileByLocalId(tileset, localTileId);
      const animationFrames = Array.isArray(oversizedTile?.animation)
        ? await Promise.all(
            oversizedTile.animation.map(async (frame) => ({
              duration: frame.duration,
              frame: null,
              textureKey: await this.ensureOversizedTileTexture(tileset, frame.tileid),
            }))
          )
        : null;

      const baseKey =
        animationFrames?.[0]?.textureKey ||
        (await this.ensureOversizedTileTexture(tileset, localTileId));

      return {
        animationFrames,
        frame: null,
        height: tileset.tileheight,
        textureKey: baseKey,
        width: tileset.tilewidth,
      };
    },

    ensureSheetTileTexture(tileset, localTileId) {
      const frameName = this.getManualTextureKey(tileset.name, localTileId);
      const tilesetTextureKey = `${TILESET_TEXTURE_PREFIX}${tileset.name}`;
      const tilesetTexture = this.textures.get(tilesetTextureKey);

      if (!tilesetTexture) {
        throw new Error(`Sheet tileset texture was not available for ${tileset.name}.`);
      }

      // Return early if the frame is already registered on the tileset texture.
      // Use optional chaining: older Phaser builds and test mocks may not expose `.has()`.
      if (tilesetTexture.has?.(frameName)) {
        return { frame: frameName, textureKey: tilesetTextureKey };
      }

      const tile = getTileByLocalId(tileset, localTileId);
      const tileWidth = tile?.width || tileset.tilewidth;
      const tileHeight = tile?.height || tileset.tileheight;
      const columns = Math.max(Number(tileset.columns) || 1, 1);
      const spacing = Number(tileset.spacing) || 0;
      const margin = Number(tileset.margin) || 0;
      const sourceX =
        typeof tile?.x === 'number'
          ? tile.x
          : margin + (localTileId % columns) * (tileset.tilewidth + spacing);
      const sourceY =
        typeof tile?.y === 'number'
          ? tile.y
          : margin + Math.floor(localTileId / columns) * (tileset.tileheight + spacing);

      // Register the tile region as a named frame on the already-loaded tileset texture.
      // This is pure metadata — no canvas creation, no drawImage, no GPU upload.
      // Phaser's renderer will blit the correct sub-region directly at draw time.
      tilesetTexture.add(frameName, 0, sourceX, sourceY, tileWidth, tileHeight);

      return { frame: frameName, textureKey: tilesetTextureKey };
    },

    async ensureOversizedTileTexture(tileset, localTileId) {
      const key = this.getManualTextureKey(tileset.name, localTileId);
      if (this.textures.exists(key)) {
        return key;
      }

      const sourceImage = this.oversizedTilesetImages.get(tileset.name);
      if (!sourceImage) {
        throw new Error(`Oversized tileset image was not available for ${tileset.name}.`);
      }

      const sourceX = (localTileId % tileset.columns) * tileset.tilewidth;
      const sourceY = Math.floor(localTileId / tileset.columns) * tileset.tileheight;
      const canvasTexture = this.textures.createCanvas(key, tileset.tilewidth, tileset.tileheight);
      const context = canvasTexture.getContext();

      context.clearRect(0, 0, tileset.tilewidth, tileset.tileheight);
      context.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        tileset.tilewidth,
        tileset.tileheight,
        0,
        0,
        tileset.tilewidth,
        tileset.tileheight
      );
      if (this.createdCanvasTextures) {
        this.createdCanvasTextures.add(canvasTexture);
      } else {
        canvasTexture.refresh();
      }

      return key;
    },

    async ensureUncroppedBackdropTexture(sourceImage, frameIndex, frameSize) {
      const key = `${INTRO_CITY_UNCROPPED_STRIP.keyPrefix}${frameIndex}`;
      if (this.textures.exists(key)) {
        return key;
      }

      const sourceX = frameIndex * frameSize.frameWidth;
      const canvasTexture = this.textures.createCanvas(
        key,
        frameSize.frameWidth,
        frameSize.frameHeight
      );
      const context = canvasTexture.getContext();

      context.clearRect(0, 0, frameSize.frameWidth, frameSize.frameHeight);
      context.drawImage(
        sourceImage,
        sourceX,
        0,
        frameSize.frameWidth,
        frameSize.frameHeight,
        0,
        0,
        frameSize.frameWidth,
        frameSize.frameHeight
      );
      if (this.createdCanvasTextures) {
        this.createdCanvasTextures.add(canvasTexture);
      } else {
        canvasTexture.refresh();
      }

      return key;
    },

    startManualTileAnimation(sprite, animationFrames) {
      let nextFrameIndex = 0;

      const advanceFrame = () => {
        if (!sprite.active || !sprite.scene) {
          return;
        }

        const animFrame = animationFrames[nextFrameIndex];
        // animFrame.frame may be null for standalone textures (collection/oversized tiles);
        // Phaser's setTexture ignores undefined as a frame argument and keeps current frame.
        sprite.setTexture(animFrame.textureKey, animFrame.frame ?? undefined);
        nextFrameIndex = (nextFrameIndex + 1) % animationFrames.length;
        this.time.delayedCall(animFrame.duration, advanceFrame);
      };

      advanceFrame();
    },

    getManualTextureKey(tilesetName, localTileId) {
      return `${MANUAL_TILE_TEXTURE_PREFIX}${tilesetName}:${localTileId}`;
    },

    async syncPlayerCharacter() {
      const selectedPlayerCharacterId =
        this.getPreviewBridge()?.guestPhoneContext?.selectedPlayerCharacterId;
      const playerCharacterPreset = getPlayerCharacterPreset(selectedPlayerCharacterId);

      this.playerCharacterPreset = playerCharacterPreset;
      this.playerTextureKeys = playerCharacterPreset.textureKeys;
      this.playerAnimationKeys = playerCharacterPreset.animationKeys;

      const playerFile = {
        config: playerCharacterPreset.frameConfig,
        key: playerCharacterPreset.textureKeys.atlas,
        path: playerCharacterPreset.sheetPath,
        type: 'spritesheet',
      };

      await queueLoaderFiles(this, [playerFile]);

      buildPlayerAnimations(this, playerCharacterPreset);

      if (this.player) {
        this.player.setTexture(playerCharacterPreset.textureKeys.atlas);
        this.applyIdleFrame();
      }
    },
  });
};
