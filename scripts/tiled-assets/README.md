# Tiled Asset Prep Scripts

These scripts exist so new art drops can be normalized for Tiled without ad-hoc terminal blobs.

Run everything from `codegrind-frontend/`.

## Active asset root

- Source-of-truth Tiled art now lives under the sibling asset repo at `../CodeGrind_Assets/Art_Assets/tiled`.
- The scripts auto-detect that external Tiled project root, or you can override it with `TILED_PROJECT_DIR`.
- Legacy manifest paths that still start with `public/city-v2/tiled/...` are treated as compatibility aliases for the active Tiled project root.
- Runtime delivery paths under `/images`, `/audio`, or blob storage are not the same thing as the authoring/source-art root.

## Inspect a PNG

```bash
npm run tiled:asset:inspect -- --image public/city-v2/tiled/raw/district-01/interiors/Interiors_free_16x16.png --tileWidth 16 --tileHeight 16
```

## Create a sheet tileset

```bash
npm run tiled:asset:sheet -- --sourceImage public/city-v2/tiled/source/MySheet.png --destImage public/city-v2/tiled/raw/district-01/props/MySheet.png --output public/city-v2/tiled/tilesets/district-01/d01-my-sheet.tsj --name d01-my-sheet --tileWidth 32 --tileHeight 32
```

## Create a collection tileset from standalone PNGs

```bash
npm run tiled:asset:collection -- --sourceDir public/city-v2/tiled/source --destDir public/city-v2/tiled/raw/district-01/props/my-collection --output public/city-v2/tiled/tilesets/district-01/d01-my-collection.tsj --name d01-my-collection --match "^MyAsset.*\\.png$"
```

Animated collections are also supported through manifest-driven `animations` metadata. This is useful for frame-by-frame packs where each PNG is one frame of a looping sign or prop.

## Attach a tileset to a map

```bash
npm run tiled:map:attach-tileset -- --mapPath public/city-v2/tiled/maps/district-01/apartment-seed.tmj --tilesetPath public/city-v2/tiled/tilesets/district-01/d01-my-sheet.tsj
```

## Run a manifest

```bash
npm run tiled:asset:prep -- --manifest scripts/tiled-assets/manifests/district-01-apartment-supplemental-assets.json
```

Current convenience manifest:

```bash
npm run tiled:asset:prep:d01-apartment
```

Animated Sign 1 OPEN convenience manifest:

```bash
npm run tiled:asset:prep:d01-sign-1-open
```

Animated sign pack convenience manifest (all sign variants):

```bash
npm run tiled:asset:prep:d01-sign-pack
```

Pixel Edge City exteriors convenience manifest (15 spritesheet tilesets):

```bash
npm run tiled:asset:prep:pixel-edge-city-exteriors
```

Pixel Edge City collections convenience manifest (Objects, Decorations, Pre-made Buildings):

```bash
npm run tiled:asset:prep:pixel-edge-city-collections
```

City-wide asset library convenience manifest (device shells, modern interiors extras, loose interior props, characters, vehicles, backgrounds):

```bash
npm run tiled:asset:prep:city-v2-library
```

District 01 modern interiors 16x16 refresh (free-sheet defaults, one TSJ per paid 16x16 spritesheet, plus Tiled-selectable animated previews for the animated-object strips):

```bash
npm run tiled:asset:prep:d01-modern-interiors-16x16
```

## Rules of the road

- Do not assume all sheets in a pack family share the same chop rules. `tileWidth`, `tileHeight`, `margin`, and `spacing` are pack-specific.
- Inspect the exact source PNG first with `npm run tiled:asset:inspect ...` before changing any manifest or `.tsj` entry.
- A remainder warning from `tiled:asset:inspect` is not enough to justify recutting a sheet. Use Tiled selection behavior and live map rendering as the deciding check.
- Generated sheet `.tsj` files should follow the manifest under `scripts/tiled-assets/manifests/**`. Update the manifest first, then rerun the matching `tiled:asset:prep` command.
- If a scene stack is wrong, decode the exact map cell to `layer + gid + tileset` ownership before changing sheet geometry. Corners can mix interiors, room-builder, icons, and prop sheets in one visible stack.

## Current District 01 apartment pack rules

- `d01-trash-props`: `32x32`, `margin 0`, `spacing 0`
- `d01-room-builder`: separate authored `16x16` tileset; do not fold its rules into the supplemental prop sheets
- `d01-16_x_16_cyberpunk_icons` and `d01-cyberpunk-icons`: separate icon packs; do not use their dimensions to recut the trash or machine sheets
- `d01-device-monitors-terminals`: slice the source sheet with `gridCollectionTileset` using `16x16` cells for apartment monitor/terminal browsing

## Supported inputs right now

- PNG sprite sheets
- PNG collections of standalone prop images
- PNG collections of standalone animation frames when the manifest provides `animations`
- Batch-generated sheet tilesets when a manifest uses `directorySheetTilesets`
- Batch-generated animated collection tilesets when a manifest uses `animatedVariantCollectionTilesets`
- Batch-generated animated strip collections when a manifest uses `animatedStripCollectionTileset`

If a new pack needs different rules, add a new manifest instead of retyping one-off shell scripts.
