import { getCollisionRectangles } from '../apartmentPreviewScene.utils';
import {
  SCENE_ACTOR_NAV_DEFAULT_MAX_NEIGHBORS,
  normalizeActorTarget,
  createSceneActorNavPairLookup,
  sceneActorNavSegmentHitsCollision,
  addSceneActorNavNeighbor,
} from './sceneActorShared';
export const attachSceneActorNavGraphMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    resolveSceneActorNavCollisionRectangles() {
      if (
        Array.isArray(this.resolvedCollisionRectangles) &&
        this.resolvedCollisionRectangles.length > 0
      ) {
        return this.resolvedCollisionRectangles;
      }

      if (!Array.isArray(this.rawCollisionObjects) || this.rawCollisionObjects.length === 0) {
        return [];
      }

      return this.rawCollisionObjects.flatMap((collisionObject) =>
        getCollisionRectangles(collisionObject)
      );
    },

    buildSceneActorNavGraph(navGraphConfig = {}) {
      const layerName = String(navGraphConfig?.layerName || '').trim();

      if (!layerName) {
        return null;
      }

      if (!this.sceneActorNavGraphs) {
        this.sceneActorNavGraphs = new Map();
      }

      const cacheKey = JSON.stringify({
        crosswalkPairs: navGraphConfig.crosswalkPairs || [],
        layerName,
        maxNeighbors: Number(navGraphConfig.maxNeighbors ?? SCENE_ACTOR_NAV_DEFAULT_MAX_NEIGHBORS),
      });

      if (this.sceneActorNavGraphs.has(cacheKey)) {
        return this.sceneActorNavGraphs.get(cacheKey);
      }

      const objectLayer = this.getMapObjectLayer?.(layerName);
      const navObjects = (objectLayer?.objects || []).filter(
        (objectValue) =>
          typeof objectValue?.name === 'string' &&
          objectValue.name &&
          (objectValue.point === true || (!objectValue.width && !objectValue.height))
      );

      if (navObjects.length === 0) {
        return null;
      }

      const pairLookup = createSceneActorNavPairLookup(navGraphConfig.crosswalkPairs || []);
      const nodes = navObjects.map((objectValue) => {
        const pairInfo = pairLookup.nodePairs.get(objectValue.name) || null;
        const tags = new Set(
          Array.isArray(navGraphConfig?.nodeTags?.[objectValue.name])
            ? navGraphConfig.nodeTags[objectValue.name]
            : []
        );

        return {
          crosswalkPairId: pairInfo?.pairId || null,
          isCrosswalk: Boolean(pairInfo),
          name: objectValue.name,
          object: objectValue,
          pairNodeName: pairInfo?.pairNodeName || null,
          tags,
          waitRangeMs:
            navGraphConfig?.nodeWaitRangesMs?.[objectValue.name] ||
            navGraphConfig?.defaultWaitRangeMs ||
            null,
          x: Number(objectValue.x ?? 0),
          y: Number(objectValue.y ?? 0),
        };
      });
      const nodesByName = new Map(nodes.map((node) => [node.name, node]));
      const collisionRectangles = this.resolveSceneActorNavCollisionRectangles();
      const adjacency = new Map(nodes.map((node) => [node.name, []]));
      const maxNeighbors = Math.max(
        Number(navGraphConfig.maxNeighbors ?? SCENE_ACTOR_NAV_DEFAULT_MAX_NEIGHBORS),
        1
      );

      nodes.forEach((node) => {
        const candidateNeighbors = nodes
          .filter((otherNode) => otherNode.name !== node.name)
          .map((otherNode) => {
            const distance = Math.hypot(otherNode.x - node.x, otherNode.y - node.y);
            const isCrosswalkTraversal = pairLookup.traversalKeys.has(
              `${node.name}::${otherNode.name}`
            );
            const isClearSegment =
              isCrosswalkTraversal ||
              !sceneActorNavSegmentHitsCollision(
                { x: node.x, y: node.y },
                { x: otherNode.x, y: otherNode.y },
                collisionRectangles
              );

            return {
              distance,
              isClearSegment,
              isCrosswalkTraversal,
              nodeName: otherNode.name,
            };
          })
          .filter((candidate) => candidate.isClearSegment)
          .sort((left, right) => left.distance - right.distance);
        const selectedNeighbors = [];

        if (node.pairNodeName) {
          const pairedNeighbor = candidateNeighbors.find(
            (candidate) => candidate.nodeName === node.pairNodeName
          );

          if (pairedNeighbor) {
            selectedNeighbors.push(pairedNeighbor);
          }
        }

        for (const candidateNeighbor of candidateNeighbors) {
          if (
            selectedNeighbors.length >= maxNeighbors ||
            selectedNeighbors.some(
              (selectedNeighbor) => selectedNeighbor.nodeName === candidateNeighbor.nodeName
            )
          ) {
            continue;
          }

          selectedNeighbors.push(candidateNeighbor);
        }

        selectedNeighbors.forEach((neighbor) => {
          addSceneActorNavNeighbor(
            adjacency,
            node.name,
            neighbor.nodeName,
            neighbor.distance,
            neighbor.isCrosswalkTraversal
          );
          addSceneActorNavNeighbor(
            adjacency,
            neighbor.nodeName,
            node.name,
            neighbor.distance,
            neighbor.isCrosswalkTraversal
          );
        });
      });

      const graph = {
        adjacency,
        crosswalkPairCount: new Set(nodes.map((node) => node.crosswalkPairId).filter(Boolean)).size,
        layerName,
        nodes,
        nodesByName,
        traversalKeys: pairLookup.traversalKeys,
      };

      this.sceneActorNavGraphs.set(cacheKey, graph);

      return graph;
    },

    resolveSceneActorNavCurrentNodeName(entry, graph) {
      const currentNodeName = entry.navState?.currentNodeName;

      if (currentNodeName && graph.nodesByName.has(currentNodeName)) {
        return currentNodeName;
      }

      const spawnTarget = normalizeActorTarget(entry.actorConfig?.spawn);

      if (
        spawnTarget?.layerName === graph.layerName &&
        typeof spawnTarget?.objectName === 'string' &&
        graph.nodesByName.has(spawnTarget.objectName)
      ) {
        return spawnTarget.objectName;
      }

      const spriteX = Number(entry.sprite?.x);
      const spriteY = Number(entry.sprite?.y);

      if (!Number.isFinite(spriteX) || !Number.isFinite(spriteY)) {
        return null;
      }

      return this.resolveSceneActorNearestNavNodeName(graph, {
        x: spriteX,
        y: spriteY,
      });
    },

    resolveSceneActorNearestNavNodeName(graph, point) {
      if (!graph?.nodes?.length) {
        return null;
      }

      const pointX = Number(point?.x);
      const pointY = Number(point?.y);

      if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
        return null;
      }

      return (
        graph.nodes.reduce((closestNode, node) => {
          const distance = Math.hypot(node.x - pointX, node.y - pointY);

          if (!closestNode || distance < closestNode.distance) {
            return {
              distance,
              name: node.name,
            };
          }

          return closestNode;
        }, null)?.name || null
      );
    },

    findSceneActorNavPath(graph, startNodeName, destinationNodeName, options = {}) {
      if (!graph?.nodesByName?.has(startNodeName) || !graph.nodesByName.has(destinationNodeName)) {
        return null;
      }

      const allowCrosswalkTraversal = options.allowCrosswalkTraversal !== false;
      const distances = new Map([[startNodeName, 0]]);
      const previousNodes = new Map();
      const pendingNodes = [{ distance: 0, nodeName: startNodeName }];
      const visitedNodes = new Set();

      while (pendingNodes.length > 0) {
        pendingNodes.sort((left, right) => left.distance - right.distance);
        const nextNode = pendingNodes.shift();

        if (!nextNode || visitedNodes.has(nextNode.nodeName)) {
          continue;
        }

        if (nextNode.nodeName === destinationNodeName) {
          break;
        }

        visitedNodes.add(nextNode.nodeName);

        for (const neighbor of graph.adjacency.get(nextNode.nodeName) || []) {
          if (!allowCrosswalkTraversal && neighbor.isCrosswalkTraversal) {
            continue;
          }

          const distance = nextNode.distance + neighbor.distance;

          if (distance >= (distances.get(neighbor.nodeName) ?? Number.POSITIVE_INFINITY)) {
            continue;
          }

          distances.set(neighbor.nodeName, distance);
          previousNodes.set(neighbor.nodeName, nextNode.nodeName);
          pendingNodes.push({
            distance,
            nodeName: neighbor.nodeName,
          });
        }
      }

      if (!distances.has(destinationNodeName)) {
        return null;
      }

      const path = [destinationNodeName];
      let currentNodeName = destinationNodeName;

      while (previousNodes.has(currentNodeName)) {
        currentNodeName = previousNodes.get(currentNodeName);
        path.unshift(currentNodeName);
      }

      return path[0] === startNodeName ? path : null;
    },
  });
};
