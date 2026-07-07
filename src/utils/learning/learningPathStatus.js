export const computeCompletion = (pathData, completedNodesSet) => {
  const completedNodes = new Set(completedNodesSet || []);
  const moduleActivityMap = pathData?.moduleActivityMap || new Map();
  const moduleNodeIds = pathData?.moduleNodeIds || [];
  const courseModuleMap = pathData?.courseModuleMap || new Map();
  const courseNodeIds = pathData?.courseNodeIds || [];
  const completedModules = new Set();
  const completedCourses = new Set();

  moduleActivityMap.forEach((nodeIds, moduleId) => {
    if (!nodeIds?.length) return;
    const isComplete = nodeIds.every((nodeId) => completedNodes.has(nodeId));
    if (isComplete) completedModules.add(moduleId);
  });

  courseModuleMap.forEach((modIds, courseId) => {
    if (!modIds?.length) return;
    const isComplete = modIds.every((mId) => completedModules.has(mId));
    if (isComplete) completedCourses.add(courseId);
  });

  const rootCompleted = courseNodeIds.length
    ? courseNodeIds.every((cId) => completedCourses.has(cId))
    : moduleNodeIds.length
      ? moduleNodeIds.every((moduleId) => completedModules.has(moduleId))
      : false;

  const isIdCompleted = (id) => {
    if (!id) return false;
    if (id === pathData?.rootId) return true;
    if (completedNodes.has(id)) return true;
    if (completedModules.has(id)) return true;
    if (completedCourses.has(id)) return true;
    return false;
  };

  const arePrereqsMet = (node) => {
    if (!node?.prereqs?.length) return true;
    return node.prereqs.every((prereqId) => isIdCompleted(prereqId));
  };

  return {
    completedNodes,
    completedModules,
    completedCourses,
    rootCompleted,
    isIdCompleted,
    arePrereqsMet,
  };
};

export const computeModuleAvailability = (pathData, completion) => {
  const availability = new Map();
  const nodes = pathData?.nodes || [];

  nodes.forEach((node) => {
    if (node.type !== 'course' && node.type !== 'module' && node.type !== 'capstone') return;
    const isAvailable = completion.isIdCompleted(node.id) || completion.arePrereqsMet(node);
    availability.set(node.id, isAvailable);
  });

  return availability;
};

export const getNodeStatus = (node, completion, moduleAvailability) => {
  if (!node) return 'locked';
  if (node.type === 'root') return 'completed';
  if (completion.isIdCompleted(node.id)) return 'completed';

  if (node.type === 'course' || node.type === 'module' || node.type === 'capstone') {
    return moduleAvailability.get(node.id) ? 'available' : 'locked';
  }

  return completion.arePrereqsMet(node) ? 'available' : 'locked';
};
