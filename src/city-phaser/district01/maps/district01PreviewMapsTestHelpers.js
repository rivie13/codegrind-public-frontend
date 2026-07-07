import {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  canUseDistrict01PreviewInteraction,
  getDistrict01PreviewInteractionAccess,
  getDistrict01PreviewInteraction,
  getDistrict01PreviewMap,
  getDistrict01PreviewMapPoints,
} from '../district01PreviewMaps';

export {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  canUseDistrict01PreviewInteraction,
  getDistrict01PreviewInteractionAccess,
  getDistrict01PreviewInteraction,
  getDistrict01PreviewMap,
  getDistrict01PreviewMapPoints,
};

export const EXTERIOR_ROUTE_BLOCKERS = [
  {
    height: 100,
    kind: 'rect',
    width: 46.5,
    x: 192.5,
    y: 218.5,
  },
  {
    height: 45.75,
    kind: 'rect',
    width: 21.75,
    x: 436.75,
    y: 137.75,
  },
  {
    height: 66.6666666666667,
    kind: 'rect',
    width: 30,
    x: 512,
    y: 128.666666666667,
  },
  {
    height: 8.5,
    kind: 'rect',
    width: 61,
    x: 481,
    y: 196.5,
  },
  {
    height: 57.5,
    kind: 'rect',
    width: 4,
    x: 482,
    y: 196.5,
  },
  {
    height: 40,
    kind: 'rect',
    width: 157,
    x: 482,
    y: 279,
  },
  {
    kind: 'poly',
    points: [
      { x: 288, y: 174.5 },
      { x: 225.5, y: 174.5 },
      { x: 225.5, y: 18 },
      { x: 463.5, y: 18.5 },
      { x: 463, y: 128 },
      { x: 401, y: 126.5 },
      { x: 398, y: 113.5 },
      { x: 387, y: 113.5 },
      { x: 387, y: 142 },
      { x: 381, y: 150.5 },
      { x: 357.5, y: 150.5 },
      { x: 357.5, y: 170 },
      { x: 330.5, y: 169 },
      { x: 331, y: 150.5 },
      { x: 305.5, y: 149.5 },
      { x: 300, y: 141.5 },
      { x: 299, y: 112.5 },
      { x: 288, y: 112.5 },
    ],
  },
];

export const TEST_OBJECT_ANCHORS = {
  DISTRICT_01_BURGER_TRUCK_ORDER: {
    x: 51.6666666666667,
    y: 316.333333333333,
  },
  DISTRICT_01_BURGR_TRUCK_HANGOUT: {
    x: 76.3333333333333,
    y: 222.333333333333,
  },
  DISTRICT_01_CROSSWALK_02_LEFT: {
    x: 112.666666666667,
    y: 362,
  },
  DISTRICT_01_CROSSWALK_02_RIGHT: {
    x: 176.333333333333,
    y: 362.333333333333,
  },
  DISTRICT_01_CROSSWALK_LEFT: {
    x: 104,
    y: 74.3333333333333,
  },
  DISTRICT_01_CROSSWALK_RIGHT: {
    x: 175.666666666667,
    y: 75,
  },
  DISTRICT_01_EXPLORE_01: {
    x: 552.666666666667,
    y: 349,
  },
  DISTRICT_01_EXPLORE_02: {
    x: 527.333333333333,
    y: 58,
  },
  DISTRICT_01_EXPLORE_03: {
    x: 238.333333333333,
    y: 347.333333333333,
  },
  DISTRICT_01_EXPLORE_04: {
    x: 384,
    y: 164.333333333333,
  },
  DISTRICT_01_EXPLORE_05: {
    x: 325.333333333333,
    y: 258.666666666667,
  },
  DISTRICT_01_NPC_ENTER_APARTMENT: {
    x: 517.666666666667,
    y: 254.333333333333,
  },
  DISTRICT_01_NPC_ENTER_STORE: {
    x: 256.666666666667,
    y: 195.666666666667,
  },
  DATA_PACKET_STORE_DOOR_PLACEMENT: {
    x: 256.1818181818182,
    y: 175.09090909090872,
  },
  PLAYER_APARTMENT_BUILDING_ENTRANCE: {
    x: 527,
    y: 276,
  },
};

export const normalizeRouteTarget = (point) => {
  if (!point || typeof point !== 'object') {
    return null;
  }

  if (point.target && typeof point.target === 'object') {
    return point.target;
  }

  return point;
};

export const resolveRoutePointPosition = (point) => {
  const target = normalizeRouteTarget(point);

  if (!target || typeof target !== 'object') {
    return null;
  }

  if (typeof target.x === 'number' && typeof target.y === 'number') {
    return {
      x: target.x,
      y: target.y,
    };
  }

  const anchor = TEST_OBJECT_ANCHORS[target.objectName];

  if (!anchor) {
    return null;
  }

  return {
    x: anchor.x + Number(target.offsetX ?? 0),
    y: anchor.y + Number(target.offsetY ?? 0),
  };
};

export const isPointInsideRouteBlocker = (point, blocker) => {
  if (blocker.kind === 'rect') {
    return (
      point.x > blocker.x &&
      point.x < blocker.x + blocker.width &&
      point.y > blocker.y &&
      point.y < blocker.y + blocker.height
    );
  }

  let inside = false;
  const { points } = blocker;

  for (
    let index = 0, previous = points.length - 1;
    index < points.length;
    previous = index, index += 1
  ) {
    const currentPoint = points[index];
    const previousPoint = points[previous];
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};
