import {
  addTilesetToMap,
  getRequiredString,
  parseCliArgs,
} from './lib/assetPrep.mjs';

const args = parseCliArgs(process.argv.slice(2));

const result = await addTilesetToMap({
  mapPath: getRequiredString(args, 'mapPath'),
  tilesetPath: getRequiredString(args, 'tilesetPath'),
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);