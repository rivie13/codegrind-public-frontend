import {
  createSheetTileset,
  getOptionalNumber,
  getOptionalString,
  getRequiredNumber,
  getRequiredString,
  parseCliArgs,
} from './lib/assetPrep.mjs';

const args = parseCliArgs(process.argv.slice(2));

const result = await createSheetTileset({
  sourceImage: getRequiredString(args, 'sourceImage'),
  destImage: getOptionalString(args, 'destImage'),
  output: getRequiredString(args, 'output'),
  name: getRequiredString(args, 'name'),
  tileWidth: getRequiredNumber(args, 'tileWidth'),
  tileHeight: getRequiredNumber(args, 'tileHeight'),
  margin: getOptionalNumber(args, 'margin', 0),
  spacing: getOptionalNumber(args, 'spacing', 0),
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);