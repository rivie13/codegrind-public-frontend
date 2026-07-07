import { describe, expect, it } from 'vitest';

import MapGenerator from './MapGenerator';
import { analyzePathQuality } from './mapPathQuality';

const EXPECTATIONS = {
  easy: {
    buildableMax: 0.64,
    buildableMin: 0.45,
    edgeRatioMax: 0.38,
    minTurns: 6,
  },
  medium: {
    buildableMax: 0.62,
    buildableMin: 0.44,
    edgeRatioMax: 0.35,
    minTurns: 8,
  },
  hard: {
    buildableMax: 0.6,
    buildableMin: 0.42,
    edgeRatioMax: 0.33,
    minTurns: 10,
  },
};

function collectMetrics(width, height, difficulty, seed) {
  const generator = new MapGenerator(width, height, difficulty, seed);
  const result = generator.generateMap();
  const metrics = analyzePathQuality({
    pathNodes: result.pathNodes,
    width,
    height,
    map: result.map,
    targetBuildableRatio: 0.5,
  });

  return { metrics, result };
}

describe('MapGenerator', () => {
  it('generates easy maps that use the interior and leave roughly half the grid buildable', () => {
    const seeds = [11, 29, 47, 73, 97, 131];

    seeds.forEach((seed) => {
      const { metrics, result } = collectMetrics(14, 12, 'easy', seed);
      const expected = EXPECTATIONS.easy;
      const lastNode = result.pathNodes[result.pathNodes.length - 1];

      expect(lastNode).toEqual([result.endPoint.y, result.endPoint.x]);
      expect(metrics.turnCount).toBeGreaterThanOrEqual(expected.minTurns);
      expect(metrics.edgePathRatio).toBeLessThanOrEqual(expected.edgeRatioMax);
      expect(metrics.buildableRatio).toBeGreaterThanOrEqual(expected.buildableMin);
      expect(metrics.buildableRatio).toBeLessThanOrEqual(expected.buildableMax);
      expect(metrics.rowCoverage).toBeGreaterThanOrEqual(0.55);
    });
  });

  it('generates medium maps with strong minor-axis coverage and low edge bias', () => {
    const seeds = [17, 43, 71, 89, 113];

    seeds.forEach((seed) => {
      const { metrics } = collectMetrics(18, 14, 'medium', seed);
      const expected = EXPECTATIONS.medium;

      expect(metrics.turnCount).toBeGreaterThanOrEqual(expected.minTurns);
      expect(metrics.edgePathRatio).toBeLessThanOrEqual(expected.edgeRatioMax);
      expect(metrics.buildableRatio).toBeGreaterThanOrEqual(expected.buildableMin);
      expect(metrics.buildableRatio).toBeLessThanOrEqual(expected.buildableMax);
      expect(Math.min(metrics.rowCoverage, metrics.colCoverage)).toBeGreaterThanOrEqual(0.58);
    });
  });

  it('generates hard maps with long interior-heavy routes instead of perimeter lanes', () => {
    const seeds = [23, 59, 83, 127];

    seeds.forEach((seed) => {
      const { metrics } = collectMetrics(22, 16, 'hard', seed);
      const expected = EXPECTATIONS.hard;

      expect(metrics.turnCount).toBeGreaterThanOrEqual(expected.minTurns);
      expect(metrics.edgePathRatio).toBeLessThanOrEqual(expected.edgeRatioMax);
      expect(metrics.interiorNodeRatio).toBeGreaterThanOrEqual(0.6);
      expect(metrics.buildableRatio).toBeGreaterThanOrEqual(expected.buildableMin);
      expect(metrics.buildableRatio).toBeLessThanOrEqual(expected.buildableMax);
    });
  });
});
