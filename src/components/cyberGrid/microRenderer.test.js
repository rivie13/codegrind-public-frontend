import { describe, expect, it } from 'vitest';
import { computeMicroLayout, microHitTest, renderMicroView } from './microRenderer';
import { createMockCanvasContext } from '../../tests/helpers/mockCanvasContext';

function computeVariant(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return Math.abs(h) % 6;
}

function buildVariantSlugs() {
  const found = new Map();

  for (let i = 0; i < 10_000 && found.size < 6; i += 1) {
    const slug = `shape-${i}`;
    const variant = computeVariant(slug);
    if (!found.has(variant)) found.set(variant, slug);
  }

  return Array.from({ length: 6 }, (_, variant) => found.get(variant));
}

function buildClusterAndMeta() {
  const slugs = buildVariantSlugs();
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const problemMetas = slugs.map((slug, index) => ({
    slug,
    title: `Problem ${index + 1}`,
    difficulty: difficulties[index % difficulties.length],
  }));

  const cluster = {
    id: 'micro-render-cluster',
    shortTitle: 'Micro Cluster',
    accent: '#00FFFF',
    slugs,
  };

  return { cluster, problemMetas, slugs };
}

describe('microRenderer', () => {
  it('computes deterministic micro layout with spanning edges', () => {
    const { cluster, problemMetas } = buildClusterAndMeta();

    const first = computeMicroLayout(cluster, problemMetas, 980, 660);
    const second = computeMicroLayout(cluster, problemMetas, 980, 660);

    expect(first.nodes).toHaveLength(cluster.slugs.length);
    expect(first.edges).toHaveLength(Math.max(0, cluster.slugs.length - 1));
    expect(second.nodes).toEqual(first.nodes);
    expect(second.edges).toEqual(first.edges);
  });

  it('hit tests rendered micro nodes', () => {
    const { cluster, problemMetas } = buildClusterAndMeta();
    const layout = computeMicroLayout(cluster, problemMetas, 980, 660);
    const node = layout.nodes[0];

    expect(microHitTest(node.x + 4, node.y + 4, cluster, problemMetas, 980, 660)).toEqual({
      slug: node.slug,
      index: node.index,
    });
    expect(microHitTest(2, 2, cluster, problemMetas, 980, 660)).toBeNull();
  });

  it('renders across auth and trial states, including banners and locks', () => {
    const ctx = createMockCanvasContext();
    const { cluster, problemMetas, slugs } = buildClusterAndMeta();

    renderMicroView(
      ctx,
      980,
      660,
      cluster,
      problemMetas,
      new Set([slugs[0], slugs[2]]),
      slugs[1],
      1.1,
      true,
      { isTrial: false }
    );

    renderMicroView(
      ctx,
      980,
      660,
      cluster,
      problemMetas,
      new Set([slugs[0], slugs[3]]),
      null,
      2.1,
      false,
      { isTrial: false }
    );

    renderMicroView(ctx, 980, 660, cluster, problemMetas, new Set([slugs[0]]), null, 3.1, false, {
      isTrial: true,
    });

    renderMicroView(
      ctx,
      980,
      660,
      cluster,
      problemMetas,
      new Set([slugs[0], slugs[1], slugs[2]]),
      null,
      4.1,
      false,
      { isTrial: true }
    );

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('FREE PROBLEMS'))).toBe(true);
    expect(labels.some((text) => text.includes('SIGN UP TO UNLOCK ALL PROBLEMS'))).toBe(true);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
  });
});
