import logger from '../../utils/core/logger';
import {
  getDifficultyConfig,
  normalizeProblemDifficulty,
} from '../../utils/problems/difficultyConfig';
import { analyzePathQuality, getNodeEdgeDistance } from './mapPathQuality';

/**
 * Generates a tower defense map with path and tower placement zones
 * Map structure is represented as a 2D grid with:
 * 0 = Empty space / available for tower placement
 * 1 = Path for enemies
 * 2 = Start point
 * 3 = End point
 * 4 = Obstacle (no towers or enemies)
 */
class MapGenerator {
  constructor(width = 12, height = 8, difficulty = 'easy', seed = null) {
    const normalizedDifficulty = normalizeProblemDifficulty(difficulty);
    const difficultyConfig = getDifficultyConfig(normalizedDifficulty);

    this.width = width;
    this.height = height;
    this.difficulty = normalizedDifficulty.toLowerCase();
    this.map = Array(height)
      .fill()
      .map(() => Array(width).fill(0));
    this.pathNodes = [];
    this.startNode = null;
    this.endNode = null;
    this.seed = seed || Date.now(); // Use provided seed or current time

    // Initialize pseudo-random number generator with seed
    this.seedRandom = this.createSeededRandom(this.seed);

    // Determine complexity based on difficulty config
    this.minPathLength = difficultyConfig.minPathLength ?? Math.floor(width * height * 0.3);
    this.minTurns = difficultyConfig.minTurns ?? Math.max(4, Math.round(this.maxTurns * 0.75));
    this.maxTurns = difficultyConfig.maxTurns ?? 6;
    this.obstacleCount = difficultyConfig.obstacleCount ?? null;
    this.targetBuildableRatio = difficultyConfig.targetBuildableRatio ?? 0.5;
    this.minInteriorCoverage = difficultyConfig.minInteriorCoverage ?? 0.55;
    this.edgePenaltyDepth = difficultyConfig.edgePenaltyDepth ?? 2;
    this.pathPatterns = difficultyConfig.pathPatterns || [
      'straight',
      'zigzag',
      'spiral',
      'meander',
      'waypoints',
      'staircase',
      'perimeter',
      'complex',
    ];
    this.maxGenerationAttempts = difficultyConfig.maxGenerationAttempts ?? 18;
  }

  // Create a seeded random number generator
  createSeededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Get a random number using the seeded generator
  random() {
    return this.seedRandom();
  }

  // Generate a map with a valid path from start to end
  generateMap() {
    let attempts = 0;
    let validMap = false;
    let bestSnapshot = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    while (!validMap && attempts < this.maxGenerationAttempts) {
      this.map = Array(this.height)
        .fill()
        .map(() => Array(this.width).fill(0));
      this.pathNodes = [];

      this.setStartAndEndPoints();

      const generated = this.generatePath();
      if (!generated) {
        attempts++;
        continue;
      }

      this.addObstacles();

      const metrics = this.getMapQualityMetrics();
      if (metrics.score > bestScore) {
        bestScore = metrics.score;
        bestSnapshot = this.captureMapState();
      }

      validMap = this.validatePath(metrics);
      attempts++;
    }

    if (!validMap && bestSnapshot) {
      this.restoreMapState(bestSnapshot);
    }

    logger.info(`Generated map after ${attempts} attempts`);

    // Return both map data and path nodes
    return {
      map: this.map,
      pathNodes: this.pathNodes,
      path: this.pathNodes, // Add for backward compatibility
      startPoint: {
        x: this.startNode[1],
        y: this.startNode[0],
      },
      endPoint: {
        x: this.endNode[1],
        y: this.endNode[0],
      },
    };
  }

  // Validate the path to ensure the end is reachable and is the final node
  validatePath(metrics = this.getMapQualityMetrics()) {
    if (this.pathNodes.length < this.minPathLength) {
      logger.info('Path too short, regenerating');
      return false;
    }

    // Ensure the last node in pathNodes is the end node
    const lastNode = this.pathNodes[this.pathNodes.length - 1];
    if (lastNode[0] !== this.endNode[0] || lastNode[1] !== this.endNode[1]) {
      logger.info('End node is not the last node in path, regenerating');
      return false;
    }

    if (metrics.turnCount < this.minTurns) {
      logger.info('Path lacks enough turns, regenerating');
      return false;
    }

    if (metrics.edgePathRatio > 0.38) {
      logger.info('Path hugs the map edge too much, regenerating');
      return false;
    }

    if (metrics.interiorNodeRatio < this.minInteriorCoverage) {
      logger.info('Path does not use enough interior tiles, regenerating');
      return false;
    }

    if (
      metrics.buildableRatio < this.targetBuildableRatio - 0.06 ||
      metrics.buildableRatio > this.targetBuildableRatio + 0.12
    ) {
      logger.info('Buildable area ratio is outside the desired range, regenerating');
      return false;
    }

    const orientation = this.getPrimaryOrientation();
    const minorAxisCoverage =
      orientation === 'horizontal' ? metrics.rowCoverage : metrics.colCoverage;
    if (minorAxisCoverage < this.minInteriorCoverage) {
      logger.info('Path does not sweep across enough of the minor axis, regenerating');
      return false;
    }

    return true;
  }

  // Set start and end points on opposite sides of the map
  setStartAndEndPoints() {
    const layoutPattern = Math.floor(this.random() * 4);
    const rowCoordinate = () => this.pickEntranceCoordinate(this.height);
    const colCoordinate = () => this.pickEntranceCoordinate(this.width);

    switch (layoutPattern) {
      case 0:
        this.startNode = [rowCoordinate(), 0];
        this.endNode = [rowCoordinate(), this.width - 1];
        break;
      case 1:
        this.startNode = [rowCoordinate(), this.width - 1];
        this.endNode = [rowCoordinate(), 0];
        break;
      case 2:
        this.startNode = [0, colCoordinate()];
        this.endNode = [this.height - 1, colCoordinate()];
        break;
      case 3:
        this.startNode = [this.height - 1, colCoordinate()];
        this.endNode = [0, colCoordinate()];
        break;
    }

    // Mark start and end on the map
    this.map[this.startNode[0]][this.startNode[1]] = 2; // Start point
    this.map[this.endNode[0]][this.endNode[1]] = 3; // End point

    // Store start in the path
    this.pathNodes.push([...this.startNode]);
  }

  // Generate a path from start to end with a specific pattern
  generatePath() {
    const patternIndex = Math.floor(this.random() * this.pathPatterns.length);
    const selectedPattern = this.pathPatterns[patternIndex] || 'switchback';
    const waypointCount = this.getWaypointCount(selectedPattern);
    const targetPathLength = this.getTargetPathLength();
    let bestSnapshot = null;
    let bestLength = Number.NEGATIVE_INFINITY;

    for (let variation = 0; variation < 3; variation++) {
      this.initializeEmptyMap(this.startNode, this.endNode);

      const waypoints = this.createStrategicWaypoints(selectedPattern, waypointCount + variation);
      const built = this.buildPathThroughWaypoints(waypoints);

      if (!built) {
        continue;
      }

      if (this.pathNodes.length > bestLength) {
        bestLength = this.pathNodes.length;
        bestSnapshot = this.captureMapState();
      }

      if (this.pathNodes.length >= targetPathLength) {
        return true;
      }
    }

    if (bestSnapshot) {
      this.restoreMapState(bestSnapshot);
      return true;
    }

    return false;
  }

  getMapQualityMetrics() {
    return analyzePathQuality({
      pathNodes: this.pathNodes,
      width: this.width,
      height: this.height,
      map: this.map,
      targetBuildableRatio: this.targetBuildableRatio,
    });
  }

  captureMapState() {
    return {
      endNode: [...this.endNode],
      map: this.map.map((row) => [...row]),
      pathNodes: this.pathNodes.map((node) => [...node]),
      startNode: [...this.startNode],
    };
  }

  restoreMapState(snapshot) {
    this.map = snapshot.map.map((row) => [...row]);
    this.pathNodes = snapshot.pathNodes.map((node) => [...node]);
    this.startNode = [...snapshot.startNode];
    this.endNode = [...snapshot.endNode];
  }

  pickEntranceCoordinate(size) {
    const padding = this.getInteriorPadding(size);
    const min = padding;
    const max = size - 1 - padding;
    if (max <= min) {
      return Math.max(1, Math.floor(size / 2));
    }
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  getInteriorPadding(size) {
    if (size <= 8) {
      return 1;
    }
    return 2;
  }

  getPrimaryOrientation() {
    if (this.startNode[1] === 0 || this.startNode[1] === this.width - 1) {
      return 'horizontal';
    }
    return 'vertical';
  }

  getWaypointCount(pattern) {
    const baseCount = this.difficulty === 'hard' ? 9 : this.difficulty === 'medium' ? 7 : 6;

    const patternBonus = pattern === 'crosscut' ? 1 : pattern === 'dogleg' ? 0 : 0;

    return Math.min(baseCount + patternBonus, this.maxTurns);
  }

  getTargetPathLength() {
    const totalCells = this.width * this.height;
    const configuredObstacleCount = Number.isFinite(this.obstacleCount)
      ? this.obstacleCount
      : Math.floor(totalCells * 0.06);

    const targetNonBuildable = Math.floor(totalCells * (1 - this.targetBuildableRatio));
    const targetPathLength =
      targetNonBuildable - Math.min(configuredObstacleCount, Math.floor(totalCells * 0.08));

    return Math.max(this.minPathLength, targetPathLength);
  }

  getInteriorLanes(orientation) {
    const size = orientation === 'horizontal' ? this.height : this.width;
    const padding = this.getInteriorPadding(size);
    const candidates = [
      padding,
      Math.max(padding, Math.floor(size * 0.3)),
      Math.floor(size / 2),
      Math.min(size - 1 - padding, Math.ceil(size * 0.7)),
      size - 1 - padding,
    ];

    return Array.from(new Set(candidates.filter((value) => value >= 1 && value <= size - 2)));
  }

  createLaneSequence(lanes, count, pattern, startLane) {
    const centerLane = lanes[Math.floor(lanes.length / 2)];
    const lowLane = lanes[0];
    const highLane = lanes[lanes.length - 1];
    const upperLane = lanes[Math.min(1, lanes.length - 1)] ?? centerLane;
    const lowerLane = lanes[Math.max(lanes.length - 2, 0)] ?? centerLane;

    let sequenceTemplate;
    switch (pattern) {
      case 'weave':
        sequenceTemplate = [upperLane, lowerLane, centerLane, lowerLane, upperLane];
        break;
      case 'dogleg':
        sequenceTemplate = [highLane, centerLane, lowLane, centerLane, highLane];
        break;
      case 'crosscut':
        sequenceTemplate = [upperLane, highLane, centerLane, lowLane, lowerLane];
        break;
      case 'switchback':
      default:
        sequenceTemplate = [highLane, lowLane, highLane, lowLane, centerLane];
        break;
    }

    if (this.random() < 0.5) {
      sequenceTemplate = sequenceTemplate.slice().reverse();
    }

    const sequence = [];
    let currentLane = startLane;

    for (let index = 0; index < count; index++) {
      let lane = sequenceTemplate[index % sequenceTemplate.length];
      if (Math.abs(lane - currentLane) < 2) {
        lane =
          lanes
            .slice()
            .sort(
              (left, right) => Math.abs(right - currentLane) - Math.abs(left - currentLane)
            )[0] ?? lane;
      }
      sequence.push(lane);
      currentLane = lane;
    }

    return sequence;
  }

  createProgressStops(count, orientation) {
    const horizontal = orientation === 'horizontal';
    const startCoordinate = horizontal ? this.startNode[1] : this.startNode[0];
    const endCoordinate = horizontal ? this.endNode[1] : this.endNode[0];
    const padding = this.getInteriorPadding(horizontal ? this.width : this.height);
    const minimum = padding;
    const maximum = (horizontal ? this.width : this.height) - 1 - padding;
    const sign = endCoordinate > startCoordinate ? 1 : -1;
    const stops = [];

    for (let index = 1; index <= count; index++) {
      const base = startCoordinate + ((endCoordinate - startCoordinate) * index) / (count + 1);
      const jitter = Math.round((this.random() - 0.5) * 2);
      let coordinate = Math.round(base) + jitter;
      coordinate = Math.max(minimum, Math.min(maximum, coordinate));

      if (stops.length > 0) {
        const previous = stops[stops.length - 1];
        if (Math.abs(coordinate - previous) < 2) {
          coordinate = previous + sign * 2;
          coordinate = Math.max(minimum, Math.min(maximum, coordinate));
        }
      }

      stops.push(coordinate);
    }

    return sign > 0
      ? stops.sort((left, right) => left - right)
      : stops.sort((left, right) => right - left);
  }

  createStrategicWaypoints(pattern, count) {
    const orientation = this.getPrimaryOrientation();
    const lanes = this.getInteriorLanes(orientation);
    const progressStops = this.createProgressStops(count, orientation);
    const startLane = orientation === 'horizontal' ? this.startNode[0] : this.startNode[1];
    const laneSequence = this.createLaneSequence(lanes, progressStops.length, pattern, startLane);

    const waypoints = [];
    for (let index = 0; index < progressStops.length; index++) {
      const progress = progressStops[index];
      const lane = laneSequence[index] ?? lanes[Math.floor(lanes.length / 2)];
      const waypoint = orientation === 'horizontal' ? [lane, progress] : [progress, lane];

      const previous = waypoints[waypoints.length - 1] || this.startNode;
      if (Math.abs(previous[0] - waypoint[0]) + Math.abs(previous[1] - waypoint[1]) < 3) {
        continue;
      }

      waypoints.push(waypoint);
    }

    return waypoints;
  }

  createInteriorBiasCostFunction(softAvoidSet = null) {
    return ({ neighbor, target }) => {
      const key = `${neighbor[0]},${neighbor[1]}`;
      if (neighbor[0] === target[0] && neighbor[1] === target[1]) {
        return 0;
      }

      const edgeDistance = getNodeEdgeDistance(neighbor, this.width, this.height);
      let penalty = 0;

      if (edgeDistance === 0) {
        penalty += 6;
      } else if (edgeDistance === 1) {
        penalty += 3;
      } else if (edgeDistance === 2 && this.edgePenaltyDepth >= 2) {
        penalty += 1;
      }

      if (softAvoidSet?.has(key)) {
        penalty += 2;
      }

      return penalty;
    };
  }

  markSoftAvoid(node, softAvoidSet) {
    const neighbors = [
      node,
      [node[0] - 1, node[1]],
      [node[0] + 1, node[1]],
      [node[0], node[1] - 1],
      [node[0], node[1] + 1],
    ];

    neighbors.forEach(([row, col]) => {
      if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
        return;
      }
      if (this.map[row][col] === 2 || this.map[row][col] === 3) {
        return;
      }
      softAvoidSet.add(`${row},${col}`);
    });
  }

  buildPathThroughWaypoints(waypoints) {
    let currentNode = [...this.startNode];
    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);
    const softAvoidSet = new Set();
    const targets = [...waypoints, this.endNode];

    for (const target of targets) {
      const segment = this.findPathBetween(currentNode, target, {
        costFn: this.createInteriorBiasCostFunction(softAvoidSet),
      });

      if (!segment || segment.length < 2) {
        return false;
      }

      for (let index = 1; index < segment.length; index++) {
        currentNode = segment[index];
        this.addNodeToPath(currentNode, visited);
        this.markSoftAvoid(currentNode, softAvoidSet);
      }
    }

    return true;
  }

  // Generate a mostly straight path with few turns
  generateStraightPath() {
    let currentNode = [...this.startNode];
    let direction = this.getInitialDirection();

    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);
    const turnsRemaining = Math.floor(this.maxTurns * 0.6); // Fewer turns

    this.extendPathInDirection(currentNode, direction, visited, turnsRemaining);
  }

  // Generate a zigzag path with alternating directions
  generateZigzagPath() {
    let currentNode = [...this.startNode];
    let direction = this.getInitialDirection();
    let alternateDirection = this.getPerpendicularDirection(direction);

    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);

    // Number of segments in the zigzag pattern
    const segments = Math.floor(this.random() * 3) + 3;

    for (let i = 0; i < segments; i++) {
      // Alternate between main direction and perpendicular
      const useDirection = i % 2 === 0 ? direction : alternateDirection;
      const steps = Math.floor(this.random() * 3) + 2; // 2-4 steps each segment

      for (let step = 0; step < steps; step++) {
        const nextNode = this.getNextNode(currentNode, useDirection);

        if (this.isValidNode(nextNode, visited)) {
          currentNode = nextNode;
          this.addNodeToPath(currentNode, visited);
        } else {
          break;
        }
      }
    }
  }

  // Generate a spiral-like path that moves toward the center
  generateSpiralPath() {
    let currentNode = [...this.startNode];

    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);
    const directions = ['right', 'down', 'left', 'up'];
    let directionIndex = 0;

    // Spiral pattern parameters
    const cycles = Math.min(Math.floor(Math.min(this.width, this.height) / 2), 3);
    const stepsPerDirection = [2, 2, 3, 3, 4, 4]; // Increasing steps for spiral effect

    for (let cycle = 0; cycle < cycles; cycle++) {
      for (let i = 0; i < 4; i++) {
        // 4 directions per cycle
        const direction = directions[(directionIndex + i) % 4];
        const steps =
          stepsPerDirection[Math.min(cycle * 2 + (i % 2), stepsPerDirection.length - 1)];

        for (let step = 0; step < steps; step++) {
          const nextNode = this.getNextNode(currentNode, direction);

          if (this.isValidNode(nextNode, visited)) {
            currentNode = nextNode;
            this.addNodeToPath(currentNode, visited);
          } else {
            break;
          }
        }
      }

      directionIndex = (directionIndex + 1) % 4; // Shift starting direction
    }

    // After spiral, extend toward the end node area
    const endDirection = this.getDirectionTowards(currentNode, this.endNode);
    this.extendPathInDirection(currentNode, endDirection, visited, 2);
  }

  // Generate a meandering path with a bias toward the end
  generateMeanderingPath(startNode = this.startNode, visited = null) {
    let currentNode = [...startNode];
    const localVisited = visited || new Set([`${currentNode[0]},${currentNode[1]}`]);

    const maxSteps = Math.floor(this.width * this.height * 0.8);
    let steps = 0;

    while (steps < maxSteps) {
      steps++;

      const toward = this.getDirectionTowards(currentNode, this.endNode);
      const perpendicular = this.getPerpendicularDirection(toward);
      const away = this.getOppositeDirection(toward);

      const roll = this.random();
      let direction = toward;

      if (roll < 0.35) {
        direction = perpendicular;
      } else if (roll < 0.5) {
        direction = away;
      }

      const nextNode = this.getNextNode(currentNode, direction);

      if (this.isValidNode(nextNode, localVisited)) {
        currentNode = nextNode;
        this.addNodeToPath(currentNode, localVisited);
      } else {
        // Try a perpendicular direction as a fallback
        const fallback = this.getPerpendicularDirection(toward);
        const fallbackNode = this.getNextNode(currentNode, fallback);
        if (this.isValidNode(fallbackNode, localVisited)) {
          currentNode = fallbackNode;
          this.addNodeToPath(currentNode, localVisited);
        }
      }

      const distanceToEnd =
        Math.abs(currentNode[0] - this.endNode[0]) + Math.abs(currentNode[1] - this.endNode[1]);

      if (distanceToEnd <= 2 && this.pathNodes.length >= Math.floor(this.minPathLength * 0.8)) {
        break;
      }
    }

    return currentNode;
  }

  // Generate a path that connects through one or more waypoints
  generateWaypointPath(startNode = this.startNode, visited = null) {
    let currentNode = [...startNode];
    const localVisited = visited || new Set([`${currentNode[0]},${currentNode[1]}`]);

    const waypointCount = Math.max(1, Math.floor(this.random() * 2) + 1); // 1-2 waypoints
    const waypoints = [];

    for (let i = 0; i < waypointCount; i++) {
      const waypoint = this.pickWaypoint(localVisited);
      if (waypoint) {
        waypoints.push(waypoint);
        localVisited.add(`${waypoint[0]},${waypoint[1]}`);
      }
    }

    for (const waypoint of waypoints) {
      const segment = this.findPathBetween(currentNode, waypoint, localVisited);
      for (let i = 1; i < segment.length; i++) {
        currentNode = segment[i];
        this.addNodeToPath(currentNode, localVisited);
      }
    }

    return currentNode;
  }

  // Generate a staircase path that alternates horizontal and vertical moves
  generateStaircasePath() {
    let currentNode = [...this.startNode];
    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);

    const primaryHorizontal = this.endNode[1] >= this.startNode[1] ? 'right' : 'left';
    const primaryVertical = this.endNode[0] >= this.startNode[0] ? 'down' : 'up';

    let useHorizontal = this.random() < 0.5;
    const maxSegments = Math.floor(this.maxTurns * 2);

    for (let segment = 0; segment < maxSegments; segment++) {
      const direction = useHorizontal ? primaryHorizontal : primaryVertical;
      const steps = Math.floor(this.random() * 3) + 1; // 1-3 steps

      for (let step = 0; step < steps; step++) {
        const nextNode = this.getNextNode(currentNode, direction);
        if (this.isValidNode(nextNode, visited)) {
          currentNode = nextNode;
          this.addNodeToPath(currentNode, visited);
        } else {
          break;
        }
      }

      useHorizontal = !useHorizontal;

      const distanceToEnd =
        Math.abs(currentNode[0] - this.endNode[0]) + Math.abs(currentNode[1] - this.endNode[1]);
      if (distanceToEnd <= 2) {
        break;
      }
    }
  }

  // Generate a perimeter-heavy path using corner waypoints
  generatePerimeterPath() {
    let currentNode = [...this.startNode];
    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);

    const corners = [
      [0, 0],
      [0, this.width - 1],
      [this.height - 1, 0],
      [this.height - 1, this.width - 1],
    ].filter(
      ([row, col]) =>
        !(row === this.startNode[0] && col === this.startNode[1]) &&
        !(row === this.endNode[0] && col === this.endNode[1])
    );

    // Shuffle corners
    for (let i = corners.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [corners[i], corners[j]] = [corners[j], corners[i]];
    }

    const cornerCount = Math.min(2, corners.length);
    const selectedCorners = corners.slice(0, cornerCount);

    for (const corner of selectedCorners) {
      const segment = this.findPathBetween(currentNode, corner, visited);
      for (let i = 1; i < segment.length; i++) {
        currentNode = segment[i];
        const key = `${currentNode[0]},${currentNode[1]}`;
        if (!visited.has(key)) {
          this.addNodeToPath(currentNode, visited);
        }
      }
    }
  }

  // Generate a complex path by combining waypoints and meandering
  generateComplexPath() {
    const visited = new Set([`${this.startNode[0]},${this.startNode[1]}`]);
    let currentNode = this.generateWaypointPath(this.startNode, visited);
    this.generateMeanderingPath(currentNode, visited);
  }

  // Extend the path in a specific direction for a number of steps
  extendPathInDirection(startNode, direction, visited, maxTurns) {
    let currentNode = [...startNode];
    let currentDirection = direction;
    let turnsRemaining = maxTurns;

    // Maximum number of steps to prevent infinite loops
    const maxSteps = (this.width * this.height) / 2;
    let steps = 0;

    while (steps < maxSteps) {
      steps++;

      // Determine if we should turn
      const shouldTurn = this.random() < 0.2 && turnsRemaining > 0;

      if (shouldTurn) {
        const newDirection = this.getNewDirection(currentDirection);
        if (newDirection !== currentDirection) {
          currentDirection = newDirection;
          turnsRemaining--;
        }
      }

      // Try to move in current direction
      const nextNode = this.getNextNode(currentNode, currentDirection);

      if (this.isValidNode(nextNode, visited)) {
        currentNode = nextNode;
        this.addNodeToPath(currentNode, visited);
      } else {
        // Hit a wall or visited node, try to turn
        if (turnsRemaining > 0) {
          const newDirection = this.getNewDirection(currentDirection, true); // Force turn
          if (newDirection !== currentDirection) {
            currentDirection = newDirection;
            turnsRemaining--;
            continue;
          }
        }

        // If we can't turn, we're done with this path
        break;
      }

      // Check if we're getting close to the end node
      const distanceToEnd =
        Math.abs(currentNode[0] - this.endNode[0]) + Math.abs(currentNode[1] - this.endNode[1]);

      // If we're close enough to the end, stop extending
      if (distanceToEnd <= 3) {
        break;
      }
    }
  }

  // Get a new direction, optionally forcing a turn
  getNewDirection(currentDirection, forceTurn = false) {
    let allowedDirections = [];

    if (!forceTurn) {
      // Include current direction with higher probability
      allowedDirections = [currentDirection];
    }

    // Add perpendicular directions
    if (currentDirection === 'up' || currentDirection === 'down') {
      allowedDirections.push('left', 'right');
    } else {
      allowedDirections.push('up', 'down');
    }

    // Choose randomly from allowed directions
    return allowedDirections[Math.floor(this.random() * allowedDirections.length)];
  }

  // Get initial direction based on start and end positions
  getInitialDirection() {
    const dx = this.endNode[1] - this.startNode[1];
    const dy = this.endNode[0] - this.startNode[0];

    // Prefer the direction with larger difference
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  // Get perpendicular direction
  getPerpendicularDirection(direction) {
    switch (direction) {
      case 'up':
      case 'down':
        return this.random() < 0.5 ? 'left' : 'right';
      case 'left':
      case 'right':
        return this.random() < 0.5 ? 'up' : 'down';
      default:
        return 'right';
    }
  }

  // Get opposite direction
  getOppositeDirection(direction) {
    switch (direction) {
      case 'up':
        return 'down';
      case 'down':
        return 'up';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      default:
        return 'right';
    }
  }

  // Get direction towards a target node
  getDirectionTowards(fromNode, toNode) {
    const dx = toNode[1] - fromNode[1];
    const dy = toNode[0] - fromNode[0];

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  // Get next node in a direction
  getNextNode(node, direction) {
    switch (direction) {
      case 'up':
        return [node[0] - 1, node[1]];
      case 'right':
        return [node[0], node[1] + 1];
      case 'down':
        return [node[0] + 1, node[1]];
      case 'left':
        return [node[0], node[1] - 1];
      default:
        return [...node];
    }
  }

  // Check if node is valid (in bounds and not visited)
  isValidNode(node, visited) {
    const [row, col] = node;

    // Check bounds
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return false;
    }

    // Check if end node (always valid)
    if (row === this.endNode[0] && col === this.endNode[1]) {
      return true;
    }

    // Check if already visited
    if (visited.has(`${row},${col}`)) {
      return false;
    }

    // Check if it's a valid cell type
    return this.map[row][col] === 0 || this.map[row][col] === 2;
  }

  // Add node to path
  addNodeToPath(node, visited) {
    visited.add(`${node[0]},${node[1]}`);
    this.pathNodes.push([...node]);

    // Mark on map if not start or end
    if (this.map[node[0]][node[1]] !== 2 && this.map[node[0]][node[1]] !== 3) {
      this.map[node[0]][node[1]] = 1; // Path
    }
  }

  // Connect the current path to the end node
  connectToEnd(currentNode) {
    // Create a direct path to the end
    const path = this.findPathToEnd(currentNode);

    // Add all nodes in the path (excluding the first one which is current)
    for (let i = 1; i < path.length; i++) {
      const node = path[i];

      // Add to pathNodes if not already there
      if (!this.pathNodes.some((p) => p[0] === node[0] && p[1] === node[1])) {
        this.pathNodes.push(node);

        // Mark on map if not start or end
        if (this.map[node[0]][node[1]] !== 2 && this.map[node[0]][node[1]] !== 3) {
          this.map[node[0]][node[1]] = 1; // Path
        }
      }
    }
  }

  // Find a path from current node to end node using A* algorithm
  findPathToEnd(startNode) {
    return this.findPathBetween(startNode, this.endNode);
  }

  // Find a path between two nodes using A* algorithm
  findPathBetween(startNode, targetNode, options = null) {
    let blockedSet = null;
    let avoidSet = null;
    let avoidPenalty = 0;
    let costFn = null;

    if (options instanceof Set) {
      blockedSet = options;
    } else if (options) {
      blockedSet = options.blockedSet || null;
      avoidSet = options.avoidSet || null;
      avoidPenalty = Number.isFinite(options.avoidPenalty) ? options.avoidPenalty : 0;
      costFn = typeof options.costFn === 'function' ? options.costFn : null;
    }

    const openSet = [{ node: startNode, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];

      // Check if we reached the target
      if (current.node[0] === targetNode[0] && current.node[1] === targetNode[1]) {
        // Reconstruct path
        const path = [];
        let currentPathNode = current;

        while (currentPathNode) {
          path.unshift(currentPathNode.node);
          currentPathNode = currentPathNode.parent;
        }

        return path;
      }

      // Move from open to closed
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.node[0]},${current.node[1]}`);

      // Check neighbors
      const directions = ['up', 'right', 'down', 'left'];

      for (const direction of directions) {
        const neighbor = this.getNextNode(current.node, direction);
        const neighborKey = `${neighbor[0]},${neighbor[1]}`;

        // Check if neighbor is valid
        if (
          neighbor[0] < 0 ||
          neighbor[0] >= this.height ||
          neighbor[1] < 0 ||
          neighbor[1] >= this.width
        ) {
          continue;
        }

        if (
          blockedSet &&
          blockedSet.has(neighborKey) &&
          !(neighbor[0] === targetNode[0] && neighbor[1] === targetNode[1])
        ) {
          continue;
        }

        // Skip if already in closed set
        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Calculate g, h, and f values
        const penalty = avoidSet && avoidSet.has(neighborKey) ? avoidPenalty : 0;
        const customPenalty = costFn
          ? Math.max(
              0,
              Number(
                costFn({
                  current: current.node,
                  neighbor,
                  start: startNode,
                  target: targetNode,
                })
              ) || 0
            )
          : 0;
        const g = current.g + 1 + penalty + customPenalty;
        const h = Math.abs(neighbor[0] - targetNode[0]) + Math.abs(neighbor[1] - targetNode[1]);
        const f = g + h;

        // Check if neighbor is already in open set with a better path
        const existingNeighbor = openSet.find(
          (n) => n.node[0] === neighbor[0] && n.node[1] === neighbor[1]
        );

        if (existingNeighbor && g >= existingNeighbor.g) {
          continue;
        }

        // Add neighbor to open set
        if (!existingNeighbor) {
          openSet.push({
            node: neighbor,
            g,
            h,
            f,
            parent: current,
          });
        } else {
          // Update existing neighbor
          existingNeighbor.g = g;
          existingNeighbor.f = f;
          existingNeighbor.parent = current;
        }
      }
    }

    // No path found, return just target node
    return [startNode, targetNode];
  }

  // Generate a path that respects required nodes and blocked/avoid cells
  generateConstrainedPath({
    startNode = this.startNode,
    endNode = this.endNode,
    requiredNodes = [],
    blockedNodes = null,
    avoidNodes = null,
    avoidPenalty = 4,
    costFn = null,
    extraWaypoints = [],
    referencePath = null,
  } = {}) {
    this.initializeEmptyMap(startNode, endNode);

    const blockedSet =
      blockedNodes instanceof Set
        ? blockedNodes
        : new Set((blockedNodes || []).map((node) => `${node[0]},${node[1]}`));
    const avoidSet =
      avoidNodes instanceof Set
        ? new Set(Array.from(avoidNodes))
        : new Set((avoidNodes || []).map((node) => `${node[0]},${node[1]}`));

    const requiredSet = new Set();
    const normalizedRequired = [];
    requiredNodes.forEach((node) => {
      const key = `${node[0]},${node[1]}`;
      if (requiredSet.has(key)) return;
      if (node[0] === startNode[0] && node[1] === startNode[1]) return;
      if (node[0] === endNode[0] && node[1] === endNode[1]) return;
      requiredSet.add(key);
      normalizedRequired.push(node);
    });

    // Ensure avoid set doesn't block required/start/end nodes
    avoidSet.delete(`${startNode[0]},${startNode[1]}`);
    avoidSet.delete(`${endNode[0]},${endNode[1]}`);
    requiredSet.forEach((key) => avoidSet.delete(key));

    const orderedRequired = this.orderRequiredNodes(normalizedRequired, referencePath, startNode);

    let currentNode = [...startNode];
    const visited = new Set([`${currentNode[0]},${currentNode[1]}`]);
    const segments = [...orderedRequired, ...extraWaypoints, endNode];

    for (const target of segments) {
      const segment = this.findPathBetween(currentNode, target, {
        blockedSet,
        avoidSet,
        avoidPenalty,
        costFn,
      });

      if (!segment || segment.length < 2) {
        return null;
      }

      for (let i = 1; i < segment.length; i++) {
        currentNode = segment[i];
        this.addNodeToPath(currentNode, visited);
      }
    }

    return {
      map: this.map,
      pathNodes: this.pathNodes,
    };
  }

  // Initialize an empty map with fixed start/end points
  initializeEmptyMap(startNode, endNode) {
    this.map = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(0));
    this.pathNodes = [];
    this.startNode = [...startNode];
    this.endNode = [...endNode];

    this.map[this.startNode[0]][this.startNode[1]] = 2; // Start point
    this.map[this.endNode[0]][this.endNode[1]] = 3; // End point
    this.pathNodes.push([...this.startNode]);
  }

  // Order required nodes using reference path if provided
  orderRequiredNodes(nodes, referencePath = null, startNode = null) {
    if (!referencePath || referencePath.length === 0) {
      return nodes;
    }

    const indexMap = new Map();
    referencePath.forEach((node, index) => {
      indexMap.set(`${node[0]},${node[1]}`, index);
    });

    return nodes.slice().sort((a, b) => {
      const keyA = `${a[0]},${a[1]}`;
      const keyB = `${b[0]},${b[1]}`;
      const indexA = indexMap.has(keyA) ? indexMap.get(keyA) : Number.MAX_SAFE_INTEGER;
      const indexB = indexMap.has(keyB) ? indexMap.get(keyB) : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      if (!startNode) return 0;
      const distA = Math.abs(a[0] - startNode[0]) + Math.abs(a[1] - startNode[1]);
      const distB = Math.abs(b[0] - startNode[0]) + Math.abs(b[1] - startNode[1]);
      return distA - distB;
    });
  }

  // Pick a waypoint with constraints against blocked/required/avoid nodes
  pickConstrainedWaypoint(blockedSet, requiredSet, avoidSet = null) {
    let attempts = 0;
    let fallback = null;
    const rowPadding = this.getInteriorPadding(this.height);
    const colPadding = this.getInteriorPadding(this.width);

    while (attempts < 60) {
      const row = Math.floor(this.random() * (this.height - rowPadding * 2)) + rowPadding;
      const col = Math.floor(this.random() * (this.width - colPadding * 2)) + colPadding;
      const key = `${row},${col}`;

      if (blockedSet?.has(key)) {
        attempts++;
        continue;
      }

      if (requiredSet?.has(key)) {
        attempts++;
        continue;
      }

      if (avoidSet?.has(key)) {
        fallback = fallback || [row, col];
        attempts++;
        continue;
      }

      return [row, col];
    }

    return fallback;
  }

  // Pick a waypoint that is not too close to start/end
  pickWaypoint(visited) {
    let attempts = 0;
    const rowPadding = this.getInteriorPadding(this.height);
    const colPadding = this.getInteriorPadding(this.width);
    while (attempts < 40) {
      const row = Math.floor(this.random() * (this.height - rowPadding * 2)) + rowPadding;
      const col = Math.floor(this.random() * (this.width - colPadding * 2)) + colPadding;
      const key = `${row},${col}`;

      const distanceToStart = Math.abs(row - this.startNode[0]) + Math.abs(col - this.startNode[1]);
      const distanceToEnd = Math.abs(row - this.endNode[0]) + Math.abs(col - this.endNode[1]);

      if (
        !visited.has(key) &&
        this.map[row][col] === 0 &&
        distanceToStart >= 3 &&
        distanceToEnd >= 3
      ) {
        return [row, col];
      }

      attempts++;
    }

    return null;
  }

  // Add obstacles in empty spaces
  addObstacles() {
    const totalCells = this.width * this.height;
    const configuredObstacleCount = Number.isFinite(this.obstacleCount)
      ? this.obstacleCount
      : Math.floor((totalCells - this.pathNodes.length) * 0.15);
    const nonBuildableBudget = Math.floor(totalCells * (1 - this.targetBuildableRatio));
    const obstacleBudget = Math.max(0, nonBuildableBudget - this.pathNodes.length);
    const obstacleCount = Math.max(0, Math.min(configuredObstacleCount, obstacleBudget));

    // Create clusters of obstacles for more natural placement
    for (let i = 0; i < obstacleCount; i++) {
      let row, col;
      let attempts = 0;

      // Find a valid empty cell
      do {
        row = Math.floor(this.random() * this.height);
        col = Math.floor(this.random() * this.width);
        attempts++;
      } while (this.map[row][col] !== 0 && attempts < 50);

      if (attempts < 50) {
        this.map[row][col] = 4; // Obstacle

        // Add adjacent obstacles (cluster)
        if (this.random() < 0.5) {
          const neighbors = [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1],
          ];

          for (const [nRow, nCol] of neighbors) {
            if (
              nRow >= 0 &&
              nRow < this.height &&
              nCol >= 0 &&
              nCol < this.width &&
              this.map[nRow][nCol] === 0 &&
              this.random() < 0.4
            ) {
              this.map[nRow][nCol] = 4; // Obstacle
            }
          }
        }
      }
    }
  }

  // Get path nodes for enemy movement
  getPathNodes() {
    return this.pathNodes;
  }
}

export default MapGenerator;
