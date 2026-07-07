import { describe, expect, it } from 'vitest';
import { getNextLearningNode } from './learningPathNavigation';

const createPathData = () => ({
  nodes: [
    { id: 'm1', type: 'module' },
    { id: 'a1', type: 'activity', moduleId: 'm1' },
    { id: 'a2', type: 'activity', moduleId: 'm1' },
    { id: 'm2', type: 'module' },
    { id: 'b1', type: 'activity', moduleId: 'm2' },
  ],
  moduleActivityMap: new Map([
    ['m1', ['a1', 'a2']],
    ['m2', ['b1']],
  ]),
  moduleNodeIds: ['m1', 'm2'],
});

describe('getNextLearningNode', () => {
  it('returns null when required input is missing', () => {
    expect(getNextLearningNode(null, 'a1')).toBeNull();
    expect(getNextLearningNode(createPathData(), null)).toBeNull();
  });

  it('returns the next activity within the current module', () => {
    const next = getNextLearningNode(createPathData(), 'a1');
    expect(next?.id).toBe('a2');
  });

  it('returns first module activity when current module is provided via override', () => {
    const next = getNextLearningNode(createPathData(), 'm1', 'm1');
    expect(next?.id).toBe('a1');
  });

  it('moves to the first activity in the next module', () => {
    const next = getNextLearningNode(createPathData(), 'a2');
    expect(next?.id).toBe('b1');
  });

  it('falls back to next module node when next module has no activities', () => {
    const pathData = createPathData();
    pathData.moduleActivityMap = new Map([
      ['m1', ['a1', 'a2']],
      ['m2', []],
    ]);

    const next = getNextLearningNode(pathData, 'a2');
    expect(next?.id).toBe('m2');
  });

  it('returns null when already at the end of the final module', () => {
    const next = getNextLearningNode(createPathData(), 'b1');
    expect(next).toBeNull();
  });
});
