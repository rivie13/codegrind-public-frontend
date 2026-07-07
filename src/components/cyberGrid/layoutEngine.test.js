import { describe, expect, it } from 'vitest';
import { CLUSTER_DIFFICULTY } from '../../data/interviewTopicClusters';
import { computeLayout } from './layoutEngine';

function makeClusters() {
  const make = (prefix, difficulty, count) =>
    Array.from({ length: count }, (_, index) => ({
      id: `${prefix}-${index + 1}`,
      difficulty,
    }));

  return [
    ...make('beg', CLUSTER_DIFFICULTY.BEGINNER, 8),
    ...make('int', CLUSTER_DIFFICULTY.INTERMEDIATE, 7),
    ...make('adv', CLUSTER_DIFFICULTY.ADVANCED, 6),
  ];
}

describe('layoutEngine', () => {
  it('computes deterministic layouts for every strategy mapping', () => {
    const clusters = makeClusters();
    const strategyIds = ['codegrind-core', 'codegrind-blind-75', 'codegrind-150', 'codegrind-250'];

    for (const collectionId of strategyIds) {
      const layout = computeLayout(clusters, 1280, collectionId);
      expect(layout.nodes).toHaveLength(clusters.length);
      expect(layout.tiers).toHaveLength(3);
      expect(layout.totalHeight).toBeGreaterThan(0);
      expect(layout.edges.length).toBeGreaterThan(0);
      expect(layout.nodes.every((node) => Number.isFinite(node.centerX))).toBe(true);
      expect(layout.nodes.every((node) => Number.isFinite(node.centerY))).toBe(true);
    }
  });

  it('falls back to grid for unknown collections and supports sparse tiers', () => {
    const sparse = [
      { id: 'solo-a', difficulty: CLUSTER_DIFFICULTY.BEGINNER },
      { id: 'solo-b', difficulty: CLUSTER_DIFFICULTY.BEGINNER },
    ];

    const layout = computeLayout(sparse, 900, 'unknown-collection');

    expect(layout.nodes).toHaveLength(2);
    expect(layout.tiers).toHaveLength(1);
    expect(layout.edges.length).toBeGreaterThan(0);
    expect(layout.cols).toBeGreaterThan(0);
  });

  it('returns empty node/edge sets when no clusters exist', () => {
    const layout = computeLayout([], 800, 'codegrind-core');

    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.tiers).toEqual([]);
    expect(layout.totalHeight).toBeGreaterThan(0);
  });
});
