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

const buildModuleLevels = (modules) => {
  const moduleById = new Map(modules.map((module) => [module.moduleId, module]));
  const levelCache = new Map();

  const getLevel = (moduleId) => {
    if (levelCache.has(moduleId)) return levelCache.get(moduleId);
    const module = moduleById.get(moduleId);
    if (!module || !module.prereqs?.length) {
      levelCache.set(moduleId, 1);
      return 1;
    }
    const prereqLevels = module.prereqs
      .map((prereqId) => getLevel(prereqId))
      .filter((level) => Number.isFinite(level));
    const level = prereqLevels.length ? Math.max(...prereqLevels) + 1 : 1;
    levelCache.set(moduleId, level);
    return level;
  };

  return { moduleById, getLevel };
};

const resolveColumns = (count) => {
  if (count === 1) return [COLUMN_CENTER];
  if (count === 2) return [COLUMN_CENTER - 1, COLUMN_CENTER + 1];
  if (count === 3) return [COLUMN_CENTER - 1, COLUMN_CENTER, COLUMN_CENTER + 1];
  if (count === 4)
    return [COLUMN_CENTER - 2, COLUMN_CENTER - 1, COLUMN_CENTER + 1, COLUMN_CENTER + 2];
  return Array.from({ length: count }, (_, index) => index);
};

const buildModulePositions = (modules) => {
  const { getLevel } = buildModuleLevels(modules);
  const levelMap = new Map();

  modules.forEach((module) => {
    const level = getLevel(module.moduleId);
    if (!levelMap.has(level)) levelMap.set(level, []);
    levelMap.get(level).push(module);
  });

  const positions = new Map();
  Array.from(levelMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, levelModules]) => {
      const columns = resolveColumns(levelModules.length);
      levelModules.forEach((module, index) => {
        positions.set(module.moduleId, {
          col: columns[index] ?? COLUMN_CENTER,
          row: level,
        });
      });
    });

  return positions;
};

const normalizeModules = (modules, rootPrereqs, nodes, moduleActivityMap, moduleNodeIds) => {
  const modulePositions = buildModulePositions(modules);

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
