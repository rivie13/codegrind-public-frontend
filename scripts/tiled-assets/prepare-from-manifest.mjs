import path from 'node:path';
import {
  addTilesetToMap,
  createAnimatedVariantCollectionTilesets,
  createAnimatedStripCollectionTileset,
  createAnimatedStripTilesets,
  createAtlasCollectionTileset,
  createBandCollectionTileset,
  createCellAtlasCollectionTileset,
  createCollectionTileset,
  createDirectorySheetTilesets,
  createFrameAtlasCollectionTileset,
  createGridCollectionTileset,
  createMultiSourceCollectionTileset,
  createMultiSourceSingleTileTilesets,
  createPackedSheetTileset,
  createSheetTileset,
  getRequiredString,
  parseCliArgs,
  readJson,
  removeTilesetFromMap,
} from './lib/assetPrep.mjs';

const args = parseCliArgs(process.argv.slice(2));
const manifestPath = path.resolve(process.cwd(), getRequiredString(args, 'manifest'));
const manifest = await readJson(manifestPath);

if (!Array.isArray(manifest.operations) || manifest.operations.length === 0) {
  throw new Error('Manifest must include a non-empty operations array.');
}

const results = [];

for (const operation of manifest.operations) {
  switch (operation.type) {
    case 'sheetTileset':
      results.push(await createSheetTileset(operation));
      break;
    case 'directorySheetTilesets':
      results.push(await createDirectorySheetTilesets(operation));
      break;
    case 'packedSheetTileset':
      results.push(await createPackedSheetTileset(operation));
      break;
    case 'collectionTileset':
      results.push(await createCollectionTileset(operation));
      break;
    case 'multiSourceCollectionTileset':
      results.push(await createMultiSourceCollectionTileset(operation));
      break;
    case 'multiSourceSingleTileTilesets':
      results.push(await createMultiSourceSingleTileTilesets(operation));
      break;
    case 'atlasCollectionTileset':
      results.push(await createAtlasCollectionTileset(operation));
      break;
    case 'gridCollectionTileset':
      results.push(await createGridCollectionTileset(operation));
      break;
    case 'cellAtlasCollectionTileset':
      results.push(await createCellAtlasCollectionTileset(operation));
      break;
    case 'bandCollectionTileset':
      results.push(await createBandCollectionTileset(operation));
      break;
    case 'frameAtlasCollectionTileset':
      results.push(await createFrameAtlasCollectionTileset(operation));
      break;
    case 'animatedStripTilesets':
      results.push(await createAnimatedStripTilesets(operation));
      break;
    case 'animatedStripCollectionTileset':
      results.push(await createAnimatedStripCollectionTileset(operation));
      break;
    case 'animatedVariantCollectionTilesets':
      results.push(await createAnimatedVariantCollectionTilesets(operation));
      break;
    case 'attachTilesetToMap':
      results.push(await addTilesetToMap(operation));
      break;
    case 'detachTilesetFromMap':
      results.push(await removeTilesetFromMap(operation));
      break;
    default:
      throw new Error(`Unsupported manifest operation type: ${operation.type}`);
  }
}

process.stdout.write(
  `${JSON.stringify(
    {
      manifest: path.relative(process.cwd(), manifestPath).split(path.sep).join('/'),
      operationCount: results.length,
      results,
    },
    null,
    2
  )}\n`
);