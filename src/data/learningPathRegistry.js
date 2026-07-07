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

const buildCoursePositions = (courses) => {
  const courseById = new Map(courses.map((c) => [c.courseId, c]));
  const levelCache = new Map();

  const getLevel = (courseId) => {
    if (levelCache.has(courseId)) return levelCache.get(courseId);
    const course = courseById.get(courseId);
    if (!course || !course.prereqs?.length) {
      levelCache.set(courseId, 1);
      return 1;
    }
    const prereqLevels = course.prereqs
      .map((pid) => getLevel(pid))
      .filter((l) => Number.isFinite(l));
    const level = prereqLevels.length ? Math.max(...prereqLevels) + 1 : 1;
    levelCache.set(courseId, level);
    return level;
  };

  const levelMap = new Map();
  courses.forEach((c) => {
    const level = getLevel(c.courseId);
    if (!levelMap.has(level)) levelMap.set(level, []);
    levelMap.get(level).push(c);
  });

  const positions = new Map();
  Array.from(levelMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, levelCourses]) => {
      const columns = resolveColumns(levelCourses.length);
      levelCourses.forEach((c, i) => {
        positions.set(c.courseId, { col: columns[i] ?? COLUMN_CENTER, row: level });
      });
    });

  return positions;
};

const normalizeModulesIntoCourse = (
  course,
  coursePrereqs,
  nodes,
  moduleActivityMap,
  moduleNodeIds
) => {
  const modules = [
    ...(course.modules || []),
    course.capstone ? { ...course.capstone, isCapstone: true } : null,
  ].filter(Boolean);

  const modulePositions = buildModulePositions(modules);

  modules.forEach((module) => {
    const modulePrereqs = module.prereqs?.length ? module.prereqs : coursePrereqs;
    const moduleType = module.isCapstone
      ? LEARNING_NODE_TYPES.CAPSTONE
      : LEARNING_NODE_TYPES.MODULE;

    nodes.push({
      id: module.moduleId,
      type: moduleType,
      label: module.title,
      description: module.summary,
      prereqs: modulePrereqs,
      position: modulePositions.get(module.moduleId),
      moduleId: module.moduleId,
      courseId: course.courseId,
    });

    moduleNodeIds.push(module.moduleId);
    moduleActivityMap.set(module.moduleId, []);

    (module.nodes || []).forEach((node, index, arr) => {
      const previousNodeId = arr[index - 1]?.nodeId;
      const unlockRule = node.unlockRule || null;
      let prereqs = [];

      if (unlockRule?.type === 'node_complete') {
        prereqs = [unlockRule.nodeId];
      } else if (unlockRule?.type === 'module_started') {
        prereqs = modulePrereqs;
      } else if (previousNodeId) {
        prereqs = [previousNodeId];
      } else {
        prereqs = modulePrereqs;
      }

      nodes.push({
        id: node.nodeId,
        type: node.type,
        label: node.title,
        description: node.summary,
        prereqs,
        unlockRule,
        completionCriteria: node.completionCriteria || null,
        content: node.content || null,
        moduleId: module.moduleId,
        courseId: course.courseId,
      });

      moduleActivityMap.get(module.moduleId).push(node.nodeId);
    });
  });
};

export const normalizeLearningPath = (pathData) => {
  const rootId = `${pathData.pathId}-root`;
  const nodes = [];
  const moduleActivityMap = new Map();
  const moduleNodeIds = [];
  const courseNodeIds = [];
  const courseModuleMap = new Map();
  const hasCourses = Array.isArray(pathData.courses) && pathData.courses.length > 0;

  nodes.push({
    id: rootId,
    type: LEARNING_NODE_TYPES.ROOT,
    label: pathData.title,
    description: pathData.summary,
    prereqs: [],
    position: { col: COLUMN_CENTER, row: 0 },
  });

  if (hasCourses) {
    const coursePositions = buildCoursePositions(pathData.courses);

    pathData.courses.forEach((course) => {
      const coursePrereqs = course.prereqs?.length ? course.prereqs : [rootId];

      nodes.push({
        id: course.courseId,
        type: LEARNING_NODE_TYPES.COURSE,
        label: course.title,
        description: course.summary,
        prereqs: coursePrereqs,
        position: coursePositions.get(course.courseId),
        courseId: course.courseId,
        isTrial: Boolean(course.isTrial),
        version: course.version,
      });

      courseNodeIds.push(course.courseId);
      courseModuleMap.set(course.courseId, []);

      const modules = [
        ...(course.modules || []),
        course.capstone ? { ...course.capstone, isCapstone: true } : null,
      ].filter(Boolean);
      modules.forEach((m) => courseModuleMap.get(course.courseId).push(m.moduleId));

      normalizeModulesIntoCourse(course, coursePrereqs, nodes, moduleActivityMap, moduleNodeIds);
    });
  } else {
    /* Legacy single-course format: modules + capstone at top level */
    const legacyCourse = {
      courseId: `${pathData.pathId}-default`,
      modules: pathData.modules || [],
      capstone: pathData.capstone || null,
    };
    normalizeModulesIntoCourse(legacyCourse, [rootId], nodes, moduleActivityMap, moduleNodeIds);
  }

  const seedCompletedNodeIds = [];

  return {
    ...pathData,
    rootId,
    nodes,
    moduleNodeIds,
    moduleActivityMap,
    courseNodeIds,
    courseModuleMap,
    seedCompletedNodeIds,
  };
};
