import {
  SCENE_ACTOR_NAV_RESERVED_DESTINATION_PENALTY,
  SCENE_ACTOR_NAV_RESERVED_TARGET_PENALTY,
  SCENE_ACTOR_NAV_OCCUPIED_NODE_PENALTY,
  SCENE_ACTOR_NAV_RESERVED_NEARBY_DISTANCE,
  SCENE_ACTOR_NAV_RESERVED_NEARBY_PENALTY,
  SCENE_ACTOR_NAV_CROSSWALK_SIDE_TAGS,
  SCENE_ACTOR_NAV_CROSSWALK_SIDE_BONUS,
  SCENE_ACTOR_NAV_CROSSWALK_CENTER_PENALTY,
  SCENE_ACTOR_NAV_CROSSWALK_TRANSITION_PENALTY,
  SCENE_ACTOR_NAV_CROSSWALK_HANGOUT_BONUS,
  cloneSceneActorConfigValue,
  createSceneActorNavTarget,
  resolveSceneActorNavWaitMs,
} from './sceneActorShared';
export const attachSceneActorNavRuleMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    pathUsesSceneActorNavCrosswalk(graph, path = []) {
      for (let index = 1; index < path.length; index += 1) {
        if (graph.traversalKeys.has(`${path[index - 1]}::${path[index]}`)) {
          return true;
        }
      }

      return false;
    },

    resolveSceneActorNavCurrentSideTags(entry, graph) {
      if (!graph?.nodesByName || entry.navState?.crosswalkCooldownActive !== true) {
        return [];
      }

      const currentNodeName = this.resolveSceneActorNavCurrentNodeName(entry, graph);
      const currentNode = currentNodeName ? graph.nodesByName.get(currentNodeName) : null;

      if (!currentNode) {
        return [];
      }

      return Array.from(currentNode.tags).filter((tag) =>
        SCENE_ACTOR_NAV_CROSSWALK_SIDE_TAGS.has(tag)
      );
    },

    doesSceneActorNavNodeMatchCooldownSide(entry, graph, node) {
      const currentSideTags = this.resolveSceneActorNavCurrentSideTags(entry, graph);

      if (currentSideTags.length === 0) {
        return true;
      }

      return currentSideTags.some((tag) => node.tags.has(tag));
    },

    resolveSceneActorNavCrosswalkArrivalRule(node) {
      if (!node?.isCrosswalk) {
        return null;
      }

      if (node.tags.has('left-side')) {
        return 'burger-only';
      }

      if (node.tags.has('right-side') || node.tags.has('east-side')) {
        return 'non-burger-only';
      }

      return null;
    },

    resolveSceneActorNavCrosswalkFollowUpRule(entry, graph) {
      if (entry.navState?.crosswalkCooldownActive !== true) {
        return null;
      }

      const storedRule = entry.navState?.crosswalkFollowUpRule;

      if (storedRule === 'burger-only' || storedRule === 'non-burger-only') {
        return storedRule;
      }

      const currentNodeName = this.resolveSceneActorNavCurrentNodeName(entry, graph);
      const currentNode = currentNodeName ? graph.nodesByName.get(currentNodeName) : null;

      return this.resolveSceneActorNavCrosswalkArrivalRule(currentNode);
    },

    doesSceneActorNavNodeMatchCrosswalkFollowUpRule(entry, graph, node) {
      const followUpRule = this.resolveSceneActorNavCrosswalkFollowUpRule(entry, graph);

      if (!followUpRule) {
        return true;
      }

      if (node.isCrosswalk) {
        return false;
      }

      if (followUpRule === 'burger-only') {
        return node.tags.has('burger');
      }

      if (followUpRule === 'non-burger-only') {
        return !node.tags.has('burger');
      }

      return true;
    },

    isSceneActorNavNodeHardReserved(entry, nodeName) {
      const otherEntries = Array.isArray(this.sceneActorEntries) ? this.sceneActorEntries : [];

      return otherEntries.some((otherEntry) => {
        if (!otherEntry || otherEntry === entry || otherEntry.sprite?.visible === false) {
          return false;
        }

        const otherRoute = Array.isArray(otherEntry.route) ? otherEntry.route : [];
        const otherDestinationNodeName =
          [...otherRoute]
            .reverse()
            .find((routePoint) => typeof routePoint?.navNodeName === 'string')?.navNodeName || null;
        const otherTargetNodeName = otherRoute[otherEntry.currentRouteIndex]?.navNodeName || null;
        const otherCurrentNodeName = otherEntry.navState?.currentNodeName || null;

        return (
          otherDestinationNodeName === nodeName ||
          otherTargetNodeName === nodeName ||
          otherCurrentNodeName === nodeName
        );
      });
    },

    doesSceneActorNavFirstHopFollowOtherActor(entry, firstHopNodeName) {
      if (!firstHopNodeName) {
        return false;
      }

      const otherEntries = Array.isArray(this.sceneActorEntries) ? this.sceneActorEntries : [];

      return otherEntries.some((otherEntry) => {
        if (!otherEntry || otherEntry === entry || otherEntry.sprite?.visible === false) {
          return false;
        }

        const otherRoute = Array.isArray(otherEntry.route) ? otherEntry.route : [];
        const otherTargetNodeName = otherRoute[otherEntry.currentRouteIndex]?.navNodeName || null;
        const otherCurrentNodeName = otherEntry.navState?.currentNodeName || null;

        return (
          otherTargetNodeName === firstHopNodeName || otherCurrentNodeName === firstHopNodeName
        );
      });
    },

    resolveSceneActorNavReservationPenalty(entry, graph, node) {
      const otherEntries = Array.isArray(this.sceneActorEntries) ? this.sceneActorEntries : [];
      let penalty = 1;

      otherEntries.forEach((otherEntry) => {
        if (!otherEntry || otherEntry === entry) {
          return;
        }

        const otherRoute = Array.isArray(otherEntry.route) ? otherEntry.route : [];
        const otherDestinationNodeName =
          [...otherRoute]
            .reverse()
            .find((routePoint) => typeof routePoint?.navNodeName === 'string')?.navNodeName || null;
        const otherTargetNodeName = otherRoute[otherEntry.currentRouteIndex]?.navNodeName || null;
        const otherCurrentNodeName = otherEntry.navState?.currentNodeName || null;

        if (otherDestinationNodeName === node.name) {
          penalty *= SCENE_ACTOR_NAV_RESERVED_DESTINATION_PENALTY;
        }

        if (otherTargetNodeName === node.name) {
          penalty *= SCENE_ACTOR_NAV_RESERVED_TARGET_PENALTY;
        }

        if (otherCurrentNodeName === node.name) {
          penalty *= SCENE_ACTOR_NAV_OCCUPIED_NODE_PENALTY;
        }

        const comparisonNodeName =
          otherDestinationNodeName || otherTargetNodeName || otherCurrentNodeName || null;
        const comparisonNode = comparisonNodeName
          ? graph.nodesByName.get(comparisonNodeName)
          : null;

        if (!comparisonNode || comparisonNode.name === node.name) {
          return;
        }

        if (
          Math.hypot(comparisonNode.x - node.x, comparisonNode.y - node.y) <
          SCENE_ACTOR_NAV_RESERVED_NEARBY_DISTANCE
        ) {
          penalty *= SCENE_ACTOR_NAV_RESERVED_NEARBY_PENALTY;
        }
      });

      return penalty;
    },

    resolveSceneActorNavDestinationWeight(entry, graph, node, navGraphConfig = {}) {
      let weight = Number(navGraphConfig?.nodeWeightMultipliers?.[node.name] ?? 1);

      if (!(weight > 0)) {
        return 0;
      }

      const preferredTags = Array.isArray(navGraphConfig?.preferredTags)
        ? navGraphConfig.preferredTags
        : [];
      const avoidedTags = Array.isArray(navGraphConfig?.avoidedTags)
        ? navGraphConfig.avoidedTags
        : [];

      preferredTags.forEach((tag) => {
        if (node.tags.has(tag)) {
          weight *= 1.6;
        }
      });
      avoidedTags.forEach((tag) => {
        if (node.tags.has(tag)) {
          weight *= 0.35;
        }
      });

      if (node.isCrosswalk) {
        weight *= 0.55;
      }

      if (entry.navState?.lastDestinationNodeName === node.name) {
        weight *= 0.2;
      }

      const currentSideTags = this.resolveSceneActorNavCurrentSideTags(entry, graph);

      if (currentSideTags.length > 0) {
        if (currentSideTags.some((tag) => node.tags.has(tag))) {
          weight *= SCENE_ACTOR_NAV_CROSSWALK_SIDE_BONUS;
        }

        if (node.tags.has('center')) {
          weight *= SCENE_ACTOR_NAV_CROSSWALK_CENTER_PENALTY;
        }

        if (node.tags.has('transition')) {
          weight *= SCENE_ACTOR_NAV_CROSSWALK_TRANSITION_PENALTY;
        }

        if (node.tags.has('hangout')) {
          weight *= SCENE_ACTOR_NAV_CROSSWALK_HANGOUT_BONUS;
        }
      }

      weight *= this.resolveSceneActorNavReservationPenalty(entry, graph, node);

      return weight;
    },

    buildSceneActorNavRoutePoint(entry, graph, nodeName, options = {}) {
      const node = graph.nodesByName.get(nodeName);

      if (!node) {
        return null;
      }

      const isDestination = options.isDestination === true;
      const override =
        isDestination && entry.actorConfig?.navGraph?.nodeOverrides?.[nodeName]
          ? cloneSceneActorConfigValue(entry.actorConfig.navGraph.nodeOverrides[nodeName])
          : null;
      const routePoint = override && typeof override === 'object' ? override : {};

      if (!routePoint.target) {
        routePoint.target = createSceneActorNavTarget(graph.layerName, nodeName);
      }

      if (!Number.isFinite(Number(routePoint.arrivalDistance))) {
        routePoint.arrivalDistance = node.isCrosswalk ? 6 : 4;
      }

      if (typeof routePoint.waitMs !== 'number') {
        routePoint.waitMs = isDestination ? resolveSceneActorNavWaitMs(node.waitRangeMs, 0) : 0;
      }

      routePoint.navClearsCrosswalkCooldown = isDestination && !node.isCrosswalk;
      routePoint.navCrosswalkCooldownActiveOnArrival = Boolean(options.activateCrosswalkCooldown);
      routePoint.navCrosswalkFollowUpRule = options.crosswalkFollowUpRule || null;
      routePoint.navCrosswalkPairId = options.crosswalkPairId || null;
      routePoint.navNodeName = nodeName;
      routePoint.navShouldBlockCrosswalkPairOnArrival =
        options.blockCrosswalkPairOnArrival === true;
      routePoint.navShouldPlanNextRoute = isDestination;
      routePoint.navTraversedCrosswalkPairId = options.traversedCrosswalkPairId || null;

      return routePoint;
    },
  });
};
