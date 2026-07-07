import path from 'node:path';
import { existsSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const { PNG } = pngjs;

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const DEFAULT_TILED_VERSION = '1.12.1';
const DEFAULT_TILED_FORMAT_VERSION = '1.10';
const LEGACY_TILED_ROOT_PREFIXES = [
  'public/city-v2/tiled',
  'codegrind-frontend/public/city-v2/tiled',
];
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

function resolveTiledProjectRoot() {
  const explicitRoot = process.env.TILED_PROJECT_DIR || process.env.CODEGRIND_TILED_PROJECT_DIR;
  const candidates = [
    explicitRoot,
    path.resolve(process.cwd(), '../../CodeGrind_Assets/Art_Assets/tiled'),
    path.resolve(process.cwd(), '../CodeGrind_Assets/Art_Assets/tiled'),
    path.resolve(MODULE_DIR, '../../../../../CodeGrind_Assets/Art_Assets/tiled'),
    path.resolve(process.cwd(), 'public/city-v2/tiled'),
    path.resolve(process.cwd(), 'codegrind-frontend/public/city-v2/tiled'),
    path.resolve(MODULE_DIR, '../../../public/city-v2/tiled'),
  ].filter(Boolean);

  const existingRoot = candidates.find((candidate) => existsSync(candidate));

  return existingRoot ? path.resolve(existingRoot) : null;
}

const TILED_PROJECT_ROOT = resolveTiledProjectRoot();

function resolveLegacyTiledPath(targetPath) {
  if (typeof targetPath !== 'string' || path.isAbsolute(targetPath)) {
    return null;
  }

  const normalizedTargetPath = normalizePath(targetPath).replace(/^\.\//, '');

  for (const prefix of LEGACY_TILED_ROOT_PREFIXES) {
    if (normalizedTargetPath === prefix) {
      return '';
    }

    if (normalizedTargetPath.startsWith(`${prefix}/`)) {
      return normalizedTargetPath.slice(prefix.length + 1);
    }
  }

  return null;
}

export function parseCliArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const nextValue = argv[index + 1];
    const value = nextValue !== undefined && !nextValue.startsWith('--') ? nextValue : true;

    if (value !== true) {
      index += 1;
    }

    if (args[key] === undefined) {
      args[key] = value;
      continue;
    }

    if (Array.isArray(args[key])) {
      args[key].push(value);
      continue;
    }

    args[key] = [args[key], value];
  }

  return args;
}

export function getRequiredString(args, key) {
  const value = args[key];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required argument: --${key}`);
  }

  return value;
}

export function getOptionalString(args, key, fallback = undefined) {
  const value = args[key];

  if (value === undefined || value === true) {
    return fallback;
  }

  if (typeof value !== 'string') {
    throw new Error(`Argument must be a string: --${key}`);
  }

  return value;
}

export function getRequiredNumber(args, key) {
  const value = Number(getRequiredString(args, key));

  if (!Number.isFinite(value)) {
    throw new Error(`Argument must be numeric: --${key}`);
  }

  return value;
}

export function getOptionalNumber(args, key, fallback = undefined) {
  const rawValue = getOptionalString(args, key, undefined);

  if (rawValue === undefined) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(`Argument must be numeric: --${key}`);
  }

  return value;
}

export function resolveFromCwd(targetPath) {
  if (path.isAbsolute(targetPath)) {
    return path.resolve(targetPath);
  }

  const relativeToTiledProject = resolveLegacyTiledPath(targetPath);

  if (relativeToTiledProject !== null && TILED_PROJECT_ROOT) {
    return path.resolve(TILED_PROJECT_ROOT, relativeToTiledProject);
  }

  return path.resolve(process.cwd(), targetPath);
}

export function normalizePath(targetPath) {
  return targetPath.split(path.sep).join('/');
}

function shouldSkipCollectionEntry(entry) {
  const parentPath = typeof entry.parentPath === 'string' ? entry.parentPath : '';
  const normalizedParentPath = normalizePath(parentPath);

  return entry.name.startsWith('._') || normalizedParentPath.includes('/__MACOSX/');
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readTileset(filePath) {
  const source = await readFile(filePath, 'utf8');
  const trimmedSource = source.trimStart();

  if (!trimmedSource.startsWith('<')) {
    return JSON.parse(source);
  }

  const tilecountMatch = trimmedSource.match(/\btilecount="(\d+)"/i);

  if (tilecountMatch) {
    return {
      tilecount: Number(tilecountMatch[1]),
    };
  }

  const tileMatches = trimmedSource.match(/<tile\b/gi);

  if (tileMatches) {
    return {
      tilecount: tileMatches.length,
    };
  }

  throw new Error(`Unable to determine tilecount for tileset: ${filePath}`);
}

export async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function readPngDimensions(filePath) {
  const buffer = await readFile(filePath);

  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`Only PNG assets are supported right now: ${filePath}`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function readPngImage(filePath) {
  const buffer = await readFile(filePath);

  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`Only PNG assets are supported right now: ${filePath}`);
  }

  return PNG.sync.read(buffer);
}

async function writePngImage(filePath, image) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, PNG.sync.write(image));
}

export async function copyAssetIfNeeded(sourcePath, destinationPath) {
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) {
    return false;
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
  return true;
}

export function computeSheetLayout({ imageWidth, imageHeight, tileWidth, tileHeight, margin = 0, spacing = 0 }) {
  const usableWidth = imageWidth - margin * 2 + spacing;
  const usableHeight = imageHeight - margin * 2 + spacing;

  if (usableWidth <= 0 || usableHeight <= 0) {
    throw new Error('Tile size and margin leave no usable image area.');
  }

  const columns = Math.floor(usableWidth / (tileWidth + spacing));
  const rows = Math.floor(usableHeight / (tileHeight + spacing));

  if (columns <= 0 || rows <= 0) {
    throw new Error('Tile size is larger than the available image area.');
  }

  const widthRemainder = usableWidth % (tileWidth + spacing);
  const heightRemainder = usableHeight % (tileHeight + spacing);
  const warnings = [];

  if (widthRemainder !== 0 || heightRemainder !== 0) {
    warnings.push(
      `Image dimensions do not divide evenly into the requested grid (${tileWidth}x${tileHeight}).`
    );
  }

  return {
    columns,
    rows,
    tilecount: columns * rows,
    warnings,
  };
}

function buildSheetTileset({
  name,
  imagePath,
  imageWidth,
  imageHeight,
  tileWidth,
  tileHeight,
  columns,
  tilecount,
  margin = 0,
  spacing = 0,
  tiles = undefined,
}) {
  const tileset = {
    columns,
    image: imagePath,
    imageheight: imageHeight,
    imagewidth: imageWidth,
    margin,
    name,
    spacing,
    tilecount,
    tiledversion: DEFAULT_TILED_VERSION,
    tileheight: tileHeight,
    tilewidth: tileWidth,
    type: 'tileset',
    version: DEFAULT_TILED_FORMAT_VERSION,
  };

  if (Array.isArray(tiles) && tiles.length > 0) {
    tileset.tiles = tiles;
  }

  return tileset;
}

function buildCollectionTileset({ name, tileWidth, tileHeight, tiles }) {
  return {
    columns: 0,
    grid: {
      height: 1,
      orientation: 'orthogonal',
      width: 1,
    },
    margin: 0,
    name,
    spacing: 0,
    tilecount: tiles.length,
    tiledversion: DEFAULT_TILED_VERSION,
    tileheight: tileHeight,
    tiles,
    tilewidth: tileWidth,
    type: 'tileset',
    version: DEFAULT_TILED_FORMAT_VERSION,
  };
}

function scoreStripBoundaryOpacity(image, boundaryX) {
  let totalAlpha = 0;

  for (let y = 0; y < image.height; y += 1) {
    const leftAlphaIndex = (y * image.width + boundaryX - 1) * 4 + 3;
    const rightAlphaIndex = (y * image.width + boundaryX) * 4 + 3;
    totalAlpha += image.data[leftAlphaIndex] + image.data[rightAlphaIndex];
  }

  return totalAlpha;
}

function inferAnimatedStripFrameWidth(image, frameStep) {
  const normalizedFrameStep = Number(frameStep ?? 16);

  if (!Number.isInteger(normalizedFrameStep) || normalizedFrameStep <= 0) {
    throw new Error('animatedStripCollectionTileset requires a positive integer frameStep.');
  }

  const candidates = [];

  for (
    let candidateFrameWidth = normalizedFrameStep;
    candidateFrameWidth < image.width;
    candidateFrameWidth += normalizedFrameStep
  ) {
    if (image.width % candidateFrameWidth !== 0) {
      continue;
    }

    const frameCount = image.width / candidateFrameWidth;

    if (frameCount < 2) {
      continue;
    }

    let totalBoundaryOpacity = 0;

    for (let boundaryX = candidateFrameWidth; boundaryX < image.width; boundaryX += candidateFrameWidth) {
      totalBoundaryOpacity += scoreStripBoundaryOpacity(image, boundaryX);
    }

    candidates.push({
      frameCount,
      frameWidth: candidateFrameWidth,
      averageBoundaryOpacity: totalBoundaryOpacity / (frameCount - 1),
    });
  }

  if (candidates.length === 0) {
    return image.width;
  }

  candidates.sort((left, right) => {
    if (left.averageBoundaryOpacity !== right.averageBoundaryOpacity) {
      return left.averageBoundaryOpacity - right.averageBoundaryOpacity;
    }

    if (left.frameCount !== right.frameCount) {
      return right.frameCount - left.frameCount;
    }

    return left.frameWidth - right.frameWidth;
  });

  return candidates[0].frameWidth;
}

function blitPngImage(sourceImage, targetImage, destinationX, destinationY) {
  for (let y = 0; y < sourceImage.height; y += 1) {
    for (let x = 0; x < sourceImage.width; x += 1) {
      const sourceIndex = (y * sourceImage.width + x) * 4;
      const targetIndex = ((destinationY + y) * targetImage.width + (destinationX + x)) * 4;

      targetImage.data[targetIndex] = sourceImage.data[sourceIndex];
      targetImage.data[targetIndex + 1] = sourceImage.data[sourceIndex + 1];
      targetImage.data[targetIndex + 2] = sourceImage.data[sourceIndex + 2];
      targetImage.data[targetIndex + 3] = sourceImage.data[sourceIndex + 3];
    }
  }
}

async function readSourceSprites(sourceSpecs = [], contextLabel = 'packedSheetTileset') {
  if (!Array.isArray(sourceSpecs) || sourceSpecs.length === 0) {
    throw new Error(`${contextLabel} requires a non-empty sources array.`);
  }

  const sprites = [];

  for (const [index, sourceSpec] of sourceSpecs.entries()) {
    const sourceType = sourceSpec?.type ?? 'image';

    if (typeof sourceSpec?.sourceImage !== 'string' || sourceSpec.sourceImage.length === 0) {
      throw new Error(`${contextLabel} sources[${index}] requires a sourceImage path.`);
    }

    const sourceImagePath = resolveFromCwd(sourceSpec.sourceImage);
    const image = await readPngImage(sourceImagePath);

    if (sourceType === 'atlas') {
      const boundsList = extractSpriteBoundsFromAtlas(image, {
        alphaThreshold: sourceSpec.alphaThreshold,
        connectivity: sourceSpec.connectivity,
        excludeBounds: sourceSpec.excludeBounds,
        minOpaquePixels: sourceSpec.minOpaquePixels,
        padding: sourceSpec.padding,
      });

      for (const bounds of boundsList) {
        sprites.push(cropAtlasSprite(image, bounds));
      }

      continue;
    }

    if (sourceType === 'band') {
      const bands = findOccupiedBands(image, Number(sourceSpec.alphaThreshold ?? 1));
      const boundsList = bands.flatMap((band) => findOccupiedSpansInBand(image, band, sourceSpec));

      for (const bounds of boundsList) {
        sprites.push(cropAtlasSprite(image, bounds));
      }

      continue;
    }

    if (sourceType === 'regions') {
      const regions = normalizeBoundsList(sourceSpec.regions ?? sourceSpec.bounds ?? []);

      if (regions.length === 0) {
        throw new Error(`${contextLabel} sources[${index}] regions source requires a non-empty regions array.`);
      }

      for (const region of regions) {
        let sprite = cropAtlasSprite(image, region);

        if (sourceSpec.trim !== false) {
          const trimmedBounds = findOpaqueBounds(sprite, {
            alphaThreshold: sourceSpec.alphaThreshold,
            minOpaquePixels: sourceSpec.minOpaquePixels,
            padding: sourceSpec.padding,
          });

          if (!trimmedBounds) {
            continue;
          }

          sprite = cropAtlasSprite(sprite, trimmedBounds);
        }

        sprites.push(sprite);
      }

      continue;
    }

    if (sourceType === 'image') {
      const shouldTrim = sourceSpec.trim !== false;

      if (!shouldTrim) {
        sprites.push(image);
        continue;
      }

      const bounds = findOpaqueBounds(image, {
        alphaThreshold: sourceSpec.alphaThreshold,
        minOpaquePixels: sourceSpec.minOpaquePixels,
        padding: sourceSpec.padding,
      });

      if (!bounds) {
        continue;
      }

      sprites.push(cropAtlasSprite(image, bounds));
      continue;
    }

    throw new Error(`${contextLabel} sources[${index}] uses unsupported type: ${sourceType}`);
  }

  if (sprites.length === 0) {
    throw new Error(`No extractable sprites were found for ${contextLabel}.`);
  }

  return sprites;
}

function packSpritesIntoSheet(sprites, options = {}) {
  const tileWidth = Number(options.tileWidth);
  const tileHeight = Number(options.tileHeight);
  const columns = Number(options.columns);
  const horizontalAlign = options.horizontalAlign ?? 'center';
  const verticalAlign = options.verticalAlign ?? 'bottom';

  if (!Number.isInteger(tileWidth) || tileWidth <= 0) {
    throw new Error('packedSheetTileset requires a positive integer tileWidth.');
  }

  if (!Number.isInteger(tileHeight) || tileHeight <= 0) {
    throw new Error('packedSheetTileset requires a positive integer tileHeight.');
  }

  if (!Number.isInteger(columns) || columns <= 0) {
    throw new Error('packedSheetTileset requires a positive integer columns value.');
  }

  const rows = Math.ceil(sprites.length / columns);
  const sheet = new PNG({ width: columns * tileWidth, height: rows * tileHeight });

  for (const [index, sprite] of sprites.entries()) {
    if (sprite.width > tileWidth || sprite.height > tileHeight) {
      throw new Error(
        `packedSheetTileset sprite ${index} (${sprite.width}x${sprite.height}) exceeds tile size ${tileWidth}x${tileHeight}.`
      );
    }

    const column = index % columns;
    const row = Math.floor(index / columns);
    const baseX = column * tileWidth;
    const baseY = row * tileHeight;
    const offsetX = horizontalAlign === 'left'
      ? 0
      : horizontalAlign === 'right'
        ? tileWidth - sprite.width
        : Math.floor((tileWidth - sprite.width) / 2);
    const offsetY = verticalAlign === 'top'
      ? 0
      : verticalAlign === 'center'
        ? Math.floor((tileHeight - sprite.height) / 2)
        : tileHeight - sprite.height;

    blitPngImage(sprite, sheet, baseX + offsetX, baseY + offsetY);
  }

  return {
    columns,
    rows,
    sheet,
    tilecount: sprites.length,
  };
}

function normalizeBoundsList(boundsSpecs = []) {
  if (!Array.isArray(boundsSpecs)) {
    throw new Error('atlasCollectionTileset excludeBounds must be an array when provided.');
  }

  return boundsSpecs.map((bounds, index) => {
    const x = Number(bounds?.x);
    const y = Number(bounds?.y);
    const width = Number(bounds?.width);
    const height = Number(bounds?.height);

    if (![x, y, width, height].every((value) => Number.isInteger(value))) {
      throw new Error(`atlasCollectionTileset excludeBounds[${index}] must use integer x, y, width, and height.`);
    }

    if (width <= 0 || height <= 0) {
      throw new Error(`atlasCollectionTileset excludeBounds[${index}] width and height must be positive.`);
    }

    return { x, y, width, height };
  });
}

function normalizeAtlasConnectivity(options = {}, errorContext = 'atlasCollectionTileset') {
  const connectivity = Number(options.connectivity ?? 8);

  if (!Number.isInteger(connectivity) || (connectivity !== 4 && connectivity !== 8)) {
    throw new Error(`${errorContext} connectivity must be either 4 or 8.`);
  }

  return connectivity;
}

function pointInBounds(x, y, bounds) {
  return x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height;
}

function shouldExcludePoint(x, y, boundsList) {
  return boundsList.some((bounds) => pointInBounds(x, y, bounds));
}

function compareSpriteBoundsTopLeft(left, right) {
  if (left.y !== right.y) {
    return left.y - right.y;
  }

  if (left.x !== right.x) {
    return left.x - right.x;
  }

  if (left.height !== right.height) {
    return left.height - right.height;
  }

  return left.width - right.width;
}

function measureAxisOverlap(startA, endA, startB, endB) {
  return Math.min(endA, endB) - Math.max(startA, startB) + 1;
}

function measureAxisGap(startA, endA, startB, endB) {
  return Math.max(0, Math.max(startA, startB) - Math.min(endA, endB) - 1);
}

function mergeSpriteBounds(boundsList) {
  return boundsList.reduce(
    (mergedBounds, bounds) => ({
      x: Math.min(mergedBounds.x, bounds.x),
      y: Math.min(mergedBounds.y, bounds.y),
      width: Math.max(mergedBounds.x + mergedBounds.width, bounds.x + bounds.width) - Math.min(mergedBounds.x, bounds.x),
      height: Math.max(mergedBounds.y + mergedBounds.height, bounds.y + bounds.height) - Math.min(mergedBounds.y, bounds.y),
    }),
    {
      x: boundsList[0].x,
      y: boundsList[0].y,
      width: boundsList[0].width,
      height: boundsList[0].height,
    }
  );
}

function normalizeComponentGroupingOptions(options = {}) {
  const mergeVerticalGap = Number(options.mergeVerticalGap ?? 0);
  const mergeHorizontalGap = Number(options.mergeHorizontalGap ?? 0);
  const mergeCenterDistance = Number(options.mergeCenterDistance ?? Number.POSITIVE_INFINITY);
  const mergeMinXOverlap = Number(options.mergeMinXOverlap ?? 1);

  if (!Number.isFinite(mergeVerticalGap) || mergeVerticalGap < 0) {
    throw new Error('cellAtlasCollectionTileset mergeVerticalGap must be a non-negative number.');
  }

  if (!Number.isFinite(mergeHorizontalGap) || mergeHorizontalGap < 0) {
    throw new Error('cellAtlasCollectionTileset mergeHorizontalGap must be a non-negative number.');
  }

  if (!Number.isFinite(mergeCenterDistance) || mergeCenterDistance < 0) {
    throw new Error('cellAtlasCollectionTileset mergeCenterDistance must be a non-negative number.');
  }

  if (!Number.isFinite(mergeMinXOverlap)) {
    throw new Error('cellAtlasCollectionTileset mergeMinXOverlap must be numeric.');
  }

  return {
    mergeVerticalGap,
    mergeHorizontalGap,
    mergeCenterDistance,
    mergeMinXOverlap,
  };
}

function shouldMergeSpriteBounds(left, right, options) {
  const xOverlap = measureAxisOverlap(left.x, left.x + left.width - 1, right.x, right.x + right.width - 1);
  const yOverlap = measureAxisOverlap(left.y, left.y + left.height - 1, right.y, right.y + right.height - 1);
  const xGap = measureAxisGap(left.x, left.x + left.width - 1, right.x, right.x + right.width - 1);
  const yGap = measureAxisGap(left.y, left.y + left.height - 1, right.y, right.y + right.height - 1);
  const leftCenterX = left.x + left.width / 2;
  const rightCenterX = right.x + right.width / 2;
  const centerDistance = Math.abs(leftCenterX - rightCenterX);

  return (
    yGap <= options.mergeVerticalGap &&
    centerDistance <= options.mergeCenterDistance &&
    (xOverlap >= options.mergeMinXOverlap || xGap <= options.mergeHorizontalGap || yOverlap > 0)
  );
}

function groupSpriteBounds(boundsList, options = {}) {
  if (boundsList.length <= 1) {
    return boundsList;
  }

  const groupingOptions = normalizeComponentGroupingOptions(options);

  if (
    groupingOptions.mergeVerticalGap === 0 &&
    groupingOptions.mergeHorizontalGap === 0 &&
    groupingOptions.mergeCenterDistance === Number.POSITIVE_INFINITY &&
    groupingOptions.mergeMinXOverlap > 0
  ) {
    return boundsList;
  }

  const visited = new Array(boundsList.length).fill(false);
  const groupedBounds = [];

  for (let index = 0; index < boundsList.length; index += 1) {
    if (visited[index]) {
      continue;
    }

    const queue = [index];
    const currentGroup = [];
    visited[index] = true;

    while (queue.length > 0) {
      const currentIndex = queue.pop();
      const currentBounds = boundsList[currentIndex];
      currentGroup.push(currentBounds);

      for (let candidateIndex = 0; candidateIndex < boundsList.length; candidateIndex += 1) {
        if (visited[candidateIndex]) {
          continue;
        }

        if (!shouldMergeSpriteBounds(currentBounds, boundsList[candidateIndex], groupingOptions)) {
          continue;
        }

        visited[candidateIndex] = true;
        queue.push(candidateIndex);
      }
    }

    groupedBounds.push(mergeSpriteBounds(currentGroup));
  }

  return groupedBounds.sort(compareSpriteBoundsTopLeft);
}

function extractSpriteBoundsFromAtlas(image, options = {}) {
  const { width, height, data } = image;
  const alphaThreshold = Number(options.alphaThreshold ?? 1);
  const connectivity = normalizeAtlasConnectivity(options);
  const minOpaquePixels = Number(options.minOpaquePixels ?? 1);
  const padding = Number(options.padding ?? 0);
  const excludeBounds = normalizeBoundsList(options.excludeBounds ?? []);

  if (!Number.isInteger(alphaThreshold) || alphaThreshold < 0 || alphaThreshold > 255) {
    throw new Error('atlasCollectionTileset alphaThreshold must be an integer between 0 and 255.');
  }

  if (!Number.isInteger(minOpaquePixels) || minOpaquePixels <= 0) {
    throw new Error('atlasCollectionTileset minOpaquePixels must be a positive integer.');
  }

  if (!Number.isInteger(padding) || padding < 0) {
    throw new Error('atlasCollectionTileset padding must be a non-negative integer.');
  }

  const visited = new Uint8Array(width * height);
  const componentBounds = [];
  const neighborOffsets = connectivity === 4
    ? [
        [0, -1],
        [-1, 0],
        [1, 0],
        [0, 1],
      ]
    : [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;

      if (visited[index]) {
        continue;
      }

      visited[index] = 1;

      if (shouldExcludePoint(x, y, excludeBounds)) {
        continue;
      }

      const alpha = data[index * 4 + 3];

      if (alpha < alphaThreshold) {
        continue;
      }

      const stack = [index];
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let opaquePixels = 0;

      while (stack.length > 0) {
        const currentIndex = stack.pop();
        const currentX = currentIndex % width;
        const currentY = Math.floor(currentIndex / width);
        const currentAlpha = data[currentIndex * 4 + 3];

        if (currentAlpha < alphaThreshold || shouldExcludePoint(currentX, currentY, excludeBounds)) {
          continue;
        }

        opaquePixels += 1;
        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);

        for (const [offsetX, offsetY] of neighborOffsets) {
          const neighborX = currentX + offsetX;
          const neighborY = currentY + offsetY;

          if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) {
            continue;
          }

          const neighborIndex = neighborY * width + neighborX;

          if (visited[neighborIndex]) {
            continue;
          }

          visited[neighborIndex] = 1;
          stack.push(neighborIndex);
        }
      }

      if (opaquePixels < minOpaquePixels) {
        continue;
      }

      componentBounds.push({
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width - 1, maxX + padding) - Math.max(0, minX - padding) + 1,
        height: Math.min(height - 1, maxY + padding) - Math.max(0, minY - padding) + 1,
        opaquePixels,
      });
    }
  }

  return componentBounds.sort(compareSpriteBoundsTopLeft);
}

function extractGroupedSpriteBoundsFromAtlas(image, options = {}) {
  const rawBounds = extractSpriteBoundsFromAtlas(image, options);

  return groupSpriteBounds(rawBounds, options);
}

function findOccupiedBands(image, alphaThreshold = 1) {
  const bands = [];
  let bandStart = null;

  for (let y = 0; y < image.height; y += 1) {
    let occupied = false;

    for (let x = 0; x < image.width; x += 1) {
      const pixelIndex = (y * image.width + x) * 4 + 3;

      if (image.data[pixelIndex] >= alphaThreshold) {
        occupied = true;
        break;
      }
    }

    if (occupied && bandStart === null) {
      bandStart = y;
      continue;
    }

    if (!occupied && bandStart !== null) {
      bands.push({ start: bandStart, end: y - 1 });
      bandStart = null;
    }
  }

  if (bandStart !== null) {
    bands.push({ start: bandStart, end: image.height - 1 });
  }

  return bands;
}

function findOccupiedSpansInBand(image, band, options = {}) {
  const alphaThreshold = Number(options.alphaThreshold ?? 1);
  const minOpaquePixels = Number(options.minOpaquePixels ?? 1);
  const padding = Number(options.padding ?? 0);
  const spans = [];
  let spanStart = null;

  for (let x = 0; x < image.width; x += 1) {
    let occupied = false;

    for (let y = band.start; y <= band.end; y += 1) {
      const pixelIndex = (y * image.width + x) * 4 + 3;

      if (image.data[pixelIndex] >= alphaThreshold) {
        occupied = true;
        break;
      }
    }

    if (occupied && spanStart === null) {
      spanStart = x;
      continue;
    }

    if (!occupied && spanStart !== null) {
      spans.push({ start: spanStart, end: x - 1 });
      spanStart = null;
    }
  }

  if (spanStart !== null) {
    spans.push({ start: spanStart, end: image.width - 1 });
  }

  return spans
    .map((span) => {
      let opaquePixels = 0;

      for (let y = band.start; y <= band.end; y += 1) {
        for (let x = span.start; x <= span.end; x += 1) {
          const pixelIndex = (y * image.width + x) * 4 + 3;

          if (image.data[pixelIndex] >= alphaThreshold) {
            opaquePixels += 1;
          }
        }
      }

      if (opaquePixels < minOpaquePixels) {
        return null;
      }

      return {
        x: Math.max(0, span.start - padding),
        y: Math.max(0, band.start - padding),
        width: Math.min(image.width - 1, span.end + padding) - Math.max(0, span.start - padding) + 1,
        height: Math.min(image.height - 1, band.end + padding) - Math.max(0, band.start - padding) + 1,
      };
    })
    .filter(Boolean)
    .sort(compareSpriteBoundsTopLeft);
}

function snapBoundsToGrid(bounds, image, options = {}) {
  const snapGridWidth = Number(options.snapGridWidth ?? 0);
  const snapGridHeight = Number(options.snapGridHeight ?? 0);

  if (snapGridWidth === 0 && snapGridHeight === 0) {
    return bounds;
  }

  if (!Number.isInteger(snapGridWidth) || snapGridWidth < 0) {
    throw new Error('bandCollectionTileset snapGridWidth must be a non-negative integer.');
  }

  if (!Number.isInteger(snapGridHeight) || snapGridHeight < 0) {
    throw new Error('bandCollectionTileset snapGridHeight must be a non-negative integer.');
  }

  const resolvedSnapWidth = snapGridWidth || 1;
  const resolvedSnapHeight = snapGridHeight || 1;
  const minX = Math.floor(bounds.x / resolvedSnapWidth) * resolvedSnapWidth;
  const minY = Math.floor(bounds.y / resolvedSnapHeight) * resolvedSnapHeight;
  const maxX = Math.min(
    image.width - 1,
    Math.ceil((bounds.x + bounds.width) / resolvedSnapWidth) * resolvedSnapWidth - 1
  );
  const maxY = Math.min(
    image.height - 1,
    Math.ceil((bounds.y + bounds.height) / resolvedSnapHeight) * resolvedSnapHeight - 1
  );

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function shouldMergeBandBounds(left, right, options = {}) {
  const maxVerticalGap = Number(options.mergeVerticalGap ?? -1);
  const minXOverlap = Number(options.mergeMinXOverlap ?? 1);

  if (!Number.isFinite(maxVerticalGap) || maxVerticalGap < 0) {
    return false;
  }

  if (!Number.isFinite(minXOverlap)) {
    throw new Error('bandCollectionTileset mergeMinXOverlap must be numeric.');
  }

  const xOverlap = measureAxisOverlap(left.x, left.x + left.width - 1, right.x, right.x + right.width - 1);
  const yOverlap = measureAxisOverlap(left.y, left.y + left.height - 1, right.y, right.y + right.height - 1);

  if (yOverlap > 0) {
    return false;
  }

  const yGap = measureAxisGap(left.y, left.y + left.height - 1, right.y, right.y + right.height - 1);

  return yGap <= maxVerticalGap && xOverlap >= minXOverlap;
}

function mergeBandSpriteBounds(boundsList, options = {}) {
  if (!Array.isArray(boundsList) || boundsList.length <= 1) {
    return Array.isArray(boundsList) ? boundsList : [];
  }

  const maxVerticalGap = Number(options.mergeVerticalGap ?? -1);

  if (!Number.isFinite(maxVerticalGap) || maxVerticalGap < 0) {
    return boundsList;
  }

  const visited = new Array(boundsList.length).fill(false);
  const mergedBounds = [];

  for (let index = 0; index < boundsList.length; index += 1) {
    if (visited[index]) {
      continue;
    }

    visited[index] = true;
    const queue = [index];
    const group = [];

    while (queue.length > 0) {
      const currentIndex = queue.pop();
      const currentBounds = boundsList[currentIndex];
      group.push(currentBounds);

      for (let candidateIndex = 0; candidateIndex < boundsList.length; candidateIndex += 1) {
        if (visited[candidateIndex]) {
          continue;
        }

        if (!shouldMergeBandBounds(currentBounds, boundsList[candidateIndex], options)) {
          continue;
        }

        visited[candidateIndex] = true;
        queue.push(candidateIndex);
      }
    }

    mergedBounds.push(mergeSpriteBounds(group));
  }

  return mergedBounds.sort(compareSpriteBoundsTopLeft);
}

function cropAtlasSprite(image, bounds) {
  const cropped = new PNG({ width: bounds.width, height: bounds.height });

  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const sourceIndex = ((bounds.y + y) * image.width + (bounds.x + x)) * 4;
      const destinationIndex = (y * bounds.width + x) * 4;

      cropped.data[destinationIndex] = image.data[sourceIndex];
      cropped.data[destinationIndex + 1] = image.data[sourceIndex + 1];
      cropped.data[destinationIndex + 2] = image.data[sourceIndex + 2];
      cropped.data[destinationIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  return cropped;
}

function findOpaqueBounds(image, options = {}) {
  const { width, height, data } = image;
  const alphaThreshold = Number(options.alphaThreshold ?? 1);
  const minOpaquePixels = Number(options.minOpaquePixels ?? 1);
  const padding = Number(options.padding ?? 0);

  if (!Number.isInteger(alphaThreshold) || alphaThreshold < 0 || alphaThreshold > 255) {
    throw new Error('alphaThreshold must be an integer between 0 and 255.');
  }

  if (!Number.isInteger(minOpaquePixels) || minOpaquePixels <= 0) {
    throw new Error('minOpaquePixels must be a positive integer.');
  }

  if (!Number.isInteger(padding) || padding < 0) {
    throw new Error('padding must be a non-negative integer.');
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let opaquePixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha < alphaThreshold) {
        continue;
      }

      opaquePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (opaquePixels < minOpaquePixels) {
    return null;
  }

  const paddedMinX = Math.max(0, minX - padding);
  const paddedMinY = Math.max(0, minY - padding);
  const paddedMaxX = Math.min(width - 1, maxX + padding);
  const paddedMaxY = Math.min(height - 1, maxY + padding);

  return {
    x: paddedMinX,
    y: paddedMinY,
    width: paddedMaxX - paddedMinX + 1,
    height: paddedMaxY - paddedMinY + 1,
    opaquePixels,
  };
}

function resolveCollectionAnimationFrameIds(animationSpec, tiles) {
  if (animationSpec?.frameTileIds === undefined || animationSpec?.frameTileIds === 'all') {
    return tiles.map((tile) => tile.id);
  }

  if (!Array.isArray(animationSpec.frameTileIds) || animationSpec.frameTileIds.length === 0) {
    throw new Error('collectionTileset animation frameTileIds must be an array or "all".');
  }

  return animationSpec.frameTileIds.map((tileId) => {
    const normalizedTileId = Number(tileId);

    if (!Number.isInteger(normalizedTileId) || normalizedTileId < 0) {
      throw new Error('collectionTileset animation frameTileIds must contain non-negative integers.');
    }

    return normalizedTileId;
  });
}

function applyCollectionAnimations(tiles, animations = []) {
  if (!Array.isArray(animations) || animations.length === 0) {
    return tiles;
  }

  const tileIds = new Set(tiles.map((tile) => tile.id));

  return tiles.map((tile) => {
    const animationSpec = animations.find((candidate) => {
      const targetTileId = Number(candidate?.targetTileId ?? candidate?.tileId);
      return Number.isInteger(targetTileId) && targetTileId === tile.id;
    });

    if (!animationSpec) {
      return tile;
    }

    const frameIds = resolveCollectionAnimationFrameIds(animationSpec, tiles);

    frameIds.forEach((frameTileId) => {
      if (!tileIds.has(frameTileId)) {
        throw new Error(
          `collectionTileset animation references missing tile id ${frameTileId} for ${tile.id}.`
        );
      }
    });

    const duration = Number(animationSpec.duration ?? animationSpec.frameDuration ?? 100);

    if (!Number.isInteger(duration) || duration <= 0) {
      throw new Error('collectionTileset animation duration must be a positive integer.');
    }

    return {
      ...tile,
      animation: frameIds.map((frameTileId) => ({
        duration,
        tileid: frameTileId,
      })),
    };
  });
}

function slugifyPathSegment(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'variant';
}

function compareSignDirectoryNames(left, right) {
  const leftNumber = Number(String(left).match(/\d+/)?.[0] ?? Number.POSITIVE_INFINITY);
  const rightNumber = Number(String(right).match(/\d+/)?.[0] ?? Number.POSITIVE_INFINITY);

  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function tilesetTileCount(tileset) {
  if (typeof tileset.tilecount === 'number') {
    return tileset.tilecount;
  }

  if (Array.isArray(tileset.tiles)) {
    return tileset.tiles.length;
  }

  throw new Error('Unable to determine tilecount for tileset.');
}

function resolveSheetAnimationFrameIds(animationSpec, tilecount) {
  const availableTileIds = Array.from({ length: tilecount }, (_, index) => index);

  if (animationSpec?.frameTileIds === undefined || animationSpec?.frameTileIds === 'all') {
    return availableTileIds;
  }

  if (!Array.isArray(animationSpec.frameTileIds) || animationSpec.frameTileIds.length === 0) {
    throw new Error('sheetTileset animation frameTileIds must be an array or "all".');
  }

  return animationSpec.frameTileIds.map((tileId) => {
    const normalizedTileId = Number(tileId);

    if (!Number.isInteger(normalizedTileId) || normalizedTileId < 0 || normalizedTileId >= tilecount) {
      throw new Error(
        `sheetTileset animation frameTileIds must contain integers between 0 and ${tilecount - 1}.`
      );
    }

    return normalizedTileId;
  });
}

function buildAnimatedSheetTiles(tilecount, animations = []) {
  if (!Array.isArray(animations) || animations.length === 0) {
    return undefined;
  }

  return animations
    .map((animationSpec) => {
      const targetTileId = Number(animationSpec?.targetTileId ?? animationSpec?.tileId ?? 0);

      if (!Number.isInteger(targetTileId) || targetTileId < 0 || targetTileId >= tilecount) {
        throw new Error(`sheetTileset animation targetTileId must be between 0 and ${tilecount - 1}.`);
      }

      const duration = Number(animationSpec.duration ?? animationSpec.frameDuration ?? 100);

      if (!Number.isInteger(duration) || duration <= 0) {
        throw new Error('sheetTileset animation duration must be a positive integer.');
      }

      const frameIds = resolveSheetAnimationFrameIds(animationSpec, tilecount);

      return {
        id: targetTileId,
        animation: frameIds.map((frameTileId) => ({
          duration,
          tileid: frameTileId,
        })),
      };
    })
    .sort((left, right) => left.id - right.id);
}

export async function createSheetTileset(operation) {
  const sourceImagePath = resolveFromCwd(operation.sourceImage);
  const destinationImagePath = resolveFromCwd(operation.destImage ?? operation.sourceImage);
  const outputPath = resolveFromCwd(operation.output);
  const tileWidth = Number(operation.tileWidth);
  const tileHeight = Number(operation.tileHeight);
  const margin = Number(operation.margin ?? 0);
  const spacing = Number(operation.spacing ?? 0);

  if (!Number.isInteger(tileWidth) || tileWidth <= 0) {
    throw new Error('sheetTileset requires a positive integer tileWidth.');
  }

  if (!Number.isInteger(tileHeight) || tileHeight <= 0) {
    throw new Error('sheetTileset requires a positive integer tileHeight.');
  }

  const copiedImage = await copyAssetIfNeeded(sourceImagePath, destinationImagePath);
  const { width: imageWidth, height: imageHeight } = await readPngDimensions(destinationImagePath);
  const layout = computeSheetLayout({
    imageWidth,
    imageHeight,
    tileWidth,
    tileHeight,
    margin,
    spacing,
  });
  const tiles = buildAnimatedSheetTiles(layout.tilecount, operation.animations);
  const tileset = buildSheetTileset({
    name: operation.name,
    imagePath: normalizePath(path.relative(path.dirname(outputPath), destinationImagePath)),
    imageWidth,
    imageHeight,
    tileWidth,
    tileHeight,
    columns: layout.columns,
    tilecount: layout.tilecount,
    margin,
    spacing,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'sheetTileset',
    name: operation.name,
    sourceImage: normalizePath(path.relative(process.cwd(), sourceImagePath)),
    destImage: normalizePath(path.relative(process.cwd(), destinationImagePath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    copiedImage,
    imageWidth,
    imageHeight,
    tileWidth,
    tileHeight,
    columns: layout.columns,
    rows: layout.rows,
    tilecount: layout.tilecount,
    warnings: layout.warnings,
  };
}

export async function createDirectorySheetTilesets(operation) {
  const sourceDirPath = resolveFromCwd(operation.sourceDir);
  const outputDirPath = resolveFromCwd(operation.outputDir);
  const tileWidth = Number(operation.tileWidth);
  const tileHeight = Number(operation.tileHeight);
  const margin = Number(operation.margin ?? 0);
  const spacing = Number(operation.spacing ?? 0);
  const matchPattern = operation.match ? new RegExp(operation.match) : null;
  const excludePattern = operation.exclude ? new RegExp(operation.exclude) : null;
  const namePrefix = typeof operation.namePrefix === 'string' && operation.namePrefix.length > 0
    ? operation.namePrefix
    : slugifyPathSegment(path.basename(sourceDirPath));

  if (!Number.isInteger(tileWidth) || tileWidth <= 0) {
    throw new Error('directorySheetTilesets requires a positive integer tileWidth.');
  }

  if (!Number.isInteger(tileHeight) || tileHeight <= 0) {
    throw new Error('directorySheetTilesets requires a positive integer tileHeight.');
  }

  const entries = await readdir(sourceDirPath, { withFileTypes: true, recursive: true });
  const fileEntries = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.toLowerCase().endsWith('.png'))
    .filter((entry) => !shouldSkipCollectionEntry(entry))
    .map((entry) => {
      const parentPath = typeof entry.parentPath === 'string' ? entry.parentPath : '';
      const sourcePath = parentPath ? path.join(parentPath, entry.name) : path.join(sourceDirPath, entry.name);
      const relativePath = normalizePath(path.relative(sourceDirPath, sourcePath));

      return {
        entry,
        relativePath,
        sourcePath,
      };
    })
    .filter(({ relativePath }) => (matchPattern ? matchPattern.test(relativePath) : true))
    .filter(({ relativePath }) => (excludePattern ? !excludePattern.test(relativePath) : true))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath, undefined, {
      numeric: true,
      sensitivity: 'base',
    }));

  if (fileEntries.length === 0) {
    throw new Error(`No PNG files matched directorySheetTilesets input for ${namePrefix}.`);
  }

  const results = [];

  for (const { entry, relativePath, sourcePath } of fileEntries) {
    const relativeDir = normalizePath(path.dirname(relativePath));
    const baseName = path.parse(entry.name).name;
    const tilesetSlug = slugifyPathSegment(relativeDir === '.' ? baseName : `${relativeDir}-${baseName}`);
    const tilesetName = `${namePrefix}-${tilesetSlug}`;
    const outputPath = path.join(outputDirPath, `${tilesetName}.tsj`);
    const result = await createSheetTileset({
      name: tilesetName,
      sourceImage: sourcePath,
      output: outputPath,
      tileWidth,
      tileHeight,
      margin,
      spacing,
    });

    results.push({
      name: tilesetName,
      relativeSource: relativePath,
      output: result.output,
      tilecount: result.tilecount,
      columns: result.columns,
      rows: result.rows,
      warnings: result.warnings,
    });
  }

  return {
    type: 'directorySheetTilesets',
    namePrefix,
    sourceDir: normalizePath(path.relative(process.cwd(), sourceDirPath)),
    outputDir: normalizePath(path.relative(process.cwd(), outputDirPath)),
    generatedCount: results.length,
    results,
  };
}

export async function createPackedSheetTileset(operation) {
  const destinationImagePath = resolveFromCwd(operation.destImage);
  const outputPath = resolveFromCwd(operation.output);
  const sprites = await readSourceSprites(operation.sources, 'packedSheetTileset');
  const tileWidth = Number(operation.tileWidth ?? Math.max(...sprites.map((sprite) => sprite.width)));
  const tileHeight = Number(operation.tileHeight ?? Math.max(...sprites.map((sprite) => sprite.height)));
  const columns = Number(operation.columns ?? Math.ceil(Math.sqrt(sprites.length)));
  const packedSheet = packSpritesIntoSheet(sprites, {
    tileWidth,
    tileHeight,
    columns,
    horizontalAlign: operation.horizontalAlign,
    verticalAlign: operation.verticalAlign,
  });

  await writePngImage(destinationImagePath, packedSheet.sheet);

  const tileset = buildSheetTileset({
    name: operation.name,
    imagePath: normalizePath(path.relative(path.dirname(outputPath), destinationImagePath)),
    imageWidth: packedSheet.sheet.width,
    imageHeight: packedSheet.sheet.height,
    tileWidth,
    tileHeight,
    columns: packedSheet.columns,
    tilecount: packedSheet.tilecount,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'packedSheetTileset',
    name: operation.name,
    destImage: normalizePath(path.relative(process.cwd(), destinationImagePath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    tileWidth,
    tileHeight,
    columns: packedSheet.columns,
    rows: packedSheet.rows,
    tilecount: packedSheet.tilecount,
    sourceCount: operation.sources.length,
  };
}

export async function createMultiSourceCollectionTileset(operation) {
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const sprites = await readSourceSprites(operation.sources, 'multiSourceCollectionTileset');
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(operation.name || 'collection-item');
  const fileDigits = Math.max(3, String(sprites.length).length);
  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;

  for (const [index, sprite] of sprites.entries()) {
    const fileName = `${fileNamePrefix}-${String(index + 1).padStart(fileDigits, '0')}.png`;
    const destinationPath = path.join(destinationDirPath, fileName);

    await writePngImage(destinationPath, sprite);

    maxTileWidth = Math.max(maxTileWidth, sprite.width);
    maxTileHeight = Math.max(maxTileHeight, sprite.height);
    tiles.push({
      id: index,
      image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
      imageheight: sprite.height,
      imagewidth: sprite.width,
    });
  }

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'multiSourceCollectionTileset',
    name: operation.name,
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    tilecount: tiles.length,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    sourceCount: operation.sources.length,
  };
}

export async function createMultiSourceSingleTileTilesets(operation) {
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputDirPath = resolveFromCwd(operation.outputDir);
  const mapPath = operation.mapPath ? resolveFromCwd(operation.mapPath) : null;
  const sprites = await readSourceSprites(operation.sources, 'multiSourceSingleTileTilesets');
  const namePrefix = operation.namePrefix || 'generated-tile';
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(namePrefix);
  const fileDigits = Math.max(3, String(sprites.length).length);
  const results = [];

  for (const [index, sprite] of sprites.entries()) {
    const suffix = String(index + 1).padStart(fileDigits, '0');
    const tilesetName = `${namePrefix}-${suffix}`;
    const imagePath = path.join(destinationDirPath, `${fileNamePrefix}-${suffix}.png`);
    const tilesetPath = path.join(outputDirPath, `${tilesetName}.tsj`);

    await writePngImage(imagePath, sprite);

    const tileset = buildSheetTileset({
      name: tilesetName,
      imagePath: normalizePath(path.relative(path.dirname(tilesetPath), imagePath)),
      imageWidth: sprite.width,
      imageHeight: sprite.height,
      tileWidth: sprite.width,
      tileHeight: sprite.height,
      columns: 1,
      tilecount: 1,
    });

    await writeJson(tilesetPath, tileset);

    const attachResult = mapPath
      ? await addTilesetToMap({
          mapPath,
          tilesetPath,
        })
      : null;

    results.push({
      attach: attachResult,
      image: normalizePath(path.relative(process.cwd(), imagePath)),
      tileset: normalizePath(path.relative(process.cwd(), tilesetPath)),
      width: sprite.width,
      height: sprite.height,
    });
  }

  return {
    type: 'multiSourceSingleTileTilesets',
    generatedCount: results.length,
    mapPath: mapPath ? normalizePath(path.relative(process.cwd(), mapPath)) : null,
    outputDir: normalizePath(path.relative(process.cwd(), outputDirPath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    namePrefix,
    results,
  };
}

export async function createAnimatedStripTilesets(operation) {
  const frameDuration = Number(operation.frameDuration ?? 100);

  if (!Number.isInteger(frameDuration) || frameDuration <= 0) {
    throw new Error('animatedStripTilesets requires a positive integer frameDuration.');
  }

  if (typeof operation.framesOutput !== 'string' || typeof operation.previewOutput !== 'string') {
    throw new Error('animatedStripTilesets requires framesOutput and previewOutput.');
  }

  const frameResult = await createSheetTileset({
    ...operation,
    name: operation.framesName,
    output: operation.framesOutput,
    animations: undefined,
  });

  const previewAnimation = operation.previewAnimation ?? {
    duration: frameDuration,
    frameTileIds: 'all',
    targetTileId: 0,
  };

  const previewResult = await createSheetTileset({
    ...operation,
    animations: [previewAnimation],
    name: operation.previewName,
    output: operation.previewOutput,
  });

  return {
    type: 'animatedStripTilesets',
    frames: frameResult,
    preview: previewResult,
  };
}

export async function createCollectionTileset(operation) {
  const sourceDirPath = resolveFromCwd(operation.sourceDir);
  const destinationDirPath = operation.destDir ? resolveFromCwd(operation.destDir) : null;
  const outputPath = resolveFromCwd(operation.output);
  const matchPattern = operation.match ? new RegExp(operation.match) : null;
  const excludePattern = operation.exclude ? new RegExp(operation.exclude) : null;
  
  // Recursively find all PNG files in source directory and subdirectories
  const entries = await readdir(sourceDirPath, { withFileTypes: true, recursive: true });

  const fileEntries = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.toLowerCase().endsWith('.png'))
    .filter((entry) => !shouldSkipCollectionEntry(entry))
    .filter((entry) => (matchPattern ? matchPattern.test(entry.name) : true))
    .filter((entry) => (excludePattern ? !excludePattern.test(entry.name) : true))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }));

  if (fileEntries.length === 0) {
    throw new Error(`No PNG files matched collectionTileset input for ${operation.name}.`);
  }

  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;
  let copiedCount = 0;

  for (const [index, entry] of fileEntries.entries()) {
    const parentPath = typeof entry.parentPath === 'string' ? entry.parentPath : '';
    const relativeDir = parentPath ? path.relative(sourceDirPath, parentPath) : '';
    const sourcePath = parentPath ? path.join(parentPath, entry.name) : path.join(sourceDirPath, entry.name);

    const destinationPath = destinationDirPath
      ? path.join(destinationDirPath, relativeDir, entry.name)
      : sourcePath;
    
    const copiedImage = await copyAssetIfNeeded(sourcePath, destinationPath);

    if (copiedImage) {
      copiedCount += 1;
    }

    const { width, height } = await readPngDimensions(destinationPath);

    maxTileWidth = Math.max(maxTileWidth, width);
    maxTileHeight = Math.max(maxTileHeight, height);
    tiles.push({
      id: index,
      image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
      imageheight: height,
      imagewidth: width,
    });
  }

  const animatedTiles = applyCollectionAnimations(tiles, operation.animations);

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles: animatedTiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'collectionTileset',
    name: operation.name,
    sourceDir: normalizePath(path.relative(process.cwd(), sourceDirPath)),
    destDir: destinationDirPath ? normalizePath(path.relative(process.cwd(), destinationDirPath)) : null,
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    matchedFileCount: fileEntries.length,
    tilecount: tiles.length,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    copiedImageCount: copiedCount,
  };
}

export async function createAnimatedStripCollectionTileset(operation) {
  const sourceDirPath = resolveFromCwd(operation.sourceDir);
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const matchPattern = operation.match ? new RegExp(operation.match) : null;
  const excludePattern = operation.exclude ? new RegExp(operation.exclude) : null;
  const frameDuration = Number(operation.frameDuration ?? 100);
  const frameStep = Number(operation.frameStep ?? 16);

  if (!Number.isInteger(frameDuration) || frameDuration <= 0) {
    throw new Error('animatedStripCollectionTileset requires a positive integer frameDuration.');
  }

  if (!Number.isInteger(frameStep) || frameStep <= 0) {
    throw new Error('animatedStripCollectionTileset requires a positive integer frameStep.');
  }

  const entries = await readdir(sourceDirPath, { withFileTypes: true, recursive: true });
  const fileEntries = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.toLowerCase().endsWith('.png'))
    .filter((entry) => !shouldSkipCollectionEntry(entry))
    .filter((entry) => (matchPattern ? matchPattern.test(entry.name) : true))
    .filter((entry) => (excludePattern ? !excludePattern.test(entry.name) : true))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }));

  if (fileEntries.length === 0) {
    throw new Error(`No PNG files matched animatedStripCollectionTileset input for ${operation.name}.`);
  }

  const tiles = [];
  const animations = [];
  let nextTileId = 0;
  let maxTileWidth = 0;
  let maxTileHeight = 0;
  let animatedSourceCount = 0;
  let staticSourceCount = 0;

  for (const entry of fileEntries) {
    const parentPath = typeof entry.parentPath === 'string' ? entry.parentPath : '';
    const relativeDir = parentPath ? path.relative(sourceDirPath, parentPath) : '';
    const sourcePath = parentPath ? path.join(parentPath, entry.name) : path.join(sourceDirPath, entry.name);
    const stripImage = await readPngImage(sourcePath);
    const frameWidth = inferAnimatedStripFrameWidth(stripImage, frameStep);
    const frameCount = Math.max(1, stripImage.width / frameWidth);
    const stripBaseName = path.parse(entry.name).name;
    const stripSlug = slugifyPathSegment(relativeDir ? `${relativeDir}-${stripBaseName}` : stripBaseName);
    const stripOutputDir = path.join(destinationDirPath, relativeDir, stripSlug);
    const frameTileIds = [];

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const frameImage = cropAtlasSprite(stripImage, {
        x: frameIndex * frameWidth,
        y: 0,
        width: frameWidth,
        height: stripImage.height,
      });
      const framePath = path.join(stripOutputDir, `${stripSlug}-${String(frameIndex + 1).padStart(3, '0')}.png`);

      await writePngImage(framePath, frameImage);

      maxTileWidth = Math.max(maxTileWidth, frameImage.width);
      maxTileHeight = Math.max(maxTileHeight, frameImage.height);
      tiles.push({
        id: nextTileId,
        image: normalizePath(path.relative(path.dirname(outputPath), framePath)),
        imageheight: frameImage.height,
        imagewidth: frameImage.width,
      });
      frameTileIds.push(nextTileId);
      nextTileId += 1;
    }

    if (frameTileIds.length > 1) {
      animations.push({
        duration: frameDuration,
        frameTileIds,
        targetTileId: frameTileIds[0],
      });
      animatedSourceCount += 1;
    } else {
      staticSourceCount += 1;
    }
  }

  const animatedTiles = applyCollectionAnimations(tiles, animations);
  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles: animatedTiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'animatedStripCollectionTileset',
    name: operation.name,
    sourceDir: normalizePath(path.relative(process.cwd(), sourceDirPath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    matchedFileCount: fileEntries.length,
    tilecount: tiles.length,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    animatedSourceCount,
    staticSourceCount,
  };
}

export async function createAnimatedVariantCollectionTilesets(operation) {
  const sourceRootPath = resolveFromCwd(operation.sourceDir);
  const destinationRootPath = resolveFromCwd(operation.destDir);
  const outputRootPath = resolveFromCwd(operation.outputDir);
  const mapPath = operation.mapPath ? resolveFromCwd(operation.mapPath) : null;
  const frameDuration = Number(operation.frameDuration ?? 100);
  const namePrefix = operation.namePrefix || 'd01-sign';

  if (!Number.isInteger(frameDuration) || frameDuration <= 0) {
    throw new Error('animatedVariantCollectionTilesets requires a positive integer frameDuration.');
  }

  const signEntries = (await readdir(sourceRootPath, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .filter((entry) => /^Sign\s+\d+$/i.test(entry.name))
    .sort((left, right) => compareSignDirectoryNames(left.name, right.name));

  if (signEntries.length === 0) {
    throw new Error(`No sign directories were found under ${operation.sourceDir}.`);
  }

  const results = [];

  for (const signEntry of signEntries) {
    const signNumber = String(signEntry.name).match(/\d+/)?.[0];

    if (!signNumber) {
      continue;
    }

    const signDirectoryPath = path.join(sourceRootPath, signEntry.name);
    const variantEntries = (await readdir(signDirectoryPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
      );

    for (const variantEntry of variantEntries) {
      const variantSlug = slugifyPathSegment(variantEntry.name);
      const tilesetName = `${namePrefix}-${signNumber}-${variantSlug}`;
      const tilesetPath = path.join(outputRootPath, `${tilesetName}.tsj`);
      const variantSourcePath = path.join(signDirectoryPath, variantEntry.name);
      const variantDestinationPath = path.join(
        destinationRootPath,
        `sign-${signNumber}-${variantSlug}`
      );

      const tilesetResult = await createCollectionTileset({
        animations: [
          {
            duration: frameDuration,
            frameTileIds: 'all',
            targetTileId: 0,
          },
        ],
        destDir: variantDestinationPath,
        name: tilesetName,
        output: tilesetPath,
        sourceDir: variantSourcePath,
      });

      const attachResult = mapPath
        ? await addTilesetToMap({
            mapPath,
            tilesetPath,
          })
        : null;

      results.push({
        attach: attachResult,
        sign: signEntry.name,
        tileset: tilesetResult,
        variant: variantEntry.name,
      });
    }
  }

  return {
    type: 'animatedVariantCollectionTilesets',
    generatedCount: results.length,
    mapPath: mapPath ? normalizePath(path.relative(process.cwd(), mapPath)) : null,
    namePrefix,
    outputDir: normalizePath(path.relative(process.cwd(), outputRootPath)),
    sourceDir: normalizePath(path.relative(process.cwd(), sourceRootPath)),
    results,
  };
}

export async function addTilesetToMap(operation) {
  const mapPath = resolveFromCwd(operation.mapPath);
  const tilesetPath = resolveFromCwd(operation.tilesetPath);
  const map = await readJson(mapPath);
  const relativeTilesetSource = normalizePath(path.relative(path.dirname(mapPath), tilesetPath));
  const existingEntry = (map.tilesets ?? []).find((entry) => normalizePath(entry.source) === relativeTilesetSource);

  if (existingEntry) {
    return {
      type: 'attachTilesetToMap',
      mapPath: normalizePath(path.relative(process.cwd(), mapPath)),
      tilesetPath: normalizePath(path.relative(process.cwd(), tilesetPath)),
      firstgid: existingEntry.firstgid,
      skipped: true,
    };
  }

  let nextFirstGid = 1;

  for (const entry of map.tilesets ?? []) {
    if (!entry.source) {
      continue;
    }

    const referencedTilesetPath = path.resolve(path.dirname(mapPath), entry.source);
    const referencedTileset = await readTileset(referencedTilesetPath);
    const tilecount = tilesetTileCount(referencedTileset);

    nextFirstGid = Math.max(nextFirstGid, entry.firstgid + tilecount);
  }

  map.tilesets = [...(map.tilesets ?? []), { firstgid: nextFirstGid, source: relativeTilesetSource }];
  await writeJson(mapPath, map);

  return {
    type: 'attachTilesetToMap',
    mapPath: normalizePath(path.relative(process.cwd(), mapPath)),
    tilesetPath: normalizePath(path.relative(process.cwd(), tilesetPath)),
    firstgid: nextFirstGid,
    skipped: false,
  };
}

export async function removeTilesetFromMap(operation) {
  const mapPath = resolveFromCwd(operation.mapPath);
  const tilesetPath = resolveFromCwd(operation.tilesetPath);
  const map = await readJson(mapPath);
  const relativeTilesetSource = normalizePath(path.relative(path.dirname(mapPath), tilesetPath));
  const existingTilesets = Array.isArray(map.tilesets) ? map.tilesets : [];
  const filteredTilesets = existingTilesets.filter(
    (entry) => normalizePath(entry.source ?? '') !== relativeTilesetSource
  );

  if (filteredTilesets.length === existingTilesets.length) {
    return {
      type: 'detachTilesetFromMap',
      mapPath: normalizePath(path.relative(process.cwd(), mapPath)),
      tilesetPath: normalizePath(path.relative(process.cwd(), tilesetPath)),
      removed: false,
    };
  }

  map.tilesets = filteredTilesets;
  await writeJson(mapPath, map);

  return {
    type: 'detachTilesetFromMap',
    mapPath: normalizePath(path.relative(process.cwd(), mapPath)),
    tilesetPath: normalizePath(path.relative(process.cwd(), tilesetPath)),
    removed: true,
  };
}

export async function createAtlasCollectionTileset(operation) {
  const sourceImagePath = resolveFromCwd(operation.sourceImage);
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const image = await readPngImage(sourceImagePath);
  const spriteBounds = extractSpriteBoundsFromAtlas(image, {
    alphaThreshold: operation.alphaThreshold,
    connectivity: operation.connectivity,
    excludeBounds: operation.excludeBounds,
    minOpaquePixels: operation.minOpaquePixels,
    padding: operation.padding,
  });

  if (spriteBounds.length === 0) {
    throw new Error(`No extractable sprites were found in atlasCollectionTileset source ${operation.sourceImage}.`);
  }

  const sourceBaseName = path.basename(sourceImagePath, path.extname(sourceImagePath));
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(sourceBaseName);
  const fileDigits = Math.max(3, String(spriteBounds.length).length);
  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;

  for (const [index, bounds] of spriteBounds.entries()) {
    const fileName = `${fileNamePrefix}-${String(index + 1).padStart(fileDigits, '0')}.png`;
    const destinationPath = path.join(destinationDirPath, fileName);
    const croppedSprite = cropAtlasSprite(image, bounds);

    await writePngImage(destinationPath, croppedSprite);

    maxTileWidth = Math.max(maxTileWidth, bounds.width);
    maxTileHeight = Math.max(maxTileHeight, bounds.height);
    tiles.push({
      id: index,
      image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
      imageheight: bounds.height,
      imagewidth: bounds.width,
    });
  }

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'atlasCollectionTileset',
    name: operation.name,
    sourceImage: normalizePath(path.relative(process.cwd(), sourceImagePath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    extractedSpriteCount: tiles.length,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
  };
}

export async function createGridCollectionTileset(operation) {
  const sourceImagePath = resolveFromCwd(operation.sourceImage);
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const cellWidth = Number(operation.cellWidth);
  const cellHeight = Number(operation.cellHeight);
  const margin = Number(operation.margin ?? 0);
  const spacing = Number(operation.spacing ?? 0);
  const image = await readPngImage(sourceImagePath);

  if (!Number.isInteger(cellWidth) || cellWidth <= 0) {
    throw new Error('gridCollectionTileset requires a positive integer cellWidth.');
  }

  if (!Number.isInteger(cellHeight) || cellHeight <= 0) {
    throw new Error('gridCollectionTileset requires a positive integer cellHeight.');
  }

  const layout = computeSheetLayout({
    imageWidth: image.width,
    imageHeight: image.height,
    tileWidth: cellWidth,
    tileHeight: cellHeight,
    margin,
    spacing,
  });

  const sourceBaseName = path.basename(sourceImagePath, path.extname(sourceImagePath));
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(sourceBaseName);
  const fileDigits = Math.max(3, String(layout.tilecount).length);
  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;

  for (let row = 0; row < layout.rows; row += 1) {
    for (let column = 0; column < layout.columns; column += 1) {
      const cellBounds = {
        x: margin + column * (cellWidth + spacing),
        y: margin + row * (cellHeight + spacing),
        width: cellWidth,
        height: cellHeight,
      };
      const cellImage = cropAtlasSprite(image, cellBounds);
      const opaqueBounds = findOpaqueBounds(cellImage, {
        alphaThreshold: operation.alphaThreshold,
        minOpaquePixels: operation.minOpaquePixels,
        padding: operation.padding,
      });

      if (!opaqueBounds) {
        continue;
      }

      const croppedSprite = cropAtlasSprite(cellImage, opaqueBounds);
      const fileName = `${fileNamePrefix}-${String(tiles.length + 1).padStart(fileDigits, '0')}.png`;
      const destinationPath = path.join(destinationDirPath, fileName);

      await writePngImage(destinationPath, croppedSprite);

      maxTileWidth = Math.max(maxTileWidth, opaqueBounds.width);
      maxTileHeight = Math.max(maxTileHeight, opaqueBounds.height);
      tiles.push({
        id: tiles.length,
        image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
        imageheight: opaqueBounds.height,
        imagewidth: opaqueBounds.width,
      });
    }
  }

  if (tiles.length === 0) {
    throw new Error(`No extractable sprites were found in gridCollectionTileset source ${operation.sourceImage}.`);
  }

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'gridCollectionTileset',
    name: operation.name,
    sourceImage: normalizePath(path.relative(process.cwd(), sourceImagePath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    extractedSpriteCount: tiles.length,
    cellWidth,
    cellHeight,
    columns: layout.columns,
    rows: layout.rows,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    warnings: layout.warnings,
  };
}

export async function createCellAtlasCollectionTileset(operation) {
  const sourceImagePath = resolveFromCwd(operation.sourceImage);
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const cellWidth = Number(operation.cellWidth);
  const cellHeight = Number(operation.cellHeight);
  const margin = Number(operation.margin ?? 0);
  const spacing = Number(operation.spacing ?? 0);
  const includeCellTiles = operation.includeCellTiles === true;
  const includeTrimmedCellTiles = operation.includeTrimmedCellTiles === true;
  const image = await readPngImage(sourceImagePath);

  if (!Number.isInteger(cellWidth) || cellWidth <= 0) {
    throw new Error('cellAtlasCollectionTileset requires a positive integer cellWidth.');
  }

  if (!Number.isInteger(cellHeight) || cellHeight <= 0) {
    throw new Error('cellAtlasCollectionTileset requires a positive integer cellHeight.');
  }

  const layout = computeSheetLayout({
    imageWidth: image.width,
    imageHeight: image.height,
    tileWidth: cellWidth,
    tileHeight: cellHeight,
    margin,
    spacing,
  });

  const sourceBaseName = path.basename(sourceImagePath, path.extname(sourceImagePath));
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(sourceBaseName);
  const maxPossibleTiles = layout.tilecount * (includeCellTiles ? 2 : 1);
  const fileDigits = Math.max(3, String(maxPossibleTiles).length);
  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;

  for (let row = 0; row < layout.rows; row += 1) {
    for (let column = 0; column < layout.columns; column += 1) {
      const cellBounds = {
        x: margin + column * (cellWidth + spacing),
        y: margin + row * (cellHeight + spacing),
        width: cellWidth,
        height: cellHeight,
      };
      const cellImage = cropAtlasSprite(image, cellBounds);
      const cellOpaqueBounds = findOpaqueBounds(cellImage, {
        alphaThreshold: operation.alphaThreshold,
        minOpaquePixels: operation.minOpaquePixels,
        padding: operation.padding,
      });

      if (!cellOpaqueBounds) {
        continue;
      }

      if (includeCellTiles) {
        const compositeBounds = includeTrimmedCellTiles
          ? cellOpaqueBounds
          : { x: 0, y: 0, width: cellWidth, height: cellHeight };
        const compositeImage = cropAtlasSprite(cellImage, compositeBounds);
        const compositeFileName = `${fileNamePrefix}-${String(tiles.length + 1).padStart(fileDigits, '0')}.png`;
        const compositeDestinationPath = path.join(destinationDirPath, compositeFileName);

        await writePngImage(compositeDestinationPath, compositeImage);

        maxTileWidth = Math.max(maxTileWidth, compositeBounds.width);
        maxTileHeight = Math.max(maxTileHeight, compositeBounds.height);
        tiles.push({
          id: tiles.length,
          image: normalizePath(path.relative(path.dirname(outputPath), compositeDestinationPath)),
          imageheight: compositeBounds.height,
          imagewidth: compositeBounds.width,
        });
      }

      const spriteBounds = extractGroupedSpriteBoundsFromAtlas(cellImage, {
        alphaThreshold: operation.alphaThreshold,
        minOpaquePixels: operation.minOpaquePixels,
        padding: operation.padding,
        mergeVerticalGap: operation.mergeVerticalGap,
        mergeHorizontalGap: operation.mergeHorizontalGap,
        mergeCenterDistance: operation.mergeCenterDistance,
        mergeMinXOverlap: operation.mergeMinXOverlap,
      });

      for (const bounds of spriteBounds) {
        const croppedSprite = cropAtlasSprite(cellImage, bounds);
        const fileName = `${fileNamePrefix}-${String(tiles.length + 1).padStart(fileDigits, '0')}.png`;
        const destinationPath = path.join(destinationDirPath, fileName);

        await writePngImage(destinationPath, croppedSprite);

        maxTileWidth = Math.max(maxTileWidth, bounds.width);
        maxTileHeight = Math.max(maxTileHeight, bounds.height);
        tiles.push({
          id: tiles.length,
          image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
          imageheight: bounds.height,
          imagewidth: bounds.width,
        });
      }
    }
  }

  if (tiles.length === 0) {
    throw new Error(`No extractable sprites were found in cellAtlasCollectionTileset source ${operation.sourceImage}.`);
  }

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'cellAtlasCollectionTileset',
    name: operation.name,
    sourceImage: normalizePath(path.relative(process.cwd(), sourceImagePath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    extractedSpriteCount: tiles.length,
    cellWidth,
    cellHeight,
    columns: layout.columns,
    rows: layout.rows,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    includeCellTiles,
    includeTrimmedCellTiles,
    warnings: layout.warnings,
  };
}

export async function createBandCollectionTileset(operation) {
  const sourceImagePath = resolveFromCwd(operation.sourceImage);
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const image = await readPngImage(sourceImagePath);
  const alphaThreshold = Number(operation.alphaThreshold ?? 1);
  const bands = findOccupiedBands(image, alphaThreshold);
  const rawSpriteBounds = bands.flatMap((band) => findOccupiedSpansInBand(image, band, operation));
  const mergedSpriteBounds = mergeBandSpriteBounds(rawSpriteBounds, operation);
  const spriteBounds = mergedSpriteBounds
    .map((bounds) => snapBoundsToGrid(bounds, image, operation))
    .sort(compareSpriteBoundsTopLeft);

  if (spriteBounds.length === 0) {
    throw new Error(`No extractable sprites were found in bandCollectionTileset source ${operation.sourceImage}.`);
  }

  const sourceBaseName = path.basename(sourceImagePath, path.extname(sourceImagePath));
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(sourceBaseName);
  const fileDigits = Math.max(3, String(spriteBounds.length).length);
  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;

  for (const [index, bounds] of spriteBounds.entries()) {
    const fileName = `${fileNamePrefix}-${String(index + 1).padStart(fileDigits, '0')}.png`;
    const destinationPath = path.join(destinationDirPath, fileName);
    const croppedSprite = cropAtlasSprite(image, bounds);

    await writePngImage(destinationPath, croppedSprite);

    maxTileWidth = Math.max(maxTileWidth, bounds.width);
    maxTileHeight = Math.max(maxTileHeight, bounds.height);
    tiles.push({
      id: index,
      image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
      imageheight: bounds.height,
      imagewidth: bounds.width,
    });
  }

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'bandCollectionTileset',
    name: operation.name,
    sourceImage: normalizePath(path.relative(process.cwd(), sourceImagePath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    extractedSpriteCount: tiles.length,
    bandCount: bands.length,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
  };
}

export async function createFrameAtlasCollectionTileset(operation) {
  const sourceImagePath = resolveFromCwd(operation.sourceImage);
  const destinationDirPath = resolveFromCwd(operation.destDir);
  const outputPath = resolveFromCwd(operation.output);
  const frameWidth = Number(operation.frameWidth);
  const frameHeight = Number(operation.frameHeight);
  const frameIndex = Number(operation.frameIndex ?? 0);
  const margin = Number(operation.margin ?? 0);
  const spacing = Number(operation.spacing ?? 0);
  const image = await readPngImage(sourceImagePath);

  if (!Number.isInteger(frameWidth) || frameWidth <= 0) {
    throw new Error('frameAtlasCollectionTileset requires a positive integer frameWidth.');
  }

  if (!Number.isInteger(frameHeight) || frameHeight <= 0) {
    throw new Error('frameAtlasCollectionTileset requires a positive integer frameHeight.');
  }

  const layout = computeSheetLayout({
    imageWidth: image.width,
    imageHeight: image.height,
    tileWidth: frameWidth,
    tileHeight: frameHeight,
    margin,
    spacing,
  });

  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= layout.tilecount) {
    throw new Error(
      `frameAtlasCollectionTileset frameIndex must be between 0 and ${layout.tilecount - 1}.`
    );
  }

  const frameColumn = frameIndex % layout.columns;
  const frameRow = Math.floor(frameIndex / layout.columns);
  const frameImage = cropAtlasSprite(image, {
    x: margin + frameColumn * (frameWidth + spacing),
    y: margin + frameRow * (frameHeight + spacing),
    width: frameWidth,
    height: frameHeight,
  });
  const spriteBounds = extractSpriteBoundsFromAtlas(frameImage, {
    alphaThreshold: operation.alphaThreshold,
    excludeBounds: operation.excludeBounds,
    minOpaquePixels: operation.minOpaquePixels,
    padding: operation.padding,
  });

  if (spriteBounds.length === 0) {
    throw new Error(
      `No extractable sprites were found in frameAtlasCollectionTileset source ${operation.sourceImage}.`
    );
  }

  const sourceBaseName = path.basename(sourceImagePath, path.extname(sourceImagePath));
  const fileNamePrefix = operation.fileNamePrefix || slugifyPathSegment(sourceBaseName);
  const fileDigits = Math.max(3, String(spriteBounds.length).length);
  const tiles = [];
  let maxTileWidth = 0;
  let maxTileHeight = 0;

  for (const [index, bounds] of spriteBounds.entries()) {
    const fileName = `${fileNamePrefix}-${String(index + 1).padStart(fileDigits, '0')}.png`;
    const destinationPath = path.join(destinationDirPath, fileName);
    const croppedSprite = cropAtlasSprite(frameImage, bounds);

    await writePngImage(destinationPath, croppedSprite);

    maxTileWidth = Math.max(maxTileWidth, bounds.width);
    maxTileHeight = Math.max(maxTileHeight, bounds.height);
    tiles.push({
      id: index,
      image: normalizePath(path.relative(path.dirname(outputPath), destinationPath)),
      imageheight: bounds.height,
      imagewidth: bounds.width,
    });
  }

  const tileset = buildCollectionTileset({
    name: operation.name,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    tiles,
  });

  await writeJson(outputPath, tileset);

  return {
    type: 'frameAtlasCollectionTileset',
    name: operation.name,
    sourceImage: normalizePath(path.relative(process.cwd(), sourceImagePath)),
    destDir: normalizePath(path.relative(process.cwd(), destinationDirPath)),
    output: normalizePath(path.relative(process.cwd(), outputPath)),
    extractedSpriteCount: tiles.length,
    frameWidth,
    frameHeight,
    frameIndex,
    frameColumns: layout.columns,
    frameRows: layout.rows,
    tileWidth: maxTileWidth,
    tileHeight: maxTileHeight,
    warnings: layout.warnings,
  };
}