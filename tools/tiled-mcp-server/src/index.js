import path from 'node:path';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

function resolveProjectRoot() {
  const explicitRoot = process.env.TILED_PROJECT_DIR || process.env.CODEGRIND_TILED_PROJECT_DIR;
  const candidates = [
    explicitRoot,
    path.resolve(process.cwd(), '../../CodeGrind_Assets/Art_Assets/tiled'),
    path.resolve(process.cwd(), '../CodeGrind_Assets/Art_Assets/tiled'),
    path.resolve(process.cwd(), '../../public/city-v2/tiled'),
  ].filter(Boolean);

  const existingRoot = candidates.find((candidate) => existsSync(candidate));

  return path.resolve(existingRoot || candidates[0] || process.cwd());
}

const projectRoot = resolveProjectRoot();

const propertyValueSchema = z.union([z.string(), z.number(), z.boolean()]);

function textResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

function assertWithinProject(targetPath) {
  const resolvedPath = path.resolve(projectRoot, targetPath);
  const relativePath = path.relative(projectRoot, resolvedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Path must stay inside TILED_PROJECT_DIR: ${targetPath}`);
  }

  return resolvedPath;
}

async function readJson(targetPath) {
  const absolutePath = assertWithinProject(targetPath);
  const source = await readFile(absolutePath, 'utf8');

  return {
    absolutePath,
    relativePath: normalizePath(path.relative(projectRoot, absolutePath)),
    data: JSON.parse(source),
  };
}

async function writeJson(absolutePath, data) {
  await writeFile(absolutePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizePath(targetPath) {
  return targetPath.split(path.sep).join('/');
}

function getLayer(map, layerName) {
  const layer = map.layers?.find((candidate) => candidate.name === layerName);

  if (!layer) {
    throw new Error(`Layer not found: ${layerName}`);
  }

  return layer;
}

function ensureTileLayer(map, layerName) {
  if (map.infinite) {
    throw new Error('Infinite maps are not supported by this local server.');
  }

  const layer = getLayer(map, layerName);

  if (layer.type !== 'tilelayer' || !Array.isArray(layer.data)) {
    throw new Error(`Layer is not a finite tile layer: ${layerName}`);
  }

  return layer;
}

function ensureObjectLayer(map, layerName) {
  const layer = getLayer(map, layerName);

  if (layer.type !== 'objectgroup' || !Array.isArray(layer.objects)) {
    throw new Error(`Layer is not an object layer: ${layerName}`);
  }

  return layer;
}

function getMapDimensions(map, layer) {
  return {
    width: layer.width ?? map.width,
    height: layer.height ?? map.height,
  };
}

function assertTileCoordinate(map, layer, x, y) {
  const { width, height } = getMapDimensions(map, layer);

  if (x < 0 || y < 0 || x >= width || y >= height) {
    throw new Error(`Tile coordinate out of bounds: (${x}, ${y})`);
  }
}

function getTileIndex(map, layer, x, y) {
  const { width } = getMapDimensions(map, layer);
  return y * width + x;
}

function toPropertyArray(properties = {}) {
  return Object.entries(properties).map(([name, value]) => ({
    name,
    type: inferPropertyType(value),
    value,
  }));
}

function inferPropertyType(value) {
  if (typeof value === 'boolean') {
    return 'bool';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'float';
  }

  return 'string';
}

function propertyArrayToObject(properties = []) {
  return Object.fromEntries(
    properties.map((entry) => [entry.name, entry.value])
  );
}

function mergeProperties(existingProperties = [], updates = {}) {
  return toPropertyArray({
    ...propertyArrayToObject(existingProperties),
    ...updates,
  });
}

function summarizeMap(relativePath, map) {
  const layers = map.layers ?? [];
  const tilesets = (map.tilesets ?? []).map((tileset) => ({
    firstgid: tileset.firstgid,
    source: tileset.source ?? null,
    name: tileset.name ?? null,
  }));
  const objectLayers = layers.filter((layer) => layer.type === 'objectgroup');

  return {
    mapPath: relativePath,
    orientation: map.orientation,
    tileSize: {
      width: map.tilewidth,
      height: map.tileheight,
    },
    dimensions: {
      width: map.width,
      height: map.height,
    },
    layerCount: layers.length,
    tileLayerCount: layers.filter((layer) => layer.type === 'tilelayer').length,
    objectLayerCount: objectLayers.length,
    objectCounts: objectLayers.map((layer) => ({
      layerName: layer.name,
      count: layer.objects.length,
    })),
    tilesets,
  };
}

async function listMaps(startPath = '.') {
  const absoluteRoot = assertWithinProject(startPath);
  const results = [];
  const queue = [absoluteRoot];

  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.endsWith('.tmj') || entry.name.endsWith('.tmx')) {
        results.push(normalizePath(path.relative(projectRoot, fullPath)));
      }
    }
  }

  results.sort();
  return results;
}

async function validateMap(relativeMapPath) {
  const { absolutePath, relativePath, data: map } = await readJson(relativeMapPath);
  const warnings = [];
  const errors = [];

  if (!Array.isArray(map.layers) || map.layers.length === 0) {
    errors.push('Map has no layers.');
  }

  if (!Array.isArray(map.tilesets) || map.tilesets.length === 0) {
    warnings.push('Map has no tilesets.');
  }

  for (const layer of map.layers ?? []) {
    if (layer.type === 'tilelayer' && !map.infinite && Array.isArray(layer.data)) {
      const { width, height } = getMapDimensions(map, layer);
      const expectedSize = width * height;

      if (layer.data.length !== expectedSize) {
        errors.push(
          `Tile layer ${layer.name} has ${layer.data.length} entries, expected ${expectedSize}.`
        );
      }
    }
  }

  for (const tileset of map.tilesets ?? []) {
    if (!tileset.source) {
      continue;
    }

    const tilesetPath = path.resolve(path.dirname(absolutePath), tileset.source);

    try {
      const fileStats = await stat(tilesetPath);

      if (!fileStats.isFile()) {
        errors.push(`Tileset source is not a file: ${tileset.source}`);
      }
    } catch {
      errors.push(`Missing tileset source: ${tileset.source}`);
    }
  }

  return {
    mapPath: relativePath,
    status: errors.length === 0 ? 'ok' : 'error',
    errors,
    warnings,
  };
}

const server = new McpServer({
  name: 'codegrind-tiled-mcp-server',
  version: '0.1.0',
});

server.registerTool(
  'tiled_list_maps',
  {
    title: 'List Tiled maps',
    description: 'Lists .tmj and .tmx maps under the configured Tiled project directory.',
    inputSchema: {
      subdirectory: z.string().optional(),
    },
  },
  async ({ subdirectory }) => {
    const maps = await listMaps(subdirectory ?? '.');

    return textResult({
      projectRoot: normalizePath(projectRoot),
      maps,
    });
  }
);

server.registerTool(
  'tiled_get_map',
  {
    title: 'Get Tiled map',
    description: 'Reads and returns a Tiled JSON map file.',
    inputSchema: {
      mapPath: z.string(),
    },
  },
  async ({ mapPath }) => {
    const { relativePath, data } = await readJson(mapPath);

    return textResult({
      mapPath: relativePath,
      map: data,
    });
  }
);

server.registerTool(
  'tiled_get_map_summary',
  {
    title: 'Get Tiled map summary',
    description: 'Returns a concise summary of a Tiled map.',
    inputSchema: {
      mapPath: z.string(),
    },
  },
  async ({ mapPath }) => {
    const { relativePath, data } = await readJson(mapPath);

    return textResult(summarizeMap(relativePath, data));
  }
);

server.registerTool(
  'tiled_get_layer',
  {
    title: 'Get Tiled layer',
    description: 'Returns a specific map layer by name.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
    },
  },
  async ({ mapPath, layerName }) => {
    const { relativePath, data } = await readJson(mapPath);
    const layer = getLayer(data, layerName);

    return textResult({
      mapPath: relativePath,
      layer,
    });
  }
);

server.registerTool(
  'tiled_place_tiles',
  {
    title: 'Place tiles',
    description: 'Places one or more tile IDs into a finite tile layer.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      placements: z
        .array(
          z.object({
            x: z.number().int().nonnegative(),
            y: z.number().int().nonnegative(),
            tileId: z.number().int().nonnegative(),
          })
        )
        .min(1),
    },
  },
  async ({ mapPath, layerName, placements }) => {
    const { absolutePath, relativePath, data: map } = await readJson(mapPath);
    const layer = ensureTileLayer(map, layerName);

    for (const placement of placements) {
      assertTileCoordinate(map, layer, placement.x, placement.y);
      layer.data[getTileIndex(map, layer, placement.x, placement.y)] = placement.tileId;
    }

    await writeJson(absolutePath, map);

    return textResult({
      mapPath: relativePath,
      layerName,
      placementsApplied: placements.length,
    });
  }
);

server.registerTool(
  'tiled_fill_region',
  {
    title: 'Fill region',
    description: 'Fills a rectangular region on a finite tile layer with one tile ID.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      tileId: z.number().int().nonnegative(),
    },
  },
  async ({ mapPath, layerName, x, y, width, height, tileId }) => {
    const { absolutePath, relativePath, data: map } = await readJson(mapPath);
    const layer = ensureTileLayer(map, layerName);

    for (let tileY = y; tileY < y + height; tileY += 1) {
      for (let tileX = x; tileX < x + width; tileX += 1) {
        assertTileCoordinate(map, layer, tileX, tileY);
        layer.data[getTileIndex(map, layer, tileX, tileY)] = tileId;
      }
    }

    await writeJson(absolutePath, map);

    return textResult({
      mapPath: relativePath,
      layerName,
      region: { x, y, width, height },
      tileId,
    });
  }
);

server.registerTool(
  'tiled_clear_region',
  {
    title: 'Clear region',
    description: 'Clears a rectangular region on a finite tile layer by writing tile ID 0.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    },
  },
  async ({ mapPath, layerName, x, y, width, height }) => {
    const { absolutePath, relativePath, data: map } = await readJson(mapPath);
    const layer = ensureTileLayer(map, layerName);

    for (let tileY = y; tileY < y + height; tileY += 1) {
      for (let tileX = x; tileX < x + width; tileX += 1) {
        assertTileCoordinate(map, layer, tileX, tileY);
        layer.data[getTileIndex(map, layer, tileX, tileY)] = 0;
      }
    }

    await writeJson(absolutePath, map);

    return textResult({
      mapPath: relativePath,
      layerName,
      region: { x, y, width, height },
      tileId: 0,
    });
  }
);

server.registerTool(
  'tiled_get_objects',
  {
    title: 'Get objects',
    description: 'Lists objects from an object layer, with optional name or class filtering.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      name: z.string().optional(),
      className: z.string().optional(),
    },
  },
  async ({ mapPath, layerName, name, className }) => {
    const { relativePath, data: map } = await readJson(mapPath);
    const layer = ensureObjectLayer(map, layerName);
    const objects = layer.objects.filter((object) => {
      if (name && object.name !== name) {
        return false;
      }

      if (className && object.class !== className) {
        return false;
      }

      return true;
    });

    return textResult({
      mapPath: relativePath,
      layerName,
      count: objects.length,
      objects,
    });
  }
);

server.registerTool(
  'tiled_create_object',
  {
    title: 'Create object',
    description: 'Creates a new object inside an object layer.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      object: z.object({
        name: z.string().optional(),
        className: z.string().optional(),
        x: z.number(),
        y: z.number(),
        width: z.number().nonnegative().optional(),
        height: z.number().nonnegative().optional(),
        rotation: z.number().optional(),
        point: z.boolean().optional(),
        ellipse: z.boolean().optional(),
        visible: z.boolean().optional(),
        properties: z.record(propertyValueSchema).optional(),
      }),
    },
  },
  async ({ mapPath, layerName, object }) => {
    const { absolutePath, relativePath, data: map } = await readJson(mapPath);
    const layer = ensureObjectLayer(map, layerName);
    const objectId = map.nextobjectid ?? 1;
    const tiledObject = {
      id: objectId,
      name: object.name ?? '',
      class: object.className ?? '',
      x: object.x,
      y: object.y,
      width: object.width ?? 0,
      height: object.height ?? 0,
      rotation: object.rotation ?? 0,
      visible: object.visible ?? true,
      ...(object.point ? { point: true } : {}),
      ...(object.ellipse ? { ellipse: true } : {}),
      ...(object.properties ? { properties: toPropertyArray(object.properties) } : {}),
    };

    layer.objects.push(tiledObject);
    map.nextobjectid = objectId + 1;
    await writeJson(absolutePath, map);

    return textResult({
      mapPath: relativePath,
      layerName,
      object: tiledObject,
    });
  }
);

server.registerTool(
  'tiled_update_object',
  {
    title: 'Update object',
    description: 'Updates an existing object in an object layer.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      objectId: z.number().int().positive(),
      updates: z.object({
        name: z.string().optional(),
        className: z.string().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().nonnegative().optional(),
        height: z.number().nonnegative().optional(),
        rotation: z.number().optional(),
        visible: z.boolean().optional(),
        point: z.boolean().optional(),
        ellipse: z.boolean().optional(),
        properties: z.record(propertyValueSchema).optional(),
      }),
    },
  },
  async ({ mapPath, layerName, objectId, updates }) => {
    const { absolutePath, relativePath, data: map } = await readJson(mapPath);
    const layer = ensureObjectLayer(map, layerName);
    const targetObject = layer.objects.find((candidate) => candidate.id === objectId);

    if (!targetObject) {
      throw new Error(`Object not found: ${objectId}`);
    }

    if (updates.name !== undefined) {
      targetObject.name = updates.name;
    }

    if (updates.className !== undefined) {
      targetObject.class = updates.className;
    }

    if (updates.x !== undefined) {
      targetObject.x = updates.x;
    }

    if (updates.y !== undefined) {
      targetObject.y = updates.y;
    }

    if (updates.width !== undefined) {
      targetObject.width = updates.width;
    }

    if (updates.height !== undefined) {
      targetObject.height = updates.height;
    }

    if (updates.rotation !== undefined) {
      targetObject.rotation = updates.rotation;
    }

    if (updates.visible !== undefined) {
      targetObject.visible = updates.visible;
    }

    if (updates.point !== undefined) {
      if (updates.point) {
        targetObject.point = true;
      } else {
        delete targetObject.point;
      }
    }

    if (updates.ellipse !== undefined) {
      if (updates.ellipse) {
        targetObject.ellipse = true;
      } else {
        delete targetObject.ellipse;
      }
    }

    if (updates.properties) {
      targetObject.properties = mergeProperties(targetObject.properties, updates.properties);
    }

    await writeJson(absolutePath, map);

    return textResult({
      mapPath: relativePath,
      layerName,
      object: targetObject,
    });
  }
);

server.registerTool(
  'tiled_delete_object',
  {
    title: 'Delete object',
    description: 'Deletes an object from an object layer.',
    inputSchema: {
      mapPath: z.string(),
      layerName: z.string(),
      objectId: z.number().int().positive(),
    },
  },
  async ({ mapPath, layerName, objectId }) => {
    const { absolutePath, relativePath, data: map } = await readJson(mapPath);
    const layer = ensureObjectLayer(map, layerName);
    const originalLength = layer.objects.length;
    layer.objects = layer.objects.filter((candidate) => candidate.id !== objectId);

    if (layer.objects.length === originalLength) {
      throw new Error(`Object not found: ${objectId}`);
    }

    await writeJson(absolutePath, map);

    return textResult({
      mapPath: relativePath,
      layerName,
      deletedObjectId: objectId,
    });
  }
);

server.registerTool(
  'tiled_validate_map',
  {
    title: 'Validate map',
    description: 'Runs basic validation against a Tiled JSON map and its tileset references.',
    inputSchema: {
      mapPath: z.string(),
    },
  },
  async ({ mapPath }) => {
    return textResult(await validateMap(mapPath));
  }
);

const transport = new StdioServerTransport();

await server.connect(transport);