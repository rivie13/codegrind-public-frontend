import {
  createCollectionTileset,
  getOptionalString,
  getRequiredString,
  parseCliArgs,
} from './lib/assetPrep.mjs';

const args = parseCliArgs(process.argv.slice(2));

const result = await createCollectionTileset({
  sourceDir: getRequiredString(args, 'sourceDir'),
  destDir: getOptionalString(args, 'destDir'),
  output: getRequiredString(args, 'output'),
  name: getRequiredString(args, 'name'),
  match: getOptionalString(args, 'match'),
  exclude: getOptionalString(args, 'exclude'),
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);