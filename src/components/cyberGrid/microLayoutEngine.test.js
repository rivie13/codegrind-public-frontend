import { describe, expect, it } from 'vitest';
import { CELL_WS, PROBLEM_NODE_WS, computeChipInteriorLayout } from './microLayoutEngine';

describe('microLayoutEngine', () => {
  it('computes interior nodes and sequential edges for cluster slugs', () => {
    const cluster = {
      accent: '#00FFFF',
      slugs: ['two-sum', 'valid-anagram', 'group-anagrams', 'top-k-frequent-elements'],
    };

    const layout = computeChipInteriorLayout(cluster, 100, 80, 80, [
      { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy' },
      { slug: 'valid-anagram', title: 'Valid Anagram', difficulty: 'Easy' },
    ]);

    expect(layout.nodes).toHaveLength(cluster.slugs.length);
    expect(layout.edges).toHaveLength(cluster.slugs.length - 1);
    expect(layout.cols).toBeGreaterThanOrEqual(2);

    const first = layout.nodes[0];
    expect(first.w).toBe(PROBLEM_NODE_WS);
    expect(first.h).toBe(PROBLEM_NODE_WS);
    expect(first.centerX).toBeCloseTo(first.x + PROBLEM_NODE_WS / 2, 5);
    expect(first.centerY).toBeCloseTo(first.y + PROBLEM_NODE_WS / 2, 5);
  });

  it('uses serpentine ordering and title fallback', () => {
    const cluster = {
      accent: '#00FF8C',
      slugs: ['alpha-node', 'beta-node', 'gamma-node', 'delta-node', 'epsilon-node', 'zeta-node'],
    };

    const layout = computeChipInteriorLayout(cluster, 0, 0, 80, []);
    const row0 = layout.nodes.slice(0, layout.cols);
    const row1 = layout.nodes.slice(layout.cols, layout.cols * 2);

    if (row0.length > 1 && row1.length > 1) {
      const row0Direction = row0[row0.length - 1].x - row0[0].x;
      const row1Direction = row1[row1.length - 1].x - row1[0].x;
      expect(Math.sign(row0Direction)).not.toBe(Math.sign(row1Direction));
    }

    expect(layout.nodes.some((n) => n.title === 'Alpha Node')).toBe(true);
    expect(layout.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });

  it('respects world-space spacing constants', () => {
    const cluster = {
      accent: '#FF6B6B',
      slugs: ['a', 'b', 'c', 'd'],
    };

    const layout = computeChipInteriorLayout(cluster, 50, 50, 80, []);

    if (layout.nodes.length > 1) {
      const dx = Math.abs(layout.nodes[1].x - layout.nodes[0].x);
      expect(dx === 0 || dx === CELL_WS).toBe(true);
    }
  });
});
