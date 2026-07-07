import { describe, expect, it } from 'vitest';
import {
  getSceneCoverFrame,
  projectScenePositionToStagePercent,
  projectStagePositionToScenePercent,
} from './sceneProjection';

describe('sceneProjection', () => {
  it('maps portrait stage taps into the underlying 3:2 scene art coordinates', () => {
    const frame = getSceneCoverFrame({ width: 393, height: 852 });

    expect(frame).toMatchObject({
      stageWidth: 393,
      stageHeight: 852,
    });

    const projected = projectStagePositionToScenePercent(
      { x: 90, y: 76 },
      { width: 393, height: 852 }
    );

    expect(projected.x).toBeCloseTo(62.3, 1);
    expect(projected.y).toBeCloseTo(76, 2);
  });

  it('maps scene coordinates back into the visible desktop stage area', () => {
    const projected = projectScenePositionToStagePercent(
      { x: 57, y: 90 },
      { width: 1280, height: 720 }
    );

    expect(projected.x).toBeCloseTo(57, 2);
    expect(projected.y).toBeCloseTo(97.41, 2);
  });
});
