import { describe, expect, it } from 'vitest';

import { LEARNING_NODE_TYPES, normalizeLearningPath } from './learningPathRegistry';

const basePath = {
  pathId: 'python',
  title: 'Python Path',
  summary: 'Learn Python',
};

describe('learningPathRegistry.normalizeLearningPath', () => {
  it('places same-level modules across expected columns for different counts', () => {
    const expectedColumns = new Map([
      [1, [2]],
      [2, [1, 3]],
      [3, [1, 2, 3]],
      [4, [0, 1, 3, 4]],
      [5, [0, 1, 2, 3, 4]],
    ]);

    for (const [count, columns] of expectedColumns.entries()) {
      const modules = Array.from({ length: count }, (_, index) => ({
        moduleId: `m-${count}-${index + 1}`,
        title: `Module ${index + 1}`,
        summary: 'module',
        prereqs: [],
        tasks: [],
      }));

      const normalized = normalizeLearningPath({
        ...basePath,
        pathId: `path-${count}`,
        modules,
      });

      const moduleNodes = normalized.nodes
        .filter((node) => node.type === LEARNING_NODE_TYPES.MODULE)
        .sort((a, b) => a.id.localeCompare(b.id));

      expect(moduleNodes.map((node) => node.position.col)).toEqual(columns);
      expect(moduleNodes.every((node) => node.position.row === 1)).toBe(true);
      expect(normalized.rootId).toBe(`path-${count}-root`);
      expect(normalized.courseNodeIds).toEqual([]);
    }
  });

  it('derives module depth from prerequisites recursively', () => {
    const normalized = normalizeLearningPath({
      ...basePath,
      pathId: 'dependency',
      modules: [
        { moduleId: 'm1', title: 'M1', summary: '', prereqs: [], tasks: [] },
        { moduleId: 'm2', title: 'M2', summary: '', prereqs: ['m1'], tasks: [] },
        { moduleId: 'm3', title: 'M3', summary: '', prereqs: ['m1'], tasks: [] },
        { moduleId: 'm4', title: 'M4', summary: '', prereqs: ['m2', 'm3'], tasks: [] },
      ],
    });

    const byId = new Map(normalized.nodes.map((node) => [node.id, node]));

    expect(byId.get('m1').position.row).toBe(1);
    expect(byId.get('m2').position.row).toBe(2);
    expect(byId.get('m3').position.row).toBe(2);
    expect(byId.get('m4').position.row).toBe(3);
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
