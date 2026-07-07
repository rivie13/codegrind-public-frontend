import {
  SCENE_ACTOR_STUCK_TIMEOUT_MS,
  SCENE_ACTOR_RECOVERY_DURATION_MS,
  SCENE_ACTOR_RECOVERY_SPEED_MULTIPLIER,
  SCENE_ACTOR_MAX_STUCK_RECOVERY_ATTEMPTS,
  SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_RADIUS,
  pickWeightedSceneActorNavCandidate,
} from './sceneActorShared';
export const attachSceneActorNavPlanningMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    planSceneActorNavRoute(entry) {
      const navGraphConfig = entry.actorConfig?.navGraph;
      const graph = this.buildSceneActorNavGraph(navGraphConfig);

      if (!graph) {
        return [];
      }

      const startNodeName = this.resolveSceneActorNavCurrentNodeName(entry, graph);

      if (!startNodeName) {
        return [];
      }

      const allowCrosswalkTraversal = entry.navState?.crosswalkCooldownActive !== true;
      const blockedCrosswalkPairId =
        graph.crosswalkPairCount > 1 && typeof entry.navState?.blockedCrosswalkPairId === 'string'
          ? entry.navState.blockedCrosswalkPairId
          : null;
      const candidates = graph.nodes
        .filter(
          (node) =>
            node.name !== startNodeName &&
            !(entry.navState?.crosswalkCooldownActive === true && node.isCrosswalk) &&
            !(blockedCrosswalkPairId && node.crosswalkPairId === blockedCrosswalkPairId) &&
            this.doesSceneActorNavNodeMatchCooldownSide(entry, graph, node) &&
            this.doesSceneActorNavNodeMatchCrosswalkFollowUpRule(entry, graph, node) &&
            !this.isSceneActorNavNodeHardReserved(entry, node.name)
        )
        .map((node) => {
          const path = this.findSceneActorNavPath(graph, startNodeName, node.name, {
            allowCrosswalkTraversal,
          });

          if (!path || path.length < 2) {
            return null;
          }

          if (this.doesSceneActorNavFirstHopFollowOtherActor(entry, path[1] || null)) {
            return null;
          }

          if (
            blockedCrosswalkPairId &&
            path
              .slice(1)
              .some(
                (pathNodeName) =>
                  graph.nodesByName.get(pathNodeName)?.crosswalkPairId === blockedCrosswalkPairId
              )
          ) {
            return null;
          }

          const crosswalkPairByArrivalNode = new Map();
          const crosswalkPairIds = [];

          for (let index = 1; index < path.length; index += 1) {
            if (!graph.traversalKeys.has(`${path[index - 1]}::${path[index]}`)) {
              continue;
            }

            const pairId =
              graph.nodesByName.get(path[index])?.crosswalkPairId ||
              graph.nodesByName.get(path[index - 1])?.crosswalkPairId ||
              null;

            if (!pairId) {
              continue;
            }

            crosswalkPairByArrivalNode.set(path[index], pairId);

            if (!crosswalkPairIds.includes(pairId)) {
              crosswalkPairIds.push(pairId);
            }
          }

          if (blockedCrosswalkPairId && crosswalkPairIds.includes(blockedCrosswalkPairId)) {
            return null;
          }

          return {
            crosswalkPairByArrivalNode,
            crosswalkPairIds,
            node,
            path,
            usesCrosswalk: crosswalkPairIds.length > 0,
            weight: this.resolveSceneActorNavDestinationWeight(entry, graph, node, navGraphConfig),
          };
        })
        .filter((candidate) => candidate && candidate.weight > 0);
      const selectedCandidate = pickWeightedSceneActorNavCandidate(candidates);

      if (!selectedCandidate) {
        return [];
      }

      const pathNodeNames = selectedCandidate.path.slice(1);
      const finalNodeName = pathNodeNames[pathNodeNames.length - 1] || null;
      const finalNode = finalNodeName ? graph.nodesByName.get(finalNodeName) : null;
      const lastCrosswalkPairId =
        selectedCandidate.crosswalkPairIds[selectedCandidate.crosswalkPairIds.length - 1] || null;

      return pathNodeNames
        .map((nodeName, index) =>
          this.buildSceneActorNavRoutePoint(entry, graph, nodeName, {
            activateCrosswalkCooldown:
              index === pathNodeNames.length - 1 &&
              selectedCandidate.usesCrosswalk &&
              Boolean(finalNode?.isCrosswalk),
            crosswalkFollowUpRule:
              index === pathNodeNames.length - 1 &&
              selectedCandidate.usesCrosswalk &&
              Boolean(finalNode?.isCrosswalk)
                ? this.resolveSceneActorNavCrosswalkArrivalRule(finalNode)
                : null,
            crosswalkPairId:
              index === pathNodeNames.length - 1 &&
              selectedCandidate.usesCrosswalk &&
              Boolean(finalNode?.isCrosswalk)
                ? lastCrosswalkPairId
                : null,
            blockCrosswalkPairOnArrival:
              graph.crosswalkPairCount > 1 &&
              index === pathNodeNames.length - 1 &&
              selectedCandidate.usesCrosswalk &&
              Boolean(finalNode?.isCrosswalk),
            isDestination: index === pathNodeNames.length - 1,
            traversedCrosswalkPairId:
              selectedCandidate.crosswalkPairByArrivalNode.get(nodeName) || null,
          })
        )
        .filter(Boolean);
    },

    resolveSceneActorRoute(entry) {
      if (Array.isArray(entry.actorConfig?.route) && entry.actorConfig.route.length > 0) {
        return entry.actorConfig.route;
      }

      if (!this.isSceneActorNavEnabled(entry.actorConfig)) {
        return [];
      }

      if (!Array.isArray(entry.route) || entry.route.length === 0) {
        entry.route = this.planSceneActorNavRoute(entry);
        entry.currentRouteIndex = 0;
        this.markSceneActorTargetProgress(
          entry,
          Number.POSITIVE_INFINITY,
          Number(this.time?.now || 0)
        );
      }

      return Array.isArray(entry.route) ? entry.route : [];
    },

    markSceneActorTargetProgress(entry, distance, now = 0) {
      entry.lastProgressAt = now;
      entry.lastProgressDistance = distance;
      entry.lastRouteIndex = entry.currentRouteIndex;
    },

    resolveSceneActorRecoveryVector(entry, deltaX = 0, deltaY = 0, speed = 0) {
      const blocked = entry.sprite?.body?.blocked || {};
      const touching = entry.sprite?.body?.touching || {};
      const avoidX =
        (blocked.left || touching.left ? 1 : 0) + (blocked.right || touching.right ? -1 : 0);
      const avoidY = (blocked.up || touching.up ? 1 : 0) + (blocked.down || touching.down ? -1 : 0);
      const attemptCount = Number(entry.stuckAttemptCount ?? 0);
      const reverseX = deltaX === 0 ? avoidX : -Math.sign(deltaX);
      const reverseY = deltaY === 0 ? avoidY : -Math.sign(deltaY);
      const baseVector = new Phaser.Math.Vector2(reverseX, reverseY);
      let sidestepX = 0;
      let sidestepY = 0;
      const alternateDirection = attemptCount % 2 === 0 ? 1 : -1;

      if (baseVector.lengthSq() === 0) {
        if (avoidX !== 0 || avoidY !== 0) {
          baseVector.x = avoidX;
          baseVector.y = avoidY;
        } else if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          baseVector.x = deltaX === 0 ? -1 : -Math.sign(deltaX);
        } else {
          baseVector.y = deltaY === 0 ? -1 : -Math.sign(deltaY);
        }
      }

      if (attemptCount <= 1) {
        return baseVector
          .normalize()
          .scale(Math.max(speed * SCENE_ACTOR_RECOVERY_SPEED_MULTIPLIER, 18));
      }

      if (avoidX !== 0 && avoidY === 0) {
        sidestepY = deltaY === 0 ? alternateDirection : Math.sign(deltaY);
      } else if (avoidY !== 0 && avoidX === 0) {
        sidestepX = deltaX === 0 ? alternateDirection : Math.sign(deltaX);
      } else if (avoidX === 0 && avoidY === 0) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          sidestepX = deltaX === 0 ? -1 : -Math.sign(deltaX);
          sidestepY = deltaY === 0 ? alternateDirection : Math.sign(deltaY);
        } else {
          sidestepX = deltaX === 0 ? alternateDirection : Math.sign(deltaX);
          sidestepY = deltaY === 0 ? -1 : -Math.sign(deltaY);
        }
      }

      const recoveryVector = new Phaser.Math.Vector2(
        baseVector.x + sidestepX * 0.6,
        baseVector.y + sidestepY * 0.6
      );

      if (recoveryVector.lengthSq() === 0) {
        return null;
      }

      return recoveryVector
        .normalize()
        .scale(Math.max(speed * SCENE_ACTOR_RECOVERY_SPEED_MULTIPLIER, 18));
    },

    recoverStuckNavSceneActor(entry, now = 0) {
      if (!this.isSceneActorNavEnabled(entry.actorConfig)) {
        return false;
      }

      const graph = this.buildSceneActorNavGraph(entry.actorConfig?.navGraph);

      if (!graph) {
        return false;
      }

      const nearestNodeName = this.resolveSceneActorNearestNavNodeName(graph, {
        x: Number(entry.sprite?.x),
        y: Number(entry.sprite?.y),
      });
      const nearestNode = nearestNodeName ? graph.nodesByName.get(nearestNodeName) : null;

      if (!nearestNode) {
        return false;
      }

      entry.sprite.body.stop?.();
      entry.sprite.setPosition?.(nearestNode.x, nearestNode.y);
      entry.sprite.body.updateFromGameObject?.();
      entry.navState.currentNodeName = nearestNodeName;
      entry.route = this.planSceneActorNavRoute(entry);
      entry.currentRouteIndex = 0;
      entry.waitUntil = now + 80;
      this.resetSceneActorRecovery(entry);
      this.markSceneActorTargetProgress(entry, Number.POSITIVE_INFINITY, now);
      entry.sprite.setVelocity(0, 0);
      this.applySceneActorIdleAnimation(entry);
      this.syncSceneActorVisual(entry);

      return true;
    },

    tryRecoverStuckSceneActor(entry, route, deltaX = 0, deltaY = 0, speed = 0, now = 0) {
      if (entry.recoveryUntil > now && entry.recoveryVector) {
        entry.sprite.setVelocity(entry.recoveryVector.x, entry.recoveryVector.y);
        this.updateSceneActorAnimation(entry, entry.recoveryVector);
        this.syncSceneActorVisual(entry);
        return true;
      }

      if (entry.recoveryUntil > 0) {
        entry.recoveryUntil = 0;
        entry.recoveryVector = null;
      }

      const blocked = entry.sprite?.body?.blocked || {};
      const touching = entry.sprite?.body?.touching || {};
      const embedded = Boolean(entry.sprite?.body?.embedded);
      const isBlocked =
        embedded ||
        blocked.left ||
        blocked.right ||
        blocked.up ||
        blocked.down ||
        touching.left ||
        touching.right ||
        touching.up ||
        touching.down;

      if (!isBlocked || now - Number(entry.lastProgressAt ?? 0) < SCENE_ACTOR_STUCK_TIMEOUT_MS) {
        return false;
      }

      const nextAttemptCount =
        entry.stuckRouteIndex === entry.currentRouteIndex
          ? Number(entry.stuckAttemptCount ?? 0) + 1
          : 1;

      entry.stuckRouteIndex = entry.currentRouteIndex;
      entry.stuckAttemptCount = nextAttemptCount;

      if (nextAttemptCount > SCENE_ACTOR_MAX_STUCK_RECOVERY_ATTEMPTS) {
        if (this.recoverStuckNavSceneActor(entry, now)) {
          return true;
        }

        const blockedRoutePoint = route[entry.currentRouteIndex] || null;
        entry.currentRouteIndex = this.resolveSceneActorRouteIndex(
          blockedRoutePoint?.nextRouteIndexChoices ?? blockedRoutePoint?.nextRouteIndex,
          (entry.currentRouteIndex + 1) % route.length
        );
        entry.waitUntil = now + 80;
        this.resetSceneActorRecovery(entry);
        this.markSceneActorTargetProgress(entry, Number.POSITIVE_INFINITY, now);
        entry.sprite.setVelocity(0, 0);
        this.applySceneActorIdleAnimation(entry);
        this.syncSceneActorVisual(entry);
        return true;
      }

      const recoveryVector = this.resolveSceneActorRecoveryVector(entry, deltaX, deltaY, speed);

      if (!recoveryVector) {
        return false;
      }

      entry.recoveryUntil = now + SCENE_ACTOR_RECOVERY_DURATION_MS;
      entry.recoveryVector = recoveryVector;
      entry.lastProgressAt = now;
      entry.sprite.setVelocity(recoveryVector.x, recoveryVector.y);
      this.updateSceneActorAnimation(entry, recoveryVector);
      this.syncSceneActorVisual(entry);

      return true;
    },

    resolveSceneActorAvoidanceVector(entry) {
      const otherEntries = Array.isArray(this.sceneActorEntries) ? this.sceneActorEntries : [];
      const avoidanceVector = new Phaser.Math.Vector2(0, 0);

      otherEntries.forEach((otherEntry) => {
        if (
          !otherEntry ||
          otherEntry === entry ||
          !otherEntry.sprite?.visible ||
          this.doesSceneActorMove(otherEntry.actorConfig) !== true
        ) {
          return;
        }

        const deltaX = Number(entry.sprite?.x ?? 0) - Number(otherEntry.sprite?.x ?? 0);
        const deltaY = Number(entry.sprite?.y ?? 0) - Number(otherEntry.sprite?.y ?? 0);
        const distance = Math.hypot(deltaX, deltaY);

        if (!(distance > 0) || distance >= SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_RADIUS) {
          return;
        }

        const strength =
          (SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_RADIUS - distance) /
          SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_RADIUS;

        avoidanceVector.x += (deltaX / distance) * strength;
        avoidanceVector.y += (deltaY / distance) * strength;
      });

      return avoidanceVector.lengthSq() > 0 ? avoidanceVector.normalize() : null;
    },
  });
};
