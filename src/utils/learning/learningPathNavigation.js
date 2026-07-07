export const getNextLearningNode = (pathData, currentNodeId, moduleIdOverride = null) => {
  if (!pathData || !currentNodeId) return null;
  const nodes = pathData.nodes || [];
  const currentNode = nodes.find(node => node.id === currentNodeId) || null;
  const moduleId = moduleIdOverride || currentNode?.moduleId || null;
  if (!moduleId) return null;

  const getNodeById = (nodeId) => nodes.find(node => node.id === nodeId) || null;
  const moduleActivityMap = pathData.moduleActivityMap || new Map();
  const moduleActivityIds = moduleActivityMap.get(moduleId) || [];
  const currentIndex = moduleActivityIds.findIndex(id => id === currentNodeId);

  if (currentIndex >= 0 && currentIndex < moduleActivityIds.length - 1) {
    const nextId = moduleActivityIds[currentIndex + 1];
    if (nextId && nextId !== currentNodeId) return getNodeById(nextId);
  }

  if (currentIndex < 0 && (currentNode?.type === 'module' || currentNode?.type === 'capstone')) {
    const firstActivityId = moduleActivityIds[0];
    return getNodeById(firstActivityId) || getNodeById(moduleId);
  }

  const moduleNodeIds = pathData.moduleNodeIds || [];
  const moduleIndex = moduleNodeIds.findIndex(id => id === moduleId);
  if (moduleIndex < 0) return null;

  const nextModuleId = moduleNodeIds[moduleIndex + 1];
  if (!nextModuleId) return null;

  const nextModuleActivities = moduleActivityMap.get(nextModuleId) || [];
  const nextActivityId = nextModuleActivities[0];
  return getNodeById(nextActivityId) || getNodeById(nextModuleId) || null;
};
