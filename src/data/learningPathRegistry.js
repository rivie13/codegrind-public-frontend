export const LEARNING_NODE_TYPES = {
  ROOT: 'root',
  COURSE: 'course',
  MODULE: 'module',
  LEARN: 'learn',
  WORKSPACE: 'workspace',
  TOWER: 'tower',
  FINAL: 'final',
  CAPSTONE: 'capstone',
};

const COLUMN_CENTER = 2;

/* Complete binary tree positions (heap indexing): level L holds up to 2^L nodes.
   Incomplete levels center their run within the level. Finale modules stack on
   rows beneath the tree. */
const buildModulePositions = (modules) => {
  const positions = new Map();
  const heapIndexes = new Map();
  const treeModules = modules.filter((module) => !module.finale);
  const finaleModules = modules.filter((module) => module.finale);

  const byLevel = new Map();
  treeModules.forEach((module, index) => {
    heapIndexes.set(module.moduleId, index);
    const level = Math.floor(Math.log2(index + 1));
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(module);
  });

  byLevel.forEach((levelModules, level) => {
    const capacity = 2 ** level;
    const offset = (capacity - levelModules.length) / 2;
    levelModules.forEach((module, positionInLevel) => {
      const slot = positionInLevel + offset;
      positions.set(module.moduleId, {
        col: COLUMN_CENTER + (slot - (capacity - 1) / 2),
        row: level + 1,
      });
    });
  });

  const treeRows = treeModules.length ? Math.floor(Math.log2(treeModules.length)) + 1 : 0;
  finaleModules.forEach((module, index) => {
    positions.set(module.moduleId, {
      col: COLUMN_CENTER,
      row: treeRows + index + 1,
    });
  });

  return { positions, heapIndexes };
};

const normalizeModules = (modules, rootPrereqs, nodes, moduleActivityMap, moduleNodeIds) => {
  const { positions: modulePositions, heapIndexes } = buildModulePositions(modules);

  modules.forEach((module) => {
    const modulePrereqs = module.prereqs?.length ? module.prereqs : rootPrereqs;

    nodes.push({
      id: module.moduleId,
      type: LEARNING_NODE_TYPES.MODULE,
      label: module.title,
      description: module.summary,
      prereqs: modulePrereqs,
      position: modulePositions.get(module.moduleId),
      moduleId: module.moduleId,
      heapIndex: heapIndexes.has(module.moduleId) ? heapIndexes.get(module.moduleId) : null,
      finale: Boolean(module.finale),
    });

    moduleNodeIds.push(module.moduleId);
    moduleActivityMap.set(module.moduleId, []);

    (module.tasks || []).forEach((task, index, arr) => {
      const previousTaskId = arr[index - 1]?.taskId;
      const unlockRule = task.unlockRule || null;
      let prereqs = [];

      if (unlockRule?.type === 'node_complete') {
        prereqs = [unlockRule.nodeId];
      } else if (unlockRule?.type === 'module_started') {
        prereqs = modulePrereqs;
      } else if (previousTaskId) {
        prereqs = [previousTaskId];
      } else {
        prereqs = modulePrereqs;
      }

      nodes.push({
        id: task.taskId,
        type: task.kind,
        label: task.title,
        description: task.summary,
        prereqs,
        unlockRule,
        completionCriteria: task.completionCriteria || null,
        content: task.content || null,
        moduleId: module.moduleId,
      });

      moduleActivityMap.get(module.moduleId).push(task.taskId);
    });
  });
};

export const normalizeLearningPath = (pathData) => {
  const rootId = `${pathData.pathId}-root`;
  const nodes = [];
  const moduleActivityMap = new Map();
  const moduleNodeIds = [];

  nodes.push({
    id: rootId,
    type: LEARNING_NODE_TYPES.ROOT,
    label: pathData.title,
    description: pathData.summary,
    prereqs: [],
    position: { col: COLUMN_CENTER, row: 0 },
  });

  normalizeModules(pathData.modules || [], [rootId], nodes, moduleActivityMap, moduleNodeIds);

  const seedCompletedNodeIds = [];

  return {
    ...pathData,
    rootId,
    nodes,
    moduleNodeIds,
    moduleActivityMap,
    courseNodeIds: [],
    courseModuleMap: new Map(),
    seedCompletedNodeIds,
  };
};
