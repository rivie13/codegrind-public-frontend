import { describe, expect, it } from 'vitest';

import { LEARNING_NODE_TYPES, normalizeLearningPath } from './learningPathRegistry';

const basePath = {
  pathId: 'python',
  title: 'Python Path',
  summary: 'Learn Python',
};

describe('learningPathRegistry.normalizeLearningPath', () => {
  it('places modules in heap order regardless of count', () => {
    const modules = Array.from({ length: 7 }, (_, index) => ({
      moduleId: `m-${index + 1}`,
      title: `Module ${index + 1}`,
      summary: 'module',
      prereqs: [],
      tasks: [],
    }));

    const normalized = normalizeLearningPath({
      ...basePath,
      pathId: 'heap',
      modules,
    });

    const byId = new Map(normalized.nodes.map((node) => [node.id, node]));
    expect(byId.get('m-1').position).toEqual({ col: 2, row: 1 });
    expect(byId.get('m-2').position).toEqual({ col: 1.5, row: 2 });
    expect(byId.get('m-3').position).toEqual({ col: 2.5, row: 2 });
    expect([
      byId.get('m-4').position,
      byId.get('m-5').position,
      byId.get('m-6').position,
      byId.get('m-7').position,
    ]).toEqual([
      { col: 0.5, row: 3 },
      { col: 1.5, row: 3 },
      { col: 2.5, row: 3 },
      { col: 3.5, row: 3 },
    ]);
    expect(normalized.rootId).toBe('heap-root');
  });

  it('stacks finale modules on rows beneath the tree', () => {
    const normalized = normalizeLearningPath({
      ...basePath,
      pathId: 'finale',
      modules: [
        { moduleId: 'm1', title: 'M1', summary: '', prereqs: [], tasks: [] },
        { moduleId: 'm2', title: 'M2', summary: '', prereqs: ['m1'], tasks: [] },
        { moduleId: 'm3', title: 'M3', summary: '', prereqs: ['m1'], tasks: [] },
        {
          moduleId: 'fin1',
          title: 'F1',
          summary: '',
          prereqs: ['m2', 'm3'],
          tasks: [],
          finale: true,
        },
        {
          moduleId: 'fin2',
          title: 'F2',
          summary: '',
          prereqs: ['m2', 'm3', 'fin1'],
          tasks: [],
          finale: true,
        },
      ],
    });

    const byId = new Map(normalized.nodes.map((node) => [node.id, node]));

    expect(byId.get('m1').position).toEqual({ col: 2, row: 1 });
    expect(byId.get('m2').position).toEqual({ col: 1.5, row: 2 });
    expect(byId.get('m3').position).toEqual({ col: 2.5, row: 2 });
    expect(byId.get('fin1').position).toEqual({ col: 2, row: 3 });
    expect(byId.get('fin2').position).toEqual({ col: 2, row: 4 });
  });

  it('centers incomplete levels and tags heap indexes', () => {
    const modules = Array.from({ length: 6 }, (_, index) => ({
      moduleId: `l3-${index + 1}`,
      title: `L3 ${index + 1}`,
      summary: '',
      prereqs: [],
      tasks: [],
    }));
    // Pad to reach a 6-filled level-3: root + L1 pair + L2 quartet first.
    const prefix = Array.from({ length: 7 }, (_, index) => ({
      moduleId: `pre-${index + 1}`,
      title: `Pre ${index + 1}`,
      summary: '',
      prereqs: [],
      tasks: [],
    }));

    const normalized = normalizeLearningPath({
      ...basePath,
      pathId: 'partial',
      modules: [...prefix, ...modules],
    });

    const byId = new Map(normalized.nodes.map((node) => [node.id, node]));
    const cols = modules.map((module) => byId.get(module.moduleId).position.col);
    expect(cols).toEqual([-0.5, 0.5, 1.5, 2.5, 3.5, 4.5]);
    expect(modules.every((module) => byId.get(module.moduleId).position.row === 4)).toBe(true);
    expect(modules.map((module, index) => byId.get(module.moduleId).heapIndex)).toEqual([
      7, 8, 9, 10, 11, 12,
    ]);
  });

  it('builds activity task prerequisites from unlock rules and sequence', () => {
    const normalized = normalizeLearningPath({
      ...basePath,
      pathId: 'nodes',
      modules: [
        {
          moduleId: 'core',
          title: 'Core',
          summary: '',
          prereqs: [],
          tasks: [
            { taskId: 'n1', title: 'N1', summary: '', kind: LEARNING_NODE_TYPES.LEARN },
            { taskId: 'n2', title: 'N2', summary: '', kind: LEARNING_NODE_TYPES.WORKSPACE },
            {
              taskId: 'n3',
              title: 'N3',
              summary: '',
              kind: LEARNING_NODE_TYPES.TOWER,
              unlockRule: { type: 'node_complete', nodeId: 'checkpoint' },
            },
            {
              taskId: 'n4',
              title: 'N4',
              summary: '',
              kind: LEARNING_NODE_TYPES.FINAL,
              unlockRule: { type: 'module_started' },
            },
          ],
        },
      ],
    });

    const rootId = normalized.rootId;
    const byId = new Map(normalized.nodes.map((node) => [node.id, node]));

    expect(byId.get('core').prereqs).toEqual([rootId]);
    expect(byId.get('n1').prereqs).toEqual([rootId]);
    expect(byId.get('n2').prereqs).toEqual(['n1']);
    expect(byId.get('n3').prereqs).toEqual(['checkpoint']);
    expect(byId.get('n4').prereqs).toEqual([rootId]);
    expect(normalized.moduleActivityMap.get('core')).toEqual(['n1', 'n2', 'n3', 'n4']);
    expect(normalized.seedCompletedNodeIds).toEqual([]);
  });
});
