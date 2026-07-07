import { api } from '../../services/api';

const buildCompletionAliasMap = (pathData) => {
  const aliasMap = new Map();
  if (!pathData?.nodes?.length) return aliasMap;

  pathData.nodes.forEach((node) => {
    if (!node?.id) return;
    const nodeId = String(node.id);
    aliasMap.set(nodeId, nodeId);

    const learningSlug = node.content?.learningProblemSlug;
    if (learningSlug) aliasMap.set(String(learningSlug), nodeId);

    const towerConfig = node.content?.towerConfig || null;
    if (towerConfig?.learningProblemSlug) {
      aliasMap.set(String(towerConfig.learningProblemSlug), nodeId);
    }

    const towerSlugs = Array.isArray(towerConfig?.learningProblemSlugs)
      ? towerConfig.learningProblemSlugs
      : [];
    towerSlugs.forEach((slug) => {
      if (slug) aliasMap.set(String(slug), nodeId);
    });

    if (towerConfig?.onboardingId) {
      aliasMap.set(String(towerConfig.onboardingId), nodeId);
    }
  });

  return aliasMap;
};

const normalizeCompletedNodes = (pathData, seedIds = [], stored = []) => {
  const aliasMap = buildCompletionAliasMap(pathData);
  const nodeIdSet = new Set(pathData?.nodes?.map((node) => String(node?.id)).filter(Boolean) || []);
  const normalized = [];

  [...seedIds, ...stored].forEach((rawId) => {
    if (!rawId) return;
    const id = String(rawId);
    if (nodeIdSet.has(id)) {
      normalized.push(id);
      return;
    }
    const mapped = aliasMap.get(id);
    if (mapped) {
      normalized.push(mapped);
    }
  });

  return new Set(normalized);
};

export const buildGuestLearningCompletedNodes = ({
  pathData,
  seedIds = [],
  solvedSlugs = [],
  guestNodeIds = [],
} = {}) => {
  if (!pathData) {
    return new Set([...(seedIds || []), ...(guestNodeIds || [])].map(String));
  }

  return normalizeCompletedNodes(pathData, seedIds, [
    ...(Array.isArray(guestNodeIds) ? guestNodeIds : []),
    ...(Array.isArray(solvedSlugs) ? solvedSlugs : []),
  ]);
};

export const loadLearningPathProgress = async (pathId, seedIds = [], pathData = null) => {
  if (!pathId) return new Set(seedIds.map(String));
  try {
    const response = await api.learningPath.getProgress(pathId);
    const stored = Array.isArray(response?.completedNodeIds) ? response.completedNodeIds : [];
    if (!pathData) return new Set([...seedIds, ...stored].map(String));
    return normalizeCompletedNodes(pathData, seedIds, stored);
  } catch {
    return new Set(seedIds.map(String));
  }
};

export const completeLearningPathNode = async (pathId, nodeId) => {
  if (!pathId || !nodeId) return null;
  try {
    const result = await api.learningPath.completeNode(pathId, nodeId);
    return result;
  } catch (error) {
    if (error?.status === 429) {
      return {
        error: 'rate_limit',
        rateLimit: error?.data?.rateLimit || null,
      };
    }
    return null;
  }
};

export const resetLearningPathProgress = async (pathId) => {
  if (!pathId) return null;
  try {
    return await api.learningPath.resetProgress(pathId);
  } catch {
    return null;
  }
};
