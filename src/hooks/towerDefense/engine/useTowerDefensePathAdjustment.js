import { useCallback, useMemo, useState } from 'react';
import MapGenerator from '../../../components/towerDefense/MapGenerator';
import { getNodeEdgeDistance } from '../../../components/towerDefense/mapPathQuality';
import { GAME_STATUS } from '../../../game-engine-v2';

export default function useTowerDefensePathAdjustment({
  addTerminalMessage,
  basePathLength,
  getDeployablePlacementType,
  gridCols,
  gridRows,
  isMapLoading,
  gameState,
  pathNodes,
  problemDifficulty,
  setPathOverride,
}) {
  const [pathAdjusting, setPathAdjusting] = useState(false);

  const canAdjustPath = useMemo(() => {
    if (isMapLoading || !pathNodes.length) return false;
    if (gameState.status === GAME_STATUS.PLAYING) return false;
    if (gameState.enemies?.length) return false;
    return true;
  }, [gameState.enemies, gameState.status, isMapLoading, pathNodes.length]);

  const adjustPath = useCallback(
    (mode) => {
      if (!canAdjustPath || pathAdjusting || pathNodes.length < 2) return;

      setPathAdjusting(true);

      const startNode = pathNodes[0];
      const endNode = pathNodes[pathNodes.length - 1];
      const currentPathSet = new Set(pathNodes.map(([row, col]) => `${row},${col}`));

      const blockedSet = new Set(
        (gameState.towers || []).map((tower) => `${tower.position.row},${tower.position.col}`)
      );

      const requiredNodes = [];
      const requiredSet = new Set();
      const avoidSet = new Set();

      (gameState.deployables || []).forEach((deployable) => {
        const row = deployable.position?.row;
        const col = deployable.position?.col;
        if (row == null || col == null) return;
        const key = `${row},${col}`;
        const placementType = getDeployablePlacementType(deployable);
        const onPath = currentPathSet.has(key);

        if (placementType === 'path' || onPath) {
          if (!requiredSet.has(key)) {
            requiredSet.add(key);
            requiredNodes.push([row, col]);
          }
        } else {
          avoidSet.add(key);
        }
      });

      const baseAvoidSet = new Set(avoidSet);
      const pathAvoidSet = new Set(avoidSet);

      const createInteriorBiasCost =
        (weight = 1) =>
        ({ neighbor, target }) => {
          if (neighbor[0] === target[0] && neighbor[1] === target[1]) {
            return 0;
          }

          const edgeDistance = getNodeEdgeDistance(neighbor, gridCols, gridRows);
          let penalty = 0;

          if (edgeDistance === 0) {
            penalty += 6;
          } else if (edgeDistance === 1) {
            penalty += 3;
          } else if (edgeDistance === 2) {
            penalty += 1;
          }

          return penalty * weight;
        };

      if (mode === 'lengthen') {
        currentPathSet.forEach((key) => {
          if (requiredSet.has(key)) return;
          if (key === `${startNode[0]},${startNode[1]}`) return;
          if (key === `${endNode[0]},${endNode[1]}`) return;
          pathAvoidSet.add(key);
        });
      }

      const mapGenerator = new MapGenerator(gridCols, gridRows, problemDifficulty, Date.now());
      const currentLength = pathNodes.length;
      const normalizedBaseLength = Math.max(2, basePathLength || currentLength);
      const stepDelta = Math.max(1, Math.round(normalizedBaseLength * 0.1));
      const lengthenCap = Math.max(2, Math.ceil(normalizedBaseLength * 1.2));
      const targetLength =
        mode === 'lengthen'
          ? Math.min(lengthenCap, currentLength + stepDelta)
          : Math.max(2, currentLength - stepDelta);
      const minLength =
        mode === 'lengthen'
          ? Math.min(lengthenCap, currentLength + 1)
          : Math.max(2, currentLength - stepDelta);
      const maxLength =
        mode === 'lengthen' ? Math.min(lengthenCap, currentLength + stepDelta) : currentLength - 1;

      const pickWideWaypoints = (count, avoidNodes) => {
        if (count <= 0) return [];

        const candidates = [];
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            const key = `${row},${col}`;
            if (blockedSet.has(key)) continue;
            if (requiredSet.has(key)) continue;
            if (avoidNodes?.has(key)) continue;
            if (key === `${startNode[0]},${startNode[1]}`) continue;
            if (key === `${endNode[0]},${endNode[1]}`) continue;

            let minDist = Number.MAX_SAFE_INTEGER;
            for (const node of pathNodes) {
              const dist = Math.abs(node[0] - row) + Math.abs(node[1] - col);
              if (dist < minDist) minDist = dist;
              if (minDist <= 1) break;
            }

            const edgeDist = getNodeEdgeDistance([row, col], gridCols, gridRows);
            const interiorBonus = edgeDist * 1.75;
            const score = minDist + interiorBonus;
            candidates.push({ node: [row, col], score });
          }
        }

        candidates.sort((a, b) => b.score - a.score);

        const selected = [];
        for (const candidate of candidates) {
          if (selected.length >= count) break;
          const [row, col] = candidate.node;
          const tooClose = selected.some(
            ([sRow, sCol]) => Math.abs(sRow - row) + Math.abs(sCol - col) < 3
          );
          if (!tooClose) {
            selected.push(candidate.node);
          }
        }

        return selected;
      };

      if (mode === 'lengthen' && currentLength >= lengthenCap) {
        addTerminalMessage?.('[SYSTEM] Path is already at the max length for this map.');
        setPathAdjusting(false);
        return;
      }

      let bestPath = null;
      let bestInRange = null;
      let bestCandidate = null;

      if (mode === 'shorten') {
        const maxShortcutAttempts = 12;
        const maxSpan = Math.min(currentLength - 2, Math.max(4, Math.round(stepDelta * 2)));
        const minSpan = Math.min(currentLength - 2, Math.max(3, Math.round(stepDelta * 0.8)));

        for (let attempt = 0; attempt < maxShortcutAttempts; attempt++) {
          const startIndex = Math.max(
            1,
            Math.floor(mapGenerator.random() * (currentLength - maxSpan - 1))
          );
          const span = Math.floor(mapGenerator.random() * (maxSpan - minSpan + 1)) + minSpan;
          const endIndex = startIndex + span;

          if (endIndex >= currentLength - 1) continue;

          let hasRequired = false;
          for (let i = startIndex + 1; i < endIndex; i++) {
            if (requiredSet.has(`${pathNodes[i][0]},${pathNodes[i][1]}`)) {
              hasRequired = true;
              break;
            }
          }
          if (hasRequired) continue;

          const segmentStart = pathNodes[startIndex];
          const segmentEnd = pathNodes[endIndex];
          const shortcut = mapGenerator.findPathBetween(segmentStart, segmentEnd, {
            blockedSet,
            avoidSet,
            avoidPenalty: 4,
            costFn: createInteriorBiasCost(0.5),
          });

          if (!shortcut || shortcut.length < 2) continue;

          const segmentLength = endIndex - startIndex + 1;
          const nextLength = currentLength - segmentLength + shortcut.length;

          if (nextLength < minLength || nextLength > maxLength) continue;

          bestPath = [
            ...pathNodes.slice(0, startIndex),
            ...shortcut,
            ...pathNodes.slice(endIndex + 1),
          ];
          break;
        }
      }

      if (mode === 'lengthen') {
        const detourAttempts = 18;
        const waypointPool = pickWideWaypoints(
          Math.max(3, Math.round(stepDelta / 2)),
          baseAvoidSet
        );

        for (let attempt = 0; attempt < detourAttempts && !bestPath; attempt++) {
          const startIndex = Math.max(0, Math.floor(mapGenerator.random() * (currentLength - 2)));
          const segmentStart = pathNodes[startIndex];
          const segmentEnd = pathNodes[startIndex + 1];
          const waypoint =
            waypointPool[attempt % waypointPool.length] ||
            mapGenerator.pickConstrainedWaypoint(blockedSet, requiredSet, baseAvoidSet);

          if (!waypoint) continue;

          const firstLeg = mapGenerator.findPathBetween(segmentStart, waypoint, {
            blockedSet,
            avoidSet: baseAvoidSet,
            avoidPenalty: 4,
            costFn: createInteriorBiasCost(1),
          });
          if (!firstLeg || firstLeg.length < 2) continue;

          const secondLeg = mapGenerator.findPathBetween(waypoint, segmentEnd, {
            blockedSet,
            avoidSet: baseAvoidSet,
            avoidPenalty: 4,
            costFn: createInteriorBiasCost(1),
          });
          if (!secondLeg || secondLeg.length < 2) continue;

          const detourPath = [...firstLeg, ...secondLeg.slice(1)];
          const nextLength = currentLength - 2 + detourPath.length;

          if (nextLength >= minLength && nextLength <= maxLength) {
            bestPath = [
              ...pathNodes.slice(0, startIndex),
              ...detourPath,
              ...pathNodes.slice(startIndex + 2),
            ];
            break;
          }

          if (
            !bestCandidate ||
            Math.abs(nextLength - targetLength) < Math.abs(bestCandidate.length - targetLength)
          ) {
            bestCandidate = [
              ...pathNodes.slice(0, startIndex),
              ...detourPath,
              ...pathNodes.slice(startIndex + 2),
            ];
          }
        }
      }

      const attemptPasses = [
        {
          attempts: 16,
          avoidNodes: mode === 'lengthen' ? pathAvoidSet : baseAvoidSet,
          avoidPenalty: mode === 'shorten' ? 2 : 6,
        },
        ...(mode === 'lengthen'
          ? [
              {
                attempts: 12,
                avoidNodes: baseAvoidSet,
                avoidPenalty: 3,
              },
            ]
          : []),
      ];

      for (const pass of attemptPasses) {
        for (let attempt = 0; attempt < pass.attempts && !bestPath; attempt++) {
          const extraWaypoints = [];
          if (mode === 'lengthen') {
            const waypointCount = Math.max(2, Math.round(stepDelta / 2));
            extraWaypoints.push(...pickWideWaypoints(waypointCount, pass.avoidNodes));
            while (extraWaypoints.length < waypointCount) {
              const waypoint = mapGenerator.pickConstrainedWaypoint(
                blockedSet,
                requiredSet,
                pass.avoidNodes
              );
              if (waypoint) {
                extraWaypoints.push(waypoint);
              } else {
                break;
              }
            }
          }

          const result = mapGenerator.generateConstrainedPath({
            startNode,
            endNode,
            requiredNodes,
            blockedNodes: blockedSet,
            avoidNodes: pass.avoidNodes,
            avoidPenalty: pass.avoidPenalty,
            costFn: createInteriorBiasCost(mode === 'lengthen' ? 1 : 0.5),
            extraWaypoints,
            referencePath: pathNodes,
          });

          if (!result?.pathNodes?.length) {
            continue;
          }

          const nextLength = result.pathNodes.length;

          if (mode === 'lengthen' && nextLength <= currentLength) {
            continue;
          }

          if (mode === 'shorten' && nextLength >= currentLength) {
            continue;
          }

          const withinRange = nextLength >= minLength && nextLength <= maxLength;

          if (withinRange) {
            if (
              !bestInRange ||
              Math.abs(nextLength - targetLength) < Math.abs(bestInRange.length - targetLength)
            ) {
              bestInRange = result.pathNodes;
            }
          } else if (
            !bestCandidate ||
            Math.abs(nextLength - targetLength) < Math.abs(bestCandidate.length - targetLength)
          ) {
            bestCandidate = result.pathNodes;
          }
        }

        if (bestPath || bestInRange) {
          break;
        }
      }

      if (bestInRange) {
        bestPath = bestInRange;
      } else if (!bestPath && bestCandidate) {
        bestPath = bestCandidate;
      }

      if (bestPath && bestPath.length > 1) {
        setPathOverride(bestPath);
        addTerminalMessage?.(
          `[SYSTEM] Path ${mode === 'lengthen' ? 'extended' : 'shortened'} to ${bestPath.length} nodes.`
        );
      } else {
        addTerminalMessage?.('[SYSTEM] Unable to adjust path with current placements.');
      }

      setPathAdjusting(false);
    },
    [
      addTerminalMessage,
      basePathLength,
      canAdjustPath,
      gameState.deployables,
      gameState.towers,
      getDeployablePlacementType,
      gridCols,
      gridRows,
      pathAdjusting,
      pathNodes,
      problemDifficulty,
      setPathOverride,
    ]
  );

  return {
    canAdjustPath,
    pathAdjusting,
    adjustPath,
  };
}
