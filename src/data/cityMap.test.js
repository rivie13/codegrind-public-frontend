import { describe, expect, it } from 'vitest';
import { getDistrict01Scene } from './cityMap';

describe('District 01 avatar scale config', () => {
  it('uses a smaller avatar scale only for the street scene', () => {
    expect(getDistrict01Scene('docks-street-01').avatar.scale).toBeCloseTo(0.9, 5);
    expect(getDistrict01Scene('apartment-room-01').avatar.scale).toBe(1.2);
  });

  it('uses a 20 percent mobile boost in apartment-style scenes and 15 percent on the street', () => {
    expect(getDistrict01Scene('apartment-room-01').avatar.mobileScaleBoost).toBe(1.2);
    expect(getDistrict01Scene('array-fixer-office-01').avatar.mobileScaleBoost).toBe(1.2);
    expect(getDistrict01Scene('learning-module-guide-01').avatar.mobileScaleBoost).toBe(1.2);
    expect(getDistrict01Scene('packet-bazaar-interior-01').avatar.mobileScaleBoost).toBe(1.2);
    expect(getDistrict01Scene('docks-street-01').avatar.mobileScaleBoost).toBe(1.15);
  });
});
