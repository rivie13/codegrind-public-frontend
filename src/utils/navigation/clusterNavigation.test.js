import { describe, expect, it } from 'vitest';
import {
  normalizeClusterNavigation,
  buildClusterNavigationState,
  getClusterBrowsePath,
  getNextClusterSlug,
  resolveBrowseBackTarget,
  TD_CLUSTER_NAVIGATION_STORAGE_KEY,
} from './clusterNavigation';

describe('TD_CLUSTER_NAVIGATION_STORAGE_KEY', () => {
  it('is a non-empty string', () => {
    expect(typeof TD_CLUSTER_NAVIGATION_STORAGE_KEY).toBe('string');
    expect(TD_CLUSTER_NAVIGATION_STORAGE_KEY.length).toBeGreaterThan(0);
  });
});

describe('normalizeClusterNavigation', () => {
  it('returns null for falsy input', () => {
    expect(normalizeClusterNavigation(null)).toBeNull();
    expect(normalizeClusterNavigation(undefined)).toBeNull();
    expect(normalizeClusterNavigation('')).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(normalizeClusterNavigation(42)).toBeNull();
    expect(normalizeClusterNavigation('string')).toBeNull();
  });

  it('returns null when clusterId is missing', () => {
    expect(normalizeClusterNavigation({ clusterId: '', orderedSlugs: ['a', 'b'] })).toBeNull();
  });

  it('returns null when orderedSlugs is empty', () => {
    expect(normalizeClusterNavigation({ clusterId: 'cluster-1', orderedSlugs: [] })).toBeNull();
  });

  it('returns null when orderedSlugs is not an array', () => {
    expect(normalizeClusterNavigation({ clusterId: 'cluster-1', orderedSlugs: 'a,b' })).toBeNull();
  });

  it('normalizes valid input with collectionId', () => {
    const result = normalizeClusterNavigation({
      clusterId: 'cluster-1',
      collectionId: 'col-1',
      orderedSlugs: ['slug-a', 'slug-b', 'slug-c'],
    });
    expect(result).toEqual({
      clusterId: 'cluster-1',
      collectionId: 'col-1',
      orderedSlugs: ['slug-a', 'slug-b', 'slug-c'],
    });
  });

  it('sets collectionId to null when not provided', () => {
    const result = normalizeClusterNavigation({
      clusterId: 'cluster-1',
      orderedSlugs: ['slug-a'],
    });
    expect(result).not.toBeNull();
    expect(result.collectionId).toBeNull();
  });

  it('deduplicates orderedSlugs', () => {
    const result = normalizeClusterNavigation({
      clusterId: 'cluster-1',
      orderedSlugs: ['a', 'b', 'a', 'c', 'b'],
    });
    expect(result.orderedSlugs).toEqual(['a', 'b', 'c']);
  });

  it('trims whitespace from clusterId and slugs', () => {
    const result = normalizeClusterNavigation({
      clusterId: '  cluster-1  ',
      orderedSlugs: ['  slug-a  ', 'slug-b'],
    });
    expect(result.clusterId).toBe('cluster-1');
    expect(result.orderedSlugs).toEqual(['slug-a', 'slug-b']);
  });

  it('filters out empty slugs', () => {
    const result = normalizeClusterNavigation({
      clusterId: 'cluster-1',
      orderedSlugs: ['slug-a', '', '  ', 'slug-b'],
    });
    expect(result.orderedSlugs).toEqual(['slug-a', 'slug-b']);
  });
});

describe('buildClusterNavigationState', () => {
  it('returns null for falsy input', () => {
    expect(buildClusterNavigationState(null)).toBeNull();
    expect(buildClusterNavigationState(undefined)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(buildClusterNavigationState('string')).toBeNull();
  });

  it('builds a valid navigation state from a cluster object', () => {
    const cluster = { id: 'cluster-1', slugs: ['slug-a', 'slug-b'] };
    const result = buildClusterNavigationState(cluster);
    expect(result).toEqual({
      clusterId: 'cluster-1',
      collectionId: null,
      orderedSlugs: ['slug-a', 'slug-b'],
    });
  });

  it('includes collectionId when provided', () => {
    const cluster = { id: 'cluster-1', slugs: ['slug-a'] };
    const result = buildClusterNavigationState(cluster, 'col-5');
    expect(result.collectionId).toBe('col-5');
  });

  it('returns null when cluster has no id', () => {
    expect(buildClusterNavigationState({ slugs: ['slug-a'] })).toBeNull();
  });

  it('returns null when cluster has empty slugs', () => {
    expect(buildClusterNavigationState({ id: 'cluster-1', slugs: [] })).toBeNull();
  });
});

describe('getNextClusterSlug', () => {
  const nav = {
    clusterId: 'cluster-1',
    collectionId: null,
    orderedSlugs: ['alpha', 'beta', 'gamma'],
  };

  it('returns the next slug after the current one', () => {
    expect(getNextClusterSlug(nav, 'alpha')).toBe('beta');
    expect(getNextClusterSlug(nav, 'beta')).toBe('gamma');
  });

  it('returns null when current slug is the last', () => {
    expect(getNextClusterSlug(nav, 'gamma')).toBeNull();
  });

  it('returns null when current slug is not in the list', () => {
    expect(getNextClusterSlug(nav, 'delta')).toBeNull();
  });

  it('returns null for missing clusterNavigation', () => {
    expect(getNextClusterSlug(null, 'alpha')).toBeNull();
    expect(getNextClusterSlug(undefined, 'alpha')).toBeNull();
  });

  it('returns null for missing currentSlug', () => {
    expect(getNextClusterSlug(nav, null)).toBeNull();
    expect(getNextClusterSlug(nav, '')).toBeNull();
  });
});

describe('getClusterBrowsePath', () => {
  it('returns the cluster detail route without a query when no collection is set', () => {
    expect(
      getClusterBrowsePath({
        clusterId: 'cluster-7',
        collectionId: null,
        orderedSlugs: ['alpha'],
      })
    ).toBe('/games/clusters/cluster-7');
  });

  it('includes the collection query when present', () => {
    expect(
      getClusterBrowsePath({
        clusterId: 'cluster-7',
        collectionId: 'codegrind-250',
        orderedSlugs: ['alpha'],
      })
    ).toBe('/games/clusters/cluster-7?collection=codegrind-250');
  });

  it('returns null for invalid cluster navigation', () => {
    expect(getClusterBrowsePath(null)).toBeNull();
  });
});

describe('resolveBrowseBackTarget', () => {
  it('returns the cluster target when cluster navigation is present', () => {
    expect(
      resolveBrowseBackTarget({
        clusterNavigation: {
          clusterId: 'cluster-9',
          collectionId: 'collection-1',
          orderedSlugs: ['alpha'],
        },
        fallbackPath: '/games/tower-defense',
      })
    ).toEqual({
      path: '/games/clusters/cluster-9?collection=collection-1',
      label: 'Back to Clusters',
      isClusterTarget: true,
    });
  });

  it('returns the fallback target when cluster navigation is missing', () => {
    expect(
      resolveBrowseBackTarget({
        clusterNavigation: null,
        fallbackPath: '/games/tower-defense',
      })
    ).toEqual({
      path: '/games/tower-defense',
      label: 'Back to Problem List',
      isClusterTarget: false,
    });
  });

  it('supports custom fallback labels', () => {
    expect(
      resolveBrowseBackTarget({
        fallbackPath: '/ai-problems',
        fallbackLabel: 'Back to AI Problem List',
      })
    ).toEqual({
      path: '/ai-problems',
      label: 'Back to AI Problem List',
      isClusterTarget: false,
    });
  });
});
