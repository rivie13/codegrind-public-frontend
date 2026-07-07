import {
  computeSheetLayout,
  getOptionalNumber,
  getRequiredString,
  parseCliArgs,
  readPngDimensions,
  resolveFromCwd,
} from './lib/assetPrep.mjs';

const args = parseCliArgs(process.argv.slice(2));
const imagePath = getRequiredString(args, 'image');
const tileWidth = getOptionalNumber(args, 'tileWidth');
const tileHeight = getOptionalNumber(args, 'tileHeight');
const absoluteImagePath = resolveFromCwd(imagePath);
const { width, height } = await readPngDimensions(absoluteImagePath);

const result = {
  image: imagePath,
  width,
  height,
};

if (tileWidth !== undefined || tileHeight !== undefined) {
  if (tileWidth === undefined || tileHeight === undefined) {
    throw new Error('Provide both --tileWidth and --tileHeight together.');
  }

  const layout = computeSheetLayout({
    imageWidth: width,
    imageHeight: height,
    tileWidth,
    tileHeight,
    margin: getOptionalNumber(args, 'margin', 0),
    spacing: getOptionalNumber(args, 'spacing', 0),
  });

  result.grid = {
    tileWidth,
    tileHeight,
    columns: layout.columns,
    rows: layout.rows,
    tilecount: layout.tilecount,
    warnings: layout.warnings,
  };
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);