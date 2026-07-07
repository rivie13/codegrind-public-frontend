const normalizeSlug = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeSlugList = (slugs) => {
  if (!Array.isArray(slugs)) return [];

  const deduped = [];
  const seen = new Set();

  slugs.forEach((slug) => {
    const normalized = normalizeSlug(slug);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    deduped.push(normalized);
  });

  return deduped;
};

export const TD_CLUSTER_NAVIGATION_STORAGE_KEY = 'td_cluster_navigation_state';

export const normalizeClusterNavigation = (rawNavigation) => {
  if (!rawNavigation || typeof rawNavigation !== 'object') return null;

  const clusterId = normalizeSlug(rawNavigation.clusterId);
  const collectionId = normalizeSlug(rawNavigation.collectionId) || null;
  const orderedSlugs = normalizeSlugList(rawNavigation.orderedSlugs);

  if (!clusterId || !orderedSlugs.length) {
    return null;
  }

  return {
    clusterId,
    collectionId,
    orderedSlugs,
  };
};

export const buildClusterNavigationState = (cluster, collectionId = null) => {
  if (!cluster || typeof cluster !== 'object') return null;

  return normalizeClusterNavigation({
    clusterId: cluster.id,
    collectionId,
    orderedSlugs: cluster.slugs,
  });
};

export const getClusterBrowsePath = (clusterNavigation) => {
  const normalized = normalizeClusterNavigation(clusterNavigation);
  if (!normalized) return null;

  const collectionQuery = normalized.collectionId
    ? `?collection=${encodeURIComponent(normalized.collectionId)}`
    : '';

  return `/games/clusters/${normalized.clusterId}${collectionQuery}`;
};

export const resolveBrowseBackTarget = ({
  clusterNavigation,
  fallbackPath = '/problems',
  fallbackLabel = 'Back to Problem List',
  clusterLabel = 'Back to Clusters',
} = {}) => {
  const clusterPath = getClusterBrowsePath(clusterNavigation);

  if (clusterPath) {
    return {
      path: clusterPath,
      label: clusterLabel,
      isClusterTarget: true,
    };
  }

  return {
    path: fallbackPath,
    label: fallbackLabel,
    isClusterTarget: false,
  };
};

export const getNextClusterSlug = (clusterNavigation, currentSlug) => {
  const normalized = normalizeClusterNavigation(clusterNavigation);
  const normalizedCurrentSlug = normalizeSlug(currentSlug);
  if (!normalized || !normalizedCurrentSlug) return null;

  const currentIndex = normalized.orderedSlugs.indexOf(normalizedCurrentSlug);
  if (currentIndex === -1) return null;

  return normalized.orderedSlugs[currentIndex + 1] || null;
};
