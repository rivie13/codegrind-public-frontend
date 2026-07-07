import { describe, expect, it } from 'vitest';
import { computeCompletion, computeModuleAvailability, getNodeStatus } from './learningPathStatus';

const createPathData = () => ({
  rootId: 'root',
  moduleNodeIds: ['m1', 'm2'],
  moduleActivityMap: new Map([
    ['m1', ['a1', 'a2']],
    ['m2', ['b1']],
  ]),
  nodes: [
    { id: 'root', type: 'root' },
    { id: 'm1', type: 'module', prereqs: ['root'] },
    { id: 'm2', type: 'module', prereqs: ['m1'] },
    { id: 'cap', type: 'capstone', prereqs: ['m2'] },
    { id: 'a1', type: 'activity', prereqs: ['m1'] },
    { id: 'a2', type: 'activity', prereqs: ['a1'] },
    { id: 'b1', type: 'activity', prereqs: ['m2'] },
  ],
});

describe('learningPathStatus', () => {
  it('computes completed modules and completion helpers', () => {
    const pathData = createPathData();
    const completion = computeCompletion(pathData, ['a1', 'a2']);

    expect([...completion.completedModules]).toEqual(['m1']);
    expect(completion.rootCompleted).toBe(false);
    expect(completion.isIdCompleted('root')).toBe(true);
    expect(completion.isIdCompleted('a1')).toBe(true);
    expect(completion.isIdCompleted('m1')).toBe(true);
    expect(completion.isIdCompleted('m2')).toBe(false);
    expect(completion.arePrereqsMet({ prereqs: ['m1'] })).toBe(true);
    expect(completion.arePrereqsMet({ prereqs: ['missing'] })).toBe(false);
  });

  it('marks root as completed only when all modules are complete', () => {
    const pathData = createPathData();
    const completion = computeCompletion(pathData, ['a1', 'a2', 'b1']);

    expect([...completion.completedModules].sort()).toEqual(['m1', 'm2']);
    expect(completion.rootCompleted).toBe(true);
  });

  it('computes module availability based on completion and prerequisites', () => {
    const pathData = createPathData();
    const completion = computeCompletion(pathData, ['a1', 'a2']);
    const availability = computeModuleAvailability(pathData, completion);

    expect(availability.get('m1')).toBe(true);
    expect(availability.get('m2')).toBe(true);
    expect(availability.get('cap')).toBe(false);
  });

  it('returns expected node statuses', () => {
    const pathData = createPathData();
    const completion = computeCompletion(pathData, ['a1', 'a2']);
    const moduleAvailability = computeModuleAvailability(pathData, completion);

    expect(getNodeStatus({ id: 'root', type: 'root' }, completion, moduleAvailability)).toBe(
      'completed'
    );
    expect(getNodeStatus({ id: 'a1', type: 'activity' }, completion, moduleAvailability)).toBe(
      'completed'
    );
    expect(getNodeStatus({ id: 'm2', type: 'module' }, completion, moduleAvailability)).toBe(
      'available'
    );
    expect(
      getNodeStatus(
        { id: 'x', type: 'activity', prereqs: ['missing'] },
        completion,
        moduleAvailability
      )
    ).toBe('locked');
    expect(getNodeStatus(null, completion, moduleAvailability)).toBe('locked');
  });
});
